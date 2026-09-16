import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { resolveHosting } from '../src/hosting.js';
import type { JobRunner } from '../src/jobs.js';
import type { JobView } from '../src/domain.js';

const origin = 'https://appraisal.example.com';
const host = 'appraisal.example.com';
const accessKey = 'synthetic-workspace-access-code-1234567890';
const pdf = Buffer.from('%PDF-1.7\n% synthetic hosted fixture\n%%EOF');
const form = { provider: 'google', model: 'synthetic-model', apiKey: 'synthetic-provider-key-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' };
const externalNavigation = { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' };

function syntheticRunner(): JobRunner {
  const jobs = new Map<string, { owner: string; job: JobView }>();
  return {
    create: vi.fn(owner => {
      const job: JobView = { id: randomUUID(), status: 'awaiting_review', message: 'Review in your Azure browser.', canStartAnother: true };
      jobs.set(job.id, { owner, job });
      return job;
    }),
    get: vi.fn((owner, id) => jobs.get(id)?.owner === owner ? jobs.get(id)?.job : undefined),
    getActive: vi.fn(owner => [...jobs.values()].findLast(record => record.owner === owner)?.job),
    endOwner: vi.fn(),
    shutdown: vi.fn(),
  };
}

function setup() {
  const runner = syntheticRunner();
  const { app } = createApp({ hosting: resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin }), accessKey, runner });
  const client = request(app);
  const get = (path: string) => client.get(path).set('Host', host);
  const post = (path: string) => client.post(path).set('Host', host);
  const login = async () => {
    const response = await post('/api/login').set('Origin', origin).send({ accessKey }).expect(200);
    const cookie = response.headers['set-cookie']![0]!.split(';')[0]!;
    const session = await get('/api/session').set('Cookie', cookie).expect(200);
    return { cookie, csrf: session.body.csrfToken as string, response, session };
  };
  return { app, runner, get, post, login };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('hosted Azure workspace authentication and ownership boundary', () => {
  it('requires a configured strong workspace secret before opening the hosted app', () => {
    const hosting = resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin });
    for (const key of [undefined, '', 'short', 'x'.repeat(31), 'with spaces'.repeat(5)]) {
      expect(() => createApp({ hosting, accessKey: key, runner: syntheticRunner() })).toThrow('APPRAISAL_ACCESS_KEY');
    }
  });

  it('serves the sign-in shell but never creates anonymous hosted sessions or accepts uploads', async () => {
    const { get, post } = setup();
    await get('/').expect(200);
    expect((await get('/api/config').expect(200)).body).toEqual({ hostingMode: 'hosted', browserMode: 'azure' });
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

  it.each(['/', '/index.html', '/?from=external', '/index.html?from=external'])('allows external document navigation to the public shell at %s without a session or secret', async path => {
    const { get } = setup();
    const response = await get(path).set(externalNavigation).expect(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.text).toContain('workspace-login-form');
    expect(response.text).not.toContain(accessKey);
    expect(response.text).not.toContain(form.apiKey);
    expect(response.text).not.toContain('csrfToken');
  });

  it('keeps authenticated session details out of the public shell during external navigation', async () => {
    const { get, login } = setup();
    const user = await login();
    const response = await get('/').set(externalNavigation).set('Cookie', user.cookie).expect(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.text).not.toContain(user.csrf);
    expect(response.text).not.toContain(user.cookie);
    expect(response.text).not.toContain(accessKey);
  });

  it('still rejects unapproved Host and every explicit unapproved Origin during public navigation', async () => {
    const { get } = setup();
    const wrongHost = await get('/').set(externalNavigation).set('Host', 'attacker.example').set('X-Forwarded-Host', host).expect(403);
    expect(wrongHost.body.error.code).toBe('HOST_REJECTED');
    for (const path of ['/', '/index.html']) {
      for (const unapproved of ['https://attacker.example', 'null', '']) {
        const response = await get(path).set(externalNavigation).set('Origin', unapproved).expect(403);
        expect(response.body.error.code).toBe('ORIGIN_REJECTED');
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    }
  });

  it.each(['/api/session', '/api/config', '/api/jobs', '/api/companion-status', '/api/companion/exchange', '/app.js', '/INDEX.HTML'])('does not permit cross-site navigation to %s', async path => {
    const { get } = setup();
    const response = await get(path).set(externalNavigation).expect(403);
    expect(response.body.error.code).toBe('ORIGIN_REJECTED');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it.each(['/', '/index.html', '/api/login'])('does not permit cross-site POST navigation to %s', async path => {
    const { post } = setup();
    const response = await post(path).set(externalNavigation).set('Origin', origin).send({ accessKey }).expect(403);
    expect(response.body.error.code).toBe('ORIGIN_REJECTED');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it.each([
    ['iframe', 'navigate', 'iframe'],
    ['object', 'navigate', 'object'],
    ['no-cors', 'no-cors', 'document'],
    ['cors', 'cors', 'document'],
    ['fetch', 'cors', 'empty'],
    ['missing mode', undefined, 'document'],
    ['missing destination', 'navigate', undefined],
    ['missing metadata', undefined, undefined],
  ])('rejects cross-site shell requests with %s metadata', async (_name, mode, destination) => {
    const { get } = setup();
    for (const path of ['/', '/index.html']) {
      const pending = get(path).set('Sec-Fetch-Site', 'cross-site');
      if (mode !== undefined) pending.set('Sec-Fetch-Mode', mode);
      if (destination !== undefined) pending.set('Sec-Fetch-Dest', destination);
      const response = await pending.expect(403);
      expect(response.body.error.code).toBe('ORIGIN_REJECTED');
      expect(response.headers['set-cookie']).toBeUndefined();
    }
  });

  it('keeps cross-site HEAD shell requests and local-mode document navigation blocked', async () => {
    const { app } = setup();
    await request(app).head('/').set('Host', host).set(externalNavigation).expect(403);
    const local = createApp();
    try {
      for (const path of ['/', '/index.html']) {
        const response = await request(local.app).get(path).set('Host', '127.0.0.1:3000').set(externalNavigation).expect(403);
        expect(response.body.error.code).toBe('ORIGIN_REJECTED');
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    } finally {
      local.runner.shutdown();
    }
  });

  it('sets secure HTTP-only cookies and preserves the owning session across repeat sign-in', async () => {
    const { get, post, login } = setup();
    const signedIn = await login();
    const cookieHeader = signedIn.response.headers['set-cookie']![0]!;
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Strict');
    expect(signedIn.session.body).toMatchObject({ hostingMode: 'hosted', browserMode: 'azure' });
    expect(signedIn.session.body.companion).toBeUndefined();
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

  it('retires every companion endpoint even for an authenticated workspace owner', async () => {
    const { get, post, login } = setup();
    const user = await login();
    for (const path of ['/api/pairing', '/api/companion/connect', '/api/companion/exchange', '/api/companion/submit']) {
      await post(path).set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).set('Origin', origin)
        .set('Authorization', `Bearer ${'a'.repeat(43)}`).send({}).expect(404);
    }
    await get('/api/companion-status').set('Cookie', user.cookie).expect(404);
    await post('/api/companion/connect').set('Authorization', `Bearer ${'a'.repeat(43)}`).send({}).expect(401);
  });

  it('accepts cloud jobs without pairing and keeps their documents and status owner-scoped', async () => {
    const { get, post, login, runner } = setup();
    const user = await login();
    const upload = () => post('/api/jobs').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).set('Origin', origin).field(form).attach('urla', pdf, 'urla.pdf');
    await post('/api/jobs').set('Cookie', user.cookie).set('Origin', origin).field(form).attach('urla', pdf, 'urla.pdf').expect(403);
    expect(runner.create).not.toHaveBeenCalled();
    const first = await upload().expect(202);
    const id = first.body.job.id as string;
    expect(JSON.stringify(first.body)).not.toContain(form.apiKey);
    const owner = user.cookie.slice(user.cookie.indexOf('=') + 1);
    expect(runner.create).toHaveBeenCalledWith(owner, expect.objectContaining({ input: expect.objectContaining(form), urla: { name: 'urla.pdf', buffer: pdf } }));
    const status = await get(`/api/jobs/${id}`).set('Cookie', user.cookie).expect(200);
    expect(status.body).toMatchObject({ job: { id, status: 'awaiting_review', canStartAnother: true } });
    expect(status.body.companion).toBeUndefined();
    expect(JSON.stringify(status.body)).not.toContain(form.apiKey);
    expect(JSON.stringify(status.body)).not.toContain(pdf.toString('base64'));
    const outsider = await login();
    await get(`/api/jobs/${id}`).set('Cookie', outsider.cookie).expect(404);
    expect(outsider.session.body.activeJob).toBeUndefined();
    const second = await upload().expect(202);
    expect(second.body.job.id).not.toBe(id);
    expect((await get('/api/session').set('Cookie', user.cookie).expect(200)).body.activeJob.id).toBe(second.body.job.id);
  });

  it.each(['/api/session', '/api/jobs/00000000-0000-4000-8000-000000000001/browser'])('ends the owning cloud browser when an expired session requests %s', async path => {
    const { get, login, runner } = setup();
    const user = await login();
    const owner = user.cookie.slice(user.cookie.indexOf('=') + 1);
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 86400001);
    await get(path).set('Cookie', user.cookie).expect(401);
    expect(runner.endOwner).toHaveBeenCalledWith(owner);
    expect(runner.shutdown).not.toHaveBeenCalled();
  });
});
