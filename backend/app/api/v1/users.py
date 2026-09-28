from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User, Role, Permission
from app.schemas.auth import UserResponse, RoleResponse
from app.api.v1.auth import build_user_response
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Faculty Coordinator"]))
):
    users = db.query(User).all()
    return [build_user_response(u) for u in users]


@router.get("/roles", response_model=List[RoleResponse])
def get_all_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [RoleResponse.model_validate(r) for r in roles]


@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President"]))
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
        f"President {current_user.email} changed role of user {user.email} from {old_role} to {role.name}",
        diff={"old_role": old_role, "new_role": role.name}
    )
    db.commit()
    db.refresh(user)
    return build_user_response(user)
