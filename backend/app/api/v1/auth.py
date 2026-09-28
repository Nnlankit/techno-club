from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.deps import get_current_user
from app.models.user_role import User, Role
from app.models.member_domain import Member
from app.schemas.auth import Token, LoginRequest, UserResponse, RoleResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_user_response(user: User) -> UserResponse:
    member = user.member
    domain_id = member.domain_id if member else None
    domain_name = member.domain.name if member and member.domain else None
    
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
        role_title=member.role_title if member else (user.role.name if user.role else "User")
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
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return build_user_response(current_user)


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
