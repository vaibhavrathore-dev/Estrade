from hashlib import sha256
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.graphics import renderPDF

from app.core.config import settings


BURGUNDY = HexColor("#760719")
GOLD = HexColor("#B28A4A")
CREAM = HexColor("#FBF8F2")
CHARCOAL = HexColor("#2B2725")
MUTED = HexColor("#6D6560")


def _paragraph(
    page,
    text,
    y,
    width=680,
    size=14,
    font="Times-Roman",
    color=BURGUNDY,
    leading=None,
):
    style = ParagraphStyle(
        "estrade-center",
        fontName=font,
        fontSize=size,
        leading=leading or size * 1.22,
        alignment=1,
        textColor=color,
    )

    paragraph = Paragraph(escape(str(text)), style)
    _, height = paragraph.wrap(width, 100)

    while height > 70 and style.fontSize > 10:
        style.fontSize -= 1
        style.leading = style.fontSize * 1.22
        paragraph = Paragraph(escape(str(text)), style)
        _, height = paragraph.wrap(width, 100)

    paragraph.drawOn(page, (842 - width) / 2, y - height)


def _draw_qr(page, value, x, y, size=72):
    widget = qr.QrCodeWidget(value)

    bounds = widget.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]

    drawing = Drawing(
        size,
        size,
        transform=[
            size / width,
            0,
            0,
            size / height,
            0,
            0,
        ],
    )

    drawing.add(widget)
    renderPDF.draw(drawing, page, x, y)


def certificate_pdf(certificate):
    output = BytesIO()

    page = canvas.Canvas(
        output,
        pagesize=(842, 595),
        invariant=1,
    )

    page.setTitle(
        f"Estrade Certificate - {certificate.participant_name}"
    )

    page.setFillColor(CREAM)
    page.rect(0, 0, 842, 595, fill=1, stroke=0)

    # Outer premium border.
    page.setStrokeColor(BURGUNDY)
    page.setLineWidth(3)
    page.rect(24, 24, 794, 547)

    page.setStrokeColor(GOLD)
    page.setLineWidth(1)
    page.rect(34, 34, 774, 527)

    # Subtle Estrade watermark.
    page.saveState()
    page.setFillColor(HexColor("#EEE3E2"))
    page.setFont("Times-BoldItalic", 86)
    page.translate(421, 290)
    page.rotate(24)
    page.drawCentredString(0, 0, "estrade")
    page.restoreState()

    college_name = (
        certificate.college_name
        or "AMRITSAR GROUP OF COLLEGES"
    )

    department_name = (
        certificate.department_name
        or "Department of Computer Science & Engineering"
    )

    signatory_name = (
        certificate.signatory_name
        or "Head of Department"
    )

    page.setFillColor(BURGUNDY)
    page.setFont("Times-Bold", 17)
    page.drawCentredString(
        421,
        530,
        college_name.upper(),
    )

    page.setFillColor(MUTED)
    page.setFont("Times-Roman", 12)
    page.drawCentredString(
        421,
        508,
        department_name,
    )

    page.setFillColor(GOLD)
    page.setLineWidth(1)
    page.line(250, 493, 592, 493)

    page.setFillColor(CHARCOAL)
    page.setFont("Times-Bold", 33)
    page.drawCentredString(
        421,
        445,
        "CERTIFICATE OF PARTICIPATION",
    )

    page.setFillColor(MUTED)
    page.setFont("Times-Roman", 12)
    page.drawCentredString(
        421,
        409,
        "This certificate is proudly presented to",
    )

    _paragraph(
        page,
        certificate.participant_name,
        382,
        width=690,
        size=28,
        font="Times-Bold",
        color=BURGUNDY,
    )

    page.setFillColor(MUTED)
    page.setFont("Times-Roman", 12)
    page.drawCentredString(
        421,
        307,
        "for verified participation in",
    )

    _paragraph(
        page,
        certificate.event_title,
        279,
        width=680,
        size=21,
        font="Times-Bold",
        color=CHARCOAL,
    )

    page.setFillColor(MUTED)
    page.setFont("Times-Roman", 11)
    page.drawCentredString(
        421,
        220,
        certificate.event_date.strftime("%d %B %Y"),
    )

    # Signature line.
    page.setStrokeColor(GOLD)
    page.setLineWidth(0.8)
    page.line(90, 126, 280, 126)

    page.setFillColor(CHARCOAL)
    page.setFont("Times-Bold", 10)
    page.drawCentredString(
        185,
        111,
        signatory_name,
    )

    page.setFillColor(MUTED)
    page.setFont("Times-Roman", 8)
    page.drawCentredString(
        185,
        98,
        "Authorized Signatory",
    )

    # QR verification.
    verification_code = (
        certificate.verification_code
        or str(certificate.id)
    )

    public_base_url = settings.ESTRADE_PUBLIC_BASE_URL.rstrip("/")

    verification_payload = (
        f"{public_base_url}/api/v1/"
        f"certificate-verification/{verification_code}"
    )

    _draw_qr(
        page,
        verification_payload,
        667,
        74,
        74,
    )

    page.setFillColor(MUTED)
    page.setFont("Helvetica", 7)
    page.drawCentredString(
        704,
        64,
        "SCAN TO VERIFY",
    )

    page.setFillColor(BURGUNDY)
    page.setFont("Times-Bold", 14)
    page.drawCentredString(
        421,
        73,
        "estrade",
    )

    page.setFillColor(MUTED)
    page.setFont("Helvetica", 6.8)
    page.drawCentredString(
        421,
        57,
        f"Certificate ID: {verification_code}",
    )

    page.save()

    return output.getvalue()


def certificate_hash(pdf_bytes: bytes) -> str:
    return sha256(pdf_bytes).hexdigest()
