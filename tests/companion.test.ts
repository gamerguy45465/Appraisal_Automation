import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { CompanionConnectionError, createCompanionClient, validateCompanionOrigin } from '../src/companion-client.js';
import { MAX_RELAY_RESPONSE_BYTES, serializeJobPayload, type RelayExchangeInput } from '../src/companion-protocol.js';
import type { JobPayload, JobView } from '../src/domain.js';
import type { JobRunner } from '../src/jobs.js';

const origin = 'https://synthetic-app.azurewebsites.net';
const pairingToken = 'p'.repeat(43);
const sessionToken = 's'.repeat(43);
const json = (value: unknown): Response => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const payload = (): JobPayload => ({
  input: { provider: 'openai', apiKey: 'synthetic-provider-key-not-real', model: 'gpt-5.6-sol', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
  urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
  salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic sales contract') },
});
const delivery = (id = randomUUID()) => ({ job: { id, payload: serializeJobPayload(payload()) } });

class FakeRunner implements JobRunner {
  owner?: string;
  active?: string;
  readonly views = new Map<string, JobView>();
  readonly create = vi.fn((owner: string, _payload: JobPayload): JobView => {
    this.owner ??= owner;
    expect(owner).toBe(this.owner);
    const view: JobView = { id: randomUUID(), status: 'queued', message: 'Queued safely.', canStartAnother: false };
    this.views.set(view.id, view);
    this.active = view.id;
    return view;
  });
  get(owner: string, id: string): JobView | undefined { return owner === this.owner ? this.views.get(id) : undefined; }
  getActive(owner: string): JobView | undefined { return this.active ? this.get(owner, this.active) : undefined; }
  readonly shutdown = vi.fn();
  update(changes: Partial<JobView>): void {
    if (!this.active) throw new Error('No synthetic active job.');
    this.views.set(this.active, { ...this.views.get(this.active)!, ...changes });
  }
}

function fixture(responses: (Response | Error | (() => Response))[]) {
  const runner = new FakeRunner();
  const requests: { url: string; options: RequestInit; body: RelayExchangeInput }[] = [];
  const fetchRequest = vi.fn<typeof fetch>(async (url, options) => {
    requests.push({ url: String(url), options: options!, body: JSON.parse(String(options!.body)) as RelayExchangeInput });
    const response = responses.shift();
    if (response instanceof Error) throw response;
    if (typeof response === 'function') return response();
    if (!response) throw new Error('No synthetic response available.');
    return response;
  });
  const messages: string[] = [];
  const client = createCompanionClient({ origin, pairingToken, runner, fetch: fetchRequest, onMessage: message => messages.push(message), pollIntervalMs: 10 });
  return { runner, requests, fetchRequest, messages, client };
}

describe('Windows companion transport and local ownership', () => {
  it.each(['http://example.test', 'https://user:secret@example.test', 'https://example.test/path', 'https://example.test?key=secret', 'https://example.test/#fragment', 'https://EXAMPLE.test', 'https://example.test:443'])('rejects a noncanonical or non-HTTPS website origin: %s', value => {
    expect(() => validateCompanionOrigin(value)).toThrowError(CompanionConnectionError);
  });

  it('accepts a canonical HTTPS origin and connects without cookies or redirects', async () => {
    expect(validateCompanionOrigin(`${origin}/`)).toBe(origin);
    const { client, requests } = fixture([json({ token: sessionToken }), json({})]);
    await client.connect();
    await client.exchangeOnce();
    expect(requests[0]).toMatchObject({ url: `${origin}/api/companion/connect`, options: { method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${pairingToken}` } }, body: {} });
    expect(requests[1]).toMatchObject({ url: `${origin}/api/companion/exchange`, options: { headers: { Authorization: `Bearer ${sessionToken}` } }, body: { sequence: 0 } });
    expect(requests[0]!.options.signal).toBeInstanceOf(AbortSignal);
    expect(requests.map(request => request.url).join(' ')).not.toContain(pairingToken);
  });

  it('deduplicates redelivery after a lost ACK without restarting paid preparation', async () => {
    const offered = delivery();
    const { client, runner, requests } = fixture([
      json({ token: sessionToken }), json(offered), new Error('private-network-details'), json(offered), json({}),
    ]);
    await client.connect();
    await client.exchangeOnce();
    const localId = runner.active;
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'connection' });
    await client.exchangeOnce();
    await client.exchangeOnce();
    expect(runner.create).toHaveBeenCalledOnce();
    expect(runner.shutdown).not.toHaveBeenCalled();
    expect(requests[1]!.body).toEqual({ sequence: 0 });
    for (const request of requests.slice(2)) {
      expect(request.body.acceptedJobId).toBe(offered.job.id);
      expect(request.body.update).toMatchObject({ id: offered.job.id, status: 'queued', browserOpen: true, canStartAnother: false });
      expect(request.body.update?.id).not.toBe(localId);
    }
    expect(requests.slice(1).map(request => request.body.sequence)).toEqual([0, 1, 2, 3]);
  });

  it.each([
    { unexpected: 'command' },
    { job: { ...delivery().job, action: 'submit' } },
    { job: { ...delivery().job, id: 'invalid-id' } },
    { job: { ...delivery().job, payload: { ...delivery().job.payload, urla: 'not-canonical-base64' } } },
    { job: { ...delivery().job, payload: { ...delivery().job.payload, input: { ...payload().input, provider: 'unapproved' } } } },
  ])('never starts rejected response data', async malformed => {
    const { client, runner, requests } = fixture([json({ token: sessionToken }), json(malformed), json({})]);
    await client.connect();
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'protocol' });
    await client.exchangeOnce();
    expect(runner.create).not.toHaveBeenCalled();
    expect(requests[2]!.body).toEqual({ sequence: 1 });
  });

  it('ACKs only after the local runner accepts and wipes refused PDF buffers', async () => {
    const offered = delivery();
    const { client, runner, requests } = fixture([json({ token: sessionToken }), json(offered), json(offered), json({})]);
    let refused: JobPayload | undefined;
    runner.create.mockImplementationOnce((_owner, candidate) => { refused = candidate; throw new Error('Existing preparation'); });
    await client.connect();
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'busy' });
    expect(refused!.urla.buffer.every(byte => byte === 0)).toBe(true);
    expect(refused!.salesContract!.buffer.every(byte => byte === 0)).toBe(true);
    expect(refused!.input.apiKey).toBe('');
    await client.exchangeOnce();
    await client.exchangeOnce();
    expect(requests[1]!.body.acceptedJobId).toBeUndefined();
    expect(requests[2]!.body.acceptedJobId).toBeUndefined();
    expect(requests[3]!.body.acceptedJobId).toBe(offered.job.id);
    expect(runner.create).toHaveBeenCalledTimes(2);
  });

  it('keeps status and ACK associated with each successor and refuses a stale predecessor', async () => {
    const first = delivery();
    const second = delivery();
    const { client, runner, requests } = fixture([json({ token: sessionToken }), json(first), json(second), json(first), json({})]);
    await client.connect();
    await client.exchangeOnce();
    runner.update({ status: 'awaiting_review', canStartAnother: true });
    await client.exchangeOnce();
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'protocol' });
    await client.exchangeOnce();
    expect(runner.create).toHaveBeenCalledTimes(2);
    expect(requests[2]!.body).toMatchObject({ acceptedJobId: first.job.id, update: { id: first.job.id, status: 'awaiting_review' } });
    expect(requests[3]!.body).toMatchObject({ acceptedJobId: second.job.id, update: { id: second.job.id, status: 'queued' } });
    expect(requests[4]!.body.update?.id).toBe(second.job.id);
  });

  it('bounds outbound review content and reports no browser after worker closure', async () => {
    const { client, runner, requests } = fixture([json({ token: sessionToken }), json(delivery()), json({})]);
    await client.connect();
    await client.exchangeOnce();
    runner.update({ status: 'failed', message: '\u0000' + 'x'.repeat(4000), warnings: Array.from({ length: 101 }, () => '\ud800'.repeat(4000)), canStartAnother: true });
    runner.active = undefined;
    await client.exchangeOnce();
    const body = requests[2]!.body;
    expect(body.update).toMatchObject({ status: 'failed', browserOpen: false, canStartAnother: true });
    expect(body.update!.message).toHaveLength(2000);
    expect(body.update!.warnings!.length).toBeLessThanOrEqual(100);
    expect(body.update!.warnings!.every(warning => warning.length <= 2000)).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(body))).toBeLessThan(256 * 1024);
  });

  it.each([
    () => new Response('private-error-body', { status: 302, headers: { Location: 'https://different.example.test' } }),
    () => new Response('<html>private-login-page</html>', { headers: { 'Content-Type': 'text/html' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': String(MAX_RELAY_RESPONSE_BYTES + 1) } }),
  ])('rejects redirects, non-JSON content and oversized response headers', async response => {
    const { client, runner } = fixture([json({ token: sessionToken }), response()]);
    await client.connect();
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'protocol' });
    expect(runner.create).not.toHaveBeenCalled();
  });

  it('enforces the response byte limit without trusting Content-Length', async () => {
    const cancelled = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
      cancel: cancelled,
    });
    const { client, runner } = fixture([json({ token: sessionToken }), new Response(body, { headers: { 'Content-Type': 'application/json' } })]);
    await client.connect();
    await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'protocol' });
    expect(cancelled).toHaveBeenCalledOnce();
    expect(runner.create).not.toHaveBeenCalled();
  });

  it('recovers a transient relay failure while keeping the existing worker running', async () => {
    const runner = new FakeRunner();
    const offered = delivery();
    const messages: string[] = [];
    let exchanges = 0;
    const transport = vi.fn<typeof fetch>(async url => {
      if (String(url).endsWith('/connect')) return json({ token: sessionToken });
      exchanges++;
      if (exchanges === 1) return json(offered);
      if (exchanges === 2) throw new Error(`private URL secret ${payload().input.apiKey}`);
      return json(exchanges === 3 ? offered : {});
    });
    const client = createCompanionClient({ origin, pairingToken, runner, fetch: transport, pollIntervalMs: 10, onMessage(message) {
      messages.push(message);
      if (message.startsWith('Website connection restored')) { client.requestStop(); runner.active = undefined; }
    } });
    await client.run();
    expect(runner.create).toHaveBeenCalledOnce();
    expect(runner.shutdown).not.toHaveBeenCalled();
    expect(messages.join(' ')).toContain('will retry');
    expect(messages.join(' ')).not.toContain(payload().input.apiKey);
    expect(messages.join(' ')).not.toContain('private URL');
  });

  it('preserves local review on server reset and waits for closure without re-pairing', async () => {
    const runner = new FakeRunner();
    const messages: string[] = [];
    let exchanges = 0;
    const transport = vi.fn<typeof fetch>(async url => {
      if (String(url).endsWith('/connect')) return json({ token: sessionToken });
      return ++exchanges === 1 ? json(delivery()) : new Response('private-error', { status: 401 });
    });
    const client = createCompanionClient({ origin, pairingToken, runner, fetch: transport, pollIntervalMs: 10, onMessage(message) {
      messages.push(message);
      if (message.includes('expired or was reset')) {
        expect(client.hasActiveBrowser()).toBe(true);
        expect(runner.shutdown).not.toHaveBeenCalled();
        setTimeout(() => { runner.active = undefined; }, 25);
      }
    } });
    await client.run();
    expect(exchanges).toBe(2);
    expect(transport).toHaveBeenCalledTimes(3);
    expect(runner.create).toHaveBeenCalledOnce();
    expect(runner.shutdown).not.toHaveBeenCalled();
    expect(messages.join(' ')).toContain('Do not resend the current order');
  });

  it('stops accepting new work on Ctrl+C while allowing local review to finish', async () => {
    const offered = delivery();
    const { client, runner, requests } = fixture([
      json({ token: sessionToken }), json(offered), json(delivery()), json({}),
    ]);
    await client.connect();
    await client.exchangeOnce();
    runner.update({ status: 'awaiting_review', canStartAnother: true });
    client.requestStop();
    expect(client.hasActiveBrowser()).toBe(true);
    await client.exchangeOnce();
    expect(runner.create).toHaveBeenCalledOnce();
    expect(runner.shutdown).not.toHaveBeenCalled();
    expect(requests[2]!.body).toMatchObject({ stopping: true, update: { canStartAnother: true, browserOpen: true } });
    runner.active = undefined;
    await client.run();
    expect(runner.shutdown).not.toHaveBeenCalled();
  });

  it('does not reuse a one-time pairing token after its response is lost', async () => {
    const { client, fetchRequest, runner } = fixture([new Error('private-connect-failure')]);
    await expect(client.connect()).rejects.toMatchObject({ problem: 'pairing_connection' });
    await expect(client.connect()).rejects.toMatchObject({ problem: 'authorization' });
    expect(fetchRequest).toHaveBeenCalledOnce();
    expect(runner.create).not.toHaveBeenCalled();
  });

  it('fails closed if the runner cannot report whether a local worker remains active', () => {
    const runner: JobRunner = { create: vi.fn(), get: vi.fn(), shutdown: vi.fn() };
    expect(() => createCompanionClient({ origin, pairingToken, runner })).toThrowError(CompanionConnectionError);
  });

  it('passes a bounded cancellation signal to requests and hides timeout details', async () => {
    const controller = new AbortController();
    let calls = 0;
    const transport = vi.fn<typeof fetch>(async (_url, options) => {
      if (++calls === 1) return json({ token: sessionToken });
      expect(options!.signal).toBe(controller.signal);
      return await new Promise<Response>((_resolve, reject) => {
        options!.signal!.addEventListener('abort', () => reject(new Error('private timeout details')));
        queueMicrotask(() => controller.abort());
      });
    });
    const client = createCompanionClient({ origin, pairingToken, runner: new FakeRunner(), fetch: transport });
    await client.connect();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    try {
      await expect(client.exchangeOnce()).rejects.toMatchObject({ problem: 'connection', message: expect.not.stringContaining('private') });
      expect(timeout).toHaveBeenCalledWith(30_000);
    } finally { timeout.mockRestore(); }
  });

  it('releases a retired browser on graceful stop before its worker exit callback', async () => {
    const { client, runner, requests } = fixture([json({ token: sessionToken }), json(delivery()), json({})]);
    await client.connect();
    await client.exchangeOnce();
    runner.update({ status: 'browser_closed', canStartAnother: false });
    runner.active = undefined;
    client.requestStop();
    await client.run();
    expect(requests[2]!.body).toMatchObject({ stopping: true, update: { status: 'browser_closed', browserOpen: false, canStartAnother: true } });
  });

  it('declines an in-flight delivery on Ctrl+C and retries a lost final response before exiting', async () => {
    const offered = delivery();
    const runner = new FakeRunner();
    const requests: RelayExchangeInput[] = [];
    let requestStarted!: () => void;
    const started = new Promise<void>(resolve => { requestStarted = resolve; });
    let deliverResponse!: (response: Response) => void;
    const inFlight = new Promise<Response>(resolve => { deliverResponse = resolve; });
    const transport = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).endsWith('/connect')) return json({ token: sessionToken });
      requests.push(JSON.parse(String(options!.body)) as RelayExchangeInput);
      if (requests.length === 1) { requestStarted(); return await inFlight; }
      if (requests.length === 2) throw new Error('lost-final-response');
      return json({});
    });
    const client = createCompanionClient({ origin, pairingToken, runner, fetch: transport, pollIntervalMs: 10 });
    const running = client.run();
    await started;
    client.requestStop();
    deliverResponse(json(offered));
    await running;
    expect(runner.create).not.toHaveBeenCalled();
    expect(runner.shutdown).not.toHaveBeenCalled();
    expect(requests).toHaveLength(3);
    for (const request of requests.slice(1)) {
      expect(request).toMatchObject({ stopping: true, declinedJobId: offered.job.id });
      expect(request.acceptedJobId).toBeUndefined();
    }
  });

  it('declines only the unstarted successor while preserving predecessor review and identity', async () => {
    const first = delivery();
    const second = delivery();
    const runner = new FakeRunner();
    const requests: RelayExchangeInput[] = [];
    let requestStarted!: () => void;
    const started = new Promise<void>(resolve => { requestStarted = resolve; });
    let deliverResponse!: (response: Response) => void;
    const inFlight = new Promise<Response>(resolve => { deliverResponse = resolve; });
    const transport = vi.fn<typeof fetch>(async (url, options) => {
      if (String(url).endsWith('/connect')) return json({ token: sessionToken });
      requests.push(JSON.parse(String(options!.body)) as RelayExchangeInput);
      if (requests.length === 1) return json(first);
      if (requests.length === 2) { requestStarted(); return await inFlight; }
      if (requests.length === 3) {
        expect(runner.active).toBeDefined();
        runner.update({ status: 'browser_closed', canStartAnother: false });
        runner.active = undefined;
      }
      return json({});
    });
    const client = createCompanionClient({ origin, pairingToken, runner, fetch: transport, pollIntervalMs: 10 });
    await client.connect();
    await client.exchangeOnce();
    runner.update({ status: 'awaiting_review', canStartAnother: true });
    const running = client.run();
    await started;
    client.requestStop();
    deliverResponse(json(second));
    await running;
    expect(runner.create).toHaveBeenCalledOnce();
    expect(requests[2]).toMatchObject({ stopping: true, declinedJobId: second.job.id, acceptedJobId: first.job.id, update: { id: first.job.id, status: 'awaiting_review', browserOpen: true } });
    expect(requests[3]).toMatchObject({ stopping: true, acceptedJobId: first.job.id, update: { id: first.job.id, status: 'browser_closed', browserOpen: false, canStartAnother: true } });
    expect(requests[3]!.declinedJobId).toBeUndefined();
    expect(runner.shutdown).not.toHaveBeenCalled();
  });
});
