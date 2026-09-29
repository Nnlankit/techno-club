import json
import random
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import get_password_hash
from app.models.user_role import User, Role
from app.models.member_domain import Member, Domain
from app.schemas.member_domain import MemberCreate, ReportsToOption
from app.services.audit_service import log_audit_event


# Role Creation Permission Matrix (Requirement 4)
ALLOWED_TARGET_ROLES: Dict[str, List[str]] = {
    "Super Admin": ["Super Admin", "President", "Vice President", "Domain Head", "Member"],
    "President": ["Vice President", "Domain Head", "Member"],
    "Vice President": ["Domain Head", "Member"],
    "Domain Head": [],  # Cannot create users unless explicitly authorized
    "Member": [],       # Cannot create users
}


def get_allowed_roles_for_user(current_user: User, db: Session) -> List[str]:
    """Returns list of role names that the current user is authorized to create."""
    if not current_user or not current_user.role:
        return []
    
    actor_role = current_user.role.name
    # Superusers inherit Super Admin permission
    if current_user.is_superuser and actor_role not in ALLOWED_TARGET_ROLES:
        return ALLOWED_TARGET_ROLES["Super Admin"]

    return ALLOWED_TARGET_ROLES.get(actor_role, [])


def get_reports_to_options(
    target_role_name: str,
    domain_id: Optional[int],
    db: Session
) -> List[ReportsToOption]:
    """
    Returns valid supervisor options based on the target role and domain hierarchy (Requirement 6):
    - Member: Domain Head of their assigned domain (or any Domain Head)
    - Domain Head: Vice President or President
    - Vice President: President
    - President: Super Admin (if one exists)
    - Super Admin: None
    """
    options: List[ReportsToOption] = []

    if target_role_name == "Super Admin":
        return []

    elif target_role_name == "President":
        # Reports to Super Admin if available
        super_admins = (
            db.query(Member)
            .join(Member.user)
            .join(Role)
            .filter(Role.name == "Super Admin", Member.status == "Active")
            .all()
        )
        for sa in super_admins:
            options.append(
                ReportsToOption(
                    id=sa.id,
                    name=sa.full_name,
                    full_name=sa.full_name,
                    email=sa.email,
                    role="Super Admin",
                    role_title=sa.role_title,
                    domain_name=sa.domain.name if sa.domain else None,
                )
            )

    elif target_role_name == "Vice President":
        # Reports to President
        presidents = (
            db.query(Member)
            .join(Member.user)
            .join(Role)
            .filter(Role.name == "President", Member.status == "Active")
            .all()
        )
        for p in presidents:
            options.append(
                ReportsToOption(
                    id=p.id,
                    name=p.full_name,
                    full_name=p.full_name,
                    email=p.email,
                    role="President",
                    role_title=p.role_title,
                    domain_name=p.domain.name if p.domain else None,
                )
            )

    elif target_role_name == "Domain Head":
        # Reports to Vice President or President
        leadership = (
            db.query(Member)
            .join(Member.user)
            .join(Role)
            .filter(Role.name.in_(["Vice President", "President"]), Member.status == "Active")
            .order_by(Role.name.desc())  # VP first, then President
            .all()
        )
        for ldr in leadership:
            role_name = ldr.user.role.name if ldr.user and ldr.user.role else ldr.role_title
            options.append(
                ReportsToOption(
                    id=ldr.id,
                    name=ldr.full_name,
                    full_name=ldr.full_name,
                    email=ldr.email,
                    role=role_name or "Leadership",
                    role_title=ldr.role_title,
                    domain_name=ldr.domain.name if ldr.domain else None,
                )
            )

    elif target_role_name == "Member":
        # Reports to Domain Head of the assigned domain
        query = (
            db.query(Member)
            .join(Member.user)
            .join(Role)
            .filter(Role.name == "Domain Head", Member.status == "Active")
        )
        if domain_id:
            # First priority: Domain Head of the exact domain
            domain_heads = query.filter(Member.domain_id == domain_id).all()
            if domain_heads:
                for dh in domain_heads:
                    options.append(
                        ReportsToOption(
                            id=dh.id,
                            name=dh.full_name,
                            full_name=dh.full_name,
                            email=dh.email,
                            role="Domain Head",
                            role_title=dh.role_title,
                            domain_name=dh.domain.name if dh.domain else None,
                        )
                    )
                return options

        # Fallback if domain has no head yet or domain_id not specified: list all domain heads
        all_dhs = query.all()
        for dh in all_dhs:
            options.append(
                ReportsToOption(
                    id=dh.id,
                    name=dh.full_name,
                    full_name=dh.full_name,
                    email=dh.email,
                    role="Domain Head",
                    role_title=dh.role_title,
                    domain_name=dh.domain.name if dh.domain else None,
                )
            )

    return options


def create_user_and_member(
    payload: MemberCreate,
    current_user: User,
    db: Session
) -> Member:
    """
    Validates permissions, hierarchy, domain requirements, email uniqueness,
    creates User and Member records, writes audit logs, and returns the created Member.
    """
    actor_role = current_user.role.name if current_user.role else "Member"
    allowed_roles = get_allowed_roles_for_user(current_user, db)

    # 1. Authorization check
    if not allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{actor_role}' does not have permission to create users."
        )

    # Determine requested target role
    target_role_name = payload.role
    if not target_role_name and payload.role_id:
        role_obj = db.query(Role).filter(Role.id == payload.role_id).first()
        if role_obj:
            target_role_name = role_obj.name
    if not target_role_name:
        target_role_name = "Member"

    # Enforce role creation permission matrix (Requirement 4 & 10)
    if target_role_name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: {actor_role} is not permitted to create a user with role '{target_role_name}'. Allowed roles: {', '.join(allowed_roles)}."
        )

    target_role = db.query(Role).filter(Role.name == target_role_name).first()
    if not target_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target role '{target_role_name}' does not exist in the system."
        )

    # 2. Email validation & uniqueness (Requirement 9 & 11)
    clean_email = payload.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{clean_email}' already exists. Please use a unique email address."
        )

    existing_member_email = db.query(Member).filter(func.lower(Member.email) == clean_email).first()
    if existing_member_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A member with email '{clean_email}' already exists."
        )

    # 3. Password validation (Requirement 9: minimum 8 characters)
    raw_password = payload.password or ""
    if len(raw_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 8 characters."
        )

    # 4. Domain requirement validation (Requirement 5)
    domain_obj = None
    if target_role_name in ["Member", "Domain Head"]:
        if not payload.domain_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department / Domain is required for Members and Domain Heads."
            )
        domain_obj = db.query(Domain).filter(Domain.id == payload.domain_id).first()
        if not domain_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Specified domain ID {payload.domain_id} does not exist."
            )
    else:
        # For leadership (President, Vice President, Super Admin), domain is optional
        if payload.domain_id:
            domain_obj = db.query(Domain).filter(Domain.id == payload.domain_id).first()

    # 5. Reports To Hierarchy validation (Requirement 6 & 10)
    reports_to_member = None
    if payload.reports_to_id:
        reports_to_member = db.query(Member).filter(Member.id == payload.reports_to_id).first()
        if not reports_to_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selected reporting supervisor (ID {payload.reports_to_id}) does not exist."
            )

        supervisor_role = (
            reports_to_member.user.role.name
            if reports_to_member.user and reports_to_member.user.role
            else reports_to_member.role_title
        )

        # Validate hierarchy compliance
        if target_role_name == "Super Admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Super Admin cannot report to any other role."
            )
        elif target_role_name == "President" and supervisor_role != "Super Admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="President can only report to Super Admin."
            )
        elif target_role_name == "Vice President" and supervisor_role != "President":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vice President can only report to the President."
            )
        elif target_role_name == "Domain Head" and supervisor_role not in ["President", "Vice President"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain Head must report to the Vice President or President."
            )
        elif target_role_name == "Member" and supervisor_role not in ["Domain Head", "Vice President", "President"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Member must report to their assigned Domain Head or Club Leadership."
            )
    else:
        # Automatically infer reporting relationship if not explicitly chosen
        valid_options = get_reports_to_options(target_role_name, payload.domain_id, db)
        if valid_options:
            reports_to_member = db.query(Member).filter(Member.id == valid_options[0].id).first()

    # 6. College ID generation or validation
    final_college_id = payload.college_id
    if not final_college_id:
        prefix = "TC"
        year_str = datetime.now(timezone.utc).strftime("%Y")
        rand_suffix = f"{random.randint(1000, 9999)}"
        final_college_id = f"{prefix}-{year_str}-{rand_suffix}"
        # Ensure unique
        while db.query(Member).filter(Member.college_id == final_college_id).first():
            rand_suffix = f"{random.randint(1000, 9999)}"
            final_college_id = f"{prefix}-{year_str}-{rand_suffix}"
    else:
        existing_cid = db.query(Member).filter(Member.college_id == final_college_id).first()
        if existing_cid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Member with College ID '{final_college_id}' already exists."
            )

    # 7. Year & Semester formatting
    year_sem = payload.year_semester
    if not year_sem or year_sem == "1st Year / 1st Sem":
        if payload.year and payload.semester:
            year_sem = f"{payload.year} / {payload.semester}"
        elif payload.year:
            year_sem = payload.year
        else:
            year_sem = "1st Year / 1st Sem"

    # Designation / Role Title
    designation = payload.designation or payload.role_title or target_role_name

    # 8. Create User record
    new_user = User(
        email=clean_email,
        hashed_password=get_password_hash(raw_password),
        role_id=target_role.id,
        is_active=True,
        is_superuser=(target_role_name == "Super Admin")
    )
    db.add(new_user)
    db.flush()

    # 9. Create Member record
    joining_dt = payload.joining_date or datetime.now(timezone.utc)
    avatar = payload.avatar_url
    if not avatar:
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.full_name.replace(' ', '')}"

    skills_json = json.dumps(payload.skills or [])

    new_member = Member(
        user_id=new_user.id,
        college_id=final_college_id,
        full_name=payload.full_name.strip(),
        email=clean_email,
        phone=payload.phone,
        department=payload.department or (domain_obj.name if domain_obj else "Computer Science & Engineering"),
        year_semester=year_sem,
        domain_id=domain_obj.id if domain_obj else None,
        reports_to_id=reports_to_member.id if reports_to_member else None,
        role_title=designation,
        status=payload.status or "Active",
        skills=skills_json,
        avatar_url=avatar,
        bio=payload.bio,
        github_url=payload.github_url,
        linkedin_url=payload.linkedin_url,
        joining_date=joining_dt
    )
    db.add(new_member)
    db.flush()

    # 10. Audit Logging (Requirement 12: Do NOT expose passwords!)
    actor_name = current_user.member.full_name if current_user.member else current_user.email
    log_audit_event(
        db=db,
        user=current_user,
        action="CREATE",
        entity="Member",
        entity_id=new_member.id,
        description=f"{actor_name} created user {new_member.full_name} as {target_role_name} in {domain_obj.name if domain_obj else 'Core'}",
        diff={
            "actor": actor_name,
            "action": "Created User",
            "new_user": new_member.full_name,
            "email": new_member.email,
            "role": target_role_name,
            "domain": domain_obj.name if domain_obj else None,
            "reports_to": reports_to_member.full_name if reports_to_member else None,
            "timestamp": datetime.now(timezone.utc).strftime("%d %b %Y %H:%M:%S UTC")
        }
    )

    db.commit()
    db.refresh(new_member)
    return new_member
