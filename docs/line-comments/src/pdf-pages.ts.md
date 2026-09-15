# Line explanations: src/pdf-pages.ts

Source: [src/pdf-pages.ts](../../../src/pdf-pages.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports readFile from node:fs/promises for asynchronous local-file reading. |
| 2 | Imports dirname, join, resolve from node:path for filesystem path construction, resolution, and parent-directory checks. |
| 3 | Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths. |
| 4 | Imports compile-time types PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask from pdfjs-dist/types/src/display/api.js for PDF loading/document/render task compile-time interfaces. |
| 5 | Imports AppError from ./errors.js for fixed public application errors and private provider-error classification. |
| 6 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 7 | Defines renderer output as source-label text blocks or high-detail PNG image-URL blocks. |
| 8 | Limits the combined uploaded PDFs to 50 rendered pages per order. |
| 9 | Limits each encoded PNG page image to 20 MiB. |
| 10 | Limits all encoded page images in one order to 40 MiB total. |
| 11 | Caps each rendered page's longest image edge at 2,400 pixels. |
| 12 | Sets a 60-second local PDF-rendering budget. |
| 13 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 14 | Existing explanatory comment: Grok receives local page images; no PDF or resource is uploaded or fetched by this renderer. |
| 15 | Exports local conversion of named PDF buffers into labeled page-image content, with cancellation support. |
| 16 | Rejects work immediately if the caller already cancelled it. |
| 17 | Creates a separate abort controller for the renderer's own time budget. |
| 18 | Computes the absolute rendering deadline for checks during asynchronous and drawing work. |
| 19 | Defines budget expiry to abort with a fixed PDF-render-timeout application error. |
| 20 | Schedules the renderer's deadline callback after 60 seconds. |
| 21 | Prevents the deadline timer alone from keeping the process alive. |
| 22 | Combines caller cancellation and local rendering timeout into one active signal. |
| 23 | Tracks every PDF loading task so cancellation and final cleanup can destroy them. |
| 24 | Memoizes each task's destruction promise so multiple cleanup paths share one destroy operation. |
| 25 | Tracks the currently drawing page task for cancellation. |
| 26 | Defines idempotent destruction of a PDF loading task. |
| 27 | Looks up any destruction already initiated for this task. |
| 28 | Starts task destruction only if no earlier cleanup operation exists. |
| 29 | Requests PDF.js cleanup and stores the resulting promise locally. |
| 30 | Records the destruction promise for later cancellation/finally callers. |
| 31 | Existing explanatory comment: Cancellation can request cleanup before the enclosing finally awaits it. |
| 32 | Attaches a rejection handler immediately so early asynchronous cleanup cannot produce an unhandled rejection. |
| 33 | Closes the scope or expression introduced here: Starts task destruction only if no earlier cleanup operation exists. |
| 34 | Returns the shared destruction promise to any caller needing to await cleanup. |
| 35 | Closes the scope or expression introduced here: Defines idempotent destruction of a PDF loading task. |
| 36 | Defines cancellation of drawing and all PDF loading tasks. |
| 37 | Cancels the current render task if one exists. |
| 38 | Starts destruction of every known loading task without blocking the abort callback. |
| 39 | Closes the scope or expression introduced here: Defines cancellation of drawing and all PDF loading tasks. |
| 40 | Registers cancellation cleanup once when the combined signal aborts. |
| 41 | Defines a cooperative deadline and cancellation checkpoint. |
| 42 | Expires the rendering budget if wall-clock time has passed its deadline before the timer callback ran. |
| 43 | Throws the active abort reason when either caller cancellation or the local budget has expired. |
| 44 | Closes the scope or expression introduced here: Defines a cooperative deadline and cancellation checkpoint. |
| 45 | Starts PDF loading and rendering under error classification and guaranteed cleanup. |
| 46 | Existing explanatory comment: Keep PDF.js, its worker code, and native canvas out of other providers' startup. |
| 47 | Lazily imports PDF.js and the native canvas library concurrently, avoiding their startup cost for other provider paths. |
| 48 | Rechecks cancellation and deadline after loading the rendering libraries. |
| 49 | Resolves PDF.js's installed package directory for local rendering assets. |
| 50 | Starts the allowlist mapping PDF resource kinds to installed local asset directories. |
| 51 | Maps character maps, standard fonts, and WebAssembly assets to directories inside the PDF.js package. |
| 52 | Closes the scope or expression introduced here: Starts the allowlist mapping PDF resource kinds to installed local asset directories. |
| 53 | Defines the custom PDF asset loader that reads only approved local files. |
| 54 | Defines asynchronous retrieval of an asset identified by resource kind and filename. |
| 55 | Checks cancellation and rendering deadline before resolving an asset. |
| 56 | Reads a resource directory only for an own property in the approved asset-kind mapping. |
| 57 | Rejects unknown asset types, disallowed filename characters, and parent-directory sequences. |
| 58 | Resolves the requested filename against its approved local asset directory. |
| 59 | Rejects any resolved file whose parent directory differs from the approved asset directory. |
| 60 | Reads the approved local asset bytes from disk. |
| 61 | Rechecks cancellation and deadline after the file read. |
| 62 | Returns the asset bytes as a Uint8Array for PDF.js. |
| 63 | Closes the scope or expression introduced here: Defines asynchronous retrieval of an asset identified by resource kind and filename. |
| 64 | Closes the scope or expression introduced here: Defines the custom PDF asset loader that reads only approved local files. |
| 65 | Allocates loaded-document records pairing source names with PDF proxies and cleanup tasks. |
| 66 | Initializes the combined document page count. |
| 67 | Loads each provided PDF before beginning page rendering. |
| 68 | Checks cancellation and deadline before opening another PDF. |
| 69 | Existing explanatory comment: PDF.js may transfer its input; never detach the original uploaded buffer. |
| 70 | Begins constructing restrictive local PDF.js loading options. |
| 71 | Copies the uploaded bytes into a fresh Uint8Array, suppresses verbosity, and asks PDF.js to stop on errors. |
| 72 | Disables automatic fetching, streaming, and range loading for the in-memory PDF source. |
| 73 | Disables worker asset fetches, system fonts, and browser font-face usage. |
| 74 | Disables evaluated code and XFA handling and supplies the custom local binary-asset loader. |
| 75 | Closes the scope or expression introduced here: Begins constructing restrictive local PDF.js loading options. |
| 76 | Starts PDF.js loading using the prepared local options. |
| 77 | Tracks the loading task immediately so abort/finally cleanup can destroy it. |
| 78 | Waits for the parsed PDF document proxy. |
| 79 | Checks cancellation and deadline after PDF parsing completes. |
| 80 | Adds this PDF's page count to the combined order total. |
| 81 | Rejects noninteger or empty page counts with a fixed invalid-PDF error. |
| 82 | Rejects orders exceeding the configured 50-page total before rendering page images. |
| 83 | Reads PDF metadata to detect unsupported form technology. |
| 84 | Rechecks cancellation and deadline after metadata retrieval. |
| 85 | Tests the metadata's explicit XFA-present flag. |
| 86 | Rejects dynamic XFA forms and requests a flattened PDF with visible values. |
| 87 | Closes the scope or expression introduced here: Tests the metadata's explicit XFA-present flag. |
| 88 | Retains the parsed PDF, source filename, and loading task for the rendering phase. |
| 89 | Closes the scope or expression introduced here: Loads each provided PDF before beginning page rendering. |
| 90 | Allocates the ordered source-label and image content result. |
| 91 | Initializes the total encoded PNG byte counter. |
| 92 | Iterates through successfully loaded PDFs in source order. |
| 93 | Visits every page using PDF.js's one-based page numbering. |
| 94 | Checks cancellation and deadline before requesting a page. |
| 95 | Loads the current page proxy from the parsed PDF. |
| 96 | Rechecks cancellation and deadline after loading the page. |
| 97 | Reads the page's unscaled viewport dimensions. |
| 98 | Detects nonfinite, zero, or negative page dimensions before allocating a canvas. |
| 99 | Rejects invalid page dimensions with a fixed invalid-PDF error. |
| 100 | Closes the scope or expression introduced here: Detects nonfinite, zero, or negative page dimensions before allocating a canvas. |
| 101 | Chooses a scale no greater than two and small enough to keep the longest edge within 2,400 pixels. |
| 102 | Creates a native canvas with rounded-up viewport dimensions capped at the maximum edge length. |
| 103 | Starts page rendering under guaranteed page/canvas cleanup. |
| 104 | Begins drawing the PDF page into the native 2D canvas context, using a type assertion for the PDF.js canvas interface. |
| 105 | Supplies the scaled viewport, enables annotations, and renders against a white background. |
| 106 | Existing explanatory comment: Yield between PDF.js drawing batches so cancellation and the local budget can run. |
| 107 | Schedules each PDF.js continuation with setImmediate so the event loop can process cancellation and deadline callbacks. |
| 108 | Checks abort state or deadline expiry before continuing a drawing batch. |
| 109 | Triggers the local timeout reason if the deadline passed without an earlier abort. |
| 110 | Cancels the active page render when drawing may no longer continue. |
| 111 | Continues the queued PDF drawing batch only while the signal and deadline permit it. |
| 112 | Closes the scope or expression introduced here: Schedules each PDF.js continuation with setImmediate so the event loop can process cancellation and deadline callbacks. |
| 113 | Waits for the PDF page's drawing task to finish. |
| 114 | Clears the current render handle after successful drawing. |
| 115 | Checks cancellation and deadline before starting image encoding. |
| 116 | Existing explanatory comment: Native PNG encoding cannot be interrupted; await it before releasing the canvas. |
| 117 | Asynchronously encodes the completed native canvas as a PNG buffer. |
| 118 | Checks cancellation and deadline after the noninterruptible encoding step finishes. |
| 119 | Rejects a single encoded page above the configured 20 MiB limit. |
| 120 | Adds the encoded page size to the running image-byte total. |
| 121 | Rejects the order once combined encoded page images exceed 40 MiB. |
| 122 | Appends a source label naming the PDF and one-based page position before its corresponding image. |
| 123 | Appends the encoded page as a high-detail PNG base64 data URL. |
| 124 | Starts cleanup that runs for the page regardless of rendering/encoding success. |
| 125 | Cancels any render task still associated with this page. |
| 126 | Clears the active render reference during cleanup. |
| 127 | Releases PDF.js page resources. |
| 128 | Shrinks the canvas width to one pixel to release the large image allocation. |
| 129 | Shrinks the canvas height to one pixel to complete canvas memory reduction. |
| 130 | Closes the scope or expression introduced here: Starts cleanup that runs for the page regardless of rendering/encoding success. |
| 131 | Closes the scope or expression introduced here: Visits every page using PDF.js's one-based page numbering. |
| 132 | Waits for this document's PDF loading task to release its resources after all its pages are processed. |
| 133 | Rechecks cancellation and deadline after document cleanup. |
| 134 | Closes the scope or expression introduced here: Iterates through successfully loaded PDFs in source order. |
| 135 | Returns all labeled PNG page blocks only after every supplied PDF rendered successfully. |
| 136 | Classifies failures from loading, validation, asset access, drawing, or encoding. |
| 137 | Preserves the combined signal's abort reason when cancellation or the rendering budget caused the failure. |
| 138 | Preserves explicitly classified application errors without replacing their messages. |
| 139 | Detects PDF.js's named password-protection exception without exposing raw error text. |
| 140 | Returns a fixed error requesting an unlocked PDF for password-protected or encrypted input. |
| 141 | Closes the scope or expression introduced here: Detects PDF.js's named password-protection exception without exposing raw error text. |
| 142 | Converts other failures into a fixed complete-rendering failure message. |
| 143 | Starts final cleanup for the entire rendering operation. |
| 144 | Clears the rendering deadline timer after success or failure. |
| 145 | Removes the abort listener to avoid retaining the completed operation's cleanup closure. |
| 146 | Cancels any page drawing still active during final cleanup. |
| 147 | Awaits destruction of all loading tasks while allowing individual cleanup failures to settle without masking the main result. |
| 148 | Closes the scope or expression introduced here: Starts final cleanup for the entire rendering operation. |
| 149 | Closes the scope or expression introduced here: Exports local conversion of named PDF buffers into labeled page-image content, with cancellation support. |
