// [L1] Imports express,  type ErrorRequestHandler from express for HTTP application/routing support and middleware error types.
import express from 'express';
// [L2] Imports helmet from helmet for HTTP security-header middleware.
import helmet from 'helmet';
// [L3] Imports rateLimit from express-rate-limit for API request-rate limiting middleware.
import rateLimit from 'express-rate-limit';
// [L4] Imports multer from multer for multipart upload parsing with in-memory file buffers.
import multer from 'multer';
// [L5] Imports cookieParser from cookie-parser for incoming session-cookie parsing middleware.
import cookieParser from 'cookie-parser';
// [L6] Imports randomBytes, timingSafeEqual from node:crypto for cryptographically random identifiers/tokens or timing-safe token comparison.
import { randomBytes, timingSafeEqual } from 'node:crypto';
// [L7] Imports fileURLToPath from node:url for conversion of module-relative file URLs into local filesystem paths.
import { fileURLToPath } from 'node:url';
// [L8] Imports ZodError from zod for runtime schemas and validation-error handling.
import { ZodError } from 'zod';
// [L9] Imports DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, inputSchema, MAX_PDF_BYTES, validatePdf, type UploadedPdf from ./domain.js for shared validated application data, business rules, defaults, and domain types.
import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, inputSchema, MAX_PDF_BYTES, validatePdf } from './domain.js';
// [L10] Imports AppError, publicError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError, publicError } from './errors.js';
// [L11] Imports createJobRunner, type JobRunner from ./jobs.js for owner-scoped isolated preparation worker management.
import { createJobRunner } from './jobs.js';
// [L15] Blank line separating the surrounding declarations, statements, or document blocks.
// [L16] Existing explanatory comment: Local, single-user application: reject remote hosts/origins before parsing uploads.
/** Local, single-user application: reject remote hosts/origins before parsing uploads. */
// [L17] Exports the Express application factory, defaulting to an empty options object.
export function createApp(options = {}) {
    // [L18] Uses the injected job runner when supplied or creates the production worker runner.
    const runner = options.runner ?? createJobRunner();
    // [L19] Uses the requested local port or defaults to 3000.
    const port = options.port ?? 3000;
    // [L20] Builds the exact localhost and loopback HTTP origins accepted for this port.
    // TODO: This may be something to change so that it is more dynamic so that it can be hosted on the web, such as on AWS Elastic Beanstalk
    const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
    // [L21] Creates the Express application instance.
    const app = express();
    // [L22] Allocates the application's in-memory session map keyed by session identifier.
    const sessions = new Map();
    // [L23] Configures in-memory PDF uploads with limits on file size, two files, ten text fields, field length, and multipart part count.
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PDF_BYTES, files: 2, fields: 10, fieldSize: 2048, parts: 12 },
        // [L24] Rejects uploads unless their declared MIME type is PDF and filename ends in .pdf; otherwise accepts them for later content validation.
        fileFilter: (_req, file, cb) => { if (file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf'))
            cb(new AppError('INVALID_PDF', 'Upload PDF documents only.'));
        else
            cb(null, true); },
        // [L25] Completes the multer upload middleware configuration.
    });
    // [L26] Removes Express's identifying X-Powered-By response header.
    app.disable('x-powered-by');
    // [L27] Installs security headers and a same-origin content policy, allows inline data images, blocks framing, and disables HTTPS upgrade/HSTS behavior for local HTTP use.
    app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"], upgradeInsecureRequests: null } }, strictTransportSecurity: false }));
    // [L28] Adds Cache-Control: no-store to every response and advances to the next middleware.
    app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
    // [L29] Starts request middleware that validates the incoming host and browser origin before upload parsing.
    app.use((req, _res, next) => {
        // [L30] Rejects a Host header outside the configured localhost/loopback origin set with HTTP 403.
        if (!origins.has(`http://${req.get('host')}`))
            return next(new AppError('HOST_REJECTED', 'Open this application using its localhost address.', 403));
        // [L31] Reads the request's Origin header for cross-origin checks.
        const origin = req.get('origin');
        // [L32] Rejects an unapproved Origin header or explicitly cross-site browser request with HTTP 403.
        if ((origin && !origins.has(origin)) || req.get('sec-fetch-site') === 'cross-site')
            return next(new AppError('ORIGIN_REJECTED', 'This request must come from the local application.', 403));
        // [L33] Passes an accepted host/origin request to subsequent middleware.
        next();
        // [L34] Closes the scope or expression introduced here: Starts request middleware that validates the incoming host and browser origin before upload parsing.
    });
    // [L35] Parses incoming Cookie headers so session middleware can read the session identifier.
    app.use(cookieParser());
    // [L36] Limits API requests to 120 per minute, emits draft-8 rate headers, and returns a fixed HTTP 429 JSON message when exceeded.
    app.use('/api', rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => { res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Wait a minute and try again.' } }); } }));
    // [L37] Registers the session bootstrap endpoint that returns defaults and session-specific state.
    app.get('/api/session', (req, res) => {
        // [L38] Removes sessions older than one day whenever the bootstrap endpoint runs.
        for (const [id, session] of sessions)
            if (Date.now() - session.createdAt > 86400000)
                sessions.delete(id);
        // [L39] Reads a string session cookie, falling back to an empty identifier for absent or malformed cookies.
        let id = typeof req.cookies.appraisalSession === 'string' ? req.cookies.appraisalSession : '';
        // [L40] Looks up the cookie's session in the server's in-memory map.
        let session = sessions.get(id);
        // [L41] Creates a new session only when the supplied cookie did not identify an existing one.
        if (!session) {
            // [L42] Rejects creation once 500 sessions remain, asking the user to restart the local application.
            if (sessions.size >= 500)
                throw new AppError('SESSION_LIMIT', 'Restart the local application to clear unused sessions.', 503);
            // [L43] Generates independent random 32-byte hexadecimal session and CSRF tokens, timestamps the session, and stores it.
            id = randomBytes(32).toString('hex');
            session = { token: randomBytes(32).toString('hex'), createdAt: Date.now() };
            sessions.set(id, session);
            // [L44] Sends a one-day HTTP-only, Strict SameSite cookie scoped to the local application; secure is false for its HTTP server.
            res.cookie('appraisalSession', id, { httpOnly: true, sameSite: 'strict', secure: false, path: '/', maxAge: 86400000 });
            // [L45] Closes the scope or expression introduced here: Creates a new session only when the supplied cookie did not identify an existing one.
        }
        // [L46] Returns the CSRF token, default model/provider choices, and any active job belonging to this session.
        res.json({ csrfToken: session.token, model: DEFAULT_MODEL, defaultProvider: DEFAULT_PROVIDER, modelDefaults: DEFAULT_MODELS, activeJob: runner.getActive?.(id) });
        // [L47] Closes the scope or expression introduced here: Registers the session bootstrap endpoint that returns defaults and session-specific state.
    });
    // [L48] Adds session ownership and CSRF validation for all later API routes.
    app.use('/api', (req, res, next) => {
        // [L49] Reads the session cookie as unknown so its runtime type must be checked.
        const id = req.cookies.appraisalSession;
        // [L50] Looks up a session only if the cookie identifier is a string.
        const session = typeof id === 'string' ? sessions.get(id) : undefined;
        // [L51] Rejects missing or expired sessions with HTTP 401 before accessing protected API routes.
        if (!session || Date.now() - session.createdAt > 86400000)
            return next(new AppError('SESSION_REQUIRED', 'Refresh the page to start a local session.', 401));
        // [L52] Records the validated session identifier as the request's job owner.
        res.locals.owner = id;
        // [L53] Requires CSRF validation for methods other than GET and HEAD.
        if (!['GET', 'HEAD'].includes(req.method)) {
            // [L54] Reads the submitted CSRF token header, using an empty string when absent.
            const token = req.get('X-CSRF-Token') ?? '';
            // [L55] Encodes the submitted CSRF token as bytes for comparison.
            const tokenBytes = Buffer.from(token);
            // [L56] Encodes the stored session CSRF token as bytes for comparison.
            const expectedBytes = Buffer.from(session.token);
            // [L57] Rejects unequal token lengths or a failed constant-time comparison with HTTP 403.
            if (tokenBytes.length !== expectedBytes.length || !timingSafeEqual(tokenBytes, expectedBytes))
                return next(new AppError('CSRF_REJECTED', 'Refresh the page before submitting again.', 403));
            // [L58] Closes the scope or expression introduced here: Requires CSRF validation for methods other than GET and HEAD.
        }
        // [L59] Advances an authenticated API request after any required CSRF check succeeds.
        next();
        // [L60] Closes the scope or expression introduced here: Adds session ownership and CSRF validation for all later API routes.
    });
    // [L61] Registers job creation with multipart parsing for one required URLA field and at most one sales-contract field.
    app.post('/api/jobs', upload.fields([{ name: 'urla', maxCount: 1 }, { name: 'salesContract', maxCount: 1 }]), (req, res) => {
        // [L62] Interprets multer's uploaded files as named arrays that may be absent.
        const files = req.files;
        // [L63] Selects the first URLA upload if one was provided.
        const urlaFile = files?.urla?.[0];
        // [L64] Selects the optional first sales-contract upload.
        const contractFile = files?.salesContract?.[0];
        // [L65] Starts validation and job creation under cleanup-aware error handling.
        try {
            // [L66] Treats form fields as unknown input values pending schema validation.
            const body = req.body;
            // [L67] Validates and normalizes the submitted form fields with the application input schema.
            const input = inputSchema.parse(body);
            // [L68] Rejects job creation when no URLA was uploaded.
            if (!urlaFile)
                throw new AppError('URLA_REQUIRED', 'Upload the URLA PDF to continue.');
            // [L69] Assigns the URLA a fixed internal filename and validates the uploaded PDF bytes.
            const urla = { name: 'urla.pdf', buffer: urlaFile.buffer };
            validatePdf(urla);
            // [L70] Wraps an uploaded contract with its fixed internal filename, or leaves it undefined.
            const salesContract = contractFile ? { name: 'sales-contract.pdf', buffer: contractFile.buffer } : undefined;
            // [L71] Validates the optional contract's PDF bytes before passing it to a worker.
            if (salesContract)
                validatePdf(salesContract);
            // [L72] Creates a job owned by the validated local session with the parsed input and document buffers.
            const job = runner.create(res.locals.owner, { input, urla, salesContract });
            // [L73] Responds HTTP 202 with the queued job view.
            res.status(202).json({ job });
            // [L74] Starts the failure path for input validation, PDF validation, or job creation errors.
        }
        catch (error) {
            // [L75] Overwrites available uploaded document buffers with zeros and rethrows the original failure for the error middleware.
            urlaFile?.buffer.fill(0);
            contractFile?.buffer.fill(0);
            throw error;
            // [L76] Clears parsed request-body references whether job creation succeeds or fails.
        }
        finally {
            req.body = {};
        }
        // [L77] Closes the scope or expression introduced here: Registers job creation with multipart parsing for one required URLA field and at most one sales-contract field.
    });
    // [L78] Registers retrieval of an individual job by its URL identifier.
    app.get('/api/jobs/:id', (req, res) => {
        // [L79] Requests the job view using both the current session owner and requested job ID.
        const job = runner.get(res.locals.owner, req.params.id);
        // [L80] Returns HTTP 404 if the job is absent or belongs to another session.
        if (!job)
            throw new AppError('JOB_NOT_FOUND', 'This preparation was not found in your session.', 404);
        // [L81] Returns the authorized job view as JSON.
        res.json({ job });
        // [L82] Closes the scope or expression introduced here: Registers retrieval of an individual job by its URL identifier.
    });
    // [L83] Converts unmatched API operations into a fixed HTTP 404 application error.
    app.use('/api', (_req, _res, next) => next(new AppError('NOT_FOUND', 'The requested operation does not exist.', 404)));
    // [L84] Serves the public directory resolved relative to this module, disabling ETags and denying dotfiles.
    app.use(express.static(fileURLToPath(new URL('../public', import.meta.url)), { etag: false, dotfiles: 'deny' }));
    // [L85] Defines the final Express error middleware with an unknown error type.
    const handleError = (error, _req, res, _next) => {
        // [L86] Converts Zod failures into HTTP 400 field-level JSON errors, joining nested paths with dots, then stops processing.
        if (error instanceof ZodError) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the highlighted form fields.', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
            return;
        }
        // [L87] Converts multer failures into a fixed HTTP 400 upload-limit response and stops processing.
        if (error instanceof multer.MulterError) {
            res.status(400).json({ error: { code: 'UPLOAD_LIMIT', message: 'Use one URLA and an optional sales contract, each a PDF no larger than 15 MiB.' } });
            return;
        }
        // [L88] Classifies any remaining failure into an application-safe public error.
        const safe = publicError(error);
        // [L89] Returns only the classified status code, public error code, and safe message.
        res.status(safe.statusCode).json({ error: { code: safe.code, message: safe.message } });
        // [L90] Closes the scope or expression introduced here: Defines the final Express error middleware with an unknown error type.
    };
    // [L91] Installs the final error handler after all routes and static middleware.
    app.use(handleError);
    // [L92] Returns the Express app and job runner so callers can listen and shut down workers.
    return { app, runner };
    // [L93] Closes the scope or expression introduced here: Exports the Express application factory, defaulting to an empty options object.
}
//# sourceMappingURL=app.js.map