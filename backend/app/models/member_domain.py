from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    head_id = Column(Integer, ForeignKey("members.id", use_alter=True, name="fk_domain_head"), nullable=True)
    co_head_id = Column(Integer, ForeignKey("members.id", use_alter=True, name="fk_domain_co_head"), nullable=True)
    icon = Column(String(50), default="Cpu")
    color = Column(String(50), default="#3B82F6")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    members = relationship("Member", foreign_keys="[Member.domain_id]", back_populates="domain")
    projects = relationship("Project", back_populates="domain")
    events = relationship("Event", back_populates="domain")
    tasks = relationship("Task", back_populates="domain")
    head = relationship("Member", foreign_keys=[head_id], post_update=True)
    co_head = relationship("Member", foreign_keys=[co_head_id], post_update=True)


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    college_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=True)
    department = Column(String(100), index=True, nullable=False)
    year_semester = Column(String(50), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    role_title = Column(String(100), default="Member", nullable=False)
    status = Column(String(20), default="Active", index=True, nullable=False)  # Active, Inactive, Alumni, Suspended
    skills = Column(Text, default="[]")  # JSON encoded list of strings
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    joining_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="member")
    domain = relationship("Domain", foreign_keys=[domain_id], back_populates="members")
    assigned_tasks = relationship("Task", foreign_keys="[Task.assignee_id]", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="[Task.creator_id]", back_populates="creator")
    project_memberships = relationship("ProjectMember", back_populates="member", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistration", back_populates="member", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="member", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="recipient_member")
