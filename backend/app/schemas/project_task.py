from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class ProjectBase(BaseModel):
    name: str
    description: str
    objective: Optional[str] = None
    domain_id: Optional[int] = None
    secondary_domains: Optional[List[str]] = []
    project_lead_id: int
    start_date: datetime
    target_date: datetime
    completed_date: Optional[datetime] = None
    status: Optional[str] = "Planning"  # Planning, Active, On Hold, Review, Completed, Archived
    priority: Optional[str] = "Medium"  # Low, Medium, High, Critical
    milestones: Optional[List[Dict[str, Any]]] = []
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    final_report: Optional[str] = None


class ProjectCreate(ProjectBase):
    team_member_ids: Optional[List[int]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    objective: Optional[str] = None
    domain_id: Optional[int] = None
    secondary_domains: Optional[List[str]] = None
    project_lead_id: Optional[int] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    final_report: Optional[str] = None


class ProjectMemberResponse(BaseModel):
    id: int
    member_id: int
    member_name: str
    member_email: str
    role_in_project: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    id: int
    domain_name: Optional[str] = None
    lead_name: Optional[str] = None
    members: List[ProjectMemberResponse] = []
    total_tasks_count: int = 0
    completed_tasks_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskCommentBase(BaseModel):
    comment: str


class TaskCommentCreate(TaskCommentBase):
    pass


class TaskCommentResponse(TaskCommentBase):
    id: int
    task_id: int
    author_id: int
    author_name: str
    author_avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[int] = None
    domain_id: Optional[int] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = "Medium"  # Low, Medium, High, Urgent
    status: Optional[str] = "Todo"  # Todo, In Progress, Review, Completed, Blocked
    subtasks: Optional[List[Dict[str, Any]]] = []
    attachments: Optional[List[Dict[str, Any]]] = []
    dependencies: Optional[List[int]] = []
    estimated_hours: Optional[float] = 0.0
    actual_hours: Optional[float] = 0.0


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[int] = None
    domain_id: Optional[int] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    subtasks: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    dependencies: Optional[List[int]] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None


class TaskResponse(TaskBase):
    id: int
    project_name: Optional[str] = None
    domain_name: Optional[str] = None
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None
    comments_count: int = 0
    comments: List[TaskCommentResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityBase(BaseModel):
    title: str
    activity_type: str
    description: str
    domain_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    start_date: datetime
    end_date: datetime
    venue: Optional[str] = None
    status: Optional[str] = "Planned"
    budget: Optional[float] = 0.0
    participants_count: Optional[int] = 0
    outcomes: Optional[str] = None
    documentation: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    activity_type: Optional[str] = None
    description: Optional[str] = None
    domain_id: Optional[int] = None
    coordinator_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    venue: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    participants_count: Optional[int] = None
    outcomes: Optional[str] = None
    documentation: Optional[str] = None


class ActivityResponse(ActivityBase):
    id: int
    domain_name: Optional[str] = None
    coordinator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
