import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user_role import User
from app.models.member_domain import Member, Domain
from app.models.event_hackathon import Event
from app.models.project_task import Project
from app.models.operations import Document
from app.schemas.operations import DocumentResponse
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_doc_response(d: Document) -> DocumentResponse:
    return DocumentResponse(
        id=d.id,
        title=d.title,
        category=d.category,
        domain_id=d.domain_id,
        domain_name=d.domain.name if d.domain else None,
        event_id=d.event_id,
        event_name=d.event.name if d.event else None,
        project_id=d.project_id,
        project_name=d.project.name if d.project else None,
        file_path=d.file_path,
        file_name=d.file_name,
        file_size=d.file_size,
        file_type=d.file_type,
        uploaded_by_name=d.uploaded_by.full_name if d.uploaded_by else None,
        is_public=d.is_public,
        created_at=d.created_at
    )


@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    category: Optional[str] = None,
    domain_id: Optional[int] = None,
    event_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if category:
        query = query.filter(Document.category == category)
    if domain_id:
        query = query.filter(Document.domain_id == domain_id)
    if event_id:
        query = query.filter(Document.event_id == event_id)
    if project_id:
        query = query.filter(Document.project_id == project_id)

    docs = query.order_by(desc(Document.created_at)).all()
    return [build_doc_response(d) for d in docs]


@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    title: str = Form(...),
    category: str = Form("Report"),
    domain_id: Optional[int] = Form(None),
    event_id: Optional[int] = Form(None),
    project_id: Optional[int] = Form(None),
    is_public: bool = Form(True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_dest = os.path.join(settings.UPLOAD_DIR, clean_filename)

    with open(file_dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_dest)
    file_type = file.content_type

    doc = Document(
        title=title,
        category=category,
        domain_id=domain_id,
        event_id=event_id,
        project_id=project_id,
        file_path=f"/static/uploads/{clean_filename}",
        file_name=file.filename,
        file_size=file_size,
        file_type=file_type,
        uploaded_by_id=current_user.member.id if current_user.member else None,
        is_public=is_public
    )
    db.add(doc)
    db.flush()

    log_audit_event(
        db, current_user, "UPLOAD_DOCUMENT", "Document", doc.id,
        f"{current_user.email} uploaded document '{doc.title}' ({doc.file_name})"
    )

    db.commit()
    db.refresh(doc)
    return build_doc_response(doc)
