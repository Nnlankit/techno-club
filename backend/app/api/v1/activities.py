from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.project_task import Activity
from app.schemas.project_task import ActivityCreate, ActivityUpdate, ActivityResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_activity_response(a: Activity) -> ActivityResponse:
    return ActivityResponse(
        id=a.id,
        title=a.title,
        activity_type=a.activity_type,
        description=a.description,
        domain_id=a.domain_id,
        domain_name=a.domain.name if a.domain else None,
        coordinator_id=a.coordinator_id,
        coordinator_name=a.coordinator.full_name if a.coordinator else None,
        start_date=a.start_date,
        end_date=a.end_date,
        venue=a.venue,
        status=a.status,
        budget=a.budget,
        participants_count=a.participants_count,
        outcomes=a.outcomes,
        documentation=a.documentation,
        created_at=a.created_at,
        updated_at=a.updated_at
    )


@router.get("/", response_model=List[ActivityResponse])
def get_all_activities(
    activity_type: Optional[str] = None,
    domain_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Activity)
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    if domain_id:
        query = query.filter(Activity.domain_id == domain_id)
    if status_filter:
        query = query.filter(Activity.status == status_filter)

    activities = query.order_by(desc(Activity.start_date)).all()
    return [build_activity_response(a) for a in activities]


@router.post("/", response_model=ActivityResponse)
def create_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    coord_id = payload.coordinator_id or (current_user.member.id if current_user.member else None)

    act = Activity(
        title=payload.title,
        activity_type=payload.activity_type,
        description=payload.description,
        domain_id=payload.domain_id,
        coordinator_id=coord_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        venue=payload.venue,
        status=payload.status or "Planned",
        budget=payload.budget or 0.0,
        participants_count=payload.participants_count or 0,
        outcomes=payload.outcomes,
        documentation=payload.documentation
    )
    db.add(act)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Activity", act.id,
        f"{current_user.email} logged activity: '{act.title}' ({act.activity_type})"
    )

    db.commit()
    db.refresh(act)
    return build_activity_response(act)


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(act, k, v)

    db.commit()
    db.refresh(act)
    return build_activity_response(act)
