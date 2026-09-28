import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.models.user_role import User, Role
from app.models.member_domain import Member, Domain
from app.models.project_task import ProjectMember, Task
from app.models.event_hackathon import EventRegistration
from app.models.operations import Certificate, Achievement
from app.schemas.member_domain import MemberCreate, MemberUpdate, MemberResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_member_response(m: Member, db: Session) -> MemberResponse:
    skills_list = []
    if m.skills:
        try:
            skills_list = json.loads(m.skills)
        except Exception:
            skills_list = [s.strip() for s in m.skills.split(",") if s.strip()]

    active_projects = db.query(ProjectMember).filter(ProjectMember.member_id == m.id).count()
    completed_tasks = db.query(Task).filter(Task.assignee_id == m.id, Task.status == "Completed").count()
    events_count = db.query(EventRegistration).filter(EventRegistration.member_id == m.id).count()
    achievements_count = db.query(Achievement).filter(Achievement.member_id == m.id).count()

    return MemberResponse(
        id=m.id,
        user_id=m.user_id,
        college_id=m.college_id,
        full_name=m.full_name,
        email=m.email,
        phone=m.phone,
        department=m.department,
        year_semester=m.year_semester,
        domain_id=m.domain_id,
        domain_name=m.domain.name if m.domain else None,
        role_title=m.role_title,
        status=m.status,
        skills=skills_list,
        avatar_url=m.avatar_url,
        bio=m.bio,
        github_url=m.github_url,
        linkedin_url=m.linkedin_url,
        joining_date=m.joining_date,
        created_at=m.created_at,
        updated_at=m.updated_at,
        active_projects_count=active_projects,
        completed_tasks_count=completed_tasks,
        events_participated_count=events_count,
        achievements_count=achievements_count
    )


@router.get("/", response_model=List[MemberResponse])
def get_members(
    domain_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    department: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "full_name",
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Member)

    if domain_id:
        query = query.filter(Member.domain_id == domain_id)
    if status_filter:
        query = query.filter(Member.status == status_filter)
    if department:
        query = query.filter(Member.department == department)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Member.full_name.ilike(search_fmt),
                Member.college_id.ilike(search_fmt),
                Member.email.ilike(search_fmt),
                Member.role_title.ilike(search_fmt),
                Member.department.ilike(search_fmt)
            )
        )

    # Sort
    col = getattr(Member, sort_by, Member.full_name)
    query = query.order_by(desc(col) if sort_order.lower() == "desc" else asc(col))

    members = query.all()
    return [build_member_response(m, db) for m in members]


@router.get("/{member_id}", response_model=MemberResponse)
def get_member_by_id(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return build_member_response(member, db)


@router.post("/", response_model=MemberResponse)
def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    existing_cid = db.query(Member).filter(Member.college_id == payload.college_id).first()
    if existing_cid:
        raise HTTPException(status_code=400, detail="Member with this College ID already exists")

    # Determine role
    role_id = payload.role_id
    if not role_id:
        default_role = db.query(Role).filter(Role.name == "Member").first()
        role_id = default_role.id if default_role else 1

    new_user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password or "TechnoClub@2026"),
        role_id=role_id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_member = Member(
        user_id=new_user.id,
        college_id=payload.college_id,
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone=payload.phone,
        department=payload.department,
        year_semester=payload.year_semester,
        domain_id=payload.domain_id,
        role_title=payload.role_title or "Member",
        status=payload.status or "Active",
        skills=json.dumps(payload.skills or []),
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.full_name.replace(' ', '')}",
        bio=payload.bio,
        github_url=payload.github_url,
        linkedin_url=payload.linkedin_url
    )
    db.add(new_member)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Member", new_member.id,
        f"{current_user.email} registered member {new_member.full_name} ({new_member.college_id})"
    )

    db.commit()
    db.refresh(new_member)
    return build_member_response(new_member, db)


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Access control: user can edit own profile, or leadership can edit
    user_role = current_user.role.name if current_user.role else "Member"
    is_owner = member.user_id == current_user.id
    is_leadership = user_role in ["President", "Vice President", "Domain Head"]

    if not is_owner and not is_leadership:
        raise HTTPException(status_code=403, detail="Not authorized to edit this member profile")

    update_data = payload.model_dump(exclude_unset=True)
    if "skills" in update_data and update_data["skills"] is not None:
        update_data["skills"] = json.dumps(update_data["skills"])

    # Non-leadership cannot change status
    if "status" in update_data and not is_leadership:
        del update_data["status"]

    for k, v in update_data.items():
        setattr(member, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Member", member.id,
        f"Member {member.full_name} updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(member)
    return build_member_response(member, db)


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President"]))
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    user = member.user
    log_audit_event(
        db, current_user, "DELETE", "Member", member.id,
        f"President {current_user.email} removed member {member.full_name} ({member.email})"
    )

    db.delete(member)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Member successfully deleted"}
