import os
import io
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from app.core.config import settings


def generate_qr_code_image_bytes(data: str) -> bytes:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=6,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1E3A8A", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_pdf_certificate(
    certificate_id: str,
    title: str,
    recipient_name: str,
    certificate_type: str,
    event_name: str,
    issue_date: datetime,
    verification_code: str
) -> str:
    # PDF storage path
    cert_filename = f"cert_{certificate_id}.pdf"
    output_path = os.path.join(settings.UPLOAD_DIR, cert_filename)
    
    # Generate verification QR
    verify_url = f"http://localhost:5173/verify-certificate?code={verification_code}"
    qr_bytes = generate_qr_code_image_bytes(verify_url)
    qr_filename = f"qr_{certificate_id}.png"
    qr_path = os.path.join(settings.UPLOAD_DIR, qr_filename)
    with open(qr_path, "wb") as f:
        f.write(qr_bytes)

    # Build PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(letter),
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1
    )
    sub_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#4B5563'),
        alignment=1
    )
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0F172A'),
        alignment=1
    )
    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=20,
        textColor=colors.HexColor('#334155'),
        alignment=1
    )
    meta_style = ParagraphStyle(
        'CertMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        alignment=0
    )

    elements = []
    elements.append(Paragraph(f"<b>{settings.COLLEGE_NAME.upper()}</b>", sub_style))
    elements.append(Paragraph(f"<b>{settings.CLUB_NAME.upper()}</b>", sub_style))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("CERTIFICATE OF EXCELLENCE", title_style))
    elements.append(Paragraph(f"<i>Category: {certificate_type.upper()}</i>", sub_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("This is proudly presented to", sub_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"<u>{recipient_name}</u>", name_style))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph(
        f"for outstanding participation and demonstration of exceptional technical prowess in "
        f"<b>{event_name or title}</b> organized by {settings.CLUB_NAME} during Academic Year {settings.ACADEMIC_YEAR}.",
        body_style
    ))
    elements.append(Spacer(1, 30))

    # Bottom footer with QR code and Signatures
    footer_data = [
        [
            Paragraph(
                f"<b>Certificate ID:</b> {certificate_id}<br/>"
                f"<b>Issue Date:</b> {issue_date.strftime('%B %d, %Y')}<br/>"
                f"<b>Verify Code:</b> {verification_code[:16]}...<br/>"
                f"Scan QR code to verify authenticity online.",
                meta_style
            ),
            Image(qr_path, width=70, height=70),
            Paragraph(
                "__________________________<br/><b>Faculty Coordinator</b><br/>Techno Club Operations",
                sub_style
            ),
            Paragraph(
                "__________________________<br/><b>President</b><br/>Techno Club",
                sub_style
            )
        ]
    ]

    t = Table(footer_data, colWidths=[240, 90, 190, 190])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (3,0), 'CENTER'),
    ]))
    elements.append(t)

    doc.build(elements)
    return f"/static/uploads/{cert_filename}"
