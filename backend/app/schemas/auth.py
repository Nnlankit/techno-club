from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    module: str
    description: Optional[str] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    is_system_role: bool
    permissions: List[PermissionResponse] = []


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_id: int
    college_id: str
    full_name: str
    department: str
    year_semester: str
    phone: Optional[str] = None
    domain_id: Optional[int] = None
    role_title: Optional[str] = "Member"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: RoleResponse
    is_active: bool
    is_superuser: bool
    created_at: datetime
    member_id: Optional[int] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    college_id: Optional[str] = None
    domain_id: Optional[int] = None
    domain_name: Optional[str] = None
    role_title: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year_semester: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    joining_date: Optional[datetime] = None
    last_login: Optional[datetime] = None
    status: Optional[str] = "Active"
    active_projects_count: int = 0
    completed_tasks_count: int = 0
    events_participated_count: int = 0
    achievements_count: int = 0


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: Optional[str] = None


class PasswordChangeResponse(BaseModel):
    success: bool
    message: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year_semester: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None


class SecurityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    description: str
    ip_address: Optional[str] = None
    timestamp: datetime


Token.model_rebuild()
