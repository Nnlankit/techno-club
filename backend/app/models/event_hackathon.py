from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    event_type = Column(String(50), index=True, nullable=False)  # Workshop, Seminar, Hackathon, Tech Talk, etc.
    description = Column(Text, nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    organizer_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    venue = Column(String(150), nullable=False)
    capacity = Column(Integer, default=100)
    registration_deadline = Column(DateTime, nullable=True)
    budget = Column(Float, default=0.0)
    status = Column(String(30), default="Draft", index=True, nullable=False)
    speakers = Column(Text, default="[]")  # JSON
    judges = Column(Text, default="[]")  # JSON
    coordinators = Column(Text, default="[]")  # JSON
    volunteers = Column(Text, default="[]")  # JSON
    sponsors = Column(Text, default="[]")  # JSON
    banner_url = Column(String(255), nullable=True)
    report_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    domain = relationship("Domain", back_populates="events")
    organizer = relationship("Member", foreign_keys=[organizer_id])
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    attendances = relationship("EventAttendance", back_populates="event", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="event")
    certificates = relationship("Certificate", back_populates="event")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=True)
    guest_name = Column(String(100), nullable=True)
    guest_email = Column(String(120), nullable=True)
    guest_college_id = Column(String(50), nullable=True)
    guest_phone = Column(String(25), nullable=True)
    status = Column(String(20), default="Confirmed")  # Confirmed, Waitlist, Cancelled
    qr_code_token = Column(String(100), unique=True, default=lambda: f"QR-{uuid.uuid4().hex[:12].upper()}", index=True)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = relationship("Event", back_populates="registrations")
    member = relationship("Member", back_populates="event_registrations")
    attendance = relationship("EventAttendance", back_populates="registration", uselist=False)


class EventAttendance(Base):
    __tablename__ = "event_attendances"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    registration_id = Column(Integer, ForeignKey("event_registrations.id", ondelete="SET NULL"), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    method = Column(String(30), default="QR_SCAN")  # QR_SCAN, MANUAL, SELF_CHECKIN
    marked_by_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    marked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(String(255), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="attendances")
    registration = relationship("EventRegistration", back_populates="attendance")
    member = relationship("Member", foreign_keys=[member_id])


class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    theme = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    problem_statements = Column(Text, default="[]")  # JSON
    rules = Column(Text, nullable=False)
    eligibility = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    min_team_size = Column(Integer, default=1)
    max_team_size = Column(Integer, default=4)
    status = Column(String(30), default="Proposal", index=True, nullable=False)
    evaluation_criteria = Column(Text, default="[]")  # JSON: criteria, max_score, weight
    mentors = Column(Text, default="[]")  # JSON
    judges = Column(Text, default="[]")  # JSON
    prizes = Column(Text, default="[]")  # JSON
    banner_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    teams = relationship("HackathonTeam", back_populates="hackathon", cascade="all, delete-orphan")
    submissions = relationship("HackathonSubmission", back_populates="hackathon", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="hackathon")


class HackathonTeam(Base):
    __tablename__ = "hackathon_teams"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    team_code = Column(String(20), unique=True, default=lambda: f"TEAM-{uuid.uuid4().hex[:6].upper()}", index=True)
    leader_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    members_info = Column(Text, default="[]")  # JSON list of team member details
    project_name = Column(String(150), nullable=True)
    status = Column(String(20), default="Registered")  # Registered, Approved, Submitted, Disqualified
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    hackathon = relationship("Hackathon", back_populates="teams")
    leader = relationship("Member", foreign_keys=[leader_id])
    submission = relationship("HackathonSubmission", back_populates="team", uselist=False, cascade="all, delete-orphan")


class HackathonSubmission(Base):
    __tablename__ = "hackathon_submissions"

    id = Column(Integer, primary_key=True, index=True)
    hackathon_id = Column(Integer, ForeignKey("hackathons.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("hackathon_teams.id", ondelete="CASCADE"), unique=True, nullable=False)
    project_title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    problem_statement_id = Column(String(50), nullable=True)
    repo_url = Column(String(255), nullable=True)
    demo_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    presentation_url = Column(String(255), nullable=True)
    scores = Column(Text, default="[]")  # JSON: [{"judge": "Dr. Rao", "criteria": "Innovation", "score": 9, "max": 10, "comment": ""}]
    total_score = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    winner_category = Column(String(100), nullable=True)  # Winner, 1st Runner Up, Best AI Solution, etc.
    judge_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    hackathon = relationship("Hackathon", back_populates="submissions")
    team = relationship("HackathonTeam", back_populates="submission")
