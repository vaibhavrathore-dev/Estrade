from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph


def certificate_pdf(certificate):
    output = BytesIO()
    page = canvas.Canvas(output, pagesize=(842, 595))
    page.setTitle('Estrade Certificate of Participation')
    page.setFillColor(HexColor('#faf8f3'))
    page.rect(0, 0, 842, 595, fill=1, stroke=0)
    page.setStrokeColor(HexColor('#ad8750'))
    page.setLineWidth(1.5)
    page.rect(28, 28, 786, 539)
    page.setFillColor(HexColor('#760719'))
    page.setFont('Helvetica-Bold', 28)
    page.drawCentredString(421, 510, 'estrade.')
    page.setFont('Helvetica', 10)
    page.drawCentredString(421, 489, 'BEHIND EVERY GREAT EVENT')
    page.setFont('Times-Roman', 34)
    page.drawCentredString(421, 421, 'Certificate of Participation')
    page.setFont('Helvetica', 12)
    page.drawCentredString(421, 379, 'This certificate is proudly presented to')
    def centered(text, y, size, font='Helvetica'):
        style = ParagraphStyle('center', fontName=font, fontSize=size, leading=size * 1.2,
                               alignment=1, textColor=HexColor('#760719'))
        paragraph = Paragraph(escape(text), style)
        _, height = paragraph.wrap(680, 100)
        while height > 65 and style.fontSize > 10:
            style.fontSize -= 1
            style.leading = style.fontSize * 1.2
            paragraph = Paragraph(escape(text), style)
            _, height = paragraph.wrap(680, 100)
        paragraph.drawOn(page, 81, y - height)
    centered(certificate.participant_name, 356, 28, 'Times-Bold')
    centered('For verified participation in', 272, 12)
    centered(certificate.event_title, 247, 21, 'Times-Roman')
    page.setFont('Helvetica', 11)
    page.drawCentredString(421, 165, f'Event date (UTC): {certificate.event_date:%d %B %Y}')
    page.setFont('Helvetica', 9)
    page.drawString(65, 98, f'Issued: {certificate.created_at:%d %B %Y}')
    page.drawRightString(777, 98, 'Verified by the event organizing committee')
    page.setFont('Helvetica', 8)
    page.drawCentredString(421, 66, f'Certificate ID: {certificate.id}')
    page.save()
    return output.getvalue()
