import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { resolveHosting, resolveBrowserMode } from '../src/hosting.js';
import type { JobRunner } from '../src/jobs.js';
import type { JobView } from '../src/domain.js';

const origin = 'https://appraisal.example.com';
const host = 'appraisal.example.com';
const key = 'synthetic-workspace-access-code-1234567890';
const id = '00000000-0000-4000-8000-000000000001';

function fixture() {
  let owner = '';
  const job: JobView = { id, status: 'awaiting_login', message: 'Synthetic login' };
  const frame = { image: 'synthetic-jpeg', width: 1440, height: 1000, phase: 'authenticating' as const, canControl: true, pages: [] };
  const runner: JobRunner = {
    create: vi.fn((who) => { owner = who; return job; }),
    get: vi.fn((who, jobId) => who === owner && jobId === id ? job : undefined),
    getActive: vi.fn(who => who === owner ? job : undefined),
    browserFrame: vi.fn(async () => frame), browserInput: vi.fn(async () => undefined), closeBrowser: vi.fn(async () => undefined), shutdown: vi.fn(),
  };
  const { app } = createApp({ hosting: resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin }), accessKey: key, browserMode: 'azure', runner });
  const get = (path: string) => request(app).get(path).set('Host', host);
  const post = (path: string) => request(app).post(path).set('Host', host).set('Origin', origin);
  const login = async () => {
    const logged = await post('/api/login').send({ accessKey: key }).expect(200);
    const cookie = logged.headers['set-cookie']![0]!.split(';')[0]!;
    const session = await get('/api/session').set('Cookie', cookie).expect(200);
    return { cookie, csrf: session.body.csrfToken as string, session: session.body };
  };
  const create = async () => {
    const user = await login();
    await post('/api/jobs').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf)
      .field('provider', 'google').field('apiKey', 'synthetic-provider-key-123456').field('loanNumber', '685-2012345').field('paymentMethod', 'Invoice')
      .attach('urla', Buffer.from('%PDF-1.7\nsynthetic fixture\n%%EOF'), { filename: 'urla.pdf', contentType: 'application/pdf' }).expect(202);
    return user;
  };
  return { get, post, runner, login, create };
}

describe('cloud browser HTTP ownership boundary', () => {
  it('accepts cloud jobs without a companion and exposes mode without connection secrets', async () => {
    const f = fixture(); const user = await f.create();
    expect(user.session.browserMode).toBe('azure'); expect(user.session.companion).toBeUndefined();
    await f.post('/api/pairing').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).expect(404);
    expect((await f.get('/api/config')).body).toEqual({ hostingMode: 'hosted', browserMode: 'azure' });
  });
  it('rejects anonymous and different-owner frame, input, and close requests', async () => {
    const f = fixture(); await f.create(); const other = await f.login();
    await f.get(`/api/jobs/${id}/browser`).expect(401);
    await f.get(`/api/jobs/${id}/browser`).set('Cookie', other.cookie).expect(404);
    for (const route of ['input', 'close']) await f.post(`/api/jobs/${id}/browser/${route}`).set('Cookie', other.cookie).set('X-CSRF-Token', other.csrf).send({ type: 'key', key: 'Enter' }).expect(404);
    expect(f.runner.browserFrame).not.toHaveBeenCalled(); expect(f.runner.browserInput).not.toHaveBeenCalled(); expect(f.runner.closeBrowser).not.toHaveBeenCalled();
  });
  it('requires CSRF and exact origin, validates input, and never echoes typed credentials', async () => {
    const f = fixture(); const user = await f.create(); const path = `/api/jobs/${id}/browser/input`;
    await f.post(path).set('Cookie', user.cookie).send({ type: 'text', text: 'synthetic-secret' }).expect(403);
    await f.post(path).unset('Origin').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).send({ type: 'text', text: 'synthetic-secret' }).expect(403);
    await f.post(path).set('Origin', 'https://attacker.example').set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).send({ type: 'key', key: 'Enter' }).expect(403);
    for (const action of [{ type: 'evaluate', code: 'secret' }, { type: 'key', key: 'Control+L' }, { type: 'text', text: 'x'.repeat(4097) }]) {
      await f.post(path).set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).send(action).expect(400);
    }
    const response = await f.post(path).set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).send({ type: 'text', text: 'synthetic-secret' }).expect(200);
    expect(response.body).toEqual({ ok: true }); expect(response.text).not.toContain('synthetic-secret'); expect(f.runner.browserInput).toHaveBeenCalledOnce();
  });
  it('delivers owner-only frames with no-store and protects browser closure', async () => {
    const f = fixture(); const user = await f.create();
    const response = await f.get(`/api/jobs/${id}/browser`).set('Cookie', user.cookie).expect(200);
    expect(response.headers['cache-control']).toBe('no-store'); expect(response.body.frame.phase).toBe('authenticating');
    await f.post(`/api/jobs/${id}/browser/close`).set('Cookie', user.cookie).expect(403);
    await f.post(`/api/jobs/${id}/browser/close`).set('Cookie', user.cookie).set('X-CSRF-Token', user.csrf).expect(200);
    expect(f.runner.closeBrowser).toHaveBeenCalledOnce();
  });
  it('keeps browser modes explicit and refuses cloud execution in local hosting', () => {
    const local = resolveHosting({}); const hosted = resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: origin });
    expect(resolveBrowserMode({}, local)).toBe('local'); expect(resolveBrowserMode({}, hosted)).toBe('companion');
    expect(resolveBrowserMode({ APPRAISAL_BROWSER_MODE: 'azure' }, hosted)).toBe('azure');
    expect(() => resolveBrowserMode({ APPRAISAL_BROWSER_MODE: 'azure' }, local)).toThrow();
    expect(() => resolveBrowserMode({ APPRAISAL_BROWSER_MODE: 'local' }, hosted)).toThrow();
    expect(() => resolveBrowserMode({ APPRAISAL_BROWSER_MODE: 'unknown' }, hosted)).toThrow();
  });
});
