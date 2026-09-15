# [L1] Imports Path for locating the project and constructing PDF, backup, and rendering paths.
from pathlib import Path
# [L2] Imports the in-memory byte-stream class used to build and read the new exhibit PDF.
from io import BytesIO
# [L3] Imports JSON serialization for the final machine-readable result report.
import json
# [L4] Imports filesystem-copy utilities used to preserve a source backup.
import shutil
# [L5] Imports Python system-stream controls used to set standard-output encoding.
import sys
# [L6] Blank line separating the surrounding declarations, statements, or document blocks.

# [L7] Imports pypdf's reader and writer for inspecting, cloning, updating, and assembling PDF documents.
from pypdf import PdfReader, PdfWriter
# [L8] Imports ReportLab color helpers for styled exhibit text, table backgrounds, and borders.
from reportlab.lib import colors
# [L9] Imports the centered paragraph-alignment constant.
from reportlab.lib.enums import TA_CENTER
# [L10] Imports U.S. Letter page dimensions for the generated exhibits.
from reportlab.lib.pagesizes import letter
# [L11] Imports paragraph-style creation and the default style collection.
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
# [L12] Imports ReportLab's document, paragraph, spacer, table, table-style, and page-break classes; Spacer is not used later in this script.
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
# [L13] Imports PDFium bindings under the pdfium alias for rendering review images with form fields.
import pypdfium2 as pdfium
# [L14] Blank line separating the surrounding declarations, statements, or document blocks.

# [L15] Configures printed reports to use UTF-8.
sys.stdout.reconfigure(encoding='utf-8')
# [L16] Resolves the project root as the third parent directory of this script file.
root = Path(__file__).resolve().parents[2]
# [L17] Locates the original sample Nevada purchase-contract PDF.
source = root / 'Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf'
# [L18] Defines the separate output PDF path for the version with fictional agent contacts.
output = root / 'output/pdf/Sample_Nevada_Purchase_Contract_With_Agents.pdf'
# [L19] Defines the backup path holding the sample contract before this script's agent additions.
backup = root / 'output/pdf/source-backups/Sample_Nevada_Purchase_Contract.before-agents.pdf'
# [L20] Defines the directory for rendered review images of selected output pages.
render_dir = root / 'tmp/pdfs/agent-review'
# [L21] Creates the output PDF's parent directory and any missing ancestors.
output.parent.mkdir(parents=True, exist_ok=True)
# [L22] Creates the backup PDF's parent directory and any missing ancestors.
backup.parent.mkdir(parents=True, exist_ok=True)
# [L23] Creates the page-review image directory and any missing ancestors.
render_dir.mkdir(parents=True, exist_ok=True)
# [L24] Checks whether the source backup has not yet been created.
if not backup.exists():
    # [L25] Copies the source PDF and its filesystem metadata into the backup when absent.
    shutil.copy2(source, backup)
# [L26] Opens the backup PDF as the stable input document.
reader = PdfReader(backup)
# [L27] Asserts that the backup document contains the expected nine pages.
assert len(reader.pages) == 9
# [L28] Reads the source interactive-field dictionary, using an empty dictionary when no fields exist.
original_fields = reader.get_fields() or {}
# [L29] Asserts that none of the source interactive fields has the PDF signature-field type.
assert not any(field.get('/FT') == '/Sig' for field in original_fields.values())
# [L30] Blank line separating the surrounding declarations, statements, or document blocks.

# [L31] Creates the base ReportLab stylesheet that will be extended for the exhibits.
styles = getSampleStyleSheet()
# [L32] Adds the body style with Helvetica, 9.5-point text, 12-point line spacing, and 7 points after paragraphs.
styles.add(ParagraphStyle('SampleBody', fontName='Helvetica', fontSize=9.5, leading=12, spaceAfter=7))
# [L33] Adds the smaller gray explanatory style with 7.5-point text and 9.5-point line spacing.
styles.add(ParagraphStyle('SampleSmall', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#555555'), spaceAfter=5))
# [L34] Adds the centered bold 17-point exhibit-title style.
styles.add(ParagraphStyle('SampleTitle', fontName='Helvetica-Bold', fontSize=17, leading=20, alignment=TA_CENTER, spaceAfter=4))
# [L35] Adds the centered bold 12-point exhibit-subtitle style.
styles.add(ParagraphStyle('SampleSubtitle', fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, spaceAfter=12))
# [L36] Adds the bold 11.5-point section-heading style with space before and after each heading.
styles.add(ParagraphStyle('SampleSection', fontName='Helvetica-Bold', fontSize=11.5, leading=14, spaceBefore=9, spaceAfter=7))
# [L37] Adds a 9.2-point Helvetica style for table values.
styles.add(ParagraphStyle('SampleCell', fontName='Helvetica', fontSize=9.2, leading=11.7))
# [L38] Adds a matching bold 9.2-point style for table labels.
styles.add(ParagraphStyle('SampleLabel', fontName='Helvetica-Bold', fontSize=9.2, leading=11.7))
# [L39] Blank line separating the surrounding declarations, statements, or document blocks.

# [L40] Defines a shorthand for constructing a paragraph with the requested named style, defaulting to body text.
def p(text, style='SampleBody'):
    # [L41] Returns a ReportLab Paragraph that interprets its text using the selected stylesheet entry.
    return Paragraph(text, styles[style])
# [L42] Blank line separating the surrounding declarations, statements, or document blocks.

# [L43] Defines a two-column exhibit-table builder with default widths of 159 and 357 points.
def table(rows, widths=(159, 357)):
    # [L44] Converts each label/value pair into styled paragraphs and creates a left-aligned table with the requested widths.
    result = Table([[p(a, 'SampleLabel'), p(b, 'SampleCell')] for a, b in rows], colWidths=widths, hAlign='LEFT')
    # [L45] Begins applying background, grid, alignment, and padding rules to the table.
    result.setStyle(TableStyle([
        # [L46] Colors the first column's background light blue-gray for every row.
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#eef2f6')),
        # [L47] Draws a 0.4-point grid around all table cells with the specified border color.
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#b6c1ce')),
        # [L48] Top-aligns the contents of every table cell.
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        # [L49] Applies 8 points of inner padding on the left and right of every cell.
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # [L50] Applies 5 points of inner padding above and below every cell.
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    # [L51] Completes the table-style list and applies it to the table.
    ]))
    # [L52] Returns the formatted table flowable for insertion into the document story.
    return result
# [L53] Blank line separating the surrounding declarations, statements, or document blocks.

# [L54] Defines the header/footer drawing callback used on both generated exhibit pages.
def frame(canvas, doc):
    # [L55] Saves the drawing canvas's current graphics state before adding page decorations.
    canvas.saveState()
    # [L56] Selects the red fill color for the sample-status heading.
    canvas.setFillColor(colors.HexColor('#a8292c'))
    # [L57] Selects 8.5-point Helvetica Bold for the sample-status heading.
    canvas.setFont('Helvetica-Bold', 8.5)
    # [L58] Draws the centered SAMPLE/FICTIONAL/NOT FOR EXECUTION banner near the top of the page.
    canvas.drawCentredString(306, 769, 'SAMPLE - FICTIONAL - NOT FOR EXECUTION')
    # [L59] Switches the drawing color to gray for footer text.
    canvas.setFillColor(colors.HexColor('#555555'))
    # [L60] Selects 7-point Helvetica for the disclaimers and page labels.
    canvas.setFont('Helvetica', 7)
    # [L61] Draws the centered footer explaining that the inserted details are synthetic and unsigned.
    canvas.drawCentredString(306, 28, 'All inserted details are synthetic. Unsigned practice document. No actual transaction.')
    # [L62] Labels the first generated page Exhibit A and subsequent generated pages Exhibit B.
    label = 'Exhibit A' if doc.page == 1 else 'Exhibit B'
    # [L63] Draws the exhibit label and its one-page page count at the lower left.
    canvas.drawString(48, 43, f'{label} - page 1 of 1')
    # [L64] Draws the combined-document page number at the lower right, offsetting generated page numbers by eight.
    canvas.drawRightString(564, 43, f'Combined document: page {doc.page + 8} of 10')
    # [L65] Restores the canvas graphics state so page decorations do not affect document content.
    canvas.restoreState()
# [L66] Blank line separating the surrounding declarations, statements, or document blocks.

# [L67] Creates the memory buffer that will receive the two-page exhibit PDF.
pages = BytesIO()
# [L68] Creates a Letter-sized document template in memory with 48-point side margins, a 44-point top margin, and a 60-point bottom margin.
document = SimpleDocTemplate(pages, pagesize=letter, leftMargin=48, rightMargin=48, topMargin=44, bottomMargin=60,
                             # [L69] Sets the generated exhibit PDF's title and author metadata and completes template construction.
                             title='Fictional Transaction Terms and Agent Contacts', author='Sample Appraisal Documents')
# [L70] Begins the ordered story of headings, paragraphs, tables, and the exhibit page break.
story = [
    # [L71] Adds the Exhibit A title in the large centered title style.
    p('EXHIBIT A', 'SampleTitle'),
    # [L72] Adds the subtitle describing fictional transaction terms and sample status.
    p('Fictional Transaction Terms and Sample Status', 'SampleSubtitle'),
    # [L73] Begins the Exhibit A introductory paragraph identifying the sample Nevada agreement and its illustrative date.
    p('Attached to the sample Nevada Residential Real Estate Purchase Agreement dated <b>September 9, 2026</b>, between '
      # [L74] Continues that paragraph with the fictional buyer and seller names and the illustrative-data explanation.
      '<b>Taylor Morgan Bennett</b> (buyer) and <b>Casey Lane Brooks</b> (seller). All dates and amounts below are illustrative.'),
    # [L75] Adds the Property and financing section heading.
    p('Property and financing', 'SampleSection'),
    # [L76] Begins the property-and-financing label/value table.
    table([
        # [L77] Adds the fictional subject-property address to the transaction table.
        ('Property', '1048 Example Mesa Drive, Henderson, NV 89052'),
        # [L78] Adds the detached, single-unit, primary-residence property description.
        ('Property description', 'Detached single-family home; one unit; primary residence'),
        # [L79] Adds the explicitly fictional sample parcel and legal description.
        ('Sample parcel / legal description', 'SAMPLE-000-00-000; Lot 8, Block B, Example Mesa Estates (fictional reference only)'),
        # [L80] Adds the illustrative $485,000 purchase price.
        ('Purchase price', '$485,000.00'),
        # [L81] Adds the illustrative $388,000 conventional mortgage amount, 30-year term, and 6.25% fixed rate.
        ('Conventional first mortgage', '$388,000.00; 30 years; fixed rate of 6.25% (illustrative)'),
        # [L82] Adds the illustrative $97,000 down payment and buyer-funds source.
        ('Buyer down payment', '$97,000.00 (20%); buyer checking and savings'),
        # [L83] Adds the illustrative $10,000 earnest-money amount and due date/time.
        ('Earnest money', '$10,000.00 due September 11, 2026, at 5:00 p.m. Pacific'),
        # [L84] Adds the illustrative closing deadline and possession-at-recording terms.
        ('Closing / possession', 'October 23, 2026, by 5:00 p.m. Pacific; possession at recording'),
        # [L85] Adds the fictional escrow-holder name.
        ('Escrow holder', 'Example Escrow Services LLC (fictional)'),
    # [L86] Completes the property-and-financing table and adds it to the document story.
    ]),
    # [L87] Adds the Closing funds and allocation section heading.
    p('Closing funds and allocation', 'SampleSection'),
    # [L88] Begins the paragraph specifying illustrative buyer costs and seller contribution.
    p('Buyer closing costs and prepaids are estimated at $12,000. Seller contributes $5,000 toward allowable buyer costs; '
      # [L89] Continues that paragraph with allocation of remaining costs, seller liens, and earnest-money credit.
      'buyer pays the remaining buyer costs. Seller pays seller-side charges and any seller liens. The deposit is credited toward the down payment.'),
    # [L90] Begins the paragraph displaying the hardcoded $94,000 estimated remaining cash and its arithmetic explanation.
    p('<b>Estimated buyer cash remaining at closing: $94,000</b> = $97,000 down payment + $12,000 buyer costs - $5,000 seller '
      # [L91] Completes the cash-to-close explanation and clarifies that earnest money is planned rather than already paid.
      'credit - $10,000 earnest money. The deposit is planned for September 11 and is not represented as already paid on September 9.'),
    # [L92] Adds the Sample assumptions section heading.
    p('Sample assumptions', 'SampleSection'),
    # [L93] Begins the paragraph describing the fictional build year, lack of HOA, and financing assumptions.
    p('The fictional dwelling was built in 2005 and has no homeowners association. No additional financing, gifts, or '
      # [L94] Continues the assumptions paragraph with the absence of a sale contingency and a lead-in to agent contacts.
      'sale-of-home contingency are included. Fictional listing/seller-agent and buyer-agent contacts are provided in '
      # [L95] Completes the assumptions paragraph by referencing Exhibit B and the agreement's selected contingencies.
      '<b>Exhibit B</b>. The transaction is subject to the selected financing, inspection and appraisal contingencies in the main sample agreement.'),
    # [L96] Begins the emphasized paragraph explaining that the PDF is an unsigned practice example.
    p('<b>Sample status controls:</b> this entire PDF is an unsigned practice example. It makes no actual offer or commitment '
      # [L97] Continues that paragraph with the absence of legal obligations and actual transaction approvals/receipts.
      'and creates no legal obligation. No actual disclosures, appraisal, loan approval or escrow receipt have been issued. '
      # [L98] Completes the sample-status paragraph by stating that no real signatures or license numbers are supplied.
      'No real signatures or license numbers are provided.'),
    # [L99] Begins the small-print attribution paragraph naming the purchase-agreement template source.
    p('Template source: FreeForms, Nevada Residential Real Estate Purchase Agreement (8 pages), matching the supplied image. '
      # [L100] Continues the attribution paragraph with the fictional nature of inserted content and a lead-in to section-reference mapping.
      'The inserted values and exhibits were created for this fictional example. Main agreement references to Section V(c), '
      # [L101] Completes the sample's section-reference mapping and applies the small-print paragraph style.
      'IV and XXIII are read in this sample as Sections 3, 4 and 22, respectively.', 'SampleSmall'),
    # [L102] Inserts an explicit page break so Exhibit B starts on its own page.
    PageBreak(),
    # [L103] Adds the Exhibit B title in the large centered title style.
    p('EXHIBIT B', 'SampleTitle'),
    # [L104] Adds the fictional real-estate-agent contact subtitle.
    p('Fictional Real Estate Agent Contacts', 'SampleSubtitle'),
    # [L105] Begins Exhibit B's introduction with the fictional subject-property address and agreement reference.
    p('Contact schedule for <b>1048 Example Mesa Drive, Henderson, NV 89052</b>, under the sample purchase agreement dated '
      # [L106] Completes the introduction with the illustrative date and fictional-test-data statement.
      '<b>September 9, 2026</b>. Every contact detail below is fictional test data.'),
    # [L107] Adds the Listing Agent / Seller's Agent section heading.
    p("Listing Agent / Seller's Agent", 'SampleSection'),
    # [L108] Adds text identifying Avery Ellis as the fictional seller's representative and equating the listing/seller-agent roles.
    p("<b>Listing agent and seller's agent refer to the same role.</b> Avery Ellis represents the seller, Casey Lane Brooks, in this fictional transaction."),
    # [L109] Begins the fictional listing-agent contact table.
    table([
        # [L110] Adds Avery and Ellis as separate first-name and last-name rows.
        ('First name', 'Avery'), ('Last name', 'Ellis'),
        # [L111] Adds the listing agent's fictional brokerage.
        ('Brokerage', 'Example Mesa Realty (fictional)'),
        # [L112] Adds the listing agent's fictional work, home, and mobile phone numbers as separate rows.
        ('Work phone', '(702) 555-0110'), ('Home phone', '(702) 555-0112'), ('Mobile phone', '(702) 555-0111'),
        # [L113] Adds the listing agent's example.com email address.
        ('Email', 'avery.ellis@example.com'),
    # [L114] Completes the listing-agent contact table and adds it to the story.
    ]),
    # [L115] Adds the Buyer's Agent section heading.
    p("Buyer's Agent", 'SampleSection'),
    # [L116] Begins the paragraph identifying Morgan Rivera as the fictional buyer's representative.
    p('Morgan Rivera represents the buyer, Taylor Morgan Bennett, in this fictional transaction. '
      # [L117] Completes the paragraph distinguishing the buyer's agent from the listing/seller's agent.
      "Morgan Rivera is the buyer's representative and is not the listing/seller's agent."),
    # [L118] Begins the fictional buyer-agent contact table.
    table([
        # [L119] Adds Morgan and Rivera as separate first-name and last-name rows.
        ('First name', 'Morgan'), ('Last name', 'Rivera'),
        # [L120] Adds the buyer agent's fictional brokerage.
        ('Brokerage', 'Sample Valley Homes (fictional)'),
        # [L121] Adds the buyer agent's fictional work, home, and mobile phone numbers as separate rows.
        ('Work phone', '(702) 555-0120'), ('Home phone', '(702) 555-0122'), ('Mobile phone', '(702) 555-0121'),
        # [L122] Adds the buyer agent's example.com email address.
        ('Email', 'morgan.rivera@example.com'),
    # [L123] Completes the buyer-agent contact table and adds it to the story.
    ]),
    # [L124] Adds the Property access contact section heading.
    p('Property access contact', 'SampleSection'),
    # [L125] Adds a paragraph assigning fictional purchase access to Avery Ellis, the listing/seller's agent.
    p("For this fictional purchase, the property access contact is <b>Avery Ellis, the listing/seller's agent</b>, using the contact details above."),
    # [L126] Adds small-print text distinguishing the two sample agents and disclaiming real agreements, signatures, licensing, or contact authorization.
    p('These sample agents are separate individuals. No actual agency agreement, signature, license number, or real-world contact authorization is created by this practice exhibit.', 'SampleSmall'),
# [L127] Ends the ordered document-story list.
]
# [L128] Builds the in-memory exhibit PDF and uses frame to draw headers and footers on every page.
document.build(story, onFirstPage=frame, onLaterPages=frame)
# [L129] Opens the generated exhibit bytes as a PDF reader.
new_pages = PdfReader(BytesIO(pages.getvalue()))
# [L130] Asserts that the exhibits occupy exactly two pages, reporting the actual count if layout overflow occurs.
assert len(new_pages.pages) == 2, f'Exhibits overflowed: {len(new_pages.pages)} pages'
# [L131] Blank line separating the surrounding declarations, statements, or document blocks.

# [L132] Creates the PDF writer used to assemble the final document.
writer = PdfWriter()
# [L133] Clones the source document into the writer, preserving its document structure and form fields.
writer.clone_document_from_reader(reader)
# [L134] Begins the map of existing form-field names to replacement values.
updates = {
    # [L135] Sets the Print Name_5 replacement to the fictional buyer-agent name Morgan Rivera.
    'Print Name_5': 'Morgan Rivera',
    # [L136] Sets the Print Name_6 replacement to the fictional listing-agent name Avery Ellis.
    'Print Name_6': 'Avery Ellis',
    # [L137] Sets field 1_2 to the one-page Exhibit A description.
    '1_2': 'Exhibit A - Fictional Transaction Terms and Sample Status - one page.',
    # [L138] Sets field 2_2 to the one-page Exhibit B description.
    '2_2': 'Exhibit B - Fictional Real Estate Agent Contacts - one page.',
    # [L139] Sets the existing undefined_11 button/checkbox field to its /On value.
    'undefined_11': '/On',
# [L140] Ends the form-field replacement map.
}
# [L141] Updates matching page form fields across the writer's pages and disables the document's automatic appearance-regeneration flag.
writer.update_page_form_field_values(None, updates, auto_regenerate=False)
# [L142] Deletes the cloned document's ninth page, which will be replaced by the new exhibits.
del writer.pages[8]
# [L143] Iterates the two newly generated exhibit pages.
for page in new_pages.pages:
    # [L144] Appends each generated exhibit page to the cloned agreement.
    writer.add_page(page)
# [L145] Sets the combined PDF's title metadata to identify the fictional agent-contact version.
writer.add_metadata({'/Title': 'Sample Nevada Purchase Contract - Fictional Agent Contacts'})
# [L146] Opens the designated output PDF in binary-write mode, creating or replacing that output file.
with output.open('wb') as target:
    # [L147] Serializes the assembled PDF to the open output file.
    writer.write(target)
# [L148] Blank line separating the surrounding declarations, statements, or document blocks.

# [L149] Reopens the saved output for post-write validation.
updated = PdfReader(output)
# [L150] Asserts that the combined agreement and exhibits contain ten pages.
assert len(updated.pages) == 10
# [L151] Reads the output's interactive fields, substituting an empty dictionary if absent.
fields = updated.get_fields() or {}
# [L152] Asserts that no interactive-field names were added or removed compared with the source.
assert set(fields) == set(original_fields), 'Interactive field inventory changed'
# [L153] Visits every original field to validate its saved canonical value.
for name, before in original_fields.items():
    # [L154] Chooses the requested replacement value for changed fields and the original /V value for all others.
    expected = updates.get(name, before.get('/V'))
    # [L155] Asserts that the saved field value matches the expected changed or preserved value.
    assert fields[name].get('/V') == expected, f'Unexpected canonical field change: {name}'
    # [L156] Performs additional widget and appearance checks for fields intentionally updated.
    if name in updates:
        # [L157] Finds all page annotation objects whose field name matches the updated field.
        widgets = [a.get_object() for page in updated.pages for a in page.get('/Annots', []) if a.get_object().get('/T') == name]
        # [L158] Asserts that exactly one widget annotation exists for that updated field.
        assert len(widgets) == 1
        # [L159] Asserts that the widget's own /V value matches the expected canonical field value.
        assert widgets[0].get('/V') == expected
        # [L160] Reads the widget's normal appearance entry from its appearance dictionary.
        appearance = widgets[0]['/AP']['/N']
        # [L161] Checks whether the widget is a PDF button/checkbox field with state-specific appearances.
        if widgets[0].get('/FT') == '/Btn':
            # [L162] Asserts that the button widget's selected appearance-state name matches the expected value.
            assert str(widgets[0].get('/AS')) == expected
            # [L163] Selects the normal appearance stream for the expected button state.
            appearance = appearance[expected]
        # [L164] Asserts that the applicable appearance stream has nonempty content.
        assert len(appearance.get_data()) > 0
# [L165] Concatenates extracted text from every saved output page with newline separators.
all_text = '\n'.join(page.extract_text() for page in updated.pages)
# [L166] Concatenates all saved interactive-field values with newline separators for stale-value checks.
all_values = '\n'.join(str(field.get('/V', '')) for field in fields.values())
# [L167] Iterates obsolete no-agent descriptions that should have been removed from text and field values.
for stale in ['N/A - no seller agent', 'N/A - no buyer agent', 'sale-of-home contingency or agents are included']:
    # [L168] Asserts that the current obsolete description is absent from both readable text and form values.
    assert stale not in all_text + all_values
# [L169] Begins the list of fictional agent names, emails, and phone numbers required in readable PDF text.
for fact in ['Avery Ellis', 'Morgan Rivera', 'avery.ellis@example.com', 'morgan.rivera@example.com',
             # [L170] Completes that required-contact-fact list with all six work/mobile/home phone numbers.
             '(702) 555-0110', '(702) 555-0111', '(702) 555-0112', '(702) 555-0120', '(702) 555-0121', '(702) 555-0122']:
    # [L171] Asserts that each required contact fact appears in extracted output text.
    assert fact in all_text, f'Missing readable contact fact: {fact}'
# [L172] Iterates the key hardcoded transaction amounts that must remain readable in the output.
for total in ['$485,000.00', '$388,000.00', '$97,000.00', '$94,000', '$12,000', '$5,000', '$10,000.00']:
    # [L173] Asserts that each required transaction amount is present in extracted output text.
    assert total in all_text, f'Transaction term missing: {total}'
# [L174] Asserts specifically that Exhibit A, the ninth output page, contains the purchase price.
assert '$485,000.00' in updated.pages[8].extract_text()
# [L175] Iterates zero-based page indexes 6 through 9 to render agreement and exhibit review images.
for index in [6, 7, 8, 9]:
    # [L176] Opens the saved PDF through PDFium for the current rendering pass.
    pdf = pdfium.PdfDocument(output)
    # [L177] Initializes PDF form rendering so widget appearances are included.
    pdf.init_forms()
    # [L178] Renders the selected page at 1.6 scale, converts it to a Pillow image, and saves a one-based page-number PNG.
    pdf[index].render(scale=1.6).to_pil().save(render_dir / f'page-{index + 1}.png')
    # [L179] Closes the PDFium document after rendering the current page.
    pdf.close()
# [L180] Begins printing an indented JSON report with output and backup paths and the validated page count.
print(json.dumps({'output': str(output), 'backup': str(backup), 'pages': len(updated.pages),
                  # [L181] Adds the interactive-field count, replacement map, and passed-validation marker and completes the JSON report.
                  'interactiveFields': len(fields), 'updatedFields': updates, 'validation': 'passed'}, indent=2))
