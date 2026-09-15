import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APIError } from '@anthropic-ai/sdk';
import { DEFAULT_MODEL, buildFieldPlan, type JobPayload, type WorkerUpdate } from '../src/domain.js';
import { createEnvironmentTools } from '../src/environment.js';
import { createModel, extractOrder } from '../src/extraction.js';
import { prepareOrderWithAgent } from '../src/agent.js';
import { createBrowserSession, type BrowserSessionOptions } from '../src/browser/session.js';
import { runPreparation } from '../src/preparation.js';

vi.mock('../src/domain.js', async (original) => ({ ...await original<object>(), buildFieldPlan: vi.fn() }));
vi.mock('../src/environment.js', () => ({ createEnvironmentTools: vi.fn() }));
vi.mock('../src/extraction.js', () => ({ createModel: vi.fn(), extractOrder: vi.fn() }));
vi.mock('../src/agent.js', () => ({ prepareOrderWithAgent: vi.fn() }));
vi.mock('../src/browser/session.js', () => ({ createBrowserSession: vi.fn() }));

const plan = [
  { key: 'loanType', value: 'Conventional', kind: 'select' as const, required: true },
  { key: 'propertyType', value: 'Single Family', kind: 'select' as const, required: true },
];
const report = plan.map(field => ({ fieldKey: field.key, ref: field.key, label: field.key, section: '', expected: field.value, actual: field.value, kind: field.kind, verified: true }));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function payload(): JobPayload {
  return { input: { provider: 'openai', apiKey: 'sk-synthetic-not-real', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic') } };
}

describe('preparation hands incomplete forms to the user without closing the browser', () => {
  const environment = { initialize: vi.fn(), retrieve: vi.fn(), clear: vi.fn(), tools: [] };
  let closed: ReturnType<typeof deferred>;
  let browserOptions: BrowserSessionOptions;
  let updates: WorkerUpdate[];
  let controller: AbortController;
  const session = {
    waitForUserLogin: vi.fn(), navigateToOrder: vi.fn(), setFieldPlan: vi.fn(),
    fillApprovedPlan: vi.fn(), getFieldReport: vi.fn(), handoff: vi.fn(), handoffIncomplete: vi.fn(),
    waitUntilClosed: vi.fn(), close: vi.fn(), tools: [],
  };
  const last = () => updates.at(-1);
  const start = (documents = payload()) => runPreparation(documents, { onStatus: update => updates.push(update), signal: controller.signal });
  const closeByUser = () => { browserOptions.onStatus('browser_closed', 'The appraisal browser was closed.'); closed.resolve(); };

  beforeEach(() => {
    vi.useFakeTimers(); vi.resetAllMocks();
    closed = deferred(); updates = []; controller = new AbortController();
    environment.initialize.mockResolvedValue(undefined);
    environment.retrieve.mockResolvedValue('sk-synthetic-not-real');
    vi.mocked(createEnvironmentTools).mockReturnValue(environment as unknown as ReturnType<typeof createEnvironmentTools>);
    vi.mocked(createModel).mockReturnValue({} as ReturnType<typeof createModel>);
    vi.mocked(extractOrder).mockResolvedValue({} as Awaited<ReturnType<typeof extractOrder>>);
    vi.mocked(buildFieldPlan).mockReturnValue({ plan, warnings: ['Review every field.'], missingRequiredFields: [] });
    vi.mocked(createBrowserSession).mockImplementation(async options => {
      browserOptions = options;
      return session as unknown as Awaited<ReturnType<typeof createBrowserSession>>;
    });
    session.waitForUserLogin.mockResolvedValue(undefined);
    session.navigateToOrder.mockResolvedValue(undefined);
    session.fillApprovedPlan.mockResolvedValue({ report, errors: [] });
    session.getFieldReport.mockResolvedValue(report);
    session.handoff.mockResolvedValue(undefined);
    session.handoffIncomplete.mockResolvedValue(true);
    session.waitUntilClosed.mockImplementation(() => closed.promise);
    vi.mocked(prepareOrderWithAgent).mockResolvedValue(undefined);
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

  it('fills deterministically, skips unnecessary model calls, and retains review even after submission and long delays', async () => {
    const documents = payload();
    const done = vi.fn(); const running = start(documents).then(done);
    await vi.advanceTimersByTimeAsync(0);
    expect(session.fillApprovedPlan).toHaveBeenCalledOnce();
    expect(prepareOrderWithAgent).not.toHaveBeenCalled();
    expect(session.handoff).toHaveBeenCalledOnce();
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('Preparation is complete') });
    expect(environment.clear).toHaveBeenCalled();
    browserOptions.onStatus('user_submitted', 'Check the portal confirmation.');
    controller.abort();
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    expect(last()?.status).toBe('user_submitted');
    expect(done).not.toHaveBeenCalled(); expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
    expect(last()?.status).toBe('browser_closed');
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
  });

  it('retains partial values when a required dropdown remains unverified', async () => {
    const partial = [report[0]!];
    session.fillApprovedPlan.mockResolvedValue({ report: partial, errors: ['Missing property type'] });
    session.getFieldReport.mockResolvedValue(partial);
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    expect(prepareOrderWithAgent).toHaveBeenCalledOnce();
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    expect(session.handoff).not.toHaveBeenCalled();
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('stopped before completion') });
    expect(last()?.warnings).toContain('Review incomplete field: propertyType.');
    expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
  });

  it.each(['google', 'xai'] as const)('keeps %s and its custom model through extraction, reconciliation, and manual review', async provider => {
    const documents = payload();
    documents.input.provider = provider;
    documents.input.model = `${provider}-custom-model`;
    const selectedModel = {} as ReturnType<typeof createModel>;
    vi.mocked(createModel).mockReturnValue(selectedModel);
    session.fillApprovedPlan.mockResolvedValue({ report: [report[0]], errors: [] });
    const running = start(documents);
    await vi.advanceTimersByTimeAsync(0);
    expect(createModel).toHaveBeenCalledExactlyOnceWith('sk-synthetic-not-real', `${provider}-custom-model`, provider);
    expect(extractOrder).toHaveBeenCalledWith(documents, selectedModel, expect.any(AbortSignal));
    expect(prepareOrderWithAgent).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      provider, model: selectedModel, plan, session,
    }));
    expect(session.handoff).toHaveBeenCalledOnce();
    expect(last()?.status).toBe('awaiting_review');
    expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
  });

  it('does not claim completion when the source omits required facts outside the approved plan', async () => {
    vi.mocked(buildFieldPlan).mockReturnValue({ plan, warnings: ['Missing document information: product. Complete this during review.'], missingRequiredFields: ['product'] });
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    expect(session.handoff).not.toHaveBeenCalled();
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('stopped before completion') });
    closeByUser(); await running;
  });

  it('retains the browser if the final handoff detects a value changed after the earlier report', async () => {
    session.handoff.mockRejectedValue(new Error('Synthetic final verification mismatch'));
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    expect(last()?.message).toContain('stopped before completion');
    expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
  });

  it('does not replace browser_closed with review if the user closes during successful handoff', async () => {
    session.handoff.mockImplementation(async () => closeByUser());
    await start();
    expect(last()?.status).toBe('browser_closed');
    expect(updates.some(update => update.status === 'awaiting_review')).toBe(false);
  });

  it('does not claim the form is released when sign-in could not be confirmed', async () => {
    session.waitForUserLogin.mockRejectedValue(new Error('Synthetic sign-in problem'));
    session.handoffIncomplete.mockResolvedValue(false);
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    expect(last()?.message).toContain('has not been prepared or verified');
    expect(last()?.message).not.toContain('then submit');
    expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
  });

  it.each(['worker deadline', 'parent cancellation', 'model failure'] as const)('keeps the partial form open after %s, including a model that ignores cancellation', async reason => {
    session.fillApprovedPlan.mockResolvedValue({ report: [], errors: [] });
    vi.mocked(prepareOrderWithAgent).mockImplementation(() => reason === 'model failure' ? Promise.reject(new Error('Synthetic private detail')) : new Promise(() => {}));
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    if (reason === 'worker deadline') await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    if (reason === 'parent cancellation') { controller.abort(); await vi.advanceTimersByTimeAsync(0); }
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    expect(last()?.status).toBe('awaiting_review');
    expect(JSON.stringify(updates)).not.toContain('Synthetic private detail');
    expect(environment.clear).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    expect(session.close).not.toHaveBeenCalled(); expect(last()?.status).toBe('awaiting_review');
    closeByUser(); await running;
  });

  it('pauses the worker deadline throughout manual login and resumes it for preparation', async () => {
    const login = deferred();
    session.waitForUserLogin.mockImplementation(() => { browserOptions.onStatus('awaiting_login', 'Sign in.'); return login.promise; });
    session.fillApprovedPlan.mockImplementation(() => new Promise(() => {}));
    const running = start(); await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    expect(last()?.status).toBe('awaiting_login'); expect(session.handoffIncomplete).not.toHaveBeenCalled();
    login.resolve(); await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
    expect(session.handoffIncomplete).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(last()?.status).toBe('awaiting_review'); expect(session.close).not.toHaveBeenCalled();
    closeByUser(); await running;
  });

  it('does not announce review when the user closes during preparation or incomplete handoff', async () => {
    session.fillApprovedPlan.mockResolvedValue({ report: [], errors: [] });
    vi.mocked(prepareOrderWithAgent).mockRejectedValue(new Error('Synthetic failure'));
    session.handoffIncomplete.mockImplementation(async () => { closeByUser(); });
    await start();
    expect(last()?.status).toBe('browser_closed');
    expect(updates.some(update => update.status === 'awaiting_review')).toBe(false);
    expect(session.close).not.toHaveBeenCalled();
  });

  it('reports extraction failure and wipes documents before any browser is launched', async () => {
    const documents = payload();
    vi.mocked(extractOrder).mockRejectedValue(new Error('Synthetic private extraction detail'));
    await start(documents);
    expect(last()?.status).toBe('failed');
    expect(createBrowserSession).not.toHaveBeenCalled();
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(environment.clear).toHaveBeenCalled();
  });

  it.each([
    ['Schema is too complex for compilation.', 'structured extraction schema'],
    ['Your credit balance is too low to access the Anthropic API.', 'API credits are insufficient'],
  ])('reports a useful Anthropic rejection and cleans up before browser creation: %s', async (message, expected) => {
    const documents = { ...payload(), salesContract: { name: 'contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic') } };
    documents.input.provider = 'anthropic';
    documents.input.model = 'claude-opus-5';
    vi.mocked(extractOrder).mockRejectedValue(APIError.generate(400,
      { type: 'error', error: { type: 'invalid_request_error', message: `${message} PRIVATE_PROVIDER_DETAIL` } }, undefined, new Headers()));
    await start(documents);
    expect(last()).toMatchObject({ status: 'failed', message: expect.stringContaining(expected) });
    expect(last()?.message).toContain('No automatic order submission was performed.');
    expect(JSON.stringify(updates)).not.toContain('PRIVATE_PROVIDER_DETAIL');
    expect(createBrowserSession).not.toHaveBeenCalled();
    expect(buildFieldPlan).not.toHaveBeenCalled();
    expect(environment.clear).toHaveBeenCalled();
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(documents.salesContract.buffer.every(byte => byte === 0)).toBe(true);
  });
});
