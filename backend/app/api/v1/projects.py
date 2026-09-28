import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.project_task import Project, ProjectMember, Task
from app.schemas.project_task import (
    ProjectCreate, ProjectUpdate, ProjectResponse, 
    ProjectMemberResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_project_response(p: Project, db: Session) -> ProjectResponse:
    total_tasks = db.query(Task).filter(Task.project_id == p.id).count()
    completed_tasks = db.query(Task).filter(Task.project_id == p.id, Task.status == "Completed").count()

    members_list = []
    for pm in p.members:
        members_list.append(ProjectMemberResponse(
            id=pm.id,
            member_id=pm.member_id,
            member_name=pm.member.full_name if pm.member else "Unknown",
            member_email=pm.member.email if pm.member else "",
            role_in_project=pm.role_in_project,
            avatar_url=pm.member.avatar_url if pm.member else None
        ))

    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        objective=p.objective,
        domain_id=p.domain_id,
        domain_name=p.domain.name if p.domain else None,
        secondary_domains=json.loads(p.secondary_domains or "[]"),
        project_lead_id=p.project_lead_id,
        lead_name=p.lead.full_name if p.lead else None,
        start_date=p.start_date,
        target_date=p.target_date,
        completed_date=p.completed_date,
        status=p.status,
        priority=p.priority,
        milestones=json.loads(p.milestones or "[]"),
        repository_url=p.repository_url,
        demo_url=p.demo_url,
        documentation_url=p.documentation_url,
        final_report=p.final_report,
        members=members_list,
        total_tasks_count=total_tasks,
        completed_tasks_count=completed_tasks,
        created_at=p.created_at,
        updated_at=p.updated_at
    )


@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(
    domain_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    lead_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if domain_id:
        query = query.filter(Project.domain_id == domain_id)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    if lead_id:
        query = query.filter(Project.project_lead_id == lead_id)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Project.name.ilike(s), Project.description.ilike(s)))

    projects = query.order_by(desc(Project.created_at)).all()
    return [build_project_response(p, db) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return build_project_response(proj, db)


@router.post("/", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Technical Lead"]))
):
    new_proj = Project(
        name=payload.name,
        description=payload.description,
        objective=payload.objective,
        domain_id=payload.domain_id,
        secondary_domains=json.dumps(payload.secondary_domains or []),
        project_lead_id=payload.project_lead_id,
        start_date=payload.start_date,
        target_date=payload.target_date,
        completed_date=payload.completed_date,
        status=payload.status or "Planning",
        priority=payload.priority or "Medium",
        milestones=json.dumps(payload.milestones or []),
        repository_url=payload.repository_url,
        demo_url=payload.demo_url,
        documentation_url=payload.documentation_url,
        final_report=payload.final_report
    )
    db.add(new_proj)
    db.flush()

    # Add project lead to project members
    db.add(ProjectMember(
        project_id=new_proj.id,
        member_id=payload.project_lead_id,
        role_in_project="Project Lead"
    ))

    # Add team members
    for mid in (payload.team_member_ids or []):
        if mid != payload.project_lead_id:
            db.add(ProjectMember(
                project_id=new_proj.id,
                member_id=mid,
                role_in_project="Contributor"
            ))

    log_audit_event(
        db, current_user, "CREATE", "Project", new_proj.id,
        f"{current_user.email} created Project '{new_proj.name}'"
    )

    db.commit()
    db.refresh(new_proj)
    return build_project_response(new_proj, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "secondary_domains" in update_data and update_data["secondary_domains"] is not None:
        update_data["secondary_domains"] = json.dumps(update_data["secondary_domains"])
    if "milestones" in update_data and update_data["milestones"] is not None:
        update_data["milestones"] = json.dumps(update_data["milestones"])

    for k, v in update_data.items():
        setattr(proj, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Project", proj.id,
        f"Project '{proj.name}' updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(proj)
    return build_project_response(proj, db)


@router.post("/{project_id}/members", response_model=ProjectResponse)
def add_project_member(
    project_id: int,
    member_id: int,
    role_in_project: str = "Contributor",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.member_id == member_id
    ).first()
    if existing:
        existing.role_in_project = role_in_project
    else:
        pm = ProjectMember(
            project_id=project_id,
            member_id=member_id,
            role_in_project=role_in_project
        )
        db.add(pm)

    db.commit()
    db.refresh(proj)
    return build_project_response(proj, db)
