from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user_role import User
from app.models.operations import Notification
from app.schemas.operations import NotificationResponse

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def get_user_notifications(
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    if type and type.lower() != "all":
        query = query.filter(Notification.type.ilike(f"%{type}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Notification.title.ilike(search_pattern),
                Notification.message.ilike(search_pattern)
            )
        )

    notifs = query.order_by(desc(Notification.created_at)).limit(limit).all()

    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            entity_type=n.entity_type,
            entity_id=n.entity_id,
            is_read=n.is_read,
            priority=n.priority,
            created_at=n.created_at
        )
        for n in notifs
    ]


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        entity_type=notif.entity_type,
        entity_id=notif.entity_id,
        is_read=notif.is_read,
        priority=notif.priority,
        created_at=notif.created_at
    )


@router.put("/{notification_id}/unread", response_model=NotificationResponse)
def mark_notification_unread(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = False
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        entity_type=notif.entity_type,
        entity_id=notif.entity_id,
        is_read=notif.is_read,
        priority=notif.priority,
        created_at=notif.created_at
    )


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/clear-all")
def clear_all_notifications(
    only_read: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if only_read:
        query = query.filter(Notification.is_read == True)
    
    count = query.delete(synchronize_session=False)
    db.commit()
    return {"message": f"Cleared {count} notifications"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted successfully"}

