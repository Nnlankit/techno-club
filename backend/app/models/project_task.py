from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=False)
    objective = Column(Text, nullable=True)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    secondary_domains = Column(Text, default="[]")  # JSON
    project_lead_id = Column(Integer, ForeignKey("members.id", ondelete="RESTRICT"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    target_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="Planning", index=True, nullable=False)  # Planning, Active, On Hold, Review, Completed, Archived
    priority = Column(String(20), default="Medium", nullable=False)  # Low, Medium, High, Critical
    milestones = Column(Text, default="[]")  # JSON list
    repository_url = Column(String(255), nullable=True)
    demo_url = Column(String(255), nullable=True)
    documentation_url = Column(String(255), nullable=True)
    final_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    domain = relationship("Domain", back_populates="projects")
    lead = relationship("Member", foreign_keys=[project_lead_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    role_in_project = Column(String(50), default="Contributor")  # Lead, Frontend, Backend, ML Engineer, DevOps, etc.
    contribution_summary = Column(Text, nullable=True)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="members")
    member = relationship("Member", back_populates="project_memberships")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    creator_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String(20), default="Medium", nullable=False)  # Low, Medium, High, Urgent
    status = Column(String(20), default="Todo", index=True, nullable=False)  # Todo, In Progress, Review, Completed, Blocked
    subtasks = Column(Text, default="[]")  # JSON: [{"id": "1", "title": "Setup db", "completed": true}]
    attachments = Column(Text, default="[]")  # JSON
    dependencies = Column(Text, default="[]")  # JSON list of task IDs
    estimated_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project = relationship("Project", back_populates="tasks")
    domain = relationship("Domain", back_populates="tasks")
    assignee = relationship("Member", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    creator = relationship("Member", foreign_keys=[creator_id], back_populates="created_tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("Member")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), index=True, nullable=False)
    activity_type = Column(String(50), index=True, nullable=False)  # Campus Awareness, Recruitment Drive, Internal Training, etc.
    description = Column(Text, nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="SET NULL"), nullable=True)
    coordinator_id = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    venue = Column(String(150), nullable=True)
    status = Column(String(30), default="Planned", index=True, nullable=False)  # Planned, In Progress, Completed, Cancelled
    budget = Column(Float, default=0.0)
    participants_count = Column(Integer, default=0)
    outcomes = Column(Text, nullable=True)
    documentation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    domain = relationship("Domain")
    coordinator = relationship("Member")
