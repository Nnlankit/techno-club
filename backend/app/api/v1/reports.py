import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User, Role
from app.models.member_domain import Member, Domain
from app.models.event_hackathon import Event, EventRegistration, EventAttendance, Hackathon
from app.models.project_task import Project, Task, Activity
from app.models.operations import (
    ApprovalProposal, Budget, Expense, Sponsor, Certificate, 
    Achievement, Announcement, Notification, Resource, Document, AuditLog
)
from app.schemas.analytics import (
    DashboardStatsResponse, MemberDashboardStatsResponse, DomainDashboardStatsResponse
)

router = APIRouter()


@router.get("/executive", response_model=DashboardStatsResponse)
def get_executive_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Faculty Coordinator", "Treasurer"]))
):
    total_members = db.query(Member).count()
    active_members = db.query(Member).filter(Member.status == "Active").count()
    total_domains = db.query(Domain).filter(Domain.is_active == True).count()
    
    active_projects = db.query(Project).filter(Project.status == "Active").count()
    completed_projects = db.query(Project).filter(Project.status == "Completed").count()
    
    now = datetime.now(timezone.utc)
    upcoming_events = db.query(Event).filter(Event.start_time >= now).count()
    ongoing_events = db.query(Event).filter(Event.start_time <= now, Event.end_time >= now).count()
    completed_events = db.query(Event).filter(Event.end_time < now).count()
    
    active_hackathons = db.query(Hackathon).filter(Hackathon.status.notin_(["Completed", "Archived"])).count()
    pending_approvals = db.query(ApprovalProposal).filter(ApprovalProposal.status.in_(["Draft", "Submitted", "Under Review", "Revision Required"])).count()
    pending_tasks = db.query(Task).filter(Task.status.in_(["Todo", "In Progress", "Blocked"])).count()
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()

    total_allocated = db.query(func.sum(Budget.total_allocated)).scalar() or 0.0
    total_spent = db.query(func.sum(Budget.total_spent)).scalar() or 0.0
    confirmed_sponsorship = db.query(func.sum(Sponsor.amount)).filter(Sponsor.stage.in_(["Confirmed", "Completed"])).scalar() or 0.0

    # Domain distribution
    domains = db.query(Domain).all()
    domain_dist = []
    for d in domains:
        m_count = db.query(Member).filter(Member.domain_id == d.id).count()
        p_count = db.query(Project).filter(Project.domain_id == d.id).count()
        domain_dist.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "color": d.color,
            "members": m_count,
            "projects": p_count
        })

    # Events by type
    event_types = db.query(Event.event_type, func.count(Event.id)).group_by(Event.event_type).all()
    events_by_type = [{"type": t, "count": c} for t, c in event_types]

    # Task status distribution
    task_statuses = db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
    task_dist = [{"status": s, "count": c} for s, c in task_statuses]

    # Recent activities
    recent_acts = db.query(Activity).order_by(Activity.created_at.desc()).limit(5).all()
    activities_list = [{
        "id": a.id,
        "title": a.title,
        "type": a.activity_type,
        "status": a.status,
        "date": a.start_date.isoformat()
    } for a in recent_acts]

    # Upcoming deadlines
    upcoming_tasks = db.query(Task).filter(
        Task.due_date >= now, Task.status != "Completed"
    ).order_by(Task.due_date.asc()).limit(5).all()
    deadlines_list = [{
        "id": t.id,
        "title": t.title,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "priority": t.priority,
        "assignee": t.assignee.full_name if t.assignee else "Unassigned"
    } for t in upcoming_tasks]

    # Recent announcements
    recent_ann = db.query(Announcement).order_by(Announcement.pinned.desc(), Announcement.created_at.desc()).limit(4).all()
    ann_list = [{
        "id": a.id,
        "title": a.title,
        "priority": a.priority,
        "created_at": a.created_at.isoformat()
    } for a in recent_ann]

    return DashboardStatsResponse(
        total_members=total_members,
        active_members=active_members,
        total_domains=total_domains,
        active_projects=active_projects,
        completed_projects=completed_projects,
        upcoming_events=upcoming_events,
        ongoing_events=ongoing_events,
        completed_events=completed_events,
        active_hackathons=active_hackathons,
        pending_approvals=pending_approvals,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        total_allocated_budget=float(total_allocated),
        total_spent_budget=float(total_spent),
        confirmed_sponsorship=float(confirmed_sponsorship),
        domain_distribution=domain_dist,
        events_by_type=events_by_type,
        task_status_distribution=task_dist,
        recent_activities=activities_list,
        upcoming_deadlines=deadlines_list,
        recent_announcements=ann_list
    )


@router.get("/member-dashboard", response_model=MemberDashboardStatsResponse)
def get_member_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = current_user.member
    member_id = member.id if member else 0

    assigned_tasks = db.query(Task).filter(Task.assignee_id == member_id).all()
    completed_tasks = [t for t in assigned_tasks if t.status == "Completed"]
    pending_tasks = [t for t in assigned_tasks if t.status != "Completed"]

    my_projects = []
    if member:
        for pm in member.project_memberships:
            p = pm.project
            my_projects.append({
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "priority": p.priority,
                "role": pm.role_in_project,
                "target_date": p.target_date.isoformat()
            })

    regs = db.query(EventRegistration).filter(EventRegistration.member_id == member_id).all()

    achievements = db.query(Achievement).filter(Achievement.member_id == member_id).all()
    certs = db.query(Certificate).filter(Certificate.recipient_member_id == member_id).all()
    unread_notifs = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()

    now = datetime.now(timezone.utc)
    upcoming_events = db.query(Event).filter(Event.end_time >= now).order_by(Event.start_time.asc()).limit(4).all()
    events_list = [{
        "id": e.id,
        "name": e.name,
        "event_type": e.event_type,
        "start_time": e.start_time.isoformat(),
        "venue": e.venue
    } for e in upcoming_events]

    return MemberDashboardStatsResponse(
        assigned_tasks_count=len(assigned_tasks),
        completed_tasks_count=len(completed_tasks),
        pending_tasks_count=len(pending_tasks),
        my_projects_count=len(my_projects),
        events_registered_count=len(regs),
        events_attended_count=0,
        achievements_count=len(achievements),
        certificates_count=len(certs),
        unread_notifications_count=unread_notifs,
        my_tasks=[{
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "project_name": t.project.name if t.project else None
        } for t in pending_tasks[:6]],
        my_projects=my_projects,
        upcoming_events=events_list,
        recent_achievements=[{
            "id": a.id,
            "title": a.title,
            "category": a.category,
            "badge_icon": a.badge_icon
        } for a in achievements[:4]]
    )


@router.get("/domain-dashboard", response_model=DomainDashboardStatsResponse)
def get_domain_dashboard(
    domain_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_role = current_user.role.name if current_user.role else "Member"
    user_domain_id = current_user.member.domain_id if current_user.member else None

    # If caller is Domain Head, lock strictly to their assigned domain
    if user_role in ["Domain Head", "Technical Lead"]:
        target_domain_id = user_domain_id or 1
    elif domain_id and user_role in ["President", "Vice President", "Faculty Coordinator"]:
        target_domain_id = domain_id
    else:
        target_domain_id = user_domain_id or 1

    domain = db.query(Domain).filter(Domain.id == target_domain_id).first()
    if not domain:
        domain = db.query(Domain).first()
        target_domain_id = domain.id if domain else 1

    domain_name = domain.name if domain else "AI & Machine Learning"

    members = db.query(Member).filter(Member.domain_id == target_domain_id).all()
    projects = db.query(Project).filter(Project.domain_id == target_domain_id).all()
    active_projects = [p for p in projects if p.status == "Active"]
    tasks = db.query(Task).filter(Task.domain_id == target_domain_id).all()
    pending_tasks = [t for t in tasks if t.status != "Completed"]
    now = datetime.now(timezone.utc)
    activities = db.query(Activity).filter(Activity.domain_id == target_domain_id).order_by(Activity.start_date.desc()).all()
    upcoming_activities = [a for a in activities if a.start_date >= now or a.status in ["Planning", "Scheduled"]]
    events = db.query(Event).filter(Event.domain_id == target_domain_id, Event.end_time >= now).order_by(Event.start_time.asc()).limit(4).all()
    announcements = db.query(Announcement).filter(
        or_(Announcement.domain_id == target_domain_id, Announcement.domain_id == None)
    ).order_by(Announcement.pinned.desc(), Announcement.created_at.desc()).limit(4).all()

    return DomainDashboardStatsResponse(
        domain_id=target_domain_id,
        domain_name=domain_name,
        members_count=len(members),
        active_projects_count=len(active_projects),
        upcoming_activities_count=len(upcoming_activities),
        pending_tasks_count=len(pending_tasks),
        domain_projects=[{
            "id": p.id,
            "name": p.name,
            "status": p.status,
            "priority": p.priority,
            "lead_name": p.lead.full_name if p.lead else "Unassigned",
            "target_date": p.target_date.isoformat() if p.target_date else None,
            "tasks_count": db.query(Task).filter(Task.project_id == p.id).count()
        } for p in projects[:6]],
        domain_tasks=[{
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "assignee_name": t.assignee.full_name if t.assignee else "Unassigned"
        } for t in pending_tasks[:8]],
        upcoming_events=[{
            "id": e.id,
            "name": e.name,
            "event_type": e.event_type,
            "start_time": e.start_time.isoformat(),
            "venue": e.venue
        } for e in events],
        team_members=[{
            "id": m.id,
            "full_name": m.full_name,
            "role_title": m.role_title,
            "avatar_url": m.avatar_url,
            "email": m.email,
            "status": m.status
        } for m in members[:10]],
        recent_activities=[{
            "id": a.id,
            "title": a.title,
            "activity_type": a.activity_type,
            "status": a.status,
            "date": a.start_date.isoformat()
        } for a in activities[:5]],
        announcements=[{
            "id": an.id,
            "title": an.title,
            "priority": an.priority,
            "created_at": an.created_at.isoformat()
        } for an in announcements]
    )


def generate_csv_data(entity: str, db: Session, current_user: User):
    user_role = current_user.role.name if current_user.role else "Member"
    if user_role == "Member":
        raise HTTPException(status_code=403, detail="Members cannot export club-wide CSV data")
    if entity in ["expenses", "sponsors", "audit"] and user_role not in ["President", "Treasurer", "Faculty Coordinator"]:
        raise HTTPException(status_code=403, detail=f"Your role ({user_role}) is not authorized to export {entity} data")
    output = io.StringIO()
    writer = csv.writer(output)

    if entity == "members":
        writer.writerow(["ID", "College ID", "Full Name", "Email", "Department", "Year/Sem", "Role", "Domain", "Status"])
        members = db.query(Member).all()
        for m in members:
            writer.writerow([
                m.id, m.college_id, m.full_name, m.email, m.department,
                m.year_semester, m.role_title, m.domain.name if m.domain else "Unassigned", m.status
            ])
    elif entity == "events":
        writer.writerow(["ID", "Event Name", "Type", "Domain", "Venue", "Start Time", "End Time", "Budget", "Status"])
        events = db.query(Event).all()
        for e in events:
            writer.writerow([
                e.id, e.name, e.event_type, e.domain.name if e.domain else "Club-Wide",
                e.venue, e.start_time.isoformat(), e.end_time.isoformat(), e.budget, e.status
            ])
    elif entity == "expenses":
        writer.writerow(["ID", "Title", "Category", "Amount", "Incurred By", "Status", "Date"])
        expenses = db.query(Expense).all()
        for ex in expenses:
            writer.writerow([
                ex.id, ex.title, ex.category, ex.amount,
                ex.incurred_by.full_name if ex.incurred_by else "", ex.status, ex.date_incurred.isoformat()
            ])
    elif entity == "tasks":
        writer.writerow(["ID", "Title", "Project", "Domain", "Assignee", "Priority", "Status", "Due Date"])
        tasks = db.query(Task).all()
        for t in tasks:
            writer.writerow([
                t.id, t.title, t.project.name if t.project else "",
                t.domain.name if t.domain else "", t.assignee.full_name if t.assignee else "Unassigned",
                t.priority, t.status, t.due_date.isoformat() if t.due_date else ""
            ])
    elif entity == "projects":
        writer.writerow(["ID", "Name", "Domain", "Lead", "Priority", "Status", "Target Date", "Members Count"])
        projects = db.query(Project).all()
        for p in projects:
            writer.writerow([
                p.id, p.name, p.domain.name if p.domain else "Club-Wide",
                p.lead.full_name if p.lead else "Unassigned",
                p.priority, p.status, p.target_date.isoformat() if p.target_date else "",
                len(p.members)
            ])
    elif entity == "sponsors":
        writer.writerow(["ID", "Company Name", "Contact Person", "Email", "Tier", "Stage", "Amount", "MOU Signed", "Payment Status"])
        sponsors = db.query(Sponsor).all()
        for s in sponsors:
            writer.writerow([
                s.id, s.company_name, s.contact_person, s.email,
                s.tier, s.stage, s.amount, "Yes" if s.mou_signed else "No", s.payment_status
            ])
    elif entity == "attendance":
        writer.writerow(["ID", "Event ID", "Event Name", "Attendee Name", "Email", "Status", "Attended At"])
        records = db.query(EventAttendance).all()
        for a in records:
            writer.writerow([
                a.id, a.event_id, a.event.name if a.event else "",
                a.member.full_name if a.member else "Guest",
                a.member.email if a.member else "",
                a.status, a.attended_at.isoformat() if a.attended_at else ""
            ])
    elif entity == "audit":
        writer.writerow(["ID", "Timestamp", "User Email", "Role", "Action", "Entity", "Entity ID", "Description", "IP Address"])
        audits = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(500).all()
        for al in audits:
            writer.writerow([
                al.id, al.timestamp.isoformat() if al.timestamp else "",
                al.user_email, al.role, al.action, al.entity, al.entity_id or "",
                al.description, al.ip_address or ""
            ])
    else:
        raise HTTPException(status_code=400, detail="Invalid entity for CSV export")

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=techno_club_{entity}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/export-csv")
def export_csv_report(
    entity: str = Query("members", description="members | events | expenses | tasks"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return generate_csv_data(entity, db, current_user)


@router.get("/export-csv/{entity}")
def export_csv_report_path(
    entity: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return generate_csv_data(entity, db, current_user)
