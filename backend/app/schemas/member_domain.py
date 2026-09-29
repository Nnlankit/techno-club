from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, ConfigDict


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role_title: str
    avatar_url: Optional[str] = None


class DomainResponse(DomainBase):
    model_config = ConfigDict(from_attributes=True)

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


class MemberBase(BaseModel):
    college_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = "Computer Science & Engineering"
    year_semester: Optional[str] = "1st Year / 1st Sem"
    domain_id: Optional[int] = None
    reports_to_id: Optional[int] = None
    role_title: Optional[str] = "Member"
    status: Optional[str] = "Active"
    skills: Optional[List[str]] = []
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class MemberCreate(MemberBase):
    password: Optional[str] = "TechnoClub@2026"
    role: Optional[str] = None
    role_id: Optional[int] = None
    designation: Optional[str] = None
    year: Optional[str] = None
    semester: Optional[str] = None
    joining_date: Optional[datetime] = None


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    college_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year_semester: Optional[str] = None
    domain_id: Optional[int] = None
    reports_to_id: Optional[int] = None
    role_id: Optional[int] = None
    role: Optional[str] = None
    role_title: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    college_id: str
    domain_name: Optional[str] = None
    role_name: Optional[str] = None
    reports_to_name: Optional[str] = None
    reports_to_role: Optional[str] = None
    joining_date: datetime
    created_at: datetime
    updated_at: datetime
    active_projects_count: int = 0
    completed_tasks_count: int = 0
    events_participated_count: int = 0
    achievements_count: int = 0


class ReportsToOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    full_name: Optional[str] = None
    email: str
    role: str
    role_title: Optional[str] = None
    domain_name: Optional[str] = None

