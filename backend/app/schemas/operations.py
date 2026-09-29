from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, ConfigDict


# Approvals
class ApprovalProposalCreate(BaseModel):
    title: str
    proposal_type: str  # Event, Hackathon, Budget, Project, Activity, Resource, Sponsorship, Custom
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    priority: Optional[str] = "Normal"
    description: str
    requested_budget: Optional[float] = 0.0
    remarks: Optional[str] = None


class ApprovalAction(BaseModel):
    action: str  # Approve, Reject, Request Revision
    comments: Optional[str] = None


class ApprovalProposalResponse(BaseModel):
    id: int
    title: str
    proposal_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    proposer_id: int
    proposer_name: Optional[str] = None
    current_stage: str
    status: str
    priority: str
    description: str
    requested_budget: float
    remarks: Optional[str] = None
    history: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Meetings
class MeetingCreate(BaseModel):
    title: str
    meeting_type: str
    domain_id: Optional[int] = None
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60
    location: Optional[str] = "Club Room / Lab 4"
    meeting_link: Optional[str] = None
    agenda: str
    attendee_ids: Optional[List[int]] = []


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    meeting_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    agenda: Optional[str] = None
    minutes_of_meeting: Optional[str] = None
    decisions: Optional[str] = None
    action_items: Optional[List[Dict[str, Any]]] = None
    attendee_ids: Optional[List[int]] = None
    status: Optional[str] = None


class MeetingResponse(BaseModel):
    id: int
    title: str
    meeting_type: str
    domain_id: Optional[int] = None
    domain_name: Optional[str] = None
    organizer_id: Optional[int] = None
    organizer_name: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int
    location: str
    meeting_link: Optional[str] = None
    agenda: str
    minutes_of_meeting: Optional[str] = None
    decisions: Optional[str] = None
    action_items: List[Dict[str, Any]] = []
    attendee_ids: List[int] = []
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Resources
class ResourceCreate(BaseModel):
    name: str
    category: str  # Physical, Digital
    resource_type: str  # Laptop, Arduino, Raspberry Pi, Sensor Kit, etc.
    identifier: str
    quantity: Optional[int] = 1
    status: Optional[str] = "Available"
    location: Optional[str] = "Tech Club Hardware Locker"
    specifications: Optional[Dict[str, Any]] = {}
    notes: Optional[str] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    resource_type: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    assigned_to_id: Optional[int] = None
    specifications: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class ResourceAssignmentCreate(BaseModel):
    resource_id: int
    member_id: int
    project_id: Optional[int] = None
    return_due_date: datetime


class ResourceResponse(BaseModel):
    id: int
    name: str
    category: str
    resource_type: str
    identifier: str
    quantity: int
    available_quantity: int
    status: str
    location: str
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    specifications: Dict[str, Any] = {}
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Finance
class BudgetCreate(BaseModel):
    title: str
    fiscal_year: Optional[str] = "2025-2026"
    domain_id: Optional[int] = None
    event_id: Optional[int] = None
    total_allocated: float
    notes: Optional[str] = None


class BudgetResponse(BaseModel):
    id: int
    title: str
    fiscal_year: str
    domain_id: Optional[int] = None
    event_id: Optional[int] = None
    total_allocated: float
    total_spent: float
    remaining_budget: float = 0.0
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseCreate(BaseModel):
    budget_id: Optional[int] = None
    event_id: Optional[int] = None
    domain_id: Optional[int] = None
    title: str
    category: str
    amount: float
    receipt_url: Optional[str] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    status: Optional[str] = None  # Pending, Approved, Reimbursed, Rejected
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    budget_id: Optional[int] = None
    event_id: Optional[int] = None
    event_name: Optional[str] = None
    domain_id: Optional[int] = None
    title: str
    category: str
    amount: float
    receipt_url: Optional[str] = None
    incurred_by_id: Optional[int] = None
    incurred_by_name: Optional[str] = None
    status: str
    approved_by_id: Optional[int] = None
    notes: Optional[str] = None
    date_incurred: datetime

    model_config = ConfigDict(from_attributes=True)


# Sponsors
class SponsorCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    tier: Optional[str] = "Silver"
    stage: Optional[str] = "Prospect"
    amount: Optional[float] = 0.0
    event_id: Optional[int] = None
    benefits: Optional[str] = None
    mou_signed: Optional[bool] = False
    payment_status: Optional[str] = "Pending"
    notes: Optional[str] = None


class SponsorUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    tier: Optional[str] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    event_id: Optional[int] = None
    benefits: Optional[str] = None
    mou_signed: Optional[bool] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class SponsorResponse(BaseModel):
    id: int
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    tier: str
    stage: str
    amount: float
    event_id: Optional[int] = None
    event_name: Optional[str] = None
    benefits: Optional[str] = None
    mou_signed: bool
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Certificates
class CertificateCreate(BaseModel):
    title: str
    certificate_type: str  # Participation, Winner, Runner-Up, Speaker, Organizer, Core Team, etc.
    recipient_name: str
    recipient_email: EmailStr
    recipient_member_id: Optional[int] = None
    event_id: Optional[int] = None
    hackathon_id: Optional[int] = None
    metadata_info: Optional[Dict[str, Any]] = {}


class CertificateUpdate(BaseModel):
    title: Optional[str] = None
    certificate_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    status: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None


class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    verification_code: str
    title: str
    certificate_type: str
    recipient_name: str
    recipient_email: str
    event_id: Optional[int] = None
    event_name: Optional[str] = None
    hackathon_id: Optional[int] = None
    issue_date: datetime
    file_url: Optional[str] = None
    status: str
    metadata_info: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate_id: Optional[str] = None
    title: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    certificate_type: Optional[str] = None
    issue_date: Optional[datetime] = None
    status: Optional[str] = None
    event_name: Optional[str] = None
    verification_code: Optional[str] = None
    file_url: Optional[str] = None
    verification_message: str
    certificate: Optional[Dict[str, Any]] = None


# Achievements
class AchievementCreate(BaseModel):
    member_id: int
    title: str
    category: str
    description: str
    event_id: Optional[int] = None
    badge_icon: Optional[str] = "Trophy"
    proof_url: Optional[str] = None
    is_featured: Optional[bool] = False


class AchievementUpdate(BaseModel):
    member_id: Optional[int] = None
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    event_id: Optional[int] = None
    badge_icon: Optional[str] = None
    proof_url: Optional[str] = None
    is_featured: Optional[bool] = None


class AchievementResponse(BaseModel):
    id: int
    member_id: int
    member_name: Optional[str] = None
    title: str
    category: str
    description: str
    event_id: Optional[int] = None
    badge_icon: str
    achievement_date: datetime
    proof_url: Optional[str] = None
    is_featured: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Announcements
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    domain_id: Optional[int] = None
    target_role: Optional[str] = "All"
    priority: Optional[str] = "Normal"
    pinned: Optional[bool] = False
    expires_at: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    domain_id: Optional[int] = None
    target_role: Optional[str] = None
    priority: Optional[str] = None
    pinned: Optional[bool] = None
    expires_at: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    domain_id: Optional[int] = None
    domain_name: Optional[str] = None
    target_role: str
    priority: str
    pinned: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Notifications
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    priority: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Documents
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    domain_id: Optional[int] = None
    event_id: Optional[int] = None
    project_id: Optional[int] = None
    is_public: Optional[bool] = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    domain_id: Optional[int] = None
    domain_name: Optional[str] = None
    event_id: Optional[int] = None
    event_name: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    file_path: str
    file_name: str
    file_size: int
    file_type: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    is_public: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    role: str
    action: str
    entity: str
    entity_id: Optional[int] = None
    description: str
    diff_json: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
