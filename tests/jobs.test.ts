// [L1] Import { EventEmitter } from "node:events" for these regression tests.
import { EventEmitter } from 'node:events';
// [L2] Import { fork, type ChildProcess } from "node:child_process" for these regression tests.
import { fork, type ChildProcess } from 'node:child_process';
// [L3] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L4] Import { createJobRunner, type JobRunner } from "../src/jobs.js" for these regression tests.
import { createJobRunner, type JobRunner } from '../src/jobs.js';
// [L5] Import { DEFAULT_MODEL, type JobPayload, type WorkerUpdate } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODEL, type JobPayload, type WorkerUpdate, type WorkerCommand } from '../src/domain.js';
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.

// [L7] Mock node:child_process so fork is a spy-controlled function and the lifecycle tests create no real worker process.
vi.mock('node:child_process', () => ({ fork: vi.fn() }));
// [L8] Blank line separating the surrounding declarations, statements, or document blocks.

// [L9] Define synthetic class `FakeWorker` with extends EventEmitter for the test fixture.
class FakeWorker extends EventEmitter {
  jobId = '';
  readonly stopJobIds: string[] = [];
  // [L10] Declare class field `kill` initialized to the result of `vi.fn` using a callback that returns true.
  readonly kill = vi.fn(() => true);
  // [L11] Declare class field `transferredUrla` for assignment later.
  transferredUrla?: Buffer;
  // [L12] Declare class field `transferredContract` for assignment later.
  transferredContract?: Buffer;
  // [L13] Declare class field `controls` initialized to an empty array.
  readonly controls: string[] = [];
  // [L14] Declare class field `transferCallback` for assignment later.
  private transferCallback?: (error: Error | null) => void;
// [L15] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L16] Define fixture method `send` with parameters payload, callback.
  send(command: WorkerCommand, callback: (error: Error | null) => void): boolean {
    // [L17] For stop-control payloads, record the control type, call the IPC callback with null to signal success, and return true without copying document buffers.
    if (command.type === 'stop_preparation') { this.controls.push(command.type); this.stopJobIds.push(command.jobId); callback(null); return true; }
    this.jobId = command.jobId;
    const payload = command.payload;
    // [L18] Existing comment: IPC serialization makes the child's own copy before the send callback runs.
    // IPC serialization makes the child's own copy before the send callback runs.
    // [L19] Assign the result of `Buffer.from` using `payload.urla.buffer` to `this.transferredUrla`.
    this.transferredUrla = Buffer.from(payload.urla.buffer);
    // [L20] Assign `payload.salesContract` and the result of `Buffer.from` using `payload.salesContract.buffer` to `this.transferredContract`.
    this.transferredContract = payload.salesContract && Buffer.from(payload.salesContract.buffer);
    // [L21] Assign `callback` to `this.transferCallback`.
    this.transferCallback = callback;
    // [L22] Return true to the caller.
    return true;
  // [L23] Close the callback or control-flow body for `send` and finish the surrounding syntax.
  }
// [L24] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L25] Define finishTransfer to invoke the saved IPC callback when present, using null by default for successful transfer or the supplied error for failure.
  finishTransfer(error: Error | null = null): void { this.transferCallback?.(error); }
  // [L26] Define update to emit a typed synthetic status IPC message with the chosen status and a matching public message.
  update(status: WorkerUpdate['status'], jobId = this.jobId): void { this.emit('message', { type: 'status', jobId, status, message: `Synthetic ${status}` }); }
  ready(browserOpen = true, jobId = this.jobId): void { this.emit('message', { type: 'ready', jobId, browserOpen }); }
  // [L27] Define close to emit a successful child-close event with exit code zero and no terminating signal.
  close(): void { this.emit('close', 0, null); }
// [L28] Finish the surrounding expression and delimiters.
}
// [L29] Blank line separating the surrounding declarations, statements, or document blocks.

// [L30] Define helper `syntheticPayload` with no parameters for the fixture operations below.
function syntheticPayload(): JobPayload {
  // [L31] Return an object whose fields are defined below to the caller.
  return {
    // [L32] Set fixture property `input` to an object whose fields are defined below.
    input: { provider: 'openai', apiKey: 'sk-synthetic-key-not-real',
      // [L33] Set fixture property `loanNumber` to "685-2012345". Set fixture property `fhaCaseNumber` to "". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false. Set fixture property `model` to `DEFAULT_MODEL`.
      loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
    // [L34] Set fixture property `urla` to an object containing name: "urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA".
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    // [L35] Set fixture property `salesContract` to an object containing name: "sales-contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract".
    salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') },
  // [L36] Close the fixture object and finish the surrounding syntax.
  };
// [L37] Close the callback or control-flow body for `syntheticPayload` and finish the surrounding syntax.
}
// [L38] Blank line separating the surrounding declarations, statements, or document blocks.

// [L39] Group regression tests for "isolated job process lifecycle".
describe('isolated job process lifecycle', () => {
  // [L40] Declare `runner` for assignment later.
  let runner: JobRunner;
  // [L41] Declare `children` for assignment later.
  let children: FakeWorker[];
  // [L42] Run this setup before every test in the group.
  beforeEach(() => {
    // [L43] Replace real timers with controllable test timers.
    vi.useFakeTimers();
    // [L44] Assign an empty array to `children`.
    children = [];
    // [L45] Configure mock `vi.mocked(fork).mockReset()` to run a callback whose body follows.
    vi.mocked(fork).mockReset().mockImplementation(() => {
      // [L46] Declare `child` as a new `FakeWorker` instance.
      const child = new FakeWorker();
      // [L47] Append `child` to `children` for later inspection.
      children.push(child);
      // [L48] Return `child` to the caller.
      return child as unknown as ChildProcess;
    // [L49] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L50] Assign the result of `createJobRunner` with no arguments to `runner`.
    runner = createJobRunner();
  // [L51] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L52] Run this cleanup after every test in the group.
  afterEach(() => {
    // [L53] Call `runner.shutdown` without arguments.
    runner.shutdown();
    // [L54] Discard pending fake timers.
    vi.clearAllTimers();
    // [L55] Restore real timer behavior.
    vi.useRealTimers();
    // [L56] Restore all temporarily replaced environment variables.
    vi.unstubAllEnvs();
  // [L57] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L58] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L59] Register a test that "scopes job access to its session and keeps the active slot until the review browser closes".
  it('scopes job access to its session and keeps the active slot until the review browser closes', () => {
    // [L60] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L61] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L62] Call `child.finishTransfer` without arguments.
    child.finishTransfer();
    // [L63] Assert that `runner.get('owner-a', job.id)?.status` strictly equals "queued".
    expect(runner.get('owner-a', job.id)?.status).toBe('queued');
    // [L64] Assert that the result of `runner.get` using "owner-b", `job.id` is undefined.
    expect(runner.get('owner-b', job.id)).toBeUndefined();
    // [L65] Assert that `runner.getActive?.('owner-a')?.id` strictly equals `job.id`.
    expect(runner.getActive?.('owner-a')?.id).toBe(job.id);
    // [L66] Assert that the result of `runner.getActive` using "owner-b" is undefined.
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    // [L67] Assert that a callback that returns the result of `runner.create` using "owner-b", the result of `syntheticPayload` with no arguments throws an error matching the result of `expect.objectContaining` using an object containing code: "JOB_ACTIVE".
    expect(() => runner.create('owner-b', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    // [L68] Call `child.update` with "awaiting_review".
    child.update('awaiting_review');
    // [L69] Call `vi.advanceTimersByTime` with 60 times 60 times 1000.
    vi.advanceTimersByTime(60 * 60 * 1000);
    // [L70] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L71] Call `child.update` with "user_submitted".
    child.update('user_submitted');
    // [L72] Assert that `runner.getActive?.('owner-a')?.status` strictly equals "user_submitted".
    expect(runner.getActive?.('owner-a')?.status).toBe('user_submitted');
    // [L73] Assert that a callback that returns the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments throws an error matching the result of `expect.objectContaining` using an object containing code: "JOB_ACTIVE".
    expect(() => runner.create('owner-a', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    // [L74] Call `child.update` with "browser_closed".
    child.update('browser_closed');
    // [L75] Close `child` and release its test resources.
    child.close();
    // [L76] Assert that the result of `runner.getActive` using "owner-a" is undefined.
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    // [L77] Assert that `runner.create('owner-b', syntheticPayload()).status` strictly equals "queued".
    expect(runner.create('owner-b', syntheticPayload()).status).toBe('queued');
  // [L78] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L79] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L80] Register a test that "recovers from a failed spawn when close occurs without an exit event".
  it('recovers from a failed spawn when close occurs without an exit event', () => {
    // [L81] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L82] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L83] Call `child.finishTransfer` with a new `Error` instance initialized with "Synthetic transport failure".
    child.finishTransfer(new Error('Synthetic transport failure'));
    // [L84] Call `child.emit` with "error", a new `Error` instance initialized with "Synthetic spawn failure with internal details".
    child.emit('error', new Error('Synthetic spawn failure with internal details'));
    // [L85] Close `child` and release its test resources.
    child.close();
    // [L86] Assert that the result of `runner.get` using "owner-a", `job.id` contains the expected object fields an object containing status: "failed", message: "The Windows preparation worker could not start.".
    expect(runner.get('owner-a', job.id)).toMatchObject({ status: 'failed', message: 'The Windows preparation worker could not start.' });
    // [L87] Assert that the result of `runner.getActive` using "owner-a" is undefined.
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    // [L88] Assert that a callback that returns the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments does not satisfy: throws an error.
    expect(() => runner.create('owner-a', syntheticPayload())).not.toThrow();
  // [L89] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L90] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L91] Register a parameterized test that "wipes parent PDF buffers after IPC callback (transfer failed: %s)".
  it.each([false, true])('wipes parent PDF buffers after IPC callback (transfer failed: %s)', (failed) => {
    // [L92] Declare `payload` as the result of `syntheticPayload` with no arguments.
    const payload = syntheticPayload();
    // [L93] Declare `expectedUrla` as the result of `Buffer.from` using `payload.urla.buffer`.
    const expectedUrla = Buffer.from(payload.urla.buffer);
    // [L94] Declare `expectedContract` as the result of `Buffer.from` using `payload.salesContract!.buffer`.
    const expectedContract = Buffer.from(payload.salesContract!.buffer);
    // [L95] Declare `job` as the result of `runner.create` using "owner-a", `payload`.
    const job = runner.create('owner-a', payload);
    // [L96] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L97] Assert that `payload.urla.buffer` deeply equals `expectedUrla`.
    expect(payload.urla.buffer).toEqual(expectedUrla);
    // [L98] Complete the synthetic IPC transfer with an Error in the failure case or null to indicate success, triggering the parent-buffer cleanup callback.
    child.finishTransfer(failed ? new Error('Synthetic IPC failure') : null);
    // [L99] Assert every byte in the parent URLA buffer is zero after IPC transfer completion.
    expect(payload.urla.buffer.every(byte => byte === 0)).toBe(true);
    // [L100] Assert every byte in the parent sales-contract buffer is zero after IPC transfer completion.
    expect(payload.salesContract!.buffer.every(byte => byte === 0)).toBe(true);
    // [L101] Assert that `child.transferredUrla` deeply equals `expectedUrla`.
    expect(child.transferredUrla).toEqual(expectedUrla);
    // [L102] Assert that `child.transferredContract` deeply equals `expectedContract`.
    expect(child.transferredContract).toEqual(expectedContract);
    // [L103] Run the following branch when `failed`.
    if (failed) {
      // [L104] Assert that `child.kill` was called exactly once.
      expect(child.kill).toHaveBeenCalledOnce();
      // [L105] Assert that `runner.get('owner-a', job.id)?.status` strictly equals "failed".
      expect(runner.get('owner-a', job.id)?.status).toBe('failed');
    // [L106] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L107] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L108] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L109] Register a test that "asks stalled preparation to stop without killing its review browser or releasing its slot".
  it('asks stalled preparation to stop without killing its review browser or releasing its slot', () => {
    // [L110] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L111] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L112] Call `child.finishTransfer` without arguments.
    child.finishTransfer();
    // [L113] Call `vi.advanceTimersByTime` with 12 times 60 times 1000.
    vi.advanceTimersByTime(12 * 60 * 1000);
    // [L114] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L115] Assert that `child.controls` deeply equals an array containing "stop_preparation".
    expect(child.controls).toEqual(['stop_preparation']);
    // [L116] Assert that `runner.get('owner-a', job.id)?.message` contains "keeping the R3 browser open".
    expect(runner.get('owner-a', job.id)?.message).toContain('keeping the R3 browser open');
    // [L117] Assert that a callback that returns the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments throws an error matching the result of `expect.objectContaining` using an object containing code: "JOB_ACTIVE".
    expect(() => runner.create('owner-a', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    // [L118] Call `child.update` with "awaiting_review".
    child.update('awaiting_review');
    // [L119] Call `vi.advanceTimersByTime` with 6 times 60 times 60 times 1000.
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    // [L120] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L121] Assert that `runner.getActive?.('owner-a')?.status` strictly equals "awaiting_review".
    expect(runner.getActive?.('owner-a')?.status).toBe('awaiting_review');
    // [L122] Assert that the result of `runner.getActive` using "owner-b" is undefined.
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    // [L123] Call `child.update` with "browser_closed".
    child.update('browser_closed');
    // [L124] Close `child` and release its test resources.
    child.close();
    // [L125] Assert that a callback that returns the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments does not satisfy: throws an error.
    expect(() => runner.create('owner-a', syntheticPayload())).not.toThrow();
  // [L126] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L127] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L128] Register a test that "keeps a long manual sign-in wait active and recoverable only by its owning session".
  it('keeps a long manual sign-in wait active and recoverable only by its owning session', () => {
    // [L129] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L130] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L131] Call `child.finishTransfer` without arguments.
    child.finishTransfer();
    // [L132] Call `child.update` with "awaiting_login".
    child.update('awaiting_login');
    // [L133] Call `vi.advanceTimersByTime` with 6 times 60 times 60 times 1000.
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    // [L134] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L135] Assert that `runner.get('owner-a', job.id)?.status` strictly equals "awaiting_login".
    expect(runner.get('owner-a', job.id)?.status).toBe('awaiting_login');
    // [L136] Assert that the result of `runner.getActive` using "owner-a" contains the expected object fields an object containing id: `job.id`, status: "awaiting_login".
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: job.id, status: 'awaiting_login' });
    // [L137] Assert that the result of `runner.get` using "owner-b", `job.id` is undefined.
    expect(runner.get('owner-b', job.id)).toBeUndefined();
    // [L138] Assert that the result of `runner.getActive` using "owner-b" is undefined.
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    // [L139] Assert that a callback that returns the result of `runner.create` using "owner-b", the result of `syntheticPayload` with no arguments throws an error matching the result of `expect.objectContaining` using an object containing code: "JOB_ACTIVE".
    expect(() => runner.create('owner-b', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    // [L140] Call `child.update` with "browser_closed".
    child.update('browser_closed');
    // [L141] Close `child` and release its test resources.
    child.close();
    // [L142] Assert that the result of `runner.getActive` using "owner-a" is undefined.
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    // [L143] Assert that a callback that returns the result of `runner.create` using "owner-b", the result of `syntheticPayload` with no arguments does not satisfy: throws an error.
    expect(() => runner.create('owner-b', syntheticPayload())).not.toThrow();
  // [L144] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L145] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L146] Register a test that "resumes the remaining preparation budget after manual sign-in completes".
  it('resumes the remaining preparation budget after manual sign-in completes', () => {
    // [L147] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L148] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L149] Call `child.finishTransfer` without arguments.
    child.finishTransfer();
    // [L150] Call `vi.advanceTimersByTime` with 2 times 60 times 1000.
    vi.advanceTimersByTime(2 * 60 * 1000);
    // [L151] Call `child.update` with "awaiting_login".
    child.update('awaiting_login');
    // [L152] Call `vi.advanceTimersByTime` with 60 times 60 times 1000.
    vi.advanceTimersByTime(60 * 60 * 1000);
    // [L153] Call `child.update` with "preparing".
    child.update('preparing');
    // [L154] Call `vi.advanceTimersByTime` with 10 times 60 times 1000 minus 1.
    vi.advanceTimersByTime(10 * 60 * 1000 - 1);
    // [L155] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L156] Assert that `runner.get('owner-a', job.id)?.status` strictly equals "preparing".
    expect(runner.get('owner-a', job.id)?.status).toBe('preparing');
    // [L157] Call `vi.advanceTimersByTime` with 1.
    vi.advanceTimersByTime(1);
    // [L158] Assert that `child.kill` does not satisfy: was called.
    expect(child.kill).not.toHaveBeenCalled();
    // [L159] Assert that `child.controls` deeply equals an array containing "stop_preparation".
    expect(child.controls).toEqual(['stop_preparation']);
    // [L160] Assert that `runner.get('owner-a', job.id)?.status` strictly equals "preparing".
    expect(runner.get('owner-a', job.id)?.status).toBe('preparing');
  // [L161] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L162] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L163] Register a parameterized test that "disarms the resumed watchdog on %s".
  it.each(['awaiting_review', 'failed', 'browser_closed'] as const)('disarms the resumed watchdog on %s', (status) => {
    // [L164] Declare `job` as the result of `runner.create` using "owner-a", the result of `syntheticPayload` with no arguments.
    const job = runner.create('owner-a', syntheticPayload());
    // [L165] Declare `child` as `children[0]`.
    const child = children[0]!;
    // [L166] Call `child.finishTransfer` without arguments.
    child.finishTransfer();
    // [L167] Call `child.update` with "awaiting_login".
    child.update('awaiting_login');
    // [L168] Call `vi.advanceTimersByTime` with 60 times 60 times 1000.
    vi.advanceTimersByTime(60 * 60 * 1000);
    // [L169] Call `child.update` with "preparing".
    child.update('preparing');
    // [L170] Call `vi.advanceTimersByTime` with 60 times 1000.
    vi.advanceTimersByTime(60 * 1000);
    // [L171] Call `child.update` with `status`.
    child.update(status);
    // [L172] Call `vi.advanceTimersByTime` with 60 times 60 times 1000.
    vi.advanceTimersByTime(60 * 60 * 1000);
    // [L173] Assert that `child.kill` does not satisfy: was called.
    if (status === 'browser_closed') expect(child.kill).toHaveBeenCalledOnce();
    else expect(child.kill).not.toHaveBeenCalled();
    // [L174] Assert that `runner.get('owner-a', job.id)?.status` strictly equals `status`.
    expect(runner.get('owner-a', job.id)?.status).toBe(status);
  // [L175] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L176] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L177] Register a test that "starts workers without inherited API credentials, tracing, proxies, or Node preload hooks".
  it('starts workers without inherited API credentials, tracing, proxies, or Node preload hooks', () => {
    // [L178] Declare `excludedNames` as the result of `[ 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'APPRAISAL_AI_API_KEY', 'R3_PASSWORD', 'LANGSMITH_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGL...` using a callback that returns an array containing `name`, the result of `name.toLowerCase` with no arguments.
    const excludedNames = [
      // [L179] Include 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'APPRAISAL_AI_API_KEY', 'R3_PASSWORD', 'LANGSMITH_API_KEY' in the names that the isolated process must not inherit.
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'APPRAISAL_AI_API_KEY', 'R3_PASSWORD', 'LANGSMITH_API_KEY',
      // [L180] Include 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS', 'GOOGLE_GENAI_USE_VERTEXAI' in the names that the isolated process must not inherit.
      'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS', 'GOOGLE_GENAI_USE_VERTEXAI',
      // [L181] Include 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_BASE_URL', 'GEMINI_BASE_URL' in the names that the isolated process must not inherit.
      'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_BASE_URL', 'GEMINI_BASE_URL',
      // [L182] Include 'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL', 'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT' in the names that the isolated process must not inherit.
      'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL', 'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT',
      // [L183] Include 'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL' in the names that the isolated process must not inherit.
      'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL',
      // [L184] Include 'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT' in the names that the isolated process must not inherit.
      'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT',
      // [L185] Include 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NODE_OPTIONS' in the names that the isolated process must not inherit.
      'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NODE_OPTIONS',
    // [L186] Expand each disallowed environment-variable name into its original and lowercase spellings to test case-insensitive isolation.
    ].flatMap(name => [name, name.toLowerCase()]);
    // [L187] Set every excluded environment name, including each tested case variant, to a synthetic marker that must not reach the isolated worker.
    for (const name of excludedNames) vi.stubEnv(name, 'synthetic-should-not-inherit');
    // [L188] Call `runner.create` with "owner-a", the result of `syntheticPayload` with no arguments.
    runner.create('owner-a', syntheticPayload());
    // [L189] Declare `options` as `vi.mocked(fork).mock.calls[0]?.[2]`.
    const options = vi.mocked(fork).mock.calls[0]?.[2];
    // [L190] Assert that `options` contains the expected object fields an object containing windowsHide: true, serialization: "advanced", stdio: an array containing "ignore", "ignore", "ignore", "ipc".
    expect(options).toMatchObject({ windowsHide: true, serialization: 'advanced', stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    // [L191] Assert that the fork options omit every excluded environment variable and case variant.
    for (const name of excludedNames) expect(options?.env?.[name]).toBeUndefined();
    // [L192] Assert that `options?.env?.LANGSMITH_TRACING` strictly equals "false".
    expect(options?.env?.LANGSMITH_TRACING).toBe('false');
    // [L193] Assert that `options?.env?.LANGCHAIN_TRACING_V2` strictly equals "false".
    expect(options?.env?.LANGCHAIN_TRACING_V2).toBe('false');
  // [L194] Close the callback or control-flow body and finish the surrounding syntax.
  });

  it('reuses the owning worker only after cleanup-ready and tracks the newest job explicitly', () => {
    const first = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    child.update('awaiting_review');
    expect(runner.get('owner-a', first.id)?.canStartAnother).toBe(false);
    expect(() => runner.create('owner-a', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    child.ready();
    expect(runner.get('owner-a', first.id)?.canStartAnother).toBe(true);
    expect(() => runner.create('owner-b', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    const second = runner.create('owner-a', syntheticPayload());
    child.finishTransfer();
    expect(children).toHaveLength(1);
    expect(second.id).not.toBe(first.id);
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: second.id, status: 'queued', canStartAnother: false });
    child.update('browser_closed', first.id);
    child.ready(true, first.id);
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: second.id, status: 'queued', canStartAnother: false });
    vi.advanceTimersByTime(12 * 60 * 1000);
    expect(child.stopJobIds).toEqual([second.id]);
    child.update('awaiting_review');
    child.ready();
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: second.id, canStartAnother: true });
  });

  it('releases a closed browser without waiting for worker exit and ignores retired callbacks', () => {
    const first = runner.create('owner-a', syntheticPayload());
    const old = children[0]!;
    old.finishTransfer();
    old.update('awaiting_review');
    old.ready();
    old.update('browser_closed');
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    const second = runner.create('owner-b', syntheticPayload());
    const next = children[1]!;
    next.finishTransfer();
    old.update('preparing');
    old.emit('error', new Error('retired worker error'));
    vi.advanceTimersByTime(5000);
    expect(old.kill).toHaveBeenCalledOnce();
    expect(next.kill).not.toHaveBeenCalled();
    old.close();
    expect(runner.get('owner-a', first.id)?.status).toBe('browser_closed');
    expect(runner.getActive?.('owner-b')).toMatchObject({ id: second.id, status: 'queued' });
  });

  it('reaps a closed worker promptly when cleanup acknowledges readiness', () => {
    runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer(); child.update('browser_closed');
    expect(child.kill).not.toHaveBeenCalled();
    child.ready(false);
    expect(child.kill).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(5000);
    expect(child.kill).toHaveBeenCalledOnce();
  });

  it('keeps failure locked until cleanup and frees a browserless worker on ready', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer(); child.update('failed');
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: job.id, status: 'failed', canStartAnother: false });
    expect(() => runner.create('owner-a', syntheticPayload())).toThrow();
    child.ready(false);
    expect(runner.get('owner-a', job.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    expect(() => runner.create('owner-b', syntheticPayload())).not.toThrow();
  });

  it('does not kill the existing review form if transfer of the next documents fails', () => {
    const first = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer(); child.update('awaiting_review'); child.ready();
    const nextPayload = syntheticPayload();
    const second = runner.create('owner-a', nextPayload);
    child.finishTransfer(new Error('synthetic transfer failure'));
    expect(child.kill).not.toHaveBeenCalled();
    expect(nextPayload.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(runner.get('owner-a', second.id)).toMatchObject({ status: 'failed', canStartAnother: false, message: expect.stringContaining('remains open') });
    // An unsent command leaves the retained session's original closure callback in place.
    child.update('browser_closed', first.id);
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    expect(runner.get('owner-a', second.id)?.canStartAnother).toBe(true);
    expect(() => runner.create('owner-a', syntheticPayload())).not.toThrow();
  });
  it('handles a synchronous IPC failure without discarding the retained review browser', () => {
    runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer(); child.update('awaiting_review'); child.ready();
    vi.spyOn(child, 'send').mockImplementation(() => { throw new Error('synthetic disconnected IPC'); });
    const payload = syntheticPayload();
    const next = runner.create('owner-a', payload);
    expect(next).toMatchObject({ status: 'failed', canStartAnother: false });
    expect(payload.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('handles a synchronous stop-message failure without killing a live review browser', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    vi.spyOn(child, 'send').mockImplementation(() => { throw new Error('synthetic disconnected IPC'); });
    expect(() => vi.advanceTimersByTime(12 * 60 * 1000)).not.toThrow();
    expect(runner.get('owner-a', job.id)).toMatchObject({ status: 'preparing', message: expect.stringContaining('Could not contact'), canStartAnother: false });
    expect(child.kill).not.toHaveBeenCalled();
  });
// [L195] Close the callback or control-flow body and finish the surrounding syntax.
});
