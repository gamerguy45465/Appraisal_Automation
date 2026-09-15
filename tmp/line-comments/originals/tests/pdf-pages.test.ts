import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Canvas, createCanvas, loadImage } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { DocumentInitParameters, PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api.js';
import { renderPdfPages } from '../src/pdf-pages.js';

const canvasPrototype = Object.getPrototypeOf(createCanvas(1, 1)) as Canvas;

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', async importOriginal => {
  const actual = await importOriginal<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>();
  return { ...actual, getDocument: vi.fn(actual.getDocument) };
});

/** A valid in-memory PDF with real page graphics, text, and optional widget appearances. */
function syntheticPdf(pageCount = 2, options: { width?: number; height?: number; annotation?: boolean; encrypted?: boolean; xfa?: boolean } = {}): Buffer {
  const width = options.width ?? 612;
  const height = options.height ?? 792;
  const objects = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const add = (value: string): number => { objects.push(value); return objects.length; };
  const stream = (commands: string, extra = ''): number => add(`<< /Length ${Buffer.byteLength(commands)} ${extra} >>\nstream\n${commands}\nendstream`);
  const pages: number[] = [];
  const widgets: number[] = [];
  for (let number = 1; number <= pageCount; number++) {
    const pageId = add('');
    pages.push(pageId);
    const content = stream(`0 0 1 rg 40 500 100 60 re f\n0 0 0 rg BT /F1 18 Tf 40 720 Td (SYNTHETIC PAGE ${number}) Tj ET`);
    let annotation = '';
    if (options.annotation && number === 1) {
      const appearance = stream('1 0 0 rg 0 0 160 40 re f\n0 0 0 rg BT /F1 14 Tf 5 12 Td (VISIBLE FORM VALUE) Tj ET', '/Type /XObject /Subtype /Form /BBox [0 0 160 40] /Resources << /Font << /F1 3 0 R >> >>');
      const widget = add(`<< /Type /Annot /Subtype /Widget /FT /Tx /T (SyntheticField) /V (VISIBLE FORM VALUE) /Rect [40 650 200 690] /F 4 /AP << /N ${appearance} 0 R >> >>`);
      widgets.push(widget);
      annotation = `/Annots [${widget} 0 R]`;
    }
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R ${annotation} >>`;
  }
  let form = widgets.length ? `/AcroForm << /Fields [${widgets.map(id => `${id} 0 R`).join(' ')}] >>` : '';
  if (options.xfa) {
    const xfa = stream('<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/"><template xmlns="http://www.xfa.org/schema/xfa-template/3.3/"/></xdp:xdp>');
    form = `/AcroForm << /Fields [] /XFA ${xfa} 0 R >>`;
  }
  objects[0] = `<< /Type /Catalog /Pages 2 0 R ${form} >>`;
  objects[1] = `<< /Type /Pages /Count ${pageCount} /Kids [${pages.map(id => `${id} 0 R`).join(' ')}] >>`;
  const encryptionId = options.encrypted ? add(`<< /Filter /Standard /V 1 /R 2 /Length 40 /P -4 /O <${'00'.repeat(32)}> /U <${'00'.repeat(32)}> >>`) : 0;
  let text = '%PDF-1.7\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(text));
    text += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  text += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  text += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${encryptionId ? `/Encrypt ${encryptionId} 0 R /ID [<01020304050607080910111213141516><01020304050607080910111213141516>]` : ''} >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(text);
}

describe('in-memory PDF page rendering for SpaceXAI', () => {
  beforeEach(() => {
    vi.mocked(getDocument).mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('A PDF render must never access the network.'); }));
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('renders every page in document order with source markers, visible form appearances and unchanged input bytes', async () => {
    const first = syntheticPdf(2, { annotation: true });
    const second = syntheticPdf(1);
    const original = Buffer.from(first);
    const content = await renderPdfPages([{ name: 'urla.pdf', buffer: first }, { name: 'sales-contract.pdf', buffer: second }], new AbortController().signal);
    expect(content).toHaveLength(6);
    expect(content.filter(part => part.type === 'text').map(part => part.text)).toEqual([
      'Source document: urla.pdf. Page 1 of 2. The following image is this PDF page.',
      'Source document: urla.pdf. Page 2 of 2. The following image is this PDF page.',
      'Source document: sales-contract.pdf. Page 1 of 1. The following image is this PDF page.',
    ]);
    const images = content.filter(part => part.type === 'image_url');
    expect(images).toHaveLength(3);
    for (const image of images) expect(image.image_url).toMatchObject({ detail: 'high', url: expect.stringMatching(/^data:image\/png;base64,/) });
    const image = await loadImage(Buffer.from(images[0]!.image_url.url.split(',')[1]!, 'base64'));
    expect([image.width, image.height]).toEqual([1224, 1584]);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    expect([...context.getImageData(100, 230, 1, 1).data]).toEqual([255, 0, 0, 255]); // Widget appearance.
    expect([...context.getImageData(100, 500, 1, 1).data]).toEqual([0, 0, 255, 255]); // Page graphics.
    const textPixels = context.getImageData(80, 110, 400, 50).data;
    expect(textPixels.some((value, index) => index % 4 < 3 && value < 100)).toBe(true); // Standard-font text is visible.
    expect(first).toEqual(original);
    expect(fetch).not.toHaveBeenCalled();
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  });

  it('caps oversized pages at 2400 pixels while preserving aspect ratio', async () => {
    const result = await renderPdfPages([{ name: 'wide.pdf', buffer: syntheticPdf(1, { width: 1800, height: 900 }) }], new AbortController().signal);
    const block = result[1]!;
    expect(block.type).toBe('image_url');
    if (block.type !== 'image_url') throw new Error('Missing image');
    const image = await loadImage(Buffer.from(block.image_url.url.split(',')[1]!, 'base64'));
    expect([image.width, image.height]).toEqual([2400, 1200]);
  });

  it.each([
    { name: 'invalid PDF', buffer: Buffer.from('%PDF-1.7 private-unreadable-content'), code: 'PDF_RENDER_INVALID' },
    { name: 'password-protected PDF', buffer: syntheticPdf(1, { encrypted: true }), code: 'PDF_PASSWORD_REQUIRED' },
    { name: 'dynamic XFA form', buffer: syntheticPdf(1, { xfa: true }), code: 'PDF_XFA_UNSUPPORTED' },
  ])('rejects $name with an actionable error and destroys its loader', async ({ buffer, code }) => {
    await expect(renderPdfPages([{ name: 'private-name.pdf', buffer }], new AbortController().signal)).rejects.toMatchObject({ code });
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects over 50 pages across documents before rendering or returning a partial result', async () => {
    const encode = vi.spyOn(canvasPrototype, 'encode');
    await expect(renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(30) }, { name: 'sales-contract.pdf', buffer: syntheticPdf(21) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_PAGE_LIMIT' });
    expect(encode).not.toHaveBeenCalled();
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  });

  it('rejects the complete result if encoded PNG bytes exceed the total budget', async () => {
    const oversized = Buffer.from('synthetic image bytes');
    Object.defineProperty(oversized, 'byteLength', { value: 15 * 1024 * 1024 });
    const encode = vi.spyOn(canvasPrototype, 'encode').mockResolvedValue(oversized);
    await expect(renderPdfPages([{ name: 'large.pdf', buffer: syntheticPdf(3) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_IMAGE_LIMIT' });
    expect(encode).toHaveBeenCalledTimes(3);
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  });

  it('rejects a single page above the provider image limit even below the total budget', async () => {
    const oversized = Buffer.from('synthetic image bytes');
    Object.defineProperty(oversized, 'byteLength', { value: 20 * 1024 * 1024 + 1 });
    vi.spyOn(canvasPrototype, 'encode').mockResolvedValue(oversized);
    await expect(renderPdfPages([{ name: 'large-page.pdf', buffer: syntheticPdf(1) }], new AbortController().signal)).rejects.toMatchObject({ code: 'PDF_PAGE_IMAGE_LIMIT' });
    expect(vi.mocked(getDocument).mock.results.every(result => result.type === 'return' && result.value.destroyed)).toBe(true);
  });

  it('rejects resource traversal, absolute paths and URLs without network access', async () => {
    await renderPdfPages([{ name: 'font.pdf', buffer: syntheticPdf(1) }], new AbortController().signal);
    const options = vi.mocked(getDocument).mock.calls[0]![0] as DocumentInitParameters;
    expect(options).toMatchObject({ verbosity: 0, stopAtErrors: true, useWorkerFetch: false, isEvalSupported: false });
    const ResourceFactory = options.BinaryDataFactory as new () => { fetch(input: { kind: string; filename: string }): Promise<Uint8Array> };
    const resources = new ResourceFactory();
    for (const filename of ['../private', '..\\private', '/private', 'C:\\private', 'https://untrusted.invalid/font', 'file:///private']) {
      await expect(resources.fetch({ kind: 'standardFontDataUrl', filename })).rejects.toThrow('Unsupported PDF resource');
    }
    await expect(resources.fetch({ kind: 'constructor', filename: 'font.pfb' })).rejects.toThrow('Unsupported PDF resource');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not start loading a PDF when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    await expect(renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('destroys an in-flight loader before reporting caller cancellation', async () => {
    let markStarted!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    let rejectLoading!: (error: Error) => void;
    const loading = new Promise<never>((_resolve, reject) => { rejectLoading = reject; });
    const destroy = vi.fn(async () => { rejectLoading(new Error('Loader destroyed')); });
    vi.mocked(getDocument).mockImplementationOnce(() => {
      markStarted();
      return { promise: loading, destroy } as unknown as PDFDocumentLoadingTask;
    });
    const controller = new AbortController();
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await started;
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    await rejected;
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('drains native encoding and destroys the PDF before returning cancellation', async () => {
    const originalEncode = canvasPrototype.encode as (this: Canvas, format: 'png') => Promise<Buffer>;
    let markStarted!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    let finishEncoding!: () => void;
    vi.spyOn(canvasPrototype, 'encode').mockImplementation(async function (this: Canvas) {
      const bytes = await originalEncode.call(this, 'png');
      markStarted();
      return new Promise<Buffer>(resolve => { finishEncoding = () => resolve(bytes); });
    });
    const controller = new AbortController();
    let settled = false;
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], controller.signal);
    const rejected = expect(pending.finally(() => { settled = true; })).rejects.toMatchObject({ name: 'AbortError' });
    await started;
    controller.abort(new DOMException('Synthetic cancellation', 'AbortError'));
    await new Promise(resolve => setImmediate(resolve));
    expect(settled).toBe(false);
    finishEncoding();
    await rejected;
    expect(vi.mocked(getDocument).mock.results[0]!.value.destroyed).toBe(true);
  });

  it('enforces the local time budget and destroys pending work', async () => {
    vi.useFakeTimers();
    let markStarted!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    let rejectLoading!: (error: Error) => void;
    const loading = new Promise<never>((_resolve, reject) => { rejectLoading = reject; });
    const destroy = vi.fn(async () => { rejectLoading(new Error('Loader destroyed')); });
    vi.mocked(getDocument).mockImplementationOnce(() => {
      markStarted();
      return { promise: loading, destroy } as unknown as PDFDocumentLoadingTask;
    });
    const pending = renderPdfPages([{ name: 'urla.pdf', buffer: syntheticPdf(1) }], new AbortController().signal);
    const rejected = expect(pending).rejects.toMatchObject({ code: 'PDF_RENDER_TIMEOUT' });
    await started;
    await vi.advanceTimersByTimeAsync(60_000);
    await rejected;
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
