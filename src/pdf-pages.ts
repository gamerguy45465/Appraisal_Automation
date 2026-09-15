// [L1] Imports readFile from node:fs/promises for asynchronous local-file reading.
import { readFile } from 'node:fs/promises';
// [L2] Imports dirname, join, resolve from node:path for filesystem path construction, resolution, and parent-directory checks.
import { dirname, join, resolve } from 'node:path';
// [L3] Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths.
import { fileURLToPath } from 'node:url';
// [L4] Imports compile-time types PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask from pdfjs-dist/types/src/display/api.js for PDF loading/document/render task compile-time interfaces.
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api.js';
// [L5] Imports AppError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError } from './errors.js';
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.

// [L7] Defines renderer output as source-label text blocks or high-detail PNG image-URL blocks.
type PageContent = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: 'high' } };
// [L8] Limits the combined uploaded PDFs to 50 rendered pages per order.
const MAX_PAGES = 50;
// [L9] Limits each encoded PNG page image to 20 MiB.
const MAX_PAGE_PNG_BYTES = 20 * 1024 * 1024;
// [L10] Limits all encoded page images in one order to 40 MiB total.
const MAX_PNG_BYTES = 40 * 1024 * 1024;
// [L11] Caps each rendered page's longest image edge at 2,400 pixels.
const MAX_PAGE_EDGE = 2400;
// [L12] Sets a 60-second local PDF-rendering budget.
const RENDER_BUDGET_MS = 60_000;
// [L13] Blank line separating the surrounding declarations, statements, or document blocks.

// [L14] Existing explanatory comment: Grok receives local page images; no PDF or resource is uploaded or fetched by this renderer.
/** Grok receives local page images; no PDF or resource is uploaded or fetched by this renderer. */
// [L15] Exports local conversion of named PDF buffers into labeled page-image content, with cancellation support.
export async function renderPdfPages(documents: Array<{ name: string; buffer: Buffer }>, signal: AbortSignal): Promise<PageContent[]> {
  // [L16] Rejects work immediately if the caller already cancelled it.
  signal.throwIfAborted();
  // [L17] Creates a separate abort controller for the renderer's own time budget.
  const budget = new AbortController();
  // [L18] Computes the absolute rendering deadline for checks during asynchronous and drawing work.
  const deadline = Date.now() + RENDER_BUDGET_MS;
  // [L19] Defines budget expiry to abort with a fixed PDF-render-timeout application error.
  const expire = (): void => budget.abort(new AppError('PDF_RENDER_TIMEOUT', 'PDF rendering took too long. Use smaller or simpler PDFs and try again.'));
  // [L20] Schedules the renderer's deadline callback after 60 seconds.
  const timer = setTimeout(expire, RENDER_BUDGET_MS);
  // [L21] Prevents the deadline timer alone from keeping the process alive.
  timer.unref();
  // [L22] Combines caller cancellation and local rendering timeout into one active signal.
  const activeSignal = AbortSignal.any([signal, budget.signal]);
  // [L23] Tracks every PDF loading task so cancellation and final cleanup can destroy them.
  const loadingTasks: PDFDocumentLoadingTask[] = [];
  // [L24] Memoizes each task's destruction promise so multiple cleanup paths share one destroy operation.
  const destruction = new Map<PDFDocumentLoadingTask, Promise<void>>();
  // [L25] Tracks the currently drawing page task for cancellation.
  let activeRender: RenderTask | undefined;
  // [L26] Defines idempotent destruction of a PDF loading task.
  const destroy = (task: PDFDocumentLoadingTask): Promise<void> => {
    // [L27] Looks up any destruction already initiated for this task.
    let promise = destruction.get(task);
    // [L28] Starts task destruction only if no earlier cleanup operation exists.
    if (!promise) {
      // [L29] Requests PDF.js cleanup and stores the resulting promise locally.
      promise = task.destroy();
      // [L30] Records the destruction promise for later cancellation/finally callers.
      destruction.set(task, promise);
      // [L31] Existing explanatory comment: Cancellation can request cleanup before the enclosing finally awaits it.
      // Cancellation can request cleanup before the enclosing finally awaits it.
      // [L32] Attaches a rejection handler immediately so early asynchronous cleanup cannot produce an unhandled rejection.
      void promise.catch(() => undefined);
    // [L33] Closes the scope or expression introduced here: Starts task destruction only if no earlier cleanup operation exists.
    }
    // [L34] Returns the shared destruction promise to any caller needing to await cleanup.
    return promise;
  // [L35] Closes the scope or expression introduced here: Defines idempotent destruction of a PDF loading task.
  };
  // [L36] Defines cancellation of drawing and all PDF loading tasks.
  const cancel = (): void => {
    // [L37] Cancels the current render task if one exists.
    activeRender?.cancel();
    // [L38] Starts destruction of every known loading task without blocking the abort callback.
    for (const task of loadingTasks) void destroy(task);
  // [L39] Closes the scope or expression introduced here: Defines cancellation of drawing and all PDF loading tasks.
  };
  // [L40] Registers cancellation cleanup once when the combined signal aborts.
  activeSignal.addEventListener('abort', cancel, { once: true });
  // [L41] Defines a cooperative deadline and cancellation checkpoint.
  const check = (): void => {
    // [L42] Expires the rendering budget if wall-clock time has passed its deadline before the timer callback ran.
    if (Date.now() >= deadline && !budget.signal.aborted) expire();
    // [L43] Throws the active abort reason when either caller cancellation or the local budget has expired.
    activeSignal.throwIfAborted();
  // [L44] Closes the scope or expression introduced here: Defines a cooperative deadline and cancellation checkpoint.
  };
  // [L45] Starts PDF loading and rendering under error classification and guaranteed cleanup.
  try {
    // [L46] Existing explanatory comment: Keep PDF.js, its worker code, and native canvas out of other providers' startup.
    // Keep PDF.js, its worker code, and native canvas out of other providers' startup.
    // [L47] Lazily imports PDF.js and the native canvas library concurrently, avoiding their startup cost for other provider paths.
    const [pdfjs, { createCanvas }] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('@napi-rs/canvas')]);
    // [L48] Rechecks cancellation and deadline after loading the rendering libraries.
    check();
    // [L49] Resolves PDF.js's installed package directory for local rendering assets.
    const packageRoot = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')));
    // [L50] Starts the allowlist mapping PDF resource kinds to installed local asset directories.
    const assets: Record<string, string> = {
      // [L51] Maps character maps, standard fonts, and WebAssembly assets to directories inside the PDF.js package.
      cMapUrl: join(packageRoot, 'cmaps'), standardFontDataUrl: join(packageRoot, 'standard_fonts'), wasmUrl: join(packageRoot, 'wasm'),
    // [L52] Closes the scope or expression introduced here: Starts the allowlist mapping PDF resource kinds to installed local asset directories.
    };
    // [L53] Defines the custom PDF asset loader that reads only approved local files.
    class LocalPdfAssets {
      // [L54] Defines asynchronous retrieval of an asset identified by resource kind and filename.
      async fetch({ kind, filename }: { kind: string; filename: string }): Promise<Uint8Array> {
        // [L55] Checks cancellation and rendering deadline before resolving an asset.
        check();
        // [L56] Reads a resource directory only for an own property in the approved asset-kind mapping.
        const base = Object.hasOwn(assets, kind) ? assets[kind] : undefined;
        // [L57] Rejects unknown asset types, disallowed filename characters, and parent-directory sequences.
        if (!base || !/^[A-Za-z0-9_.-]+$/.test(filename) || filename.includes('..')) throw new Error('Unsupported PDF resource.');
        // [L58] Resolves the requested filename against its approved local asset directory.
        const asset = resolve(base, filename);
        // [L59] Rejects any resolved file whose parent directory differs from the approved asset directory.
        if (dirname(asset) !== base) throw new Error('Unsupported PDF resource.');
        // [L60] Reads the approved local asset bytes from disk.
        const bytes = await readFile(asset);
        // [L61] Rechecks cancellation and deadline after the file read.
        check();
        // [L62] Returns the asset bytes as a Uint8Array for PDF.js.
        return new Uint8Array(bytes);
      // [L63] Closes the scope or expression introduced here: Defines asynchronous retrieval of an asset identified by resource kind and filename.
      }
    // [L64] Closes the scope or expression introduced here: Defines the custom PDF asset loader that reads only approved local files.
    }
    // [L65] Allocates loaded-document records pairing source names with PDF proxies and cleanup tasks.
    const loaded: Array<{ name: string; pdf: PDFDocumentProxy; task: PDFDocumentLoadingTask }> = [];
    // [L66] Initializes the combined document page count.
    let totalPages = 0;
    // [L67] Loads each provided PDF before beginning page rendering.
    for (const document of documents) {
      // [L68] Checks cancellation and deadline before opening another PDF.
      check();
      // [L69] Existing explanatory comment: PDF.js may transfer its input; never detach the original uploaded buffer.
      // PDF.js may transfer its input; never detach the original uploaded buffer.
      // [L70] Begins constructing restrictive local PDF.js loading options.
      const options = {
        // [L71] Copies the uploaded bytes into a fresh Uint8Array, suppresses verbosity, and asks PDF.js to stop on errors.
        data: new Uint8Array(document.buffer), verbosity: 0, stopAtErrors: true,
        // [L72] Disables automatic fetching, streaming, and range loading for the in-memory PDF source.
        disableAutoFetch: true, disableStream: true, disableRange: true,
        // [L73] Disables worker asset fetches, system fonts, and browser font-face usage.
        useWorkerFetch: false, useSystemFonts: false, disableFontFace: true,
        // [L74] Disables evaluated code and XFA handling and supplies the custom local binary-asset loader.
        isEvalSupported: false, enableXfa: false, BinaryDataFactory: LocalPdfAssets,
      // [L75] Closes the scope or expression introduced here: Begins constructing restrictive local PDF.js loading options.
      };
      // [L76] Starts PDF.js loading using the prepared local options.
      const task = pdfjs.getDocument(options);
      // [L77] Tracks the loading task immediately so abort/finally cleanup can destroy it.
      loadingTasks.push(task);
      // [L78] Waits for the parsed PDF document proxy.
      const pdf = await task.promise;
      // [L79] Checks cancellation and deadline after PDF parsing completes.
      check();
      // [L80] Adds this PDF's page count to the combined order total.
      totalPages += pdf.numPages;
      // [L81] Rejects noninteger or empty page counts with a fixed invalid-PDF error.
      if (!Number.isInteger(pdf.numPages) || pdf.numPages < 1) throw new AppError('PDF_RENDER_INVALID', 'A PDF has no readable pages. Supply a valid PDF and try again.');
      // [L82] Rejects orders exceeding the configured 50-page total before rendering page images.
      if (totalPages > MAX_PAGES) throw new AppError('PDF_PAGE_LIMIT', 'SpaceXAI supports at most 50 PDF pages per order in this application. Use shorter PDFs and try again.');
      // [L83] Reads PDF metadata to detect unsupported form technology.
      const metadata = await pdf.getMetadata();
      // [L84] Rechecks cancellation and deadline after metadata retrieval.
      check();
      // [L85] Tests the metadata's explicit XFA-present flag.
      if ((metadata.info as { IsXFAPresent?: boolean }).IsXFAPresent) {
        // [L86] Rejects dynamic XFA forms and requests a flattened PDF with visible values.
        throw new AppError('PDF_XFA_UNSUPPORTED', 'A PDF uses an unsupported dynamic XFA form. Supply a flattened PDF with all form values visible and try again.');
      // [L87] Closes the scope or expression introduced here: Tests the metadata's explicit XFA-present flag.
      }
      // [L88] Retains the parsed PDF, source filename, and loading task for the rendering phase.
      loaded.push({ name: document.name, pdf, task });
    // [L89] Closes the scope or expression introduced here: Loads each provided PDF before beginning page rendering.
    }
    // [L90] Allocates the ordered source-label and image content result.
    const result: PageContent[] = [];
    // [L91] Initializes the total encoded PNG byte counter.
    let pngBytes = 0;
    // [L92] Iterates through successfully loaded PDFs in source order.
    for (const { name, pdf, task } of loaded) {
      // [L93] Visits every page using PDF.js's one-based page numbering.
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        // [L94] Checks cancellation and deadline before requesting a page.
        check();
        // [L95] Loads the current page proxy from the parsed PDF.
        const page = await pdf.getPage(pageNumber);
        // [L96] Rechecks cancellation and deadline after loading the page.
        check();
        // [L97] Reads the page's unscaled viewport dimensions.
        const base = page.getViewport({ scale: 1 });
        // [L98] Detects nonfinite, zero, or negative page dimensions before allocating a canvas.
        if (!Number.isFinite(base.width) || !Number.isFinite(base.height) || base.width <= 0 || base.height <= 0) {
          // [L99] Rejects invalid page dimensions with a fixed invalid-PDF error.
          throw new AppError('PDF_RENDER_INVALID', 'A PDF page has invalid dimensions. Supply a valid PDF and try again.');
        // [L100] Closes the scope or expression introduced here: Detects nonfinite, zero, or negative page dimensions before allocating a canvas.
        }
        // [L101] Chooses a scale no greater than two and small enough to keep the longest edge within 2,400 pixels.
        const viewport = page.getViewport({ scale: Math.min(2, MAX_PAGE_EDGE / Math.max(base.width, base.height)) });
        // [L102] Creates a native canvas with rounded-up viewport dimensions capped at the maximum edge length.
        const canvas = createCanvas(Math.min(MAX_PAGE_EDGE, Math.ceil(viewport.width)), Math.min(MAX_PAGE_EDGE, Math.ceil(viewport.height)));
        // [L103] Starts page rendering under guaranteed page/canvas cleanup.
        try {
          // [L104] Begins drawing the PDF page into the native 2D canvas context, using a type assertion for the PDF.js canvas interface.
          activeRender = page.render({ canvas: null, canvasContext: canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
            // [L105] Supplies the scaled viewport, enables annotations, and renders against a white background.
            viewport, annotationMode: pdfjs.AnnotationMode.ENABLE, background: '#ffffff' });
          // [L106] Existing explanatory comment: Yield between PDF.js drawing batches so cancellation and the local budget can run.
          // Yield between PDF.js drawing batches so cancellation and the local budget can run.
          // [L107] Schedules each PDF.js continuation with setImmediate so the event loop can process cancellation and deadline callbacks.
          activeRender.onContinue = (continuation: () => void) => setImmediate(() => {
            // [L108] Checks abort state or deadline expiry before continuing a drawing batch.
            if (activeSignal.aborted || Date.now() >= deadline) {
              // [L109] Triggers the local timeout reason if the deadline passed without an earlier abort.
              if (!activeSignal.aborted) expire();
              // [L110] Cancels the active page render when drawing may no longer continue.
              activeRender?.cancel();
            // [L111] Continues the queued PDF drawing batch only while the signal and deadline permit it.
            } else continuation();
          // [L112] Closes the scope or expression introduced here: Schedules each PDF.js continuation with setImmediate so the event loop can process cancellation and deadline callbacks.
          });
          // [L113] Waits for the PDF page's drawing task to finish.
          await activeRender.promise;
          // [L114] Clears the current render handle after successful drawing.
          activeRender = undefined;
          // [L115] Checks cancellation and deadline before starting image encoding.
          check();
          // [L116] Existing explanatory comment: Native PNG encoding cannot be interrupted; await it before releasing the canvas.
          // Native PNG encoding cannot be interrupted; await it before releasing the canvas.
          // [L117] Asynchronously encodes the completed native canvas as a PNG buffer.
          const png = await canvas.encode('png');
          // [L118] Checks cancellation and deadline after the noninterruptible encoding step finishes.
          check();
          // [L119] Rejects a single encoded page above the configured 20 MiB limit.
          if (png.byteLength > MAX_PAGE_PNG_BYTES) throw new AppError('PDF_PAGE_IMAGE_LIMIT', 'A rendered PDF page exceeds the 20 MiB SpaceXAI image limit. Supply a simpler PDF with readable page contents and try again.');
          // [L120] Adds the encoded page size to the running image-byte total.
          pngBytes += png.byteLength;
          // [L121] Rejects the order once combined encoded page images exceed 40 MiB.
          if (pngBytes > MAX_PNG_BYTES) throw new AppError('PDF_IMAGE_LIMIT', 'Rendered PDF pages exceed the 40 MiB SpaceXAI image limit in this application. Use shorter or simpler PDFs and try again.');
          // [L122] Appends a source label naming the PDF and one-based page position before its corresponding image.
          result.push({ type: 'text', text: `Source document: ${name}. Page ${pageNumber} of ${pdf.numPages}. The following image is this PDF page.` },
            // [L123] Appends the encoded page as a high-detail PNG base64 data URL.
            { type: 'image_url', image_url: { url: `data:image/png;base64,${png.toString('base64')}`, detail: 'high' } });
        // [L124] Starts cleanup that runs for the page regardless of rendering/encoding success.
        } finally {
          // [L125] Cancels any render task still associated with this page.
          activeRender?.cancel();
          // [L126] Clears the active render reference during cleanup.
          activeRender = undefined;
          // [L127] Releases PDF.js page resources.
          page.cleanup();
          // [L128] Shrinks the canvas width to one pixel to release the large image allocation.
          canvas.width = 1;
          // [L129] Shrinks the canvas height to one pixel to complete canvas memory reduction.
          canvas.height = 1;
        // [L130] Closes the scope or expression introduced here: Starts cleanup that runs for the page regardless of rendering/encoding success.
        }
      // [L131] Closes the scope or expression introduced here: Visits every page using PDF.js's one-based page numbering.
      }
      // [L132] Waits for this document's PDF loading task to release its resources after all its pages are processed.
      await destroy(task);
      // [L133] Rechecks cancellation and deadline after document cleanup.
      check();
    // [L134] Closes the scope or expression introduced here: Iterates through successfully loaded PDFs in source order.
    }
    // [L135] Returns all labeled PNG page blocks only after every supplied PDF rendered successfully.
    return result;
  // [L136] Classifies failures from loading, validation, asset access, drawing, or encoding.
  } catch (error) {
    // [L137] Preserves the combined signal's abort reason when cancellation or the rendering budget caused the failure.
    if (activeSignal.aborted) throw activeSignal.reason;
    // [L138] Preserves explicitly classified application errors without replacing their messages.
    if (error instanceof AppError) throw error;
    // [L139] Detects PDF.js's named password-protection exception without exposing raw error text.
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PasswordException') {
      // [L140] Returns a fixed error requesting an unlocked PDF for password-protected or encrypted input.
      throw new AppError('PDF_PASSWORD_REQUIRED', 'A PDF is password protected or encrypted. Supply an unlocked PDF and try again.');
    // [L141] Closes the scope or expression introduced here: Detects PDF.js's named password-protection exception without exposing raw error text.
    }
    // [L142] Converts other failures into a fixed complete-rendering failure message.
    throw new AppError('PDF_RENDER_INVALID', 'A PDF could not be rendered completely. Supply a valid, unlocked PDF with visible page and form contents and try again.');
  // [L143] Starts final cleanup for the entire rendering operation.
  } finally {
    // [L144] Clears the rendering deadline timer after success or failure.
    clearTimeout(timer);
    // [L145] Removes the abort listener to avoid retaining the completed operation's cleanup closure.
    activeSignal.removeEventListener('abort', cancel);
    // [L146] Cancels any page drawing still active during final cleanup.
    activeRender?.cancel();
    // [L147] Awaits destruction of all loading tasks while allowing individual cleanup failures to settle without masking the main result.
    await Promise.allSettled(loadingTasks.map(destroy));
  // [L148] Closes the scope or expression introduced here: Starts final cleanup for the entire rendering operation.
  }
// [L149] Closes the scope or expression introduced here: Exports local conversion of named PDF buffers into labeled page-image content, with cancellation support.
}
