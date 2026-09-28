from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.member_domain import Member, Domain
from app.models.event_hackathon import Event, Hackathon
from app.models.project_task import Project, Task
from app.models.operations import Document, Announcement
from app.schemas.analytics import GlobalSearchResult, GlobalSearchResultItem

router = APIRouter()


@router.get("/", response_model=GlobalSearchResult)
def global_search(
    q: str = Query(..., min_length=2, description="Search term across all entities"),
    db: Session = Depends(get_db)
):
    query_str = f"%{q}%"
    results: List[GlobalSearchResultItem] = []

    # 1. Members
    members = db.query(Member).filter(
        or_(
            Member.full_name.ilike(query_str),
            Member.college_id.ilike(query_str),
            Member.email.ilike(query_str),
            Member.skills.ilike(query_str)
        )
    ).limit(5).all()
    for m in members:
        results.append(GlobalSearchResultItem(
            id=m.id,
            type="Member",
            title=m.full_name,
            subtitle=f"{m.college_id} • {m.role_title} ({m.department})",
            badge=m.status,
            url=f"/members?id={m.id}"
        ))

    # 2. Domains
    domains = db.query(Domain).filter(
        or_(
            Domain.name.ilike(query_str),
            Domain.code.ilike(query_str),
            Domain.description.ilike(query_str)
        )
    ).limit(5).all()
    for d in domains:
        results.append(GlobalSearchResultItem(
            id=d.id,
            type="Domain",
            title=d.name,
            subtitle=f"Code: {d.code} • {d.description[:60] if d.description else ''}...",
            badge="Domain",
            url=f"/domains?id={d.id}"
        ))

    # 3. Events
    events = db.query(Event).filter(
        or_(
            Event.name.ilike(query_str),
            Event.description.ilike(query_str),
            Event.venue.ilike(query_str),
            Event.event_type.ilike(query_str)
        )
    ).limit(5).all()
    for e in events:
        results.append(GlobalSearchResultItem(
            id=e.id,
            type="Event",
            title=e.name,
            subtitle=f"{e.event_type} at {e.venue} • {e.start_time.strftime('%b %d, %Y')}",
            badge=e.status,
            url=f"/events?id={e.id}"
        ))

    # 4. Hackathons
    hacks = db.query(Hackathon).filter(
        or_(
            Hackathon.title.ilike(query_str),
            Hackathon.theme.ilike(query_str),
            Hackathon.description.ilike(query_str)
        )
    ).limit(5).all()
    for h in hacks:
        results.append(GlobalSearchResultItem(
            id=h.id,
            type="Hackathon",
            title=h.title,
            subtitle=f"Theme: {h.theme}",
            badge=h.status,
            url=f"/hackathons?id={h.id}"
        ))

    # 5. Projects
    projects = db.query(Project).filter(
        or_(
            Project.name.ilike(query_str),
            Project.description.ilike(query_str)
        )
    ).limit(5).all()
    for p in projects:
        results.append(GlobalSearchResultItem(
            id=p.id,
            type="Project",
            title=p.name,
            subtitle=f"Lead: {p.lead.full_name if p.lead else ''} • Priority: {p.priority}",
            badge=p.status,
            url=f"/projects?id={p.id}"
        ))

    # 6. Tasks
    tasks = db.query(Task).filter(
        or_(
            Task.title.ilike(query_str),
            Task.description.ilike(query_str)
        )
    ).limit(5).all()
    for t in tasks:
        results.append(GlobalSearchResultItem(
            id=t.id,
            type="Task",
            title=t.title,
            subtitle=f"Assignee: {t.assignee.full_name if t.assignee else 'Unassigned'}",
            badge=t.status,
            url=f"/tasks?id={t.id}"
        ))

    # 7. Documents
    docs = db.query(Document).filter(
        or_(
            Document.title.ilike(query_str),
            Document.file_name.ilike(query_str),
            Document.category.ilike(query_str)
        )
    ).limit(5).all()
    for doc in docs:
        results.append(GlobalSearchResultItem(
            id=doc.id,
            type="Document",
            title=doc.title,
            subtitle=f"Category: {doc.category} ({doc.file_name})",
            badge="Doc",
            url=doc.file_path
        ))

    return GlobalSearchResult(
        query=q,
        total_results=len(results),
        results=results
    )
