import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.event_hackathon import Event, EventRegistration, EventAttendance
from app.schemas.event_hackathon import (
    EventCreate, EventUpdate, EventResponse, 
    EventRegistrationCreate, EventRegistrationResponse, 
    EventAttendanceCreate, EventAttendanceResponse
)
from app.services.audit_service import log_audit_event
from app.services.notification_service import broadcast_notification_to_all

router = APIRouter()


def build_event_response(e: Event, db: Session) -> EventResponse:
    reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == e.id).count()
    att_count = db.query(EventAttendance).filter(EventAttendance.event_id == e.id).count()

    speakers_list = json.loads(e.speakers or "[]")
    judges_list = json.loads(e.judges or "[]")
    coordinators_list = json.loads(e.coordinators or "[]")
    volunteers_list = json.loads(e.volunteers or "[]")
    sponsors_list = json.loads(e.sponsors or "[]")

    return EventResponse(
        id=e.id,
        name=e.name,
        event_type=e.event_type,
        description=e.description,
        domain_id=e.domain_id,
        domain_name=e.domain.name if e.domain else None,
        organizer_id=e.organizer_id,
        organizer_name=e.organizer.full_name if e.organizer else None,
        start_time=e.start_time,
        end_time=e.end_time,
        venue=e.venue,
        capacity=e.capacity,
        registration_deadline=e.registration_deadline,
        budget=e.budget,
        status=e.status,
        speakers=speakers_list,
        judges=judges_list,
        coordinators=coordinators_list,
        volunteers=volunteers_list,
        sponsors=sponsors_list,
        banner_url=e.banner_url,
        report_summary=e.report_summary,
        registered_count=reg_count,
        attended_count=att_count,
        created_at=e.created_at,
        updated_at=e.updated_at
    )


@router.get("/", response_model=List[EventResponse])
def get_all_events(
    domain_id: Optional[int] = None,
    event_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    upcoming_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Event)

    if domain_id:
        query = query.filter(Event.domain_id == domain_id)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if status_filter:
        query = query.filter(Event.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Event.name.ilike(s), Event.description.ilike(s), Event.venue.ilike(s)))
    if upcoming_only:
        now = datetime.now(timezone.utc)
        query = query.filter(Event.end_time >= now)

    events = query.order_by(asc(Event.start_time)).all()
    return [build_event_response(e, db) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return build_event_response(event, db)


@router.post("/", response_model=EventResponse)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    organizer_id = payload.organizer_id
    if not organizer_id and current_user.member:
        organizer_id = current_user.member.id

    new_event = Event(
        name=payload.name,
        event_type=payload.event_type,
        description=payload.description,
        domain_id=payload.domain_id,
        organizer_id=organizer_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        venue=payload.venue,
        capacity=payload.capacity or 100,
        registration_deadline=payload.registration_deadline,
        budget=payload.budget or 0.0,
        status=payload.status or "Draft",
        speakers=json.dumps(payload.speakers or []),
        judges=json.dumps(payload.judges or []),
        coordinators=json.dumps(payload.coordinators or []),
        volunteers=json.dumps(payload.volunteers or []),
        sponsors=json.dumps(payload.sponsors or []),
        banner_url=payload.banner_url,
        report_summary=payload.report_summary
    )
    db.add(new_event)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Event", new_event.id,
        f"{current_user.email} created event: '{new_event.name}' ({new_event.event_type})"
    )

    if new_event.status == "Registration Open":
        broadcast_notification_to_all(
            db,
            title=f"New Event: {new_event.name}",
            message=f"{new_event.event_type} scheduled at {new_event.venue}. Registrations now open!",
            notification_type="Event"
        )

    db.commit()
    db.refresh(new_event)
    return build_event_response(new_event, db)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = payload.model_dump(exclude_unset=True)
    json_fields = ["speakers", "judges", "coordinators", "volunteers", "sponsors"]
    for field in json_fields:
        if field in update_data and update_data[field] is not None:
            update_data[field] = json.dumps(update_data[field])

    for k, v in update_data.items():
        setattr(event, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Event", event.id,
        f"Event '{event.name}' updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(event)
    return build_event_response(event, db)


@router.post("/{event_id}/register", response_model=EventRegistrationResponse)
def register_for_event(
    event_id: int,
    payload: EventRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Member ID or guest details
    member_id = payload.member_id
    if not member_id and current_user and current_user.member:
        member_id = current_user.member.id

    if member_id:
        existing = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.member_id == member_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You are already registered for this event")
        member = db.query(Member).filter(Member.id == member_id).first()
        attendee_name = member.full_name
        attendee_email = member.email
        cid = member.college_id
    else:
        if not payload.guest_name or not payload.guest_email:
            raise HTTPException(status_code=400, detail="Guest name and email are required")
        existing = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.guest_email == payload.guest_email
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered for this event")
        attendee_name = payload.guest_name
        attendee_email = payload.guest_email
        cid = payload.guest_college_id

    reg = EventRegistration(
        event_id=event_id,
        member_id=member_id,
        guest_name=payload.guest_name,
        guest_email=payload.guest_email,
        guest_college_id=payload.guest_college_id,
        guest_phone=payload.guest_phone,
        status="Confirmed"
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    return EventRegistrationResponse(
        id=reg.id,
        event_id=reg.event_id,
        event_name=event.name,
        member_id=reg.member_id,
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        college_id=cid,
        status=reg.status,
        qr_code_token=reg.qr_code_token,
        registered_at=reg.registered_at,
        attended=False
    )


@router.get("/{event_id}/registrations", response_model=List[EventRegistrationResponse])
def get_event_registrations(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    regs = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).all()
    results = []
    for r in regs:
        member = r.member
        att = r.attendance
        results.append(EventRegistrationResponse(
            id=r.id,
            event_id=r.event_id,
            event_name=event.name,
            member_id=r.member_id,
            attendee_name=member.full_name if member else r.guest_name or "Guest",
            attendee_email=member.email if member else r.guest_email or "",
            college_id=member.college_id if member else r.guest_college_id,
            status=r.status,
            qr_code_token=r.qr_code_token,
            registered_at=r.registered_at,
            attended=att is not None
        ))
    return results


@router.post("/{event_id}/attendance/scan", response_model=EventAttendanceResponse)
def scan_qr_attendance(
    event_id: int,
    payload: EventAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Technical Lead"]))
):
    token = payload.qr_code_token
    if not token:
        raise HTTPException(status_code=400, detail="QR Code token is required")

    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.qr_code_token == token
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Invalid QR Code registration token for this event")

    existing_att = db.query(EventAttendance).filter(
        EventAttendance.event_id == event_id,
        EventAttendance.registration_id == reg.id
    ).first()
    if existing_att:
        raise HTTPException(status_code=400, detail="Attendance has already been marked for this participant")

    att = EventAttendance(
        event_id=event_id,
        registration_id=reg.id,
        member_id=reg.member_id,
        method="QR_SCAN",
        marked_by_id=current_user.member.id if current_user.member else None,
        notes=payload.notes or "QR Token Verified via Scanner"
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    attendee_name = reg.member.full_name if reg.member else reg.guest_name or "Participant"
    attendee_email = reg.member.email if reg.member else reg.guest_email or ""
    cid = reg.member.college_id if reg.member else reg.guest_college_id

    return EventAttendanceResponse(
        id=att.id,
        event_id=event_id,
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        college_id=cid,
        method=att.method,
        marked_at=att.marked_at,
        notes=att.notes
    )


@router.post("/{event_id}/attendance/manual", response_model=EventAttendanceResponse)
def mark_manual_attendance(
    event_id: int,
    payload: EventAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    if not payload.member_id and not payload.registration_id:
        raise HTTPException(status_code=400, detail="Member ID or Registration ID is required")

    reg = None
    if payload.registration_id:
        reg = db.query(EventRegistration).filter(
            EventRegistration.id == payload.registration_id,
            EventRegistration.event_id == event_id
        ).first()
        existing = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.registration_id == payload.registration_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Attendance has already been marked for this participant")
    elif payload.member_id:
        existing = db.query(EventAttendance).filter(
            EventAttendance.event_id == event_id,
            EventAttendance.member_id == payload.member_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Attendance has already been marked for this participant")

    member_id = payload.member_id or (reg.member_id if reg else None)
    att = EventAttendance(
        event_id=event_id,
        registration_id=payload.registration_id,
        member_id=member_id,
        method="MANUAL",
        marked_by_id=current_user.member.id if current_user.member else None,
        notes=payload.notes or "Manual Check-in by Coordinator"
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    attendee_name = att.member.full_name if att.member else (reg.attendee_name if reg else "Participant")
    attendee_email = att.member.email if att.member else (reg.attendee_email if reg else "")
    cid = att.member.college_id if att.member else (reg.college_id if reg else None)

    return EventAttendanceResponse(
        id=att.id,
        event_id=event_id,
        attendee_name=attendee_name,
        attendee_email=attendee_email,
        college_id=cid,
        method=att.method,
        marked_at=att.marked_at,
        notes=att.notes
    )


@router.post("/{event_id}/duplicate", response_model=EventResponse)
def duplicate_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    new_ev = Event(
        name=f"Copy of {ev.name}",
        event_type=ev.event_type,
        description=ev.description,
        domain_id=ev.domain_id,
        organizer_id=current_user.member.id if current_user.member else ev.organizer_id,
        start_time=ev.start_time,
        end_time=ev.end_time,
        venue=ev.venue,
        capacity=ev.capacity,
        registration_deadline=ev.registration_deadline,
        budget=ev.budget,
        status="Draft",
        speakers=ev.speakers,
        judges=ev.judges,
        coordinators=ev.coordinators,
        volunteers=ev.volunteers,
        sponsors=ev.sponsors,
        banner_url=ev.banner_url,
        report_summary=None
    )
    db.add(new_ev)
    db.flush()

    log_audit_event(
        db, current_user, "DUPLICATE", "Event", new_ev.id,
        f"{current_user.email} duplicated event #{ev.id} to new event #{new_ev.id} ('{new_ev.name}')"
    )

    db.commit()
    db.refresh(new_ev)
    return build_event_response(new_ev, db)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    archive: bool = False,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if archive or (ev.status == "Completed" and not force):
        ev.status = "Cancelled" if ev.status != "Completed" else "Archived"
        log_audit_event(
            db, current_user, "ARCHIVE", "Event", ev.id,
            f"Event '{ev.name}' archived/cancelled by {current_user.email}"
        )
        db.commit()
        return {"message": f"Event '{ev.name}' status set to {ev.status}", "status": ev.status, "archived": True}

    # Hard delete
    db.query(EventAttendance).filter(EventAttendance.event_id == event_id).delete(synchronize_session=False)
    db.query(EventRegistration).filter(EventRegistration.event_id == event_id).delete(synchronize_session=False)

    log_audit_event(
        db, current_user, "DELETE", "Event", ev.id,
        f"Event '{ev.name}' permanently deleted by {current_user.email}"
    )

    db.delete(ev)
    db.commit()
    return {"message": f"Event '{ev.name}' successfully deleted", "archived": False}
