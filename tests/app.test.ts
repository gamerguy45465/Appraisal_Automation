// [L1] Import request from "supertest" for these regression tests.
import request from 'supertest';
// [L2] Import { beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { beforeEach, describe, expect, it, vi } from 'vitest';
// [L3] Import { createApp } from "../src/app.js" for these regression tests.
import { createApp } from '../src/app.js';
// [L4] Import type { JobRunner } from "../src/jobs.js" for these regression tests.
import type { JobRunner } from '../src/jobs.js';
// [L5] Import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, type JobPayload } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, type JobPayload } from '../src/domain.js';
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.

// [L7] Declare `pdf` as the result of `Buffer.from` using "%PDF-1.7\n% synthetic test only\n%%EOF".
const pdf = Buffer.from('%PDF-1.7\n% synthetic test only\n%%EOF');
// [L8] Declare `form` as an object containing apiKey: "test-key-not-real-1234567890", loanNumber: "685-2012345", paymentMethod: "Invoice".
const form = { apiKey: 'test-key-not-real-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' };
// [L9] Declare `invalidAiSettings` as an array containing an object containing caseName: "provider", fields: an object containing provider: "invalid", an object containing caseName: "display-only provider name", fields: an object containing provider: "SpaceXAI", an object containing caseName: "empty key", fields: an object containing apiKey: "", an object containing caseName: "short key", fields: an object containing apiKey: "short", an object containing caseName: "oversized key", fields: an object containing apiKey: the result of `'x'.repeat` using `513`, an object containing caseName: "model whitespace", fields: an object containing model: "model with spaces", an object containing caseName: "oversized model", fields: an object containing model: the result of `'x'.repeat` using `201`.
const invalidAiSettings: Array<{ caseName: string; fields: Record<string, string> }> = [
  // [L10] Set fixture property `caseName` to "provider". Set fixture property `fields` to an object containing provider: "invalid".
  { caseName: 'provider', fields: { provider: 'invalid' } },
  // [L11] Set fixture property `caseName` to "display-only provider name". Set fixture property `fields` to an object containing provider: "SpaceXAI".
  { caseName: 'display-only provider name', fields: { provider: 'SpaceXAI' } },
  // [L12] Set fixture property `caseName` to "empty key". Set fixture property `fields` to an object containing apiKey: "".
  { caseName: 'empty key', fields: { apiKey: '' } },
  // [L13] Set fixture property `caseName` to "short key". Set fixture property `fields` to an object containing apiKey: "short".
  { caseName: 'short key', fields: { apiKey: 'short' } },
  // [L14] Set fixture property `caseName` to "oversized key". Set fixture property `fields` to an object containing apiKey: the result of `'x'.repeat` using 513.
  { caseName: 'oversized key', fields: { apiKey: 'x'.repeat(513) } },
  // [L15] Set fixture property `caseName` to "model whitespace". Set fixture property `fields` to an object containing model: "model with spaces".
  { caseName: 'model whitespace', fields: { model: 'model with spaces' } },
  // [L16] Set fixture property `caseName` to "oversized model". Set fixture property `fields` to an object containing model: the result of `'x'.repeat` using 201.
  { caseName: 'oversized model', fields: { model: 'x'.repeat(201) } },
// [L17] Close the array of fixture values for `invalidAiSettings` and finish the surrounding syntax.
];
// [L18] Declare `runner` for assignment later.
let runner: JobRunner;
// [L19] Run this setup before every test in the group.
beforeEach(() => {
  // [L20] Assign an object containing create: the result of `vi.fn` using a callback that returns `{ id: 'job-id', status: 'queued', message: 'Queued' }`, get: the result of `vi.fn` using a callback that returns `undefined`, shutdown: the result of `vi.fn` with no arguments to `runner`.
  runner = { create: vi.fn<JobRunner['create']>(() => ({ id: 'job-id', status: 'queued', message: 'Queued' })), get: vi.fn(() => undefined), shutdown: vi.fn() };
// [L21] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L22] Blank line separating the surrounding declarations, statements, or document blocks.

// [L23] Define helper `setup` with no parameters for the fixture operations below.
async function setup() {
  // [L24] Declare `{ app }` as the result of `createApp` using an object containing runner.
  const { app } = createApp({ runner });
  // [L25] Declare `client` as the result of `request.agent` using `app`.
  const client = request.agent(app);
  // [L26] Declare `session` as the resolved value from `client.get('/api/session').set('Host', '127.0.0.1:3000').expect` using 200.
  const session = await client.get('/api/session').set('Host', '127.0.0.1:3000').expect(200);
  // [L27] Return an object containing app, client, token: `session.body.csrfToken` to the caller.
  return { app, client, token: session.body.csrfToken as string };
// [L28] Close the callback or control-flow body for `setup` and finish the surrounding syntax.
}
// [L29] Blank line separating the surrounding declarations, statements, or document blocks.

// [L30] Group regression tests for "local upload boundary".
describe('local upload boundary', () => {
  // [L31] Register a test that "publishes provider-specific model defaults without exposing credentials".
  it('publishes provider-specific model defaults without exposing credentials', async () => {
    // [L32] Declare `{ app }` as the result of `createApp` using an object containing runner.
    const { app } = createApp({ runner });
    // [L33] Declare `response` as the resolved value from `request(app).get('/api/session').set('Host', '127.0.0.1:3000').expect` using 200.
    const response = await request(app).get('/api/session').set('Host', '127.0.0.1:3000').expect(200);
    // [L34] Assert that `response.body` contains the expected object fields an object containing defaultProvider: `DEFAULT_PROVIDER`, model: `DEFAULT_MODEL`, modelDefaults: `DEFAULT_MODELS`.
    expect(response.body).toMatchObject({ defaultProvider: DEFAULT_PROVIDER, model: DEFAULT_MODEL, modelDefaults: DEFAULT_MODELS });
    // [L35] Assert that response.body does not contain the "apiKey" property, preserving the credential-exclusion boundary.
    expect(response.body).not.toHaveProperty('apiKey');
  // [L36] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L37] Register a test that "requires a session and rejects remote hosts/origins before accepting uploads".
  it('requires a session and rejects remote hosts/origins before accepting uploads', async () => {
    // [L38] Declare `{ app }` as the result of `createApp` using an object containing runner.
    const { app } = createApp({ runner });
    // [L39] Call `request(app).get('/api/session').set('Host', 'attacker.example:3000').expect` with 403. Wait for completion before continuing.
    await request(app).get('/api/session').set('Host', 'attacker.example:3000').expect(403);
    // [L40] Call `request(app).get('/api/session').set('Host', '127.0.0.1:3000').set('Origin', 'https://attacker.example').expect` with 403. Wait for completion before continuing.
    await request(app).get('/api/session').set('Host', '127.0.0.1:3000').set('Origin', 'https://attacker.example').expect(403);
    // [L41] Call `request(app).post('/api/jobs').set('Host', '127.0.0.1:3000').expect` with 401. Wait for completion before continuing.
    await request(app).post('/api/jobs').set('Host', '127.0.0.1:3000').expect(401);
  // [L42] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L43] Register a parameterized test that "rejects missing and malformed CSRF tokens for a %s upload".
  it.each(['google', 'xai'])('rejects missing and malformed CSRF tokens for a %s upload', async (provider) => {
    // [L44] Declare `{ client }` as the resolved value from `setup` with no arguments.
    const { client } = await setup();
    // [L45] Call `client.post('/api/jobs').set('Host', '127.0.0.1:3000') .field({ ...form, provider }).attach('urla', pdf, 'urla.pdf').expect` with 403. Wait for completion before continuing.
    await client.post('/api/jobs').set('Host', '127.0.0.1:3000')
      // [L46] Copy the entries of `form` into this fixture. Include the current `provider` value under the same property name.
      .field({ ...form, provider }).attach('urla', pdf, 'urla.pdf').expect(403);
    // [L47] Call `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', 'é'.repeat(64)).expect` with 403. Wait for completion before continuing.
    await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', 'é'.repeat(64)).expect(403);
    // [L48] Assert that `runner.create` does not satisfy: was called.
    expect(runner.create).not.toHaveBeenCalled();
  // [L49] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L50] Register a test that "accepts the required multipart form and provides only a safe job response".
  it('accepts the required multipart form and provides only a safe job response', async () => {
    // [L51] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L52] Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', pdf, { filename: 'urla.pdf', contentType: 'application/pdf' }).expect` using 202.
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', pdf, { filename: 'urla.pdf', contentType: 'application/pdf' }).expect(202);
    // [L53] Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued".
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
    // [L54] Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`.
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    // [L55] Assert that `payload.input.loanNumber` strictly equals "685-2012345".
    expect(payload.input.loanNumber).toBe('685-2012345');
    // [L56] Assert that `payload.input` contains the expected object fields an object containing provider: "openai", model: `DEFAULT_MODEL`, apiKey: `form.apiKey`.
    expect(payload.input).toMatchObject({ provider: 'openai', model: DEFAULT_MODEL, apiKey: form.apiKey });
    // [L57] Assert that `payload.urla.name` strictly equals "urla.pdf".
    expect(payload.urla.name).toBe('urla.pdf');
    // [L58] Assert that `payload.salesContract` is undefined.
    expect(payload.salesContract).toBeUndefined();
    // [L59] Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('username');
    // [L60] Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('password');
    // [L61] Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `form.apiKey`.
    expect(JSON.stringify(response.body)).not.toContain(form.apiKey);
  // [L62] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L63] Register a parameterized test that "passes resolved provider/model from a $provider upload to its isolated job ($model)".
  it.each([
    // [L64] Set fixture property `provider` to "openai". Set fixture property `model` to "". Set fixture property `expected` to `DEFAULT_MODELS.openai`.
    { provider: 'openai', model: '', expected: DEFAULT_MODELS.openai },
    // [L65] Set fixture property `provider` to "anthropic". Set fixture property `expected` to `DEFAULT_MODELS.anthropic`.
    { provider: 'anthropic', expected: DEFAULT_MODELS.anthropic },
    // [L66] Set fixture property `provider` to "anthropic". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.anthropic`.
    { provider: 'anthropic', model: '  ', expected: DEFAULT_MODELS.anthropic },
    // [L67] Set fixture property `provider` to "anthropic". Set fixture property `model` to "  claude-sonnet-4-20250514  ". Set fixture property `expected` to "claude-sonnet-4-20250514".
    { provider: 'anthropic', model: '  claude-sonnet-4-20250514  ', expected: 'claude-sonnet-4-20250514' },
    // [L68] Set fixture property `provider` to "google". Set fixture property `expected` to `DEFAULT_MODELS.google`.
    { provider: 'google', expected: DEFAULT_MODELS.google },
    // [L69] Set fixture property `provider` to "google". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.google`.
    { provider: 'google', model: '  ', expected: DEFAULT_MODELS.google },
    // [L70] Set fixture property `provider` to "google". Set fixture property `model` to "  gemini-custom:2026  ". Set fixture property `expected` to "gemini-custom:2026".
    { provider: 'google', model: '  gemini-custom:2026  ', expected: 'gemini-custom:2026' },
    // [L71] Set fixture property `provider` to "xai". Set fixture property `expected` to `DEFAULT_MODELS.xai`.
    { provider: 'xai', expected: DEFAULT_MODELS.xai },
    // [L72] Set fixture property `provider` to "xai". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.xai`.
    { provider: 'xai', model: '  ', expected: DEFAULT_MODELS.xai },
    // [L73] Set fixture property `provider` to "xai". Set fixture property `model` to "grok-4.6 ". Set fixture property `expected` to "grok-4.6".
    { provider: 'xai', model: 'grok-4.6 ', expected: 'grok-4.6' },
    // [L74] Set fixture property `provider` to "xai". Set fixture property `model` to "  custom/grok-model:2026  ". Set fixture property `expected` to "custom/grok-model:2026".
    { provider: 'xai', model: '  custom/grok-model:2026  ', expected: 'custom/grok-model:2026' },
    // [L75] Set fixture property `provider` to "openai". Set fixture property `model` to "ft:gpt-4.1:organization:custom:id". Set fixture property `expected` to "ft:gpt-4.1:organization:custom:id".
    { provider: 'openai', model: 'ft:gpt-4.1:organization:custom:id', expected: 'ft:gpt-4.1:organization:custom:id' },
  // [L76] Apply the preceding scenario rows to the parameterized test "passes resolved provider/model from a $provider upload to its isolated job ($model)" and begin its callback.
  ])('passes resolved provider/model from a $provider upload to its isolated job ($model)', async ({ provider, model, expected }) => {
    // [L77] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L78] Declare `fields` as an object whose fields are defined below.
    const fields = { ...form, apiKey: `synthetic-${provider}-key-not-real-1234567890`,
      // [L79] Include the current `provider` value under the same property name. Copy the entries of an empty object when `model` strictly equals `undefined`, otherwise an object containing model into this fixture.
      provider, ...(model === undefined ? {} : { model }) };
    // [L80] Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field(fields).attach('urla', pdf, 'urla.pdf').expect` using 202.
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      // [L81] Attach all form fields and the synthetic URLA PDF to the multipart request, then require HTTP 202 Accepted.
      .field(fields).attach('urla', pdf, 'urla.pdf').expect(202);
    // [L82] Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`.
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    // [L83] Assert that `runner.create` was called this many times: 1.
    expect(runner.create).toHaveBeenCalledTimes(1);
    // [L84] Assert that `payload.input` contains the expected object fields an object containing provider, model: `expected`, apiKey: `fields.apiKey`.
    expect(payload.input).toMatchObject({ provider, model: expected, apiKey: fields.apiKey });
    // [L85] Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('username');
    // [L86] Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('password');
    // [L87] Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued".
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
    // [L88] Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `fields.apiKey`.
    expect(JSON.stringify(response.body)).not.toContain(fields.apiKey);
  // [L89] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L90] Register a parameterized test that "rejects invalid $caseName before starting a worker".
  it.each(invalidAiSettings)('rejects invalid $caseName before starting a worker', async ({ fields }) => {
    // [L91] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L92] Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field({ ...form, ...fields }).attach('urla', pdf, 'urla.pdf').expect` using 400.
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      // [L93] Copy the entries of `form` into this fixture. Copy the entries of `fields` into this fixture.
      .field({ ...form, ...fields }).attach('urla', pdf, 'urla.pdf').expect(400);
    // [L94] Assert that `response.body.error.code` strictly equals "VALIDATION_ERROR".
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    // [L95] Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `form.apiKey`.
    expect(JSON.stringify(response.body)).not.toContain(form.apiKey);
    // [L96] Assert that `runner.create` does not satisfy: was called.
    expect(runner.create).not.toHaveBeenCalled();
  // [L97] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L98] Register a parameterized test that "discards outdated R3 credentials from a %s upload instead of passing them to the worker".
  it.each(['openai', 'google', 'xai'])('discards outdated R3 credentials from a %s upload instead of passing them to the worker', async (provider) => {
    // [L99] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L100] Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field({ ...form, provider, username: 'obsolete-user', password: 'obsolete-password' }).attach(...` using 202.
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token)
      // [L101] Copy the entries of `form` into this fixture. Include the current `provider` value under the same property name. Set fixture property `username` to "obsolete-user". Set fixture property `password` to "obsolete-password".
      .field({ ...form, provider, username: 'obsolete-user', password: 'obsolete-password' }).attach('urla', pdf, 'urla.pdf').expect(202);
    // [L102] Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`.
    const payload = vi.mocked(runner.create).mock.calls[0]?.[1] as JobPayload;
    // [L103] Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('username');
    // [L104] Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary.
    expect(payload.input).not.toHaveProperty('password');
    // [L105] Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued".
    expect(response.body).toEqual({ job: { id: 'job-id', status: 'queued', message: 'Queued' } });
  // [L106] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L107] Register a test that "rejects missing URLA, invalid loan numbers, fake PDFs and excess files".
  it('rejects missing URLA, invalid loan numbers, fake PDFs and excess files', async () => {
    // [L108] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L109] Declare `post` as a callback that returns the result of `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set` using "X-CSRF-Token", `token`.
    const post = () => client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token);
    // [L110] Assert that `(await post().field(form).expect(400)).body.error.code` strictly equals "URLA_REQUIRED".
    expect((await post().field(form).expect(400)).body.error.code).toBe('URLA_REQUIRED');
    // [L111] Call `post().field({ ...form, loanNumber: 'bad' }).attach('urla', pdf, 'urla.pdf').expect` with 400. Wait for completion before continuing.
    await post().field({ ...form, loanNumber: 'bad' }).attach('urla', pdf, 'urla.pdf').expect(400);
    // [L112] Call `post().field(form).attach('urla', Buffer.from('this is not a PDF'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect` with 400. Wait for completion before continuing.
    await post().field(form).attach('urla', Buffer.from('this is not a PDF'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect(400);
    // [L113] Call `post().field(form).attach('urla', pdf, 'urla.pdf').attach('urla', pdf, 'second.pdf').expect` with 400. Wait for completion before continuing.
    await post().field(form).attach('urla', pdf, 'urla.pdf').attach('urla', pdf, 'second.pdf').expect(400);
    // [L114] Assert that `runner.create` does not satisfy: was called.
    expect(runner.create).not.toHaveBeenCalled();
  // [L115] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L116] Register a test that "makes status session-specific and denies unknown operations".
  it('makes status session-specific and denies unknown operations', async () => {
    // [L117] Declare `{ client }` as the resolved value from `setup` with no arguments.
    const { client } = await setup();
    // [L118] Call `client.get('/api/jobs/not-owned').set('Host', '127.0.0.1:3000').expect` with 404. Wait for completion before continuing.
    await client.get('/api/jobs/not-owned').set('Host', '127.0.0.1:3000').expect(404);
    // [L119] Call `client.get('/api/secrets').set('Host', '127.0.0.1:3000').expect` with 404. Wait for completion before continuing.
    await client.get('/api/secrets').set('Host', '127.0.0.1:3000').expect(404);
  // [L120] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L121] Register a test that "rejects oversized documents before starting a worker".
  it('rejects oversized documents before starting a worker', async () => {
    // [L122] Declare `{ client, token }` as the resolved value from `setup` with no arguments.
    const { client, token } = await setup();
    // [L123] Declare `oversized` as the result of `Buffer.alloc` using `15` times `1024` times 1024 plus 1.
    const oversized = Buffer.alloc(15 * 1024 * 1024 + 1);
    // [L124] Call `pdf.copy` with `oversized`.
    pdf.copy(oversized);
    // [L125] Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', oversized, 'urla.pdf').expect` using 400.
    const response = await client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', oversized, 'urla.pdf').expect(400);
    // [L126] Assert that `response.body.error.code` strictly equals "UPLOAD_LIMIT".
    expect(response.body.error.code).toBe('UPLOAD_LIMIT');
    // [L127] Assert that `runner.create` does not satisfy: was called.
    expect(runner.create).not.toHaveBeenCalled();
  // [L128] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L129] Register a test that "serves the working form with strict CSP, no caching, and no server version".
  it('serves the working form with strict CSP, no caching, and no server version', async () => {
    // [L130] Declare `{ app }` as the result of `createApp` using an object containing runner.
    const { app } = createApp({ runner });
    // [L131] Declare `response` as the resolved value from `request(app).get('/').set('Host', '127.0.0.1:3000').expect` using 200.
    const response = await request(app).get('/').set('Host', '127.0.0.1:3000').expect(200);
    // [L132] Assert that `response.text` contains "enctype=\"multipart/form-data\"".
    expect(response.text).toContain('enctype="multipart/form-data"');
    // [L133] Assert that `response.headers['content-security-policy']` contains "script-src 'self'".
    expect(response.headers['content-security-policy']).toContain("script-src 'self'");
    // [L134] Assert that `response.headers['cache-control']` strictly equals "no-store".
    expect(response.headers['cache-control']).toBe('no-store');
    // [L135] Assert that `response.headers['x-powered-by']` is undefined.
    expect(response.headers['x-powered-by']).toBeUndefined();
  // [L136] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L137] Close the callback or control-flow body and finish the surrounding syntax.
});
