from pathlib import Path
import json, re

ROOT = Path(__file__).parent
MAPS = {}
def add(file, text):
    notes = {}
    for line in text.strip().splitlines():
        n, note = line.split(' ', 1)
        notes[int(n)] = note
    MAPS[file] = notes

add('agent.ts', '''
11 Defines the dependencies and approved data required by the preparation agent.
12 Requires a read-only reference to the selected provider's chat model.
13 Requires the provider identifier used to adapt model messages.
14 Requires the environment helper and its private input storage tools.
15 Requires the browser session exposing approved form actions.
16 Requires the validated field entries the agent may inspect and fill.
17 Requires the cancellation signal for stopping the agent invocation.
21 Exports the asynchronous agent step and destructures its model, tools, approved plan, and cancellation dependencies.
22 Starts the list of workflow-specific tools offered to the model.
23 Creates an argument-free tool that returns the already validated field plan, describing its fixed, user-entered, and extracted values.
25 Creates a LangChain agent with the selected model, message adaptation, and approved tools.
26 Supplies the caller's selected model instance to the agent.
27 Adapts screenshot tool messages to the selected provider's supported message format.
28 Combines environment tools, the field-plan reader, and restricted browser tools into the agent's available actions.
29 Appends runtime instructions restricting the agent to approved plan values and the R3 order page, treating page text as untrusted, verifying dependent fields, and returning for manual review without submitting.
31 Invokes the agent to verify the prefilled plan and attempt each unresolved field once, propagating cancellation and limiting the agent graph to 100 recursion steps.
''')

add('app.ts', '''
13 Defines an in-memory session record containing its CSRF token and creation timestamp.
14 Defines optional application dependencies for injecting a job runner and choosing the local port.
17 Exports the Express application factory, defaulting to an empty options object.
18 Uses the injected job runner when supplied or creates the production worker runner.
19 Uses the requested local port or defaults to 3000.
20 Builds the exact localhost and loopback HTTP origins accepted for this port.
21 Creates the Express application instance.
22 Allocates the application's in-memory session map keyed by session identifier.
23 Configures in-memory PDF uploads with limits on file size, two files, ten text fields, field length, and multipart part count.
24 Rejects uploads unless their declared MIME type is PDF and filename ends in .pdf; otherwise accepts them for later content validation.
25 Completes the multer upload middleware configuration.
26 Removes Express's identifying X-Powered-By response header.
27 Installs security headers and a same-origin content policy, allows inline data images, blocks framing, and disables HTTPS upgrade/HSTS behavior for local HTTP use.
28 Adds Cache-Control: no-store to every response and advances to the next middleware.
29 Starts request middleware that validates the incoming host and browser origin before upload parsing.
30 Rejects a Host header outside the configured localhost/loopback origin set with HTTP 403.
31 Reads the request's Origin header for cross-origin checks.
32 Rejects an unapproved Origin header or explicitly cross-site browser request with HTTP 403.
33 Passes an accepted host/origin request to subsequent middleware.
35 Parses incoming Cookie headers so session middleware can read the session identifier.
36 Limits API requests to 120 per minute, emits draft-8 rate headers, and returns a fixed HTTP 429 JSON message when exceeded.
37 Registers the session bootstrap endpoint that returns defaults and session-specific state.
38 Removes sessions older than one day whenever the bootstrap endpoint runs.
39 Reads a string session cookie, falling back to an empty identifier for absent or malformed cookies.
40 Looks up the cookie's session in the server's in-memory map.
41 Creates a new session only when the supplied cookie did not identify an existing one.
42 Rejects creation once 500 sessions remain, asking the user to restart the local application.
43 Generates independent random 32-byte hexadecimal session and CSRF tokens, timestamps the session, and stores it.
44 Sends a one-day HTTP-only, Strict SameSite cookie scoped to the local application; secure is false for its HTTP server.
46 Returns the CSRF token, default model/provider choices, and any active job belonging to this session.
48 Adds session ownership and CSRF validation for all later API routes.
49 Reads the session cookie as unknown so its runtime type must be checked.
50 Looks up a session only if the cookie identifier is a string.
51 Rejects missing or expired sessions with HTTP 401 before accessing protected API routes.
52 Records the validated session identifier as the request's job owner.
53 Requires CSRF validation for methods other than GET and HEAD.
54 Reads the submitted CSRF token header, using an empty string when absent.
55 Encodes the submitted CSRF token as bytes for comparison.
56 Encodes the stored session CSRF token as bytes for comparison.
57 Rejects unequal token lengths or a failed constant-time comparison with HTTP 403.
59 Advances an authenticated API request after any required CSRF check succeeds.
61 Registers job creation with multipart parsing for one required URLA field and at most one sales-contract field.
62 Interprets multer's uploaded files as named arrays that may be absent.
63 Selects the first URLA upload if one was provided.
64 Selects the optional first sales-contract upload.
65 Starts validation and job creation under cleanup-aware error handling.
66 Treats form fields as unknown input values pending schema validation.
67 Validates and normalizes the submitted form fields with the application input schema.
68 Rejects job creation when no URLA was uploaded.
69 Assigns the URLA a fixed internal filename and validates the uploaded PDF bytes.
70 Wraps an uploaded contract with its fixed internal filename, or leaves it undefined.
71 Validates the optional contract's PDF bytes before passing it to a worker.
72 Creates a job owned by the validated local session with the parsed input and document buffers.
73 Responds HTTP 202 with the queued job view.
74 Starts the failure path for input validation, PDF validation, or job creation errors.
75 Overwrites available uploaded document buffers with zeros and rethrows the original failure for the error middleware.
76 Clears parsed request-body references whether job creation succeeds or fails.
78 Registers retrieval of an individual job by its URL identifier.
79 Requests the job view using both the current session owner and requested job ID.
80 Returns HTTP 404 if the job is absent or belongs to another session.
81 Returns the authorized job view as JSON.
83 Converts unmatched API operations into a fixed HTTP 404 application error.
84 Serves the public directory resolved relative to this module, disabling ETags and denying dotfiles.
85 Defines the final Express error middleware with an unknown error type.
86 Converts Zod failures into HTTP 400 field-level JSON errors, joining nested paths with dots, then stops processing.
87 Converts multer failures into a fixed HTTP 400 upload-limit response and stops processing.
88 Classifies any remaining failure into an application-safe public error.
89 Returns only the classified status code, public error code, and safe message.
91 Installs the final error handler after all routes and static middleware.
92 Returns the Express app and job runner so callers can listen and shut down workers.
''')

add('environment.ts', '''
8 Exports the mapping from approved logical setting keys to isolated-worker environment variable names.
9 Maps the private provider API key to its application-specific environment variable.
10 Maps the loan reference and FHA case number to separate application-specific environment variables.
11 Maps payment choice and the rush flag to their application-specific environment variables.
12 Finishes the mapping and preserves its literal keys and values in the TypeScript type.
13 Restricts environment operations to keys present in the approved mapping.
14 Marks only the API-key setting as secret so model-facing getters cannot return it.
17 Exports an asynchronous Windows helper operation that sets or retrieves one approved environment setting.
18 Refuses environment-helper execution outside Windows with a public application error.
19 Wraps the child-process lifecycle in a promise returning the resulting setting value.
20 Starts the fixed PowerShell helper hidden, without profiles or interaction, using piped streams and a ten-second process timeout.
21 Initializes accumulation of the helper's standard-output JSON.
22 Decodes the child process's standard output as UTF-8 text.
23 Appends each output chunk to the helper-response buffer.
24 Drains standard error without exposing its content or blocking the child on a full pipe.
25 Converts child-process startup failures into a fixed environment-helper error.
26 Converts failures writing the helper's input into a fixed environment-helper error.
27 Handles process completion and interprets the helper's exit status and output.
28 Rejects nonzero helper exits with a safe message and skips response parsing.
29 Begins parsing the successful helper response with a fixed-error fallback.
30 Removes an optional UTF-8 BOM and parses JSON containing the returned value.
31 Converts a null helper value into an empty string.
33 After a set operation, copies the returned setting into this Node worker's environment because a child cannot update its parent.
34 Resolves the operation with the stored or retrieved string.
35 Converts malformed helper output into a fixed invalid-environment-response error.
37 Sends the approved environment name and value as JSON on standard input, then closes input.
41 Exports creation of per-job private setting storage and model-visible environment tools.
42 Captures submitted settings in a private string-valued map, converting the rush Boolean to text.
43 Tracks whether the environment remains usable before cleanup.
44 Defines a guard that rejects all later operations after environment cleanup.
45 Defines asynchronous storage for one approved private setting.
46 Rejects storage if the environment has already been cleared.
47 Calls the fixed helper to store the original private value for this setting.
48 Ensures a late helper completion cannot restore a setting after cleanup.
50 Deletes any setting synchronized by an in-flight helper after the environment became inactive.
52 Rechecks activity after asynchronous storage, rejecting a completion that raced with cleanup.
54 Defines retrieval of one setting while preserving the environment's active-state boundary.
55 Rejects retrieval after the environment has been cleared.
56 Reads the requested approved setting through the PowerShell helper.
57 Rechecks activity after the helper returns so cleared values are not returned to a caller.
58 Returns the retrieved value to the internal caller.
60 Builds two argument-free LangChain tools for every approved logical environment key.
61 Creates a store tool using the server-captured value and returns only confirmation that storage completed.
62 Creates a getter that returns only configuration availability for secrets and the value for nonsecret settings, with matching tool descriptions.
64 Returns the tool collection together with internal initialization, retrieval, and cleanup operations.
65 Exposes the generated model-facing tools.
66 Initializes every approved setting in sequence using the guarded store operation.
67 Exposes the guarded retrieval function for private backend consumption.
68 Marks the environment inactive, removes all mapped process variables, and replaces retained private values with empty strings.
''')

add('errors.ts', '''
4 Defines the application error class used to carry deliberately public messages and error metadata.
5 Creates an error with a read-only public code and HTTP status, defaulting the status to 400.
6 Initializes the standard Error base class with the public message.
7 Assigns the custom error name for identification.
11 Defines a helper for safely accessing properties of unknown error-like values.
12 Treats truthy objects as records and substitutes an empty record for other values.
16 Defines private extraction of a provider message from known nested SDK error shapes.
17 Reads the first nested error object if present.
18 Reads a second nested error object if present.
19 Chooses the deepest available message, falling back through outer error objects.
20 Returns at most 8,000 characters of a string message, or an empty string for nontext values.
23 Defines Anthropic-specific message classification into fixed application errors.
24 Detects message patterns indicating insufficient Anthropic API credits.
25 Returns a fixed HTTP 502 quota error directing the user to Anthropic billing and credits.
27 Detects Anthropic schema-complexity, compilation, union, or optional-parameter rejection wording.
28 Returns a fixed HTTP 502 structured-schema rejection error for Anthropic.
30 Detects oversized Anthropic prompts, context, requests, PDFs, or page counts.
31 Returns a fixed HTTP 502 request-size error advising smaller or shorter PDFs.
33 Detects unreadable, invalid, encrypted, password-protected, or corrupt PDF wording from Anthropic.
34 Returns a fixed HTTP 502 unreadable-PDF error without including the provider's raw response.
36 Detects unsupported structured-output, document, image, tool-choice, or thinking features reported by Anthropic.
37 Returns a fixed HTTP 502 model-capability error for the selected Anthropic model.
39 Leaves an unrecognized Anthropic failure unclassified for the caller's generic fallback.
43 Defines Google-specific error classification using nested response data and HTTP status.
44 Reads Google's nested error from the SDK's data property.
45 Uses Google's nested message when it is text, capped at 8,000 characters, otherwise applies the generic message extractor.
46 Reads reason codes from at most the first 32 structured detail records.
47 Tests structured reasons for invalid, expired, or restricted Google API keys.
48 Also detects textual key-invalidity, expiration, restriction, or leaked-key reports.
49 Returns a fixed HTTP 502 Google authentication error with API-key restriction guidance.
51 Tests structured reasons for disabled or inactive Google billing.
52 Also recognizes textual billing configuration and exhausted-quota errors.
53 Returns a fixed HTTP 502 Google billing/quota error.
55 Defers other HTTP 403 and 429 failures to the outer access/rate-limit classification.
56 Detects invalid or overly complex Google response schemas and nesting limits.
57 Returns a fixed HTTP 502 Google structured-schema rejection error.
59 Detects unreadable, invalid, encrypted, password-protected, or corrupt Google PDF input reports.
60 Returns a fixed HTTP 502 Google unreadable-PDF error.
62 Detects Google request, PDF, payload, page-count, token-count, or context limits.
63 Returns a fixed HTTP 502 Google document/request-size error.
65 Detects unsupported Google schema, output MIME type, PDF, image, tool, or function-calling capabilities.
66 Returns a fixed HTTP 502 capability error for the selected Google model.
68 Leaves an unrecognized Google failure for the outer generic classification.
72 Defines xAI-specific classification while keeping OpenAI-compatible raw error details private.
73 Reads xAI's first nested error object if present.
74 Reads a second nested xAI error object if present.
75 Selects the deepest available error code with fallbacks to outer records.
76 Accepts string-valued nested or outer xAI errors before falling back to the generic message extractor.
77 Limits privately inspected xAI message text to 8,000 characters.
78 Detects the invalid_api_key code or textual invalid, incorrect, or expired xAI key errors.
79 Returns a fixed HTTP 502 Grok authentication error directing the user to the xAI Console.
81 Recognizes HTTP 402 and explicit insufficient-quota or billing-limit codes.
82 Also recognizes message patterns for missing/exhausted credits and reached spending or billing limits.
83 Returns a fixed HTTP 502 Grok credits/spending-limit error.
85 Detects xAI's explicit unavailable-model error code.
86 Returns a fixed HTTP 502 Grok model-access error.
88 Defers remaining HTTP 403 and 429 failures to generic model-access and rate-limit handling.
89 Detects xAI JSON schema invalidity, complexity, compilation, or nesting limits.
90 Returns a fixed HTTP 502 Grok structured-schema rejection error.
92 Detects xAI request, document-image, input-token, or context size limits.
93 Returns a fixed HTTP 502 Grok request-size error.
95 Detects unsupported xAI structured-output, image/vision, tool, or function-calling capabilities.
96 Returns a fixed HTTP 502 capability error for the selected Grok model.
98 Leaves an unrecognized xAI failure for the outer generic classifier.
102 Exports conversion of any failure to a public AppError, using OpenAI labels when no provider is supplied.
103 Preserves an existing application-safe error without reclassifying it.
104 Coerces the unknown failure into a property-accessible record or an empty record.
105 Chooses the user-facing provider name from the selected provider identifier.
106 Reads Google's numeric statusCode when present; other cases use the common status property.
107 Starts provider-specific handling for xAI failures.
108 Applies xAI detail classification only for the selected client, quota, and rate-limit status codes.
109 Attempts to classify xAI's private error details into a fixed message.
110 Returns the xAI-specific error when a pattern matched.
112 Maps xAI HTTP 408 or 504 to an application timeout with HTTP 504.
113 Maps xAI HTTP 500 or 502 to a fixed temporary-unavailability error.
115 Starts provider-specific handling for Google failures.
116 Maps Google's named AuthError directly to a fixed authentication message.
117 Applies Google's detailed classifier to selected request, access, and rate-limit status codes.
118 Attempts to classify Google's structured private error details.
119 Returns the Google-specific error when recognized.
121 Maps Google's blocked-prompt exception to a fixed model-output-blocked error.
122 Maps missing candidates or malformed output to a fixed unusable-extraction-output error.
123 Recognizes Google input, configuration, invalid-tool, and missing-tool-call exceptions as request-preparation failures.
124 Returns a fixed HTTP 502 Google request-preparation error.
126 Maps Google HTTP 408 or 504 to a fixed HTTP 504 timeout.
127 Maps Google HTTP 500 or 502 to a fixed temporary-unavailability error.
129 Maps the shared insufficient_quota code to a provider-labeled billing/quota error.
130 Maps HTTP 401 to a fixed authentication error for the selected provider.
131 Maps HTTP 403, HTTP 404, or model_not_found to a fixed model-access error.
132 Maps HTTP 429 to a provider-labeled rate-limit error.
133 Maps HTTP 413 to a provider-labeled document-request-size error.
134 Handles remaining HTTP 400 and 422 request rejections.
135 Attempts Anthropic-specific message classification only when Anthropic is the selected provider.
136 Returns a recognized Anthropic error or a fixed provider-labeled generic request rejection.
138 Maps HTTP 529 or 503 to a fixed temporary provider-unavailability error.
139 Recognizes standard abort/timeout names and the OpenAI SDK connection-timeout class.
140 Returns the fixed preparation-timeout error with HTTP 504.
142 Falls back to a fixed HTTP 500 preparation failure without exposing original exception details.
''')

add('extraction-schema.ts', '''
4 Defines the generic object representation used while traversing JSON Schema values.
5 Returns non-null, nonarray objects as schema records and rejects other values as undefined.
8 Converts the canonical Zod extraction schema into JSON Schema with repeated definitions inlined.
9 Defines the extra instruction telling Anthropic to use an empty-string sentinel for missing nullable text.
11 Defines detection of schema nodes representing unconstrained nullable text.
12 Requires the schema type to be an array containing exactly two alternatives.
13 Requires those two alternatives to be string and null.
14 Excludes enum and constant constraints so only ordinary nullable text receives sentinel adaptation.
17 Defines recursive conversion of canonical schema values to Anthropic's wire schema.
18 Recursively adapts each array item when traversing schema arrays.
19 Attempts to interpret the current value as a schema object.
20 Leaves primitive and unsupported nonobject schema values unchanged.
21 Recursively adapts every property of this schema object into a new object.
22 Applies the text-sentinel change only to canonical nullable-text schema nodes.
23 Changes nullable text's wire type to string, removing that string/null union.
24 Combines any existing textual description with the missing-text sentinel instruction.
26 Returns the recursively adapted schema object.
30 Exports the Anthropic-specific JSON schema produced from the canonical extraction schema.
32 Defines schema-guided normalization of provider output back to canonical values.
33 Interprets the corresponding canonical schema node as an object when possible.
34 Leaves output unchanged where no usable schema object exists.
35 Converts only whitespace-only strings at canonical nullable-text fields back to null.
36 Recursively normalizes array elements using the canonical item schema when available.
37 Interprets the current output value as an object for property-level traversal.
38 Reads the canonical schema's property definitions as an object.
39 Traverses output properties only when both output and schema properties are objects.
40 Rebuilds the output object by preserving each property name and choosing its normalized value.
41 Recurses through known own schema properties while leaving unknown output properties unchanged for later validation.
43 Leaves values unchanged when no array, nullable-text, or object normalization applies.
47 Exports normalization of Anthropic's extraction response without validating or inventing missing fields.
48 Runs the normalization traversal against the unchanged canonical schema.
''')

add('extraction.ts', '''
13 Defines the union of supported provider-specific chat model classes.
16 Exports model creation with explicit credentials, model ID, and an OpenAI provider default.
17 Delegates xAI model construction to the isolated official-endpoint transport helper.
18 Delegates Google model construction to its API-key-only transport helper.
19 Selects the Anthropic SDK path when that provider was requested.
20 Constructs Anthropic with the selected key and model and at most one SDK retry.
21 Fixes Anthropic's official API endpoint and a 120-second client timeout.
23 Constructs the default OpenAI model using the Responses API, explicit key/model, one retry, and a 120-second timeout.
24 Disables OpenAI response storage and parallel tool calls and fixes the official OpenAI API endpoint.
28 Defines a narrow detector for output-format errors that permit a same-model structured-output fallback.
29 Rejects nonobject failures as ineligible for structured-output fallback.
30 Reads Google's statusCode or the common status property without assuming an error shape.
31 Permits fallback consideration only for HTTP 400 request failures.
32 Reads a string error message, substituting an empty string for other message shapes.
33 Uses Google-specific names when matching unsupported output-format errors.
34 Recognizes explicit Google schema/MIME/JSON-mode unsupported or unknown-field wording within a bounded distance.
36 Recognizes explicit response_format, output_config, JSON-schema, or structured-output unsupported/unknown-parameter wording for other providers.
39 Exports document extraction using the selected model and cancellation signal, returning validated order facts.
40 Records whether Anthropic requires its reduced-union wire schema.
41 Chooses Anthropic's adapted wire schema or the canonical extraction schema.
42 Chooses the provider-specific missing-text wording inserted into extraction instructions.
43 Begins selecting detailed missing-value instructions for Anthropic versus other providers.
44 Instructs Anthropic to encode only missing nullable text as empty strings while preserving null numbers, enums, booleans, evidence, and required fields.
45 Instructs other providers to retain null for missing text/numbers, Unknown classifications, and all required fields.
46 Defines construction of inline PDF content blocks for providers that accept native PDFs.
47 Selects a source-label-plus-file content block sequence for Google.
49 Adds a document-filename label before Google's PDF because its inline PDF payload does not carry one.
50 Encodes the PDF bytes as a base64 application/pdf file block for Google.
52 Builds Anthropic's document content block with title and base64 PDF source metadata.
53 Builds an OpenAI Responses input_file block with filename and a PDF data URL.
55 Selects rendered page images for xAI and native PDF blocks for the other providers.
56 Invokes local PDF rendering for the list of uploaded documents.
57 Adds the URLA buffer under its fixed internal source filename.
58 Includes the optional sales-contract buffer in the render list only when supplied.
59 Passes cancellation to local page rendering and finishes the xAI branch.
60 Starts the native-PDF branch with the required URLA content blocks.
61 Appends native sales-contract blocks only when the optional contract exists.
62 Begins the human message's extraction instructions and document content array.
63 Defines extraction instructions for source trust, authoritative URLA classifications, contract price, conservative property facts, evidence, sensitive-data exclusion, uncertainty, and required output fields.
64 Appends contact extraction instructions separating borrower, co-borrower, seller/listing agent, and buyer/selling agent roles and preserving supported contact details.
65 Appends the shared authoritative terminology for seller/listing versus buyer/selling representation.
66 Appends shared sale-price extraction and source-evidence rules.
67 Appends shared bounded appraisal-product selection and recommendation rules.
68 Appends contact source precedence, exact-path evidence requirements, phone classification constraints, identity matching, and missing/ambiguous-value handling.
69 Adds the provider-specific missing-value instructions as a separate text content block.
71 Appends the prepared native PDF blocks or locally rendered page-image blocks to the request content.
73 Wraps the extraction content in a single LangChain human message.
74 Reserves an unknown-valued variable for structured model output before canonical validation.
75 Begins the primary native structured-output request with a narrowly controlled fallback.
77 Requests the named appraisal_document_data schema using native JSON Schema output.
78 Enables strict schema output only for OpenAI and xAI, invokes the selected model, and propagates cancellation.
79 Handles failures of the initial structured-output invocation.
80 Rethrows all failures except explicitly unsupported structured-output formats for this provider.
81 Checks cancellation before attempting the alternate structured-output method.
83 Retries the same schema and selected model via function calling, passing the same request messages and cancellation signal.
85 Normalizes Anthropic's text sentinels when needed and validates every provider's result with the canonical extraction schema.
''')

add('google.ts', '''
4 Defines the single approved Google Generative Language API origin.
7 Exports construction of a Google model using only the job's selected API key and model ID.
8 Creates the LangChain Google chat model with an explicitly configured transport.
9 Selects the Google AI API-key platform, official origin, chosen model, and v1beta API version.
10 Limits SDK retries to one and disables streaming model invocation.
13 Supplies a custom API client to avoid unrelated ambient Google credential discovery.
14 Reports that the custom transport uses an API key.
15 Rejects project-ID lookup with a fixed configuration error because this path requires a Google AI Studio key.
16 Defines the custom transport's asynchronous request handler.
17 Parses the SDK-generated request URL for validation.
18 Recognizes the nonstreaming generateContent operation by its URL path suffix.
19 Recognizes streamGenerateContent or marks any other operation invalid.
20 Requires the approved Google origin, POST method, recognized operation, and no URL fragment.
21 Allows only an empty query string or the known SSE query string.
22 Rejects any request outside those approved endpoint constraints with a fixed configuration error.
23 Ends the rejection block for requests outside the approved Google endpoint constraints.
25 Reconstructs the approved v1beta model URL, percent-encoding the selected model ID as data.
26 Sets the SSE query only when calling the streaming operation.
27 Combines the caller's abort signal with a 120-second transport timeout.
28 Rejects an already-cancelled or timed-out request before reading its body.
29 Copies the SDK request body into an ArrayBuffer for forwarding.
30 Rechecks cancellation after the asynchronous body read.
31 Starts the fetch to the reconstructed approved Google endpoint.
32 Sends JSON via POST with only the selected job's Google API key authentication header.
33 Forwards the body and combined cancellation signal and rejects HTTP redirects.
''')

add('jobs.ts', '''
8 Defines job-runner operations for owner-scoped creation/retrieval, optional active-job lookup, and shutdown.
9 Defines the private job record storing ownership, mutable public status, and creation time.
11 Exports construction of the restricted environment inherited by an isolated worker process.
12 Lists Windows/runtime/path variables allowed into workers, including the optional Playwright browser installation location.
13 Copies only allowlisted environment variables case-insensitively and explicitly disables LangSmith/LangChain tracing flags.
16 Exports the single-active-worker job runner factory.
17 Creates the in-memory job record map keyed by UUID.
18 Tracks the one currently active child worker process.
19 Returns the runner's create, lookup, active-job, and shutdown methods.
20 Starts creation of a job tied to the caller's owner identifier.
21 Rejects another job with HTTP 409 while an existing worker/browser remains active.
22 Removes job records older than one day when creating a new job.
23 Evicts oldest map entries until fewer than 100 previous job records remain.
24 Generates the new job's unique identifier.
25 Creates the owner-scoped queued job record with its creation timestamp and initial public message.
26 Detects whether this module is running from TypeScript source or compiled JavaScript.
27 Begins configuring the isolated child worker process and hidden Windows execution.
28 Enables tsx only for source execution, supplies the restricted environment, preserves Buffer IPC serialization, hides the window, and exposes only IPC while ignoring standard streams.
30 Forks the corresponding TypeScript or JavaScript worker entry point using the configured process options.
31 Reserves the active worker slot for this child process.
32 Stores the queued job record before receiving worker updates.
33 Starts a pausable parent watchdog whose expiry requests automation cancellation.
34 Changes the public status to explain that the preparation limit was reached and the browser is retained for review.
37 Sends the worker a stop_preparation control message instead of terminating the browser-owning process.
38 Handles send failure only while this child is still active and its status is still preparing.
39 Updates the message to advise checking and closing the retained browser when the worker cannot be contacted.
42 Gives the parent watchdog a twelve-minute active-processing budget.
43 Listens for IPC updates from the worker.
44 Ignores IPC messages that are not status updates.
45 Replaces the public view with the worker's status, message, and optional warnings while preserving the job ID.
46 Pauses the watchdog while the user signs into R3 manually.
47 Resumes the remaining watchdog budget when automated preparation resumes.
48 Clears the watchdog after review handoff, failure, or browser closure.
50 Converts child startup errors into a fixed failed job view.
51 Handles worker-process closure and releases its active slot.
52 Cancels the parent watchdog when the worker exits.
53 Clears the active pointer only if it still refers to this child.
54 Marks unexpected exits as failure unless the job was already failed or the browser was reported closed.
56 Sends the input/documents to the worker and performs parent-buffer cleanup after IPC completion.
57 Overwrites the parent copy of the URLA bytes with zeros after the send callback fires.
58 Overwrites the parent copy of any sales-contract bytes with zeros after IPC completion.
59 Marks a failed document send as a job failure and kills the unusable worker process.
61 Returns the new job's current public view.
63 Returns a job view only when the requested owner matches its private owner record.
64 Returns the owner's first job whose status is neither failed nor browser_closed.
65 Kills any active worker, clears the active pointer, and removes all stored jobs during shutdown.
''')

add('model-messages.ts', '''
5 Defines copying a tool message with replacement content while preserving its identifying and diagnostic metadata.
6 Constructs the replacement LangChain ToolMessage instance.
7 Replaces content while preserving message ID, tool name, and associated tool-call ID.
8 Preserves execution status, metadata, and artifact fields from the original tool result.
9 Preserves additional SDK arguments and response metadata from the original tool result.
14 Defines xAI message conversion that moves valid screenshot images out of tool result content.
15 Allocates the converted conversation message sequence.
16 Accumulates screenshot content blocks for a subsequent human message.
17 Defines emission of accumulated screenshot blocks after contiguous tool responses.
18 Appends a human message only if screenshot blocks have been accumulated.
19 Resets the pending screenshot collection after a flush.
21 Walks the original messages in order.
23 Flushes pending screenshots before a non-tool message so all preceding tool replies stay contiguous.
24 Identifies messages outside the array-valued screenshot_page tool-result shape.
25 Preserves an ineligible message unchanged and advances to the next message.
27 Allocates recognized text blocks for the current screenshot tool result.
28 Allocates validated screenshot image blocks for the current tool result.
29 Starts with the current screenshot content considered valid.
30 Examines every content block before converting this screenshot result.
31 Collects text blocks only when their text property is a string.
32 Starts validation for an image_url screenshot block.
33 Reads the image_url payload, which may be a URL string or object.
34 Treats non-null image payload objects as records for safe property lookup.
35 Extracts the URL from either accepted image payload representation.
36 Uses the explicit image-detail value or defaults to auto.
37 Requires a string URL containing a PNG base64 data URL with the expected encoding characters.
38 Requires an auto, low, or high string detail value; otherwise invalidates the result and stops examining blocks.
39 Appends the normalized validated image_url block to the current screenshot collection.
40 Invalidates unsupported content block types and stops conversion of this result.
42 Preserves the original tool message when validation failed or no screenshot image was found.
43 Emits a metadata-preserving text-only tool result using joined text blocks or a default screenshot confirmation.
44 Queues an untrusted-browser-content label and the validated screenshot images for a later human message.
46 Flushes any screenshot blocks remaining after the final tool-message group.
47 Returns the converted xAI message sequence.
51 Exports provider-specific screenshot-message conversion without changing other message types.
52 Uses the dedicated tool-text-plus-human-images conversion for xAI.
53 Returns messages unchanged for providers other than OpenAI and xAI.
54 Maps OpenAI messages into the Responses-compatible screenshot content representation.
55 Preserves every message that is not an array-valued screenshot_page tool result.
56 Allocates replacement OpenAI Responses content blocks for this tool result.
57 Tracks whether this result contains at least one validated image.
58 Inspects the screenshot tool result's blocks in order.
59 Recognizes textual screenshot content with a string text value.
60 Converts the text block to the Responses API input_text shape.
61 Begins converting an image_url screenshot block.
62 Reads the image payload for URL and detail extraction.
63 Treats a non-null object payload as a property-accessible record.
64 Gets the URL from a direct string or image object's url property.
65 Uses the supplied detail value or defaults to auto.
66 Requires a PNG base64 data URL with the expected encoding characters.
67 Preserves the entire original message if image detail is invalid or the URL check fails.
68 Appends the screenshot as a native Responses input_image block.
69 Records that a valid screenshot image was converted.
70 Preserves the original message when any unsupported content block is encountered.
72 Preserves image-free messages instead of converting only their text.
73 Returns a copy containing Responses-native blocks while retaining the original tool metadata.
78 Exports LangChain middleware bound to the selected provider.
79 Creates the middleware definition for adapting model invocation messages.
80 Assigns a stable name to the screenshot-content middleware.
81 Calls the next model handler with provider-adapted messages in a copied request, leaving shared history untouched.
''')

add('pausable-timeout.ts', '''
2 Exports a timer that tracks remaining active time and can be paused, resumed, or permanently cleared.
3 Initializes the remaining active-time budget from the requested duration.
4 Records the starting timestamp used to subtract elapsed active time on pause.
5 Holds the current timeout handle, or undefined while paused or finished.
6 Tracks permanent cancellation or expiry so the timer cannot restart afterward.
7 Defines idempotent resumption of the remaining active-time budget.
8 Does nothing when permanently stopped or when a timer is already running.
9 Records when this active timing interval begins.
10 Schedules expiration for the remaining duration, clears its handle, permanently stops the timer, and invokes the timeout callback.
11 Allows the process to exit naturally even if this timeout is still pending.
13 Starts timing immediately after the helper is constructed.
14 Returns the pause, resume, and clear controls.
15 Defines pausing of a currently active timer.
16 Leaves paused or permanently stopped timers unchanged.
17 Cancels the scheduled callback for the current active interval.
18 Removes the handle so the timer is considered paused.
19 Subtracts elapsed active time from the remaining budget without allowing a negative duration.
21 Exposes the shared resume function.
22 Permanently stops the timer, cancels any scheduled callback, and clears the handle.
''')

add('pdf-pages.ts', '''
7 Defines renderer output as source-label text blocks or high-detail PNG image-URL blocks.
8 Limits the combined uploaded PDFs to 50 rendered pages per order.
9 Limits each encoded PNG page image to 20 MiB.
10 Limits all encoded page images in one order to 40 MiB total.
11 Caps each rendered page's longest image edge at 2,400 pixels.
12 Sets a 60-second local PDF-rendering budget.
15 Exports local conversion of named PDF buffers into labeled page-image content, with cancellation support.
16 Rejects work immediately if the caller already cancelled it.
17 Creates a separate abort controller for the renderer's own time budget.
18 Computes the absolute rendering deadline for checks during asynchronous and drawing work.
19 Defines budget expiry to abort with a fixed PDF-render-timeout application error.
20 Schedules the renderer's deadline callback after 60 seconds.
21 Prevents the deadline timer alone from keeping the process alive.
22 Combines caller cancellation and local rendering timeout into one active signal.
23 Tracks every PDF loading task so cancellation and final cleanup can destroy them.
24 Memoizes each task's destruction promise so multiple cleanup paths share one destroy operation.
25 Tracks the currently drawing page task for cancellation.
26 Defines idempotent destruction of a PDF loading task.
27 Looks up any destruction already initiated for this task.
28 Starts task destruction only if no earlier cleanup operation exists.
29 Requests PDF.js cleanup and stores the resulting promise locally.
30 Records the destruction promise for later cancellation/finally callers.
32 Attaches a rejection handler immediately so early asynchronous cleanup cannot produce an unhandled rejection.
34 Returns the shared destruction promise to any caller needing to await cleanup.
36 Defines cancellation of drawing and all PDF loading tasks.
37 Cancels the current render task if one exists.
38 Starts destruction of every known loading task without blocking the abort callback.
40 Registers cancellation cleanup once when the combined signal aborts.
41 Defines a cooperative deadline and cancellation checkpoint.
42 Expires the rendering budget if wall-clock time has passed its deadline before the timer callback ran.
43 Throws the active abort reason when either caller cancellation or the local budget has expired.
45 Starts PDF loading and rendering under error classification and guaranteed cleanup.
47 Lazily imports PDF.js and the native canvas library concurrently, avoiding their startup cost for other provider paths.
48 Rechecks cancellation and deadline after loading the rendering libraries.
49 Resolves PDF.js's installed package directory for local rendering assets.
50 Starts the allowlist mapping PDF resource kinds to installed local asset directories.
51 Maps character maps, standard fonts, and WebAssembly assets to directories inside the PDF.js package.
53 Defines the custom PDF asset loader that reads only approved local files.
54 Defines asynchronous retrieval of an asset identified by resource kind and filename.
55 Checks cancellation and rendering deadline before resolving an asset.
56 Reads a resource directory only for an own property in the approved asset-kind mapping.
57 Rejects unknown asset types, disallowed filename characters, and parent-directory sequences.
58 Resolves the requested filename against its approved local asset directory.
59 Rejects any resolved file whose parent directory differs from the approved asset directory.
60 Reads the approved local asset bytes from disk.
61 Rechecks cancellation and deadline after the file read.
62 Returns the asset bytes as a Uint8Array for PDF.js.
65 Allocates loaded-document records pairing source names with PDF proxies and cleanup tasks.
66 Initializes the combined document page count.
67 Loads each provided PDF before beginning page rendering.
68 Checks cancellation and deadline before opening another PDF.
70 Begins constructing restrictive local PDF.js loading options.
71 Copies the uploaded bytes into a fresh Uint8Array, suppresses verbosity, and asks PDF.js to stop on errors.
72 Disables automatic fetching, streaming, and range loading for the in-memory PDF source.
73 Disables worker asset fetches, system fonts, and browser font-face usage.
74 Disables evaluated code and XFA handling and supplies the custom local binary-asset loader.
76 Starts PDF.js loading using the prepared local options.
77 Tracks the loading task immediately so abort/finally cleanup can destroy it.
78 Waits for the parsed PDF document proxy.
79 Checks cancellation and deadline after PDF parsing completes.
80 Adds this PDF's page count to the combined order total.
81 Rejects noninteger or empty page counts with a fixed invalid-PDF error.
82 Rejects orders exceeding the configured 50-page total before rendering page images.
83 Reads PDF metadata to detect unsupported form technology.
84 Rechecks cancellation and deadline after metadata retrieval.
85 Tests the metadata's explicit XFA-present flag.
86 Rejects dynamic XFA forms and requests a flattened PDF with visible values.
88 Retains the parsed PDF, source filename, and loading task for the rendering phase.
90 Allocates the ordered source-label and image content result.
91 Initializes the total encoded PNG byte counter.
92 Iterates through successfully loaded PDFs in source order.
93 Visits every page using PDF.js's one-based page numbering.
94 Checks cancellation and deadline before requesting a page.
95 Loads the current page proxy from the parsed PDF.
96 Rechecks cancellation and deadline after loading the page.
97 Reads the page's unscaled viewport dimensions.
98 Detects nonfinite, zero, or negative page dimensions before allocating a canvas.
99 Rejects invalid page dimensions with a fixed invalid-PDF error.
101 Chooses a scale no greater than two and small enough to keep the longest edge within 2,400 pixels.
102 Creates a native canvas with rounded-up viewport dimensions capped at the maximum edge length.
103 Starts page rendering under guaranteed page/canvas cleanup.
104 Begins drawing the PDF page into the native 2D canvas context, using a type assertion for the PDF.js canvas interface.
105 Supplies the scaled viewport, enables annotations, and renders against a white background.
107 Schedules each PDF.js continuation with setImmediate so the event loop can process cancellation and deadline callbacks.
108 Checks abort state or deadline expiry before continuing a drawing batch.
109 Triggers the local timeout reason if the deadline passed without an earlier abort.
110 Cancels the active page render when drawing may no longer continue.
111 Continues the queued PDF drawing batch only while the signal and deadline permit it.
113 Waits for the PDF page's drawing task to finish.
114 Clears the current render handle after successful drawing.
115 Checks cancellation and deadline before starting image encoding.
117 Asynchronously encodes the completed native canvas as a PNG buffer.
118 Checks cancellation and deadline after the noninterruptible encoding step finishes.
119 Rejects a single encoded page above the configured 20 MiB limit.
120 Adds the encoded page size to the running image-byte total.
121 Rejects the order once combined encoded page images exceed 40 MiB.
122 Appends a source label naming the PDF and one-based page position before its corresponding image.
123 Appends the encoded page as a high-detail PNG base64 data URL.
124 Starts cleanup that runs for the page regardless of rendering/encoding success.
125 Cancels any render task still associated with this page.
126 Clears the active render reference during cleanup.
127 Releases PDF.js page resources.
128 Shrinks the canvas width to one pixel to release the large image allocation.
129 Shrinks the canvas height to one pixel to complete canvas memory reduction.
132 Waits for this document's PDF loading task to release its resources after all its pages are processed.
133 Rechecks cancellation and deadline after document cleanup.
135 Returns all labeled PNG page blocks only after every supplied PDF rendered successfully.
136 Classifies failures from loading, validation, asset access, drawing, or encoding.
137 Preserves the combined signal's abort reason when cancellation or the rendering budget caused the failure.
138 Preserves explicitly classified application errors without replacing their messages.
139 Detects PDF.js's named password-protection exception without exposing raw error text.
140 Returns a fixed error requesting an unlocked PDF for password-protected or encrypted input.
142 Converts other failures into a fixed complete-rendering failure message.
143 Starts final cleanup for the entire rendering operation.
144 Clears the rendering deadline timer after success or failure.
145 Removes the abort listener to avoid retaining the completed operation's cleanup closure.
146 Cancels any page drawing still active during final cleanup.
147 Awaits destruction of all loading tasks while allowing individual cleanup failures to settle without masking the main result.
''')

add('preparation.ts', '''
12 Ends the existing documentation comment describing the cancellation-aware wait helper.
13 Defines a generic helper that stops waiting for asynchronous work when the supplied signal aborts.
14 Declares the abort callback reference for later removal from the signal.
15 Creates a promise that can only reject when cancellation occurs.
16 Defines cancellation rejection as a standard AbortError DOMException.
17 Registers the rejection callback once on signal abort.
18 Immediately rejects if the signal was already aborted before listener registration completed.
20 Returns whichever settles first: the original work promise or the cancellation rejection.
21 Always removes the abort listener once the race settles.
25 Exports the complete preparation lifecycle and begins declaring its required options object.
26 Requires a callback for sending typed worker status updates to the parent process.
27 Requires an external abort signal for stopping automation.
28 Completes the options type and starts the asynchronous preparation implementation.
29 Defines a compact typed status sender including optional warning strings.
30 Captures the job's private inputs in its isolated environment tool helper.
31 Reserves an optional browser session reference for successful setup and failure handoff.
32 Tracks whether automation has handed browser control to the user.
33 Tracks whether the user has closed the browser.
34 Initializes warnings collected from extraction, field planning, and verification.
35 Creates an internal controller for local timeout and browser-closure cancellation.
36 Combines internal cancellation with the caller's external signal.
37 Starts a ten-minute active-processing timeout that aborts the internal controller.
38 Begins preparation under failure handoff and guaranteed secret/document cleanup.
39 Reports that document extraction and loan-rule checks are starting.
40 Stores all submitted private settings through the environment helper.
41 Rejects work if cancellation occurred during environment initialization.
42 Privately retrieves the API key and creates exactly the requested provider/model instance.
43 Extracts structured document facts while allowing the wait to end promptly on cancellation.
44 Applies deterministic loan/business rules to the extracted facts, user choices, and contract-presence flag.
45 Retrieves the approved field plan from the deterministic planning result.
46 Preserves planning warnings for later status and review messages.
47 Overwrites the uploaded URLA and optional contract buffers with zeros after extraction/planning.
48 Checks cancellation before opening the appraisal browser.
49 Reports that R3 order preparation is starting.
50 Creates the browser session with a callback that integrates browser status into timeout and lifecycle handling.
51 Pauses the local preparation timeout while the user handles R3 sign-in.
52 Starts handling explicit browser-closed status from the session.
53 Records that the browser was closed by the user.
54 Cancels automation on closure when manual handoff has not yet completed.
56 Forwards browser statuses except awaiting_review, which the preparation lifecycle reports after its own handoff decisions.
58 Waits for the user's completed R3 login, honoring automation cancellation.
59 Resumes the remaining local preparation time after sign-in.
60 Rechecks cancellation before preparing the authenticated order page.
61 Reports successful sign-in and the start of automated form preparation.
62 Navigates the authenticated browser to the new-order page.
63 Rechecks cancellation after navigation.
64 Installs the immutable approved field plan into the session's restricted browser tools.
65 Applies the approved plan deterministically, using a cancellation-aware wait.
66 Rechecks cancellation after the initial deterministic filling pass.
67 Tests whether any approved field lacks a verified entry in the initial fill report.
68 Invokes the bounded verification/repair agent only when initial approved-field verification remains incomplete.
70 Rechecks cancellation before final verification.
71 Retrieves the browser session's final per-field verification report.
72 Selects every planned field that still lacks a matching verified report entry.
73 Appends a human-review warning for each incomplete field key.
74 Treats either unverified planned fields or missing required source fields as incomplete preparation.
75 Throws a fixed incomplete-fields error so the preserved form enters the incomplete handoff path.
77 Revokes automation and releases the successfully prepared form for human review/submission.
78 Stops the success path if the user closed the browser during handoff.
79 Records that manual handoff completed.
80 Clears the active-processing timeout before the user reviews the form.
81 Removes job environment values before waiting for human review.
82 Reports completed preparation with warnings and directs the user to review and submit in the retained browser.
83 Keeps the worker and active job occupied until the user closes the browser.
84 Begins failure handling while preserving any opened browser for review.
85 Clears the timer, cancels remaining automation, and clears private environment settings before error handoff.
86 Converts the failure to a fixed public message for the selected provider.
87 Uses a browser-closed outcome when the user has already closed the session.
88 Reports manual browser closure and confirms automation did not submit the order.
89 Uses incomplete manual handoff when a browser session exists and remains available.
91 Tracks whether the session successfully releases the incomplete form for human submission.
92 Attempts incomplete handoff and suppresses its failure so the browser remains available even if the portal cannot be released normally.
93 Continues review handoff only if the user has not closed the browser during cleanup.
94 Records whether automation controls were successfully released to the user.
95 Chooses the review message based on whether incomplete form handoff succeeded.
96 Uses guidance to finish, review, and manually submit the retained form after successful incomplete release.
97 Uses guidance explaining that the retained browser's form could not be released or verified when incomplete handoff failed.
98 Reports awaiting_review with accumulated warnings, the safe failure message, and an explicit reminder to verify missing/unverified fields.
99 Retains the worker/browser slot until the user closes the session.
101 Uses a terminal failure outcome when no browser session was created.
102 Reports the public failure message and confirms no automatic order submission occurred.
104 Starts unconditional final lifecycle cleanup after success, failure, or browser closure.
105 Clears the timer, aborts outstanding work, and clears private environment values again for idempotent cleanup.
106 Overwrites uploaded PDF buffers with zeros on every exit path.
108 Ends the full preparation lifecycle function after its guaranteed cleanup.
''')

add('server.ts', '''
3 Converts the PORT environment setting to a number, defaulting to 3000 when unset.
4 Rejects noninteger ports and values outside 1024 through 65535 before starting the server.
5 Creates the application and its worker runner configured for this port.
6 Listens only on IPv4 loopback and prints the local application URL after successful startup.
7 Limits the time allowed to receive a complete request to 60 seconds.
8 Limits receipt of request headers to 15 seconds.
9 Reports a fixed server-start error without raw exception details and sets a failing process exit code.
10 Handles interrupt and termination signals by shutting down workers, closing the HTTP server, and exiting once closure completes.
''')

add('system-prompt.ts', '''
4 Defines appraisal-product instructions separating requested appraisal services from financing products and allowing only fact-supported tentative recommendations while keeping property classifications independent.
5 Embeds the inspected baseline Conventional and FHA product labels grouped by property category into the product-selection prompt.
6 Completes product-selection rules with FHA Zero Down mapping, recommendation evidence/warnings, unsupported-case handling, approved-plan restrictions, and mandatory human review/submission.
9 Defines shared agent-role terminology and access-contact rules, distinguishing seller/listing representation from buyer/selling representation and requiring evidence instead of inferred roles.
12 Defines contract sale-price extraction independent of signature/sample status, requires contract evidence, separates other monetary amounts, and restricts R3 population to purchases with a supplied contract.
15 Defines the base loan-processing prompt, including manual R3 login, exact order-page verification, fixed branch/status contact, source-based form fields, contact sections, FHA/VA restrictions, and the user's exclusive submission responsibility.
16 Appends the fixed Amber Coleman loan-officer identity and contact values, keeping the officer section separate from the appraisal-status contact.
17 Appends the shared seller/listing and buyer/selling role-mapping instructions to the agent system prompt.
18 Appends the shared sale-price source, evidence, and purchase-only field rules to the system prompt.
19 Appends the shared bounded appraisal-product selection instructions and completes the system prompt.
''')

add('worker.ts', '''
4 Creates the worker's cancellation controller for parent-requested automation stops.
5 Accepts the first parent IPC message as this worker's job payload and starts its single-job lifecycle.
6 Defines handling of later control messages received from the parent process.
7 Aborts preparation only for an object carrying the explicit stop_preparation message type.
9 Registers the stop-control listener after the initial job payload arrives.
10 Defines status forwarding over IPC only while the parent connection remains open.
11 Starts preparation with status reporting and the worker abort signal, attaching a fallback for unexpected rejected failures.
12 Sends a fixed failed status if preparation rejects outside its normal lifecycle handling.
13 Sets the worker's eventual exit code to indicate failure.
14 Starts IPC cleanup that runs after preparation settles successfully or unsuccessfully.
15 Removes the control-message listener so the completed worker no longer accepts stop requests.
16 Disconnects the parent IPC channel if it remains connected, allowing the worker to exit naturally.
''')

add('xai.ts', '''
4 Defines the official xAI API base URL.
5 Defines the exact chat-completions endpoint allowed by the custom transport.
8 Exports creation of an xAI chat model isolated to the selected job credentials and model ID.
9 Constructs ChatXAI with the explicit job API key/model and official API base.
10 Limits SDK retries to one and disables streaming responses.
11 Sets the model's request timeout to 120 seconds.
12 Disables parallel tool calls in the model's extra request parameters.
16 Replaces the lazy SDK client's configuration after ChatXAI construction.
17 Preserves other client settings while explicitly pinning the key/base URL and clearing inherited OpenAI organization/project values.
18 Supplies a custom transport handler for SDK fetch calls.
19 Normalizes SDK fetch arguments into a Request for validation and body access.
20 Rejects any URL other than the exact approved chat-completions endpoint or any method other than POST.
21 Throws a fixed configuration error when the Grok request would use an unapproved endpoint.
23 Combines the request's cancellation signal with a 120-second timeout.
24 Rejects an already-aborted request before reading the body.
25 Reads the SDK request body into an ArrayBuffer for forwarding.
26 Rechecks cancellation after asynchronous body reading.
27 Sends the validated request to the fixed xAI completions endpoint.
28 Uses POST with JSON content type and only the selected job's bearer API-key authentication.
29 Forwards body and combined signal and rejects redirects so credentials cannot be forwarded to another location.
33 Returns the configured xAI model instance.
''')

IMPORT_PURPOSE = {
    'node:child_process': 'child-process creation and related process option types',
    'node:crypto': 'cryptographically random identifiers/tokens or timing-safe token comparison',
    'node:url': 'conversion of module-relative file URLs into local filesystem paths',
    'node:fs/promises': 'asynchronous local-file reading',
    'node:path': 'filesystem path construction, resolution, and parent-directory checks',
    'express': 'HTTP application/routing support and middleware error types',
    'helmet': 'HTTP security-header middleware',
    'express-rate-limit': 'API request-rate limiting middleware',
    'multer': 'multipart upload parsing with in-memory file buffers',
    'cookie-parser': 'incoming session-cookie parsing middleware',
    'zod': 'runtime schemas and validation-error handling',
    'langchain': 'agent construction or model-call middleware',
    '@langchain/core/tools': 'schema-described tools callable by the agent',
    '@langchain/core/messages': 'typed human/tool messages and provider-compatible content',
    '@langchain/core/utils/json_schema': 'Zod-to-JSON-Schema conversion and its schema type',
    '@langchain/openai': 'the OpenAI chat model adapter',
    '@langchain/anthropic': 'the Anthropic chat model adapter',
    '@langchain/google': 'the Google Gemini chat model adapter',
    '@langchain/xai': 'the xAI Grok chat model adapter',
    './domain.js': 'shared validated application data, business rules, defaults, and domain types',
    './errors.js': 'fixed public application errors and private provider-error classification',
    './extraction.js': 'provider model construction and document extraction abstractions',
    './environment.js': 'isolated per-job environment storage and tools',
    './browser/session.js': 'the restricted R3 browser session and approved browser actions',
    './system-prompt.js': 'shared appraisal workflow, contact, sale-price, and product instructions',
    './model-messages.js': 'provider-specific screenshot message adaptation',
    './jobs.js': 'owner-scoped isolated preparation worker management',
    './extraction-schema.js': 'Anthropic wire-schema adaptation and canonical value normalization',
    './google.js': 'the explicit-key Google model transport factory',
    './xai.js': 'the explicit-key xAI model transport factory',
    './pdf-pages.js': 'local PDF-to-page-image rendering for Grok input',
    './pausable-timeout.js': 'active-time budgets that pause during manual login',
    './agent.js': 'the bounded approved-plan verification and repair agent',
    './app.js': 'the local Express application factory',
    './preparation.js': 'the full extraction, form preparation, review, and cleanup lifecycle',
    './browser/r3-fields.js': 'the observed baseline appraisal-product labels',
    'pdfjs-dist/types/src/display/api.js': 'PDF loading/document/render task compile-time interfaces',
}

def automatic_note(line, scope, earlier, explicit):
    text = line.strip()
    if text.startswith('import '):
        module = re.search(r"from ['\"]([^'\"]+)", text).group(1)
        symbols = text.removeprefix('import ').split(' from ')[0].replace('{', '').replace('}', '').strip()
        kind = 'Imports compile-time types' if text.startswith('import type ') else 'Imports'
        return f"{kind} {symbols.removeprefix('type ').strip()} from {module} for {IMPORT_PURPOSE[module]}."
    if text.startswith('/**') or text.startswith('//') or text.startswith('*'):
        desc = re.sub(r'^/\*\*?|^//|^\*', '', text).removesuffix('*/').strip()
        if desc:
            return 'Existing explanatory comment: ' + desc
        return 'Ends the existing documentation comment before the implementation.'
    if re.fullmatch(r'[\]\)};, ]+', text):
        indent = len(line) - len(line.lstrip())
        for old_number, old_line in reversed(earlier):
            old_text = old_line.strip()
            if len(old_line) - len(old_line.lstrip()) != indent:
                continue
            if old_text.endswith(('{', '[', '(')) and old_number in explicit:
                label = explicit[old_number].rstrip('.')
                return f'Closes the scope or expression introduced here: {label}.'
        return f'Closes the enclosing declaration, expression, or block within {scope}.'
    return None

def write_all():
    missing = []
    total = 0
    for filename, explicit in MAPS.items():
        path = ROOT / 'originals' / 'src' / filename
        lines = path.read_text(encoding='utf-8-sig').splitlines()
        notes = {}
        scope = filename
        for number, line in enumerate(lines, 1):
            if not line.strip():
                continue
            match = re.search(r'(?:function|class|interface)\s+([A-Za-z_][A-Za-z_0-9]*)', line)
            if match:
                scope = match.group(1)
            note = explicit.get(number) or automatic_note(line, scope, list(enumerate(lines[:number-1], 1)), explicit)
            if note is None:
                missing.append(f'{filename}:{number}: {line.strip()}')
            else:
                notes[str(number)] = note
        target = ROOT / 'notes' / 'src' / (filename + '.json')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(notes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total += len(notes)
        print(f'{filename}: {len(notes)}/{sum(bool(line.strip()) for line in lines)}')
    print('TOTAL', total)
    if missing:
        print('MISSING\n' + '\n'.join(missing))
        raise SystemExit(1)

if __name__ == '__main__':
    write_all()
