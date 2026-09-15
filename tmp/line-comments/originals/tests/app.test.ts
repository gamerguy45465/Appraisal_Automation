import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { JobRunner } from '../src/jobs.js';
import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, type JobPayload } from '../src/domain.js';

const pdf = Buffer.from('%PDF-1.7\n% synthetic test only\n%%EOF');
const form = { apiKey: 'test-key-not-real-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' };
const invalidAiSettings: Array<{ caseName: string; fields: Record<string, string> }> = [
  { caseName: 'provider', fields: { provider: 'invalid' } },
  { caseName: 'display-only provider name', fields: { provider: 'SpaceXAI' } },
  { caseName: 'empty key', fields: { apiKey: '' } },
  { caseName: 'short key', fields: { apiKey: 'short' } },
  { caseName: 'oversized key', fields: { apiKey: 'x'.repeat(513) } },
  { caseName: 'model whitespace', fields: { model: 'model with spaces' } },
  { caseName: 'oversized model', fields: { model: 'x'.repeat(201) } },
];
let runner: JobRunner;
beforeEach(() => {
  runner = { create: vi.fn<JobRunner['create']>(() => ({ id: 'job-id', status: 'queued', message: 'Queued' })), get: vi.fn(() => undefined), shutdown: vi.fn() };
});

async function setup() {
  const { app } = createApp({ runner });
  const client = request.agent(app);
  const session = await client.get('/api/session').set('Host', '127.0.0.1:3000').expect(200);
  return { app, client, token: session.body.csrfToken as string };
}

describe('local upload boundary', () => {
  it('publishes provider-specific model defaults without exposing credentials', async () => {
    const { app } = createApp({ runner });
    const response = await request(app).get('/api/session').set('Host', '127.0.0.1:3000').expect(200);
    expect(response.body).toMatchObject({ defaultProvider: DEFAULT_PROVIDER, model: DEFAULT_MODEL, modelDefaults: DEFAULT_MODELS });
    expect(response.body).not.toHaveProperty('apiKey');
  });
  it('requires a session and rejects remote hosts/origins before accepting uploads', async () => {
    const { app } = createApp({ runner });
    await request(app).get('/api/session').set('Host', 'attacker.example:3000').expect(403);
    await request(app).get('/api/session').set('Host', '127.0.0.1:3000').set('Origin', 'https://attacker.example').expect(403);
    await request(app).post('/api/jobs').set('Host', '127.0.0.1:3000').expect(401);
  });
  it.each(['google', 'xai'])('rejects missing and malformed CSRF tokens for a %s upload', async (provider) => {
    const { client } = await setup();
    await client.post('/api/jobs').set('Host', '127.0.0.1:3000')
      .field({ ...form, provider }).attach('urla', pdf, 'urla.pdf').expect(403);
    await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', 'é'.repeat(64)).expect(403);
    expect(runner.create).not.toHaveBeenCalled();
  });
  it('accepts the required multipart form and provides only a safe job response', async () => {
    const { client, token } = await setup();
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', pdf, { filename: 'urla.pdf', contentType: 'application/pdf' }).expect(202);
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    expect(payload.input.loanNumber).toBe('685-2012345');
    expect(payload.input).toMatchObject({ provider: 'openai', model: DEFAULT_MODEL, apiKey: form.apiKey });
    expect(payload.urla.name).toBe('urla.pdf');
    expect(payload.salesContract).toBeUndefined();
    expect(payload.input).not.toHaveProperty('username');
    expect(payload.input).not.toHaveProperty('password');
    expect(JSON.stringify(response.body)).not.toContain(form.apiKey);
  });
  it.each([
    { provider: 'openai', model: '', expected: DEFAULT_MODELS.openai },
    { provider: 'anthropic', expected: DEFAULT_MODELS.anthropic },
    { provider: 'anthropic', model: '  ', expected: DEFAULT_MODELS.anthropic },
    { provider: 'anthropic', model: '  claude-sonnet-4-20250514  ', expected: 'claude-sonnet-4-20250514' },
    { provider: 'google', expected: DEFAULT_MODELS.google },
    { provider: 'google', model: '  ', expected: DEFAULT_MODELS.google },
    { provider: 'google', model: '  gemini-custom:2026  ', expected: 'gemini-custom:2026' },
    { provider: 'xai', expected: DEFAULT_MODELS.xai },
    { provider: 'xai', model: '  ', expected: DEFAULT_MODELS.xai },
    { provider: 'xai', model: 'grok-4.6 ', expected: 'grok-4.6' },
    { provider: 'xai', model: '  custom/grok-model:2026  ', expected: 'custom/grok-model:2026' },
    { provider: 'openai', model: 'ft:gpt-4.1:organization:custom:id', expected: 'ft:gpt-4.1:organization:custom:id' },
  ])('passes resolved provider/model from a $provider upload to its isolated job ($model)', async ({ provider, model, expected }) => {
    const { client, token } = await setup();
    const fields = { ...form, apiKey: `synthetic-${provider}-key-not-real-1234567890`,
      provider, ...(model === undefined ? {} : { model }) };
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      .field(fields).attach('urla', pdf, 'urla.pdf').expect(202);
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    expect(runner.create).toHaveBeenCalledTimes(1);
    expect(payload.input).toMatchObject({ provider, model: expected, apiKey: fields.apiKey });
    expect(payload.input).not.toHaveProperty('username');
    expect(payload.input).not.toHaveProperty('password');
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
    expect(JSON.stringify(response.body)).not.toContain(fields.apiKey);
  });
  it.each(invalidAiSettings)('rejects invalid $caseName before starting a worker', async ({ fields }) => {
    const { client, token } = await setup();
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      .field({ ...form, ...fields }).attach('urla', pdf, 'urla.pdf').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body)).not.toContain(form.apiKey);
    expect(runner.create).not.toHaveBeenCalled();
  });
  it.each(['openai', 'google', 'xai'])('discards outdated R3 credentials from a %s upload instead of passing them to the worker', async (provider) => {
    const { client, token } = await setup();
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      .field({ ...form, provider, username: 'obsolete-user', password: 'obsolete-password' }).attach('urla', pdf, 'urla.pdf').expect(202);
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    expect(payload.input).not.toHaveProperty('username');
    expect(payload.input).not.toHaveProperty('password');
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
  });
  it('rejects missing URLA, invalid loan numbers, fake PDFs and excess files', async () => {
    const { client, token } = await setup();
    const post = () => client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token);
    expect((await post().field(form).expect(400)).body.error.code).toBe('URLA_REQUIRED');
    await post().field({ ...form, loanNumber: 'bad' }).attach('urla', pdf, 'urla.pdf').expect(400);
    await post().field(form).attach('urla', Buffer.from('this is not a PDF'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect(400);
    await post().field(form).attach('urla', pdf, 'urla.pdf').attach('urla', pdf, 'second.pdf').expect(400);
    expect(runner.create).not.toHaveBeenCalled();
  });
  it('makes status session-specific and denies unknown operations', async () => {
    const { client } = await setup();
    await client.get('/api/jobs/not-owned').set('Host', '127.0.0.1:3000').expect(404);
    await client.get('/api/secrets').set('Host', '127.0.0.1:3000').expect(404);
  });
  it('rejects oversized documents before starting a worker', async () => {
    const { client, token } = await setup();
    const oversized = Buffer.alloc(15 * 1024 * 1024 + 1);
    pdf.copy(oversized);
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', oversized, 'urla.pdf').expect(400);
    expect(response.body.error.code).toBe('UPLOAD_LIMIT');
    expect(runner.create).not.toHaveBeenCalled();
  });
  it('serves the working form with strict CSP, no caching, and no server version', async () => {
    const { app } = createApp({ runner });
    const response = await request(app).get('/').set('Host', '127.0.0.1:3000').expect(200);
    expect(response.text).toContain('enctype="multipart/form-data"');
    expect(response.headers['content-security-policy']).toContain("script-src 'self'");
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
