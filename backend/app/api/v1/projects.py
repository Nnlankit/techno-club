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
    ProjectMemberResponse, ProjectMemberAdd
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project)
    user_role = current_user.role.name if current_user.role else "Member"

    # Role-based query isolation
    if user_role in ["Domain Head", "Technical Lead"]:
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if user_domain_id:
            query = query.filter(Project.domain_id == user_domain_id)
        elif domain_id:
            query = query.filter(Project.domain_id == domain_id)
    elif user_role == "Member":
        user_member_id = current_user.member.id if current_user.member else 0
        from app.models.project_task import ProjectMember
        member_proj_ids = [pm.project_id for pm in db.query(ProjectMember).filter(ProjectMember.member_id == user_member_id).all()]
        query = query.filter(Project.id.in_(member_proj_ids) if member_proj_ids else False)
    else:
        # President, Vice President, Faculty Coordinator have club-wide project visibility
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
def get_project_by_id(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    user_role = current_user.role.name if current_user.role else "Member"
    if user_role in ["Domain Head", "Technical Lead"]:
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if user_domain_id and proj.domain_id != user_domain_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access project belonging to another domain."
            )
    elif user_role == "Member":
        user_member_id = current_user.member.id if current_user.member else 0
        is_member = any(pm.member_id == user_member_id for pm in proj.members)
        if not is_member and proj.project_lead_id != user_member_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned to this project."
            )

    return build_project_response(proj, db)


@router.post("/", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Technical Lead"]))
):
    user_role = current_user.role.name if current_user.role else "Member"
    user_domain_id = current_user.member.domain_id if current_user.member else None

    if user_role in ["Domain Head", "Technical Lead"]:
        if user_domain_id and payload.domain_id and payload.domain_id != user_domain_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Domain Heads can only create projects in their own domain."
            )
        if not payload.domain_id and user_domain_id:
            payload.domain_id = user_domain_id
    start_date = payload.start_date or datetime.now(timezone.utc)
    new_proj = Project(
        name=payload.name,
        description=payload.description,
        objective=payload.objective,
        domain_id=payload.domain_id,
        secondary_domains=json.dumps(payload.secondary_domains or []),
        project_lead_id=payload.project_lead_id,
        start_date=start_date,
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

    # Only add team members if explicitly specified
    for mid in (payload.team_member_ids or []):
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

    user_role = current_user.role.name if current_user.role else "Member"
    user_member_id = current_user.member.id if current_user.member else 0

    # President, Vice President, Super Admin have universal edit access
    if user_role not in ["Super Admin", "President", "Vice President"]:
        if user_role in ["Domain Head", "Technical Lead"]:
            user_domain_id = current_user.member.domain_id if current_user.member else None
            if not user_domain_id or proj.domain_id != user_domain_id:
                raise HTTPException(status_code=403, detail="Forbidden: You can only edit projects in your domain.")
        elif proj.project_lead_id != user_member_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to edit this project.")

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
    payload: Optional[ProjectMemberAdd] = None,
    member_id: Optional[int] = Query(None),
    role_in_project: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    user_role = current_user.role.name if current_user.role else "Member"
    user_member_id = current_user.member.id if current_user.member else 0

    # President, Vice President, Super Admin have universal member management access
    if user_role not in ["Super Admin", "President", "Vice President"]:
        if user_role in ["Domain Head", "Technical Lead"]:
            user_domain_id = current_user.member.domain_id if current_user.member else None
            if not user_domain_id or proj.domain_id != user_domain_id:
                raise HTTPException(status_code=403, detail="Forbidden: You can only manage members in your domain.")
        elif proj.project_lead_id != user_member_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to manage members for this project.")

    target_member_id = payload.member_id if (payload and payload.member_id) else member_id
    if not target_member_id:
        raise HTTPException(status_code=400, detail="member_id is required")

    target_member = db.query(Member).filter(Member.id == target_member_id).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    target_role = (payload.role_in_project if (payload and payload.role_in_project) else role_in_project) or "Contributor"

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.member_id == target_member_id
    ).first()
    if existing:
        existing.role_in_project = target_role
    else:
        pm = ProjectMember(
            project_id=project_id,
            member_id=target_member_id,
            role_in_project=target_role
        )
        db.add(pm)

    log_audit_event(
        db, current_user, "UPDATE", "Project", proj.id,
        f"{current_user.email} added {target_member.full_name} as '{target_role}' to Project '{proj.name}'"
    )

    db.commit()
    db.refresh(proj)
    return build_project_response(proj, db)


@router.delete("/{project_id}/members/{member_id}", response_model=ProjectResponse)
def remove_project_member(
    project_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    user_role = current_user.role.name if current_user.role else "Member"
    user_member_id = current_user.member.id if current_user.member else 0

    if user_role not in ["Super Admin", "President", "Vice President"]:
        if user_role in ["Domain Head", "Technical Lead"]:
            user_domain_id = current_user.member.domain_id if current_user.member else None
            if not user_domain_id or proj.domain_id != user_domain_id:
                raise HTTPException(status_code=403, detail="Forbidden: You can only manage members in your domain.")
        elif proj.project_lead_id != user_member_id:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to manage members for this project.")

    pm = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.member_id == member_id
    ).first()
    if pm:
        member_name = pm.member.full_name if pm.member else f"ID {member_id}"
        db.delete(pm)
        log_audit_event(
            db, current_user, "UPDATE", "Project", proj.id,
            f"{current_user.email} removed {member_name} from Project '{proj.name}'"
        )
        db.commit()
        db.refresh(proj)

    return build_project_response(proj, db)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President"]))
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    log_audit_event(
        db, current_user, "DELETE", "Project", proj.id,
        f"{current_user.email} deleted Project '{proj.name}'"
    )
    db.delete(proj)
    db.commit()
    return {"message": f"Project '{proj.name}' successfully deleted"}
