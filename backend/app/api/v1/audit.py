import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.operations import AuditLog
from app.schemas.operations import AuditLogResponse

router = APIRouter()


@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President", "Faculty Coordinator"]))
):
    query = db.query(AuditLog)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action.upper())

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    results = []
    for l in logs:
        diff_dict = {}
        if l.diff_json:
            try:
                diff_dict = json.loads(l.diff_json)
            except Exception:
                diff_dict = {"raw": l.diff_json}

        results.append(AuditLogResponse(
            id=l.id,
            user_email=l.user_email,
            role=l.role,
            action=l.action,
            entity=l.entity,
            entity_id=l.entity_id,
            description=l.description,
            diff_json=diff_dict,
            ip_address=l.ip_address,
            timestamp=l.timestamp
        ))
    return results
