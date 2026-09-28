from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


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
    id: int
    name: str
    code: str
    module: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system_role: bool
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


Token.model_rebuild()
