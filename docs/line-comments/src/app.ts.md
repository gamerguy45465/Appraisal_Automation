# Line explanations: src/app.ts

Source: [src/app.ts](../../../src/app.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports express,  type ErrorRequestHandler from express for HTTP application/routing support and middleware error types. |
| 2 | Imports helmet from helmet for HTTP security-header middleware. |
| 3 | Imports rateLimit from express-rate-limit for API request-rate limiting middleware. |
| 4 | Imports multer from multer for multipart upload parsing with in-memory file buffers. |
| 5 | Imports cookieParser from cookie-parser for incoming session-cookie parsing middleware. |
| 6 | Imports randomBytes, timingSafeEqual from node:crypto for cryptographically random identifiers/tokens or timing-safe token comparison. |
| 7 | Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths. |
| 8 | Imports ZodError from zod for runtime schemas and validation-error handling. |
| 9 | Imports DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, inputSchema, MAX_PDF_BYTES, validatePdf, type UploadedPdf from ./domain.js for shared validated application data, business rules, defaults, and domain types. |
| 10 | Imports AppError, publicError from ./errors.js for fixed public application errors and private provider-error classification. |
| 11 | Imports createJobRunner, type JobRunner from ./jobs.js for owner-scoped isolated preparation worker management. |
| 12 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 13 | Defines an in-memory session record containing its CSRF token and creation timestamp. |
| 14 | Defines optional application dependencies for injecting a job runner and choosing the local port. |
| 15 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 16 | Existing explanatory comment: Local, single-user application: reject remote hosts/origins before parsing uploads. |
| 17 | Exports the Express application factory, defaulting to an empty options object. |
| 18 | Uses the injected job runner when supplied or creates the production worker runner. |
| 19 | Uses the requested local port or defaults to 3000. |
| 20 | Builds the exact localhost and loopback HTTP origins accepted for this port. |
| 21 | Creates the Express application instance. |
| 22 | Allocates the application's in-memory session map keyed by session identifier. |
| 23 | Configures in-memory PDF uploads with limits on file size, two files, ten text fields, field length, and multipart part count. |
| 24 | Rejects uploads unless their declared MIME type is PDF and filename ends in .pdf; otherwise accepts them for later content validation. |
| 25 | Completes the multer upload middleware configuration. |
| 26 | Removes Express's identifying X-Powered-By response header. |
| 27 | Installs security headers and a same-origin content policy, allows inline data images, blocks framing, and disables HTTPS upgrade/HSTS behavior for local HTTP use. |
| 28 | Adds Cache-Control: no-store to every response and advances to the next middleware. |
| 29 | Starts request middleware that validates the incoming host and browser origin before upload parsing. |
| 30 | Rejects a Host header outside the configured localhost/loopback origin set with HTTP 403. |
| 31 | Reads the request's Origin header for cross-origin checks. |
| 32 | Rejects an unapproved Origin header or explicitly cross-site browser request with HTTP 403. |
| 33 | Passes an accepted host/origin request to subsequent middleware. |
| 34 | Closes the scope or expression introduced here: Starts request middleware that validates the incoming host and browser origin before upload parsing. |
| 35 | Parses incoming Cookie headers so session middleware can read the session identifier. |
| 36 | Limits API requests to 120 per minute, emits draft-8 rate headers, and returns a fixed HTTP 429 JSON message when exceeded. |
| 37 | Registers the session bootstrap endpoint that returns defaults and session-specific state. |
| 38 | Removes sessions older than one day whenever the bootstrap endpoint runs. |
| 39 | Reads a string session cookie, falling back to an empty identifier for absent or malformed cookies. |
| 40 | Looks up the cookie's session in the server's in-memory map. |
| 41 | Creates a new session only when the supplied cookie did not identify an existing one. |
| 42 | Rejects creation once 500 sessions remain, asking the user to restart the local application. |
| 43 | Generates independent random 32-byte hexadecimal session and CSRF tokens, timestamps the session, and stores it. |
| 44 | Sends a one-day HTTP-only, Strict SameSite cookie scoped to the local application; secure is false for its HTTP server. |
| 45 | Closes the scope or expression introduced here: Creates a new session only when the supplied cookie did not identify an existing one. |
| 46 | Returns the CSRF token, default model/provider choices, and any active job belonging to this session. |
| 47 | Closes the scope or expression introduced here: Registers the session bootstrap endpoint that returns defaults and session-specific state. |
| 48 | Adds session ownership and CSRF validation for all later API routes. |
| 49 | Reads the session cookie as unknown so its runtime type must be checked. |
| 50 | Looks up a session only if the cookie identifier is a string. |
| 51 | Rejects missing or expired sessions with HTTP 401 before accessing protected API routes. |
| 52 | Records the validated session identifier as the request's job owner. |
| 53 | Requires CSRF validation for methods other than GET and HEAD. |
| 54 | Reads the submitted CSRF token header, using an empty string when absent. |
| 55 | Encodes the submitted CSRF token as bytes for comparison. |
| 56 | Encodes the stored session CSRF token as bytes for comparison. |
| 57 | Rejects unequal token lengths or a failed constant-time comparison with HTTP 403. |
| 58 | Closes the scope or expression introduced here: Requires CSRF validation for methods other than GET and HEAD. |
| 59 | Advances an authenticated API request after any required CSRF check succeeds. |
| 60 | Closes the scope or expression introduced here: Adds session ownership and CSRF validation for all later API routes. |
| 61 | Registers job creation with multipart parsing for one required URLA field and at most one sales-contract field. |
| 62 | Interprets multer's uploaded files as named arrays that may be absent. |
| 63 | Selects the first URLA upload if one was provided. |
| 64 | Selects the optional first sales-contract upload. |
| 65 | Starts validation and job creation under cleanup-aware error handling. |
| 66 | Treats form fields as unknown input values pending schema validation. |
| 67 | Validates and normalizes the submitted form fields with the application input schema. |
| 68 | Rejects job creation when no URLA was uploaded. |
| 69 | Assigns the URLA a fixed internal filename and validates the uploaded PDF bytes. |
| 70 | Wraps an uploaded contract with its fixed internal filename, or leaves it undefined. |
| 71 | Validates the optional contract's PDF bytes before passing it to a worker. |
| 72 | Creates a job owned by the validated local session with the parsed input and document buffers. |
| 73 | Responds HTTP 202 with the queued job view. |
| 74 | Starts the failure path for input validation, PDF validation, or job creation errors. |
| 75 | Overwrites available uploaded document buffers with zeros and rethrows the original failure for the error middleware. |
| 76 | Clears parsed request-body references whether job creation succeeds or fails. |
| 77 | Closes the scope or expression introduced here: Registers job creation with multipart parsing for one required URLA field and at most one sales-contract field. |
| 78 | Registers retrieval of an individual job by its URL identifier. |
| 79 | Requests the job view using both the current session owner and requested job ID. |
| 80 | Returns HTTP 404 if the job is absent or belongs to another session. |
| 81 | Returns the authorized job view as JSON. |
| 82 | Closes the scope or expression introduced here: Registers retrieval of an individual job by its URL identifier. |
| 83 | Converts unmatched API operations into a fixed HTTP 404 application error. |
| 84 | Serves the public directory resolved relative to this module, disabling ETags and denying dotfiles. |
| 85 | Defines the final Express error middleware with an unknown error type. |
| 86 | Converts Zod failures into HTTP 400 field-level JSON errors, joining nested paths with dots, then stops processing. |
| 87 | Converts multer failures into a fixed HTTP 400 upload-limit response and stops processing. |
| 88 | Classifies any remaining failure into an application-safe public error. |
| 89 | Returns only the classified status code, public error code, and safe message. |
| 90 | Closes the scope or expression introduced here: Defines the final Express error middleware with an unknown error type. |
| 91 | Installs the final error handler after all routes and static middleware. |
| 92 | Returns the Express app and job runner so callers can listen and shut down workers. |
| 93 | Closes the scope or expression introduced here: Exports the Express application factory, defaulting to an empty options object. |
