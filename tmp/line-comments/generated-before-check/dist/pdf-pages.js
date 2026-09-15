import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from './errors.js';
const MAX_PAGES = 50;
const MAX_PAGE_PNG_BYTES = 20 * 1024 * 1024;
const MAX_PNG_BYTES = 40 * 1024 * 1024;
const MAX_PAGE_EDGE = 2400;
const RENDER_BUDGET_MS = 60_000;
/** Grok receives local page images; no PDF or resource is uploaded or fetched by this renderer. */
export async function renderPdfPages(documents, signal) {
    signal.throwIfAborted();
    const budget = new AbortController();
    const deadline = Date.now() + RENDER_BUDGET_MS;
    const expire = () => budget.abort(new AppError('PDF_RENDER_TIMEOUT', 'PDF rendering took too long. Use smaller or simpler PDFs and try again.'));
    const timer = setTimeout(expire, RENDER_BUDGET_MS);
    timer.unref();
    const activeSignal = AbortSignal.any([signal, budget.signal]);
    const loadingTasks = [];
    const destruction = new Map();
    let activeRender;
    const destroy = (task) => {
        let promise = destruction.get(task);
        if (!promise) {
            promise = task.destroy();
            destruction.set(task, promise);
            // Cancellation can request cleanup before the enclosing finally awaits it.
            void promise.catch(() => undefined);
        }
        return promise;
    };
    const cancel = () => {
        activeRender?.cancel();
        for (const task of loadingTasks)
            void destroy(task);
    };
    activeSignal.addEventListener('abort', cancel, { once: true });
    const check = () => {
        if (Date.now() >= deadline && !budget.signal.aborted)
            expire();
        activeSignal.throwIfAborted();
    };
    try {
        // Keep PDF.js, its worker code, and native canvas out of other providers' startup.
        const [pdfjs, { createCanvas }] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('@napi-rs/canvas')]);
        check();
        const packageRoot = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')));
        const assets = {
            cMapUrl: join(packageRoot, 'cmaps'), standardFontDataUrl: join(packageRoot, 'standard_fonts'), wasmUrl: join(packageRoot, 'wasm'),
        };
        class LocalPdfAssets {
            async fetch({ kind, filename }) {
                check();
                const base = Object.hasOwn(assets, kind) ? assets[kind] : undefined;
                if (!base || !/^[A-Za-z0-9_.-]+$/.test(filename) || filename.includes('..'))
                    throw new Error('Unsupported PDF resource.');
                const asset = resolve(base, filename);
                if (dirname(asset) !== base)
                    throw new Error('Unsupported PDF resource.');
                const bytes = await readFile(asset);
                check();
                return new Uint8Array(bytes);
            }
        }
        const loaded = [];
        let totalPages = 0;
        for (const document of documents) {
            check();
            // PDF.js may transfer its input; never detach the original uploaded buffer.
            const options = {
                data: new Uint8Array(document.buffer), verbosity: 0, stopAtErrors: true,
                disableAutoFetch: true, disableStream: true, disableRange: true,
                useWorkerFetch: false, useSystemFonts: false, disableFontFace: true,
                isEvalSupported: false, enableXfa: false, BinaryDataFactory: LocalPdfAssets,
            };
            const task = pdfjs.getDocument(options);
            loadingTasks.push(task);
            const pdf = await task.promise;
            check();
            totalPages += pdf.numPages;
            if (!Number.isInteger(pdf.numPages) || pdf.numPages < 1)
                throw new AppError('PDF_RENDER_INVALID', 'A PDF has no readable pages. Supply a valid PDF and try again.');
            if (totalPages > MAX_PAGES)
                throw new AppError('PDF_PAGE_LIMIT', 'SpaceXAI supports at most 50 PDF pages per order in this application. Use shorter PDFs and try again.');
            const metadata = await pdf.getMetadata();
            check();
            if (metadata.info.IsXFAPresent) {
                throw new AppError('PDF_XFA_UNSUPPORTED', 'A PDF uses an unsupported dynamic XFA form. Supply a flattened PDF with all form values visible and try again.');
            }
            loaded.push({ name: document.name, pdf, task });
        }
        const result = [];
        let pngBytes = 0;
        for (const { name, pdf, task } of loaded) {
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                check();
                const page = await pdf.getPage(pageNumber);
                check();
                const base = page.getViewport({ scale: 1 });
                if (!Number.isFinite(base.width) || !Number.isFinite(base.height) || base.width <= 0 || base.height <= 0) {
                    throw new AppError('PDF_RENDER_INVALID', 'A PDF page has invalid dimensions. Supply a valid PDF and try again.');
                }
                const viewport = page.getViewport({ scale: Math.min(2, MAX_PAGE_EDGE / Math.max(base.width, base.height)) });
                const canvas = createCanvas(Math.min(MAX_PAGE_EDGE, Math.ceil(viewport.width)), Math.min(MAX_PAGE_EDGE, Math.ceil(viewport.height)));
                try {
                    activeRender = page.render({ canvas: null, canvasContext: canvas.getContext('2d'),
                        viewport, annotationMode: pdfjs.AnnotationMode.ENABLE, background: '#ffffff' });
                    // Yield between PDF.js drawing batches so cancellation and the local budget can run.
                    activeRender.onContinue = (continuation) => setImmediate(() => {
                        if (activeSignal.aborted || Date.now() >= deadline) {
                            if (!activeSignal.aborted)
                                expire();
                            activeRender?.cancel();
                        }
                        else
                            continuation();
                    });
                    await activeRender.promise;
                    activeRender = undefined;
                    check();
                    // Native PNG encoding cannot be interrupted; await it before releasing the canvas.
                    const png = await canvas.encode('png');
                    check();
                    if (png.byteLength > MAX_PAGE_PNG_BYTES)
                        throw new AppError('PDF_PAGE_IMAGE_LIMIT', 'A rendered PDF page exceeds the 20 MiB SpaceXAI image limit. Supply a simpler PDF with readable page contents and try again.');
                    pngBytes += png.byteLength;
                    if (pngBytes > MAX_PNG_BYTES)
                        throw new AppError('PDF_IMAGE_LIMIT', 'Rendered PDF pages exceed the 40 MiB SpaceXAI image limit in this application. Use shorter or simpler PDFs and try again.');
                    result.push({ type: 'text', text: `Source document: ${name}. Page ${pageNumber} of ${pdf.numPages}. The following image is this PDF page.` }, { type: 'image_url', image_url: { url: `data:image/png;base64,${png.toString('base64')}`, detail: 'high' } });
                }
                finally {
                    activeRender?.cancel();
                    activeRender = undefined;
                    page.cleanup();
                    canvas.width = 1;
                    canvas.height = 1;
                }
            }
            await destroy(task);
            check();
        }
        return result;
    }
    catch (error) {
        if (activeSignal.aborted)
            throw activeSignal.reason;
        if (error instanceof AppError)
            throw error;
        if (error && typeof error === 'object' && 'name' in error && error.name === 'PasswordException') {
            throw new AppError('PDF_PASSWORD_REQUIRED', 'A PDF is password protected or encrypted. Supply an unlocked PDF and try again.');
        }
        throw new AppError('PDF_RENDER_INVALID', 'A PDF could not be rendered completely. Supply a valid, unlocked PDF with visible page and form contents and try again.');
    }
    finally {
        clearTimeout(timer);
        activeSignal.removeEventListener('abort', cancel);
        activeRender?.cancel();
        await Promise.allSettled(loadingTasks.map(destroy));
    }
}
//# sourceMappingURL=pdf-pages.js.map