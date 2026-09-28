from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event_hackathon import Event, Hackathon
from app.models.operations import Meeting
from app.models.project_task import Project, Task

router = APIRouter()


@router.get("/")
def get_unified_calendar(
    domain_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    calendar_items = []

    # 1. Events
    ev_query = db.query(Event)
    if domain_id:
        ev_query = ev_query.filter(Event.domain_id == domain_id)
    events = ev_query.all()
    for e in events:
        calendar_items.append({
            "id": f"event-{e.id}",
            "raw_id": e.id,
            "title": e.name,
            "category": "Event",
            "type_badge": e.event_type,
            "start": e.start_time.isoformat(),
            "end": e.end_time.isoformat(),
            "venue": e.venue,
            "color": "#3B82F6",
            "status": e.status,
            "domain_name": e.domain.name if e.domain else "Club-Wide"
        })

    # 2. Hackathons
    hacks = db.query(Hackathon).all()
    for h in hacks:
        calendar_items.append({
            "id": f"hack-{h.id}",
            "raw_id": h.id,
            "title": h.title,
            "category": "Hackathon",
            "type_badge": "Hackathon",
            "start": h.start_date.isoformat(),
            "end": h.end_date.isoformat(),
            "venue": "Campus / Hybrid",
            "color": "#8B5CF6",
            "status": h.status,
            "domain_name": "Flagship"
        })

    # 3. Meetings
    m_query = db.query(Meeting)
    if domain_id:
        m_query = m_query.filter(Meeting.domain_id == domain_id)
    meetings = m_query.all()
    for m in meetings:
        calendar_items.append({
            "id": f"meeting-{m.id}",
            "raw_id": m.id,
            "title": m.title,
            "category": "Meeting",
            "type_badge": m.meeting_type,
            "start": m.scheduled_at.isoformat(),
            "end": m.scheduled_at.isoformat(),
            "venue": m.location,
            "color": "#10B981",
            "status": m.status,
            "domain_name": m.domain.name if m.domain else "Executive"
        })

    # 4. Project Deadlines
    p_query = db.query(Project)
    if domain_id:
        p_query = p_query.filter(Project.domain_id == domain_id)
    projects = p_query.all()
    for p in projects:
        calendar_items.append({
            "id": f"project-{p.id}",
            "raw_id": p.id,
            "title": f"Deadline: {p.name}",
            "category": "Project Deadline",
            "type_badge": p.priority,
            "start": p.target_date.isoformat(),
            "end": p.target_date.isoformat(),
            "venue": "Repo Delivery",
            "color": "#F59E0B",
            "status": p.status,
            "domain_name": p.domain.name if p.domain else "Cross-Domain"
        })

    # 5. Task Deadlines
    t_query = db.query(Task).filter(Task.due_date != None)
    if domain_id:
        t_query = t_query.filter(Task.domain_id == domain_id)
    tasks = t_query.all()
    for t in tasks:
        calendar_items.append({
            "id": f"task-{t.id}",
            "raw_id": t.id,
            "title": f"Task Due: {t.title}",
            "category": "Task",
            "type_badge": t.priority,
            "start": t.due_date.isoformat(),
            "end": t.due_date.isoformat(),
            "venue": t.assignee.full_name if t.assignee else "Unassigned",
            "color": "#EF4444" if t.priority in ["High", "Urgent"] else "#64748B",
            "status": t.status,
            "domain_name": t.domain.name if t.domain else None
        })

    return calendar_items
