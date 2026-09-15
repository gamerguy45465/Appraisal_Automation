import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, inputSchema, MAX_PDF_BYTES, validatePdf } from './domain.js';
import { AppError, publicError } from './errors.js';
import { createJobRunner } from './jobs.js';
/** Local, single-user application: reject remote hosts/origins before parsing uploads. */
export function createApp(options = {}) {
    const runner = options.runner ?? createJobRunner();
    const port = options.port ?? 3000;
    const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
    const app = express();
    const sessions = new Map();
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PDF_BYTES, files: 2, fields: 10, fieldSize: 2048, parts: 12 },
        fileFilter: (_req, file, cb) => { if (file.mimetype !== 'application/pdf' || !file.originalname.toLowerCase().endsWith('.pdf'))
            cb(new AppError('INVALID_PDF', 'Upload PDF documents only.'));
        else
            cb(null, true); },
    });
    app.disable('x-powered-by');
    app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"], upgradeInsecureRequests: null } }, strictTransportSecurity: false }));
    app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
    app.use((req, _res, next) => {
        if (!origins.has(`http://${req.get('host')}`))
            return next(new AppError('HOST_REJECTED', 'Open this application using its localhost address.', 403));
        const origin = req.get('origin');
        if ((origin && !origins.has(origin)) || req.get('sec-fetch-site') === 'cross-site')
            return next(new AppError('ORIGIN_REJECTED', 'This request must come from the local application.', 403));
        next();
    });
    app.use(cookieParser());
    app.use('/api', rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false, handler: (_req, res) => { res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Wait a minute and try again.' } }); } }));
    app.get('/api/session', (req, res) => {
        for (const [id, session] of sessions)
            if (Date.now() - session.createdAt > 86400000)
                sessions.delete(id);
        let id = typeof req.cookies.appraisalSession === 'string' ? req.cookies.appraisalSession : '';
        let session = sessions.get(id);
        if (!session) {
            if (sessions.size >= 500)
                throw new AppError('SESSION_LIMIT', 'Restart the local application to clear unused sessions.', 503);
            id = randomBytes(32).toString('hex');
            session = { token: randomBytes(32).toString('hex'), createdAt: Date.now() };
            sessions.set(id, session);
            res.cookie('appraisalSession', id, { httpOnly: true, sameSite: 'strict', secure: false, path: '/', maxAge: 86400000 });
        }
        res.json({ csrfToken: session.token, model: DEFAULT_MODEL, defaultProvider: DEFAULT_PROVIDER, modelDefaults: DEFAULT_MODELS, activeJob: runner.getActive?.(id) });
    });
    app.use('/api', (req, res, next) => {
        const id = req.cookies.appraisalSession;
        const session = typeof id === 'string' ? sessions.get(id) : undefined;
        if (!session || Date.now() - session.createdAt > 86400000)
            return next(new AppError('SESSION_REQUIRED', 'Refresh the page to start a local session.', 401));
        res.locals.owner = id;
        if (!['GET', 'HEAD'].includes(req.method)) {
            const token = req.get('X-CSRF-Token') ?? '';
            const tokenBytes = Buffer.from(token);
            const expectedBytes = Buffer.from(session.token);
            if (tokenBytes.length !== expectedBytes.length || !timingSafeEqual(tokenBytes, expectedBytes))
                return next(new AppError('CSRF_REJECTED', 'Refresh the page before submitting again.', 403));
        }
        next();
    });
    app.post('/api/jobs', upload.fields([{ name: 'urla', maxCount: 1 }, { name: 'salesContract', maxCount: 1 }]), (req, res) => {
        const files = req.files;
        const urlaFile = files?.urla?.[0];
        const contractFile = files?.salesContract?.[0];
        try {
            const body = req.body;
            const input = inputSchema.parse(body);
            if (!urlaFile)
                throw new AppError('URLA_REQUIRED', 'Upload the URLA PDF to continue.');
            const urla = { name: 'urla.pdf', buffer: urlaFile.buffer };
            validatePdf(urla);
            const salesContract = contractFile ? { name: 'sales-contract.pdf', buffer: contractFile.buffer } : undefined;
            if (salesContract)
                validatePdf(salesContract);
            const job = runner.create(res.locals.owner, { input, urla, salesContract });
            res.status(202).json({ job });
        }
        catch (error) {
            urlaFile?.buffer.fill(0);
            contractFile?.buffer.fill(0);
            throw error;
        }
        finally {
            req.body = {};
        }
    });
    app.get('/api/jobs/:id', (req, res) => {
        const job = runner.get(res.locals.owner, req.params.id);
        if (!job)
            throw new AppError('JOB_NOT_FOUND', 'This preparation was not found in your session.', 404);
        res.json({ job });
    });
    app.use('/api', (_req, _res, next) => next(new AppError('NOT_FOUND', 'The requested operation does not exist.', 404)));
    app.use(express.static(fileURLToPath(new URL('../public', import.meta.url)), { etag: false, dotfiles: 'deny' }));
    const handleError = (error, _req, res, _next) => {
        if (error instanceof ZodError) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the highlighted form fields.', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
            return;
        }
        if (error instanceof multer.MulterError) {
            res.status(400).json({ error: { code: 'UPLOAD_LIMIT', message: 'Use one URLA and an optional sales contract, each a PDF no larger than 15 MiB.' } });
            return;
        }
        const safe = publicError(error);
        res.status(safe.statusCode).json({ error: { code: safe.code, message: safe.message } });
    };
    app.use(handleError);
    return { app, runner };
}
//# sourceMappingURL=app.js.map