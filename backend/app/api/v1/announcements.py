from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.operations import Announcement
from app.schemas.operations import AnnouncementCreate, AnnouncementResponse
from app.services.notification_service import broadcast_notification_to_all
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_announcement_response(a: Announcement) -> AnnouncementResponse:
    return AnnouncementResponse(
        id=a.id,
        title=a.title,
        content=a.content,
        author_id=a.author_id,
        author_name=a.author.full_name if a.author else None,
        domain_id=a.domain_id,
        domain_name=a.domain.name if a.domain else None,
        target_role=a.target_role,
        priority=a.priority,
        pinned=a.pinned,
        expires_at=a.expires_at,
        created_at=a.created_at
    )


@router.get("/", response_model=List[AnnouncementResponse])
def get_all_announcements(
    domain_id: Optional[int] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Announcement)
    if domain_id:
        query = query.filter((Announcement.domain_id == domain_id) | (Announcement.domain_id == None))
    if priority:
        query = query.filter(Announcement.priority == priority)

    announcements = query.order_by(desc(Announcement.pinned), desc(Announcement.created_at)).all()
    return [build_announcement_response(a) for a in announcements]


@router.post("/", response_model=AnnouncementResponse)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    author_id = current_user.member.id if current_user.member else None

    a = Announcement(
        title=payload.title,
        content=payload.content,
        author_id=author_id,
        domain_id=payload.domain_id,
        target_role=payload.target_role or "All",
        priority=payload.priority or "Normal",
        pinned=payload.pinned or False,
        expires_at=payload.expires_at
    )
    db.add(a)
    db.flush()

    broadcast_notification_to_all(
        db,
        title=f"Announcement: {a.title}",
        message=a.content[:150] + ("..." if len(a.content) > 150 else ""),
        notification_type="Announcement",
        priority=a.priority
    )

    log_audit_event(
        db, current_user, "CREATE", "Announcement", a.id,
        f"{current_user.email} published announcement: '{a.title}'"
    )

    db.commit()
    db.refresh(a)
    return build_announcement_response(a)
