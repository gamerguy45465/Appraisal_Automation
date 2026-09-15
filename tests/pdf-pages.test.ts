// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { Canvas, createCanvas, loadImage } from "@napi-rs/canvas" for these regression tests.
import { Canvas, createCanvas, loadImage } from '@napi-rs/canvas';
// [L3] Import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs" for these regression tests.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// [L4] Import type { DocumentInitParameters, PDFDocumentLoadingTask } from "pdfjs-dist/types/src/display/api.js" for these regression tests.
import type { DocumentInitParameters, PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api.js';
// [L5] Import { renderPdfPages } from "../src/pdf-pages.js" for these regression tests.
import { renderPdfPages } from '../src/pdf-pages.js';
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.

// [L7] Declare `canvasPrototype` as the result of `Object.getPrototypeOf` using the result of `createCanvas` using 1, 1.
const canvasPrototype = Object.getPrototypeOf(createCanvas(1, 1)) as Canvas;
// [L8] Blank line separating the surrounding declarations, statements, or document blocks.

// [L9] Preserve the actual PDF.js module while wrapping its getDocument export so tests can inspect loading calls and destruction.
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', async importOriginal => {
  // [L10] Declare `actual` as the resolved value from `importOriginal` with no arguments.
  const actual = await importOriginal<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>();
  // [L11] Return all real PDF.js exports and a spy wrapper that still invokes the real getDocument implementation.
  return { ...actual, getDocument: vi.fn(actual.getDocument) };
// [L12] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L13] Blank line separating the surrounding declarations, statements, or document blocks.

// [L14] Existing comment: A valid in-memory PDF with real page graphics, text, and optional widget appearances.
/** A valid in-memory PDF with real page graphics, text, and optional widget appearances. */
// [L15] Define helper `syntheticPdf` with parameters pageCount, options for the fixture operations below.
function syntheticPdf(pageCount = 2, options: { width?: number; height?: number; annotation?: boolean; encrypted?: boolean; xfa?: boolean } = {}): Buffer {
  // [L16] Declare `width` as `options.width` or, if null/undefined, 612.
  const width = options.width ?? 612;
  // [L17] Declare `height` as `options.height` or, if null/undefined, 792.
  const height = options.height ?? 792;
  // [L18] Reserve the catalog and page-tree PDF object slots and add a Helvetica font object for visible synthetic text.
  const objects = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  // [L19] Define a helper that appends a PDF object and returns its one-based object number for later references.
  const add = (value: string): number => { objects.push(value); return objects.length; };
  // [L20] Define creation of a PDF stream object with its byte-accurate Length, optional extra dictionary entries, and drawing/content commands.
  const stream = (commands: string, extra = ''): number => add(`<< /Length ${Buffer.byteLength(commands)} ${extra} >>\nstream\n${commands}\nendstream`);
  // [L21] Collect PDF page object numbers for the page-tree Kids references.
  const pages: number[] = [];
  // [L22] Collect optional widget object numbers for the AcroForm field list.
  const widgets: number[] = [];
  // [L23] Repeat the following fixture operation with initialization `let number = 1`, condition `number` is at most `pageCount`, and update `number++`.
  for (let number = 1; number <= pageCount; number++) {
    // [L24] Reserve a PDF object slot for this page before its content and optional annotation objects are assembled.
    const pageId = add('');
    // [L25] Record this page object number in the page-tree list.
    pages.push(pageId);
    // [L26] Create this page content stream with a blue filled rectangle and black Helvetica text identifying the synthetic page number.
    const content = stream(`0 0 1 rg 40 500 100 60 re f\n0 0 0 rg BT /F1 18 Tf 40 720 Td (SYNTHETIC PAGE ${number}) Tj ET`);
    // [L27] Start with no annotation reference for this page.
    let annotation = '';
    // [L28] Add a visible widget appearance only to the first page when the annotation fixture option is enabled.
    if (options.annotation && number === 1) {
      // [L29] Create a form XObject appearance with a red rectangle and visible black form-value text, including its bounding box and font resources.
      const appearance = stream('1 0 0 rg 0 0 160 40 re f\n0 0 0 rg BT /F1 14 Tf 5 12 Td (VISIBLE FORM VALUE) Tj ET', '/Type /XObject /Subtype /Form /BBox [0 0 160 40] /Resources << /Font << /F1 3 0 R >> >>');
      // [L30] Create a printable text-field widget annotation with a visible value, fixed page rectangle, and normal appearance pointing to the form XObject.
      const widget = add(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (SyntheticField) /V (VISIBLE FORM VALUE) /Rect [40 650 200 690] /F 4 /AP << /N ${appearance} 0 R >> >>`);
      // [L31] Include the widget in the document AcroForm field list.
      widgets.push(widget);
      // [L32] Build the current page annotation-array reference to the widget object.
      annotation = `/Annots [${widget} 0 R]`;
    // [L33] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L34] Fill the reserved page object with its page-tree parent, dimensions, font resource, drawing stream reference, and optional annotation reference.
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R ${annotation} >>`;
  // [L35] Close the callback or control-flow body and finish the surrounding syntax.
  }
  // [L36] Build an AcroForm dictionary listing widget references when widgets exist; otherwise omit the form dictionary.
  let form = widgets.length ? `/AcroForm << /Fields [${widgets.map(id => `${id} 0 R`).join(' ')}] >>` : '';
  // [L37] Run the following branch when `options.xfa`.
  if (options.xfa) {
    // [L38] Create a minimal XFA XML packet as a PDF stream for the unsupported-dynamic-form test.
    const xfa = stream('<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/"><template xmlns="http://www.xfa.org/schema/xfa-template/3.3/"/></xdp:xdp>');
    // [L39] Replace the form dictionary with an XFA reference and an empty ordinary field list.
    form = `/AcroForm << /Fields [] /XFA ${xfa} 0 R >>`;
  // [L40] Close the callback or control-flow body and finish the surrounding syntax.
  }
  // [L41] Write the PDF catalog object pointing to the page tree and optional AcroForm dictionary.
  objects[0] = `<< /Type /Catalog /Pages 2 0 R ${form} >>`;
  // [L42] Write the PDF page-tree object with the declared page count and all page object references.
  objects[1] = `<< /Type /Pages /Count ${pageCount} /Kids [${pages.map(id => `${id} 0 R`).join(' ')}] >>`;
  // [L43] When requested, add a synthetic standard-encryption dictionary and retain its object number; otherwise use zero to omit encryption metadata.
  const encryptionId = options.encrypted ? add(`<< /Filter /Standard /V 1 /R 2 /Length 40 /P -4 /O <${'00'.repeat(32)}> /U <${'00'.repeat(32)}> >>`) : 0;
  // [L44] Start serializing the fixture with the PDF 1.7 header.
  let text = '%PDF-1.7\n';
  // [L45] Initialize object offsets with the reserved free-object entry used by the PDF cross-reference table.
  const offsets = [0];
  // [L46] Serialize each PDF object in object-number order.
  for (const [index, object] of objects.entries()) {
    // [L47] Record the current byte offset before writing the next PDF object.
    offsets.push(Buffer.byteLength(text));
    // [L48] Append the numbered indirect object and its body using standard obj/endobj delimiters.
    text += `${index + 1} 0 obj\n${object}\nendobj\n`;
  // [L49] Close the callback or control-flow body and finish the surrounding syntax.
  }
  // [L50] Record the byte offset where the cross-reference table will begin.
  const xref = Buffer.byteLength(text);
  // [L51] Append the cross-reference table header and the required free entry for object zero.
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  // [L52] Append each object offset as a ten-digit in-use cross-reference entry.
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  // [L53] Append the trailer with document size, root catalog, optional encryption metadata, the cross-reference offset, and the end-of-file marker.
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${encryptionId ? `/Encrypt ${encryptionId} 0 R /ID [<01020304050607080910111213141516><01020304050607080910111213141516>]` : ''} >>\nstartxref\n${xref}\n%%EOF`;
  // [L54] Encode the complete synthetic PDF text into a Buffer for renderer tests.
  return Buffer.from(text);
// [L55] Close the callback or control-flow body for `syntheticPdf` and finish the surrounding syntax.
}
// [L56] Blank line separating the surrounding declarations, statements, or document blocks.

// [L57] Group regression tests for "in-memory PDF page rendering for SpaceXAI".
describe('in-memory PDF page rendering for SpaceXAI', () => {
  // [L58] Run this setup before every test in the group.
  beforeEach(() => {
    // [L59] Configure mock `vi.mocked(getDocument)` to clear its recorded calls.
    vi.mocked(getDocument).mockClear();
    // [L60] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback that performs: Throw a new `Error` instance initialized with "A PDF render must never access the network." to simulate or report the failure..
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('A PDF render must never access the network.'); }));
  // [L61] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L62] Run this cleanup after every test in the group. Use a callback that performs: Call `vi.restoreAllMocks` without arguments. Restore all temporarily replaced global values. Restore real timer behavior..
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
// [L63] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L64] Register a test that "renders every page in document order with source markers, visible form appearances and unchanged input bytes".
  it('renders every page in document order with source markers, visible form appearances and unchanged input bytes', async () => {
    // [L65] Declare `first` as the result of `syntheticPdf` using 2, an object containing annotation: true.
    const first = syntheticPdf(2, { annotation: true });
    // [L66] Declare `second` as the result of `syntheticPdf` using 1.
    const second = syntheticPdf(1);
    // [L67] Declare `original` as the result of `Buffer.from` using `first`.
    const original = Buffer.from(first);
    // [L68] Declare `content` as the resolved value from `renderPdfPages` using an array containing an object containing name: `'urla.pdf'`, buffer: `first`, an object containing name: `'sales-contract.pdf'`, buffer: `second`, `new AbortController().signal`.
    const content = await renderPdfPages([{ name: 'urla.pdf', buffer: first }, { name: 'sales-contract.pdf', buffer: second }], new AbortController().signal);
    // [L69] Assert that `content` has length 6.
    expect(content).toHaveLength(6);
    // [L70] Assert that the result of `content.filter(part => part.type === 'text').map` using a callback that returns `part.text` deeply equals an array containing "Source document: urla.pdf. Page 1 of 2. The following image is this PDF page.", "Source document: urla.pdf. Page 2 of 2. The following image is this PDF page.", "Source document: sales-contract.pdf. Page 1 of 1. The following image is this PDF page.".
    expect(content.filter(part => part.type === 'text').map(part => part.text)).toEqual([
      // [L71] Require the first image's source label to identify URLA page 1 of 2.
      'Source document: urla.pdf. Page 1 of 2. The following image is this PDF page.',
      // [L72] Require the second image's source label to identify URLA page 2 of 2.
      'Source document: urla.pdf. Page 2 of 2. The following image is this PDF page.',
      // [L73] Require the third image's source label to identify sales-contract page 1 of 1.
      'Source document: sales-contract.pdf. Page 1 of 1. The following image is this PDF page.',
    // [L74] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L75] Declare `images` as the result of `content.filter` using a callback that returns `part.type` strictly equals "image_url".
    const images = content.filter(part => part.type === 'image_url');
    // [L76] Assert that `images` has length 3.
    expect(images).toHaveLength(3);
    // [L77] For each rendered image, assert high image detail and a URL beginning with the PNG base64 data-URL prefix.
    for (const image of images) expect(image.image_url).toMatchObject({ detail: 'high', url: expect.stringMatching(/^data:image\/png;base64,/) });
    // [L78] Declare `image` as the resolved value from `loadImage` using the result of `Buffer.from` using `images[0]!.image_url.url.split(',')[1]`, "base64".
    const image = await loadImage(Buffer.from(images[0]!.image_url.url.split(',')[1]!, 'base64'));
    // [L79] Assert that an array containing `image.width`, `image.height` deeply equals an array containing 1224, 1584.
    expect([image.width, image.height]).toEqual([1224, 1584]);
    // [L80] Declare `canvas` as the result of `createCanvas` using `image.width`, `image.height`.
    const canvas = createCanvas(image.width, image.height);
    // [L81] Declare `context` as the result of `canvas.getContext` using "2d".
    const context = canvas.getContext('2d');
    // [L82] Call `context.drawImage` with `image`, 0, 0.
    context.drawImage(image, 0, 0);
    // [L83] Assert a sampled widget-appearance pixel is opaque red, confirming the visible form appearance was rendered.
    expect([...context.getImageData(100, 230, 1, 1).data]).toEqual([255, 0, 0, 255]); // Widget appearance.
    // [L84] Assert a sampled page-graphics pixel is opaque blue, confirming the page drawing appears in the PNG.
    expect([...context.getImageData(100, 500, 1, 1).data]).toEqual([0, 0, 255, 255]); // Page graphics.
    // [L85] Declare `textPixels` as `context.getImageData(80, 110, 400, 50).data`.
    const textPixels = context.getImageData(80, 110, 400, 50).data;
    // [L86] Assert the text sampling area contains at least one dark RGB channel value, confirming visible text appears in the image.
    expect(textPixels.some((value, index) => index % 4 < 3 && value < 100)).toBe(true); // Standard-font text is visible.
    // [L87] Assert that `first` deeply equals `original`.
    expect(first).toEqual(original);
    // [L88] Assert that `fetch` does not satisfy: was called.
    expect(fetch).not.toHaveBeenCalled();
    // [L89] Assert every captured PDF loading call returned a loading task that was destroyed after rendering.
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  // [L90] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L91] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L92] Register a test that "caps oversized pages at 2400 pixels while preserving aspect ratio".
  it('caps oversized pages at 2400 pixels while preserving aspect ratio', async () => {
    // [L93] Declare `result` as the resolved value from `renderPdfPages` using an array containing an object containing name: `'wide.pdf'`, buffer: `syntheticPdf(1, { width: 1800, height: 900 })`, `new AbortController().signal`.
    const result = await renderPdfPages([{ name: 'wide.pdf', buffer: syntheticPdf(1, { width: 1800, height: 900 }) }], new AbortController().signal);
    // [L94] Declare `block` as `result[1]`.
    const block = result[1]!;
    // [L95] Assert that `block.type` strictly equals "image_url".
    expect(block.type).toBe('image_url');
    // [L96] Run the following branch when `block.type` does not strictly equal "image_url". Throw a new `Error` instance initialized with "Missing image" to simulate or report the failure.
    if (block.type !== 'image_url') throw new Error('Missing image');
    // [L97] Declare `image` as the resolved value from `loadImage` using the result of `Buffer.from` using `block.image_url.url.split(',')[1]`, "base64".
    const image = await loadImage(Buffer.from(block.image_url.url.split(',')[1]!, 'base64'));
    // [L98] Assert that an array containing `image.width`, `image.height` deeply equals an array containing 2400, 1200.
    expect([image.width, image.height]).toEqual([2400, 1200]);
  // [L99] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L100] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L101] Register a parameterized test that "rejects $name with an actionable error and destroys its loader".
  it.each([
    // [L102] Set fixture property `name` to "invalid PDF". Set fixture property `buffer` to the result of `Buffer.from` using "%PDF-1.7 private-unreadable-content". Set fixture property `code` to "PDF_RENDER_INVALID".
    { name: 'invalid PDF', buffer: Buffer.from('%PDF-1.7 private-unreadable-content'), code: 'PDF_RENDER_INVALID' },
    // [L103] Set fixture property `name` to "password-protected PDF". Set fixture property `buffer` to the result of `syntheticPdf` using 1, an object containing encrypted: true. Set fixture property `code` to "PDF_PASSWORD_REQUIRED".
    { name: 'password-protected PDF', buffer: syntheticPdf(1, { encrypted: true }), code: 'PDF_PASSWORD_REQUIRED' },
    // [L104] Set fixture property `name` to "dynamic XFA form". Set fixture property `buffer` to the result of `syntheticPdf` using 1, an object containing xfa: true. Set fixture property `code` to "PDF_XFA_UNSUPPORTED".
    { name: 'dynamic XFA form', buffer: syntheticPdf(1, { xfa: true }), code: 'PDF_XFA_UNSUPPORTED' },
  // [L105] Apply the preceding scenario rows to the parameterized test "rejects $name with an actionable error and destroys its loader" and begin its callback.
  ])('rejects $name with an actionable error and destroys its loader', async ({ buffer, code }) => {
    // [L106] Assert that the result of `renderPdfPages` using an array containing an object containing name: "private-name.pdf", buffer, `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing code. Wait for the asynchronous assertion to settle.
    await expect(renderPdfPages([{ name: 'private-name.pdf', buffer }], new AbortController().signal)).rejects.toMatchObject({ code });
    // [L107] Assert every PDF loading task returned during this rejection case was destroyed.
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
    // [L108] Assert that `fetch` does not satisfy: was called.
    expect(fetch).not.toHaveBeenCalled();
  // [L109] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L110] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L111] Register a test that "rejects over 50 pages across documents before rendering or returning a partial result".
  it('rejects over 50 pages across documents before rendering or returning a partial result', async () => {
    // [L112] Declare `encode` as the result of `vi.spyOn` using `canvasPrototype`, "encode".
    const encode = vi.spyOn(canvasPrototype, 'encode');
    // [L113] Assert that the result of `renderPdfPages` using an array containing an object containing name: "urla.pdf", buffer: the result of `syntheticPdf` using `30`, an object containing name: "sales-contract.pdf", buffer: the result of `syntheticPdf` using `21`, `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing code: "PDF_PAGE_LIMIT". Wait for the asynchronous assertion to settle.
    await expect(renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(30) }, { name: 'sales-contract.pdf', buffer: syntheticPdf(21) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_PAGE_LIMIT' });
    // [L114] Assert that `encode` does not satisfy: was called.
    expect(encode).not.toHaveBeenCalled();
    // [L115] Assert every PDF loading task was destroyed after the combined-page-limit rejection.
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  // [L116] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L117] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L118] Register a test that "rejects the complete result if encoded PNG bytes exceed the total budget".
  it('rejects the complete result if encoded PNG bytes exceed the total budget', async () => {
    // [L119] Declare `oversized` as the result of `Buffer.from` using "synthetic image bytes".
    const oversized = Buffer.from('synthetic image bytes');
    // [L120] Call `Object.defineProperty` with `oversized`, "byteLength", an object containing value: 15 times 1024 times 1024.
    Object.defineProperty(oversized, 'byteLength', { value: 15 * 1024 * 1024 });
    // [L121] Declare `encode` as the result of `vi.spyOn(canvasPrototype, 'encode').mockResolvedValue` using `oversized`.
    const encode = vi.spyOn(canvasPrototype, 'encode').mockResolvedValue(oversized);
    // [L122] Assert that the result of `renderPdfPages` using an array containing an object containing name: "large.pdf", buffer: the result of `syntheticPdf` using `3`, `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing code: "PDF_IMAGE_LIMIT". Wait for the asynchronous assertion to settle.
    await expect(renderPdfPages([{ name: 'large.pdf', buffer: syntheticPdf(3) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_IMAGE_LIMIT' });
    // [L123] Assert that `encode` was called this many times: 3.
    expect(encode).toHaveBeenCalledTimes(3);
    // [L124] Assert every PDF loading task was destroyed after the total PNG-budget rejection.
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  // [L125] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L126] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L127] Register a test that "rejects a single page above the provider image limit even below the total budget".
  it('rejects a single page above the provider image limit even below the total budget', async () => {
    // [L128] Declare `oversized` as the result of `Buffer.from` using "synthetic image bytes".
    const oversized = Buffer.from('synthetic image bytes');
    // [L129] Call `Object.defineProperty` with `oversized`, "byteLength", an object containing value: `20` times `1024` times 1024 plus 1.
    Object.defineProperty(oversized, 'byteLength', { value: 20 * 1024 * 1024 + 1 });
    // [L130] Configure mock `vi.spyOn(canvasPrototype, 'encode')` to resolve to `oversized`.
    vi.spyOn(canvasPrototype, 'encode').mockResolvedValue(oversized);
    // [L131] Assert that the result of `renderPdfPages` using an array containing an object containing name: "large-page.pdf", buffer: the result of `syntheticPdf` using `1`, `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing code: "PDF_PAGE_IMAGE_LIMIT". Wait for the asynchronous assertion to settle.
    await expect(renderPdfPages([{ name: 'large-page.pdf', buffer: syntheticPdf(1) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_PAGE_IMAGE_LIMIT' });
    // [L132] Assert every PDF loading task was destroyed after the per-page PNG-size rejection.
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  // [L133] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L134] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L135] Register a test that "rejects resource traversal, absolute paths and URLs without network access".
  it('rejects resource traversal, absolute paths and URLs without network access', async () => {
    // [L136] Call `renderPdfPages` with an array containing an object containing name: "font.pdf", buffer: the result of `syntheticPdf` using 1, `new AbortController().signal`. Wait for completion before continuing.
    await renderPdfPages([{ name: 'font.pdf', buffer: syntheticPdf(1) }], new AbortController().signal);
    // [L137] Declare `options` as `vi.mocked(getDocument).mock.calls[0]![0]`.
    const options = vi.mocked(getDocument).mock.calls[0]![0] as DocumentInitParameters;
    // [L138] Assert that `options` contains the expected object fields an object containing verbosity: 0, stopAtErrors: true, useWorkerFetch: false, isEvalSupported: false.
    expect(options).toMatchObject({ verbosity: 0, stopAtErrors: true, useWorkerFetch: false, isEvalSupported: false });
    // [L139] Declare `ResourceFactory` as `options.BinaryDataFactory`.
    const ResourceFactory = options.BinaryDataFactory as new () => { fetch(input: { kind: string; filename: string }): Promise<Uint8Array> };
    // [L140] Declare `resources` as a new `ResourceFactory` instance.
    const resources = new ResourceFactory();
    // [L141] Iterate const filename over an array containing "../private", "..\\private", "/private", "C:\\private", "https://untrusted.invalid/font", "file:///private".
    for (const filename of ['../private', '..\\private', '/private', 'C:\\private', 'https://untrusted.invalid/font', 'file:///private']) {
      // [L142] Assert that the result of `resources.fetch` using an object containing kind: "standardFontDataUrl", filename rejects with an error matching "Unsupported PDF resource". Wait for the asynchronous assertion to settle.
      await expect(resources.fetch({ kind: 'standardFontDataUrl', filename })).rejects.toThrow('Unsupported PDF resource');
    // [L143] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L144] Assert that the result of `resources.fetch` using an object containing kind: "constructor", filename: "font.pfb" rejects with an error matching "Unsupported PDF resource". Wait for the asynchronous assertion to settle.
    await expect(resources.fetch({ kind: 'constructor', filename: 'font.pfb' })).rejects.toThrow('Unsupported PDF resource');
    // [L145] Assert that `fetch` does not satisfy: was called.
    expect(fetch).not.toHaveBeenCalled();
  // [L146] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L147] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L148] Register a test that "does not start loading a PDF when already cancelled".
  it('does not start loading a PDF when already cancelled', async () => {
    // [L149] Declare `controller` as a new `AbortController` instance.
    const controller = new AbortController();
    // [L150] Abort `controller` with a new `DOMException` instance initialized with "Synthetic cancellation", "AbortError".
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    // [L151] Assert that the result of `renderPdfPages` using an array containing an object containing name: "urla.pdf", buffer: the result of `syntheticPdf` using `1`, `controller.signal` rejects and the rejection contains the expected object fields an object containing name: "AbortError". Wait for the asynchronous assertion to settle.
    await expect(renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    // [L152] Assert that `getDocument` does not satisfy: was called.
    expect(getDocument).not.toHaveBeenCalled();
  // [L153] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L154] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L155] Register a test that "destroys an in-flight loader before reporting caller cancellation".
  it('destroys an in-flight loader before reporting caller cancellation', async () => {
    // [L156] Declare `markStarted` for assignment later.
    let markStarted!: () => void;
    // [L157] Declare `started` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `markStarted`..
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    // [L158] Declare `rejectLoading` for assignment later.
    let rejectLoading!: (error: Error) => void;
    // [L159] Declare `loading` as a new `Promise` instance initialized with a callback that performs: Assign `reject` to `rejectLoading`..
    const loading = new Promise<never>((_resolve, reject) => { rejectLoading = reject; });
    // [L160] Declare `destroy` as the result of `vi.fn` using a promise-returning callback that performs: Call `rejectLoading` with a new `Error` instance initialized with "Loader destroyed"..
    const destroy = vi.fn(async () => { rejectLoading(new Error('Loader destroyed')); });
    // [L161] Configure mock `vi.mocked(getDocument)` to run on its next call a callback whose body follows.
    vi.mocked(getDocument).mockImplementationOnce(() => {
      // [L162] Call `markStarted` without arguments.
      markStarted();
      // [L163] Return an object containing promise: `loading`, destroy to the caller.
      return { promise: loading, destroy } as unknown as PDFDocumentLoadingTask;
    // [L164] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L165] Declare `controller` as a new `AbortController` instance.
    const controller = new AbortController();
    // [L166] Declare `pending` as the result of `renderPdfPages` using an array containing an object containing name: "urla.pdf", buffer: the result of `syntheticPdf` using `1`, `controller.signal`.
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal);
    // [L167] Start an asynchronous assertion that the pending render rejects with AbortError, saving its promise until cancellation is triggered.
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    // [L168] Wait for `started` to settle before continuing.
    await started;
    // [L169] Abort `controller` with a new `DOMException` instance initialized with "Synthetic cancellation", "AbortError".
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    // [L170] Wait for `rejected` to settle before continuing.
    await rejected;
    // [L171] Assert that `destroy` was called this many times: 1.
    expect(destroy).toHaveBeenCalledTimes(1);
  // [L172] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L173] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L174] Register a test that "drains native encoding and destroys the PDF before returning cancellation".
  it('drains native encoding and destroys the PDF before returning cancellation', async () => {
    // [L175] Declare `originalEncode` as `canvasPrototype.encode`.
    const originalEncode = canvasPrototype.encode as (this: Canvas, format: 'png') => Promise<Buffer>;
    // [L176] Declare `markStarted` for assignment later.
    let markStarted!: () => void;
    // [L177] Declare `started` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `markStarted`..
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    // [L178] Declare `finishEncoding` for assignment later.
    let finishEncoding!: () => void;
    // [L179] Configure mock `vi.spyOn(canvasPrototype, 'encode')` to run a promise-returning callback whose body follows.
    vi.spyOn(canvasPrototype, 'encode').mockImplementation(async function (this: Canvas) {
      // [L180] Declare `bytes` as the resolved value from `originalEncode.call` using `this`, "png".
      const bytes = await originalEncode.call(this, 'png');
      // [L181] Call `markStarted` without arguments.
      markStarted();
      // [L182] Return a new `Promise` instance initialized with a callback that performs: Assign a callback that returns the result of `resolve` using `bytes` to `finishEncoding`. to the caller.
      return new Promise<Buffer>(resolve => { finishEncoding = () => resolve(bytes); });
    // [L183] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L184] Declare `controller` as a new `AbortController` instance.
    const controller = new AbortController();
    // [L185] Declare `settled` as false.
    let settled = false;
    // [L186] Declare `pending` as the result of `renderPdfPages` using an array containing an object containing name: "urla.pdf", buffer: the result of `syntheticPdf` using `1`, `controller.signal`.
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal);
    // [L187] Attach a finally callback that records settlement, then start and save the assertion that rendering rejects with AbortError.
    const rejected = expect(pending.finally(() => { settled = true; })).rejects.toMatchObject({ name: 'AbortError' });
    // [L188] Wait for `started` to settle before continuing.
    await started;
    // [L189] Abort `controller` with a new `DOMException` instance initialized with "Synthetic cancellation", "AbortError".
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    // [L190] Wait for a new `Promise` instance initialized with a callback that returns the result of `setImmediate` using `resolve` to settle before continuing.
    await new Promise(resolve => setImmediate(resolve));
    // [L191] Assert that `settled` strictly equals false.
    expect(settled).toBe(false);
    // [L192] Call `finishEncoding` without arguments.
    finishEncoding();
    // [L193] Wait for `rejected` to settle before continuing.
    await rejected;
    // [L194] Assert that `vi.mocked(getDocument).mock.results[0]!.value.destroyed` strictly equals true.
    expect(vi.mocked(getDocument).mock.results[0]!.value.destroyed).toBe(true);
  // [L195] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L196] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L197] Register a test that "enforces the local time budget and destroys pending work".
  it('enforces the local time budget and destroys pending work', async () => {
    // [L198] Replace real timers with controllable test timers.
    vi.useFakeTimers();
    // [L199] Declare `markStarted` for assignment later.
    let markStarted!: () => void;
    // [L200] Declare `started` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `markStarted`..
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    // [L201] Declare `rejectLoading` for assignment later.
    let rejectLoading!: (error: Error) => void;
    // [L202] Declare `loading` as a new `Promise` instance initialized with a callback that performs: Assign `reject` to `rejectLoading`..
    const loading = new Promise<never>((_resolve, reject) => { rejectLoading = reject; });
    // [L203] Declare `destroy` as the result of `vi.fn` using a promise-returning callback that performs: Call `rejectLoading` with a new `Error` instance initialized with "Loader destroyed"..
    const destroy = vi.fn(async () => { rejectLoading(new Error('Loader destroyed')); });
    // [L204] Configure mock `vi.mocked(getDocument)` to run on its next call a callback whose body follows.
    vi.mocked(getDocument).mockImplementationOnce(() => {
      // [L205] Call `markStarted` without arguments.
      markStarted();
      // [L206] Return an object containing promise: `loading`, destroy to the caller.
      return { promise: loading, destroy } as unknown as PDFDocumentLoadingTask;
    // [L207] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L208] Declare `pending` as the result of `renderPdfPages` using an array containing an object containing name: "urla.pdf", buffer: the result of `syntheticPdf` using `1`, `new AbortController().signal`.
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], new AbortController().signal);
    // [L209] Start and save an asynchronous assertion that the pending render rejects with the PDF_RENDER_TIMEOUT code.
    const rejected = expect(pending).rejects.toMatchObject({ code: 'PDF_RENDER_TIMEOUT' });
    // [L210] Wait for `started` to settle before continuing.
    await started;
    // [L211] Advance fake time by 60000 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(60_000);
    // [L212] Wait for `rejected` to settle before continuing.
    await rejected;
    // [L213] Assert that `destroy` was called this many times: 1.
    expect(destroy).toHaveBeenCalledTimes(1);
  // [L214] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L215] Close the callback or control-flow body and finish the surrounding syntax.
});
