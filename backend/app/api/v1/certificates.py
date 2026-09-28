import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.event_hackathon import Event, Hackathon
from app.models.operations import Certificate
from app.schemas.operations import (
    CertificateCreate, CertificateResponse, CertificateVerifyResponse
)
from app.services.certificate_service import generate_pdf_certificate
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_cert_response(c: Certificate) -> CertificateResponse:
    return CertificateResponse(
        id=c.id,
        certificate_id=c.certificate_id,
        verification_code=c.verification_code,
        title=c.title,
        certificate_type=c.certificate_type,
        recipient_name=c.recipient_name,
        recipient_email=c.recipient_email,
        event_id=c.event_id,
        event_name=c.event.name if c.event else None,
        hackathon_id=c.hackathon_id,
        issue_date=c.issue_date,
        file_url=c.file_url,
        status=c.status,
        metadata_info=json.loads(c.metadata_info or "{}")
    )


@router.get("/", response_model=List[CertificateResponse])
def get_all_certificates(
    recipient_email: Optional[str] = None,
    event_id: Optional[int] = None,
    certificate_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Certificate)
    if recipient_email:
        query = query.filter(Certificate.recipient_email == recipient_email)
    if event_id:
        query = query.filter(Certificate.event_id == event_id)
    if certificate_type:
        query = query.filter(Certificate.certificate_type == certificate_type)

    certs = query.order_by(desc(Certificate.issue_date)).all()
    return [build_cert_response(c) for c in certs]


@router.post("/issue", response_model=CertificateResponse)
def issue_certificate(
    payload: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    count = db.query(Certificate).count() + 1
    cert_id = f"TC-2026-{payload.certificate_type[:4].upper()}-{count:04d}"
    v_code = uuid.uuid4().hex

    event_name = ""
    if payload.event_id:
        ev = db.query(Event).filter(Event.id == payload.event_id).first()
        if ev:
            event_name = ev.name

    # Generate real PDF & QR code
    file_url = generate_pdf_certificate(
        certificate_id=cert_id,
        title=payload.title,
        recipient_name=payload.recipient_name,
        certificate_type=payload.certificate_type,
        event_name=event_name,
        issue_date=datetime.now(timezone.utc),
        verification_code=v_code
    )

    cert = Certificate(
        certificate_id=cert_id,
        verification_code=v_code,
        title=payload.title,
        certificate_type=payload.certificate_type,
        recipient_name=payload.recipient_name,
        recipient_email=payload.recipient_email,
        recipient_member_id=payload.recipient_member_id,
        event_id=payload.event_id,
        hackathon_id=payload.hackathon_id,
        file_url=file_url,
        status="Active",
        metadata_info=json.dumps(payload.metadata_info or {})
    )
    db.add(cert)
    db.flush()

    log_audit_event(
        db, current_user, "ISSUE_CERTIFICATE", "Certificate", cert.id,
        f"{current_user.email} issued certificate {cert.certificate_id} to {cert.recipient_name}"
    )

    db.commit()
    db.refresh(cert)
    return build_cert_response(cert)


@router.get("/verify/{code_or_id}", response_model=CertificateVerifyResponse)
def verify_certificate(code_or_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(
        (Certificate.verification_code == code_or_id) | 
        (Certificate.certificate_id == code_or_id.upper())
    ).first()

    if not cert:
        return CertificateVerifyResponse(
            valid=False,
            verification_message="No matching credential record found in the Techno Club official registry."
        )

    if cert.status != "Active":
        return CertificateVerifyResponse(
            valid=False,
            certificate_id=cert.certificate_id,
            title=cert.title,
            recipient_name=cert.recipient_name,
            certificate_type=cert.certificate_type,
            issue_date=cert.issue_date,
            status=cert.status,
            verification_message=f"Certificate status is {cert.status}. This credential has been revoked."
        )

    return CertificateVerifyResponse(
        valid=True,
        certificate_id=cert.certificate_id,
        title=cert.title,
        recipient_name=cert.recipient_name,
        certificate_type=cert.certificate_type,
        issue_date=cert.issue_date,
        status=cert.status,
        event_name=cert.event.name if cert.event else "Club Activity",
        verification_message="Official Authenticated Credential issued by Techno Club."
    )
