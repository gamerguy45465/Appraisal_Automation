// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { APIError } from "@anthropic-ai/sdk" for these regression tests.
import { APIError } from '@anthropic-ai/sdk';
// [L3] Import { DEFAULT_MODEL, buildFieldPlan, type JobPayload, type WorkerUpdate } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODEL, buildFieldPlan, type JobPayload, type WorkerUpdate } from '../src/domain.js';
// [L4] Import { createEnvironmentTools } from "../src/environment.js" for these regression tests.
import { createEnvironmentTools } from '../src/environment.js';
// [L5] Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests.
import { createModel, extractOrder } from '../src/extraction.js';
// [L6] Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests.
import { prepareOrderWithAgent } from '../src/agent.js';
// [L7] Import { createBrowserSession, type BrowserSessionOptions } from "../src/browser/session.js" for these regression tests.
import { createBrowserSession, type BrowserSessionOptions } from '../src/browser/session.js';
// [L8] Import { runPreparation } from "../src/preparation.js" for these regression tests.
import { runPreparation } from '../src/preparation.js';
import { AppError } from '../src/errors.js';
// [L9] Blank line separating the surrounding declarations, statements, or document blocks.

// [L10] Preserve the real domain module exports while replacing only buildFieldPlan with a controllable mock.
vi.mock('../src/domain.js', async (original) => ({ ...await original<object>(), buildFieldPlan: vi.fn() }));
// [L11] Replace createEnvironmentTools with a mock so lifecycle tests control private-environment behavior without PowerShell.
vi.mock('../src/environment.js', () => ({ createEnvironmentTools: vi.fn() }));
// [L12] Replace createModel and extractOrder with mocks so lifecycle tests do not contact AI providers.
vi.mock('../src/extraction.js', () => ({ createModel: vi.fn(), extractOrder: vi.fn() }));
// [L13] Replace prepareOrderWithAgent with a mock so tests can simulate completion, rejection, or an agent that never settles.
vi.mock('../src/agent.js', () => ({ prepareOrderWithAgent: vi.fn() }));
// [L14] Replace createBrowserSession with a mock so lifecycle tests control browser status and handoff without a real browser.
vi.mock('../src/browser/session.js', () => ({ createBrowserSession: vi.fn() }));
// [L15] Blank line separating the surrounding declarations, statements, or document blocks.

// [L16] Declare `plan` as an array containing an object containing key: "loanType", value: "Conventional", kind: "select", required: true, an object containing key: "propertyType", value: "Single Family", kind: "select", required: true.
const plan = [
  // [L17] Set fixture property `key` to "loanType". Set fixture property `value` to "Conventional". Set fixture property `kind` to "select". Set fixture property `required` to true.
  { key: 'loanType', value: 'Conventional', kind: 'select' as const, required: true },
  // [L18] Set fixture property `key` to "propertyType". Set fixture property `value` to "Single Family". Set fixture property `kind` to "select". Set fixture property `required` to true.
  { key: 'propertyType', value: 'Single Family', kind: 'select' as const, required: true },
// [L19] Close the array of fixture values for `plan` and finish the surrounding syntax.
];
// [L20] Declare `report` as the result of `plan.map` using a callback that returns an object containing fieldKey: `field.key`, ref: `field.key`, label: `field.key`, section: `''`, expected: `field.value`, actual: `field.value`, kind: `field.kind`, verified: `true`.
const report = plan.map(field => ({ fieldKey: field.key, ref: field.key, label: field.key, section: '', expected: field.value, actual: field.value, kind: field.kind, verified: true }));
// [L21] Define helper `deferred` with no parameters for the fixture operations below.
function deferred() {
  // [L22] Declare `resolve` for assignment later.
  let resolve!: () => void;
  // [L23] Declare `promise` as a new `Promise` instance initialized with a callback that performs: Assign `done` to `resolve`..
  const promise = new Promise<void>(done => { resolve = done; });
  // [L24] Return an object containing promise, resolve to the caller.
  return { promise, resolve };
// [L25] Close the callback or control-flow body for `deferred` and finish the surrounding syntax.
}
// [L26] Define helper `payload` with no parameters for the fixture operations below.
function payload(): JobPayload {
  // [L27] Return a synthetic OpenAI job input with a fake key, valid loan reference, invoice payment, no FHA case, no rush request, and the default model.
  return { input: { provider: 'openai', apiKey: 'sk-synthetic-not-real', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
    // [L28] Set fixture property `urla` to an object containing name: "urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic".
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic') } };
// [L29] Close the callback or control-flow body for `payload` and finish the surrounding syntax.
}
// [L30] Blank line separating the surrounding declarations, statements, or document blocks.

// [L31] Group regression tests for "preparation hands incomplete forms to the user without closing the browser".
describe('preparation hands incomplete forms to the user without closing the browser', () => {
  // [L32] Declare `environment` as an object containing initialize: the result of `vi.fn` with no arguments, retrieve: the result of `vi.fn` with no arguments, clear: the result of `vi.fn` with no arguments, tools: an empty array.
  const environment = { initialize: vi.fn(), retrieve: vi.fn(), clear: vi.fn(), drain: vi.fn(), tools: [] };
  // [L33] Declare `closed` for assignment later.
  let closed: ReturnType<typeof deferred>;
  // [L34] Declare `browserOptions` for assignment later.
  let browserOptions: BrowserSessionOptions;
  // [L35] Declare `updates` for assignment later.
  let updates: WorkerUpdate[];
  // [L36] Declare `controller` for assignment later.
  let controller: AbortController;
  // [L37] Declare `session` as an object whose fields are defined below.
  const session = {
    // [L38] Set fixture property `waitForUserLogin` to the result of `vi.fn` with no arguments. Set fixture property `navigateToOrder` to the result of `vi.fn` with no arguments. Set fixture property `setFieldPlan` to the result of `vi.fn` with no arguments.
    waitForUserLogin: vi.fn(), navigateToOrder: vi.fn(), setFieldPlan: vi.fn(),
    // [L39] Set fixture property `fillApprovedPlan` to the result of `vi.fn` with no arguments. Set fixture property `getFieldReport` to the result of `vi.fn` with no arguments. Set fixture property `handoff` to the result of `vi.fn` with no arguments. Set fixture property `handoffIncomplete` to the result of `vi.fn` with no arguments.
    fillApprovedPlan: vi.fn(), getFieldReport: vi.fn(), handoff: vi.fn(), handoffIncomplete: vi.fn(),
    // [L40] Set fixture property `waitUntilClosed` to the result of `vi.fn` with no arguments. Set fixture property `close` to the result of `vi.fn` with no arguments. Set fixture property `tools` to an empty array.
    waitUntilClosed: vi.fn(), close: vi.fn(), startNextOrder: vi.fn(), isClosed: vi.fn(), tools: [],
  // [L41] Close the fixture object for `session` and finish the surrounding syntax.
  };
  // [L42] Declare `last` as a callback that returns the result of `updates.at` using `-1`.
  const last = () => updates.at(-1);
  // [L43] Declare `start` as a callback that returns the result of `runPreparation` using `documents`, an object containing onStatus: a callback that returns `updates.push(update)`, signal: `controller.signal`.
  const start = (documents = payload()) => runPreparation(documents, { onStatus: update => updates.push(update), signal: controller.signal });
  // [L44] Declare `closeByUser` as a callback that performs: Call `browserOptions.onStatus` with "browser_closed", "The appraisal browser was closed.". Call `closed.resolve` without arguments..
  const closeByUser = () => { browserOptions.onStatus('browser_closed', 'The appraisal browser was closed.'); closed.resolve(); };
// [L45] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L46] Run this setup before every test in the group.
  beforeEach(() => {
    // [L47] Replace real timers with controllable test timers. Reset all mock implementations and recorded calls.
    vi.useFakeTimers(); vi.resetAllMocks();
    // [L48] Assign the result of `deferred` with no arguments to `closed`. Assign an empty array to `updates`. Assign a new `AbortController` instance to `controller`.
    closed = deferred(); updates = []; controller = new AbortController();
    // [L49] Configure mock `environment.initialize` to resolve to `undefined`.
    environment.initialize.mockResolvedValue(undefined);
    environment.drain.mockResolvedValue(undefined);
    // [L50] Configure mock `environment.retrieve` to resolve to "sk-synthetic-not-real".
    environment.retrieve.mockResolvedValue('sk-synthetic-not-real');
    // [L51] Configure mock `vi.mocked(createEnvironmentTools)` to return `environment`.
    vi.mocked(createEnvironmentTools).mockReturnValue(environment as unknown as ReturnType<typeof createEnvironmentTools>);
    // [L52] Configure mock `vi.mocked(createModel)` to return an empty object.
    vi.mocked(createModel).mockReturnValue({} as ReturnType<typeof createModel>);
    // [L53] Configure mock `vi.mocked(extractOrder)` to resolve to an empty object.
    vi.mocked(extractOrder).mockResolvedValue({} as Awaited<ReturnType<typeof extractOrder>>);
    // [L54] Configure mock `vi.mocked(buildFieldPlan)` to return an object containing plan, warnings: an array containing "Review every field.", missingRequiredFields: an empty array.
    vi.mocked(buildFieldPlan).mockReturnValue({ plan, warnings: ['Review every field.'], missingRequiredFields: [] });
    // [L55] Configure mock `vi.mocked(createBrowserSession)` to run a promise-returning callback whose body follows.
    vi.mocked(createBrowserSession).mockImplementation(async options => {
      // [L56] Assign `options` to `browserOptions`.
      browserOptions = options;
      // [L57] Return `session` to the caller.
      return session as unknown as Awaited<ReturnType<typeof createBrowserSession>>;
    // [L58] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L59] Configure mock `session.waitForUserLogin` to resolve to `undefined`.
    session.waitForUserLogin.mockResolvedValue(undefined);
    // [L60] Configure mock `session.navigateToOrder` to resolve to `undefined`.
    session.navigateToOrder.mockResolvedValue(undefined);
    // [L61] Configure mock `session.fillApprovedPlan` to resolve to an object containing report, errors: an empty array.
    session.fillApprovedPlan.mockResolvedValue({ report, errors: [] });
    // [L62] Configure mock `session.getFieldReport` to resolve to `report`.
    session.getFieldReport.mockResolvedValue(report);
    // [L63] Configure mock `session.handoff` to resolve to `undefined`.
    session.handoff.mockResolvedValue(undefined);
    // [L64] Configure mock `session.handoffIncomplete` to resolve to true.
    session.handoffIncomplete.mockResolvedValue(true);
    // [L65] Configure mock `session.waitUntilClosed` to run a callback that returns `closed.promise`.
    session.waitUntilClosed.mockImplementation(() => closed.promise);
    // [L66] Configure mock `vi.mocked(prepareOrderWithAgent)` to resolve to `undefined`.
    vi.mocked(prepareOrderWithAgent).mockResolvedValue(undefined);
  // [L67] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L68] Run this cleanup after every test in the group. Use a callback that performs: Discard pending fake timers. Restore real timer behavior..
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
// [L69] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L70] Register a test that "fills deterministically, skips unnecessary model calls, and retains review even after submission and long delays".
  it('returns a reusable review browser only after private environment operations drain', async () => {
    const drained = deferred();
    environment.drain.mockReturnValue(drained.promise);
    const documents = payload();
    const done = vi.fn();
    const running = runPreparation(documents, {
      onStatus: update => updates.push(update), signal: controller.signal, retainBrowser: true,
    }).then(result => { done(result); return result; });
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.status).toBe('awaiting_review');
    expect(environment.clear).toHaveBeenCalled();
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(session.waitUntilClosed).not.toHaveBeenCalled();
    expect(session.close).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
    drained.resolve();
    expect(await running).toBe(session);
  });

  it('uses a fresh guarded session from the retained browser for the next validated order', async () => {
    const previousSession = {
      isClosed: vi.fn(() => false),
      startNextOrder: vi.fn(async (options: BrowserSessionOptions) => { browserOptions = options; return session; }),
    } as unknown as Awaited<ReturnType<typeof createBrowserSession>>;
    const documents = payload();
    documents.input.provider = 'google';
    documents.input.model = 'custom-gemini-model';
    const result = await runPreparation(documents, {
      onStatus: update => updates.push(update), signal: controller.signal,
      retainBrowser: true, previousSession,
    });
    expect(result).toBe(session);
    expect(previousSession.startNextOrder).toHaveBeenCalledOnce();
    expect(createBrowserSession).not.toHaveBeenCalled();
    expect(session.waitForUserLogin).toHaveBeenCalledOnce();
    expect(session.setFieldPlan).toHaveBeenCalledWith(plan);
    expect(session.fillApprovedPlan).toHaveBeenCalledOnce();
    expect(createModel).toHaveBeenCalledWith('sk-synthetic-not-real', 'custom-gemini-model', 'google');
    expect(environment.drain).toHaveBeenCalledOnce();
  });

  it.each(['already closed', 'closed during transfer'])('opens a fresh browser if the previous review window is %s', async when => {
    const previousSession = {
      isClosed: vi.fn().mockReturnValue(true),
      startNextOrder: vi.fn().mockRejectedValue(new Error('Synthetic closed browser')),
    };
    if (when === 'closed during transfer') previousSession.isClosed.mockReturnValueOnce(false);
    const result = await runPreparation(payload(), {
      onStatus: update => updates.push(update), signal: controller.signal, retainBrowser: true,
      previousSession: previousSession as unknown as Awaited<ReturnType<typeof createBrowserSession>>,
    });
    expect(result).toBe(session);
    expect(createBrowserSession).toHaveBeenCalledOnce();
    expect(session.fillApprovedPlan).toHaveBeenCalledOnce();
    expect(session.close).not.toHaveBeenCalled();
  });

  it('replaces an unreusable unconfirmed sign-in window before opening a fresh manual-login session', async () => {
    let previousClosed = false;
    const previousSession = {
      isClosed: vi.fn(() => previousClosed),
      startNextOrder: vi.fn().mockRejectedValue(new AppError('BROWSER_REUSE_UNAVAILABLE', 'Unconfirmed sign-in.')),
      close: vi.fn(async () => { previousClosed = true; }),
    };
    const result = await runPreparation(payload(), {
      onStatus: update => updates.push(update), signal: controller.signal, retainBrowser: true,
      previousSession: previousSession as unknown as Awaited<ReturnType<typeof createBrowserSession>>,
    });
    expect(result).toBe(session);
    expect(previousSession.close).toHaveBeenCalledOnce();
    expect(createBrowserSession).toHaveBeenCalledOnce();
    expect(session.waitForUserLogin).toHaveBeenCalledOnce();
    expect(session.close).not.toHaveBeenCalled();
  });

  it('keeps the previous review form untouched if the next documents fail extraction', async () => {
    const previousSession = session as unknown as Awaited<ReturnType<typeof createBrowserSession>>;
    vi.mocked(extractOrder).mockRejectedValue(new Error('Synthetic invalid documents'));
    const result = await runPreparation(payload(), {
      onStatus: update => updates.push(update), signal: controller.signal,
      retainBrowser: true, previousSession,
    });
    expect(result).toBe(previousSession);
    expect(last()?.status).toBe('failed');
    expect(session.startNextOrder).not.toHaveBeenCalled();
    expect(session.handoffIncomplete).not.toHaveBeenCalled();
    expect(session.close).not.toHaveBeenCalled();
    expect(environment.drain).toHaveBeenCalledOnce();
  });

  it('returns an incomplete retained form without waiting for its browser to close', async () => {
    session.getFieldReport.mockResolvedValue([report[0]!]);
    const result = await runPreparation(payload(), {
      onStatus: update => updates.push(update), signal: controller.signal, retainBrowser: true,
    });
    expect(result).toBe(session);
    expect(last()?.status).toBe('awaiting_review');
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    expect(session.waitUntilClosed).not.toHaveBeenCalled();
    expect(environment.drain).toHaveBeenCalledOnce();
  });

  it('fills deterministically, skips unnecessary model calls, and retains review even after submission and long delays', async () => {
    // [L71] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L72] Declare `done` as the result of `vi.fn` with no arguments. Declare `running` as the result of `start(documents).then` using `done`.
    const done = vi.fn(); const running = start(documents).then(done);
    // [L73] Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(0);
    // [L74] Assert that `session.fillApprovedPlan` was called exactly once.
    expect(session.fillApprovedPlan).toHaveBeenCalledOnce();
    // [L75] Assert that `prepareOrderWithAgent` does not satisfy: was called.
    expect(prepareOrderWithAgent).not.toHaveBeenCalled();
    // [L76] Assert that `session.handoff` was called exactly once.
    expect(session.handoff).toHaveBeenCalledOnce();
    // [L77] Assert that the result of `last` with no arguments contains the expected object fields an object containing status: "awaiting_review", message: the result of `expect.stringContaining` using "Preparation is complete".
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('Preparation is complete') });
    // [L78] Assert that `environment.clear` was called.
    expect(environment.clear).toHaveBeenCalled();
    // [L79] Call `browserOptions.onStatus` with "user_submitted", "Check the portal confirmation.".
    browserOptions.onStatus('user_submitted', 'Check the portal confirmation.');
    // [L80] Abort `controller`.
    controller.abort();
    // [L81] Advance fake time by 6 times 60 times 60 times 1000 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    // [L82] Assert that `last()?.status` strictly equals "user_submitted".
    expect(last()?.status).toBe('user_submitted');
    // [L83] Assert that `done` does not satisfy: was called. Assert that `session.close` does not satisfy: was called.
    expect(done).not.toHaveBeenCalled(); expect(session.close).not.toHaveBeenCalled();
    // [L84] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
    // [L85] Assert that `last()?.status` strictly equals "browser_closed".
    expect(last()?.status).toBe('browser_closed');
    // [L86] Assert every byte of the uploaded URLA buffer was overwritten with zero before preparation finished.
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
  // [L87] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L88] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L89] Register a test that "retains partial values when a required dropdown remains unverified".
  it('retains partial values when a required dropdown remains unverified', async () => {
    // [L90] Declare `partial` as an array containing `report[0]`.
    const partial = [report[0]!];
    // [L91] Configure mock `session.fillApprovedPlan` to resolve to an object containing report: `partial`, errors: an array containing "Missing property type".
    session.fillApprovedPlan.mockResolvedValue({ report: partial, errors: ['Missing property type'] });
    // [L92] Configure mock `session.getFieldReport` to resolve to `partial`.
    session.getFieldReport.mockResolvedValue(partial);
    // [L93] Declare `running` as the result of `start` with no arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    // [L94] Assert that `prepareOrderWithAgent` was called exactly once.
    expect(prepareOrderWithAgent).toHaveBeenCalledOnce();
    // [L95] Assert that `session.handoffIncomplete` was called exactly once.
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    // [L96] Assert that `session.handoff` does not satisfy: was called.
    expect(session.handoff).not.toHaveBeenCalled();
    // [L97] Assert that the result of `last` with no arguments contains the expected object fields an object containing status: "awaiting_review", message: the result of `expect.stringContaining` using "stopped before completion".
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('stopped before completion') });
    // [L98] Assert that `last()?.warnings` contains "Review incomplete field: propertyType.".
    expect(last()?.warnings).toContain('Review incomplete field: propertyType.');
    // [L99] Assert that `session.close` does not satisfy: was called.
    expect(session.close).not.toHaveBeenCalled();
    // [L100] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L101] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L102] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L103] Register a parameterized test that "keeps %s and its custom model through extraction, reconciliation, and manual review".
  it.each(['google', 'xai'] as const)('keeps %s and its custom model through extraction, reconciliation, and manual review', async provider => {
    // [L104] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L105] Assign `provider` to `documents.input.provider`.
    documents.input.provider = provider;
    // [L106] Assign text interpolating `provider` to `documents.input.model`.
    documents.input.model = `${provider}-custom-model`;
    // [L107] Declare `selectedModel` as an empty object.
    const selectedModel = {} as ReturnType<typeof createModel>;
    // [L108] Configure mock `vi.mocked(createModel)` to return `selectedModel`.
    vi.mocked(createModel).mockReturnValue(selectedModel);
    // [L109] Configure mock `session.fillApprovedPlan` to resolve to an object containing report: an array containing `report[0]`, errors: an empty array.
    session.fillApprovedPlan.mockResolvedValue({ report: [report[0]], errors: [] });
    // [L110] Declare `running` as the result of `start` using `documents`.
    const running = start(documents);
    // [L111] Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(0);
    // [L112] Assert that `createModel` was called exactly once with "sk-synthetic-not-real", text interpolating `provider`, `provider`.
    expect(createModel).toHaveBeenCalledExactlyOnceWith('sk-synthetic-not-real', `${provider}-custom-model`, provider);
    // [L113] Assert that `extractOrder` was called with `documents`, `selectedModel`, the result of `expect.any` using `AbortSignal`.
    expect(extractOrder).toHaveBeenCalledWith(documents, selectedModel, expect.any(AbortSignal));
    // [L114] Assert that `prepareOrderWithAgent` was called exactly once with the result of `expect.objectContaining` using an object whose fields are defined below.
    expect(prepareOrderWithAgent).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      // [L115] Include the current `provider` value under the same property name. Set fixture property `model` to `selectedModel`. Include the current `plan` value under the same property name. Include the current `session` value under the same property name.
      provider, model: selectedModel, plan, session,
    // [L116] Close the fixture object and finish the surrounding syntax.
    }));
    // [L117] Assert that `session.handoff` was called exactly once.
    expect(session.handoff).toHaveBeenCalledOnce();
    // [L118] Assert that `last()?.status` strictly equals "awaiting_review".
    expect(last()?.status).toBe('awaiting_review');
    // [L119] Assert that `session.close` does not satisfy: was called.
    expect(session.close).not.toHaveBeenCalled();
    // [L120] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
    // [L121] Assert the selected-provider lifecycle still wipes every uploaded URLA byte after completion.
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
  // [L122] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L123] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L124] Register a test that "does not claim completion when the source omits required facts outside the approved plan".
  it('does not claim completion when the source omits required facts outside the approved plan', async () => {
    // [L125] Configure mock `vi.mocked(buildFieldPlan)` to return an object containing plan, warnings: an array containing "Missing document information: product. Complete this during review.", missingRequiredFields: an array containing "product".
    vi.mocked(buildFieldPlan).mockReturnValue({ plan, warnings: ['Missing document information: product. Complete this during review.'], missingRequiredFields: ['product'] });
    // [L126] Declare `running` as the result of `start` with no arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    // [L127] Assert that `session.handoff` does not satisfy: was called.
    expect(session.handoff).not.toHaveBeenCalled();
    // [L128] Assert that `session.handoffIncomplete` was called exactly once.
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    // [L129] Assert that the result of `last` with no arguments contains the expected object fields an object containing status: "awaiting_review", message: the result of `expect.stringContaining` using "stopped before completion".
    expect(last()).toMatchObject({ status: 'awaiting_review', message: expect.stringContaining('stopped before completion') });
    // [L130] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L131] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L132] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L133] Register a test that "retains the browser if the final handoff detects a value changed after the earlier report".
  it('retains the browser if the final handoff detects a value changed after the earlier report', async () => {
    // [L134] Configure mock `session.handoff` to reject with a new `Error` instance initialized with "Synthetic final verification mismatch".
    session.handoff.mockRejectedValue(new Error('Synthetic final verification mismatch'));
    // [L135] Declare `running` as the result of `start` with no arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    // [L136] Assert that `session.handoffIncomplete` was called exactly once.
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    // [L137] Assert that `last()?.message` contains "stopped before completion".
    expect(last()?.message).toContain('stopped before completion');
    // [L138] Assert that `session.close` does not satisfy: was called.
    expect(session.close).not.toHaveBeenCalled();
    // [L139] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L140] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L141] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L142] Register a test that "does not replace browser_closed with review if the user closes during successful handoff".
  it('does not replace browser_closed with review if the user closes during successful handoff', async () => {
    // [L143] Configure mock `session.handoff` to run a promise-returning callback that returns the result of `closeByUser` with no arguments.
    session.handoff.mockImplementation(async () => closeByUser());
    // [L144] Call `start` without arguments. Wait for completion before continuing.
    await start();
    // [L145] Assert that `last()?.status` strictly equals "browser_closed".
    expect(last()?.status).toBe('browser_closed');
    // [L146] Assert no awaiting_review status was emitted after browser closure during successful handoff.
    expect(updates.some(update => update.status === 'awaiting_review')).toBe(false);
  // [L147] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L148] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L149] Register a test that "does not claim the form is released when sign-in could not be confirmed".
  it('does not claim the form is released when sign-in could not be confirmed', async () => {
    // [L150] Configure mock `session.waitForUserLogin` to reject with a new `Error` instance initialized with "Synthetic sign-in problem".
    session.waitForUserLogin.mockRejectedValue(new Error('Synthetic sign-in problem'));
    // [L151] Configure mock `session.handoffIncomplete` to resolve to false.
    session.handoffIncomplete.mockResolvedValue(false);
    // [L152] Declare `running` as the result of `start` with no arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    // [L153] Assert that `last()?.message` contains "has not been prepared or verified".
    expect(last()?.message).toContain('has not been prepared or verified');
    // [L154] Assert that `last()?.message` does not satisfy: contains "then submit".
    expect(last()?.message).not.toContain('then submit');
    // [L155] Assert that `session.close` does not satisfy: was called.
    expect(session.close).not.toHaveBeenCalled();
    // [L156] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L157] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L158] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L159] Register a parameterized test that "keeps the partial form open after %s, including a model that ignores cancellation".
  it.each(['worker deadline', 'parent cancellation', 'model failure'] as const)('keeps the partial form open after %s, including a model that ignores cancellation', async reason => {
    // [L160] Configure mock `session.fillApprovedPlan` to resolve to an object containing report: an empty array, errors: an empty array.
    session.fillApprovedPlan.mockResolvedValue({ report: [], errors: [] });
    // [L161] Configure the agent to reject with a private synthetic error for model failure; otherwise return a permanently pending promise that ignores cancellation.
    vi.mocked(prepareOrderWithAgent).mockImplementation(() => reason === 'model failure' ? Promise.reject(new Error('Synthetic private detail')) : new Promise(() => {}));
    // [L162] Declare `running` as the result of `start` with no arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(0);
    // [L163] Run the following branch when `reason` strictly equals "worker deadline". Advance fake time by 10 times 60 times 1000 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    if (reason === 'worker deadline') await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    // [L164] For the parent-cancellation case, abort the external controller and advance fake time by zero to settle cancellation-driven asynchronous work.
    if (reason === 'parent cancellation') { controller.abort(); await vi.advanceTimersByTimeAsync(0); }
    // [L165] Assert that `session.handoffIncomplete` was called exactly once.
    expect(session.handoffIncomplete).toHaveBeenCalledOnce();
    // [L166] Assert that `last()?.status` strictly equals "awaiting_review".
    expect(last()?.status).toBe('awaiting_review');
    // [L167] Assert that the result of `JSON.stringify` using `updates` does not satisfy: contains "Synthetic private detail".
    expect(JSON.stringify(updates)).not.toContain('Synthetic private detail');
    // [L168] Assert that `environment.clear` was called.
    expect(environment.clear).toHaveBeenCalled();
    // [L169] Advance fake time by 6 times 60 times 60 times 1000 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    // [L170] Assert that `session.close` does not satisfy: was called. Assert that `last()?.status` strictly equals "awaiting_review".
    expect(session.close).not.toHaveBeenCalled(); expect(last()?.status).toBe('awaiting_review');
    // [L171] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L172] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L173] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L174] Register a test that "pauses the worker deadline throughout manual login and resumes it for preparation".
  it('pauses the worker deadline throughout manual login and resumes it for preparation', async () => {
    // [L175] Declare `login` as the result of `deferred` with no arguments.
    const login = deferred();
    // [L176] Configure mock `session.waitForUserLogin` to run a callback that performs: Call `browserOptions.onStatus` with "awaiting_login", "Sign in.". Return `login.promise` to the caller..
    session.waitForUserLogin.mockImplementation(() => { browserOptions.onStatus('awaiting_login', 'Sign in.'); return login.promise; });
    // [L177] Make deterministic filling return a permanently pending promise so the resumed active-processing deadline can cancel it.
    session.fillApprovedPlan.mockImplementation(() => new Promise(() => {}));
    // [L178] Declare `running` as the result of `start` with no arguments. Advance fake time by 6 times 60 times 60 times 1000 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    const running = start(); await vi.advanceTimersByTimeAsync(6 * 60 * 60 * 1000);
    // [L179] Assert that `last()?.status` strictly equals "awaiting_login". Assert that `session.handoffIncomplete` does not satisfy: was called.
    expect(last()?.status).toBe('awaiting_login'); expect(session.handoffIncomplete).not.toHaveBeenCalled();
    // [L180] Call `login.resolve` without arguments. Advance fake time by 0 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    login.resolve(); await vi.advanceTimersByTimeAsync(0);
    // [L181] Advance fake time by 10 times 60 times 1000 minus 1 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000 - 1);
    // [L182] Assert that `session.handoffIncomplete` does not satisfy: was called.
    expect(session.handoffIncomplete).not.toHaveBeenCalled();
    // [L183] Advance fake time by 1 milliseconds and settle timer-triggered asynchronous work. Wait for completion before continuing.
    await vi.advanceTimersByTimeAsync(1);
    // [L184] Assert that `last()?.status` strictly equals "awaiting_review". Assert that `session.close` does not satisfy: was called.
    expect(last()?.status).toBe('awaiting_review'); expect(session.close).not.toHaveBeenCalled();
    // [L185] Call `closeByUser` without arguments. Wait for `running` to settle before continuing.
    closeByUser(); await running;
  // [L186] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L187] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L188] Register a test that "does not announce review when the user closes during preparation or incomplete handoff".
  it('does not announce review when the user closes during preparation or incomplete handoff', async () => {
    // [L189] Configure mock `session.fillApprovedPlan` to resolve to an object containing report: an empty array, errors: an empty array.
    session.fillApprovedPlan.mockResolvedValue({ report: [], errors: [] });
    // [L190] Configure mock `vi.mocked(prepareOrderWithAgent)` to reject with a new `Error` instance initialized with "Synthetic failure".
    vi.mocked(prepareOrderWithAgent).mockRejectedValue(new Error('Synthetic failure'));
    // [L191] Configure mock `session.handoffIncomplete` to run a promise-returning callback that performs: Call `closeByUser` without arguments..
    session.handoffIncomplete.mockImplementation(async () => { closeByUser(); });
    // [L192] Call `start` without arguments. Wait for completion before continuing.
    await start();
    // [L193] Assert that `last()?.status` strictly equals "browser_closed".
    expect(last()?.status).toBe('browser_closed');
    // [L194] Assert browser closure during incomplete handoff never produces an awaiting_review update.
    expect(updates.some(update => update.status === 'awaiting_review')).toBe(false);
    // [L195] Assert that `session.close` does not satisfy: was called.
    expect(session.close).not.toHaveBeenCalled();
  // [L196] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L197] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L198] Register a test that "reports extraction failure and wipes documents before any browser is launched".
  it('reports extraction failure and wipes documents before any browser is launched', async () => {
    // [L199] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L200] Configure mock `vi.mocked(extractOrder)` to reject with a new `Error` instance initialized with "Synthetic private extraction detail".
    vi.mocked(extractOrder).mockRejectedValue(new Error('Synthetic private extraction detail'));
    // [L201] Call `start` with `documents`. Wait for completion before continuing.
    await start(documents);
    // [L202] Assert that `last()?.status` strictly equals "failed".
    expect(last()?.status).toBe('failed');
    // [L203] Assert that `createBrowserSession` does not satisfy: was called.
    expect(createBrowserSession).not.toHaveBeenCalled();
    // [L204] Assert the URLA buffer is fully zeroed after extraction failure, before any browser was launched.
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
    // [L205] Assert that `environment.clear` was called.
    expect(environment.clear).toHaveBeenCalled();
  // [L206] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L207] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L208] Register a parameterized test that "reports a useful Anthropic rejection and cleans up before browser creation: %s".
  it.each([
    // [L209] Provide a parameterized test row with ['Schema is too complex for compilation.', 'structured extraction schema'],; the test receives these values as its inputs and expectations.
    ['Schema is too complex for compilation.', 'structured extraction schema'],
    // [L210] Provide a parameterized test row with ['Your credit balance is too low to access the Anthropic API.', 'API credits are insufficient'],; the test receives these values as its inputs and expectations.
    ['Your credit balance is too low to access the Anthropic API.', 'API credits are insufficient'],
  // [L211] Apply the preceding scenario rows to the parameterized test "reports a useful Anthropic rejection and cleans up before browser creation: %s" and begin its callback.
  ])('reports a useful Anthropic rejection and cleans up before browser creation: %s', async (message, expected) => {
    // [L212] Declare `documents` as an object containing values copied from the result of `payload` with no arguments, salesContract: an object containing name: "contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic".
    const documents = { ...payload(), salesContract: { name: 'contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic') } };
    // [L213] Assign "anthropic" to `documents.input.provider`.
    documents.input.provider = 'anthropic';
    // [L214] Assign "claude-opus-5" to `documents.input.model`.
    documents.input.model = 'claude-opus-5';
    // [L215] Configure mock `vi.mocked(extractOrder)` to reject with the result of `APIError.generate` using 400, an object containing type: "error", error: an object containing type: "invalid_request_error", message: text interpolating `message`, `undefined`, a new `Headers` instance.
    vi.mocked(extractOrder).mockRejectedValue(APIError.generate(400,
      // [L216] Set fixture property `type` to "error". Set fixture property `error` to an object containing type: "invalid_request_error", message: text interpolating `message`.
      { type: 'error', error: { type: 'invalid_request_error', message: `${message} PRIVATE_PROVIDER_DETAIL` } }, undefined, new Headers()));
    // [L217] Call `start` with `documents`. Wait for completion before continuing.
    await start(documents);
    // [L218] Assert that the result of `last` with no arguments contains the expected object fields an object containing status: "failed", message: the result of `expect.stringContaining` using `expected`.
    expect(last()).toMatchObject({ status: 'failed', message: expect.stringContaining(expected) });
    // [L219] Assert that `last()?.message` contains "No automatic order submission was performed.".
    expect(last()?.message).toContain('No automatic order submission was performed.');
    // [L220] Assert that the result of `JSON.stringify` using `updates` does not satisfy: contains "PRIVATE_PROVIDER_DETAIL".
    expect(JSON.stringify(updates)).not.toContain('PRIVATE_PROVIDER_DETAIL');
    // [L221] Assert that `createBrowserSession` does not satisfy: was called.
    expect(createBrowserSession).not.toHaveBeenCalled();
    // [L222] Assert that `buildFieldPlan` does not satisfy: was called.
    expect(buildFieldPlan).not.toHaveBeenCalled();
    // [L223] Assert that `environment.clear` was called.
    expect(environment.clear).toHaveBeenCalled();
    // [L224] Assert that the result of `documents.urla.buffer.every` using a callback that returns `byte` strictly equals 0 strictly equals true.
    expect(documents.urla.buffer.every(byte => byte === 0)).toBe(true);
    // [L225] Assert that the result of `documents.salesContract.buffer.every` using a callback that returns `byte` strictly equals 0 strictly equals true.
    expect(documents.salesContract.buffer.every(byte => byte === 0)).toBe(true);
  // [L226] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L227] Close the callback or control-flow body and finish the surrounding syntax.
});
