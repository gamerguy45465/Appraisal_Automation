import { EventEmitter } from 'node:events';
import { fork, type ChildProcess } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJobRunner, type JobRunner } from '../src/jobs.js';
import { DEFAULT_MODEL, type JobPayload, type WorkerCommand, type WorkerMessage, type JobStatus } from '../src/domain.js';
import type { AzureBrowserConnection } from '../src/azure-browser.js';
import type { HumanBrowserFrame } from '../src/browser/human-view.js';

vi.mock('node:child_process', () => ({ fork: vi.fn() }));

class Child extends EventEmitter {
  connected = true;
  commands: WorkerCommand[] = [];
  transfers = new Map<string, (error: Error | null) => void>();
  readonly kill = vi.fn(() => true);
  readonly disconnect = vi.fn(() => { this.connected = false; });
  throwConnectionSend = false;
  send(command: WorkerCommand, callback: (error: Error | null) => void): boolean {
    if (this.throwConnectionSend && command.type === 'browser_connection' && command.connection) throw new Error('synthetic private transport');
    this.commands.push(structuredClone(command));
    if (command.type === 'prepare') this.transfers.set(command.jobId, callback);
    else callback(null);
    return true;
  }
  message(message: WorkerMessage): void { this.emit('message', message); }
  status(jobId: string, status: JobStatus): void { this.message({ type: 'status', jobId, status, message: `Synthetic ${status}` }); }
  ready(jobId: string): void { this.message({ type: 'ready', jobId, browserOpen: true }); }
  rpc(): Extract<WorkerCommand, { type: 'human_browser' }> {
    const command = this.commands.findLast(item => item.type === 'human_browser');
    if (!command || command.type !== 'human_browser') throw new Error('No viewer request');
    return command;
  }
}

function payload(): JobPayload {
  return { input: { provider: 'openai', model: DEFAULT_MODEL, apiKey: 'synthetic-provider', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'synthetic.pdf', buffer: Buffer.from('%PDF synthetic') } };
}
const frame = (canControl = true): HumanBrowserFrame => ({ image: 'c3ludGhldGlj', width: 1440, height: 1000, phase: 'review', canControl, pages: [] });
const connection = (): AzureBrowserConnection => ({ wsEndpoint: 'wss://synthetic.invalid/browser', headers: { Authorization: 'Bearer synthetic-private-token' }, timeout: 30000 });
const requestId = '00000000-0000-4000-8000-000000000001';
async function flush(): Promise<void> { for (let i = 0; i < 8; i++) await Promise.resolve(); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }

describe('cloud worker parent IPC boundaries', () => {
  let runner: JobRunner;
  let children: Child[];
  beforeEach(() => {
    vi.useFakeTimers();
    children = [];
    vi.mocked(fork).mockReset().mockImplementation(() => {
      const child = new Child(); children.push(child); return child as unknown as ChildProcess;
    });
    runner = createJobRunner({ connectBrowser: async () => connection() });
  });
  afterEach(() => { runner.shutdown(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

  it('isolates viewer access by owner, job, request, and current input phase', async () => {
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.transfers.get(job.id)!(null);
    runner.endOwner!('other-owner');
    await expect(runner.browserFrame!('other-owner', job.id)).rejects.toMatchObject({ code: 'BROWSER_UNAVAILABLE' });
    await expect(runner.browserInput!('owner', job.id, { type: 'key', key: 'Enter' })).rejects.toMatchObject({ code: 'BROWSER_LOCKED' });
    expect(child.commands.filter(command => command.type === 'human_browser')).toHaveLength(0);
    child.status(job.id, 'awaiting_login');
    const result = runner.browserFrame!('owner', job.id); const request = child.rpc();
    await expect(runner.browserFrame!('owner', job.id)).rejects.toMatchObject({ code: 'BROWSER_BUSY' });
    let settled = false; void result.then(() => { settled = true; });
    child.message({ type: 'human_browser_result', jobId: 'wrong-job', requestId: request.requestId, frame: frame() });
    await flush(); expect(settled).toBe(false);
    child.status(job.id, 'preparing');
    child.message({ type: 'human_browser_result', jobId: job.id, requestId: request.requestId, frame: frame() });
    expect(await result).toMatchObject({ canControl: false });
    expect(JSON.stringify(runner.get('owner', job.id))).not.toContain('c3ludGhldGlj');
  });

  it('rejects old pending frames on successor creation and ignores late old results', async () => {
    const first = runner.create('owner', payload()); const child = children[0]!;
    child.transfers.get(first.id)!(null); child.status(first.id, 'awaiting_review'); child.ready(first.id);
    const oldFrame = runner.browserFrame!('owner', first.id).catch(error => error); const old = child.rpc();
    const next = runner.create('owner', payload()); child.transfers.get(next.id)!(null);
    expect(await oldFrame).toMatchObject({ code: 'BROWSER_UNAVAILABLE' });
    child.message({ type: 'human_browser_result', jobId: first.id, requestId: old.requestId, frame: frame() });
    await expect(runner.browserFrame!('owner', first.id)).rejects.toMatchObject({ code: 'BROWSER_UNAVAILABLE' });
    expect(runner.getActive!('owner')).toMatchObject({ id: next.id, status: 'queued' });
    child.status(next.id, 'awaiting_login');
    const current = runner.browserFrame!('owner', next.id); const currentRequest = child.rpc();
    child.message({ type: 'human_browser_result', jobId: next.id, requestId: currentRequest.requestId, frame: frame() });
    expect(await current).toEqual(frame());
  });

  it('bounds outstanding human requests and rejects every pending operation on cloud disconnect', async () => {
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.status(job.id, 'awaiting_login');
    const pending = Array.from({ length: 32 }, () => runner.browserInput!('owner', job.id, { type: 'text', text: 'synthetic' }).catch(error => error));
    await expect(runner.browserInput!('owner', job.id, { type: 'key', key: 'Tab' })).rejects.toMatchObject({ code: 'BROWSER_BUSY' });
    runner.shutdown();
    expect(child.disconnect).toHaveBeenCalledOnce(); expect(child.kill).not.toHaveBeenCalled();
    expect((await Promise.all(pending)).every(error => error.code === 'BROWSER_UNAVAILABLE')).toBe(true);
    expect(runner.getActive!('owner')).toBeUndefined();
  });

  it('prioritizes owner logout closure even when ordinary viewer requests fill the queue', async () => {
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.status(job.id, 'awaiting_login');
    const pending = Array.from({ length: 32 }, () => runner.browserInput!('owner', job.id, { type: 'text', text: 'synthetic' }).catch(error => error));
    runner.endOwner!('owner'); await flush();
    expect(child.rpc().operation).toBe('close');
    const closings = Array.from({ length: 5 }, () => runner.closeBrowser!('owner', job.id));
    expect(child.commands.filter(command => command.type === 'human_browser' && command.operation === 'close')).toHaveLength(1);
    child.status(job.id, 'browser_closed'); await Promise.all([...pending, ...closings]);
    expect(runner.getActive!('owner')).toBeUndefined();
  });

  it('times out a missing IPC response and closes the cloud session at its bounded lifetime', async () => {
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.status(job.id, 'awaiting_review'); child.ready(job.id);
    const request = runner.browserFrame!('owner', job.id).catch(error => error);
    await vi.advanceTimersByTimeAsync(15000);
    expect(await request).toMatchObject({ code: 'BROWSER_UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(86400000 - 15000);
    const close = child.rpc(); expect(close.operation).toBe('close');
    child.message({ type: 'human_browser_result', jobId: job.id, requestId: close.requestId });
    await flush(); expect(child.kill).toHaveBeenCalledOnce();
  });

  it('passes a connection only through private IPC and never inherits identity credentials into the worker environment', async () => {
    for (const key of ['IDENTITY_ENDPOINT', 'IDENTITY_HEADER', 'AZURE_CLIENT_ID', 'MSI_ENDPOINT', 'MSI_SECRET']) vi.stubEnv(key, 'synthetic-do-not-inherit');
    const auth = connection(); const connect = vi.fn(async () => auth);
    runner.shutdown(); runner = createJobRunner({ connectBrowser: connect });
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.message({ type: 'browser_connection_request', jobId: job.id, requestId });
    child.message({ type: 'browser_connection_request', jobId: job.id, requestId });
    await flush(); expect(connect).toHaveBeenCalledOnce();
    const sent = child.commands.find(command => command.type === 'browser_connection');
    expect(sent).toMatchObject({ type: 'browser_connection', jobId: job.id, connection: { headers: { Authorization: 'Bearer synthetic-private-token' } } });
    expect(auth.headers).toEqual({});
    expect(JSON.stringify(runner.get('owner', job.id))).not.toContain('synthetic-private-token');
    const env = vi.mocked(fork).mock.calls.at(-1)![2]!.env!;
    for (const key of ['IDENTITY_ENDPOINT', 'IDENTITY_HEADER', 'AZURE_CLIENT_ID', 'MSI_ENDPOINT', 'MSI_SECRET']) expect(env[key]).toBeUndefined();
  });

  it('erases a late connection that arrives after the requesting worker exits', async () => {
    const waiting = deferred<AzureBrowserConnection>(); const auth = connection();
    runner.shutdown(); runner = createJobRunner({ connectBrowser: () => waiting.promise });
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.message({ type: 'browser_connection_request', jobId: job.id, requestId });
    child.emit('close', 0, null); waiting.resolve(auth); await flush();
    expect(child.commands.some(command => command.type === 'browser_connection')).toBe(false);
    expect(auth.headers).toEqual({});
  });

  it('erases private connection headers when IPC send throws synchronously', async () => {
    const auth = connection();
    runner.shutdown(); runner = createJobRunner({ connectBrowser: async () => auth });
    const job = runner.create('owner', payload()); const child = children[0]!;
    child.throwConnectionSend = true;
    child.message({ type: 'browser_connection_request', jobId: job.id, requestId }); await flush();
    expect(auth.headers).toEqual({});
    expect(JSON.stringify(runner.get('owner', job.id))).not.toContain('synthetic-private-token');
  });

  it('keeps the retained cloud browser view reachable after successor transfer fails', async () => {
    const first = runner.create('owner', payload()); const child = children[0]!;
    child.transfers.get(first.id)!(null); child.status(first.id, 'awaiting_review'); child.ready(first.id);
    const next = runner.create('owner', payload()); child.transfers.get(next.id)!(new Error('synthetic transfer failure'));
    expect(child.kill).not.toHaveBeenCalled();
    const pending = runner.browserFrame!('owner', next.id).catch(error => error); const request = child.rpc();
    // The unsent successor never changed the worker's generation; it still owns the predecessor.
    child.message({ type: 'human_browser_result', jobId: first.id, requestId: request.requestId, frame: frame() });
    await vi.advanceTimersByTimeAsync(15000);
    expect(await pending).toEqual(frame());
    expect(request.jobId).toBe(first.id);
    expect(runner.get('owner', next.id)?.canStartAnother).toBe(false);
    const input = runner.browserInput!('owner', next.id, { type: 'key', key: 'Tab' }); const inputRequest = child.rpc();
    expect(inputRequest.jobId).toBe(first.id);
    child.message({ type: 'human_browser_result', jobId: first.id, requestId: inputRequest.requestId });
    await input;
    const closing = runner.closeBrowser!('owner', next.id);
    const closingRequest = child.rpc(); expect(closingRequest.jobId).toBe(first.id);
    // Closure status can arrive before its explicit RPC acknowledgement.
    child.status(first.id, 'browser_closed'); await closing;
    expect(runner.getActive!('owner')).toBeUndefined();
  });
});
