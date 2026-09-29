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

    role_name = m.user.role.name if m.user and m.user.role else m.role_title
    reports_to_name = None
    reports_to_role = None
    if m.reports_to_id:
        supervisor = db.query(Member).filter(Member.id == m.reports_to_id).first()
        if supervisor:
            reports_to_name = supervisor.full_name
            reports_to_role = supervisor.user.role.name if supervisor.user and supervisor.user.role else supervisor.role_title

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
        role_name=role_name,
        reports_to_id=m.reports_to_id,
        reports_to_name=reports_to_name,
        reports_to_role=reports_to_role,
        status=m.status,
        skills=skills_list,
        avatar_url=m.avatar_url,
        bio=m.bio,
        github_url=m.github_url,
        linkedin_url=m.linkedin_url,
        joining_date=m.joining_date or m.created_at,
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

    user_role = current_user.role.name if current_user.role else "Member"

    # Domain Head MUST only see members belonging to their domain
    if user_role in ["Domain Head", "Technical Lead"]:
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if user_domain_id:
            query = query.filter(Member.domain_id == user_domain_id)
        elif domain_id:
            query = query.filter(Member.domain_id == domain_id)
    elif user_role == "Member":
        # Member can filter by domain or see their domain colleagues
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if domain_id:
            query = query.filter(Member.domain_id == domain_id)
        elif user_domain_id:
            query = query.filter(Member.domain_id == user_domain_id)
    else:
        # Leadership (President, Vice President, Faculty Coordinator) has club-wide visibility
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

    user_role = current_user.role.name if current_user.role else "Member"
    if user_role in ["Domain Head", "Technical Lead"]:
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if user_domain_id and member.domain_id != user_domain_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access member from an unrelated domain."
            )
    elif user_role == "Member":
        user_member_id = current_user.member.id if current_user.member else None
        user_domain_id = current_user.member.domain_id if current_user.member else None
        if user_domain_id and member.domain_id != user_domain_id and member.id != user_member_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot view details of members from other domains."
            )

    return build_member_response(member, db)


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.services.user_service import create_user_and_member
    new_member = create_user_and_member(payload, current_user, db)
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

    user_role = current_user.role.name if current_user.role else "Member"
    is_owner = member.user_id == current_user.id
    is_leadership = user_role in ["Super Admin", "President", "Vice President", "Domain Head"]

    if not is_owner and not is_leadership:
        raise HTTPException(status_code=403, detail="Not authorized to edit this member profile")

    # Protection: VP cannot edit Super Admin or President accounts
    target_user_role = member.user.role.name if member.user and member.user.role else "Member"
    if user_role == "Vice President" and target_user_role in ["Super Admin", "President"]:
        raise HTTPException(status_code=403, detail=f"Vice President is not authorized to edit {target_user_role} accounts.")
    if user_role == "President" and target_user_role == "Super Admin":
        raise HTTPException(status_code=403, detail="President is not authorized to edit Super Admin accounts.")

    update_data = payload.model_dump(exclude_unset=True)

    # Email uniqueness check if changing email
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"]
        if new_email != member.email:
            existing_user = db.query(User).filter(User.email == new_email).first()
            if existing_user and existing_user.id != member.user_id:
                raise HTTPException(status_code=400, detail="A user with this email already exists.")
            member.email = new_email
            if member.user:
                member.user.email = new_email

    # Role modification checks
    target_role_name = update_data.pop("role", None)
    target_role_id = update_data.pop("role_id", None)
    if target_role_name or target_role_id:
        if not is_leadership or user_role in ["Domain Head", "Technical Lead", "Member"]:
            raise HTTPException(status_code=403, detail="Not authorized to modify member role.")

        if target_role_id:
            role_obj = db.query(Role).filter(Role.id == target_role_id).first()
        else:
            role_obj = db.query(Role).filter(Role.name == target_role_name).first()

        if not role_obj:
            raise HTTPException(status_code=400, detail="Invalid role specified.")

        # Check role permission hierarchy
        if user_role == "Vice President" and role_obj.name in ["Super Admin", "President"]:
            raise HTTPException(status_code=403, detail=f"Vice President cannot assign role '{role_obj.name}'.")
        if user_role == "President" and role_obj.name == "Super Admin":
            raise HTTPException(status_code=403, detail="President cannot assign role 'Super Admin'.")

        if member.user:
            member.user.role_id = role_obj.id

    if "designation" in update_data and update_data["designation"]:
        update_data["role_title"] = update_data.pop("designation")

    if "skills" in update_data and update_data["skills"] is not None:
        update_data["skills"] = json.dumps(update_data["skills"])

    # Non-leadership cannot change status
    if "status" in update_data:
        if not is_leadership:
            del update_data["status"]
        elif member.user:
            member.user.is_active = (update_data["status"] == "Active")

    for k, v in update_data.items():
        if hasattr(member, k):
            setattr(member, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Member", member.id,
        f"Member {member.full_name} updated by {current_user.email}",
        diff=payload.model_dump(exclude_unset=True)
    )

    db.commit()
    db.refresh(member)
    return build_member_response(member, db)


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President"]))
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    user = member.user
    target_role_name = user.role.name if user and user.role else "Member"
    caller_role = current_user.role.name if current_user.role else "Member"

    if target_role_name == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin account cannot be deleted.")

    if caller_role == "Vice President" and target_role_name in ["Super Admin", "President"]:
        raise HTTPException(status_code=403, detail=f"Vice President cannot delete {target_role_name} accounts.")

    if caller_role == "President" and target_role_name == "Super Admin":
        raise HTTPException(status_code=403, detail="President cannot delete Super Admin accounts.")

    log_audit_event(
        db, current_user, "DELETE", "Member", member.id,
        f"{current_user.email} removed member {member.full_name} ({member.email})"
    )

    db.delete(member)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Member successfully deleted"}
