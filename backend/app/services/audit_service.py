import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.operations import AuditLog
from app.models.user_role import User


def log_audit_event(
    db: Session,
    user: Optional[User],
    action: str,
    entity: str,
    entity_id: Optional[int],
    description: str,
    diff: Optional[Any] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    user_email = user.email if user else "system@technoclub.local"
    role_name = user.role.name if user and user.role else "System"
    
    diff_json_str = "{}"
    if diff:
        try:
            if isinstance(diff, str):
                diff_json_str = diff
            else:
                diff_json_str = json.dumps(diff, default=str)
        except Exception:
            diff_json_str = str(diff)

    audit_entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user_email,
        role=role_name,
        action=action.upper(),
        entity=entity,
        entity_id=entity_id,
        description=description,
        diff_json=diff_json_str,
        ip_address=ip_address
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
