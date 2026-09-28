import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.operations import ApprovalProposal
from app.schemas.operations import (
    ApprovalProposalCreate, ApprovalAction, ApprovalProposalResponse
)
from app.services.approval_service import process_proposal_action
from app.services.audit_service import log_audit_event
from app.services.notification_service import broadcast_notification_to_role

router = APIRouter()


def build_proposal_response(p: ApprovalProposal) -> ApprovalProposalResponse:
    return ApprovalProposalResponse(
        id=p.id,
        title=p.title,
        proposal_type=p.proposal_type,
        entity_type=p.entity_type,
        entity_id=p.entity_id,
        proposer_id=p.proposer_id,
        proposer_name=p.proposer.full_name if p.proposer else "Unknown",
        current_stage=p.current_stage,
        status=p.status,
        priority=p.priority,
        description=p.description,
        requested_budget=p.requested_budget,
        remarks=p.remarks,
        history=json.loads(p.history or "[]"),
        created_at=p.created_at,
        updated_at=p.updated_at
    )


@router.get("/", response_model=List[ApprovalProposalResponse])
def get_all_proposals(
    status_filter: Optional[str] = Query(None, alias="status"),
    stage: Optional[str] = None,
    proposal_type: Optional[str] = None,
    proposer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ApprovalProposal)

    if status_filter:
        query = query.filter(ApprovalProposal.status == status_filter)
    if stage:
        query = query.filter(ApprovalProposal.current_stage == stage)
    if proposal_type:
        query = query.filter(ApprovalProposal.proposal_type == proposal_type)
    if proposer_id:
        query = query.filter(ApprovalProposal.proposer_id == proposer_id)

    proposals = query.order_by(desc(ApprovalProposal.created_at)).all()
    return [build_proposal_response(p) for p in proposals]


@router.get("/{proposal_id}", response_model=ApprovalProposalResponse)
def get_proposal_by_id(proposal_id: int, db: Session = Depends(get_db)):
    p = db.query(ApprovalProposal).filter(ApprovalProposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return build_proposal_response(p)


@router.post("/", response_model=ApprovalProposalResponse)
def submit_proposal(
    payload: ApprovalProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposer_id = current_user.member.id if current_user.member else 1

    # Initial history entry
    now_str = datetime.now(timezone.utc).isoformat()
    initial_history = [{
        "stage": "Domain Review",
        "reviewer_id": current_user.id,
        "reviewer_name": current_user.member.full_name if current_user.member else current_user.email,
        "reviewer_role": current_user.role.name if current_user.role else "Member",
        "action": "Submitted",
        "timestamp": now_str,
        "comments": "Initial proposal submission."
    }]

    prop = ApprovalProposal(
        title=payload.title,
        proposal_type=payload.proposal_type,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        proposer_id=proposer_id,
        current_stage="Domain Review",
        status="Under Review",
        priority=payload.priority or "Normal",
        description=payload.description,
        requested_budget=payload.requested_budget or 0.0,
        remarks=payload.remarks,
        history=json.dumps(initial_history)
    )
    db.add(prop)
    db.flush()

    log_audit_event(
        db, current_user, "SUBMIT_PROPOSAL", "ApprovalProposal", prop.id,
        f"{current_user.email} submitted proposal #{prop.id}: '{prop.title}' (Budget: ${prop.requested_budget})"
    )

    broadcast_notification_to_role(
        db, "Domain Head",
        f"New Proposal Submitted: {prop.title}",
        f"Proposal '{prop.title}' was submitted by {current_user.member.full_name if current_user.member else current_user.email} and awaits domain review.",
        "Approval", "ApprovalProposal", prop.id
    )

    db.commit()
    db.refresh(prop)
    return build_proposal_response(prop)


@router.post("/{proposal_id}/action", response_model=ApprovalProposalResponse)
def execute_proposal_action(
    proposal_id: int,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Faculty Coordinator"]))
):
    prop = db.query(ApprovalProposal).filter(ApprovalProposal.id == proposal_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found")

    updated_prop, msg = process_proposal_action(
        db=db,
        proposal=prop,
        action=payload.action,
        reviewer=current_user,
        comments=payload.comments
    )

    return build_proposal_response(updated_prop)
