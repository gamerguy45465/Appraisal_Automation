import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { deserializeJobPayload, relayConnectResponseSchema, relayExchangeInputSchema, relayExchangeResponseSchema, COMPANION_TOKEN_PATTERN, MAX_RELAY_RESPONSE_BYTES, } from './companion-protocol.js';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ACCEPTED_JOBS = 1000;
const problemMessages = {
    origin: 'Enter the exact HTTPS website origin, without a path, query, fragment, or credentials.',
    pairing: 'The pairing code is invalid. Generate a new code in Appraisal Desk and enter it here.',
    pairing_connection: 'Pairing could not be confirmed. Check the website connection, generate a fresh pairing code in Appraisal Desk, and restart the companion.',
    connection: 'The website connection is unavailable. Local preparation and the R3 browser remain running; the companion will retry.',
    authorization: 'The website connection expired or was reset. Finish reviewing the local R3 form and close its browser, then restart the companion and pair with a new code. Do not resend the current order.',
    protocol: 'The website returned an invalid companion response. Finish any local R3 review and close its browser, then check the website deployment and pair again. No rejected work was started.',
    busy: 'The local preparation is still active. The companion will retry after its status is updated.',
    limit: 'This companion session reached its job limit. Finish local review and close the R3 browser, then restart the companion and pair again.',
};
/** Errors intentionally contain no remote response body, URL, credential, or document data. */
export class CompanionConnectionError extends Error {
    problem;
    constructor(problem) {
        super(problemMessages[problem]);
        this.problem = problem;
        this.name = 'CompanionConnectionError';
    }
}
export function validateCompanionOrigin(value) {
    try {
        const origin = value.trim();
        const parsed = new URL(origin);
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash
            || (origin !== parsed.origin && origin !== `${parsed.origin}/`))
            throw new Error();
        return parsed.origin;
    }
    catch {
        throw new CompanionConnectionError('origin');
    }
}
async function readBoundedJson(response, maximumBytes) {
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) {
        await response.body?.cancel();
        throw new CompanionConnectionError('protocol');
    }
    const contentLength = response.headers.get('content-length');
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maximumBytes)) {
        await response.body?.cancel();
        throw new CompanionConnectionError('protocol');
    }
    const reader = response.body?.getReader();
    if (!reader)
        throw new CompanionConnectionError('protocol');
    const chunks = [];
    let bytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            bytes += value.byteLength;
            if (bytes > maximumBytes) {
                await reader.cancel();
                throw new CompanionConnectionError('protocol');
            }
            chunks.push(Buffer.from(value));
        }
        const combined = Buffer.concat(chunks, bytes);
        try {
            return JSON.parse(combined.toString('utf8'));
        }
        catch {
            throw new CompanionConnectionError('protocol');
        }
        finally {
            combined.fill(0);
        }
    }
    finally {
        reader.releaseLock();
        for (const chunk of chunks)
            chunk.fill(0);
    }
}
const stageMessages = {
    queued: 'An appraisal has been accepted by this PC.',
    extracting: 'The selected provider is reading the documents.',
    awaiting_login: 'Sign in manually in the R3 browser on this PC.',
    preparing: 'The appraisal form is being prepared on this PC.',
    awaiting_review: 'Review the R3 form on this PC. Only you can submit it. Check Appraisal Desk for review warnings.',
    user_submitted: 'Check R3 directly to confirm acceptance of your submission.',
    browser_closed: 'The R3 browser has closed.',
    failed: 'Preparation could not complete. Check Appraisal Desk and any open R3 browser for review guidance.',
};
function boundedPublicText(value) {
    return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '').slice(0, 2000);
}
function boundedWarnings(warnings) {
    const result = [];
    let remaining = 32_000;
    for (const warning of warnings) {
        const bounded = boundedPublicText(warning);
        // Even JSON's longest six-byte escapes keep the entire exchange below 256 KiB.
        if (result.length === 99 || bounded.length > remaining) {
            result.push('Additional review warnings could not fit. Carefully inspect every R3 field before submitting.');
            break;
        }
        result.push(bounded);
        remaining -= bounded.length;
    }
    return result;
}
/** Runs the existing isolated Windows worker; the relay cannot send browser commands. */
export function createCompanionClient(options) {
    const origin = validateCompanionOrigin(options.origin);
    let pairingToken = options.pairingToken;
    if (!COMPANION_TOKEN_PATTERN.test(pairingToken))
        throw new CompanionConnectionError('pairing');
    const fetchRequest = options.fetch ?? fetch;
    const runner = options.runner;
    if (typeof runner.getActive !== 'function')
        throw new CompanionConnectionError('protocol');
    const owner = randomUUID();
    const tell = options.onMessage ?? (() => undefined);
    const pollIntervalMs = Math.max(10, options.pollIntervalMs ?? 2000);
    const acceptedJobs = new Map();
    let token;
    let currentCloudId;
    let declinedCloudId;
    let sequence = 0;
    let exchanging = false;
    let stopping = false;
    let connectionEnded = false;
    let lastStage;
    const hasActiveBrowser = () => Boolean(runner.getActive?.(owner));
    const getCurrentView = () => {
        const localId = currentCloudId && acceptedJobs.get(currentCloudId);
        return localId ? runner.get(owner, localId) : undefined;
    };
    const request = async (path, credential, body, limit) => {
        try {
            const response = await fetchRequest(`${origin}${path}`, {
                method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store',
                headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(body), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
            if (response.redirected || (response.url && response.url !== `${origin}${path}`)) {
                await response.body?.cancel();
                throw new CompanionConnectionError('protocol');
            }
            if (!response.ok) {
                await response.body?.cancel();
                if (response.status === 401 || response.status === 403)
                    throw new CompanionConnectionError('authorization');
                if (response.status === 429 || response.status >= 500)
                    throw new CompanionConnectionError('connection');
                throw new CompanionConnectionError('protocol');
            }
            return await readBoundedJson(response, limit);
        }
        catch (error) {
            if (error instanceof CompanionConnectionError)
                throw error;
            throw new CompanionConnectionError('connection');
        }
    };
    const client = {
        hasActiveBrowser,
        async connect() {
            if (token)
                return;
            if (!pairingToken || connectionEnded)
                throw new CompanionConnectionError('authorization');
            try {
                const response = relayConnectResponseSchema.safeParse(await request('/api/companion/connect', pairingToken, {}, 4096));
                if (!response.success)
                    throw new CompanionConnectionError('protocol');
                token = response.data.token;
            }
            catch (error) {
                if (error instanceof CompanionConnectionError && error.problem === 'connection')
                    throw new CompanionConnectionError('pairing_connection');
                throw error;
            }
            finally {
                // A lost response may have consumed the one-time token; do not silently reuse it.
                pairingToken = '';
            }
        },
        async exchangeOnce() {
            if (!token || connectionEnded)
                throw new CompanionConnectionError('authorization');
            if (exchanging)
                throw new CompanionConnectionError('busy');
            exchanging = true;
            try {
                const view = getCurrentView();
                const browserOpen = hasActiveBrowser();
                const update = view && currentCloudId ? {
                    id: currentCloudId, status: view.status, message: boundedPublicText(view.message),
                    ...(view.warnings ? { warnings: boundedWarnings(view.warnings) } : {}),
                    canStartAnother: view.canStartAnother === true || (!browserOpen && ['browser_closed', 'failed'].includes(view.status)),
                    browserOpen,
                } : undefined;
                const body = relayExchangeInputSchema.parse({
                    sequence: sequence++, ...(currentCloudId ? { acceptedJobId: currentCloudId } : {}), ...(update ? { update } : {}),
                    ...(declinedCloudId ? { declinedJobId: declinedCloudId } : {}),
                    ...(stopping ? { stopping: true } : {}),
                });
                const response = relayExchangeResponseSchema.safeParse(await request('/api/companion/exchange', token, body, MAX_RELAY_RESPONSE_BYTES));
                if (!response.success)
                    throw new CompanionConnectionError('protocol');
                // A successfully parsed response confirms receipt of this exact decline.
                declinedCloudId = undefined;
                const delivery = response.data.job;
                if (!delivery)
                    return;
                if (stopping) {
                    // The HTTP request may already have delivered documents when Ctrl+C arrived.
                    // Explicitly release only received work that never entered the local runner.
                    if (!acceptedJobs.has(delivery.id))
                        declinedCloudId = delivery.id;
                    return;
                }
                if (acceptedJobs.has(delivery.id)) {
                    // Old responses cannot replace a newer order's identity or restart paid extraction.
                    if (delivery.id !== currentCloudId)
                        throw new CompanionConnectionError('protocol');
                    return;
                }
                if (acceptedJobs.size >= MAX_ACCEPTED_JOBS)
                    throw new CompanionConnectionError('limit');
                let payload;
                try {
                    payload = deserializeJobPayload(delivery.payload);
                }
                catch {
                    throw new CompanionConnectionError('protocol');
                }
                try {
                    const created = runner.create(owner, payload);
                    acceptedJobs.set(delivery.id, created.id);
                    currentCloudId = delivery.id;
                }
                catch {
                    payload.urla.buffer.fill(0);
                    payload.salesContract?.buffer.fill(0);
                    payload.input.apiKey = '';
                    throw new CompanionConnectionError('busy');
                }
            }
            catch (error) {
                if (error instanceof CompanionConnectionError)
                    throw error;
                throw new CompanionConnectionError('protocol');
            }
            finally {
                exchanging = false;
            }
        },
        requestStop() {
            if (stopping)
                return;
            stopping = true;
            if (hasActiveBrowser())
                tell('No new orders will start. Keep this terminal open while finishing the R3 form; the companion will exit after you close its browser.');
        },
        async run() {
            await client.connect();
            tell('Windows companion connected. Keep this terminal open while using Appraisal Desk.');
            let lastProblem;
            while (true) {
                const currentView = getCurrentView();
                const stage = currentView && `${currentCloudId}:${currentView.status}`;
                if (currentView && stage !== lastStage) {
                    tell(stageMessages[currentView.status]);
                    lastStage = stage;
                }
                const finished = stopping && !hasActiveBrowser();
                let exchanged = false;
                if (!connectionEnded) {
                    try {
                        await client.exchangeOnce();
                        exchanged = true;
                        if (lastProblem)
                            tell('Website connection restored. Existing local preparation was not restarted.');
                        lastProblem = undefined;
                    }
                    catch (error) {
                        const safe = error instanceof CompanionConnectionError ? error : new CompanionConnectionError('connection');
                        if (safe.problem !== lastProblem)
                            tell(safe.message);
                        lastProblem = safe.problem;
                        if (!['connection', 'busy'].includes(safe.problem)) {
                            connectionEnded = true;
                            stopping = true;
                            token = undefined;
                        }
                    }
                }
                if ((finished && exchanged && !declinedCloudId) || (connectionEnded && !hasActiveBrowser()))
                    return;
                await delay(pollIntervalMs);
            }
        },
    };
    return client;
}
//# sourceMappingURL=companion-client.js.map