import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.deps import get_current_user
from app.models.user_role import User, Role
from app.models.member_domain import Member
from app.schemas.auth import (
    Token, LoginRequest, UserResponse, RoleResponse,
    PasswordChangeRequest, PasswordChangeResponse,
    UserProfileUpdate, SecurityLogResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_user_response(user: User, db: Optional[Session] = None) -> UserResponse:
    member = user.member
    domain_id = member.domain_id if member else None
    domain_name = member.domain.name if member and member.domain else None

    skills_list = []
    if member and member.skills:
        try:
            skills_list = json.loads(member.skills)
        except Exception:
            skills_list = [s.strip() for s in member.skills.split(",") if s.strip()]

    active_projects = 0
    completed_tasks = 0
    events_count = 0
    achievements_count = 0

    if db and member:
        from app.models.project_task import ProjectMember, Task
        from app.models.event_hackathon import EventRegistration
        from app.models.operations import Achievement
        active_projects = db.query(ProjectMember).filter(ProjectMember.member_id == member.id).count()
        completed_tasks = db.query(Task).filter(Task.assignee_id == member.id, Task.status == "Completed").count()
        events_count = db.query(EventRegistration).filter(EventRegistration.member_id == member.id).count()
        achievements_count = db.query(Achievement).filter(Achievement.member_id == member.id).count()

    return UserResponse(
        id=user.id,
        email=user.email,
        role=RoleResponse.model_validate(user.role),
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        member_id=member.id if member else None,
        full_name=member.full_name if member else user.email.split('@')[0],
        avatar_url=member.avatar_url if member else None,
        college_id=member.college_id if member else None,
        domain_id=domain_id,
        domain_name=domain_name,
        role_title=member.role_title if member else (user.role.name if user.role else "User"),
        phone=member.phone if member else None,
        department=member.department if member else None,
        year_semester=member.year_semester if member else None,
        bio=member.bio if member else None,
        skills=skills_list,
        github_url=member.github_url if member else None,
        linkedin_url=member.linkedin_url if member else None,
        joining_date=member.joining_date if member else None,
        last_login=user.last_login,
        status=member.status if member else ("Active" if user.is_active else "Inactive"),
        active_projects_count=active_projects,
        completed_tasks_count=completed_tasks,
        events_participated_count=events_count,
        achievements_count=achievements_count
    )


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.name if user.role else "Member", "email": user.email}
    )

    log_audit_event(db, user, "LOGIN", "User", user.id, f"User {user.email} logged in successfully")

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )


@router.post("/json-login", response_model=Token)
def json_login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.name if user.role else "Member", "email": user.email}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return build_user_response(current_user, db)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = current_user.member
    if not member:
        member = Member(
            user_id=current_user.id,
            college_id=f"TECH-{current_user.id:04d}",
            full_name=payload.full_name or current_user.email.split('@')[0],
            email=current_user.email,
            department=payload.department or "Computer Science",
            year_semester=payload.year_semester or "Year 1, Sem 1",
            role_title=current_user.role.name if current_user.role else "Member"
        )
        db.add(member)
        db.flush()

    update_dict = payload.model_dump(exclude_unset=True)
    if "skills" in update_dict and update_dict["skills"] is not None:
        update_dict["skills"] = json.dumps(update_dict["skills"])

    for field, val in update_dict.items():
        if hasattr(member, field):
            setattr(member, field, val)

    log_audit_event(
        db, current_user, "UPDATE_PROFILE", "Member", member.id,
        f"User {current_user.email} updated their profile settings",
        diff=payload.model_dump(exclude_unset=True)
    )

    db.commit()
    db.refresh(member)
    db.refresh(current_user)
    return build_user_response(current_user, db)


@router.post("/change-password", response_model=PasswordChangeResponse)
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if payload.confirm_password is not None and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match"
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.now(timezone.utc)

    log_audit_event(
        db, current_user, "CHANGE_PASSWORD", "User", current_user.id,
        f"User {current_user.email} updated account password"
    )

    db.commit()
    return PasswordChangeResponse(success=True, message="Password updated successfully")


@router.get("/security-logs", response_model=List[SecurityLogResponse])
def get_user_security_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 15
):
    from app.models.operations import AuditLog
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        SecurityLogResponse(
            id=log.id,
            action=log.action,
            description=log.description,
            ip_address=log.ip_address,
            timestamp=log.timestamp
        )
        for log in logs
    ]


@router.post("/demo-switch/{role_name}", response_model=Token)
def switch_demo_role(role_name: str, db: Session = Depends(get_db)):
    """
    Convenience endpoint for review and evaluation: instant switch to a pre-seeded persona
    (President, Vice President, Domain Head, Member, Treasurer, Faculty Coordinator)
    """
    role_email_map = {
        "president": "president@technoclub.org",
        "vice president": "vp@technoclub.org",
        "vp": "vp@technoclub.org",
        "domain head": "aiml.head@technoclub.org",
        "web head": "web.head@technoclub.org",
        "member": "member1@technoclub.org",
        "treasurer": "treasurer@technoclub.org",
        "faculty": "faculty@technoclub.org",
        "faculty coordinator": "faculty@technoclub.org"
    }

    target_email = role_email_map.get(role_name.lower())
    if not target_email:
        # Fallback to finding user by role name
        role = db.query(Role).filter(Role.name.ilike(f"%{role_name}%")).first()
        if role:
            user = db.query(User).filter(User.role_id == role.id).first()
            if user:
                target_email = user.email

    if not target_email:
        raise HTTPException(status_code=404, detail=f"No demo persona found for role '{role_name}'")

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo persona user record not found")

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.name if user.role else "Member", "email": user.email}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=build_user_response(user)
    )
