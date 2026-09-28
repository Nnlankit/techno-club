from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr


class DomainBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: Optional[str] = "Cpu"
    color: Optional[str] = "#3B82F6"
    is_active: Optional[bool] = True


class DomainCreate(DomainBase):
    head_id: Optional[int] = None
    co_head_id: Optional[int] = None


class DomainUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    head_id: Optional[int] = None
    co_head_id: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class DomainMemberSummary(BaseModel):
    id: int
    full_name: str
    email: str
    role_title: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class DomainResponse(DomainBase):
    id: int
    head_id: Optional[int] = None
    co_head_id: Optional[int] = None
    head_name: Optional[str] = None
    co_head_name: Optional[str] = None
    members_count: int = 0
    active_projects_count: int = 0
    tasks_count: int = 0
    events_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberBase(BaseModel):
    college_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    year_semester: str
    domain_id: Optional[int] = None
    role_title: str = "Member"
    status: str = "Active"
    skills: Optional[List[str]] = []
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class MemberCreate(MemberBase):
    password: Optional[str] = "TechnoClub@2026"
    role_id: Optional[int] = None


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year_semester: Optional[str] = None
    domain_id: Optional[int] = None
    role_title: Optional[str] = None
    status: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class MemberResponse(MemberBase):
    id: int
    user_id: int
    domain_name: Optional[str] = None
    joining_date: datetime
    created_at: datetime
    updated_at: datetime
    active_projects_count: int = 0
    completed_tasks_count: int = 0
    events_participated_count: int = 0
    achievements_count: int = 0

    class Config:
        from_attributes = True
