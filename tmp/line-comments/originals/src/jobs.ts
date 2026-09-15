import { fork, type ChildProcess, type ForkOptions } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { JobPayload, JobView, WorkerUpdate } from './domain.js';
import { AppError } from './errors.js';
import { createPausableTimeout } from './pausable-timeout.js';

export interface JobRunner { create(owner: string, payload: JobPayload): JobView; get(owner: string, id: string): JobView | undefined; getActive?(owner: string): JobView | undefined; shutdown(): void }
interface JobRecord { readonly owner: string; view: JobView; readonly createdAt: number }

export function workerEnvironment(): NodeJS.ProcessEnv {
  const allowed = new Set(['SYSTEMROOT', 'WINDIR', 'PATH', 'PATHEXT', 'COMSPEC', 'TEMP', 'TMP', 'LOCALAPPDATA', 'APPDATA', 'USERPROFILE', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'PLAYWRIGHT_BROWSERS_PATH']);
  return { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toUpperCase()))), LANGSMITH_TRACING: 'false', LANGCHAIN_TRACING_V2: 'false', LANGCHAIN_TRACING: 'false' };
}

export function createJobRunner(): JobRunner {
  const jobs = new Map<string, JobRecord>();
  let active: ChildProcess | undefined;
  return {
    create(owner, payload) {
      if (active) throw new AppError('JOB_ACTIVE', 'Close the current appraisal browser before starting another preparation.', 409);
      for (const [id, record] of jobs) if (Date.now() - record.createdAt > 86400000) jobs.delete(id);
      while (jobs.size >= 100) { const key = jobs.keys().next().value; if (key) jobs.delete(key); }
      const id = randomUUID();
      const record: JobRecord = { owner, createdAt: Date.now(), view: { id, status: 'queued', message: 'Your documents are queued for preparation.' } };
      const isTypeScript = import.meta.url.endsWith('.ts');
      const workerOptions: ForkOptions & { windowsHide: boolean } = {
        execArgv: isTypeScript ? ['--import', 'tsx'] : [], env: workerEnvironment(), serialization: 'advanced', windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      };
      const child = fork(fileURLToPath(new URL(isTypeScript ? './worker.ts' : './worker.js', import.meta.url)), [], workerOptions);
      active = child;
      jobs.set(id, record);
      const timeout = createPausableTimeout(() => {
        record.view = { id, status: 'preparing', message: 'The preparation time limit was reached. Stopping automation and keeping the R3 browser open for your review.' };
        // Killing the worker also destroys its partially filled Chromium window.
        // Cancel automation while retaining the browser and active slot for the user.
        child.send({ type: 'stop_preparation' }, (error) => {
          if (error && active === child && record.view.status === 'preparing') {
            record.view = { id, status: 'preparing', message: 'Could not contact the preparation worker. Check the open R3 browser and close it when finished.' };
          }
        });
      }, 12 * 60 * 1000);
      child.on('message', (message: WorkerUpdate) => {
        if (message?.type !== 'status') return;
        record.view = { id, status: message.status, message: message.message, warnings: message.warnings };
        if (message.status === 'awaiting_login') timeout.pause();
        else if (message.status === 'preparing') timeout.resume();
        else if (['awaiting_review', 'failed', 'browser_closed'].includes(message.status)) timeout.clear();
      });
      child.on('error', () => { record.view = { id, status: 'failed', message: 'The Windows preparation worker could not start.' }; });
      child.on('close', () => {
        timeout.clear();
        if (active === child) active = undefined;
        if (!['failed', 'browser_closed'].includes(record.view.status)) record.view = { id, status: 'failed', message: 'The preparation worker stopped unexpectedly. No automatic submission was performed.' };
      });
      child.send(payload, (error) => {
        payload.urla.buffer.fill(0);
        payload.salesContract?.buffer.fill(0);
        if (error) { record.view = { id, status: 'failed', message: 'The preparation worker could not receive the documents.' }; child.kill(); }
      });
      return record.view;
    },
    get(owner, id) { const record = jobs.get(id); return record?.owner === owner ? record.view : undefined; },
    getActive(owner) { return [...jobs.values()].find(record => record.owner === owner && !['failed', 'browser_closed'].includes(record.view.status))?.view; },
    shutdown() { active?.kill(); active = undefined; jobs.clear(); },
  };
}
