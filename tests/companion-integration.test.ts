import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request as httpRequest, type Server } from 'node:http';
import { createApp } from '../src/app.js';
import { resolveHosting } from '../src/hosting.js';
import { createCompanionClient } from '../src/companion-client.js';
import type { JobRunner } from '../src/jobs.js';
import type { JobView } from '../src/domain.js';

const origin = 'https://fixture.example.com';
const host = 'fixture.example.com';
const accessKey = 'synthetic-integration-access-code-123456789';
const pdf = Buffer.from('%PDF-1.7\n% synthetic integration document\n%%EOF');
const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

describe('hosted site and Windows companion together', () => {
  it('recovers lost delivery and ACK responses without duplicating preparation, then prepares a successor', async () => {
    const { app, runner: relay } = createApp({ hosting: resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin }), accessKey });
    cleanups.push(() => relay.shutdown());
    const server = await new Promise<Server>(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    cleanups.push(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Fixture server did not start');
    const localOrigin = `http://127.0.0.1:${address.port}`;
    const browser = request(server);
    const login = await browser.post('/api/login').set('Host', host).set('Origin', origin).send({ accessKey }).expect(200);
    const cookie = login.headers['set-cookie']![0]!.split(';')[0]!;
    const session = await browser.get('/api/session').set('Host', host).set('Cookie', cookie).expect(200);
    const csrf = session.body.csrfToken as string;
    const pairing = await browser.post('/api/pairing').set('Host', host).set('Cookie', cookie).set('X-CSRF-Token', csrf).expect(200);

    const views = new Map<string, JobView>();
    let active: JobView | undefined;
    let count = 0;
    const local: JobRunner = {
      create: vi.fn((_owner, payload) => {
        expect(payload.input).toMatchObject({ provider: 'xai', model: 'synthetic-model', apiKey: 'synthetic-provider-key-123456789' });
        expect(payload.urla.buffer.equals(pdf)).toBe(true);
        active = { id: `local-${++count}`, status: 'extracting', message: 'Reading synthetic documents.', canStartAnother: false };
        views.set(active.id, active);
        return active;
      }),
      get: (_owner, id) => views.get(id), getActive: () => active, shutdown: vi.fn(),
    };
    let dropDelivery = true;
    let dropAck = true;
    const transport: typeof fetch = async (input, init) => {
      // Only this test transport maps the configured HTTPS origin to its local HTTP fixture.
      const path = new URL(String(input)).pathname;
      const headers = new Headers(init?.headers);
      headers.set('Host', host);
      const result = await new Promise<{ status: number; text: string }>((resolve, reject) => {
        const req = httpRequest(`${localOrigin}${path}`, { method: 'POST', headers: Object.fromEntries(headers), signal: init?.signal ?? undefined }, res => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve({ status: res.statusCode!, text: Buffer.concat(chunks).toString('utf8') }));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.end(String(init?.body));
      });
      const text = result.text;
      const body = JSON.parse(text) as { job?: unknown };
      if (path.endsWith('/exchange') && dropDelivery && body.job) { dropDelivery = false; throw new Error('Synthetic lost delivery response'); }
      if (path.endsWith('/exchange') && dropAck && JSON.parse(String(init?.body)).acceptedJobId) { dropAck = false; throw new Error('Synthetic lost acknowledgement response'); }
      return new Response(text, { status: result.status, headers: { 'content-type': 'application/json' } });
    };
    const companion = createCompanionClient({ origin, pairingToken: pairing.body.token, runner: local, fetch: transport });
    await companion.connect();
    const upload = () => browser.post('/api/jobs').set('Host', host).set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf)
      .field({ provider: 'xai', model: 'synthetic-model', apiKey: 'synthetic-provider-key-123456789', loanNumber: '685-2012345', paymentMethod: 'Invoice' }).attach('urla', pdf, 'fixture.pdf');
    const first = await upload().expect(202);
    await expect(companion.exchangeOnce()).rejects.toMatchObject({ problem: 'connection' });
    expect(local.create).not.toHaveBeenCalled();
    await companion.exchangeOnce();
    expect(local.create).toHaveBeenCalledTimes(1);
    await expect(companion.exchangeOnce()).rejects.toMatchObject({ problem: 'connection' });
    await companion.exchangeOnce();
    expect(local.create).toHaveBeenCalledTimes(1);
    expect(local.shutdown).not.toHaveBeenCalled();
    const progress = await browser.get(`/api/jobs/${first.body.job.id}`).set('Host', host).set('Cookie', cookie).expect(200);
    expect(progress.body.job).toMatchObject({ status: 'extracting', canStartAnother: false });
    Object.assign(active!, { status: 'awaiting_review', message: 'Review in the synthetic local window.', canStartAnother: true });
    await companion.exchangeOnce();
    const next = await upload().expect(202);
    expect(next.body.job.id).not.toBe(first.body.job.id);
    await companion.exchangeOnce();
    await companion.exchangeOnce();
    expect(local.create).toHaveBeenCalledTimes(2);
    expect(local.shutdown).not.toHaveBeenCalled();
    relay.shutdown();
    await expect(companion.exchangeOnce()).rejects.toMatchObject({ problem: 'connection' });
    expect(companion.hasActiveBrowser()).toBe(true);
    expect(local.shutdown).not.toHaveBeenCalled();
  });
});
