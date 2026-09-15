import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { resolveHosting } from '../src/hosting.js';
import { createRelayJobRunner, type RelayJobRunner } from '../src/relay.js';

const origin = 'https://appraisal.example.com';
const host = 'appraisal.example.com';
const accessKey = 'synthetic-workspace-access-code-1234567890';
const pdf = Buffer.from('%PDF-1.7\n% synthetic relay fixture\n%%EOF');
const form = { provider: 'google', model: 'synthetic-model', apiKey: 'synthetic-provider-key-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' };
const relays: RelayJobRunner[] = [];

function setup() {
  const relay = createRelayJobRunner();
  relays.push(relay);
  const { app } = createApp({ hosting: resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin }), accessKey, relay });
  const client = request(app);
  const get = (path: string) => client.get(path).set('Host', host);
  const post = (path: string) => client.post(path).set('Host', host);
  const login = async () => {
    const response = await post('/api/login').set('Origin', origin).send({ accessKey }).expect(200);
    const cookie = response.headers['set-cookie']![0]!.split(';')[0]!;
    const session = await get('/api/session').set('Cookie', cookie).expect(200);
    return { cookie, csrf: session.body.csrfToken as string, response, session };
  };
  return { app, relay, get, post, login };
}

afterEach(() => { for (const relay of relays.splice(0)) relay.shutdown(); vi.restoreAllMocks(); });

describe('hosted workspace authentication and relay boundary', () => {
  it('requires a configured strong workspace secret before opening the hosted app', () => {
    const hosting = resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin });
    for (const key of [undefined, '', 'short', 'x'.repeat(31), 'with spaces'.repeat(5)]) {
      expect(() => createApp({ hosting, accessKey: key })).toThrow('APPRAISAL_ACCESS_KEY');
    }
  });

  it('serves the sign-in shell but never creates anonymous hosted sessions or accepts uploads', async () => {
    const { get, post } = setup();
    await get('/').expect(200);
    expect((await get('/api/config').expect(200)).body).toEqual({ hostingMode: 'hosted' });
    const response = await get('/api/session').expect(401);
    expect(response.body.error.code).toBe('WORKSPACE_LOGIN_REQUIRED');
    expect(response.headers['set-cookie']).toBeUndefined();
    await post('/api/jobs').expect(401);
    await post('/api/pairing').expect(401);
    await get('/api/companion-status').expect(401);
  });

  it('requires exact HTTPS browser origin and rejects unapproved hosts despite forwarded headers', async () => {
    const { app, get, post } = setup();
    await post('/api/login').send({ accessKey }).expect(403);
    await post('/api/login').set('Origin', 'http://appraisal.example.com').send({ accessKey }).expect(403);
    await post('/api/login').set('Origin', origin).set('Sec-Fetch-Site', 'cross-site').send({ accessKey }).expect(403);
    await request(app).get('/api/session').set('Host', 'attacker.example').set('X-Forwarded-Host', host).set('X-Forwarded-Proto', 'https').expect(403);
    await get('/api/session').set('X-Forwarded-Host', 'attacker.example').expect(401);
    await get('/api/session').set('Origin', `${origin}.attacker.example`).expect(403);
  });

  it('sets secure HTTP-only cookies and preserves the owning session across repeat sign-in', async () => {
    const { get, post, login } = setup();
    const signedIn = await login();
    const cookieHeader = signedIn.response.headers['set-cookie']![0]!;
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Strict');
    expect(signedIn.session.body).toMatchObject({ hostingMode: 'hosted', companion: { paired: false, connected: false } });
    expect(JSON.stringify(signedIn.session.body)).not.toContain(accessKey);
    expect(signedIn.session.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(signedIn.session.headers['content-security-policy']).toContain('upgrade-insecure-requests');
    await post('/api/login').set('Origin', origin).set('Cookie', signedIn.cookie).send({ accessKey }).expect(200);
    expect((await get('/api/session').set('Cookie', signedIn.cookie)).body.csrfToken).toBe(signedIn.csrf);
  });

  it('rejects wrong keys, limits login attempts and sanitizes malformed or oversized JSON', async () => {
    const { post } = setup();
    const invalid = await post('/api/login').set('Origin', origin).send({ accessKey: 'wrong-secret-value' }).expect(401);
    expect(JSON.stringify(invalid.body)).not.toContain('wrong-secret-value');
    const malformed = await post('/api/login').set('Origin', origin).set('Content-Type', 'application/json').send('{"accessKey":"do-not-echo"').expect(400);
    expect(JSON.stringify(malformed.body)).not.toContain('do-not-echo');
    await post('/api/login').set('Origin', origin).send({ accessKey: 'x'.repeat(3000) }).expect(413);
    for (let i = 0; i < 7; i++) await post('/api/login').set('Origin', origin).send({ accessKey: 'wrong' }).expect(401);
    await post('/api/login').set('Origin', origin).send({ accessKey }).expect(429);
  });

  it('requires session CSRF for pairing and the separate one-time bearer for companion activation', async () => {
    const { get, post, login } = setup();
    const user = await login();
    await post('/api/pairing').set('Cookie', user.cookie).expect(403);
    await post('/api/jobs').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).expect(409);
    const paired = await post('/api/pairing').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).expect(200);
    expect(paired.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await post('/api/companion/connect').send({ token: paired.body.token }).expect(401);
    const connected = await post('/api/companion/connect').set('Authorization', `Bearer ${paired.body.token}`).send({}).expect(200);
    expect(connected.body.token).not.toBe(paired.body.token);
    await post('/api/companion/connect').set('Authorization', `Bearer ${paired.body.token}`).send({}).expect(401);
    const status = await get('/api/companion-status').set('Cookie', user.cookie).expect(200);
    expect(status.body).toEqual({ paired: true, connected: true });
    expect(JSON.stringify(status.body)).not.toContain(connected.body.token);
    await post('/api/companion/submit').set('Authorization', `Bearer ${connected.body.token}`).expect(404);
  });

  it('delivers documents only to the paired companion and supports acknowledged next orders', async () => {
    const { get, post, login } = setup();
    const user = await login();
    const pair = await post('/api/pairing').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf);
    const connection = await post('/api/companion/connect').set('Authorization', `Bearer ${pair.body.token}`).send({});
    const exchange = (body: object) => post('/api/companion/exchange').set('Authorization', `Bearer ${connection.body.token}`).send(body);
    const upload = () => post('/api/jobs').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).set('Origin', origin).field(form).attach('urla', pdf, 'urla.pdf');
    const first = await upload().expect(202);
    const id = first.body.job.id as string;
    expect(JSON.stringify(first.body)).not.toContain(form.apiKey);
    const delivered = await exchange({ sequence: 0 }).expect(200);
    expect(delivered.body.job).toMatchObject({ id, payload: { input: form, urla: pdf.toString('base64') } });
    await post('/api/companion/exchange').set('Cookie', user.cookie).send({ sequence: 0 }).expect(401);
    await upload().expect(409);
    const ack = await exchange({ sequence: 1, acceptedJobId: id, update: { id, status: 'awaiting_review', message: 'Review in your local R3 window.', canStartAnother: true, browserOpen: true } }).expect(200);
    expect(ack.body).toEqual({});
    const status = await get(`/api/jobs/${id}`).set('Cookie', user.cookie).expect(200);
    expect(status.body).toMatchObject({ job: { id, status: 'awaiting_review', canStartAnother: true }, companion: { connected: true } });
    expect(JSON.stringify(status.body)).not.toContain(form.apiKey);
    const outsider = await login();
    await get(`/api/jobs/${id}`).set('Cookie', outsider.cookie).expect(404);
    await post('/api/pairing').set('Cookie', outsider.cookie).set('X-CSRF-Token', outsider.csrf).expect(409);
    const second = await upload().expect(202);
    expect(second.body.job.id).not.toBe(id);
    const next = await exchange({ sequence: 2, acceptedJobId: id }).expect(200);
    expect(next.body.job.id).toBe(second.body.job.id);
  });

  it('expires the workspace session without closing the remote review browser', async () => {
    const { get, login, relay } = setup();
    const user = await login();
    const shutdown = vi.spyOn(relay, 'shutdown');
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 86400001);
    await get('/api/session').set('Cookie', user.cookie).expect(401);
    expect(shutdown).not.toHaveBeenCalled();
  });
});
