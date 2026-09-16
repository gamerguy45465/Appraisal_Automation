import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { createWorkerHandler } from '../src/worker.js';
import { runPreparation } from '../src/preparation.js';
import { DEFAULT_MODEL, type JobPayload, type WorkerCommand, type WorkerMessage } from '../src/domain.js';
import type { BrowserSession } from '../src/browser/session.js';
import type { HumanBrowserFrame } from '../src/browser/human-view.js';
import type { AzureBrowserConnection } from '../src/azure-browser.js';

vi.mock('../src/preparation.js', () => ({ runPreparation: vi.fn() }));
vi.mock('playwright', () => ({ chromium: { connect: vi.fn() } }));

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
function payload(): JobPayload {
  return { input: { provider: 'openai', apiKey: 'synthetic-provider-key', model: DEFAULT_MODEL, loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'synthetic.pdf', buffer: Buffer.from('%PDF synthetic') } };
}
const frame = (): HumanBrowserFrame => ({ image: 'c3ludGhldGlj', width: 1440, height: 1000, canControl: true, phase: 'review', pages: [] });
const connection = (): AzureBrowserConnection => ({ wsEndpoint: 'wss://synthetic.invalid/browser', headers: { Authorization: 'Bearer synthetic-private-token' }, timeout: 30000 });
function sessionFixture() {
  const ended = deferred<void>(); let closed = false;
  const close = vi.fn(async () => { closed = true; ended.resolve(); });
  const humanView = { frame: vi.fn(async () => frame()), act: vi.fn(async () => undefined) };
  const session = { humanView, close, isClosed: () => closed, waitUntilClosed: () => ended.promise } as unknown as BrowserSession;
  return { session, humanView, close };
}

describe('cloud child worker lifecycle', () => {
  let messages: WorkerMessage[];
  let worker: ReturnType<typeof createWorkerHandler>;
  beforeEach(() => {
    vi.mocked(runPreparation).mockReset(); vi.mocked(chromium.connect).mockReset();
    messages = []; worker = createWorkerHandler(message => messages.push(message));
  });
  afterEach(async () => { await worker.shutdown(); });
  const human = (jobId: string, requestId: string, operation: 'frame' | 'input' | 'close', action?: Extract<WorkerCommand, { type: 'human_browser' }>['action']): WorkerCommand => ({ type: 'human_browser', jobId, requestId, operation, ...(action ? { action } : {}) });
  const reply = (requestId: string) => messages.findLast(message => message.type === 'human_browser_result' && message.requestId === requestId);

  async function startReady(jobId = 'first') {
    const f = sessionFixture();
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      options.onBrowserSession?.(f.session);
      options.onStatus({ type: 'status', status: 'awaiting_review', message: 'Review synthetic order.' });
      return f.session;
    });
    worker.receive({ type: 'prepare', jobId, payload: payload(), cloudBrowser: true });
    await flush(); return f;
  }

  it('isolates the human API from old job IDs and validates input before calling browser controls', async () => {
    const f = await startReady();
    worker.receive(human('other-job', 'wrong', 'input', { type: 'key', key: 'Enter' }));
    worker.receive(human('first', 'invalid', 'input', { type: 'key', key: 'F12' } as never));
    worker.receive(human('first', 'valid', 'input', { type: 'text', text: 'synthetic-user-input' }));
    await flush();
    expect(reply('wrong')).toMatchObject({ error: 'unavailable' });
    expect(reply('invalid')).toMatchObject({ error: 'unavailable' });
    expect(reply('valid')).not.toHaveProperty('error');
    expect(f.humanView.act).toHaveBeenCalledExactlyOnceWith({ type: 'text', text: 'synthetic-user-input' });
    expect(JSON.stringify(messages.filter(message => message.type === 'status'))).not.toContain('synthetic-user-input');
  });

  it('bounds pending frame operations and never serializes raw browser exceptions', async () => {
    const f = await startReady(); const pending = deferred<HumanBrowserFrame>();
    f.humanView.frame.mockImplementation(() => pending.promise);
    for (let i = 0; i < 17; i++) worker.receive(human('first', `frame-${i}`, 'frame'));
    await flush();
    expect(f.humanView.frame).toHaveBeenCalledTimes(16);
    expect(reply('frame-16')).toMatchObject({ error: 'unavailable' });
    pending.resolve(frame()); await flush();
    expect(messages.filter(message => message.type === 'human_browser_result' && message.frame)).toHaveLength(16);
    f.humanView.act.mockRejectedValueOnce(new Error('synthetic-private-token transport response'));
    worker.receive(human('first', 'private-error', 'input', { type: 'key', key: 'Tab' })); await flush();
    expect(reply('private-error')).toMatchObject({ error: 'unavailable' });
    expect(JSON.stringify(messages)).not.toContain('synthetic-private-token');
  });

  it('prioritizes explicit close while the pending viewer request limit is reached', async () => {
    const f = await startReady(); const pending = deferred<HumanBrowserFrame>();
    f.humanView.frame.mockImplementation(() => pending.promise);
    for (let i = 0; i < 16; i++) worker.receive(human('first', `queued-${i}`, 'frame'));
    await flush();
    worker.receive(human('first', 'priority-close', 'close')); await flush();
    try {
      expect(f.close).toHaveBeenCalled();
      expect(reply('priority-close')).not.toHaveProperty('error');
    } finally { pending.resolve(frame()); await flush(); }
  });

  it('locks a retained review viewer during successor extraction and restores access after extraction failure', async () => {
    const f = await startReady();
    const next = deferred<BrowserSession | undefined>();
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      options.onStatus({ type: 'status', status: 'extracting', message: 'Reading synthetic documents.' });
      return next.promise;
    });
    worker.receive({ type: 'prepare', jobId: 'second', payload: payload(), cloudBrowser: true }); await flush();
    worker.receive(human('first', 'stale', 'input', { type: 'key', key: 'Enter' }));
    worker.receive(human('second', 'extracting', 'input', { type: 'key', key: 'Enter' })); await flush();
    expect(reply('stale')).toMatchObject({ error: 'unavailable' });
    expect(reply('extracting')).toMatchObject({ error: 'locked' }); expect(f.humanView.act).not.toHaveBeenCalled();
    const options = vi.mocked(runPreparation).mock.calls[1]![1];
    expect(options.previousSession).toBe(f.session);
    options.onStatus({ type: 'status', status: 'failed', message: 'Synthetic extraction failure; previous form retained.' });
    next.resolve(f.session); await flush();
    worker.receive(human('second', 'restored', 'input', { type: 'key', key: 'Tab' })); await flush();
    expect(reply('restored')).not.toHaveProperty('error'); expect(f.humanView.act).toHaveBeenCalledOnce();
    expect(f.close).not.toHaveBeenCalled();
  });

  it('closes the cloud browser on IPC disconnect instead of waiting for an inaccessible review session', async () => {
    const f = await startReady();
    await worker.disconnected();
    expect(f.close).toHaveBeenCalled();
    worker.receive(human('first', 'after-disconnect', 'frame')); await flush();
    expect(reply('after-disconnect')).toMatchObject({ error: 'unavailable' });
  });

  it('closes a cloud session whose asynchronous creation finishes during disconnect cleanup', async () => {
    const created = deferred<BrowserSession>(); const f = sessionFixture();
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      const session = await created.promise;
      options.onBrowserSession?.(session);
      return session;
    });
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload(), cloudBrowser: true }); await flush();
    const disconnected = worker.disconnected();
    created.resolve(f.session); await flush();
    expect(f.close).toHaveBeenCalled();
    await disconnected;
  });

  it('close aborts extraction before a browser session exists', async () => {
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => new Promise(resolve => {
      options.signal.addEventListener('abort', () => resolve(undefined), { once: true });
    }));
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload(), cloudBrowser: true }); await flush();
    const options = vi.mocked(runPreparation).mock.calls[0]![1];
    worker.receive(human('first', 'cancel-before-browser', 'close')); await flush();
    expect(options.signal.aborted).toBe(true);
    expect(reply('cancel-before-browser')).not.toHaveProperty('error');
    expect(messages).toContainEqual({ type: 'ready', jobId: 'first', browserOpen: false });
  });

  it('passes the private native connection with network exposure disabled and scrubs headers after use', async () => {
    const browser = { close: vi.fn(async () => undefined) } as unknown as Browser;
    vi.mocked(chromium.connect).mockResolvedValue(browser);
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      expect(await options.browserOptions!.connectBrowser!()).toBe(browser);
      return undefined;
    });
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload(), cloudBrowser: true }); await flush();
    const request = messages.find(message => message.type === 'browser_connection_request');
    expect(request?.type).toBe('browser_connection_request');
    if (!request || request.type !== 'browser_connection_request') throw new Error('Missing connection request');
    const auth = connection();
    worker.receive({ type: 'browser_connection', jobId: 'first', requestId: request.requestId, connection: auth }); await flush();
    expect(chromium.connect).toHaveBeenCalledWith('wss://synthetic.invalid/browser', expect.objectContaining({ timeout: 30000, exposeNetwork: '' }));
    expect(auth.headers).toEqual({});
    expect(JSON.stringify(messages)).not.toContain('synthetic-private-token');
    expect(JSON.stringify(messages)).not.toContain('synthetic.invalid');
  });

  it('scrubs a connection returned after cancellation and refuses to open its browser', async () => {
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      try { await options.browserOptions!.connectBrowser!(); } catch { /* Expected cancellation. */ }
      return undefined;
    });
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload(), cloudBrowser: true }); await flush();
    const request = messages.find(message => message.type === 'browser_connection_request');
    if (!request || request.type !== 'browser_connection_request') throw new Error('Missing connection request');
    worker.receive({ type: 'stop_preparation', jobId: 'first' });
    const auth = connection();
    worker.receive({ type: 'browser_connection', jobId: 'first', requestId: request.requestId, connection: auth }); await flush();
    expect(chromium.connect).not.toHaveBeenCalled();
    expect(auth.headers).toEqual({});
  });

  it('scrubs unmatched late connection messages and closes an already connecting browser after shutdown', async () => {
    const stale = connection();
    worker.receive({ type: 'browser_connection', jobId: 'old', requestId: 'missing', connection: stale });
    expect(stale.headers).toEqual({});
    const connected = deferred<Browser>(); const close = vi.fn(async () => undefined);
    vi.mocked(chromium.connect).mockImplementation(() => connected.promise);
    vi.mocked(runPreparation).mockImplementationOnce(async (_payload, options) => {
      try { await options.browserOptions!.connectBrowser!(); } catch { /* Expected shutdown. */ }
      return undefined;
    });
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload(), cloudBrowser: true }); await flush();
    const request = messages.find(message => message.type === 'browser_connection_request');
    if (!request || request.type !== 'browser_connection_request') throw new Error('Missing connection request');
    const auth = connection(); worker.receive({ type: 'browser_connection', jobId: 'first', requestId: request.requestId, connection: auth }); await flush();
    const stopping = worker.shutdown();
    connected.resolve({ close } as unknown as Browser); await stopping;
    expect(close).toHaveBeenCalledOnce(); expect(auth.headers).toEqual({});
    expect(JSON.stringify(messages)).not.toContain('synthetic-private-token');
  });
});
