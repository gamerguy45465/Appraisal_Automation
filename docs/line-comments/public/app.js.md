# Line explanations: public/app.js

Source: [public/app.js](../../../public/app.js). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

September 14 sequential-order update: backend readiness exposes an explicit next-order action. That action clears loan-specific inputs and review notes, retains provider/model/payment choices, and detaches old polling. Job generations and predecessor checks prevent delayed responses or lost-POST recovery from replacing the next order with its predecessor. Failed jobs remain locked while cleanup explicitly reports not ready. These changes supersede the historical closure-only reset descriptions below.

| Original line | Explanation |
| ---: | --- |
| 1 | Enables strict JavaScript semantics for the entire browser script. |
| 2 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 3 | Sets the maximum accepted PDF size to 15,728,640 bytes, which is 15 MiB. |
| 4 | Sets the normal job-status polling interval to 2.5 seconds. |
| 5 | Caps automatic reconnection delays at 15 seconds. |
| 6 | Limits each HTTP request to 45 seconds before aborting it. |
| 7 | Names the sessionStorage entry used to recover the active order after a refresh. |
| 8 | Identifies browser closure and failure as statuses that release the form for another order. |
| 9 | Starts the lookup that translates job statuses into interface labels and workflow positions. |
| 10 | Shows queued jobs as starting, with the first workflow step active. |
| 11 | Shows extracting jobs as reading documents, with the first workflow step active. |
| 12 | Shows waiting-for-login jobs as requiring R3 sign-in, with the second workflow step active. |
| 13 | Shows preparing jobs as filling the R3 order, with the second workflow step active. |
| 14 | Shows waiting-for-review jobs as ready for user review, with the third workflow step active. |
| 15 | Shows detected submissions as submitted and positions progress after all three displayed steps. |
| 16 | Shows browser closure with no active workflow step. |
| 17 | Shows failures as needing attention with no active workflow step. |
| 18 | Ends the status-to-interface lookup object. |
| 19 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 20 | Stores the order form element for validation, submission, and event handling. |
| 21 | Stores the fieldset so all order fields can be disabled together. |
| 22 | Stores the submit button to control whether another preparation can start. |
| 23 | Stores the text span inside the submit button for progress labels. |
| 24 | Stores the form error panel for displaying and focusing validation failures. |
| 25 | Stores the progress card for status styling and scrolling into view. |
| 26 | Stores the reconnect button for manual session and progress recovery. |
| 27 | Stores the connection-message element for network and session feedback. |
| 28 | Collects the URLA and sales-contract file inputs by their element IDs. |
| 29 | Collects the three workflow step elements in extraction, preparation, and review order. |
| 30 | Stores the provider selector for provider-specific form behavior. |
| 31 | Stores the optional model-ID input. |
| 32 | Stores the API-key input so labels, validation, and clearing can be managed. |
| 33 | Maps internal provider IDs to the provider names displayed by the browser script. |
| 34 | Defines initial default model IDs for each provider; session configuration can replace them. |
| 35 | Documents the design constraint: Custom model choices stay only in this page's memory, separately for each provider. |
| 36 | Initializes a separate in-memory custom model choice for each provider. |
| 37 | Initializes the selected provider from the dropdown's current value. |
| 38 | Records that the server's initial provider preference has not yet been applied. |
| 39 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 40 | Initializes the CSRF token as empty until the workspace session supplies one. |
| 41 | Starts with no active order ID in memory. |
| 42 | Starts with no scheduled polling timer. |
| 43 | Starts the automatic reconnection attempt count at zero. |
| 44 | Marks the workspace session as unavailable until initialization succeeds. |
| 45 | Tracks whether a status request is running to prevent overlapping polls. |
| 46 | Tracks whether a preparation request is running to prevent duplicate submissions. |
| 47 | Starts without a previous rendered status for transition detection. |
| 48 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 49 | Defines an Error subclass carrying HTTP status and per-field details for interface failures. |
| 50 | Constructs a workspace error with an optional HTTP status and details array. |
| 51 | Initializes the inherited error message and Error behavior. |
| 52 | Gives this error the WorkspaceError name. |
| 53 | Stores the HTTP status used to distinguish authentication, missing-job, and connection failures. |
| 54 | Stores the detailed messages and field references used by the form error panel. |
| 55 | Closes the enclosing block within WorkspaceError class. |
| 56 | Closes the enclosing block within WorkspaceError class. |
| 57 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 58 | Defines the function that refreshes labels and help text for the selected AI provider. |
| 59 | Looks up the selected provider's displayed name. |
| 60 | Uses xAI as Grok's recipient/account name and the display name for other providers. |
| 61 | Looks up the currently configured default model for the selected provider. |
| 62 | Updates the visible API-key label to name the selected provider. |
| 63 | Updates the key input's placeholder to name the selected provider. |
| 64 | Begins choosing API-key help text, first checking for Google. |
| 65 | Supplies Google's PDF-sharing and account-settings explanation for the help text. |
| 66 | Checks whether the non-Google provider is xAI. |
| 67 | Supplies the explanation that document pages go to xAI and usage is billed to the xAI account. |
| 68 | Supplies the PDF-sharing and billing explanation for the other selected provider and completes the text update. |
| 69 | Shows the provider's default model as the optional model field's placeholder. |
| 70 | Begins choosing model-selection guidance, with a separate branch for xAI. |
| 71 | Supplies Grok's default-model guidance, capability requirements, and combined 50-page limit. |
| 72 | Supplies other providers' default-model and PDF/image/tool capability guidance and completes the update. |
| 73 | Closes the enclosing block within updateProviderFields. |
| 74 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 75 | Defines how session metadata updates provider defaults and initializes the provider selection. |
| 76 | Visits every provider known by the interface. |
| 77 | Reads the server-supplied model default for the current provider when that map exists. |
| 78 | Replaces a provider's default only when the supplied value is a nonempty string after trimming. |
| 79 | Closes the enclosing block within configureProviders. |
| 80 | Handles the older session shape that supplies a single nonempty model string without modelDefaults. |
| 81 | Uses that legacy model value as the OpenAI default. |
| 82 | Closes the enclosing block within configureProviders. |
| 83 | Applies the server's initial provider choice only before provider initialization has completed. |
| 84 | Selects the server default only if it is one of the known provider IDs. |
| 85 | Synchronizes the in-memory selected provider with the dropdown. |
| 86 | Marks provider initialization complete so later session renewals preserve the user's selection. |
| 87 | Closes the enclosing block within configureProviders. |
| 88 | Documents the design constraint: Session renewal updates defaults, never the provider or model the user chose. |
| 89 | Refreshes provider labels and model guidance using the updated defaults. |
| 90 | Closes the enclosing block within configureProviders. |
| 91 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 92 | Defines a storage-tolerant lookup of the saved active order ID. |
| 93 | Attempts the sessionStorage read while allowing blocked storage to be handled. |
| 94 | Returns the saved active order ID from this tab's session storage. |
| 95 | Handles an exception raised while accessing session storage. |
| 96 | Returns no saved job when storage cannot be read. |
| 97 | Closes the enclosing block within readSavedJobId. |
| 98 | Closes the enclosing block within readSavedJobId. |
| 99 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 100 | Defines storage of an active order ID, or removal when no ID is supplied. |
| 101 | Documents the design constraint: The opaque ID lets a refresh recover progress; no API key or files are stored. |
| 102 | Attempts to update session storage without letting storage errors interrupt the order. |
| 103 | Saves a truthy order ID under the active-job storage key. |
| 104 | Removes the saved order ID when the supplied ID is falsy. |
| 105 | Handles sessionStorage write/removal failures without propagating them. |
| 106 | Documents the design constraint: A browser that blocks session storage can still complete this order. |
| 107 | Closes the enclosing block within saveJobId. |
| 108 | Closes the enclosing block within saveJobId. |
| 109 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 110 | Defines the common JSON request helper with optional fetch settings, timeout, and normalized errors. |
| 111 | Creates an abort controller dedicated to this request. |
| 112 | Schedules request cancellation after the configured timeout. |
| 113 | Starts the request operation whose errors will be normalized and timer cleared. |
| 114 | Sends the HTTP request and begins constructing its fetch options. |
| 115 | Copies the caller's options, including method, body, and headers. |
| 116 | Includes credentials only for same-origin requests. |
| 117 | Requests a network response without using or updating the browser HTTP cache. |
| 118 | Connects fetch cancellation to this request's abort controller. |
| 119 | Finishes the fetch options and awaits the HTTP response. |
| 120 | Declares storage for the parsed JSON response body. |
| 121 | Attempts JSON decoding so malformed responses receive a specific workspace error. |
| 122 | Parses the response body as JSON. |
| 123 | Handles a failure to decode the response as JSON. |
| 124 | Throws an unreadable-response error while preserving the response's HTTP status. |
| 125 | Closes the enclosing block within requestJson. |
| 126 | Checks whether the response status falls outside fetch's successful 200-299 range. |
| 127 | Uses the server's string error message when available, otherwise a generic request-failure message. |
| 128 | Uses the server's error-details array when valid, otherwise an empty array. |
| 129 | Throws a structured workspace error containing the message, status, and field details. |
| 130 | Closes the enclosing block within requestJson. |
| 131 | Returns the parsed body of a successful response. |
| 132 | Handles request, decoding, and HTTP-status errors from the request block. |
| 133 | Rethrows existing WorkspaceError objects without replacing their useful details. |
| 134 | Checks whether the failure is the abort error produced by request cancellation. |
| 135 | Converts an aborted request into a user-readable timeout error. |
| 136 | Closes the enclosing block within requestJson. |
| 137 | Converts remaining failures into a local-application connection error. |
| 138 | Begins cleanup that runs whether the request succeeds or fails. |
| 139 | Cancels the timeout timer so it cannot abort after the request has finished. |
| 140 | Closes the enclosing block within requestJson. |
| 141 | Closes the enclosing block within requestJson. |
| 142 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 143 | Defines how the form's enabled state and submit label are updated together. |
| 144 | Disables the order fieldset when form availability is false. |
| 145 | Disables the submit button when form availability is false. |
| 146 | Replaces the submit button's text with the requested label. |
| 147 | Exposes whether an order request is in progress through the form's aria-busy attribute. |
| 148 | Closes the enclosing block within setFormAvailable. |
| 149 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 150 | Defines clearing of previously displayed form errors and invalid-field indicators. |
| 151 | Hides the form error panel. |
| 152 | Removes the previous detailed error list items. |
| 153 | Removes aria-invalid from every field currently marked invalid within the form. |
| 154 | Closes the enclosing block within clearErrors. |
| 155 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 156 | Defines rendering of a workspace error with an optional custom panel title. |
| 157 | Writes the requested error heading as text. |
| 158 | Writes the error's message as text rather than interpreting it as HTML. |
| 159 | Gets the list that will contain individual error details. |
| 160 | Accepts error details only when they are an array, otherwise uses an empty list. |
| 161 | Clears any previous detail items before showing this error. |
| 162 | Visits each supplied detailed error to render it and mark the corresponding field. |
| 163 | Skips missing details and details without a string message. |
| 164 | Creates a list item for the current detailed error. |
| 165 | Writes the detail's message into the new list item as plain text. |
| 166 | Appends the detailed error to the panel's list. |
| 167 | Finds the named form field when the detail provides a string field name. |
| 168 | Marks a resolved HTML field as invalid for assistive technology and styling. |
| 169 | Ends rendering of the individual detailed errors. |
| 170 | Hides the detail list when it contains no valid messages. |
| 171 | Makes the error panel visible. |
| 172 | Moves keyboard focus to the error panel so the error is discoverable. |
| 173 | Closes the enclosing block within showError. |
| 174 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 175 | Defines file-selection display and client-side PDF validation for one upload input. |
| 176 | Reads the first selected file, if any. |
| 177 | Finds the file-selection description associated with this input's ID. |
| 178 | Clears the previous custom browser validation message. |
| 179 | Clears the previous aria-invalid marker on this file input. |
| 180 | Sets a data attribute indicating whether a file is selected for CSS styling. |
| 181 | Displays the filename and binary-megabyte size to two decimal places, or the no-selection message. |
| 182 | Stops file-specific validation when no file has been selected. |
| 183 | Checks whether the selected filename lacks a case-insensitive .pdf extension. |
| 184 | Sets a browser validation error requiring a PDF filename. |
| 185 | Checks whether a PDF-named file has zero bytes. |
| 186 | Sets a validation message rejecting the empty file. |
| 187 | Checks whether the selected file exceeds the configured byte limit. |
| 188 | Sets the validation message for PDFs larger than 15 MiB. |
| 189 | Closes the enclosing block within updateFileSelection. |
| 190 | Marks the file input invalid when any browser validity constraint fails. |
| 191 | Closes the enclosing block within updateFileSelection. |
| 192 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 193 | Defines rebuilding the review-warning list from a job's warnings. |
| 194 | Gets the warning list element. |
| 195 | Removes warnings from the previously rendered job state. |
| 196 | Only iterates warnings when the supplied value is an array. |
| 197 | Filters out non-string warnings and visits the remaining warning messages. |
| 198 | Creates one list item for a warning. |
| 199 | Writes the warning into the list item as plain text. |
| 200 | Adds the warning item to the review-warning list. |
| 201 | Ends iteration over valid warning strings. |
| 202 | Closes the enclosing block within renderWarnings. |
| 203 | Hides the entire warnings section when no valid warnings were rendered. |
| 204 | Closes the enclosing block within renderWarnings. |
| 205 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 206 | Defines validation and rendering of job status, workflow markers, warnings, and terminal-state behavior. |
| 207 | Checks that the job has the required ID, message, and recognized status. |
| 208 | Rejects an unexpected job response with a reconnect-oriented workspace error. |
| 209 | Closes the enclosing block within renderJob. |
| 210 | Gets the badge, heading, and workflow-step configuration for this job status. |
| 211 | Stores the status in the card's data attribute for status-specific styling. |
| 212 | Updates the status badge without rewriting unchanged text. |
| 213 | Updates the status heading without rewriting unchanged text. |
| 214 | Updates the detailed progress message from the job. |
| 215 | Shows the login notice only while the job is awaiting login. |
| 216 | Shows the review notice only while the job is awaiting user review. |
| 217 | Rebuilds the warning list from the current job's warnings. |
| 218 | Updates workflow-step positions only for statuses that define a numeric step. |
| 219 | Visits each of the three workflow elements with its zero-based index. |
| 220 | Classifies each step as complete, active, or waiting relative to the configured current step. |
| 221 | Stores the computed step state for CSS styling. |
| 222 | Shows a check mark for complete steps and the one-based step number otherwise. |
| 223 | Marks the active workflow step as the current step for assistive technology. |
| 224 | Removes the current-step marker from steps that are not active. |
| 225 | Ends the workflow-marker update loop. |
| 226 | Closes the enclosing block within renderJob. |
| 227 | Handles failed or browser-closed jobs as terminal for this form session. |
| 228 | Visits all steps to clear any active progress state after termination. |
| 229 | Removes each step's accessibility current-step marker. |
| 230 | Returns a formerly active step to the waiting appearance. |
| 231 | Ends the terminal-state workflow cleanup loop. |
| 232 | Clears the in-memory job ID so further polling is no longer scheduled. |
| 233 | Removes the persisted active job ID from session storage. |
| 234 | Offers preparation of another order when the workspace session is ready. |
| 235 | Closes the enclosing block within renderJob. |
| 236 | Detects a newly entered login or review status so the interface can call attention to it once. |
| 237 | Scrolls the status card into view for the user's required action. |
| 238 | Closes the enclosing block within renderJob. |
| 239 | Remembers the rendered status for transition detection on the next update. |
| 240 | Closes the enclosing block within renderJob. |
| 241 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 242 | Defines the minimum structural validation expected of a job response. |
| 243 | Returns true only for a job with a nonempty string ID, string message, and recognized own-property status. |
| 244 | Closes the enclosing block within isValidJob. |
| 245 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 246 | Defines a text update helper that avoids rewriting unchanged content. |
| 247 | Finds the element targeted by the supplied CSS selector. |
| 248 | Documents the design constraint: Avoid announcing an unchanged status on every polling response. |
| 249 | Writes the new text only when it differs from the element's current text. |
| 250 | Closes the enclosing block within updateText. |
| 251 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 252 | Defines scrolling that brings the progress card into view while respecting reduced-motion preferences. |
| 253 | Uses instant scrolling for reduced-motion preference and smooth scrolling otherwise. |
| 254 | Scrolls the status card into the nearest visible block position using the chosen behavior. |
| 255 | Closes the enclosing block within scrollToProgress. |
| 256 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 257 | Defines displaying a connection problem and offering a manual reconnect action. |
| 258 | Writes the connection-problem message as plain text. |
| 259 | Shows the connection-message element. |
| 260 | Shows the reconnect button. |
| 261 | Closes the enclosing block within showConnectionIssue. |
| 262 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 263 | Defines clearing the displayed connection problem and retry backoff. |
| 264 | Hides the connection-message element. |
| 265 | Hides the reconnect button. |
| 266 | Resets retry counting after connectivity succeeds. |
| 267 | Closes the enclosing block within clearConnectionIssue. |
| 268 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 269 | Defines scheduling of the next status request with an optional delay. |
| 270 | Cancels any previously scheduled status poll before replacing it. |
| 271 | Schedules pollJob after the requested delay only while an active job ID exists. |
| 272 | Closes the enclosing block within schedulePoll. |
| 273 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 274 | Defines fetching and rendering current job progress with missing-session handling and retry backoff. |
| 275 | Skips polling if no job is active or another poll is already running. |
| 276 | Marks a poll in progress to prevent concurrent status requests. |
| 277 | Disables manual reconnection during the current poll. |
| 278 | Attempts to fetch and render the active job's status. |
| 279 | Requests the active job endpoint, URL-encoding the ID before placing it in the path. |
| 280 | Rejects a response that lacks the expected job object. |
| 281 | Validates and renders the returned job state. |
| 282 | Clears connection feedback and retry count after a successful poll. |
| 283 | Schedules the next regular poll if rendering left an active job ID. |
| 284 | Handles polling failures and decides whether to stop or retry. |
| 285 | Treats HTTP 404 and 410 as the order session being unavailable. |
| 286 | Clears the unavailable active job ID from memory. |
| 287 | Removes the unavailable order ID from session storage. |
| 288 | Explains that progress is unavailable and asks the user to inspect any open R3 browser. |
| 289 | Hides reconnect because this missing order session cannot be recovered by another poll. |
| 290 | Applies failed-state styling to the progress card. |
| 291 | Changes the status badge to Unavailable. |
| 292 | Shows an order-session-unavailable heading. |
| 293 | Explains that the local application no longer holds progress for this order. |
| 294 | Hides any previous sign-in instruction for the unavailable session. |
| 295 | Hides any previous review instruction for the unavailable session. |
| 296 | Visits every workflow step to clear current-step presentation. |
| 297 | Removes the step's accessibility current-step attribute. |
| 298 | Returns an active step to the waiting state. |
| 299 | Ends workflow cleanup for the unavailable job session. |
| 300 | Enables another order if the workspace session is still ready. |
| 301 | Handles polling errors other than a missing or expired job session. |
| 302 | Increments the failed reconnection count used for backoff. |
| 303 | Displays the error and explains that processing may continue while automatic reconnection runs. |
| 304 | Schedules an exponentially delayed retry capped at the maximum reconnection delay. |
| 305 | Closes the enclosing block within pollJob. |
| 306 | Begins polling cleanup that runs after success or failure. |
| 307 | Releases the in-progress guard so another poll can run. |
| 308 | Re-enables the manual reconnect button after the request finishes. |
| 309 | Closes the enclosing block within pollJob. |
| 310 | Closes the enclosing block within pollJob. |
| 311 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 312 | Defines clearing of the API key and both selected document files from the form. |
| 313 | Erases the API-key input's current value. |
| 314 | Visits both upload controls to clear selected documents. |
| 315 | Clears the upload input's selected file. |
| 316 | Refreshes the empty-selection message and clears obsolete file-validation state. |
| 317 | Ends the document-clearing loop. |
| 318 | Closes the enclosing block within clearSensitiveFields. |
| 319 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 320 | Defines adopting a newly accepted or recovered job and starting progress tracking. |
| 321 | Validates the job before treating the order as accepted. |
| 322 | Throws an uncertainty message when acceptance cannot be confirmed from the returned job. |
| 323 | Closes the enclosing block within acceptJob. |
| 324 | Stores the accepted job's ID as the active order. |
| 325 | Persists the active ID so a refresh can recover progress. |
| 326 | Clears the entered API key and selected documents after acceptance. |
| 327 | Clears previous connection feedback and retry backoff. |
| 328 | Disables order fields and labels the form as already preparing an order. |
| 329 | Displays the accepted job's current progress. |
| 330 | Scrolls to progress unless the caller disabled automatic scrolling. |
| 331 | Schedules the next job-status poll if the job remains active. |
| 332 | Closes the enclosing block within acceptJob. |
| 333 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 334 | Defines recovery of a possibly accepted order through session lookup rather than another POST. |
| 335 | Documents the design constraint: A lost POST response must be recovered by reading status, never by resubmitting. |
| 336 | Attempts a read-only session lookup to find an already accepted active job. |
| 337 | Fetches the current workspace session. |
| 338 | Refreshes the local CSRF token when the session supplies a nonempty string token. |
| 339 | Reports unsuccessful recovery when the session has no structurally valid active job. |
| 340 | Adopts and displays the active job found in the session response. |
| 341 | Reports successful recovery to the submit handler. |
| 342 | Handles any session-request or job-adoption failure during recovery. |
| 343 | Reports that recovery failed instead of throwing another error. |
| 344 | Closes the enclosing block within recoverAcceptedJob. |
| 345 | Closes the enclosing block within recoverAcceptedJob. |
| 346 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 347 | Defines the form-submit handler for validating and uploading an order-preparation request. |
| 348 | Stops the browser's normal form navigation so JavaScript can manage the request. |
| 349 | Ignores submission during another request, while a job is active, or before session readiness. |
| 350 | Clears previous form errors before validating the new request. |
| 351 | Revalidates both selected document inputs and refreshes their selection displays. |
| 352 | Shows native form-validation errors and stops if any required field or constraint fails. |
| 353 | Captures the form's current successful controls and files into multipart FormData before disabling them. |
| 354 | Marks the order request in progress to block duplicate submissions. |
| 355 | Disables the form and displays the document-upload progress label. |
| 356 | Attempts the order-preparation POST and acceptance handling. |
| 357 | Posts the multipart form data to the form's action URL with the current CSRF token header. |
| 358 | Validates and adopts the response's accepted job. |
| 359 | Handles POST failures and responses whose acceptance cannot be confirmed. |
| 360 | Classifies missing status, server errors, conflicts, and malformed successful responses as uncertain acceptance. |
| 361 | Attempts session-based recovery only when the POST may already have been accepted. |
| 362 | Shows a submit error only when an existing accepted order was not recovered. |
| 363 | Checks whether authentication or CSRF rejection requires workspace-session renewal. |
| 364 | Marks the session unready after a 401 or 403 response. |
| 365 | Shows guidance to reconnect and renew the workspace session before retrying. |
| 366 | Closes the enclosing block within submitOrder. |
| 367 | Displays an error title distinguishing uncertain acceptance from a definite start failure. |
| 368 | Restores form availability only when no active job exists, using a label appropriate to session readiness. |
| 369 | Closes the enclosing block within submitOrder. |
| 370 | Begins submission cleanup that runs after success or failure. |
| 371 | Clears the request-in-progress flag. |
| 372 | Marks the form as no longer busy for assistive technology. |
| 373 | Closes the enclosing block within submitOrder. |
| 374 | Closes the enclosing block within submitOrder. |
| 375 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 376 | Defines session initialization, provider configuration, and recovery of server- or storage-known jobs. |
| 377 | Disables reconnect while initializing the workspace session. |
| 378 | Attempts to establish a session and restore any existing job. |
| 379 | Requests current session metadata and any active job from the local application. |
| 380 | Rejects a session response without a nonempty string CSRF token. |
| 381 | Throws a user-readable error when secure session initialization cannot be confirmed. |
| 382 | Closes the enclosing block within initializeSession. |
| 383 | Stores the session's CSRF token for subsequent order POSTs. |
| 384 | Marks the workspace session ready for authenticated requests. |
| 385 | Applies the session's model defaults and initial provider preference. |
| 386 | Clears prior connection-problem messages and retry backoff. |
| 387 | Checks whether the server already reports a valid active job. |
| 388 | Adopts that job without automatically scrolling the page during initialization. |
| 389 | Stops initialization after restoring the server-reported active job. |
| 390 | Closes the enclosing block within initializeSession. |
| 391 | Falls back to the active job ID stored in this tab's session storage. |
| 392 | Checks whether there is a saved job ID whose progress must be restored. |
| 393 | Keeps the form disabled while displaying the progress-restoration label. |
| 394 | Fetches the saved order's current status before deciding whether another order is allowed. |
| 395 | Shows the ongoing-preparation label if polling confirms an active job remains. |
| 396 | Handles a ready session that has neither a server-reported nor a saved active job. |
| 397 | Enables the form with its default preparation label. |
| 398 | Closes the enclosing block within initializeSession. |
| 399 | Handles any failure while initializing or restoring the workspace session. |
| 400 | Marks session readiness false after initialization fails. |
| 401 | Disables the form and shows that a workspace connection is needed. |
| 402 | Displays the initialization error and the reconnect control. |
| 403 | Begins initialization cleanup regardless of success or failure. |
| 404 | Re-enables the reconnect button after initialization finishes. |
| 405 | Closes the enclosing block within initializeSession. |
| 406 | Closes the enclosing block within initializeSession. |
| 407 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 408 | Registers submitOrder as the handler for browser form-submit events. |
| 409 | Registers the handler that swaps provider-specific model values and key guidance. |
| 410 | Ignores change events that do not actually change the selected provider. |
| 411 | Remembers the outgoing provider's custom model value in page memory. |
| 412 | Sets the newly selected provider from the dropdown. |
| 413 | Restores that provider's previously entered custom model value. |
| 414 | Clears the API key when switching providers so the old provider's key is not reused in the form. |
| 415 | Clears the previous invalid-state marker on the API-key input. |
| 416 | Clears the previous invalid-state marker on the model input. |
| 417 | Updates provider names, default-model placeholders, and capability/billing guidance. |
| 418 | Ends and registers the provider-change callback. |
| 419 | Registers file-selection display and validation whenever either document input changes. |
| 420 | Registers a form-wide input handler to clear stale invalid-field markers as users edit. |
| 421 | Removes aria-invalid from an edited event target when it is an HTML element. |
| 422 | Ends and registers the form-input callback. |
| 423 | Registers the asynchronous reconnect-button handler. |
| 424 | Cancels the scheduled poll before starting manual reconnection. |
| 425 | Immediately polls progress when an initialized session and active order already exist. |
| 426 | Otherwise initializes or renews the workspace session. |
| 427 | Ends and registers the reconnect-button callback. |
| 428 | Registers a handler for page display, including restoration from the back-forward cache. |
| 429 | Clears API-key and file fields when the page is restored from a persisted browser page cache. |
| 430 | Ends and registers the page-show callback. |
| 431 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 432 | Starts asynchronous workspace-session initialization and explicitly discards its promise value. |
