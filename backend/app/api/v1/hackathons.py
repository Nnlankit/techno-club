import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.event_hackathon import Hackathon, HackathonTeam, HackathonSubmission
from app.schemas.event_hackathon import (
    HackathonCreate, HackathonUpdate, HackathonResponse,
    HackathonTeamCreate, HackathonTeamResponse,
    HackathonSubmissionCreate, HackathonSubmissionResponse,
    HackathonScoreCreate
)
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_hackathon_response(h: Hackathon, db: Session) -> HackathonResponse:
    teams_cnt = db.query(HackathonTeam).filter(HackathonTeam.hackathon_id == h.id).count()
    subs_cnt = db.query(HackathonSubmission).filter(HackathonSubmission.hackathon_id == h.id).count()

    return HackathonResponse(
        id=h.id,
        title=h.title,
        theme=h.theme,
        description=h.description,
        problem_statements=json.loads(h.problem_statements or "[]"),
        rules=h.rules,
        eligibility=h.eligibility,
        start_date=h.start_date,
        end_date=h.end_date,
        registration_deadline=h.registration_deadline,
        min_team_size=h.min_team_size,
        max_team_size=h.max_team_size,
        status=h.status,
        evaluation_criteria=json.loads(h.evaluation_criteria or "[]"),
        mentors=json.loads(h.mentors or "[]"),
        judges=json.loads(h.judges or "[]"),
        prizes=json.loads(h.prizes or "[]"),
        banner_url=h.banner_url,
        teams_count=teams_cnt,
        submissions_count=subs_cnt,
        created_at=h.created_at,
        updated_at=h.updated_at
    )


@router.get("/", response_model=List[HackathonResponse])
def get_all_hackathons(db: Session = Depends(get_db)):
    hackathons = db.query(Hackathon).order_by(desc(Hackathon.start_date)).all()
    return [build_hackathon_response(h, db) for h in hackathons]


@router.get("/{hackathon_id}", response_model=HackathonResponse)
def get_hackathon_by_id(hackathon_id: int, db: Session = Depends(get_db)):
    h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return build_hackathon_response(h, db)


@router.post("/", response_model=HackathonResponse)
def create_hackathon(
    payload: HackathonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    new_h = Hackathon(
        title=payload.title,
        theme=payload.theme,
        description=payload.description,
        problem_statements=json.dumps(payload.problem_statements or []),
        rules=payload.rules,
        eligibility=payload.eligibility,
        start_date=payload.start_date,
        end_date=payload.end_date,
        registration_deadline=payload.registration_deadline,
        min_team_size=payload.min_team_size or 1,
        max_team_size=payload.max_team_size or 4,
        status=payload.status or "Proposal",
        evaluation_criteria=json.dumps(payload.evaluation_criteria or []),
        mentors=json.dumps(payload.mentors or []),
        judges=json.dumps(payload.judges or []),
        prizes=json.dumps(payload.prizes or []),
        banner_url=payload.banner_url
    )
    db.add(new_h)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Hackathon", new_h.id,
        f"{current_user.email} created Hackathon '{new_h.title}'"
    )

    db.commit()
    db.refresh(new_h)
    return build_hackathon_response(new_h, db)


@router.put("/{hackathon_id}", response_model=HackathonResponse)
def update_hackathon(
    hackathon_id: int,
    payload: HackathonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    update_data = payload.model_dump(exclude_unset=True)
    json_fields = ["problem_statements", "evaluation_criteria", "mentors", "judges", "prizes"]
    for f in json_fields:
        if f in update_data and update_data[f] is not None:
            update_data[f] = json.dumps(update_data[f])

    for k, v in update_data.items():
        setattr(h, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Hackathon", h.id,
        f"Hackathon '{h.title}' updated by {current_user.email}",
        diff=update_data
    )

    db.commit()
    db.refresh(h)
    return build_hackathon_response(h, db)


@router.post("/{hackathon_id}/teams", response_model=HackathonTeamResponse)
def register_team(
    hackathon_id: int,
    payload: HackathonTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    leader_id = payload.leader_id
    if not leader_id and current_user.member:
        leader_id = current_user.member.id

    team = HackathonTeam(
        hackathon_id=hackathon_id,
        name=payload.name,
        leader_id=leader_id,
        members_info=json.dumps(payload.members_info or []),
        project_name=payload.project_name,
        status="Registered"
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    return HackathonTeamResponse(
        id=team.id,
        hackathon_id=team.hackathon_id,
        name=team.name,
        team_code=team.team_code,
        leader_id=team.leader_id,
        leader_name=team.leader.full_name if team.leader else None,
        members_info=json.loads(team.members_info or "[]"),
        project_name=team.project_name,
        status=team.status,
        created_at=team.created_at,
        has_submission=False
    )


@router.get("/{hackathon_id}/teams", response_model=List[HackathonTeamResponse])
def get_hackathon_teams(hackathon_id: int, db: Session = Depends(get_db)):
    teams = db.query(HackathonTeam).filter(HackathonTeam.hackathon_id == hackathon_id).all()
    results = []
    for t in teams:
        results.append(HackathonTeamResponse(
            id=t.id,
            hackathon_id=t.hackathon_id,
            name=t.name,
            team_code=t.team_code,
            leader_id=t.leader_id,
            leader_name=t.leader.full_name if t.leader else None,
            members_info=json.loads(t.members_info or "[]"),
            project_name=t.project_name,
            status=t.status,
            created_at=t.created_at,
            has_submission=t.submission is not None
        ))
    return results


@router.post("/{hackathon_id}/submissions", response_model=HackathonSubmissionResponse)
def submit_project(
    hackathon_id: int,
    payload: HackathonSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(HackathonTeam).filter(HackathonTeam.id == payload.team_id).first()
    if not team or team.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Team not found in this hackathon")

    existing_sub = db.query(HackathonSubmission).filter(HackathonSubmission.team_id == team.id).first()
    if existing_sub:
        existing_sub.project_title = payload.project_title
        existing_sub.description = payload.description
        existing_sub.problem_statement_id = payload.problem_statement_id
        existing_sub.repo_url = payload.repo_url
        existing_sub.demo_url = payload.demo_url
        existing_sub.video_url = payload.video_url
        existing_sub.presentation_url = payload.presentation_url
        sub = existing_sub
    else:
        sub = HackathonSubmission(
            hackathon_id=hackathon_id,
            team_id=payload.team_id,
            project_title=payload.project_title,
            description=payload.description,
            problem_statement_id=payload.problem_statement_id,
            repo_url=payload.repo_url,
            demo_url=payload.demo_url,
            video_url=payload.video_url,
            presentation_url=payload.presentation_url
        )
        db.add(sub)

    team.status = "Submitted"
    team.project_name = payload.project_title

    db.commit()
    db.refresh(sub)

    return HackathonSubmissionResponse(
        id=sub.id,
        hackathon_id=sub.hackathon_id,
        team_id=sub.team_id,
        team_name=team.name,
        project_title=sub.project_title,
        description=sub.description,
        problem_statement_id=sub.problem_statement_id,
        repo_url=sub.repo_url,
        demo_url=sub.demo_url,
        video_url=sub.video_url,
        presentation_url=sub.presentation_url,
        scores=json.loads(sub.scores or "[]"),
        total_score=sub.total_score,
        rank=sub.rank,
        winner_category=sub.winner_category,
        judge_feedback=sub.judge_feedback,
        submitted_at=sub.submitted_at
    )


@router.post("/{hackathon_id}/submissions/{submission_id}/score", response_model=HackathonSubmissionResponse)
def score_submission(
    hackathon_id: int,
    submission_id: int,
    payload: HackathonScoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Technical Lead"]))
):
    sub = db.query(HackathonSubmission).filter(
        HackathonSubmission.id == submission_id,
        HackathonSubmission.hackathon_id == hackathon_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.scores = json.dumps(payload.scores)
    sub.total_score = payload.total_score
    if payload.rank is not None:
        sub.rank = payload.rank
    if payload.winner_category:
        sub.winner_category = payload.winner_category
    if payload.judge_feedback:
        sub.judge_feedback = payload.judge_feedback

    log_audit_event(
        db, current_user, "EVALUATE_HACKATHON", "HackathonSubmission", sub.id,
        f"{current_user.email} evaluated submission '{sub.project_title}': Score {sub.total_score}, Winner {sub.winner_category}"
    )

    db.commit()
    db.refresh(sub)

    return HackathonSubmissionResponse(
        id=sub.id,
        hackathon_id=sub.hackathon_id,
        team_id=sub.team_id,
        team_name=sub.team.name if sub.team else "Team",
        project_title=sub.project_title,
        description=sub.description,
        problem_statement_id=sub.problem_statement_id,
        repo_url=sub.repo_url,
        demo_url=sub.demo_url,
        video_url=sub.video_url,
        presentation_url=sub.presentation_url,
        scores=json.loads(sub.scores or "[]"),
        total_score=sub.total_score,
        rank=sub.rank,
        winner_category=sub.winner_category,
        judge_feedback=sub.judge_feedback,
        submitted_at=sub.submitted_at
    )


@router.get("/{hackathon_id}/leaderboard", response_model=List[HackathonSubmissionResponse])
def get_hackathon_leaderboard(hackathon_id: int, db: Session = Depends(get_db)):
    subs = db.query(HackathonSubmission).filter(
        HackathonSubmission.hackathon_id == hackathon_id
    ).order_by(desc(HackathonSubmission.total_score)).all()

    results = []
    for s in subs:
        results.append(HackathonSubmissionResponse(
            id=s.id,
            hackathon_id=s.hackathon_id,
            team_id=s.team_id,
            team_name=s.team.name if s.team else "Team",
            project_title=s.project_title,
            description=s.description,
            problem_statement_id=s.problem_statement_id,
            repo_url=s.repo_url,
            demo_url=s.demo_url,
            video_url=s.video_url,
            presentation_url=s.presentation_url,
            scores=json.loads(s.scores or "[]"),
            total_score=s.total_score,
            rank=s.rank,
            winner_category=s.winner_category,
            judge_feedback=s.judge_feedback,
            submitted_at=s.submitted_at
        ))
    return results
