import json
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.operations import ApprovalProposal
from app.models.event_hackathon import Event, Hackathon
from app.models.project_task import Project
from app.models.user_role import User
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification, broadcast_notification_to_role


def process_proposal_action(
    db: Session,
    proposal: ApprovalProposal,
    action: str,  # Approve, Reject, Request Revision
    reviewer: User,
    comments: Optional[str] = None
) -> Tuple[ApprovalProposal, str]:
    history = json.loads(proposal.history or "[]")
    now_str = datetime.now(timezone.utc).isoformat()
    reviewer_role = reviewer.role.name if reviewer.role else "Reviewer"
    reviewer_name = reviewer.member.full_name if reviewer.member else reviewer.email

    action_record = {
        "stage": proposal.current_stage,
        "reviewer_id": reviewer.id,
        "reviewer_name": reviewer_name,
        "reviewer_role": reviewer_role,
        "action": action,
        "timestamp": now_str,
        "comments": comments or ""
    }
    history.append(action_record)
    proposal.history = json.dumps(history)

    old_status = proposal.status

    if action.lower() == "reject":
        proposal.status = "Rejected"
        log_audit_event(
            db, reviewer, "REJECT", "ApprovalProposal", proposal.id,
            f"{reviewer_role} {reviewer_name} rejected proposal #{proposal.id}: '{proposal.title}'",
            diff={"action": "Reject", "comments": comments}
        )
        if proposal.proposer and proposal.proposer.user_id:
            create_notification(
                db, proposal.proposer.user_id,
                f"Proposal Rejected: {proposal.title}",
                f"Your proposal '{proposal.title}' was rejected by {reviewer_name} ({reviewer_role}). Comments: {comments or 'None'}",
                "Approval", "ApprovalProposal", proposal.id, priority="High"
            )
        db.commit()
        db.refresh(proposal)
        return proposal, "Proposal rejected."

    elif action.lower() == "request revision":
        proposal.status = "Revision Required"
        log_audit_event(
            db, reviewer, "REQUEST_REVISION", "ApprovalProposal", proposal.id,
            f"{reviewer_role} {reviewer_name} requested revision on proposal #{proposal.id}: '{proposal.title}'",
            diff={"action": "Revision Required", "comments": comments}
        )
        if proposal.proposer and proposal.proposer.user_id:
            create_notification(
                db, proposal.proposer.user_id,
                f"Revision Requested: {proposal.title}",
                f"Revisions were requested for '{proposal.title}' by {reviewer_name} ({reviewer_role}). Comments: {comments or 'None'}",
                "Approval", "ApprovalProposal", proposal.id, priority="High"
            )
        db.commit()
        db.refresh(proposal)
        return proposal, "Revision requested."

    # Action is APPROVE
    if reviewer_role == "President" or proposal.current_stage == "President Approval":
        # Final approval by President!
        proposal.status = "Approved"
        proposal.current_stage = "Completed"
        
        # Synchronize linked entity status if applicable
        if proposal.entity_type == "Event" and proposal.entity_id:
            event = db.query(Event).filter(Event.id == proposal.entity_id).first()
            if event:
                event.status = "Registration Open"
        elif proposal.entity_type == "Hackathon" and proposal.entity_id:
            hack = db.query(Hackathon).filter(Hackathon.id == proposal.entity_id).first()
            if hack:
                hack.status = "Registration"
        elif proposal.entity_type == "Project" and proposal.entity_id:
            proj = db.query(Project).filter(Project.id == proposal.entity_id).first()
            if proj:
                proj.status = "Active"

        msg = f"Proposal #{proposal.id} fully approved by President {reviewer_name}."

    elif reviewer_role == "Vice President" or proposal.current_stage == "Vice President Review":
        proposal.current_stage = "President Approval"
        proposal.status = "Under Review"
        broadcast_notification_to_role(
            db, "President",
            f"Final Approval Required: {proposal.title}",
            f"Proposal '{proposal.title}' has been reviewed by Vice President {reviewer_name} and is awaiting your final presidential approval.",
            "Approval", "ApprovalProposal", proposal.id, priority="High"
        )
        msg = "Proposal endorsed by Vice President and advanced to President Approval."

    elif proposal.current_stage == "Domain Review":
        proposal.current_stage = "Vice President Review"
        proposal.status = "Under Review"
        broadcast_notification_to_role(
            db, "Vice President",
            f"Proposal for Review: {proposal.title}",
            f"Proposal '{proposal.title}' has passed Domain Review and awaits VP review.",
            "Approval", "ApprovalProposal", proposal.id
        )
        msg = "Proposal approved at Domain stage and advanced to Vice President Review."

    else:
        # Direct approval
        proposal.status = "Approved"
        msg = f"Proposal approved by {reviewer_role}."

    log_audit_event(
        db, reviewer, "APPROVE", "ApprovalProposal", proposal.id,
        f"{reviewer_role} {reviewer_name} approved proposal #{proposal.id}: '{proposal.title}'",
        diff={"stage": proposal.current_stage, "status": proposal.status, "comments": comments}
    )

    if proposal.proposer and proposal.proposer.user_id:
        create_notification(
            db, proposal.proposer.user_id,
            f"Proposal Update: {proposal.title}",
            f"Your proposal '{proposal.title}' is now: {proposal.status} ({proposal.current_stage}).",
            "Approval", "ApprovalProposal", proposal.id
        )

    db.commit()
    db.refresh(proposal)
    return proposal, msg
