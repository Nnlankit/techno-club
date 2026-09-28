from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.operations import Achievement
from app.schemas.operations import AchievementCreate, AchievementResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_achievement_response(a: Achievement) -> AchievementResponse:
    return AchievementResponse(
        id=a.id,
        member_id=a.member_id,
        member_name=a.member.full_name if a.member else "Member",
        title=a.title,
        category=a.category,
        description=a.description,
        event_id=a.event_id,
        badge_icon=a.badge_icon,
        achievement_date=a.achievement_date,
        proof_url=a.proof_url,
        is_featured=a.is_featured,
        created_at=a.created_at
    )


@router.get("/", response_model=List[AchievementResponse])
def get_all_achievements(
    member_id: Optional[int] = None,
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Achievement)
    if member_id:
        query = query.filter(Achievement.member_id == member_id)
    if category:
        query = query.filter(Achievement.category == category)
    if is_featured is not None:
        query = query.filter(Achievement.is_featured == is_featured)

    achievements = query.order_by(desc(Achievement.achievement_date)).all()
    return [build_achievement_response(a) for a in achievements]


@router.post("/", response_model=AchievementResponse)
def create_achievement(
    payload: AchievementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    ach = Achievement(
        member_id=payload.member_id,
        title=payload.title,
        category=payload.category,
        description=payload.description,
        event_id=payload.event_id,
        badge_icon=payload.badge_icon or "Trophy",
        proof_url=payload.proof_url,
        is_featured=payload.is_featured or False
    )
    db.add(ach)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Achievement", ach.id,
        f"{current_user.email} awarded achievement '{ach.title}' to member #{ach.member_id}"
    )

    db.commit()
    db.refresh(ach)
    return build_achievement_response(ach)
