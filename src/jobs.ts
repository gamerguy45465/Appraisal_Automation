import { fork, type ChildProcess, type ForkOptions } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { JobPayload, JobView, WorkerCommand, WorkerMessage } from './domain.js';
import { AppError } from './errors.js';
import { createPausableTimeout } from './pausable-timeout.js';

export interface JobRunner {
  create(owner: string, payload: JobPayload): JobView;
  get(owner: string, id: string): JobView | undefined;
  getActive?(owner: string): JobView | undefined;
  shutdown(): void;
}
interface JobRecord { readonly owner: string; view: JobView; readonly createdAt: number }
interface WorkerHost {
  readonly child: ChildProcess;
  readonly owner: string;
  jobId: string;
  ready: boolean;
  retired: boolean;
  ended: boolean;
  previousJobId?: string;
  transferFailed?: boolean;
  timeout?: ReturnType<typeof createPausableTimeout>;
  reapTimer?: ReturnType<typeof setTimeout>;
}

export function workerEnvironment(): NodeJS.ProcessEnv {
  const allowed = new Set(['SYSTEMROOT', 'WINDIR', 'PATH', 'PATHEXT', 'COMSPEC', 'TEMP', 'TMP', 'LOCALAPPDATA', 'APPDATA', 'USERPROFILE', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'PLAYWRIGHT_BROWSERS_PATH']);
  return { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toUpperCase()))), LANGSMITH_TRACING: 'false', LANGCHAIN_TRACING_V2: 'false', LANGCHAIN_TRACING: 'false' };
}

export function createJobRunner(): JobRunner {
  const jobs = new Map<string, JobRecord>();
  const hosts = new Set<WorkerHost>();
  let current: WorkerHost | undefined;

  const stopTimer = (host: WorkerHost): void => { host.timeout?.clear(); host.timeout = undefined; };
  const reap = (host: WorkerHost): void => {
    clearTimeout(host.reapTimer);
    host.reapTimer = undefined;
    if (!host.ended) host.child.kill();
  };
  // The browser is already closed; a lingering transport must not retain the next-job lock.
  const retire = (host: WorkerHost): void => {
    if (host.retired) return;
    host.retired = true;
    stopTimer(host);
    if (current === host) current = undefined;
    host.reapTimer = setTimeout(() => reap(host), 5000);
    host.reapTimer.unref();
  };

  const startHost = (owner: string, jobId: string): WorkerHost => {
    const isTypeScript = import.meta.url.endsWith('.ts');
    const workerOptions: ForkOptions & { windowsHide: boolean } = {
      execArgv: isTypeScript ? ['--import', 'tsx'] : [], env: workerEnvironment(), serialization: 'advanced', windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    };
    const child = fork(fileURLToPath(new URL(isTypeScript ? './worker.ts' : './worker.js', import.meta.url)), [], workerOptions);
    const host: WorkerHost = { child, owner, jobId, ready: false, retired: false, ended: false };
    hosts.add(host);
    child.on('message', (message: WorkerMessage) => {
      if (!message) return;
      if (message.jobId !== host.jobId) {
        // If transfer failed before the next command arrived, the retained browser still reports its previous job ID.
        if (host.transferFailed && message.jobId === host.previousJobId && message.type === 'status' && message.status === 'browser_closed') {
          const record = jobs.get(host.jobId);
          if (record) record.view = { ...record.view, canStartAnother: true };
          retire(host);
        }
        return;
      }
      if (host.retired) {
        if (message.type === 'ready') reap(host);
        return;
      }
      if (host.ended || current !== host) return;
      const record = jobs.get(host.jobId);
      if (!record) return;
      if (message.type === 'ready') {
        stopTimer(host);
        host.ready = true;
        record.view = { ...record.view, canStartAnother: true };
        if (!message.browserOpen) { retire(host); reap(host); }
        return;
      }
      if (message.type !== 'status') return;
      record.view = { id: host.jobId, status: message.status, message: message.message, warnings: message.warnings, canStartAnother: host.ready };
      if (message.status === 'awaiting_login') host.timeout?.pause();
      else if (message.status === 'preparing') host.timeout?.resume();
      else if (['awaiting_review', 'failed', 'browser_closed'].includes(message.status)) stopTimer(host);
      if (message.status === 'browser_closed') retire(host);
    });
    child.on('error', () => {
      if (host.retired || host.ended || current !== host) return;
      const record = jobs.get(host.jobId);
      if (record) record.view = { id: host.jobId, status: 'failed', message: 'The Windows preparation worker could not start.', canStartAnother: false };
    });
    child.on('close', () => {
      host.ended = true;
      stopTimer(host);
      clearTimeout(host.reapTimer);
      hosts.delete(host);
      if (current === host) current = undefined;
      const record = jobs.get(host.jobId);
      if (record && !host.retired && !['failed', 'browser_closed'].includes(record.view.status)) {
        record.view = { id: host.jobId, status: 'failed', message: 'The preparation worker stopped unexpectedly. No automatic submission was performed.', canStartAnother: true };
      }
      else if (record) record.view = { ...record.view, canStartAnother: true };
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
      for (const [id, record] of jobs) if (Date.now() - record.createdAt > 86400000 && id !== current?.jobId) jobs.delete(id);
      while (jobs.size >= 100) {
        const key = [...jobs.keys()].find(id => id !== current?.jobId);
        if (!key) break;
        jobs.delete(key);
      }
      const id = randomUUID();
      const record: JobRecord = { owner, createdAt: Date.now(), view: { id, status: 'queued', message: 'Your documents are queued for preparation.', canStartAnother: false } };
      const reused = Boolean(current);
      const host = current ?? startHost(owner, id);
      current = host;
      host.previousJobId = reused ? host.jobId : undefined;
      host.transferFailed = false;
      host.jobId = id;
      host.ready = false;
      jobs.set(id, record);
      stopTimer(host);
      host.timeout = createPausableTimeout(() => {
        if (current !== host || host.retired || host.jobId !== id || host.ready) return;
        record.view = { id, status: 'preparing', message: 'The preparation time limit was reached. Stopping automation and keeping the R3 browser open for your review.', canStartAnother: false };
        const command: WorkerCommand = { type: 'stop_preparation', jobId: id };
        const stopped = (error: Error | null): void => {
          if (error && current === host && host.jobId === id && !host.retired && record.view.status === 'preparing') {
            record.view = { ...record.view, message: 'Could not contact the preparation worker. Check the open R3 browser and close it when finished.' };
          }
        };
        try { host.child.send(command, stopped); } catch { stopped(new Error('IPC unavailable')); }
      }, 12 * 60 * 1000);
      const command: WorkerCommand = { type: 'prepare', jobId: id, payload };
      const transferred = (error: Error | null): void => {
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
        if (error && current === host && host.jobId === id && !host.retired) {
          stopTimer(host);
          host.transferFailed = true;
          record.view = { id, status: 'failed', message: reused
            ? 'The next documents could not be transferred. The current R3 review form remains open. Close that browser before trying again.'
            : 'The preparation worker could not receive the documents.', canStartAnother: false };
          if (!reused) host.child.kill();
        }
      };
      try { host.child.send(command, transferred); } catch { transferred(new Error('IPC unavailable')); }
      return record.view;
    },
    get(owner, id) { const record = jobs.get(id); return record?.owner === owner ? record.view : undefined; },
    getActive(owner) { return current?.owner === owner ? jobs.get(current.jobId)?.view : undefined; },
    shutdown() {
      for (const host of hosts) { stopTimer(host); clearTimeout(host.reapTimer); if (!host.ended) host.child.kill(); }
      hosts.clear(); current = undefined; jobs.clear();
    },
  };
}
