import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.operations import Meeting
from app.schemas.operations import MeetingCreate, MeetingUpdate, MeetingResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_meeting_response(m: Meeting) -> MeetingResponse:
    return MeetingResponse(
        id=m.id,
        title=m.title,
        meeting_type=m.meeting_type,
        domain_id=m.domain_id,
        domain_name=m.domain.name if m.domain else None,
        organizer_id=m.organizer_id,
        organizer_name=m.organizer.full_name if m.organizer else None,
        scheduled_at=m.scheduled_at,
        duration_minutes=m.duration_minutes,
        location=m.location,
        meeting_link=m.meeting_link,
        agenda=m.agenda,
        minutes_of_meeting=m.minutes_of_meeting,
        decisions=m.decisions,
        action_items=json.loads(m.action_items or "[]"),
        attendee_ids=json.loads(m.attendee_ids or "[]"),
        status=m.status,
        created_at=m.created_at
    )


@router.get("/", response_model=List[MeetingResponse])
def get_all_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(desc(Meeting.scheduled_at)).all()
    return [build_meeting_response(m) for m in meetings]


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting_by_id(meeting_id: int, db: Session = Depends(get_db)):
    m = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return build_meeting_response(m)


@router.post("/", response_model=MeetingResponse)
def schedule_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    organizer_id = current_user.member.id if current_user.member else None

    m = Meeting(
        title=payload.title,
        meeting_type=payload.meeting_type,
        domain_id=payload.domain_id,
        organizer_id=organizer_id,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes or 60,
        location=payload.location or "Club Room",
        meeting_link=payload.meeting_link,
        agenda=payload.agenda,
        attendee_ids=json.dumps(payload.attendee_ids or []),
        status="Scheduled"
    )
    db.add(m)
    db.flush()

    log_audit_event(
        db, current_user, "SCHEDULE_MEETING", "Meeting", m.id,
        f"{current_user.email} scheduled meeting: '{m.title}'"
    )

    db.commit()
    db.refresh(m)
    return build_meeting_response(m)


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting_notes(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "action_items" in update_data and update_data["action_items"] is not None:
        update_data["action_items"] = json.dumps(update_data["action_items"])
    if "attendee_ids" in update_data and update_data["attendee_ids"] is not None:
        update_data["attendee_ids"] = json.dumps(update_data["attendee_ids"])

    for k, v in update_data.items():
        setattr(m, k, v)

    db.commit()
    db.refresh(m)
    return build_meeting_response(m)
