from pathlib import Path
from io import BytesIO
import json
import shutil
import sys

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
import pypdfium2 as pdfium

sys.stdout.reconfigure(encoding='utf-8')
root = Path(__file__).resolve().parents[2]
source = root / 'Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf'
output = root / 'output/pdf/Sample_Nevada_Purchase_Contract_With_Agents.pdf'
backup = root / 'output/pdf/source-backups/Sample_Nevada_Purchase_Contract.before-agents.pdf'
render_dir = root / 'tmp/pdfs/agent-review'
output.parent.mkdir(parents=True, exist_ok=True)
backup.parent.mkdir(parents=True, exist_ok=True)
render_dir.mkdir(parents=True, exist_ok=True)
if not backup.exists():
    shutil.copy2(source, backup)
reader = PdfReader(backup)
assert len(reader.pages) == 9
original_fields = reader.get_fields() or {}
assert not any(field.get('/FT') == '/Sig' for field in original_fields.values())

styles = getSampleStyleSheet()
styles.add(ParagraphStyle('SampleBody', fontName='Helvetica', fontSize=9.5, leading=12, spaceAfter=7))
styles.add(ParagraphStyle('SampleSmall', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#555555'), spaceAfter=5))
styles.add(ParagraphStyle('SampleTitle', fontName='Helvetica-Bold', fontSize=17, leading=20, alignment=TA_CENTER, spaceAfter=4))
styles.add(ParagraphStyle('SampleSubtitle', fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle('SampleSection', fontName='Helvetica-Bold', fontSize=11.5, leading=14, spaceBefore=9, spaceAfter=7))
styles.add(ParagraphStyle('SampleCell', fontName='Helvetica', fontSize=9.2, leading=11.7))
styles.add(ParagraphStyle('SampleLabel', fontName='Helvetica-Bold', fontSize=9.2, leading=11.7))

def p(text, style='SampleBody'):
    return Paragraph(text, styles[style])

def table(rows, widths=(159, 357)):
    result = Table([[p(a, 'SampleLabel'), p(b, 'SampleCell')] for a, b in rows], colWidths=widths, hAlign='LEFT')
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#eef2f6')),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#b6c1ce')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    return result

def frame(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor('#a8292c'))
    canvas.setFont('Helvetica-Bold', 8.5)
    canvas.drawCentredString(306, 769, 'SAMPLE - FICTIONAL - NOT FOR EXECUTION')
    canvas.setFillColor(colors.HexColor('#555555'))
    canvas.setFont('Helvetica', 7)
    canvas.drawCentredString(306, 28, 'All inserted details are synthetic. Unsigned practice document. No actual transaction.')
    label = 'Exhibit A' if doc.page == 1 else 'Exhibit B'
    canvas.drawString(48, 43, f'{label} - page 1 of 1')
    canvas.drawRightString(564, 43, f'Combined document: page {doc.page + 8} of 10')
    canvas.restoreState()

pages = BytesIO()
document = SimpleDocTemplate(pages, pagesize=letter, leftMargin=48, rightMargin=48, topMargin=44, bottomMargin=60,
                             title='Fictional Transaction Terms and Agent Contacts', author='Sample Appraisal Documents')
story = [
    p('EXHIBIT A', 'SampleTitle'),
    p('Fictional Transaction Terms and Sample Status', 'SampleSubtitle'),
    p('Attached to the sample Nevada Residential Real Estate Purchase Agreement dated <b>September 9, 2026</b>, between '
      '<b>Taylor Morgan Bennett</b> (buyer) and <b>Casey Lane Brooks</b> (seller). All dates and amounts below are illustrative.'),
    p('Property and financing', 'SampleSection'),
    table([
        ('Property', '1048 Example Mesa Drive, Henderson, NV 89052'),
        ('Property description', 'Detached single-family home; one unit; primary residence'),
        ('Sample parcel / legal description', 'SAMPLE-000-00-000; Lot 8, Block B, Example Mesa Estates (fictional reference only)'),
        ('Purchase price', '$485,000.00'),
        ('Conventional first mortgage', '$388,000.00; 30 years; fixed rate of 6.25% (illustrative)'),
        ('Buyer down payment', '$97,000.00 (20%); buyer checking and savings'),
        ('Earnest money', '$10,000.00 due September 11, 2026, at 5:00 p.m. Pacific'),
        ('Closing / possession', 'October 23, 2026, by 5:00 p.m. Pacific; possession at recording'),
        ('Escrow holder', 'Example Escrow Services LLC (fictional)'),
    ]),
    p('Closing funds and allocation', 'SampleSection'),
    p('Buyer closing costs and prepaids are estimated at $12,000. Seller contributes $5,000 toward allowable buyer costs; '
      'buyer pays the remaining buyer costs. Seller pays seller-side charges and any seller liens. The deposit is credited toward the down payment.'),
    p('<b>Estimated buyer cash remaining at closing: $94,000</b> = $97,000 down payment + $12,000 buyer costs - $5,000 seller '
      'credit - $10,000 earnest money. The deposit is planned for September 11 and is not represented as already paid on September 9.'),
    p('Sample assumptions', 'SampleSection'),
    p('The fictional dwelling was built in 2005 and has no homeowners association. No additional financing, gifts, or '
      'sale-of-home contingency are included. Fictional listing/seller-agent and buyer-agent contacts are provided in '
      '<b>Exhibit B</b>. The transaction is subject to the selected financing, inspection and appraisal contingencies in the main sample agreement.'),
    p('<b>Sample status controls:</b> this entire PDF is an unsigned practice example. It makes no actual offer or commitment '
      'and creates no legal obligation. No actual disclosures, appraisal, loan approval or escrow receipt have been issued. '
      'No real signatures or license numbers are provided.'),
    p('Template source: FreeForms, Nevada Residential Real Estate Purchase Agreement (8 pages), matching the supplied image. '
      'The inserted values and exhibits were created for this fictional example. Main agreement references to Section V(c), '
      'IV and XXIII are read in this sample as Sections 3, 4 and 22, respectively.', 'SampleSmall'),
    PageBreak(),
    p('EXHIBIT B', 'SampleTitle'),
    p('Fictional Real Estate Agent Contacts', 'SampleSubtitle'),
    p('Contact schedule for <b>1048 Example Mesa Drive, Henderson, NV 89052</b>, under the sample purchase agreement dated '
      '<b>September 9, 2026</b>. Every contact detail below is fictional test data.'),
    p("Listing Agent / Seller's Agent", 'SampleSection'),
    p("<b>Listing agent and seller's agent refer to the same role.</b> Avery Ellis represents the seller, Casey Lane Brooks, in this fictional transaction."),
    table([
        ('First name', 'Avery'), ('Last name', 'Ellis'),
        ('Brokerage', 'Example Mesa Realty (fictional)'),
        ('Work phone', '(702) 555-0110'), ('Home phone', '(702) 555-0112'), ('Mobile phone', '(702) 555-0111'),
        ('Email', 'avery.ellis@example.com'),
    ]),
    p("Buyer's Agent", 'SampleSection'),
    p('Morgan Rivera represents the buyer, Taylor Morgan Bennett, in this fictional transaction. '
      "Morgan Rivera is the buyer's representative and is not the listing/seller's agent."),
    table([
        ('First name', 'Morgan'), ('Last name', 'Rivera'),
        ('Brokerage', 'Sample Valley Homes (fictional)'),
        ('Work phone', '(702) 555-0120'), ('Home phone', '(702) 555-0122'), ('Mobile phone', '(702) 555-0121'),
        ('Email', 'morgan.rivera@example.com'),
    ]),
    p('Property access contact', 'SampleSection'),
    p("For this fictional purchase, the property access contact is <b>Avery Ellis, the listing/seller's agent</b>, using the contact details above."),
    p('These sample agents are separate individuals. No actual agency agreement, signature, license number, or real-world contact authorization is created by this practice exhibit.', 'SampleSmall'),
]
document.build(story, onFirstPage=frame, onLaterPages=frame)
new_pages = PdfReader(BytesIO(pages.getvalue()))
assert len(new_pages.pages) == 2, f'Exhibits overflowed: {len(new_pages.pages)} pages'

writer = PdfWriter()
writer.clone_document_from_reader(reader)
updates = {
    'Print Name_5': 'Morgan Rivera',
    'Print Name_6': 'Avery Ellis',
    '1_2': 'Exhibit A - Fictional Transaction Terms and Sample Status - one page.',
    '2_2': 'Exhibit B - Fictional Real Estate Agent Contacts - one page.',
    'undefined_11': '/On',
}
writer.update_page_form_field_values(None, updates, auto_regenerate=False)
del writer.pages[8]
for page in new_pages.pages:
    writer.add_page(page)
writer.add_metadata({'/Title': 'Sample Nevada Purchase Contract - Fictional Agent Contacts'})
with output.open('wb') as target:
    writer.write(target)

updated = PdfReader(output)
assert len(updated.pages) == 10
fields = updated.get_fields() or {}
assert set(fields) == set(original_fields), 'Interactive field inventory changed'
for name, before in original_fields.items():
    expected = updates.get(name, before.get('/V'))
    assert fields[name].get('/V') == expected, f'Unexpected canonical field change: {name}'
    if name in updates:
        widgets = [a.get_object() for page in updated.pages for a in page.get('/Annots', []) if a.get_object().get('/T') == name]
        assert len(widgets) == 1
        assert widgets[0].get('/V') == expected
        appearance = widgets[0]['/AP']['/N']
        if widgets[0].get('/FT') == '/Btn':
            assert str(widgets[0].get('/AS')) == expected
            appearance = appearance[expected]
        assert len(appearance.get_data()) > 0
all_text = '\n'.join(page.extract_text() for page in updated.pages)
all_values = '\n'.join(str(field.get('/V', '')) for field in fields.values())
for stale in ['N/A - no seller agent', 'N/A - no buyer agent', 'sale-of-home contingency or agents are included']:
    assert stale not in all_text + all_values
for fact in ['Avery Ellis', 'Morgan Rivera', 'avery.ellis@example.com', 'morgan.rivera@example.com',
             '(702) 555-0110', '(702) 555-0111', '(702) 555-0112', '(702) 555-0120', '(702) 555-0121', '(702) 555-0122']:
    assert fact in all_text, f'Missing readable contact fact: {fact}'
for total in ['$485,000.00', '$388,000.00', '$97,000.00', '$94,000', '$12,000', '$5,000', '$10,000.00']:
    assert total in all_text, f'Transaction term missing: {total}'
assert '$485,000.00' in updated.pages[8].extract_text()
for index in [6, 7, 8, 9]:
    pdf = pdfium.PdfDocument(output)
    pdf.init_forms()
    pdf[index].render(scale=1.6).to_pil().save(render_dir / f'page-{index + 1}.png')
    pdf.close()
print(json.dumps({'output': str(output), 'backup': str(backup), 'pages': len(updated.pages),
                  'interactiveFields': len(fields), 'updatedFields': updates, 'validation': 'passed'}, indent=2))
