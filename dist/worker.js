import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import { runPreparation } from './preparation.js';
import { AppError } from './errors.js';
import { validateHumanBrowserAction } from './browser/human-view.js';
/** One owner keeps the browser; each preparation receives fresh private state and cancellation. */
export function createWorkerHandler(send) {
    let active;
    let retainedSession;
    let latestJobId;
    let stopping = false;
    let closeRequested = false;
    let cloudBrowser = false;
    let viewerSession;
    let currentStatus = 'queued';
    let humanPending = 0;
    const connections = new Map();
    const connectionError = () => new AppError('AZURE_BROWSER_CONNECTION', 'The Azure browser could not connect. Check the workspace endpoint and managed identity permissions.', 503);
    const connectBrowser = async (jobId) => {
        const connection = await new Promise((resolve, reject) => {
            const requestId = randomUUID();
            const timer = setTimeout(() => { connections.delete(requestId); reject(connectionError()); }, 45000);
            timer.unref();
            connections.set(requestId, { jobId, timer, resolve, reject });
            send({ type: 'browser_connection_request', jobId, requestId });
        });
        try {
            if (stopping || closeRequested || latestJobId !== jobId || active?.controller.signal.aborted)
                throw connectionError();
            const browser = await chromium.connect(connection.wsEndpoint, { headers: connection.headers, timeout: connection.timeout, exposeNetwork: '' });
            if (stopping || closeRequested || latestJobId !== jobId || active?.controller.signal.aborted) {
                await browser.close().catch(() => undefined);
                throw connectionError();
            }
            return browser;
        }
        catch {
            throw connectionError();
        }
        finally {
            for (const key of Object.keys(connection.headers))
                delete connection.headers[key];
        }
    };
    const closeConnections = () => {
        for (const request of connections.values()) {
            clearTimeout(request.timer);
            request.reject(connectionError());
        }
        connections.clear();
    };
    // The retained browser callback captures its ID, never an old payload or provider credential.
    const statusFor = (jobId) => (update) => { if (latestJobId === jobId)
        currentStatus = update.status; send({ ...update, jobId }); };
    const observeClosure = (session, jobId) => {
        void session.waitUntilClosed().then(async () => {
            if (active || latestJobId !== jobId || retainedSession !== session)
                return;
            retainedSession = undefined;
            send({ type: 'status', jobId, status: 'browser_closed', message: 'The appraisal browser was closed.' });
            await session.close().catch(() => undefined);
            send({ type: 'ready', jobId, browserOpen: false });
        }).catch(() => undefined);
    };
    return {
        receive(message) {
            if (message.type === 'browser_connection') {
                const pending = connections.get(message.requestId);
                const clear = () => { if (message.connection)
                    for (const key of Object.keys(message.connection.headers))
                        delete message.connection.headers[key]; };
                if (!pending || pending.jobId !== message.jobId) {
                    clear();
                    return;
                }
                clearTimeout(pending.timer);
                connections.delete(message.requestId);
                if (message.connection && !stopping && !closeRequested && latestJobId === message.jobId)
                    pending.resolve(message.connection);
                else {
                    clear();
                    pending.reject(connectionError());
                }
                return;
            }
            if (message.type === 'human_browser') {
                const reply = (result) => send({ type: 'human_browser_result', jobId: message.jobId, requestId: message.requestId, ...result });
                if (!cloudBrowser || stopping || closeRequested || message.jobId !== latestJobId || (!viewerSession && message.operation !== 'close') || (humanPending >= 16 && message.operation !== 'close')) {
                    reply({ error: 'unavailable' });
                    return;
                }
                const session = viewerSession;
                humanPending++;
                void Promise.resolve().then(async () => {
                    if (message.jobId !== latestJobId || viewerSession !== session || stopping || closeRequested) {
                        reply({ error: 'unavailable' });
                        return;
                    }
                    if (message.operation === 'close') {
                        closeRequested = true;
                        active?.controller.abort();
                        closeConnections();
                        await session?.close();
                        reply({});
                    }
                    else if (message.operation === 'frame') {
                        if (!session?.humanView) {
                            reply({ error: 'unavailable' });
                            return;
                        }
                        const frame = await session.humanView.frame();
                        reply({ frame });
                    }
                    else if (message.operation === 'input') {
                        if (!['awaiting_login', 'awaiting_review', 'user_submitted'].includes(currentStatus) && !(currentStatus === 'failed' && !active)) {
                            reply({ error: 'locked' });
                            return;
                        }
                        if (!session?.humanView) {
                            reply({ error: 'unavailable' });
                            return;
                        }
                        await session.humanView.act(validateHumanBrowserAction(message.action));
                        reply({});
                    }
                    else
                        reply({ error: 'unavailable' });
                }).catch(error => reply({ error: error instanceof AppError && /LOCKED|PAUSED/.test(error.code) ? 'locked' : 'unavailable' })).finally(() => { humanPending--; });
                return;
            }
            if (message.type === 'stop_preparation') {
                if (active?.jobId === message.jobId)
                    active.controller.abort();
                return;
            }
            if (message.type !== 'prepare')
                return;
            if (active || stopping) {
                message.payload.urla.buffer.fill(0);
                message.payload.salesContract?.buffer.fill(0);
                message.payload.input.apiKey = '';
                return;
            }
            const { jobId, payload } = message;
            const controller = new AbortController();
            latestJobId = jobId;
            closeRequested = false;
            currentStatus = 'queued';
            cloudBrowser = message.cloudBrowser === true;
            const previousSession = retainedSession;
            viewerSession = previousSession;
            // Install the active record before preparation can invoke a status callback.
            const done = Promise.resolve().then(async () => {
                try {
                    retainedSession = await runPreparation(payload, {
                        signal: controller.signal, previousSession, retainBrowser: true, onStatus: statusFor(jobId),
                        ...(cloudBrowser ? { browserOptions: { humanView: true, connectBrowser: () => connectBrowser(jobId) }, onBrowserSession: (session) => {
                                if (latestJobId === jobId)
                                    viewerSession = session;
                                if (stopping || closeRequested)
                                    void session.close().catch(() => undefined);
                            } } : {}),
                    });
                    if (latestJobId === jobId)
                        viewerSession = retainedSession;
                }
                catch {
                    currentStatus = 'failed';
                    send({ type: 'status', jobId, status: 'failed', message: 'The preparation worker stopped unexpectedly.' });
                    if (previousSession?.isClosed())
                        retainedSession = undefined;
                }
                finally {
                    payload.urla.buffer.fill(0);
                    payload.salesContract?.buffer.fill(0);
                    payload.input.apiKey = '';
                    if (cloudBrowser && (stopping || closeRequested)) {
                        await viewerSession?.close().catch(() => undefined);
                        if (retainedSession !== viewerSession)
                            await retainedSession?.close().catch(() => undefined);
                    }
                    if (active?.jobId === jobId)
                        active = undefined;
                    const browserOpen = Boolean(retainedSession && !retainedSession.isClosed());
                    send({ type: 'ready', jobId, browserOpen });
                    if (retainedSession)
                        observeClosure(retainedSession, jobId);
                }
            });
            active = { jobId, controller, done };
        },
        async disconnected() {
            stopping = true;
            closeConnections();
            const running = active;
            running?.controller.abort();
            if (cloudBrowser)
                await viewerSession?.close().catch(() => undefined);
            await running?.done;
            // Lost IPC must not discard a human review form; its final closure releases the transport.
            const session = retainedSession;
            if (session) {
                if (cloudBrowser)
                    await session.close().catch(() => undefined);
                await session.waitUntilClosed();
                await session.close().catch(() => undefined);
            }
        },
        async shutdown() {
            stopping = true;
            closeConnections();
            const running = active;
            running?.controller.abort();
            if (cloudBrowser)
                await viewerSession?.close().catch(() => undefined);
            await retainedSession?.close().catch(() => undefined);
            await running?.done;
            await retainedSession?.close().catch(() => undefined);
            retainedSession = undefined;
        },
    };
}
if (process.send && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const worker = createWorkerHandler(message => {
        if (!process.connected)
            return;
        try {
            process.send?.(message, () => undefined);
        }
        catch { /* IPC loss leaves the review browser open. */ }
    });
    process.on('message', (message) => worker.receive(message));
    process.once('disconnect', () => { void worker.disconnected().finally(() => process.exit(0)); });
}
//# sourceMappingURL=worker.js.map