from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.event_hackathon import Event
from app.models.operations import Sponsor
from app.schemas.operations import SponsorCreate, SponsorUpdate, SponsorResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_sponsor_response(s: Sponsor) -> SponsorResponse:
    return SponsorResponse(
        id=s.id,
        company_name=s.company_name,
        contact_person=s.contact_person,
        email=s.email,
        phone=s.phone,
        website=s.website,
        tier=s.tier,
        stage=s.stage,
        amount=s.amount,
        event_id=s.event_id,
        event_name=s.event.name if s.event else None,
        benefits=s.benefits,
        mou_signed=s.mou_signed,
        payment_status=s.payment_status,
        notes=s.notes,
        created_at=s.created_at
    )


@router.get("/", response_model=List[SponsorResponse])
def get_all_sponsors(
    stage: Optional[str] = None,
    tier: Optional[str] = None,
    event_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Sponsor)
    if stage:
        query = query.filter(Sponsor.stage == stage)
    if tier:
        query = query.filter(Sponsor.tier == tier)
    if event_id:
        query = query.filter(Sponsor.event_id == event_id)

    sponsors = query.order_by(desc(Sponsor.amount)).all()
    return [build_sponsor_response(s) for s in sponsors]


@router.post("/", response_model=SponsorResponse)
def create_sponsor(
    payload: SponsorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Treasurer"]))
):
    sp = Sponsor(
        company_name=payload.company_name,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        website=payload.website,
        tier=payload.tier or "Silver",
        stage=payload.stage or "Prospect",
        amount=payload.amount or 0.0,
        event_id=payload.event_id,
        benefits=payload.benefits,
        mou_signed=payload.mou_signed or False,
        payment_status=payload.payment_status or "Pending",
        notes=payload.notes
    )
    db.add(sp)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Sponsor", sp.id,
        f"{current_user.email} added sponsor lead: '{sp.company_name}' ({sp.tier})"
    )

    db.commit()
    db.refresh(sp)
    return build_sponsor_response(sp)


@router.put("/{sponsor_id}", response_model=SponsorResponse)
def update_sponsor(
    sponsor_id: int,
    payload: SponsorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Treasurer"]))
):
    sp = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(sp, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Sponsor", sp.id,
        f"Sponsor '{sp.company_name}' updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(sp)
    return build_sponsor_response(sp)
