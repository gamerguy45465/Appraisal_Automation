// [L1] Import { createServer, type Server } from "node:http" for these regression tests.
import { createServer, type Server } from 'node:http';
// [L2] Import { readFile } from "node:fs/promises" for these regression tests.
import { readFile } from 'node:fs/promises';
// [L3] Import { resolve } from "node:path" for these regression tests.
import { resolve } from 'node:path';
// [L4] Import { test, expect, type Page } from "@playwright/test" for these regression tests.
import { test, expect, type Page } from '@playwright/test';
// [L5] Blank line separating the surrounding declarations, statements, or document blocks.

// [L6] Configure Playwright to use the browser channel named by PLAYWRIGHT_CHANNEL when one is supplied.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });
// [L7] Blank line separating the surrounding declarations, statements, or document blocks.

// [L8] Declare `CSRF_TOKEN` as "test-session-csrf-token".
const CSRF_TOKEN = 'test-session-csrf-token';
// [L9] Declare `SESSION_DEFAULTS` as an object containing csrfToken: `CSRF_TOKEN`, defaultProvider: "openai", modelDefaults: an object containing openai: "gpt-5.6-sol", anthropic: "claude-opus-5", google: "gemini-3.8-flash", xai: "grok-4.6".
const SESSION_DEFAULTS = { csrfToken: CSRF_TOKEN, defaultProvider: 'openai', modelDefaults: { openai: 'gpt-5.6-sol', anthropic: 'claude-opus-5', google: 'gemini-3.8-flash', xai: 'grok-4.6' } };
// [L10] Declare `TEST_JOB` as an object containing id: "test-job-001", status: "queued", message: "Your order is queued.".
const TEST_JOB = { id: 'test-job-001', status: 'queued', message: 'Your order is queued.' };
// [L11] Declare `PDF_FIXTURE` as an object containing name: "test-urla.pdf", mimeType: "application/pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nTest fixture\n%%EOF".
const PDF_FIXTURE = { name: 'test-urla.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nTest fixture\n%%EOF') };
// [L12] Declare `server` for assignment later.
let server: Server;
// [L13] Declare `origin` for assignment later.
let origin: string;
// [L14] Blank line separating the surrounding declarations, statements, or document blocks.

// [L15] Start the shared local static fixture server once before the frontend browser tests.
test.beforeAll(async () => {
  // [L16] Declare `files` as an object whose fields are defined below.
  const files: Record<string, { name: string; contentType: string }> = {
    // [L17] Set fixture property `'/'` to an object containing name: "index.html", contentType: "text/html; charset=utf-8".
    '/': { name: 'index.html', contentType: 'text/html; charset=utf-8' },
    // [L18] Set fixture property `'/styles.css'` to an object containing name: "styles.css", contentType: "text/css; charset=utf-8".
    '/styles.css': { name: 'styles.css', contentType: 'text/css; charset=utf-8' },
    // [L19] Set fixture property `'/app.js'` to an object containing name: "app.js", contentType: "application/javascript; charset=utf-8".
    '/app.js': { name: 'app.js', contentType: 'application/javascript; charset=utf-8' },
  // [L20] Close the fixture object for `files` and finish the surrounding syntax.
  };
  // [L21] Assign the result of `createServer` using a callback whose body follows to `server`.
  server = createServer((request, response) => {
    // [L22] Declare `file` as `files[request.url ?? '']`.
    const file = files[request.url ?? ''];
    // [L23] Run the following branch when the negation of `file`.
    if (!file) {
      // [L24] Finish requests for unknown fixture paths with HTTP 404.
      response.writeHead(404).end();
      // [L25] Return immediately without a value.
      return;
    // [L26] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L27] Start reading the requested public asset asynchronously and attach response/error handlers; void intentionally discards the handled promise.
    void readFile(resolve('public', file.name)).then((body) => {
      // [L28] Send the public asset bytes with HTTP 200 and the mapped content type.
      response.writeHead(200, { 'Content-Type': file.contentType }).end(body);
    // [L29] If the asynchronous local fixture request handler fails, finish the HTTP response with status 500.
    }).catch(() => response.writeHead(500).end());
  // [L30] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L31] Wait for a new `Promise` instance initialized with a callback whose body follows to settle before continuing.
  await new Promise<void>((resolveListen, reject) => {
    // [L32] Reject server startup if its one-time error event fires before listening succeeds.
    server.once('error', reject);
    // [L33] Bind the fixture server to an available ephemeral IPv4 loopback port and resolve startup when it is listening.
    server.listen(0, '127.0.0.1', resolveListen);
  // [L34] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L35] Declare `address` as the result of `server.address` with no arguments.
  const address = server.address();
  // [L36] Run the following branch when the negation of `address` or `typeof address` strictly equals "string". Throw a new `Error` instance initialized with "The UI fixture server did not bind to a port." to simulate or report the failure.
  if (!address || typeof address === 'string') throw new Error('The UI fixture server did not bind to a port.');
  // [L37] Build the fixture origin from the actual loopback port assigned by the operating system.
  origin = `http://127.0.0.1:${address.port}`;
// [L38] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L39] Blank line separating the surrounding declarations, statements, or document blocks.

// [L40] Call `test.afterAll` with a promise-returning callback whose body follows.
test.afterAll(async () => {
  // [L41] Wait for a new `Promise` instance initialized with a callback that returns the result of `server.close` using a callback that returns `error ? reject(error) : resolveClose()` to settle before continuing.
  await new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
// [L42] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L43] Blank line separating the surrounding declarations, statements, or document blocks.

// [L44] Call `test.beforeEach` with a promise-returning callback whose body follows.
test.beforeEach(async ({ page }) => {
  // [L45] Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/session', (route) => route.fulfill({ json: SESSION_DEFAULTS }));
  // [L46] Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: TEST_JOB } }));
// [L47] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L48] Blank line separating the surrounding declarations, statements, or document blocks.

// [L49] Define helper `openAndFillOrder` with parameters page for the fixture operations below.
async function openAndFillOrder(page: Page) {
  // [L50] Navigate `page` to `origin`. Wait for completion before continuing.
  await page.goto(origin);
  // [L51] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  // [L52] Replace the matched form control text with "test-secret-api-key". Wait for completion before continuing.
  await page.getByLabel('OpenAI API key', { exact: false }).fill('test-secret-api-key');
  // [L53] Replace the matched form control text with "685-2012345". Wait for completion before continuing.
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  // [L54] Call `page.getByLabel('URLA', { exact: false }).setInputFiles` with `PDF_FIXTURE`. Wait for completion before continuing.
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF_FIXTURE);
// [L55] Close the callback or control-flow body for `openAndFillOrder` and finish the surrounding syntax.
}
// [L56] Blank line separating the surrounding declarations, statements, or document blocks.

// [L57] Register a test that "sends CSRF-protected multipart data without R3 credentials and clears the API key after acceptance".
test('sends CSRF-protected multipart data without R3 credentials and clears the API key after acceptance', async ({ page }) => {
  // [L58] Declare `headers` as an empty object.
  let headers: Record<string, string> = {};
  // [L59] Declare `uploadedBody` as "".
  let uploadedBody = '';
  // [L60] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', async (route) => {
    // [L61] Assign the result of `route.request().headers` with no arguments to `headers`.
    headers = route.request().headers();
    // [L62] Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`.
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    // [L63] Answer the intercepted browser request with an object containing status: 202, json: an object containing job: `TEST_JOB`. Wait for completion before continuing.
    await route.fulfill({ status: 202, json: { job: TEST_JOB } });
  // [L64] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L65] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L66] Assert that the result of `page.locator` using "[name=\"username\"], [name=\"password\"]" has this many matching elements: 0. Wait for the asynchronous assertion to settle.
  await expect(page.locator('[name="username"], [name="password"]')).toHaveCount(0);
  // [L67] Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" has form value "openai". Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue('openai');
  // [L68] Assert that the result of `page.locator` using "#provider option" has text an array containing "OpenAI", "Anthropic", "Google", "SpaceXAI". Wait for the asynchronous assertion to settle.
  await expect(page.locator('#provider option')).toHaveText(['OpenAI', 'Anthropic', 'Google', 'SpaceXAI']);
  // [L69] Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Model ID', { exact: false })).toBeVisible();
  // [L70] Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('');
  // [L71] Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has the specified attribute/value "placeholder", "gpt-5.6-sol". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveAttribute('placeholder', 'gpt-5.6-sol');
  // [L72] Assert that the resolved value from `page.locator('#provider').evaluate` using a callback that returns the result of `element.closest('.field')?.nextElementSibling?.contains` using `document.getElementById('model')` strictly equals true.
  expect(await page.locator('#provider').evaluate((element) => element.closest('.field')?.nextElementSibling?.contains(document.getElementById('model')))).toBe(true);
  // [L73] Call `page.getByLabel('Payment method').selectOption` with "Request Payment From The Borrower". Wait for completion before continuing.
  await page.getByLabel('Payment method').selectOption('Request Payment From The Borrower');
  // [L74] Call `page.getByLabel('This is a rush order').check` without arguments. Wait for completion before continuing.
  await page.getByLabel('This is a rush order').check();
  // [L75] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L76] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L77] Assert that `headers['x-csrf-token']` strictly equals `CSRF_TOKEN`.
  expect(headers['x-csrf-token']).toBe(CSRF_TOKEN);
  // [L78] Assert that `headers['content-type']` contains "multipart/form-data; boundary=".
  expect(headers['content-type']).toContain('multipart/form-data; boundary=');
  // [L79] Assert that `uploadedBody` contains "name=\"provider\"\r\n\r\nopenai".
  expect(uploadedBody).toContain('name="provider"\r\n\r\nopenai');
  // [L80] Assert that `uploadedBody` contains "name=\"apiKey\"\r\n\r\ntest-secret-api-key".
  expect(uploadedBody).toContain('name="apiKey"\r\n\r\ntest-secret-api-key');
  // [L81] Assert that `uploadedBody` does not satisfy: contains "name=\"openaiApiKey\"".
  expect(uploadedBody).not.toContain('name="openaiApiKey"');
  // [L82] Assert that `uploadedBody` matches `/name="model"\r\n\r\n\r\n--/`.
  expect(uploadedBody).toMatch(/name="model"\r\n\r\n\r\n--/);
  // [L83] Assert that `uploadedBody` contains "name=\"loanNumber\"\r\n\r\n685-2012345".
  expect(uploadedBody).toContain('name="loanNumber"\r\n\r\n685-2012345');
  // [L84] Assert that `uploadedBody` contains "Request Payment From The Borrower".
  expect(uploadedBody).toContain('Request Payment From The Borrower');
  // [L85] Assert that `uploadedBody` contains "name=\"rushOrder\"\r\n\r\ntrue".
  expect(uploadedBody).toContain('name="rushOrder"\r\n\r\ntrue');
  // [L86] Assert that `uploadedBody` contains "filename=\"test-urla.pdf\"".
  expect(uploadedBody).toContain('filename="test-urla.pdf"');
  // [L87] Assert that `uploadedBody` does not satisfy: contains "name=\"username\"".
  expect(uploadedBody).not.toContain('name="username"');
  // [L88] Assert that `uploadedBody` does not satisfy: contains "name=\"password\"".
  expect(uploadedBody).not.toContain('name="password"');
  // [L89] Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  // [L90] Assert that the result of `page.getByLabel` using "URLA", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('URLA', { exact: false })).toHaveValue('');
  // [L91] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L92] Declare `stored` as the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }`.
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  // [L93] Assert that `stored` deeply equals an object containing local: an empty object, session: an object containing 'appraisal-desk-active-job': `TEST_JOB.id`.
  expect(stored).toEqual({ local: {}, session: { 'appraisal-desk-active-job': TEST_JOB.id } });
// [L94] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L95] Blank line separating the surrounding declarations, statements, or document blocks.

// [L96] Iterate const { provider, name, defaultModel } over an array containing an object containing provider: "anthropic", name: "Anthropic", defaultModel: "claude-opus-5", an object containing provider: "google", name: "Google Gemini", defaultModel: "gemini-3.8-flash", an object containing provider: "xai", name: "Grok", defaultModel: "grok-4.6".
for (const { provider, name, defaultModel } of [
  // [L97] Set fixture property `provider` to "anthropic". Set fixture property `name` to "Anthropic". Set fixture property `defaultModel` to "claude-opus-5".
  { provider: 'anthropic', name: 'Anthropic', defaultModel: 'claude-opus-5' },
  // [L98] Set fixture property `provider` to "google". Set fixture property `name` to "Google Gemini". Set fixture property `defaultModel` to "gemini-3.8-flash".
  { provider: 'google', name: 'Google Gemini', defaultModel: 'gemini-3.8-flash' },
  // [L99] Set fixture property `provider` to "xai". Set fixture property `name` to "Grok". Set fixture property `defaultModel` to "grok-4.6".
  { provider: 'xai', name: 'Grok', defaultModel: 'grok-4.6' },
// [L100] Call `test` with text interpolating `name`, a promise-returning callback whose body follows.
]) test(`switches to ${name}, clears the previous key, and submits its blank default model`, async ({ page }) => {
  // [L101] Declare `uploadedBody` as "".
  let uploadedBody = '';
  // [L102] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => {
    // [L103] Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`.
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    // [L104] Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller.
    return route.fulfill({ status: 202, json: { job: TEST_JOB } });
  // [L105] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L106] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L107] Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `provider`. Wait for completion before continuing.
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption(provider);
  // [L108] Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveValue('');
  // [L109] Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has the specified attribute/value "placeholder", text interpolating `name`. Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveAttribute('placeholder', `Enter your ${name} API key`);
  // [L110] Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('');
  // [L111] Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has the specified attribute/value "placeholder", `defaultModel`. Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveAttribute('placeholder', defaultModel);
  // [L112] Assert that the result of `page.locator` using "#model-help" contains text text interpolating `defaultModel`. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#model-help')).toContainText(`Leave blank to use ${defaultModel}`);
  // [L113] Assert that the result of `page.locator` using "#api-key-help" contains text text interpolating "xAI" when `provider` strictly equals "xai", otherwise `name`. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#api-key-help')).toContainText(`sent to ${provider === 'xai' ? 'xAI' : name}`);
  // [L114] Assert that the result of `page.locator` using "#api-key-help" does not satisfy: contains text "OpenAI". Wait for the asynchronous assertion to settle.
  await expect(page.locator('#api-key-help')).not.toContainText('OpenAI');
  // [L115] Run the following branch when `provider` strictly equals "google". Assert that the result of `page.locator` using "#api-key-help" contains text "data handling depend on your Google account settings and Google's terms". Wait for the asynchronous assertion to settle.
  if (provider === 'google') await expect(page.locator('#api-key-help')).toContainText("data handling depend on your Google account settings and Google's terms");
  // [L116] Replace the matched form control text with text interpolating `provider`. Wait for completion before continuing.
  await page.getByLabel(`${name} API key`, { exact: false }).fill(`synthetic-${provider}-key`);
  // [L117] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L118] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L119] Assert that `uploadedBody` contains text interpolating `provider`.
  expect(uploadedBody).toContain(`name="provider"\r\n\r\n${provider}`);
  // [L120] Assert that `uploadedBody` contains text interpolating `provider`.
  expect(uploadedBody).toContain(`name="apiKey"\r\n\r\nsynthetic-${provider}-key`);
  // [L121] Assert that `uploadedBody` does not satisfy: contains "test-secret-api-key".
  expect(uploadedBody).not.toContain('test-secret-api-key');
  // [L122] Assert that `uploadedBody` matches `/name="model"\r\n\r\n\r\n--/`.
  expect(uploadedBody).toMatch(/name="model"\r\n\r\n\r\n--/);
  // [L123] Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveValue('');
  // [L124] Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toBeDisabled();
// [L125] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L126] Blank line separating the surrounding declarations, statements, or document blocks.

// [L127] Iterate const provider over an array containing "anthropic", "google", "xai".
for (const provider of ['anthropic', 'google', 'xai'] as const) test(`keeps all provider custom models and preserves ${provider} during session renewal`, async ({ page }) => {
  // [L128] Declare `expired` as true.
  let expired = true;
  // [L129] Declare `uploadedBody` as "".
  let uploadedBody = '';
  // [L130] Declare `sessionReads` as 0.
  let sessionReads = 0;
  // [L131] Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/session', (route) => {
    // [L132] Assign 1 to `sessionReads`, using +=.
    sessionReads += 1;
    // [L133] Return the result of `route.fulfill` using an object whose fields are defined below to the caller.
    return route.fulfill({ json: { ...SESSION_DEFAULTS, model: 'server-default-must-not-overwrite',
      // [L134] Set fixture property `modelDefaults` to an object containing values copied from `SESSION_DEFAULTS.modelDefaults`, [provider]: text interpolating `provider` when `sessionReads` is greater than 1, otherwise `SESSION_DEFAULTS.modelDefaults[provider]`.
      modelDefaults: { ...SESSION_DEFAULTS.modelDefaults, [provider]: sessionReads > 1 ? `${provider}-future-default` : SESSION_DEFAULTS.modelDefaults[provider] } } });
  // [L135] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L136] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => {
    // [L137] Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`.
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    // [L138] Return the result of `route.fulfill` using an object containing status: 403, json: an object containing error: `{ message: 'Session expired.' }` when `expired`, otherwise an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller.
    return route.fulfill(expired
      // [L139] Set fixture property `status` to 403. Set fixture property `json` to an object containing error: an object containing message: "Session expired.".
      ? { status: 403, json: { error: { message: 'Session expired.' } } }
      // [L140] Set fixture property `status` to 202. Set fixture property `json` to an object containing job: `TEST_JOB`.
      : { status: 202, json: { job: TEST_JOB } });
  // [L141] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L142] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L143] Declare `model` as the result of `page.getByLabel` using "Model ID", an object containing exact: false.
  const model = page.getByLabel('Model ID', { exact: false });
  // [L144] Replace the matched form control text with "custom/openai-model:2026". Wait for completion before continuing.
  await model.fill('custom/openai-model:2026');
  // [L145] Iterate const choice over an array containing "anthropic", "google", "xai".
  for (const choice of ['anthropic', 'google', 'xai']) {
    // [L146] Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `choice`. Wait for completion before continuing.
    await page.getByRole('combobox', { name: 'AI provider' }).selectOption(choice);
    // [L147] Assert that `model` has form value "". Wait for the asynchronous assertion to settle.
    await expect(model).toHaveValue('');
    // [L148] Assert that the result of `page.locator` using "#apiKey" has form value "". Wait for the asynchronous assertion to settle.
    await expect(page.locator('#apiKey')).toHaveValue('');
    // [L149] Replace the matched form control text with text interpolating `choice`. Wait for completion before continuing.
    await model.fill(`custom/${choice}-model:2026`);
    // [L150] Replace the matched form control text with text interpolating `choice`. Wait for completion before continuing.
    await page.locator('#apiKey').fill(`synthetic-${choice}-key`);
  // [L151] Close the callback or control-flow body and finish the surrounding syntax.
  }
  // [L152] Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with "openai". Wait for completion before continuing.
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('openai');
  // [L153] Assert that `model` has form value "custom/openai-model:2026". Wait for the asynchronous assertion to settle.
  await expect(model).toHaveValue('custom/openai-model:2026');
  // [L154] Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  // [L155] Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `provider`. Wait for completion before continuing.
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption(provider);
  // [L156] Assert that `model` has form value text interpolating `provider`. Wait for the asynchronous assertion to settle.
  await expect(model).toHaveValue(`custom/${provider}-model:2026`);
  // [L157] Assert that the result of `page.locator` using "#apiKey" has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.locator('#apiKey')).toHaveValue('');
  // [L158] Replace the matched form control text with text interpolating `provider`. Wait for completion before continuing.
  await page.locator('#apiKey').fill(`synthetic-${provider}-key`);
  // [L159] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L160] Assert that the result of `page.getByRole` using "alert" contains text "Session expired.". Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('alert')).toContainText('Session expired.');
  // [L161] Assign false to `expired`.
  expired = false;
  // [L162] Click `page.getByRole('button', { name: 'Reconnect' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Reconnect' }).click();
  // [L163] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  // [L164] Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" has form value `provider`. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue(provider);
  // [L165] Assert that `model` has form value text interpolating `provider`. Wait for the asynchronous assertion to settle.
  await expect(model).toHaveValue(`custom/${provider}-model:2026`);
  // [L166] Assert that `model` has the specified attribute/value "placeholder", text interpolating `provider`. Wait for the asynchronous assertion to settle.
  await expect(model).toHaveAttribute('placeholder', `${provider}-future-default`);
  // [L167] Assert that the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }` deeply equals an object containing local: an empty object, session: an empty object.
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({ local: {}, session: {} });
  // [L168] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L169] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L170] Assert that `uploadedBody` contains text interpolating `provider`.
  expect(uploadedBody).toContain(`name="model"\r\n\r\ncustom/${provider}-model:2026`);
  // [L171] Assert that `uploadedBody` contains text interpolating `provider`.
  expect(uploadedBody).toContain(`name="provider"\r\n\r\n${provider}`);
// [L172] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L173] Blank line separating the surrounding declarations, statements, or document blocks.

// [L174] Register a test that "waits for human R3 sign-in across refresh and resumes preparation automatically".
test('waits for human R3 sign-in across refresh and resumes preparation automatically', async ({ page }) => {
  // [L175] Declare `submissions` as 0.
  let submissions = 0;
  // [L176] Declare `currentJob` as an object containing values copied from `TEST_JOB`.
  let currentJob = { ...TEST_JOB };
  // [L177] Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/session', (route) => route.fulfill({ json: {
    // [L178] Set fixture property `csrfToken` to `CSRF_TOKEN`.
    csrfToken: CSRF_TOKEN,
    // [L179] Set fixture property `model` to "gpt-5.6-sol".
    model: 'gpt-5.6-sol',
    // [L180] Copy the entries of an object containing activeJob: `currentJob` when `submissions`, otherwise an empty object into this fixture.
    ...(submissions ? { activeJob: currentJob } : {}),
  // [L181] Close the fixture object for `json` and finish the surrounding syntax.
  } }));
  // [L182] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => {
    // [L183] Assign 1 to `submissions`, using +=.
    submissions += 1;
    // [L184] Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `currentJob` to the caller.
    return route.fulfill({ status: 202, json: { job: currentJob } });
  // [L185] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L186] Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  // [L187] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L188] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L189] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L190] Assign an object containing values copied from `currentJob`, status: "awaiting_login", message: "Sign in to R3 AMC in the browser that opened." to `currentJob`.
  currentJob = { ...currentJob, status: 'awaiting_login', message: 'Sign in to R3 AMC in the browser that opened.' };
  // [L191] Assert that the result of `page.getByRole` using "heading", an object containing name: "Sign in to R3 AMC." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Sign in to R3 AMC.' })).toBeVisible({ timeout: 10000 });
  // [L192] Assert that the result of `page.locator` using "#login-notice" contains text "complete any CAPTCHA". Wait for the asynchronous assertion to settle.
  await expect(page.locator('#login-notice')).toContainText('complete any CAPTCHA');
  // [L193] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L194] Assert that the result of `page.getByLabel` using "Loan number", an object containing exact: false is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Loan number', { exact: false })).toBeDisabled();
  // [L195] Assert that the result of `page.locator` using "#review-notice" is hidden. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#review-notice')).toBeHidden();
  // [L196] Call `page.reload` without arguments. Wait for completion before continuing.
  await page.reload();
  // [L197] Assert that the result of `page.getByRole` using "heading", an object containing name: "Sign in to R3 AMC." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Sign in to R3 AMC.' })).toBeVisible();
  // [L198] Assert that the result of `page.locator` using "#login-notice" is visible. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#login-notice')).toBeVisible();
  // [L199] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L200] Assign an object containing values copied from `currentJob`, status: "preparing", message: "Preparing the appraisal order after sign-in." to `currentJob`.
  currentJob = { ...currentJob, status: 'preparing', message: 'Preparing the appraisal order after sign-in.' };
  // [L201] Assert that the result of `page.getByRole` using "heading", an object containing name: "Preparing your R3 order." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Preparing your R3 order.' })).toBeVisible({ timeout: 10000 });
  // [L202] Assert that the result of `page.locator` using "#login-notice" is hidden. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#login-notice')).toBeHidden();
  // [L203] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L204] Assert that `submissions` strictly equals 1.
  expect(submissions).toBe(1);
  // [L205] Declare `stored` as the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }`.
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  // [L206] Assert that `stored` deeply equals an object containing local: an empty object, session: an object containing 'appraisal-desk-active-job': `TEST_JOB.id`.
  expect(stored).toEqual({ local: {}, session: { 'appraisal-desk-active-job': TEST_JOB.id } });
// [L207] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L208] Blank line separating the surrounding declarations, statements, or document blocks.

// [L209] Register a test that "hands control to the user and keeps the form locked until the browser closes".
test('keeps the form locked until handoff is ready or the browser closes', async ({ page }) => {
  // [L210] Declare `currentJob` as an object containing values copied from `TEST_JOB`, status: "awaiting_review", message: "Review the prepared order in the open browser.", warnings: an array containing "Verify the property type.", "<img src=x onerror=alert(1)>".
  let currentJob = { ...TEST_JOB, status: 'awaiting_review', message: 'Review the prepared order in the open browser.', warnings: ['Verify the property type.', '<img src=x onerror=alert(1)>'] };
  // [L211] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => route.fulfill({ status: 202, json: { job: currentJob } }));
  // [L212] Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  // [L213] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L214] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L215] Assert that the result of `page.getByRole` using "heading", an object containing name: "Review and finish your order." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Review and finish your order.' })).toBeVisible();
  // [L216] Assert that the result of `page.getByText` using "Continue in the R3 AMC browser.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByText('Continue in the R3 AMC browser.', { exact: true })).toBeVisible();
  // [L217] Assert that the result of `page.getByText` using "Verify the property type.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByText('Verify the property type.', { exact: true })).toBeVisible();
  // [L218] Assert that the result of `page.locator` using "#warnings-list img" has this many matching elements: 0. Wait for the asynchronous assertion to settle.
  await expect(page.locator('#warnings-list img')).toHaveCount(0);
  // [L219] Assert that the result of `page.locator` using "#warnings-list" contains text "<img src=x onerror=alert(1)>". Wait for the asynchronous assertion to settle.
  await expect(page.locator('#warnings-list')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.getByRole('button', { name: 'Prepare another order' })).toBeHidden();
  // [L220] Assign an object containing values copied from `currentJob`, status: "user_submitted", message: "Submission was detected. Close the R3 browser when finished." to `currentJob`.
  currentJob = { ...currentJob, status: 'user_submitted', message: 'Submission was detected. Close the R3 browser when finished.' };
  // [L221] Assert that the result of `page.getByRole` using "heading", an object containing name: "Submission detected." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Submission detected.' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Prepare another order' })).toBeHidden();
  // [L222] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L223] Assign an object containing values copied from `currentJob`, status: "browser_closed", message: "The R3 browser was closed." to `currentJob`.
  currentJob = { ...currentJob, status: 'browser_closed', message: 'The R3 browser was closed.' };
  // [L224] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your browser session is closed." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your browser session is closed.' })).toBeVisible({ timeout: 10000 });
  // [L225] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare another order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare another order' })).toBeEnabled();
  // [L226] Assert that the resolved value from `page.evaluate` using a callback that returns `sessionStorage.length` strictly equals 0.
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
// [L227] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L228] Blank line separating the surrounding declarations, statements, or document blocks.

// [L229] Register a test that "rejects invalid loan numbers and non-PDF files before sending an order".
test('rejects invalid loan numbers and non-PDF files before sending an order', async ({ page }) => {
  // [L230] Declare `submissions` as 0.
  let submissions = 0;
  // [L231] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => {
    // [L232] Assign 1 to `submissions`, using +=.
    submissions += 1;
    // [L233] Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller.
    return route.fulfill({ status: 202, json: { job: TEST_JOB } });
  // [L234] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L235] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L236] Declare `loanNumber` as the result of `page.getByLabel` using "Loan number", an object containing exact: false.
  const loanNumber = page.getByLabel('Loan number', { exact: false });
  // [L237] Replace the matched form control text with "685-201234". Wait for completion before continuing.
  await loanNumber.fill('685-201234');
  // [L238] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L239] Assert that the resolved value from `loanNumber.evaluate` using a callback that returns `element.validity.patternMismatch` strictly equals true.
  expect(await loanNumber.evaluate((element: HTMLInputElement) => element.validity.patternMismatch)).toBe(true);
  // [L240] Replace the matched form control text with "685-2012345". Wait for completion before continuing.
  await loanNumber.fill('685-2012345');
  // [L241] Declare `urla` as the result of `page.getByLabel` using "URLA", an object containing exact: false.
  const urla = page.getByLabel('URLA', { exact: false });
  // [L242] Call `urla.setInputFiles` with an object containing name: "test.txt", mimeType: "text/plain", buffer: the result of `Buffer.from` using "not a PDF". Wait for completion before continuing.
  await urla.setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('not a PDF') });
  // [L243] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L244] Assert that the resolved value from `urla.evaluate` using a callback that returns `element.validationMessage` strictly equals "Choose a PDF document.".
  expect(await urla.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe('Choose a PDF document.');
  // [L245] Assert that `submissions` strictly equals 0.
  expect(submissions).toBe(0);
// [L246] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L247] Blank line separating the surrounding declarations, statements, or document blocks.

// [L248] Register a test that "shows server validation details and permits correction without losing inputs".
test('shows server validation details and permits correction without losing inputs', async ({ page }) => {
  // [L249] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => route.fulfill({
    // [L250] Set fixture property `status` to 422.
    status: 422,
    // [L251] Set fixture property `json` to an object containing error: an object containing code: "VALIDATION_ERROR", message: "The order has an invalid field.", details: an array containing an object containing field: `'fhaCaseNumber'`, message: `'Enter the FHA case number for this loan.'`.
    json: { error: { code: 'VALIDATION_ERROR', message: 'The order has an invalid field.', details: [{ field: 'fhaCaseNumber', message: 'Enter the FHA case number for this loan.' }] } },
  // [L252] Close the fixture object and finish the surrounding syntax.
  }));
  // [L253] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L254] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L255] Assert that the result of `page.getByRole` using "alert" contains text "Enter the FHA case number for this loan.". Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('alert')).toContainText('Enter the FHA case number for this loan.');
  // [L256] Assert that the result of `page.getByLabel` using "FHA case number", an object containing exact: false has the specified attribute/value "aria-invalid", "true". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('FHA case number', { exact: false })).toHaveAttribute('aria-invalid', 'true');
  // [L257] Assert that the result of `page.getByLabel` using "Loan number", an object containing exact: false has form value "685-2012345". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Loan number', { exact: false })).toHaveValue('685-2012345');
  // [L258] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  // [L259] Replace the matched form control text with "123-4567890". Wait for completion before continuing.
  await page.getByLabel('FHA case number', { exact: false }).fill('123-4567890');
  // [L260] Assert that the result of `page.getByLabel` using "FHA case number", an object containing exact: false does not satisfy: has the specified attribute/value "aria-invalid", "true". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('FHA case number', { exact: false })).not.toHaveAttribute('aria-invalid', 'true');
// [L261] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L262] Blank line separating the surrounding declarations, statements, or document blocks.

// [L263] Register a test that "recovers an accepted order after a lost POST response without resubmitting".
test('recovers an accepted order after a lost POST response without resubmitting', async ({ page }) => {
  // [L264] Declare `submissions` as 0.
  let submissions = 0;
  // [L265] Declare `accepted` as false.
  let accepted = false;
  // [L266] Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/session', (route) => route.fulfill({ json: { csrfToken: CSRF_TOKEN, model: 'gpt-5.6-sol', ...(accepted ? { activeJob: TEST_JOB } : {}) } }));
  // [L267] Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/jobs', (route) => {
    // [L268] Assign 1 to `submissions`, using +=.
    submissions += 1;
    // [L269] Assign true to `accepted`.
    accepted = true;
    // [L270] Return the result of `route.abort` using "failed" to the caller.
    return route.abort('failed');
  // [L271] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L272] Call `openAndFillOrder` with `page`. Wait for completion before continuing.
  await openAndFillOrder(page);
  // [L273] Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  // [L274] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L275] Assert that `submissions` strictly equals 1.
  expect(submissions).toBe(1);
  // [L276] Assert that the result of `page.getByRole` using "alert" is hidden. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('alert')).toBeHidden();
  // [L277] Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  // [L278] Call `page.reload` without arguments. Wait for completion before continuing.
  await page.reload();
  // [L279] Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  // [L280] Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  // [L281] Assert that `submissions` strictly equals 1.
  expect(submissions).toBe(1);
// [L282] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L283] Blank line separating the surrounding declarations, statements, or document blocks.

// [L284] Register a test that "offers reconnection when workspace initialization fails".
test('offers reconnection when workspace initialization fails', async ({ page }) => {
  // [L285] Declare `unavailable` as true.
  let unavailable = true;
  // [L286] Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing.
  await page.route('**/api/session', (route) => route.fulfill(unavailable
    // [L287] Set fixture property `status` to 503. Set fixture property `json` to an object containing error: an object containing code: "UNAVAILABLE", message: "The local workspace is unavailable.".
    ? { status: 503, json: { error: { code: 'UNAVAILABLE', message: 'The local workspace is unavailable.' } } }
    // [L288] Set fixture property `json` to an object containing csrfToken: `CSRF_TOKEN`, model: "gpt-5.6-sol".
    : { json: { csrfToken: CSRF_TOKEN, model: 'gpt-5.6-sol' } }));
  // [L289] Navigate `page` to `origin`. Wait for completion before continuing.
  await page.goto(origin);
  // [L290] Assert that the result of `page.getByText` using "The local workspace is unavailable.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByText('The local workspace is unavailable.', { exact: true })).toBeVisible();
  // [L291] Assert that the result of `page.getByRole` using "button", an object containing name: "Workspace connection needed" is disabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Workspace connection needed' })).toBeDisabled();
  // [L292] Assign false to `unavailable`.
  unavailable = false;
  // [L293] Click `page.getByRole('button', { name: 'Reconnect' })` in the synthetic browser test. Wait for completion before continuing.
  await page.getByRole('button', { name: 'Reconnect' }).click();
  // [L294] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  // [L295] Assert that the result of `page.getByRole` using "button", an object containing name: "Reconnect" is hidden. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Reconnect' })).toBeHidden();
// [L296] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L297] Blank line separating the surrounding declarations, statements, or document blocks.

// [L298] Register a test that "fits desktop and mobile viewports and exposes keyboard focus".
test('fits desktop and mobile viewports and exposes keyboard focus', async ({ page }) => {
  // [L299] Call `page.setViewportSize` with an object containing width: 1440, height: 1100. Wait for completion before continuing.
  await page.setViewportSize({ width: 1440, height: 1100 });
  // [L300] Navigate `page` to `origin`. Wait for completion before continuing.
  await page.goto(origin);
  // [L301] Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  // [L302] Call `page.keyboard.press` with "Tab". Wait for completion before continuing.
  await page.keyboard.press('Tab');
  // [L303] Await an assertion that the Skip to order form link has keyboard focus.
  await expect(page.getByRole('link', { name: 'Skip to order form' })).toBeFocused();
  // [L304] Assert that the result of `page.getByRole` using "link", an object containing name: "Skip to order form" is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('link', { name: 'Skip to order form' })).toBeVisible();
  // [L305] Call `page.setViewportSize` with an object containing width: 375, height: 812. Wait for completion before continuing.
  await page.setViewportSize({ width: 375, height: 812 });
  // [L306] Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with "google". Wait for completion before continuing.
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('google');
  // [L307] Assert that the resolved value from `page.evaluate` using a callback that returns `document.documentElement.scrollWidth` is at most `window.innerWidth` strictly equals true.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // [L308] Assert that the result of `page.getByRole` using "heading", an object containing name: `/A prepared order\./` is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByRole('heading', { name: /A prepared order\./ })).toBeVisible();
  // [L309] Assert that the result of `page.getByLabel` using "Google Gemini API key", an object containing exact: false is visible. Wait for the asynchronous assertion to settle.
  await expect(page.getByLabel('Google Gemini API key', { exact: false })).toBeVisible();
// [L310] Close the callback or control-flow body and finish the surrounding syntax.
});


for (const status of ['awaiting_review', 'user_submitted', 'browser_closed', 'failed']) test(`prepares a second order after explicit reset from ${status}`, async ({ page }) => {
  const firstJob = { ...TEST_JOB, status, canStartAnother: true, warnings: ['Review the first order.'] };
  const secondJob = { ...TEST_JOB, id: 'test-job-002' };
  const submissions: string[] = [];
  await page.route('**/api/jobs', (route) => {
    submissions.push(route.request().postDataBuffer()?.toString('utf8') ?? '');
    return route.fulfill({ status: 202, json: { job: submissions.length === 1 ? firstJob : secondJob } });
  });
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: submissions.length === 1 ? firstJob : secondJob } }));
  await openAndFillOrder(page);
  await page.locator('#provider').selectOption('anthropic');
  await page.locator('#model').fill('custom/anthropic-order-model');
  await page.locator('#apiKey').fill('synthetic-first-key');
  await page.locator('#fhaCaseNumber').fill('123-4567890');
  await page.locator('#rushOrder').check();
  await page.locator('#paymentMethod').selectOption('Request Payment From The Borrower');
  await page.locator('#salesContract').setInputFiles({ ...PDF_FIXTURE, name: 'first-contract.pdf' });
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('button', { name: 'Prepare another order' })).toBeEnabled();
  await expect(page.locator('#loanNumber')).toHaveValue('685-2012345');
  await expect(page.locator('#loanNumber')).toBeDisabled();
  await expect(page.locator('#job-warnings')).toBeVisible();
  if (status === 'awaiting_review' || status === 'user_submitted') {
    await expect(page.locator('#new-order-notice')).toContainText('Finish your current R3 order first');
    await expect(page.locator('#new-order-notice')).toContainText('replace the current R3 form');
  }
  await page.getByRole('button', { name: 'Prepare another order' }).click();
  expect(submissions).toHaveLength(1);
  await expect(page.getByRole('heading', { name: 'Ready for another order.' })).toBeVisible();
  await expect(page.locator('#loanNumber')).toBeFocused();
  await expect(page.locator('#loanNumber')).toHaveValue('');
  await expect(page.locator('#fhaCaseNumber')).toHaveValue('');
  await expect(page.locator('#rushOrder')).not.toBeChecked();
  await expect(page.locator('#apiKey')).toHaveValue('');
  await expect(page.locator('#urla')).toHaveValue('');
  await expect(page.locator('#salesContract')).toHaveValue('');
  await expect(page.locator('#job-warnings')).toBeHidden();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('#provider')).toHaveValue('anthropic');
  await expect(page.locator('#model')).toHaveValue('custom/anthropic-order-model');
  await expect(page.locator('#paymentMethod')).toHaveValue('Request Payment From The Borrower');
  await page.locator('#loanNumber').fill('685-2098765');
  await page.locator('#apiKey').fill('synthetic-second-key');
  await page.locator('#urla').setInputFiles({ ...PDF_FIXTURE, name: 'second-urla.pdf' });
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toContain('685-2098765');
  expect(submissions[1]).toContain('second-urla.pdf');
  expect(submissions[1]).not.toContain('685-2012345');
  expect(submissions[1]).not.toContain('123-4567890');
  expect(submissions[1]).not.toContain('first-contract.pdf');
  expect(submissions[1]).not.toContain('name="rushOrder"');
  await expect(page.locator('#apiKey')).toHaveValue('');
  expect(await page.evaluate(() => sessionStorage.getItem('appraisal-desk-active-job'))).toBe(secondJob.id);
});

test('offers another order only after the worker reports a completed handoff', async ({ page }) => {
  let currentJob = { ...TEST_JOB, status: 'preparing', canStartAnother: true };
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: currentJob } }));
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  await page.goto(origin);
  await expect(page.getByRole('heading', { name: 'Preparing your R3 order.' })).toBeVisible();
  await expect(page.locator('#new-order-button')).toBeHidden();
  currentJob = { ...currentJob, status: 'awaiting_review', canStartAnother: false };
  await expect(page.getByRole('heading', { name: 'Review and finish your order.' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#new-order-button')).toBeHidden();
  currentJob = { ...currentJob, canStartAnother: true };
  await expect(page.locator('#new-order-button')).toBeEnabled({ timeout: 10000 });
  await expect(page.locator('#new-order-button')).toBeVisible();
});

test('waits for failed-worker cleanup before offering another order', async ({ page }) => {
  let currentJob = { ...TEST_JOB, status: 'failed', canStartAnother: false };
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: currentJob } }));
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  await page.goto(origin);
  await expect(page.getByRole('heading', { name: 'Preparation needs attention.' })).toBeVisible();
  await expect(page.locator('#new-order-button')).toBeHidden();
  await expect(page.locator('#loanNumber')).toBeDisabled();
  currentJob = { ...currentJob, canStartAnother: true };
  await expect(page.locator('#new-order-button')).toBeVisible({ timeout: 10000 });
  await page.locator('#new-order-button').click();
  await expect(page.locator('#loanNumber')).toBeEnabled();
});

for (const staleStatus of ['browser_closed', 'missing']) test(`ignores a late ${staleStatus} poll from the previous order`, async ({ page }) => {
  const firstJob = { ...TEST_JOB, status: 'awaiting_review', canStartAnother: true };
  let secondJob = { ...TEST_JOB, id: 'test-job-002' };
  let releasePoll!: () => void;
  let signalPollStarted!: () => void;
  const pollStarted = new Promise<void>((resolveStarted) => { signalPollStarted = resolveStarted; });
  const pollReleased = new Promise<void>((resolveReleased) => { releasePoll = resolveReleased; });
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: firstJob } }));
  await page.route(`**/api/jobs/${firstJob.id}`, async (route) => {
    signalPollStarted();
    await pollReleased;
    await route.fulfill(staleStatus === 'missing'
      ? { status: 404, json: { error: { message: 'Old order unavailable.' } } }
      : { json: { job: { ...firstJob, status: 'browser_closed' } } });
  });
  await page.route(`**/api/jobs/${secondJob.id}`, (route) => route.fulfill({ json: { job: secondJob } }));
  await page.route('**/api/jobs', (route) => route.fulfill({ status: 202, json: { job: secondJob } }));
  await page.goto(origin);
  await expect(page.locator('#new-order-button')).toBeVisible();
  await pollStarted;
  await page.locator('#new-order-button').click();
  await page.locator('#loanNumber').fill('685-2098765');
  await page.locator('#apiKey').fill('synthetic-second-key');
  await page.locator('#urla').setInputFiles(PDF_FIXTURE);
  if (staleStatus === 'missing') {
    await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
    await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  }
  const oldResponse = page.waitForResponse(`**/api/jobs/${firstJob.id}`);
  releasePoll();
  await oldResponse;
  await expect(page.locator('#loanNumber')).toHaveValue('685-2098765');
  if (staleStatus === 'browser_closed') {
    await expect(page.getByRole('heading', { name: 'Ready for another order.' })).toBeVisible();
    await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  secondJob = { ...secondJob, status: 'preparing' };
  await expect(page.getByRole('heading', { name: 'Preparing your R3 order.' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#loanNumber')).toBeDisabled();
  await expect(page.locator('#connection-message')).toBeHidden();
  expect(await page.evaluate(() => sessionStorage.getItem('appraisal-desk-active-job'))).toBe(secondJob.id);
});

for (const failure of ['lost-response', 'conflict']) test(`does not recover the previous order after a second POST ${failure}`, async ({ page }) => {
  const firstJob = { ...TEST_JOB, status: 'awaiting_review', canStartAnother: true };
  let submissions = 0;
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: firstJob } }));
  await page.route('**/api/jobs', (route) => {
    submissions += 1;
    return failure === 'lost-response' ? route.abort('failed')
      : route.fulfill({ status: 409, json: { error: { message: 'The previous order is still finishing.' } } });
  });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Prepare another order' }).click();
  await page.locator('#loanNumber').fill('685-2098765');
  await page.locator('#apiKey').fill('synthetic-second-key');
  await page.locator('#urla').setInputFiles(PDF_FIXTURE);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not confirm order preparation');
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await expect(page.locator('#apiKey')).toHaveValue('synthetic-second-key');
  await expect(page.locator('#urla')).not.toHaveValue('');
  await expect(page.locator('#loanNumber')).toHaveValue('685-2098765');
  await expect(page.getByRole('heading', { name: 'Ready for another order.' })).toBeVisible();
  expect(submissions).toBe(1);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});

test('recovers the new order after its second POST response is lost', async ({ page }) => {
  const firstJob = { ...TEST_JOB, status: 'awaiting_review', canStartAnother: true };
  const secondJob = { ...TEST_JOB, id: 'test-job-002' };
  let accepted = false;
  let submissions = 0;
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: accepted ? secondJob : firstJob } }));
  await page.route('**/api/jobs', (route) => {
    accepted = true;
    submissions += 1;
    return route.abort('failed');
  });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Prepare another order' }).click();
  await page.locator('#loanNumber').fill('685-2098765');
  await page.locator('#apiKey').fill('synthetic-second-key');
  await page.locator('#urla').setInputFiles(PDF_FIXTURE);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('#apiKey')).toHaveValue('');
  expect(submissions).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('appraisal-desk-active-job'))).toBe(secondJob.id);
});

test('session renewal preserves the next loan instead of restoring its predecessor', async ({ page }) => {
  const firstJob = { ...TEST_JOB, status: 'awaiting_review', canStartAnother: true };
  let expired = true;
  await page.route('**/api/session', (route) => route.fulfill({ json: { ...SESSION_DEFAULTS, activeJob: firstJob } }));
  await page.route('**/api/jobs', (route) => route.fulfill(expired
    ? { status: 403, json: { error: { message: 'Session expired.' } } }
    : { status: 202, json: { job: { ...TEST_JOB, id: 'test-job-002' } } }));
  await page.goto(origin);
  await page.getByRole('button', { name: 'Prepare another order' }).click();
  await page.locator('#loanNumber').fill('685-2098765');
  await page.locator('#apiKey').fill('synthetic-second-key');
  await page.locator('#urla').setInputFiles(PDF_FIXTURE);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('alert')).toContainText('Session expired.');
  expired = false;
  await page.getByRole('button', { name: 'Reconnect' }).click();
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await expect(page.locator('#loanNumber')).toHaveValue('685-2098765');
  await expect(page.locator('#apiKey')).toHaveValue('synthetic-second-key');
  await expect(page.locator('#urla')).not.toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Ready for another order.' })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
});
