from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.operations import Notification
from app.models.user_role import User, Role


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "System",
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    priority: str = "Normal"
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        entity_type=entity_type,
        entity_id=entity_id,
        priority=priority,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def broadcast_notification_to_role(
    db: Session,
    role_name: str,
    title: str,
    message: str,
    notification_type: str = "System",
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    priority: str = "Normal"
):
    users = db.query(User).join(Role).filter(Role.name == role_name).all()
    for user in users:
        create_notification(
            db,
            user_id=user.id,
            title=title,
            message=message,
            notification_type=notification_type,
            entity_type=entity_type,
            entity_id=entity_id,
            priority=priority
        )


def broadcast_notification_to_all(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "Announcement",
    priority: str = "Normal"
):
    users = db.query(User).filter(User.is_active == True).all()
    for user in users:
        create_notification(
            db,
            user_id=user.id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority
        )
