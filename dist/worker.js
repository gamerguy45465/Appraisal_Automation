import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPreparation } from './preparation.js';
/** One owner keeps the browser; each preparation receives fresh private state and cancellation. */
export function createWorkerHandler(send) {
    let active;
    let retainedSession;
    let latestJobId;
    let stopping = false;
    // The retained browser callback captures its ID, never an old payload or provider credential.
    const statusFor = (jobId) => (update) => { send({ ...update, jobId }); };
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
            const previousSession = retainedSession;
            // Install the active record before preparation can invoke a status callback.
            const done = Promise.resolve().then(async () => {
                try {
                    retainedSession = await runPreparation(payload, {
                        signal: controller.signal, previousSession, retainBrowser: true, onStatus: statusFor(jobId),
                    });
                }
                catch {
                    send({ type: 'status', jobId, status: 'failed', message: 'The preparation worker stopped unexpectedly.' });
                    if (previousSession?.isClosed())
                        retainedSession = undefined;
                }
                finally {
                    payload.urla.buffer.fill(0);
                    payload.salesContract?.buffer.fill(0);
                    payload.input.apiKey = '';
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
            const running = active;
            running?.controller.abort();
            await running?.done;
            // Lost IPC must not discard a human review form; its final closure releases the transport.
            const session = retainedSession;
            if (session) {
                await session.waitUntilClosed();
                await session.close().catch(() => undefined);
            }
        },
        async shutdown() {
            stopping = true;
            const running = active;
            running?.controller.abort();
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