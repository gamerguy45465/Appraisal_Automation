import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODEL, MAX_PDF_BYTES, type JobPayload, type JobView } from '../src/domain.js';
import { createRelayJobRunner, type RelayJobRunner } from '../src/relay.js';
import { deserializeJobPayload, serializeJobPayload, type RelayExchangeInput } from '../src/companion-protocol.js';

const OWNER = 'synthetic-browser-session';
function payload(): JobPayload {
  return {
    input: { provider: 'openai', model: DEFAULT_MODEL, apiKey: 'synthetic-key-never-real-123', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') },
  };
}
function update(job: JobView, status: JobView['status'] = 'awaiting_review', browserOpen = true): NonNullable<RelayExchangeInput['update']> {
  return { id: job.id, status, browserOpen, message: 'Synthetic preparation state.', canStartAnother: ['awaiting_review', 'failed', 'browser_closed'].includes(status) };
}

describe('Azure companion relay isolation and delivery', () => {
  let runner: RelayJobRunner;
  beforeEach(() => { vi.useFakeTimers(); runner = createRelayJobRunner(); });
  afterEach(() => { runner.shutdown(); vi.useRealTimers(); });
  const connect = (): string => runner.connect(runner.pair(OWNER).token).token;

  it('requires a single-use random pairing code and separates the connection bearer', () => {
    const pairing = runner.pair(OWNER);
    expect(pairing.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(runner.state(OWNER)).toEqual({ paired: true, connected: false });
    expect(() => runner.connect('invalid')).toThrow('invalid or expired');
    const connected = runner.connect(pairing.token);
    expect(connected.token).not.toBe(pairing.token);
    expect(() => runner.connect(pairing.token)).toThrow('invalid or expired');
    expect(() => runner.exchange(pairing.token, { sequence: 0 })).toThrow('connection expired');
    expect(runner.exchange(connected.token, { sequence: 0 })).toEqual({});
    expect(runner.state(OWNER)).toEqual({ paired: true, connected: true });
    expect(runner.state('other-owner')).toEqual({ paired: false, connected: false });
  });

  it('expires unused pairing codes and 24-hour connection credentials', () => {
    const pairing = runner.pair(OWNER);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(() => runner.connect(pairing.token)).toThrow('invalid or expired');
    const bearer = connect();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(runner.state(OWNER)).toEqual({ paired: false, connected: false });
    expect(() => runner.exchange(bearer, { sequence: 0 })).toThrow('connection expired');
  });

  it('binds jobs and companion status to the exact browser session', () => {
    const bearer = connect();
    expect(() => runner.create('other-owner', payload())).toThrow('this session');
    const job = runner.create(OWNER, payload());
    expect(runner.get('other-owner', job.id)).toBeUndefined();
    expect(runner.getActive('other-owner')).toBeUndefined();
    expect(() => runner.exchange(bearer, { sequence: 0, acceptedJobId: randomUUID() })).toThrow('does not belong');
    expect(() => runner.pair('other-owner')).toThrow('Finish the current preparation');
  });

  it('rejects job creation while offline, and resumes with an authenticated heartbeat', () => {
    const bearer = connect();
    vi.advanceTimersByTime(30001);
    expect(runner.state(OWNER)).toEqual({ paired: true, connected: false });
    expect(() => runner.create(OWNER, payload())).toThrow('Connect your Windows companion');
    runner.exchange(bearer, { sequence: 0 });
    expect(runner.create(OWNER, payload()).status).toBe('queued');
  });

  it('redelivers the same cloud job until acceptance, then erases PDFs and its key', () => {
    const bearer = connect();
    const documents = payload();
    const originalPdf = Buffer.from(documents.urla.buffer);
    const job = runner.create(OWNER, documents);
    const first = runner.exchange(bearer, { sequence: 0 });
    const retry = runner.exchange(bearer, { sequence: 1 });
    expect(retry).toEqual(first);
    expect(first.job?.id).toBe(job.id);
    expect(documents.urla.buffer).toEqual(originalPdf);
    expect(runner.exchange(bearer, { sequence: 2, acceptedJobId: job.id, update: update(job, 'extracting') })).toEqual({});
    expect(documents.urla.buffer.every(value => value === 0)).toBe(true);
    expect(documents.salesContract!.buffer.every(value => value === 0)).toBe(true);
    expect(documents.input.apiKey).toBe('');
    // Serializing the transfer made an independent key object, so wiping does not corrupt the response.
    expect(first.job?.payload.input.apiKey).toBe('synthetic-key-never-real-123');
    expect(runner.get(OWNER, job.id)?.status).toBe('extracting');
  });

  it('rejects acceptance before delivery and a status before acceptance', () => {
    const bearer = connect();
    const job = runner.create(OWNER, payload());
    expect(() => runner.exchange(bearer, { sequence: 0, acceptedJobId: job.id })).toThrow('not available for acceptance');
    runner.exchange(bearer, { sequence: 0 });
    expect(() => runner.exchange(bearer, { sequence: 1, update: update(job) })).toThrow('invalid preparation state');
    expect(runner.get(OWNER, job.id)?.status).toBe('queued');
  });

  it('validates the complete update before consuming accepted document data', () => {
    const bearer = connect();
    const documents = payload();
    const job = runner.create(OWNER, documents);
    runner.exchange(bearer, { sequence: 0 });
    expect(() => runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: { ...update(job, 'preparing'), canStartAnother: true } })).toThrow('invalid preparation state');
    expect(documents.input.apiKey).not.toBe('');
    expect(runner.exchange(bearer, { sequence: 2 }).job?.id).toBe(job.id);
  });

  it('keeps an in-flight or handed-off browser locked against re-pairing', () => {
    const bearer = connect();
    const job = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: update(job) });
    expect(() => runner.pair(OWNER)).toThrow('close its R3 browser');
    expect(runner.getActive(OWNER)?.id).toBe(job.id);
    runner.exchange(bearer, { sequence: 2, update: update(job, 'browser_closed', false) });
    expect(runner.getActive(OWNER)).toBeUndefined();
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('ignores stale-order callbacks during the next queue and repeated old sequence numbers', () => {
    const bearer = connect();
    const first = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: first.id, update: update(first) });
    const second = runner.create(OWNER, payload());
    const response = runner.exchange(bearer, { sequence: 2, acceptedJobId: first.id, update: update(first, 'browser_closed', false) });
    expect(response.job?.id).toBe(second.id);
    expect(runner.getActive(OWNER)?.id).toBe(second.id);
    runner.exchange(bearer, { sequence: 3, acceptedJobId: second.id, update: update(second, 'preparing') });
    runner.exchange(bearer, { sequence: 2, acceptedJobId: second.id, update: update(second, 'browser_closed', false) });
    expect(runner.get(OWNER, second.id)?.status).toBe('preparing');
    expect(() => runner.create(OWNER, payload())).toThrow('Wait until preparation');
  });

  it('expires undelivered PDFs without losing ownership of the previous review browser', () => {
    const bearer = connect();
    const first = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: first.id, update: update(first) });
    const documents = payload();
    const second = runner.create(OWNER, documents);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(documents.urla.buffer.every(value => value === 0)).toBe(true);
    expect(documents.input.apiKey).toBe('');
    expect(runner.get(OWNER, second.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(() => runner.pair(OWNER)).toThrow('close its R3 browser');
    runner.exchange(bearer, { sequence: 2 });
    expect(runner.create(OWNER, payload()).status).toBe('queued');
  });

  it('wipes an expired uncertain delivery and never automatically reassigns it', () => {
    const bearer = connect();
    const documents = payload();
    const job = runner.create(OWNER, documents);
    runner.exchange(bearer, { sequence: 0 });
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(documents.urla.buffer.every(value => value === 0)).toBe(true);
    expect(runner.get(OWNER, job.id)).toMatchObject({ status: 'failed', canStartAnother: false });
    expect(runner.exchange(bearer, { sequence: 1 })).toEqual({});
    expect(() => runner.create(OWNER, payload())).toThrow('Wait until preparation');
    expect(() => runner.pair(OWNER)).toThrow('close its R3 browser');
    // A delayed valid acknowledgment can still recover the same job and its visible review.
    runner.exchange(bearer, { sequence: 2, acceptedJobId: job.id, update: update(job) });
    expect(runner.get(OWNER, job.id)).toMatchObject({ status: 'awaiting_review', canStartAnother: true });
  });

  it('observes predecessor closure after an undelivered successor expires without replacing its view', () => {
    const bearer = connect();
    const first = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: first.id, update: update(first) });
    const second = runner.create(OWNER, payload());
    vi.advanceTimersByTime(5 * 60 * 1000);
    runner.exchange(bearer, { sequence: 2, acceptedJobId: first.id, update: update(first, 'browser_closed', false) });
    expect(runner.get(OWNER, second.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(runner.getActive(OWNER)).toBeUndefined();
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('rejects oversized, unknown and contradictory status fields with fixed errors', () => {
    const bearer = connect();
    expect(() => runner.exchange(bearer, { sequence: 0, arbitraryCommand: 'submit' })).toThrow('invalid status update');
    const job = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    expect(() => runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: { ...update(job), message: 'x'.repeat(2001) } })).toThrow('invalid status update');
    expect(() => runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: update(job, 'browser_closed', true) })).toThrow('invalid preparation state');
  });

  it('shuts down without sending a browser-close operation and wipes pending documents', () => {
    connect();
    const documents = payload();
    runner.create(OWNER, documents);
    runner.shutdown();
    expect(documents.urla.buffer.every(value => value === 0)).toBe(true);
    expect(documents.input.apiKey).toBe('');
    expect(runner.state(OWNER)).toEqual({ paired: false, connected: false });
    expect(() => runner.pair(OWNER)).toThrow('shutting down');
  });

  it('allows graceful companion exit after browser closure without opening a new-order race', () => {
    const bearer = connect();
    const job = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: update(job) });
    runner.exchange(bearer, { sequence: 2, stopping: true, update: update(job) });
    expect(runner.state(OWNER).connected).toBe(false);
    expect(() => runner.create(OWNER, payload())).toThrow('Connect your Windows companion');
    expect(() => runner.pair(OWNER)).toThrow('close its R3 browser');
    runner.exchange(bearer, { sequence: 3, stopping: true, update: update(job, 'browser_closed', false) });
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('wipes a never-delivered queued order when its companion stops', () => {
    const bearer = connect();
    const documents = payload();
    const job = runner.create(OWNER, documents);
    expect(runner.exchange(bearer, { sequence: 0, stopping: true })).toEqual({});
    expect(documents.input.apiKey).toBe('');
    expect(runner.get(OWNER, job.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('accepts an explicit never-started decline after stop interrupts a delivered response', () => {
    const bearer = connect();
    const documents = payload();
    const job = runner.create(OWNER, documents);
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, stopping: true, declinedJobId: job.id });
    expect(documents.input.apiKey).toBe('');
    expect(runner.get(OWNER, job.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(runner.getActive(OWNER)).toBeUndefined();
    // Repeated acknowledgment is harmless if the first response was lost.
    expect(runner.exchange(bearer, { sequence: 2, stopping: true, declinedJobId: job.id })).toEqual({});
    expect(() => runner.exchange(bearer, { sequence: 3, acceptedJobId: job.id })).toThrow('not available for acceptance');
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('never declines an unknown, undelivered or already accepted job', () => {
    const bearer = connect();
    const job = runner.create(OWNER, payload());
    expect(() => runner.exchange(bearer, { sequence: 0, declinedJobId: randomUUID() })).toThrow('does not belong');
    expect(() => runner.exchange(bearer, { sequence: 0, declinedJobId: job.id })).toThrow('never started');
    runner.exchange(bearer, { sequence: 0 });
    expect(() => runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, declinedJobId: job.id })).toThrow('never started');
    runner.exchange(bearer, { sequence: 1, acceptedJobId: job.id, update: update(job, 'preparing') });
    expect(() => runner.exchange(bearer, { sequence: 2, stopping: true, declinedJobId: job.id })).toThrow('never started');
    expect(runner.get(OWNER, job.id)).toMatchObject({ status: 'preparing', canStartAnother: false });
  });

  it('preserves the prior review browser when a delivered successor is explicitly declined', () => {
    const bearer = connect();
    const first = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 0 });
    runner.exchange(bearer, { sequence: 1, acceptedJobId: first.id, update: update(first) });
    const second = runner.create(OWNER, payload());
    runner.exchange(bearer, { sequence: 2, acceptedJobId: first.id, update: update(first) });
    runner.exchange(bearer, { sequence: 3, stopping: true, acceptedJobId: first.id, declinedJobId: second.id, update: update(first) });
    expect(runner.get(OWNER, second.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(() => runner.pair(OWNER)).toThrow('close its R3 browser');
    runner.exchange(bearer, { sequence: 4, stopping: true, acceptedJobId: first.id, declinedJobId: second.id, update: update(first, 'browser_closed', false) });
    expect(runner.get(OWNER, second.id)).toMatchObject({ status: 'failed', canStartAnother: true });
    expect(runner.pair(OWNER).token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe('companion payload boundary', () => {
  it('round-trips validated synthetic input and both PDF documents', () => {
    const original = payload();
    const decoded = deserializeJobPayload(serializeJobPayload(original));
    expect(decoded).toEqual(original);
    expect(decoded.urla.buffer).not.toBe(original.urla.buffer);
  });

  it('rejects noncanonical base64, malformed PDFs, and oversized documents', () => {
    const valid = serializeJobPayload(payload());
    for (const badPdf of [valid.urla + '\n', Buffer.from('not a PDF').toString('base64'), 'A'.repeat(Math.ceil(MAX_PDF_BYTES / 3) * 4 + 1)]) {
      expect(() => deserializeJobPayload({ ...valid, urla: badPdf })).toThrow('invalid preparation request');
    }
    expect(() => deserializeJobPayload({ ...valid, input: { ...valid.input, loanNumber: 'bad' } })).toThrow('invalid preparation request');
    expect(() => deserializeJobPayload({ ...valid, input: { ...valid.input, arbitraryCommand: 'submit' } })).toThrow('invalid preparation request');
  });
});
