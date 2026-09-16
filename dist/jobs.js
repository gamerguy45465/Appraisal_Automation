import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AppError } from './errors.js';
import { createPausableTimeout } from './pausable-timeout.js';
export function workerEnvironment() {
    const allowed = new Set(['SYSTEMROOT', 'WINDIR', 'PATH', 'PATHEXT', 'COMSPEC', 'TEMP', 'TMP', 'LOCALAPPDATA', 'APPDATA', 'USERPROFILE', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'PLAYWRIGHT_BROWSERS_PATH']);
    return { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toUpperCase()))), LANGSMITH_TRACING: 'false', LANGCHAIN_TRACING_V2: 'false', LANGCHAIN_TRACING: 'false' };
}
export function createJobRunner(options = {}) {
    const jobs = new Map();
    const hosts = new Set();
    let current;
    const pending = new Map();
    const unavailable = (status = 409) => new AppError('BROWSER_UNAVAILABLE', 'The cloud browser is not available. Check the order status before starting again.', status);
    const rejectPending = (host) => {
        for (const [id, request] of pending)
            if (request.host === host) {
                clearTimeout(request.timer);
                pending.delete(id);
                if (request.operation === 'close')
                    request.resolve();
                else
                    request.reject(unavailable(410));
            }
    };
    const canControl = (host) => {
        if (host.closeRequest)
            return false;
        const status = jobs.get(host.jobId)?.view.status;
        return status === 'awaiting_login' || status === 'awaiting_review' || status === 'user_submitted' || (status === 'failed' && (host.ready || host.transferFailed === true));
    };
    const humanRequest = (owner, jobId, operation, action) => {
        const host = current;
        if (!options.connectBrowser || !host || host.owner !== owner || host.jobId !== jobId || host.retired || host.ended)
            return Promise.reject(unavailable(410));
        if (operation === 'close' && host.closeRequest)
            return host.closeRequest;
        if (operation === 'input' && !canControl(host))
            return Promise.reject(new AppError('BROWSER_LOCKED', 'Browser control is paused while the order is being prepared.', 409));
        if (operation !== 'close' && (pending.size >= 32 || (operation === 'frame' && [...pending.values()].some(r => r.host === host && r.operation === 'frame'))))
            return Promise.reject(new AppError('BROWSER_BUSY', 'Wait for the current browser operation to finish.', 429));
        const result = new Promise((resolve, reject) => {
            const requestId = randomUUID();
            const timer = setTimeout(() => { pending.delete(requestId); reject(unavailable()); }, 15000);
            timer.unref();
            const workerJobId = host.transferFailed && host.previousJobId ? host.previousJobId : jobId;
            pending.set(requestId, { host, jobId, workerJobId, operation, timer, resolve, reject });
            try {
                host.child.send({ type: 'human_browser', jobId: workerJobId, requestId, operation, ...(action ? { action } : {}) }, error => {
                    if (!error)
                        return;
                    const request = pending.get(requestId);
                    if (request) {
                        clearTimeout(request.timer);
                        pending.delete(requestId);
                        reject(unavailable());
                    }
                });
            }
            catch {
                clearTimeout(timer);
                pending.delete(requestId);
                reject(unavailable());
            }
        });
        if (operation === 'close') {
            host.closeRequest = result;
            void result.then(() => { host.closeRequest = undefined; }, () => { host.closeRequest = undefined; });
        }
        return result;
    };
    const stopTimer = (host) => { host.timeout?.clear(); host.timeout = undefined; };
    const reap = (host) => {
        clearTimeout(host.reapTimer);
        host.reapTimer = undefined;
        if (!host.ended)
            host.child.kill();
    };
    // The browser is already closed; a lingering transport must not retain the next-job lock.
    const retire = (host) => {
        if (host.retired)
            return;
        host.retired = true;
        stopTimer(host);
        clearTimeout(host.lifetimeTimer);
        rejectPending(host);
        if (current === host)
            current = undefined;
        host.reapTimer = setTimeout(() => reap(host), 5000);
        host.reapTimer.unref();
    };
    const startHost = (owner, jobId) => {
        const isTypeScript = import.meta.url.endsWith('.ts');
        const workerOptions = {
            execArgv: isTypeScript ? ['--import', 'tsx'] : [], env: workerEnvironment(), serialization: 'advanced', windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        };
        const child = fork(fileURLToPath(new URL(isTypeScript ? './worker.ts' : './worker.js', import.meta.url)), [], workerOptions);
        const host = { child, owner, jobId, ready: false, retired: false, ended: false };
        hosts.add(host);
        if (options.connectBrowser) {
            host.lifetimeTimer = setTimeout(() => {
                void humanRequest(host.owner, host.jobId, 'close').catch(() => undefined).finally(() => { if (!host.ended)
                    host.child.kill(); });
            }, 86400000);
            host.lifetimeTimer.unref();
        }
        child.on('message', (message) => {
            if (!message)
                return;
            if (message.type === 'human_browser_result') {
                const request = pending.get(message.requestId);
                if (!request || request.host !== host || request.workerJobId !== message.jobId)
                    return;
                clearTimeout(request.timer);
                pending.delete(message.requestId);
                if (host.retired || host.ended || current !== host || host.jobId !== request.jobId || message.error) {
                    request.reject(message.error === 'locked' ? new AppError('BROWSER_LOCKED', 'Browser control is paused while the order is being prepared.', 409) : unavailable());
                }
                else
                    request.resolve(message.frame ? { ...message.frame, canControl: message.frame.canControl && canControl(host) } : undefined);
                return;
            }
            if (message.type === 'browser_connection_request') {
                if (!options.connectBrowser || current !== host || host.retired || host.ended || host.jobId !== message.jobId || host.connecting || !/^[0-9a-f-]{36}$/.test(message.requestId))
                    return;
                host.connecting = true;
                void options.connectBrowser().then(connection => {
                    const clear = () => { for (const key of Object.keys(connection.headers))
                        delete connection.headers[key]; };
                    if (current !== host || host.retired || host.ended || host.jobId !== message.jobId) {
                        clear();
                        return;
                    }
                    try {
                        child.send({ type: 'browser_connection', jobId: message.jobId, requestId: message.requestId, connection }, clear);
                    }
                    catch (error) {
                        clear();
                        throw error;
                    }
                }).catch(() => {
                    if (!host.ended && host.jobId === message.jobId) {
                        try {
                            child.send({ type: 'browser_connection', jobId: message.jobId, requestId: message.requestId }, () => undefined);
                        }
                        catch { /* The worker is already gone. */ }
                    }
                }).finally(() => { host.connecting = false; });
                return;
            }
            if (message.jobId !== host.jobId) {
                // If transfer failed before the next command arrived, the retained browser still reports its previous job ID.
                if (host.transferFailed && message.jobId === host.previousJobId && message.type === 'status' && message.status === 'browser_closed') {
                    const record = jobs.get(host.jobId);
                    if (record)
                        record.view = { ...record.view, canStartAnother: true };
                    retire(host);
                }
                return;
            }
            if (host.retired) {
                if (message.type === 'ready')
                    reap(host);
                return;
            }
            if (host.ended || current !== host)
                return;
            const record = jobs.get(host.jobId);
            if (!record)
                return;
            if (message.type === 'ready') {
                stopTimer(host);
                host.ready = true;
                record.view = { ...record.view, canStartAnother: true };
                if (!message.browserOpen) {
                    retire(host);
                    reap(host);
                }
                return;
            }
            if (message.type !== 'status')
                return;
            record.view = { id: host.jobId, status: message.status, message: message.message, warnings: message.warnings, canStartAnother: host.ready };
            if (message.status === 'awaiting_login')
                host.timeout?.pause();
            else if (message.status === 'preparing')
                host.timeout?.resume();
            else if (['awaiting_review', 'failed', 'browser_closed'].includes(message.status))
                stopTimer(host);
            if (message.status === 'browser_closed')
                retire(host);
        });
        child.on('error', () => {
            if (host.retired || host.ended || current !== host)
                return;
            const record = jobs.get(host.jobId);
            if (record)
                record.view = { id: host.jobId, status: 'failed', message: 'The Windows preparation worker could not start.', canStartAnother: false };
        });
        child.on('close', () => {
            host.ended = true;
            clearTimeout(host.lifetimeTimer);
            rejectPending(host);
            stopTimer(host);
            clearTimeout(host.reapTimer);
            hosts.delete(host);
            if (current === host)
                current = undefined;
            const record = jobs.get(host.jobId);
            if (record && !host.retired && !['failed', 'browser_closed'].includes(record.view.status)) {
                record.view = { id: host.jobId, status: 'failed', message: 'The preparation worker stopped unexpectedly. No automatic submission was performed.', canStartAnother: true };
            }
            else if (record)
                record.view = { ...record.view, canStartAnother: true };
        });
        return host;
    };
    return {
        create(owner, payload) {
            if (current && (!current.ready || current.owner !== owner)) {
                throw new AppError('JOB_ACTIVE', current.ready
                    ? 'The open R3 browser belongs to another local session. Close it before starting here.'
                    : 'Wait until preparation and cleanup finish before starting another appraisal.', 409);
            }
            for (const [id, record] of jobs)
                if (Date.now() - record.createdAt > 86400000 && id !== current?.jobId)
                    jobs.delete(id);
            while (jobs.size >= 100) {
                const key = [...jobs.keys()].find(id => id !== current?.jobId);
                if (!key)
                    break;
                jobs.delete(key);
            }
            const id = randomUUID();
            const record = { owner, createdAt: Date.now(), view: { id, status: 'queued', message: 'Your documents are queued for preparation.', canStartAnother: false } };
            const reused = Boolean(current);
            const host = current ?? startHost(owner, id);
            current = host;
            host.previousJobId = reused ? host.jobId : undefined;
            host.transferFailed = false;
            host.jobId = id;
            rejectPending(host);
            host.ready = false;
            jobs.set(id, record);
            stopTimer(host);
            host.timeout = createPausableTimeout(() => {
                if (current !== host || host.retired || host.jobId !== id || host.ready)
                    return;
                record.view = { id, status: 'preparing', message: 'The preparation time limit was reached. Stopping automation and keeping the R3 browser open for your review.', canStartAnother: false };
                const command = { type: 'stop_preparation', jobId: id };
                const stopped = (error) => {
                    if (error && current === host && host.jobId === id && !host.retired && record.view.status === 'preparing') {
                        record.view = { ...record.view, message: 'Could not contact the preparation worker. Check the open R3 browser and close it when finished.' };
                    }
                };
                try {
                    host.child.send(command, stopped);
                }
                catch {
                    stopped(new Error('IPC unavailable'));
                }
            }, 12 * 60 * 1000);
            const command = { type: 'prepare', jobId: id, payload, ...(options.connectBrowser ? { cloudBrowser: true } : {}) };
            const transferred = (error) => {
                payload.urla.buffer.fill(0);
                payload.salesContract?.buffer.fill(0);
                payload.input.apiKey = '';
                if (error && current === host && host.jobId === id && !host.retired) {
                    stopTimer(host);
                    host.transferFailed = true;
                    record.view = { id, status: 'failed', message: reused
                            ? 'The next documents could not be transferred. The current R3 review form remains open. Close that browser before trying again.'
                            : 'The preparation worker could not receive the documents.', canStartAnother: false };
                    if (!reused)
                        host.child.kill();
                }
            };
            try {
                host.child.send(command, transferred);
            }
            catch {
                transferred(new Error('IPC unavailable'));
            }
            return record.view;
        },
        get(owner, id) { const record = jobs.get(id); return record?.owner === owner ? record.view : undefined; },
        getActive(owner) { return current?.owner === owner ? jobs.get(current.jobId)?.view : undefined; },
        ...(options.connectBrowser ? {
            async browserFrame(owner, id) { const frame = await humanRequest(owner, id, 'frame'); if (!frame)
                throw unavailable(); return frame; },
            async browserInput(owner, id, action) { await humanRequest(owner, id, 'input', action); },
            async closeBrowser(owner, id) { await humanRequest(owner, id, 'close'); },
            endOwner(owner) { if (current?.owner === owner)
                void humanRequest(owner, current.jobId, 'close').catch(() => undefined); },
        } : {}),
        shutdown() {
            for (const host of hosts) {
                stopTimer(host);
                clearTimeout(host.reapTimer);
                clearTimeout(host.lifetimeTimer);
                rejectPending(host);
                if (!host.ended) {
                    if (options.connectBrowser && host.child.connected)
                        host.child.disconnect();
                    else
                        host.child.kill();
                }
            }
            hosts.clear();
            current = undefined;
            jobs.clear();
        },
    };
}
//# sourceMappingURL=jobs.js.map