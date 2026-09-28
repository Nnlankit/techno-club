import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.project_task import Task, TaskComment, Project
from app.schemas.project_task import (
    TaskCreate, TaskUpdate, TaskResponse,
    TaskCommentCreate, TaskCommentResponse
)
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter()


def build_task_response(t: Task, db: Session) -> TaskResponse:
    comments = db.query(TaskComment).filter(TaskComment.task_id == t.id).order_by(asc(TaskComment.created_at)).all()
    comments_list = []
    for c in comments:
        comments_list.append(TaskCommentResponse(
            id=c.id,
            task_id=c.task_id,
            author_id=c.author_id,
            author_name=c.author.full_name if c.author else "Member",
            author_avatar=c.author.avatar_url if c.author else None,
            comment=c.comment,
            created_at=c.created_at
        ))

    return TaskResponse(
        id=t.id,
        title=t.title,
        description=t.description,
        project_id=t.project_id,
        domain_id=t.domain_id,
        project_name=t.project.name if t.project else None,
        domain_name=t.domain.name if t.domain else None,
        assignee_id=t.assignee_id,
        assignee_name=t.assignee.full_name if t.assignee else None,
        creator_name=t.creator.full_name if t.creator else None,
        due_date=t.due_date,
        priority=t.priority,
        status=t.status,
        subtasks=json.loads(t.subtasks or "[]"),
        attachments=json.loads(t.attachments or "[]"),
        dependencies=json.loads(t.dependencies or "[]"),
        estimated_hours=t.estimated_hours,
        actual_hours=t.actual_hours,
        comments_count=len(comments_list),
        comments=comments_list,
        created_at=t.created_at,
        updated_at=t.updated_at
    )


@router.get("/", response_model=List[TaskResponse])
def get_all_tasks(
    project_id: Optional[int] = None,
    domain_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if domain_id:
        query = query.filter(Task.domain_id == domain_id)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority:
        query = query.filter(Task.priority == priority)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Task.title.ilike(s), Task.description.ilike(s)))

    tasks = query.order_by(asc(Task.due_date)).all()
    return [build_task_response(t, db) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return build_task_response(task, db)


@router.post("/", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creator_id = current_user.member.id if current_user.member else None

    new_task = Task(
        title=payload.title,
        description=payload.description,
        project_id=payload.project_id,
        domain_id=payload.domain_id,
        assignee_id=payload.assignee_id,
        creator_id=creator_id,
        due_date=payload.due_date,
        priority=payload.priority or "Medium",
        status=payload.status or "Todo",
        subtasks=json.dumps(payload.subtasks or []),
        attachments=json.dumps(payload.attachments or []),
        dependencies=json.dumps(payload.dependencies or []),
        estimated_hours=payload.estimated_hours or 0.0,
        actual_hours=payload.actual_hours or 0.0
    )
    db.add(new_task)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Task", new_task.id,
        f"{current_user.email} created Task #{new_task.id}: '{new_task.title}'"
    )

    if new_task.assignee and new_task.assignee.user_id:
        create_notification(
            db, new_task.assignee.user_id,
            f"New Task Assigned: {new_task.title}",
            f"You have been assigned task '{new_task.title}'. Priority: {new_task.priority}.",
            "Task", "Task", new_task.id, priority="High" if new_task.priority in ["High", "Urgent"] else "Normal"
        )

    db.commit()
    db.refresh(new_task)
    return build_task_response(new_task, db)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    update_data = payload.model_dump(exclude_unset=True)

    json_fields = ["subtasks", "attachments", "dependencies"]
    for f in json_fields:
        if f in update_data and update_data[f] is not None:
            update_data[f] = json.dumps(update_data[f])

    for k, v in update_data.items():
        setattr(task, k, v)

    log_audit_event(
        db, current_user, "UPDATE", "Task", task.id,
        f"Task #{task.id} updated by {current_user.email}",
        diff=update_data
    )

    # Notify creator if assignee completed task
    if old_status != "Completed" and task.status == "Completed":
        if task.creator and task.creator.user_id:
            create_notification(
                db, task.creator.user_id,
                f"Task Completed: {task.title}",
                f"Task '{task.title}' was marked Completed by {current_user.email}.",
                "Task", "Task", task.id
            )

    db.commit()
    db.refresh(task)
    return build_task_response(task, db)


@router.post("/{task_id}/comments", response_model=TaskCommentResponse)
def add_task_comment(
    task_id: int,
    payload: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    author_id = current_user.member.id if current_user.member else 1

    comment = TaskComment(
        task_id=task_id,
        author_id=author_id,
        comment=payload.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return TaskCommentResponse(
        id=comment.id,
        task_id=comment.task_id,
        author_id=comment.author_id,
        author_name=comment.author.full_name if comment.author else "Member",
        author_avatar=comment.author.avatar_url if comment.author else None,
        comment=comment.comment,
        created_at=comment.created_at
    )
