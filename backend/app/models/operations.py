from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApprovalProposal(Base):
    __tablename__ = "approval_proposals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    proposal_type = Column(String(50), index=True, nullable=False)  # Event, Hackathon, Budget, Project, Activity, Resource, Sponsorship, Custom
    entity_type = Column(String(50), nullable=True)  # 'Event', 'Project', etc.
    entity_id = Column(Integer, nullable=True)
    proposer_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    current_stage = Column(String(50), default="Domain Review", nullable=False)  # Domain Review, Vice President Review, President Approval, Completed
    status = Column(String(30), default="Draft", index=True, nullable=False)  # Draft, Submitted, Under Review, Approved, Rejected, Revision Required, Completed
    priority = Column(String(20), default="Normal", nullable=False)  # Normal, High, Urgent
    description = Column(Text, nullable=False)
    requested_budget = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
    history = Column(Text, default="[]")  # JSON: [{"stage": "...", "reviewer": "...", "action": "...", "timestamp": "...", "comments": "..."}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    proposer = relationship("Member", foreign_keys=[proposer_id])


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    meeting_type = Column(String(50), index=True, nullable=False)  # Executive Leadership, Domain Sync, Core Team, Project Standup, Event Briefing, General Body
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    organizer_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    location = Column(String(150), default="Club Room / Lab 4")
    meeting_link = Column(String(255), nullable=True)
    agenda = Column(Text, nullable=False)
    minutes_of_meeting = Column(Text, nullable=True)
    decisions = Column(Text, nullable=True)
    action_items = Column(Text, default="[]")  # JSON: [{"item": "Draft budget", "assignee": "John", "due": "2026-10-05"}]
    attendee_ids = Column(Text, default="[]")  # JSON list
    status = Column(String(20), default="Scheduled")  # Scheduled, Ongoing, Completed, Cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    domain = relationship("Domain")
    organizer = relationship("Member", foreign_keys=[organizer_id])


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    category = Column(String(30), nullable=False)  # Physical, Digital
    resource_type = Column(String(50), nullable=False)  # Laptop, Arduino, Raspberry Pi, Sensor Kit, Camera, Projector, Lab Equipment, Software License, Cloud Account, etc.
    identifier = Column(String(100), unique=True, index=True, nullable=False)  # Serial No / License Key / Asset Tag
    quantity = Column(Integer, default=1)
    available_quantity = Column(Integer, default=1)
    status = Column(String(30), default="Available")  # Available, Assigned, Under Maintenance, Lost/Damaged
    location = Column(String(100), default="Tech Club Hardware Locker")
    assigned_to_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    specifications = Column(Text, default="{}")  # JSON
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    assigned_to = relationship("Member", foreign_keys=[assigned_to_id])
    assignments = relationship("ResourceAssignment", back_populates="resource", cascade="all, delete-orphan")


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    assigned_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    return_due_date = Column(DateTime, nullable=False)
    returned_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="Active")  # Active, Returned, Overdue, Issue Reported

    # Relationships
    resource = relationship("Resource", back_populates="assignments")
    member = relationship("Member")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    fiscal_year = Column(String(20), default="2025-2026")
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    total_allocated = Column(Float, default=0.0)
    total_spent = Column(Float, default=0.0)
    status = Column(String(20), default="Approved")  # Draft, Approved, Locked
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # Venue/Logistics, Food & Refreshments, Prizes & Swag, Hardware, Printing, etc.
    amount = Column(Float, nullable=False)
    receipt_url = Column(String(255), nullable=True)
    incurred_by_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="Pending")  # Pending, Approved, Reimbursed, Rejected
    approved_by_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    date_incurred = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event", back_populates="expenses")
    incurred_by = relationship("Member", foreign_keys=[incurred_by_id])
    approved_by = relationship("Member", foreign_keys=[approved_by_id])


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), index=True, nullable=False)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(25), nullable=True)
    website = Column(String(255), nullable=True)
    tier = Column(String(50), default="Silver")  # Title, Platinum, Gold, Silver, Knowledge Partner, Food Partner
    stage = Column(String(30), default="Prospect", index=True, nullable=False)  # Prospect, Contacted, Proposal Sent, Negotiation, Confirmed, Completed
    amount = Column(Float, default=0.0)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    benefits = Column(Text, nullable=True)
    mou_signed = Column(Boolean, default=False)
    payment_status = Column(String(20), default="Pending")  # Pending, Partial, Received
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), unique=True, index=True, nullable=False)  # TC-2026-AIML-001
    verification_code = Column(String(64), unique=True, default=lambda: uuid.uuid4().hex, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    certificate_type = Column(String(50), nullable=False)  # Participation, Winner, Runner-Up, Speaker, Organizer, Core Team, etc.
    recipient_name = Column(String(100), index=True, nullable=False)
    recipient_email = Column(String(120), index=True, nullable=False)
    recipient_member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="SET NULL"), nullable=True)
    issue_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    file_url = Column(String(255), nullable=True)
    status = Column(String(20), default="Active")  # Active, Revoked
    metadata_info = Column(Text, default="{}")  # JSON: details, rank, score

    # Relationships
    recipient_member = relationship("Member", back_populates="certificates")
    event = relationship("Event", back_populates="certificates")
    hackathon = relationship("Hackathon", back_populates="certificates")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), index=True, nullable=False)
    category = Column(String(50), nullable=False)  # Hackathon Winner, Competition Participation, Project Completion, Event Volunteering, Speaker, etc.
    description = Column(Text, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    badge_icon = Column(String(50), default="Trophy")
    achievement_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    proof_url = Column(String(255), nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    member = relationship("Member", back_populates="achievements")
    event = relationship("Event")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)  # Null = Club-wide
    target_role = Column(String(50), default="All")  # All, Leadership, Domain Heads, Members
    priority = Column(String(20), default="Normal")  # Low, Normal, High, Urgent
    pinned = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    author = relationship("Member", foreign_keys=[author_id])
    domain = relationship("Domain")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="System")  # Task, Approval, Event, Announcement, System
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    priority = Column(String(20), default="Normal")  # Normal, High, Urgent
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="notifications")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Proposal, Report, Meeting Minutes, Project Documentation, Certificate, Sponsorship, Permission Letter, Budget, Presentation, Other
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(150), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(50), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    domain = relationship("Domain")
    event = relationship("Event")
    project = relationship("Project")
    uploaded_by = relationship("Member", foreign_keys=[uploaded_by_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(120), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(50), index=True, nullable=False)  # CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT
    entity = Column(String(50), index=True, nullable=False)  # Event, Hackathon, Project, Task, Approval, Member, etc.
    entity_id = Column(Integer, nullable=True)
    description = Column(String(255), nullable=False)
    diff_json = Column(Text, default="{}")  # JSON string
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
