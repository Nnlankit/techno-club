from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User, Role
from app.schemas.auth import UserResponse, RoleResponse
from app.schemas.member_domain import MemberCreate, MemberResponse, ReportsToOption
from app.api.v1.auth import build_user_response
from app.api.v1.members import build_member_response
from app.services.audit_service import log_audit_event
from app.services.user_service import (
    get_allowed_roles_for_user,
    get_reports_to_options,
    create_user_and_member,
)

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President", "Faculty Coordinator"]))
):
    users = db.query(User).all()
    return [build_user_response(u, db) for u in users]


@router.get("/roles", response_model=List[RoleResponse])
def get_all_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.get("/allowed-roles", response_model=List[str])
def get_user_allowed_creation_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the list of roles the authenticated user is authorized to create."""
    return get_allowed_roles_for_user(current_user, db)


@router.get("/reports-to-options", response_model=List[ReportsToOption])
def get_reporting_options(
    role: str = Query("Member", description="Target role of the user being created"),
    domain_id: Optional[int] = Query(None, description="Assigned domain ID if applicable"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns valid supervisors (Reports To) based on role and domain hierarchy."""
    return get_reports_to_options(role, domain_id, db)


@router.post("/", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_new_user(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new user and member account with role permissions, domain requirements,
    reporting hierarchy validation, and audit logging.
    """
    new_member = create_user_and_member(payload, current_user, db)
    return build_member_response(new_member, db)


@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    old_role = user.role.name if user.role else "None"
    user.role_id = role.id
    if user.member:
        user.member.role_title = role.name
    
    log_audit_event(
        db, current_user, "UPDATE_ROLE", "User", user.id,
        f"{current_user.email} changed role of user {user.email} from {old_role} to {role.name}",
        diff={"old_role": old_role, "new_role": role.name}
    )
    db.commit()
    db.refresh(user)
    return build_user_response(user, db)
