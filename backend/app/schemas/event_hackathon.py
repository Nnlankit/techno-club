from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, ConfigDict


class EventBase(BaseModel):
    name: str
    event_type: str
    description: str
    domain_id: Optional[int] = None
    organizer_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    venue: str
    capacity: Optional[int] = 100
    registration_deadline: Optional[datetime] = None
    budget: Optional[float] = 0.0
    status: Optional[str] = "Draft"
    speakers: Optional[List[Dict[str, Any]]] = []
    judges: Optional[List[Dict[str, Any]]] = []
    coordinators: Optional[List[Dict[str, Any]]] = []
    volunteers: Optional[List[Dict[str, Any]]] = []
    sponsors: Optional[List[Dict[str, Any]]] = []
    banner_url: Optional[str] = None
    report_summary: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    domain_id: Optional[int] = None
    organizer_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    speakers: Optional[List[Dict[str, Any]]] = None
    judges: Optional[List[Dict[str, Any]]] = None
    coordinators: Optional[List[Dict[str, Any]]] = None
    volunteers: Optional[List[Dict[str, Any]]] = None
    sponsors: Optional[List[Dict[str, Any]]] = None
    banner_url: Optional[str] = None
    report_summary: Optional[str] = None


class EventResponse(EventBase):
    id: int
    domain_name: Optional[str] = None
    organizer_name: Optional[str] = None
    registered_count: int = 0
    attended_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRegistrationCreate(BaseModel):
    event_id: int
    member_id: Optional[int] = None
    guest_name: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_college_id: Optional[str] = None
    guest_phone: Optional[str] = None


class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    event_name: Optional[str] = None
    member_id: Optional[int] = None
    attendee_name: str
    attendee_email: str
    college_id: Optional[str] = None
    status: str
    qr_code_token: str
    registered_at: datetime
    attended: bool = False

    model_config = ConfigDict(from_attributes=True)


class EventAttendanceCreate(BaseModel):
    event_id: int
    qr_code_token: Optional[str] = None
    registration_id: Optional[int] = None
    member_id: Optional[int] = None
    method: Optional[str] = "QR_SCAN"
    notes: Optional[str] = None


class EventAttendanceResponse(BaseModel):
    id: int
    event_id: int
    attendee_name: str
    attendee_email: str
    college_id: Optional[str] = None
    method: str
    marked_at: datetime
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HackathonBase(BaseModel):
    title: str
    theme: str
    description: str
    problem_statements: Optional[List[Dict[str, Any]]] = []
    rules: str
    eligibility: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    min_team_size: Optional[int] = 1
    max_team_size: Optional[int] = 4
    status: Optional[str] = "Proposal"
    evaluation_criteria: Optional[List[Dict[str, Any]]] = []
    mentors: Optional[List[Dict[str, Any]]] = []
    judges: Optional[List[Dict[str, Any]]] = []
    prizes: Optional[List[Dict[str, Any]]] = []
    banner_url: Optional[str] = None


class HackathonCreate(HackathonBase):
    pass


class HackathonUpdate(BaseModel):
    title: Optional[str] = None
    theme: Optional[str] = None
    description: Optional[str] = None
    problem_statements: Optional[List[Dict[str, Any]]] = None
    rules: Optional[str] = None
    eligibility: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    min_team_size: Optional[int] = None
    max_team_size: Optional[int] = None
    status: Optional[str] = None
    evaluation_criteria: Optional[List[Dict[str, Any]]] = None
    mentors: Optional[List[Dict[str, Any]]] = None
    judges: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    banner_url: Optional[str] = None


class HackathonResponse(HackathonBase):
    id: int
    teams_count: int = 0
    submissions_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HackathonTeamCreate(BaseModel):
    hackathon_id: int
    name: str
    leader_id: int
    members_info: Optional[List[Dict[str, Any]]] = []
    project_name: Optional[str] = None


class HackathonTeamResponse(BaseModel):
    id: int
    hackathon_id: int
    name: str
    team_code: str
    leader_id: int
    leader_name: Optional[str] = None
    members_info: List[Dict[str, Any]] = []
    project_name: Optional[str] = None
    status: str
    created_at: datetime
    has_submission: bool = False

    model_config = ConfigDict(from_attributes=True)


class HackathonSubmissionCreate(BaseModel):
    hackathon_id: int
    team_id: int
    project_title: str
    description: str
    problem_statement_id: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    presentation_url: Optional[str] = None


class HackathonScoreCreate(BaseModel):
    scores: List[Dict[str, Any]]
    total_score: float
    rank: Optional[int] = None
    winner_category: Optional[str] = None
    judge_feedback: Optional[str] = None


class HackathonSubmissionResponse(BaseModel):
    id: int
    hackathon_id: int
    team_id: int
    team_name: Optional[str] = None
    project_title: str
    description: str
    problem_statement_id: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    presentation_url: Optional[str] = None
    scores: List[Dict[str, Any]] = []
    total_score: float = 0.0
    rank: Optional[int] = None
    winner_category: Optional[str] = None
    judge_feedback: Optional[str] = None
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)
