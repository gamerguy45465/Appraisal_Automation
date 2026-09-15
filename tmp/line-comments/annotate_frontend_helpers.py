from pathlib import Path
import json
import re
from html.parser import HTMLParser
import html

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'originals'
TARGET = ROOT / 'notes'

def read(path):
    return (SOURCE / path).read_text(encoding='utf-8-sig').splitlines()

def write(path, notes):
    lines = read(path)
    missing = [i for i, line in enumerate(lines, 1) if line.strip() and i not in notes]
    assert not missing, (path, missing)
    target = TARGET / (path + '.json')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({str(i): notes[i] for i in sorted(notes)}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{path}: {len(notes)}/{sum(bool(line.strip()) for line in lines)} nonblank lines annotated')

def mapped(text):
    return {int(line.split('|', 1)[0]): line.split('|', 1)[1] for line in text.strip().splitlines()}

app = mapped('''
1|Enables strict JavaScript semantics for the entire browser script.
3|Sets the maximum accepted PDF size to 15,728,640 bytes, which is 15 MiB.
4|Sets the normal job-status polling interval to 2.5 seconds.
5|Caps automatic reconnection delays at 15 seconds.
6|Limits each HTTP request to 45 seconds before aborting it.
7|Names the sessionStorage entry used to recover the active order after a refresh.
8|Identifies browser closure and failure as statuses that release the form for another order.
9|Starts the lookup that translates job statuses into interface labels and workflow positions.
10|Shows queued jobs as starting, with the first workflow step active.
11|Shows extracting jobs as reading documents, with the first workflow step active.
12|Shows waiting-for-login jobs as requiring R3 sign-in, with the second workflow step active.
13|Shows preparing jobs as filling the R3 order, with the second workflow step active.
14|Shows waiting-for-review jobs as ready for user review, with the third workflow step active.
15|Shows detected submissions as submitted and positions progress after all three displayed steps.
16|Shows browser closure with no active workflow step.
17|Shows failures as needing attention with no active workflow step.
18|Ends the status-to-interface lookup object.
20|Stores the order form element for validation, submission, and event handling.
21|Stores the fieldset so all order fields can be disabled together.
22|Stores the submit button to control whether another preparation can start.
23|Stores the text span inside the submit button for progress labels.
24|Stores the form error panel for displaying and focusing validation failures.
25|Stores the progress card for status styling and scrolling into view.
26|Stores the reconnect button for manual session and progress recovery.
27|Stores the connection-message element for network and session feedback.
28|Collects the URLA and sales-contract file inputs by their element IDs.
29|Collects the three workflow step elements in extraction, preparation, and review order.
30|Stores the provider selector for provider-specific form behavior.
31|Stores the optional model-ID input.
32|Stores the API-key input so labels, validation, and clearing can be managed.
33|Maps internal provider IDs to the provider names displayed by the browser script.
34|Defines initial default model IDs for each provider; session configuration can replace them.
36|Initializes a separate in-memory custom model choice for each provider.
37|Initializes the selected provider from the dropdown's current value.
38|Records that the server's initial provider preference has not yet been applied.
40|Initializes the CSRF token as empty until the workspace session supplies one.
41|Starts with no active order ID in memory.
42|Starts with no scheduled polling timer.
43|Starts the automatic reconnection attempt count at zero.
44|Marks the workspace session as unavailable until initialization succeeds.
45|Tracks whether a status request is running to prevent overlapping polls.
46|Tracks whether a preparation request is running to prevent duplicate submissions.
47|Starts without a previous rendered status for transition detection.
49|Defines an Error subclass carrying HTTP status and per-field details for interface failures.
50|Constructs a workspace error with an optional HTTP status and details array.
51|Initializes the inherited error message and Error behavior.
52|Gives this error the WorkspaceError name.
53|Stores the HTTP status used to distinguish authentication, missing-job, and connection failures.
54|Stores the detailed messages and field references used by the form error panel.
58|Defines the function that refreshes labels and help text for the selected AI provider.
59|Looks up the selected provider's displayed name.
60|Uses xAI as Grok's recipient/account name and the display name for other providers.
61|Looks up the currently configured default model for the selected provider.
62|Updates the visible API-key label to name the selected provider.
63|Updates the key input's placeholder to name the selected provider.
64|Begins choosing API-key help text, first checking for Google.
65|Supplies Google's PDF-sharing and account-settings explanation for the help text.
66|Checks whether the non-Google provider is xAI.
67|Supplies the explanation that document pages go to xAI and usage is billed to the xAI account.
68|Supplies the PDF-sharing and billing explanation for the other selected provider and completes the text update.
69|Shows the provider's default model as the optional model field's placeholder.
70|Begins choosing model-selection guidance, with a separate branch for xAI.
71|Supplies Grok's default-model guidance, capability requirements, and combined 50-page limit.
72|Supplies other providers' default-model and PDF/image/tool capability guidance and completes the update.
75|Defines how session metadata updates provider defaults and initializes the provider selection.
76|Visits every provider known by the interface.
77|Reads the server-supplied model default for the current provider when that map exists.
78|Replaces a provider's default only when the supplied value is a nonempty string after trimming.
80|Handles the older session shape that supplies a single nonempty model string without modelDefaults.
81|Uses that legacy model value as the OpenAI default.
83|Applies the server's initial provider choice only before provider initialization has completed.
84|Selects the server default only if it is one of the known provider IDs.
85|Synchronizes the in-memory selected provider with the dropdown.
86|Marks provider initialization complete so later session renewals preserve the user's selection.
89|Refreshes provider labels and model guidance using the updated defaults.
92|Defines a storage-tolerant lookup of the saved active order ID.
93|Attempts the sessionStorage read while allowing blocked storage to be handled.
94|Returns the saved active order ID from this tab's session storage.
95|Handles an exception raised while accessing session storage.
96|Returns no saved job when storage cannot be read.
100|Defines storage of an active order ID, or removal when no ID is supplied.
102|Attempts to update session storage without letting storage errors interrupt the order.
103|Saves a truthy order ID under the active-job storage key.
104|Removes the saved order ID when the supplied ID is falsy.
105|Handles sessionStorage write/removal failures without propagating them.
110|Defines the common JSON request helper with optional fetch settings, timeout, and normalized errors.
111|Creates an abort controller dedicated to this request.
112|Schedules request cancellation after the configured timeout.
113|Starts the request operation whose errors will be normalized and timer cleared.
114|Sends the HTTP request and begins constructing its fetch options.
115|Copies the caller's options, including method, body, and headers.
116|Includes credentials only for same-origin requests.
117|Requests a network response without using or updating the browser HTTP cache.
118|Connects fetch cancellation to this request's abort controller.
119|Finishes the fetch options and awaits the HTTP response.
120|Declares storage for the parsed JSON response body.
121|Attempts JSON decoding so malformed responses receive a specific workspace error.
122|Parses the response body as JSON.
123|Handles a failure to decode the response as JSON.
124|Throws an unreadable-response error while preserving the response's HTTP status.
126|Checks whether the response status falls outside fetch's successful 200-299 range.
127|Uses the server's string error message when available, otherwise a generic request-failure message.
128|Uses the server's error-details array when valid, otherwise an empty array.
129|Throws a structured workspace error containing the message, status, and field details.
131|Returns the parsed body of a successful response.
132|Handles request, decoding, and HTTP-status errors from the request block.
133|Rethrows existing WorkspaceError objects without replacing their useful details.
134|Checks whether the failure is the abort error produced by request cancellation.
135|Converts an aborted request into a user-readable timeout error.
137|Converts remaining failures into a local-application connection error.
138|Begins cleanup that runs whether the request succeeds or fails.
139|Cancels the timeout timer so it cannot abort after the request has finished.
143|Defines how the form's enabled state and submit label are updated together.
144|Disables the order fieldset when form availability is false.
145|Disables the submit button when form availability is false.
146|Replaces the submit button's text with the requested label.
147|Exposes whether an order request is in progress through the form's aria-busy attribute.
150|Defines clearing of previously displayed form errors and invalid-field indicators.
151|Hides the form error panel.
152|Removes the previous detailed error list items.
153|Removes aria-invalid from every field currently marked invalid within the form.
156|Defines rendering of a workspace error with an optional custom panel title.
157|Writes the requested error heading as text.
158|Writes the error's message as text rather than interpreting it as HTML.
159|Gets the list that will contain individual error details.
160|Accepts error details only when they are an array, otherwise uses an empty list.
161|Clears any previous detail items before showing this error.
162|Visits each supplied detailed error to render it and mark the corresponding field.
163|Skips missing details and details without a string message.
164|Creates a list item for the current detailed error.
165|Writes the detail's message into the new list item as plain text.
166|Appends the detailed error to the panel's list.
167|Finds the named form field when the detail provides a string field name.
168|Marks a resolved HTML field as invalid for assistive technology and styling.
169|Ends rendering of the individual detailed errors.
170|Hides the detail list when it contains no valid messages.
171|Makes the error panel visible.
172|Moves keyboard focus to the error panel so the error is discoverable.
175|Defines file-selection display and client-side PDF validation for one upload input.
176|Reads the first selected file, if any.
177|Finds the file-selection description associated with this input's ID.
178|Clears the previous custom browser validation message.
179|Clears the previous aria-invalid marker on this file input.
180|Sets a data attribute indicating whether a file is selected for CSS styling.
181|Displays the filename and binary-megabyte size to two decimal places, or the no-selection message.
182|Stops file-specific validation when no file has been selected.
183|Checks whether the selected filename lacks a case-insensitive .pdf extension.
184|Sets a browser validation error requiring a PDF filename.
185|Checks whether a PDF-named file has zero bytes.
186|Sets a validation message rejecting the empty file.
187|Checks whether the selected file exceeds the configured byte limit.
188|Sets the validation message for PDFs larger than 15 MiB.
190|Marks the file input invalid when any browser validity constraint fails.
193|Defines rebuilding the review-warning list from a job's warnings.
194|Gets the warning list element.
195|Removes warnings from the previously rendered job state.
196|Only iterates warnings when the supplied value is an array.
197|Filters out non-string warnings and visits the remaining warning messages.
198|Creates one list item for a warning.
199|Writes the warning into the list item as plain text.
200|Adds the warning item to the review-warning list.
201|Ends iteration over valid warning strings.
203|Hides the entire warnings section when no valid warnings were rendered.
206|Defines validation and rendering of job status, workflow markers, warnings, and terminal-state behavior.
207|Checks that the job has the required ID, message, and recognized status.
208|Rejects an unexpected job response with a reconnect-oriented workspace error.
210|Gets the badge, heading, and workflow-step configuration for this job status.
211|Stores the status in the card's data attribute for status-specific styling.
212|Updates the status badge without rewriting unchanged text.
213|Updates the status heading without rewriting unchanged text.
214|Updates the detailed progress message from the job.
215|Shows the login notice only while the job is awaiting login.
216|Shows the review notice only while the job is awaiting user review.
217|Rebuilds the warning list from the current job's warnings.
218|Updates workflow-step positions only for statuses that define a numeric step.
219|Visits each of the three workflow elements with its zero-based index.
220|Classifies each step as complete, active, or waiting relative to the configured current step.
221|Stores the computed step state for CSS styling.
222|Shows a check mark for complete steps and the one-based step number otherwise.
223|Marks the active workflow step as the current step for assistive technology.
224|Removes the current-step marker from steps that are not active.
225|Ends the workflow-marker update loop.
227|Handles failed or browser-closed jobs as terminal for this form session.
228|Visits all steps to clear any active progress state after termination.
229|Removes each step's accessibility current-step marker.
230|Returns a formerly active step to the waiting appearance.
231|Ends the terminal-state workflow cleanup loop.
232|Clears the in-memory job ID so further polling is no longer scheduled.
233|Removes the persisted active job ID from session storage.
234|Offers preparation of another order when the workspace session is ready.
236|Detects a newly entered login or review status so the interface can call attention to it once.
237|Scrolls the status card into view for the user's required action.
239|Remembers the rendered status for transition detection on the next update.
242|Defines the minimum structural validation expected of a job response.
243|Returns true only for a job with a nonempty string ID, string message, and recognized own-property status.
246|Defines a text update helper that avoids rewriting unchanged content.
247|Finds the element targeted by the supplied CSS selector.
249|Writes the new text only when it differs from the element's current text.
252|Defines scrolling that brings the progress card into view while respecting reduced-motion preferences.
253|Uses instant scrolling for reduced-motion preference and smooth scrolling otherwise.
254|Scrolls the status card into the nearest visible block position using the chosen behavior.
257|Defines displaying a connection problem and offering a manual reconnect action.
258|Writes the connection-problem message as plain text.
259|Shows the connection-message element.
260|Shows the reconnect button.
263|Defines clearing the displayed connection problem and retry backoff.
264|Hides the connection-message element.
265|Hides the reconnect button.
266|Resets retry counting after connectivity succeeds.
269|Defines scheduling of the next status request with an optional delay.
270|Cancels any previously scheduled status poll before replacing it.
271|Schedules pollJob after the requested delay only while an active job ID exists.
274|Defines fetching and rendering current job progress with missing-session handling and retry backoff.
275|Skips polling if no job is active or another poll is already running.
276|Marks a poll in progress to prevent concurrent status requests.
277|Disables manual reconnection during the current poll.
278|Attempts to fetch and render the active job's status.
279|Requests the active job endpoint, URL-encoding the ID before placing it in the path.
280|Rejects a response that lacks the expected job object.
281|Validates and renders the returned job state.
282|Clears connection feedback and retry count after a successful poll.
283|Schedules the next regular poll if rendering left an active job ID.
284|Handles polling failures and decides whether to stop or retry.
285|Treats HTTP 404 and 410 as the order session being unavailable.
286|Clears the unavailable active job ID from memory.
287|Removes the unavailable order ID from session storage.
288|Explains that progress is unavailable and asks the user to inspect any open R3 browser.
289|Hides reconnect because this missing order session cannot be recovered by another poll.
290|Applies failed-state styling to the progress card.
291|Changes the status badge to Unavailable.
292|Shows an order-session-unavailable heading.
293|Explains that the local application no longer holds progress for this order.
294|Hides any previous sign-in instruction for the unavailable session.
295|Hides any previous review instruction for the unavailable session.
296|Visits every workflow step to clear current-step presentation.
297|Removes the step's accessibility current-step attribute.
298|Returns an active step to the waiting state.
299|Ends workflow cleanup for the unavailable job session.
300|Enables another order if the workspace session is still ready.
301|Handles polling errors other than a missing or expired job session.
302|Increments the failed reconnection count used for backoff.
303|Displays the error and explains that processing may continue while automatic reconnection runs.
304|Schedules an exponentially delayed retry capped at the maximum reconnection delay.
306|Begins polling cleanup that runs after success or failure.
307|Releases the in-progress guard so another poll can run.
308|Re-enables the manual reconnect button after the request finishes.
312|Defines clearing of the API key and both selected document files from the form.
313|Erases the API-key input's current value.
314|Visits both upload controls to clear selected documents.
315|Clears the upload input's selected file.
316|Refreshes the empty-selection message and clears obsolete file-validation state.
317|Ends the document-clearing loop.
320|Defines adopting a newly accepted or recovered job and starting progress tracking.
321|Validates the job before treating the order as accepted.
322|Throws an uncertainty message when acceptance cannot be confirmed from the returned job.
324|Stores the accepted job's ID as the active order.
325|Persists the active ID so a refresh can recover progress.
326|Clears the entered API key and selected documents after acceptance.
327|Clears previous connection feedback and retry backoff.
328|Disables order fields and labels the form as already preparing an order.
329|Displays the accepted job's current progress.
330|Scrolls to progress unless the caller disabled automatic scrolling.
331|Schedules the next job-status poll if the job remains active.
334|Defines recovery of a possibly accepted order through session lookup rather than another POST.
336|Attempts a read-only session lookup to find an already accepted active job.
337|Fetches the current workspace session.
338|Refreshes the local CSRF token when the session supplies a nonempty string token.
339|Reports unsuccessful recovery when the session has no structurally valid active job.
340|Adopts and displays the active job found in the session response.
341|Reports successful recovery to the submit handler.
342|Handles any session-request or job-adoption failure during recovery.
343|Reports that recovery failed instead of throwing another error.
347|Defines the form-submit handler for validating and uploading an order-preparation request.
348|Stops the browser's normal form navigation so JavaScript can manage the request.
349|Ignores submission during another request, while a job is active, or before session readiness.
350|Clears previous form errors before validating the new request.
351|Revalidates both selected document inputs and refreshes their selection displays.
352|Shows native form-validation errors and stops if any required field or constraint fails.
353|Captures the form's current successful controls and files into multipart FormData before disabling them.
354|Marks the order request in progress to block duplicate submissions.
355|Disables the form and displays the document-upload progress label.
356|Attempts the order-preparation POST and acceptance handling.
357|Posts the multipart form data to the form's action URL with the current CSRF token header.
358|Validates and adopts the response's accepted job.
359|Handles POST failures and responses whose acceptance cannot be confirmed.
360|Classifies missing status, server errors, conflicts, and malformed successful responses as uncertain acceptance.
361|Attempts session-based recovery only when the POST may already have been accepted.
362|Shows a submit error only when an existing accepted order was not recovered.
363|Checks whether authentication or CSRF rejection requires workspace-session renewal.
364|Marks the session unready after a 401 or 403 response.
365|Shows guidance to reconnect and renew the workspace session before retrying.
367|Displays an error title distinguishing uncertain acceptance from a definite start failure.
368|Restores form availability only when no active job exists, using a label appropriate to session readiness.
370|Begins submission cleanup that runs after success or failure.
371|Clears the request-in-progress flag.
372|Marks the form as no longer busy for assistive technology.
376|Defines session initialization, provider configuration, and recovery of server- or storage-known jobs.
377|Disables reconnect while initializing the workspace session.
378|Attempts to establish a session and restore any existing job.
379|Requests current session metadata and any active job from the local application.
380|Rejects a session response without a nonempty string CSRF token.
381|Throws a user-readable error when secure session initialization cannot be confirmed.
383|Stores the session's CSRF token for subsequent order POSTs.
384|Marks the workspace session ready for authenticated requests.
385|Applies the session's model defaults and initial provider preference.
386|Clears prior connection-problem messages and retry backoff.
387|Checks whether the server already reports a valid active job.
388|Adopts that job without automatically scrolling the page during initialization.
389|Stops initialization after restoring the server-reported active job.
391|Falls back to the active job ID stored in this tab's session storage.
392|Checks whether there is a saved job ID whose progress must be restored.
393|Keeps the form disabled while displaying the progress-restoration label.
394|Fetches the saved order's current status before deciding whether another order is allowed.
395|Shows the ongoing-preparation label if polling confirms an active job remains.
396|Handles a ready session that has neither a server-reported nor a saved active job.
397|Enables the form with its default preparation label.
399|Handles any failure while initializing or restoring the workspace session.
400|Marks session readiness false after initialization fails.
401|Disables the form and shows that a workspace connection is needed.
402|Displays the initialization error and the reconnect control.
403|Begins initialization cleanup regardless of success or failure.
404|Re-enables the reconnect button after initialization finishes.
408|Registers submitOrder as the handler for browser form-submit events.
409|Registers the handler that swaps provider-specific model values and key guidance.
410|Ignores change events that do not actually change the selected provider.
411|Remembers the outgoing provider's custom model value in page memory.
412|Sets the newly selected provider from the dropdown.
413|Restores that provider's previously entered custom model value.
414|Clears the API key when switching providers so the old provider's key is not reused in the form.
415|Clears the previous invalid-state marker on the API-key input.
416|Clears the previous invalid-state marker on the model input.
417|Updates provider names, default-model placeholders, and capability/billing guidance.
418|Ends and registers the provider-change callback.
419|Registers file-selection display and validation whenever either document input changes.
420|Registers a form-wide input handler to clear stale invalid-field markers as users edit.
421|Removes aria-invalid from an edited event target when it is an HTML element.
422|Ends and registers the form-input callback.
423|Registers the asynchronous reconnect-button handler.
424|Cancels the scheduled poll before starting manual reconnection.
425|Immediately polls progress when an initialized session and active order already exist.
426|Otherwise initializes or renews the workspace session.
427|Ends and registers the reconnect-button callback.
428|Registers a handler for page display, including restoration from the back-forward cache.
429|Clears API-key and file fields when the page is restored from a persisted browser page cache.
430|Ends and registers the page-show callback.
432|Starts asynchronous workspace-session initialization and explicitly discards its promise value.
''')

context = 'top-level browser setup'
for number, line in enumerate(read('public/app.js'), 1):
    clean = line.strip()
    match = re.match(r'(?:async )?function (\w+)', clean)
    if match:
        context = match.group(1)
    elif clean.startswith('class WorkspaceError'):
        context = 'WorkspaceError class'
    if not clean or number in app:
        continue
    if clean.startswith('//'):
        app[number] = 'Documents the design constraint: ' + clean[2:].strip()
    elif clean == '}':
        app[number] = f'Closes the enclosing block within {context}.'
    else:
        raise RuntimeError(('Unexplained JavaScript line', number, clean))
write('public/app.js', app)

env = mapped('''
1|Accepts a string operation parameter constrained to set or get.
2|Makes PowerShell errors terminate the current operation so the catch block can handle failures.
3|Explains why the helper explicitly uses UTF-8 for the standard-input and standard-output pipes.
4|Configures standard-input decoding as UTF-8 without a byte-order mark.
5|Configures standard-output encoding as UTF-8 without a byte-order mark.
6|Begins guarded handling of the requested environment-variable operation.
7|Reads all standard input and parses the incoming JSON request.
8|Defines the only five environment-variable names this helper permits callers to access.
9|Rejects requests whose variable name is outside the allowlist.
10|Enters the assignment branch only when the operation is set.
11|Sets the named environment variable in this PowerShell process using the request value converted to a string.
12|Ends the optional environment-variable assignment branch.
13|Documents that the worker captures this output privately instead of forwarding it to logs or model tools.
14|Reads the named variable from this PowerShell process's environment.
15|Serializes the resulting value into a compact JSON object on standard output.
16|Handles errors from JSON parsing, validation, or the environment-variable operation.
17|Writes a generic failure message to standard error without exposing the requested value.
18|Exits the helper with status 1 to signal failure to its caller.
19|Ends environment-operation error handling.
''')
write('scripts/environment.ps1', env)

diagnostic = mapped('''
1|Imports Playwright's Chromium browser launcher.
2|Imports the compiled guarded-browser-session factory used by the application.
3|Imports the compiled environment-filtering helper used when launching Chromium.
5|Documents that login diagnostics must omit form values, headers, bodies, and query values.
6|Defines a URL summarizer that retains origin, pathname, and query parameter names without query values.
7|Attempts to parse the supplied URL while permitting invalid input to be summarized safely.
8|Parses the supplied string with the URL constructor.
9|Returns the URL origin, path, and unique query parameter names, omitting parameter values.
10|Returns an invalidUrl marker when URL parsing fails.
11|Ends the URL-summary helper.
12|Defines a reporter that emits one JSON object containing the event name and supplied details.
14|Launches a visible Chromium browser with the application-filtered process environment.
15|Creates a 1440-by-1000 context that blocks service workers and does not accept downloads.
16|Creates the browser page used for manual sign-in diagnostics.
17|Preserves the bound original CDP-session factory before wrapping it for instrumentation.
18|Replaces the CDP-session factory with an instrumented asynchronous wrapper.
19|Creates the real Chrome DevTools Protocol session for the requested target.
20|Creates a per-CDP-session map linking paused redirect request IDs to sanitized diagnostic details.
21|Observes Fetch.requestPaused events without deciding whether the guarded request should proceed.
22|Reads the paused response's status code, defaulting to zero when absent.
23|Ignores events outside the HTTP 300-399 redirect-status range.
24|Finds the Location header case-insensitively and reads its value when present.
25|Ignores redirect-status responses without a Location header.
26|Starts a diagnostic object describing the redirect without exposing query parameter values.
27|Records the redirect's HTTP status, request method, and resource type.
28|Summarizes source and destination URLs, resolving a relative Location against the source URL.
29|Completes the redirect-details object.
30|Associates the sanitized redirect details with the paused request ID.
31|Emits the redirect diagnostic event.
32|Ends and registers the paused-request listener.
33|Preserves the CDP session's bound send method before adding diagnostic reporting.
34|Wraps CDP send so guard-triggered request failures can be reported.
35|Reports Fetch.failRequest calls with saved redirect details or the protocol's failure reason.
36|Forwards the CDP command and parameters to the original send method unchanged.
37|Ends the wrapped CDP send implementation.
38|Returns the instrumented CDP session to its caller.
39|Ends the instrumented CDP-session factory assignment.
40|Observes page requests that fail.
41|Reports only navigation-request failures with method, sanitized URL, and Playwright's failure text.
42|Ends and registers the failed-request listener.
43|Creates the application's guarded session around the diagnostic browser, context, and page.
44|Reports session status updates as structured diagnostic events.
45|Completes guarded-session creation with the status callback.
46|Closes the guarded session asynchronously when the process receives Ctrl+C/SIGINT.
47|Starts a 15-minute timer that reports expiration and requests session closure.
48|Begins waiting for manual login under diagnostic error handling.
49|Waits for the user to complete sign-in through the guarded browser session.
50|Reports successful login with the sanitized destination and explicitly records that order preparation has not started.
51|Keeps diagnostics alive until the guarded browser session closes.
52|Handles a login-wait or browser-session termination error.
53|Reports the error's string code when available, otherwise BROWSER_CLOSED.
54|Begins cleanup that executes after success or failure.
55|Cancels the diagnostic deadline timer.
56|Awaits guarded-session closure to release browser resources.
57|Ends diagnostic cleanup.
''')
write('output/playwright/diagnose-login.mjs', diagnostic)

graphics = mapped('''
1|Loads Node's filesystem module for reading the logo and writing generated SVG files.
2|Loads Node's path module for constructing output and asset paths.
3|Loads Sharp from the specified local runtime dependency path to rasterize SVGs and inspect PNG metadata.
4|Uses the script's directory as the output directory.
5|Reads the local Guild logo PNG and encodes it as base64 for embedding directly in SVG markup.
6|Defines named hexadecimal colors used throughout both graphic layouts.
7|Defines escaping of ampersands and angle brackets before inserting text into SVG markup.
8|Defines an SVG text-element helper with coordinates, size, weight, color, alignment, and escaped text content.
9|Defines an SVG rectangle helper using the supplied position, dimensions, and fill color.
10|Defines an SVG line helper with configurable endpoints, color, and stroke width.
11|Defines an embedded-logo helper whose height preserves the logo's 1081-by-557 aspect ratio.
12|Defines the portrait graphic's SVG content layout.
13|Begins the ordered array of SVG fragments for the portrait graphic.
14|Places the embedded Guild logo at the upper left of the portrait graphic.
24|Draws the vertical separator between the Treasury-yield and mortgage-rate figures.
28|Draws the yellow divider beneath the portrait graphic's rate figures.
31|Draws neutral background panels for the Reno and Las Vegas housing statistics.
42|Draws the horizontal separator above the portrait graphic's disclosures and sources.
47|Concatenates the portrait SVG fragments without separators and returns the resulting markup.
48|Ends the portrait layout function.
49|Defines the square graphic's SVG content layout.
50|Begins the ordered array of SVG fragments for the square graphic.
51|Places the embedded Guild logo at the upper left of the square graphic.
59|Draws the vertical separator between the two rate figures in the square layout.
63|Draws the yellow divider above the square layout's housing snapshot.
65|Draws the square layout's neutral background panels for Reno and Las Vegas figures.
72|Draws the horizontal separator above the square layout's disclosures and sources.
77|Concatenates the square SVG fragments without separators and returns the resulting markup.
78|Ends the square layout function.
79|Defines the complete SVG document wrapper for a supplied height and content fragment.
80|Returns a 1080-pixel-wide SVG with a white background, Arial text, the supplied layout, and accessible title/description containing the hardcoded market figures.
81|Ends the SVG document-wrapper helper.
82|Converts a hexadecimal RGB color to linearized sRGB components and computes weighted relative luminance.
83|Computes the luminance contrast ratio of two colors using the brighter-over-darker formula with 0.05 offsets.
84|Starts an immediately invoked asynchronous routine that exports both graphic sizes.
85|Iterates the portrait (1080 by 1350) and square (1080 by 1080) names, heights, and generated SVG content.
86|Wraps the current layout content in a complete SVG document of the requested height.
87|Writes the current SVG document to its named file in the script's output directory.
88|Rasterizes the in-memory SVG with Sharp and writes the corresponding PNG file.
89|Reads the generated PNG's metadata with Sharp.
90|Logs the generated PNG filename, width, and height as JSON.
91|Ends the loop exporting the portrait and square graphics.
92|Logs contrast ratios for blue and black on white and neutral backgrounds.
93|Invokes the export routine, logs any rejected error, and exits the process with status 1 on failure.
''')
for number, line in enumerate(read('outputs/nevada-bond-market-2026-09-09/build-graphics.cjs'), 1):
    if not line.strip() or number in graphics:
        continue
    texts = re.findall(r"t\([^\n]*?(?:\d+),\s*'([^']*)'", line)
    assert texts, (number, line)
    graphics[number] = 'Adds positioned SVG text in the ' + ('portrait' if number < 49 else 'square') + ' layout: ' + '; '.join(repr(s) for s in texts) + '. These strings are hardcoded graphic content.'
write('outputs/nevada-bond-market-2026-09-09/build-graphics.cjs', graphics)

class AnnotatingHTML(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    PURPOSES = {'html':'the English-language HTML document root','head':'document metadata and asset references','body':'the visible document body','main':'the main application content','header':'the page header','footer':'the page footer','aside':'the progress and guidance sidebar','section':'a labeled content section','form':'the appraisal-preparation form','fieldset':'the group of order controls','legend':'the accessible name for grouped order controls','label':'a form-control label','select':'a dropdown form control','option':'a selectable dropdown choice','input':'a form input control','button':'an interactive button','a':'a navigation link','div':'a layout/content container','span':'an inline text or icon container','p':'a paragraph or status-message container','h1':'the primary page heading','h2':'a second-level heading','h3':'a third-level heading','strong':'emphasized text','ol':'an ordered workflow list','ul':'an unordered message list','li':'a list item','svg':'a scalable vector icon','path':'a vector path in the current icon','rect':'a rectangle in the current icon','br':'a text line break','noscript':'fallback content shown when JavaScript is unavailable','title':'the browser-tab title','meta':'document metadata','link':'an external document resource reference','script':'the browser script reference'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.notes = {}
        self.stack = []

    def add(self, number, note):
        self.notes.setdefault(number, []).append(note)

    def attr(self, name, value):
        if name == 'id': return f'Assigns ID {value!r} for script, label, or accessibility references.'
        if name == 'class': return f'Applies CSS classes {value!r}.'
        if name == 'for': return f'Associates the label with input ID {value!r}.'
        if name == 'name': return f'Sets the name to {value!r} for metadata identification or submitted form data.'
        if name == 'aria-hidden': return f'Sets aria-hidden to {value!r} for assistive-technology visibility.'
        if name == 'aria-label': return f'Provides the accessible label {value!r}.'
        if name == 'aria-labelledby': return f'Uses element {value!r} as the accessible section label.'
        if name == 'aria-describedby': return f'Associates help/status elements {value!r} with this input.'
        if name == 'aria-live': return f'Announces changes with {value!r} live-region priority.'
        if name == 'aria-atomic': return 'Requests that assistive technology announce the whole changed status region.'
        if name == 'role': return f'Exposes the {value!r} accessibility role.'
        if name == 'type': return f'Uses the {value!r} control type.'
        if name == 'value': return f'Uses {value!r} as the submitted choice/control value.'
        if name == 'placeholder': return f'Shows {value!r} as placeholder guidance.'
        if name == 'pattern': return f'Requires the input value to match the regular expression {value!r}.'
        if name == 'maxlength': return f'Limits entered text to {value} characters.'
        if name == 'title': return f'Provides browser guidance text {value!r}.'
        if name == 'autocomplete': return f'Sets browser autocomplete to {value!r}.'
        if name == 'spellcheck': return f'Sets browser spell-checking to {value!r}.'
        if name == 'required': return 'Requires a nonempty/selected value for native form validation.'
        if name == 'disabled': return 'Starts this control or control group disabled until JavaScript enables it.'
        if name == 'hidden': return 'Initially hides this element until application state calls for it.'
        if name == 'href': return f'Points the link/resource reference to {value!r}.'
        if name == 'src': return f'Loads the script from {value!r}.'
        if name == 'defer': return 'Defers execution of the external script until HTML parsing finishes.'
        if name == 'rel': return f'Declares the external resource relationship as {value!r}.'
        if name == 'action': return f'Targets form submission at {value!r}.'
        if name == 'method': return f'Uses the {value.upper()} form-submission method.'
        if name == 'enctype': return f'Encodes form submission as {value!r}, allowing file uploads.'
        if name == 'accept': return f'Offers the file picker the accepted PDF extensions/types {value!r}.'
        if name == 'tabindex': return f'Sets tab index {value}, allowing script focus without normal tab-order inclusion.'
        if name == 'lang': return f'Declares document language {value!r}.'
        if name == 'charset': return f'Declares the {value!r} character encoding.'
        if name == 'content': return f'Supplies metadata content {value!r}.'
        if name.startswith('data-'): return f'Initializes {name} to {value!r} for script-driven state and styling.'
        if name == 'viewbox': return f'Defines SVG coordinate bounds {value!r}.'
        if name == 'fill': return f'Sets SVG fill to {value!r}.'
        if name == 'stroke': return f'Sets the SVG stroke color to {value!r}.'
        if name == 'stroke-width': return f'Sets SVG stroke width to {value} coordinate units.'
        if name == 'stroke-linejoin': return f'Uses {value!r} joins between SVG stroke segments.'
        if name == 'stroke-linecap': return f'Uses {value!r} caps on SVG stroke ends.'
        if name == 'd': return 'Supplies the SVG path commands that draw this icon component.'
        if name in {'x','y','width','height','rx'}: return f'Sets the SVG rectangle {name} to {value}.'
        return f'Sets HTML/SVG attribute {name} to {value!r}.'

    def handle_decl(self, decl):
        self.add(self.getpos()[0], 'Declares an HTML5 document so browsers use standards mode.')

    def handle_starttag(self, tag, attrs):
        self.start(tag, attrs, tag in self.VOID)

    def handle_startendtag(self, tag, attrs):
        self.start(tag, attrs, True)

    def start(self, tag, attrs, selfclose):
        first = self.getpos()[0]
        raw = self.get_starttag_text()
        self.add(first, 'Defines ' + self.PURPOSES.get(tag, f'the {tag} element') + '.')
        for offset, part in enumerate(raw.splitlines()):
            found = re.findall(r'([\w:-]+)\s*=\s*"([^"]*)"', part)
            for name, value in found:
                self.add(first + offset, self.attr(name.lower(), html.unescape(value)))
            for name in ['required','disabled','hidden','defer']:
                if re.search(r'(?<![\w-])' + name + r'(?=\s|/?>)', part):
                    self.add(first + offset, self.attr(name, None))
            if not found and offset and part.strip():
                self.add(first + offset, f'Completes the opening {tag} element declaration.')
        if not selfclose:
            identifiers = dict(attrs)
            identity = identifiers.get('id') or identifiers.get('class') or ''
            self.stack.append((tag, identity))

    def handle_endtag(self, tag):
        identity = ''
        for index in range(len(self.stack)-1, -1, -1):
            if self.stack[index][0] == tag:
                identity = self.stack[index][1]
                del self.stack[index:]
                break
        self.add(self.getpos()[0], f'Closes the {tag} element' + (f' for {identity!r}' if identity else '') + '.')

    def handle_data(self, data):
        first = self.getpos()[0]
        for offset, part in enumerate(data.splitlines()):
            if part.strip():
                self.add(first + offset, 'Supplies the text content ' + repr(part.strip()) + '.')

parser = AnnotatingHTML()
parser.feed('\n'.join(read('public/index.html')))
write('public/index.html', {i:' '.join(dict.fromkeys(parts)) for i, parts in parser.notes.items()})

def css_declaration(name, value):
    if name.startswith('--'):
        return f'Defines reusable design variable {name} as {value}'
    meanings = {'color':'text/foreground color','background':'background','background-color':'background color','font-family':'font fallback stack','font-size':'text size','font-weight':'font weight','font-synthesis':'synthetic font-face generation','-webkit-font-smoothing':'WebKit font smoothing','box-sizing':'width/height box measurement','margin':'outer spacing','line-height':'line spacing','font':'font settings','-webkit-tap-highlight-color':'touch highlight color','cursor':'pointer appearance','transition':'animated property transitions','outline':'focus outline','outline-offset':'outline distance','display':'layout/display mode','opacity':'opacity','position':'positioning mode','width':'width','height':'height','padding':'inner spacing','overflow':'overflow handling','clip':'legacy clipping rectangle','white-space':'whitespace wrapping','border':'border','left':'left offset','top':'top offset','z-index':'stacking level','border-radius':'corner rounding','border-bottom':'bottom border','align-items':'cross-axis alignment','justify-content':'main-axis distribution','gap':'spacing between layout items','text-decoration':'text decoration','letter-spacing':'character spacing','margin-left':'left outer spacing','place-items':'grid alignment in both axes','flex-shrink':'flex shrinking factor','max-width':'maximum width','min-width':'minimum width','grid-template-columns':'grid column sizes','box-shadow':'shadow','padding-left':'left inner spacing','padding-right':'right inner spacing','margin-top':'top outer spacing','margin-bottom':'bottom outer spacing','border-color':'border color','padding-top':'top inner spacing','padding-bottom':'bottom inner spacing','min-height':'minimum height','border-top':'top border','text-align':'text alignment','list-style':'list marker style','content':'generated pseudo-element content','bottom':'bottom offset','accent-color':'native control accent color','overflow-wrap':'long-word wrapping','scroll-margin-top':'scroll target top spacing','flex-wrap':'flex item wrapping','flex-direction':'flex layout direction','margin-right':'right outer spacing'}
    return f'Sets {meanings.get(name, name)} to {value}'

css = {}
media = ''
for number, line in enumerate(read('public/styles.css'), 1):
    clean = line.strip()
    if not clean: continue
    if clean.startswith('@media'):
        media = clean[:-1].strip()
        css[number] = 'Begins responsive/accessibility rules restricted to ' + media[len('@media '):] + '.'
    elif clean == ':root {':
        css[number] = 'Begins document-wide design variables and inherited base typography/color settings.'
    elif clean == '}':
        css[number] = ('Ends the ' + media + ' rule group.') if media else 'Ends the document-root style rule.'
        media = ''
    else:
        selector = ''
        body = clean
        if '{' in clean:
            selector, body = clean.split('{', 1)
            body = body.rsplit('}', 1)[0]
        decls = [css_declaration(*[part.strip() for part in decl.split(':',1)]) for decl in body.split(';') if ':' in decl]
        assert decls, (number, line)
        css[number] = ('For elements matching ' + selector.strip() + (f' within {media}' if media else '') + ': ' if selector else '') + '; '.join(decls) + '.'
write('public/styles.css', css)

pdf_notes = mapped('''
1|Imports Path for locating the project and constructing PDF, backup, and rendering paths.
2|Imports the in-memory byte-stream class used to build and read the new exhibit PDF.
3|Imports JSON serialization for the final machine-readable result report.
4|Imports filesystem-copy utilities used to preserve a source backup.
5|Imports Python system-stream controls used to set standard-output encoding.
7|Imports pypdf's reader and writer for inspecting, cloning, updating, and assembling PDF documents.
8|Imports ReportLab color helpers for styled exhibit text, table backgrounds, and borders.
9|Imports the centered paragraph-alignment constant.
10|Imports U.S. Letter page dimensions for the generated exhibits.
11|Imports paragraph-style creation and the default style collection.
12|Imports ReportLab's document, paragraph, spacer, table, table-style, and page-break classes; Spacer is not used later in this script.
13|Imports PDFium bindings under the pdfium alias for rendering review images with form fields.
15|Configures printed reports to use UTF-8.
16|Resolves the project root as the third parent directory of this script file.
17|Locates the original sample Nevada purchase-contract PDF.
18|Defines the separate output PDF path for the version with fictional agent contacts.
19|Defines the backup path holding the sample contract before this script's agent additions.
20|Defines the directory for rendered review images of selected output pages.
21|Creates the output PDF's parent directory and any missing ancestors.
22|Creates the backup PDF's parent directory and any missing ancestors.
23|Creates the page-review image directory and any missing ancestors.
24|Checks whether the source backup has not yet been created.
25|Copies the source PDF and its filesystem metadata into the backup when absent.
26|Opens the backup PDF as the stable input document.
27|Asserts that the backup document contains the expected nine pages.
28|Reads the source interactive-field dictionary, using an empty dictionary when no fields exist.
29|Asserts that none of the source interactive fields has the PDF signature-field type.
31|Creates the base ReportLab stylesheet that will be extended for the exhibits.
32|Adds the body style with Helvetica, 9.5-point text, 12-point line spacing, and 7 points after paragraphs.
33|Adds the smaller gray explanatory style with 7.5-point text and 9.5-point line spacing.
34|Adds the centered bold 17-point exhibit-title style.
35|Adds the centered bold 12-point exhibit-subtitle style.
36|Adds the bold 11.5-point section-heading style with space before and after each heading.
37|Adds a 9.2-point Helvetica style for table values.
38|Adds a matching bold 9.2-point style for table labels.
40|Defines a shorthand for constructing a paragraph with the requested named style, defaulting to body text.
41|Returns a ReportLab Paragraph that interprets its text using the selected stylesheet entry.
43|Defines a two-column exhibit-table builder with default widths of 159 and 357 points.
44|Converts each label/value pair into styled paragraphs and creates a left-aligned table with the requested widths.
45|Begins applying background, grid, alignment, and padding rules to the table.
46|Colors the first column's background light blue-gray for every row.
47|Draws a 0.4-point grid around all table cells with the specified border color.
48|Top-aligns the contents of every table cell.
49|Applies 8 points of inner padding on the left and right of every cell.
50|Applies 5 points of inner padding above and below every cell.
51|Completes the table-style list and applies it to the table.
52|Returns the formatted table flowable for insertion into the document story.
54|Defines the header/footer drawing callback used on both generated exhibit pages.
55|Saves the drawing canvas's current graphics state before adding page decorations.
56|Selects the red fill color for the sample-status heading.
57|Selects 8.5-point Helvetica Bold for the sample-status heading.
58|Draws the centered SAMPLE/FICTIONAL/NOT FOR EXECUTION banner near the top of the page.
59|Switches the drawing color to gray for footer text.
60|Selects 7-point Helvetica for the disclaimers and page labels.
61|Draws the centered footer explaining that the inserted details are synthetic and unsigned.
62|Labels the first generated page Exhibit A and subsequent generated pages Exhibit B.
63|Draws the exhibit label and its one-page page count at the lower left.
64|Draws the combined-document page number at the lower right, offsetting generated page numbers by eight.
65|Restores the canvas graphics state so page decorations do not affect document content.
67|Creates the memory buffer that will receive the two-page exhibit PDF.
68|Creates a Letter-sized document template in memory with 48-point side margins, a 44-point top margin, and a 60-point bottom margin.
69|Sets the generated exhibit PDF's title and author metadata and completes template construction.
70|Begins the ordered story of headings, paragraphs, tables, and the exhibit page break.
71|Adds the Exhibit A title in the large centered title style.
72|Adds the subtitle describing fictional transaction terms and sample status.
73|Begins the Exhibit A introductory paragraph identifying the sample Nevada agreement and its illustrative date.
74|Continues that paragraph with the fictional buyer and seller names and the illustrative-data explanation.
75|Adds the Property and financing section heading.
76|Begins the property-and-financing label/value table.
77|Adds the fictional subject-property address to the transaction table.
78|Adds the detached, single-unit, primary-residence property description.
79|Adds the explicitly fictional sample parcel and legal description.
80|Adds the illustrative $485,000 purchase price.
81|Adds the illustrative $388,000 conventional mortgage amount, 30-year term, and 6.25% fixed rate.
82|Adds the illustrative $97,000 down payment and buyer-funds source.
83|Adds the illustrative $10,000 earnest-money amount and due date/time.
84|Adds the illustrative closing deadline and possession-at-recording terms.
85|Adds the fictional escrow-holder name.
86|Completes the property-and-financing table and adds it to the document story.
87|Adds the Closing funds and allocation section heading.
88|Begins the paragraph specifying illustrative buyer costs and seller contribution.
89|Continues that paragraph with allocation of remaining costs, seller liens, and earnest-money credit.
90|Begins the paragraph displaying the hardcoded $94,000 estimated remaining cash and its arithmetic explanation.
91|Completes the cash-to-close explanation and clarifies that earnest money is planned rather than already paid.
92|Adds the Sample assumptions section heading.
93|Begins the paragraph describing the fictional build year, lack of HOA, and financing assumptions.
94|Continues the assumptions paragraph with the absence of a sale contingency and a lead-in to agent contacts.
95|Completes the assumptions paragraph by referencing Exhibit B and the agreement's selected contingencies.
96|Begins the emphasized paragraph explaining that the PDF is an unsigned practice example.
97|Continues that paragraph with the absence of legal obligations and actual transaction approvals/receipts.
98|Completes the sample-status paragraph by stating that no real signatures or license numbers are supplied.
99|Begins the small-print attribution paragraph naming the purchase-agreement template source.
100|Continues the attribution paragraph with the fictional nature of inserted content and a lead-in to section-reference mapping.
101|Completes the sample's section-reference mapping and applies the small-print paragraph style.
102|Inserts an explicit page break so Exhibit B starts on its own page.
103|Adds the Exhibit B title in the large centered title style.
104|Adds the fictional real-estate-agent contact subtitle.
105|Begins Exhibit B's introduction with the fictional subject-property address and agreement reference.
106|Completes the introduction with the illustrative date and fictional-test-data statement.
107|Adds the Listing Agent / Seller's Agent section heading.
108|Adds text identifying Avery Ellis as the fictional seller's representative and equating the listing/seller-agent roles.
109|Begins the fictional listing-agent contact table.
110|Adds Avery and Ellis as separate first-name and last-name rows.
111|Adds the listing agent's fictional brokerage.
112|Adds the listing agent's fictional work, home, and mobile phone numbers as separate rows.
113|Adds the listing agent's example.com email address.
114|Completes the listing-agent contact table and adds it to the story.
115|Adds the Buyer's Agent section heading.
116|Begins the paragraph identifying Morgan Rivera as the fictional buyer's representative.
117|Completes the paragraph distinguishing the buyer's agent from the listing/seller's agent.
118|Begins the fictional buyer-agent contact table.
119|Adds Morgan and Rivera as separate first-name and last-name rows.
120|Adds the buyer agent's fictional brokerage.
121|Adds the buyer agent's fictional work, home, and mobile phone numbers as separate rows.
122|Adds the buyer agent's example.com email address.
123|Completes the buyer-agent contact table and adds it to the story.
124|Adds the Property access contact section heading.
125|Adds a paragraph assigning fictional purchase access to Avery Ellis, the listing/seller's agent.
126|Adds small-print text distinguishing the two sample agents and disclaiming real agreements, signatures, licensing, or contact authorization.
127|Ends the ordered document-story list.
128|Builds the in-memory exhibit PDF and uses frame to draw headers and footers on every page.
129|Opens the generated exhibit bytes as a PDF reader.
130|Asserts that the exhibits occupy exactly two pages, reporting the actual count if layout overflow occurs.
132|Creates the PDF writer used to assemble the final document.
133|Clones the source document into the writer, preserving its document structure and form fields.
134|Begins the map of existing form-field names to replacement values.
135|Sets the Print Name_5 replacement to the fictional buyer-agent name Morgan Rivera.
136|Sets the Print Name_6 replacement to the fictional listing-agent name Avery Ellis.
137|Sets field 1_2 to the one-page Exhibit A description.
138|Sets field 2_2 to the one-page Exhibit B description.
139|Sets the existing undefined_11 button/checkbox field to its /On value.
140|Ends the form-field replacement map.
141|Updates matching page form fields across the writer's pages and disables the document's automatic appearance-regeneration flag.
142|Deletes the cloned document's ninth page, which will be replaced by the new exhibits.
143|Iterates the two newly generated exhibit pages.
144|Appends each generated exhibit page to the cloned agreement.
145|Sets the combined PDF's title metadata to identify the fictional agent-contact version.
146|Opens the designated output PDF in binary-write mode, creating or replacing that output file.
147|Serializes the assembled PDF to the open output file.
149|Reopens the saved output for post-write validation.
150|Asserts that the combined agreement and exhibits contain ten pages.
151|Reads the output's interactive fields, substituting an empty dictionary if absent.
152|Asserts that no interactive-field names were added or removed compared with the source.
153|Visits every original field to validate its saved canonical value.
154|Chooses the requested replacement value for changed fields and the original /V value for all others.
155|Asserts that the saved field value matches the expected changed or preserved value.
156|Performs additional widget and appearance checks for fields intentionally updated.
157|Finds all page annotation objects whose field name matches the updated field.
158|Asserts that exactly one widget annotation exists for that updated field.
159|Asserts that the widget's own /V value matches the expected canonical field value.
160|Reads the widget's normal appearance entry from its appearance dictionary.
161|Checks whether the widget is a PDF button/checkbox field with state-specific appearances.
162|Asserts that the button widget's selected appearance-state name matches the expected value.
163|Selects the normal appearance stream for the expected button state.
164|Asserts that the applicable appearance stream has nonempty content.
165|Concatenates extracted text from every saved output page with newline separators.
166|Concatenates all saved interactive-field values with newline separators for stale-value checks.
167|Iterates obsolete no-agent descriptions that should have been removed from text and field values.
168|Asserts that the current obsolete description is absent from both readable text and form values.
169|Begins the list of fictional agent names, emails, and phone numbers required in readable PDF text.
170|Completes that required-contact-fact list with all six work/mobile/home phone numbers.
171|Asserts that each required contact fact appears in extracted output text.
172|Iterates the key hardcoded transaction amounts that must remain readable in the output.
173|Asserts that each required transaction amount is present in extracted output text.
174|Asserts specifically that Exhibit A, the ninth output page, contains the purchase price.
175|Iterates zero-based page indexes 6 through 9 to render agreement and exhibit review images.
176|Opens the saved PDF through PDFium for the current rendering pass.
177|Initializes PDF form rendering so widget appearances are included.
178|Renders the selected page at 1.6 scale, converts it to a Pillow image, and saves a one-based page-number PNG.
179|Closes the PDFium document after rendering the current page.
180|Begins printing an indented JSON report with output and backup paths and the validated page count.
181|Adds the interactive-field count, replacement map, and passed-validation marker and completes the JSON report.
''')
write('tmp/pdfs/add_sample_agents.py', pdf_notes)
