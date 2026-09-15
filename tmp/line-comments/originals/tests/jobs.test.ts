import { EventEmitter } from 'node:events';
import { fork, type ChildProcess } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJobRunner, type JobRunner } from '../src/jobs.js';
import { DEFAULT_MODEL, type JobPayload, type WorkerUpdate } from '../src/domain.js';

vi.mock('node:child_process', () => ({ fork: vi.fn() }));

class FakeWorker extends EventEmitter {
  readonly kill = vi.fn(() => true);
  transferredUrla?: Buffer;
  transferredContract?: Buffer;
  readonly controls: string[] = [];
  private transferCallback?: (error: Error | null) => void;

  send(payload: JobPayload | { type: 'stop_preparation' }, callback: (error: Error | null) => void): boolean {
    if ('type' in payload) { this.controls.push(payload.type); callback(null); return true; }
    // IPC serialization makes the child's own copy before the send callback runs.
    this.transferredUrla = Buffer.from(payload.urla.buffer);
    this.transferredContract = payload.salesContract && Buffer.from(payload.salesContract.buffer);
    this.transferCallback = callback;
    return true;
  }

  finishTransfer(error: Error | null = null): void { this.transferCallback?.(error); }
  update(status: WorkerUpdate['status']): void { this.emit('message', { type: 'status', status, message: `Synthetic ${status}` } satisfies WorkerUpdate); }
  close(): void { this.emit('close', 0, null); }
}

function syntheticPayload(): JobPayload {
  return {
    input: { provider: 'openai', apiKey: 'sk-synthetic-key-not-real',
      loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') },
  };
}

describe('isolated job process lifecycle', () => {
  let runner: JobRunner;
  let children: FakeWorker[];
  beforeEach(() => {
    vi.useFakeTimers();
    children = [];
    vi.mocked(fork).mockReset().mockImplementation(() => {
      const child = new FakeWorker();
      children.push(child);
      return child as unknown as ChildProcess;
    });
    runner = createJobRunner();
  });
  afterEach(() => {
    runner.shutdown();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('scopes job access to its session and keeps the active slot until the review browser closes', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    expect(runner.get('owner-a', job.id)?.status).toBe('queued');
    expect(runner.get('owner-b', job.id)).toBeUndefined();
    expect(runner.getActive?.('owner-a')?.id).toBe(job.id);
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    expect(() => runner.create('owner-b', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    child.update('awaiting_review');
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(child.kill).not.toHaveBeenCalled();
    child.update('user_submitted');
    expect(runner.getActive?.('owner-a')?.status).toBe('user_submitted');
    expect(() => runner.create('owner-a', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    child.update('browser_closed');
    child.close();
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    expect(runner.create('owner-b', syntheticPayload()).status).toBe('queued');
  });

  it('recovers from a failed spawn when close occurs without an exit event', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer(new Error('Synthetic transport failure'));
    child.emit('error', new Error('Synthetic spawn failure with internal details'));
    child.close();
    expect(runner.get('owner-a', job.id)).toMatchObject({ status: 'failed', message: 'The Windows preparation worker could not start.' });
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    expect(() => runner.create('owner-a', syntheticPayload())).not.toThrow();
  });

  it.each([false, true])('wipes parent PDF buffers after IPC callback (transfer failed: %s)', (failed) => {
    const payload = syntheticPayload();
    const expectedUrla = Buffer.from(payload.urla.buffer);
    const expectedContract = Buffer.from(payload.salesContract!.buffer);
    const job = runner.create('owner-a', payload);
    const child = children[0]!;
    expect(payload.urla.buffer).toEqual(expectedUrla);
    child.finishTransfer(failed ? new Error('Synthetic IPC failure') : null);
    expect(payload.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(payload.salesContract!.buffer.every(byte => byte === 0)).toBe(true);
    expect(child.transferredUrla).toEqual(expectedUrla);
    expect(child.transferredContract).toEqual(expectedContract);
    if (failed) {
      expect(child.kill).toHaveBeenCalledOnce();
      expect(runner.get('owner-a', job.id)?.status).toBe('failed');
    }
  });

  it('asks stalled preparation to stop without killing its review browser or releasing its slot', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    vi.advanceTimersByTime(12 * 60 * 1000);
    expect(child.kill).not.toHaveBeenCalled();
    expect(child.controls).toEqual(['stop_preparation']);
    expect(runner.get('owner-a', job.id)?.message).toContain('keeping the R3 browser open');
    expect(() => runner.create('owner-a', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    child.update('awaiting_review');
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    expect(child.kill).not.toHaveBeenCalled();
    expect(runner.getActive?.('owner-a')?.status).toBe('awaiting_review');
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    child.update('browser_closed');
    child.close();
    expect(() => runner.create('owner-a', syntheticPayload())).not.toThrow();
  });

  it('keeps a long manual sign-in wait active and recoverable only by its owning session', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    child.update('awaiting_login');
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    expect(child.kill).not.toHaveBeenCalled();
    expect(runner.get('owner-a', job.id)?.status).toBe('awaiting_login');
    expect(runner.getActive?.('owner-a')).toMatchObject({ id: job.id, status: 'awaiting_login' });
    expect(runner.get('owner-b', job.id)).toBeUndefined();
    expect(runner.getActive?.('owner-b')).toBeUndefined();
    expect(() => runner.create('owner-b', syntheticPayload())).toThrowError(expect.objectContaining({ code: 'JOB_ACTIVE' }));
    child.update('browser_closed');
    child.close();
    expect(runner.getActive?.('owner-a')).toBeUndefined();
    expect(() => runner.create('owner-b', syntheticPayload())).not.toThrow();
  });

  it('resumes the remaining preparation budget after manual sign-in completes', () => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    vi.advanceTimersByTime(2 * 60 * 1000);
    child.update('awaiting_login');
    vi.advanceTimersByTime(60 * 60 * 1000);
    child.update('preparing');
    vi.advanceTimersByTime(10 * 60 * 1000 - 1);
    expect(child.kill).not.toHaveBeenCalled();
    expect(runner.get('owner-a', job.id)?.status).toBe('preparing');
    vi.advanceTimersByTime(1);
    expect(child.kill).not.toHaveBeenCalled();
    expect(child.controls).toEqual(['stop_preparation']);
    expect(runner.get('owner-a', job.id)?.status).toBe('preparing');
  });

  it.each(['awaiting_review', 'failed', 'browser_closed'] as const)('disarms the resumed watchdog on %s', (status) => {
    const job = runner.create('owner-a', syntheticPayload());
    const child = children[0]!;
    child.finishTransfer();
    child.update('awaiting_login');
    vi.advanceTimersByTime(60 * 60 * 1000);
    child.update('preparing');
    vi.advanceTimersByTime(60 * 1000);
    child.update(status);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(child.kill).not.toHaveBeenCalled();
    expect(runner.get('owner-a', job.id)?.status).toBe(status);
  });

  it('starts workers without inherited API credentials, tracing, proxies, or Node preload hooks', () => {
    const excludedNames = [
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'APPRAISAL_AI_API_KEY', 'R3_PASSWORD', 'LANGSMITH_API_KEY',
      'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS', 'GOOGLE_GENAI_USE_VERTEXAI',
      'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_BASE_URL', 'GEMINI_BASE_URL',
      'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL', 'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT',
      'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL',
      'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT',
      'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NODE_OPTIONS',
    ].flatMap(name => [name, name.toLowerCase()]);
    for (const name of excludedNames) vi.stubEnv(name, 'synthetic-should-not-inherit');
    runner.create('owner-a', syntheticPayload());
    const options = vi.mocked(fork).mock.calls[0]?.[2];
    expect(options).toMatchObject({ windowsHide: true, serialization: 'advanced', stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    for (const name of excludedNames) expect(options?.env?.[name]).toBeUndefined();
    expect(options?.env?.LANGSMITH_TRACING).toBe('false');
    expect(options?.env?.LANGCHAIN_TRACING_V2).toBe('false');
  });
});
