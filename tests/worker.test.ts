import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkerHandler } from '../src/worker.js';
import { runPreparation } from '../src/preparation.js';
import { DEFAULT_MODEL, type JobPayload, type WorkerMessage } from '../src/domain.js';
import type { BrowserSession } from '../src/browser/session.js';

vi.mock('../src/preparation.js', () => ({ runPreparation: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
function payload(key = 'synthetic-first-provider-key'): JobPayload {
  return { input: { provider: 'openai', apiKey: key, model: DEFAULT_MODEL, loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic') } };
}
function browserSession() {
  const ended = deferred<void>();
  let closed = false;
  const close = vi.fn(async () => { closed = true; ended.resolve(); });
  const session = { close, isClosed: () => closed, waitUntilClosed: () => ended.promise } as unknown as BrowserSession;
  return { session, close, closeByUser: () => { closed = true; ended.resolve(); } };
}

describe('reusable isolated worker', () => {
  let messages: WorkerMessage[];
  let worker: ReturnType<typeof createWorkerHandler>;
  beforeEach(() => {
    vi.mocked(runPreparation).mockReset();
    messages = [];
    worker = createWorkerHandler(message => messages.push(message));
  });
  afterEach(async () => { await worker.shutdown(); });

  it('retains one browser while each sequential job gets a fresh controller, payload, and correlated status', async () => {
    const first = browserSession();
    const second = browserSession();
    const secondRun = deferred<BrowserSession | undefined>();
    vi.mocked(runPreparation).mockResolvedValueOnce(first.session).mockImplementationOnce(() => secondRun.promise);
    const firstPayload = payload();
    worker.receive({ type: 'prepare', jobId: 'first', payload: firstPayload });
    await flush();
    expect(messages).toContainEqual({ type: 'ready', jobId: 'first', browserOpen: true });
    expect(firstPayload.input.apiKey).toBe('');
    expect(firstPayload.urla.buffer.every(byte => byte === 0)).toBe(true);
    const firstOptions = vi.mocked(runPreparation).mock.calls[0]![1];
    const nextPayload = payload('synthetic-second-provider-key');
    nextPayload.input.provider = 'google'; nextPayload.input.model = 'synthetic-custom-model';
    worker.receive({ type: 'prepare', jobId: 'second', payload: nextPayload });
    await flush();
    const secondOptions = vi.mocked(runPreparation).mock.calls[1]![1];
    expect(secondOptions).toMatchObject({ previousSession: first.session, retainBrowser: true });
    expect(secondOptions.signal).not.toBe(firstOptions.signal);
    expect(vi.mocked(runPreparation).mock.calls[1]![0].input).toMatchObject({ provider: 'google', model: 'synthetic-custom-model', apiKey: 'synthetic-second-provider-key' });
    firstOptions.onStatus({ type: 'status', status: 'user_submitted', message: 'old callback' });
    expect(messages.at(-1)).toMatchObject({ jobId: 'first', status: 'user_submitted' });
    worker.receive({ type: 'stop_preparation', jobId: 'first' });
    expect(secondOptions.signal.aborted).toBe(false);
    worker.receive({ type: 'stop_preparation', jobId: 'second' });
    expect(secondOptions.signal.aborted).toBe(true);
    secondRun.resolve(second.session);
    await flush();
    expect(messages.at(-1)).toEqual({ type: 'ready', jobId: 'second', browserOpen: true });
  });

  it('does not announce readiness at handoff until preparation cleanup returns', async () => {
    const retained = browserSession();
    const cleanup = deferred<BrowserSession | undefined>();
    vi.mocked(runPreparation).mockImplementation(async (_payload, options) => {
      options.onStatus({ type: 'status', status: 'awaiting_review', message: 'Review the order.' });
      return cleanup.promise;
    });
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload() });
    await flush();
    expect(messages).toEqual([expect.objectContaining({ type: 'status', jobId: 'first', status: 'awaiting_review' })]);
    const overlap = payload();
    worker.receive({ type: 'prepare', jobId: 'overlap', payload: overlap });
    expect(overlap.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(overlap.input.apiKey).toBe('');
    expect(runPreparation).toHaveBeenCalledOnce();
    cleanup.resolve(retained.session);
    await flush();
    expect(messages.at(-1)).toEqual({ type: 'ready', jobId: 'first', browserOpen: true });
  });

  it('reports closure against the latest job when failed extraction retained the previous session', async () => {
    const retained = browserSession();
    vi.mocked(runPreparation).mockResolvedValue(retained.session);
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload() });
    await flush();
    worker.receive({ type: 'prepare', jobId: 'failed-next', payload: payload() });
    await flush();
    retained.closeByUser();
    await flush();
    expect(messages.filter(message => message.type === 'status' && message.status === 'browser_closed')).toEqual([
      { type: 'status', jobId: 'failed-next', status: 'browser_closed', message: 'The appraisal browser was closed.' },
    ]);
    expect(messages.at(-1)).toEqual({ type: 'ready', jobId: 'failed-next', browserOpen: false });
    expect(retained.close).toHaveBeenCalledOnce();
  });

  it('reports browserless cleanup without carrying the aborted controller into the next run', async () => {
    const finished = deferred<BrowserSession | undefined>();
    vi.mocked(runPreparation).mockImplementationOnce(() => finished.promise).mockResolvedValueOnce(undefined);
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload() });
    await flush();
    worker.receive({ type: 'stop_preparation', jobId: 'first' });
    finished.resolve(undefined);
    await flush();
    expect(messages.at(-1)).toEqual({ type: 'ready', jobId: 'first', browserOpen: false });
    worker.receive({ type: 'prepare', jobId: 'second', payload: payload() });
    await flush();
    expect(vi.mocked(runPreparation).mock.calls[1]![1].signal.aborted).toBe(false);
    expect(vi.mocked(runPreparation).mock.calls[1]![1].previousSession).toBeUndefined();
  });

  it('sanitizes an unexpected failure and clears transferred secrets and buffers', async () => {
    vi.mocked(runPreparation).mockRejectedValue(new Error('private provider response'));
    const documents = payload();
    worker.receive({ type: 'prepare', jobId: 'first', payload: documents });
    await flush();
    expect(messages).toEqual([
      { type: 'status', jobId: 'first', status: 'failed', message: 'The preparation worker stopped unexpectedly.' },
      { type: 'ready', jobId: 'first', browserOpen: false },
    ]);
    expect(documents.input.apiKey).toBe('');
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
  });

  it('preserves the human review browser after IPC disconnect until its user closes it', async () => {
    const retained = browserSession();
    vi.mocked(runPreparation).mockResolvedValue(retained.session);
    worker.receive({ type: 'prepare', jobId: 'first', payload: payload() });
    await flush();
    const disconnected = worker.disconnected();
    await flush();
    expect(retained.close).not.toHaveBeenCalled();
    retained.closeByUser();
    await disconnected;
    expect(retained.close).toHaveBeenCalled();
  });
});
