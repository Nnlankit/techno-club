from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    # Core KPIs
    total_members: int
    active_members: int
    total_domains: int
    active_projects: int
    completed_projects: int
    upcoming_events: int
    ongoing_events: int
    completed_events: int
    active_hackathons: int
    pending_approvals: int
    pending_tasks: int
    completed_tasks: int
    
    # Financial metrics
    total_allocated_budget: float
    total_spent_budget: float
    confirmed_sponsorship: float
    
    # Graphs & distributions
    domain_distribution: List[Dict[str, Any]] = []
    events_by_type: List[Dict[str, Any]] = []
    task_status_distribution: List[Dict[str, Any]] = []
    recent_activities: List[Dict[str, Any]] = []
    upcoming_deadlines: List[Dict[str, Any]] = []
    recent_announcements: List[Dict[str, Any]] = []


class MemberDashboardStatsResponse(BaseModel):
    assigned_tasks_count: int
    completed_tasks_count: int
    pending_tasks_count: int
    my_projects_count: int
    events_registered_count: int
    events_attended_count: int
    achievements_count: int
    certificates_count: int
    unread_notifications_count: int
    my_tasks: List[Dict[str, Any]] = []
    my_projects: List[Dict[str, Any]] = []
    upcoming_events: List[Dict[str, Any]] = []
    recent_achievements: List[Dict[str, Any]] = []


class GlobalSearchResultItem(BaseModel):
    id: int
    type: str  # Member, Domain, Event, Project, Task, Hackathon, Document, Announcement
    title: str
    subtitle: Optional[str] = None
    badge: Optional[str] = None
    url: str


class GlobalSearchResult(BaseModel):
    query: str
    total_results: int
    results: List[GlobalSearchResultItem] = []
