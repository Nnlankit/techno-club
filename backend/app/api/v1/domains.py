from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Domain, Member
from app.models.project_task import Project, Task
from app.models.event_hackathon import Event
from app.schemas.member_domain import DomainCreate, DomainUpdate, DomainResponse, MemberResponse
from app.api.v1.members import build_member_response
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_domain_response(d: Domain, db: Session) -> DomainResponse:
    members_count = db.query(Member).filter(Member.domain_id == d.id).count()
    active_projects = db.query(Project).filter(Project.domain_id == d.id, Project.status == "Active").count()
    tasks_count = db.query(Task).filter(Task.domain_id == d.id).count()
    events_count = db.query(Event).filter(Event.domain_id == d.id).count()

    head = db.query(Member).filter(Member.id == d.head_id).first() if d.head_id else None
    co_head = db.query(Member).filter(Member.id == d.co_head_id).first() if d.co_head_id else None

    return DomainResponse(
        id=d.id,
        name=d.name,
        code=d.code,
        description=d.description,
        icon=d.icon,
        color=d.color,
        is_active=d.is_active,
        head_id=d.head_id,
        co_head_id=d.co_head_id,
        head_name=head.full_name if head else None,
        co_head_name=co_head.full_name if co_head else None,
        members_count=members_count,
        active_projects_count=active_projects,
        tasks_count=tasks_count,
        events_count=events_count,
        created_at=d.created_at,
        updated_at=d.updated_at
    )


@router.get("/", response_model=List[DomainResponse])
def get_all_domains(db: Session = Depends(get_db)):
    domains = db.query(Domain).all()
    return [build_domain_response(d, db) for d in domains]


@router.get("/{domain_id}", response_model=DomainResponse)
def get_domain_by_id(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return build_domain_response(domain, db)


@router.get("/{domain_id}/members", response_model=List[MemberResponse])
def get_domain_members(domain_id: int, db: Session = Depends(get_db)):
    members = db.query(Member).filter(Member.domain_id == domain_id).all()
    return [build_member_response(m, db) for m in members]


@router.post("/", response_model=DomainResponse)
def create_domain(
    payload: DomainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President"]))
):
    existing = db.query(Domain).filter(Domain.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain with this name already exists")

    existing_code = db.query(Domain).filter(Domain.code == payload.code.upper()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Domain with this code already exists")

    new_domain = Domain(
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
        head_id=payload.head_id,
        co_head_id=payload.co_head_id,
        icon=payload.icon or "Cpu",
        color=payload.color or "#3B82F6",
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(new_domain)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Domain", new_domain.id,
        f"Domain '{new_domain.name}' ({new_domain.code}) created by {current_user.email}"
    )

    db.commit()
    db.refresh(new_domain)
    return build_domain_response(new_domain, db)


@router.put("/{domain_id}", response_model=DomainResponse)
def update_domain(
    domain_id: int,
    payload: DomainUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President"]))
):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        update_data["code"] = update_data["code"].upper()

    for k, v in update_data.items():
        setattr(domain, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Domain", domain.id,
        f"Domain '{domain.name}' updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(domain)
    return build_domain_response(domain, db)
