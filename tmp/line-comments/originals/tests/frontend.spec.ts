import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

const CSRF_TOKEN = 'test-session-csrf-token';
const SESSION_DEFAULTS = { csrfToken: CSRF_TOKEN, defaultProvider: 'openai', modelDefaults: { openai: 'gpt-5.6-sol', anthropic: 'claude-opus-5', google: 'gemini-3.8-flash', xai: 'grok-4.6' } };
const TEST_JOB = { id: 'test-job-001', status: 'queued', message: 'Your order is queued.' };
const PDF_FIXTURE = { name: 'test-urla.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nTest fixture\n%%EOF') };
let server: Server;
let origin: string;

test.beforeAll(async () => {
  const files: Record<string, { name: string; contentType: string }> = {
    '/': { name: 'index.html', contentType: 'text/html; charset=utf-8' },
    '/styles.css': { name: 'styles.css', contentType: 'text/css; charset=utf-8' },
    '/app.js': { name: 'app.js', contentType: 'application/javascript; charset=utf-8' },
  };
  server = createServer((request, response) => {
    const file = files[request.url ?? ''];
    if (!file) {
      response.writeHead(404).end();
      return;
    }
    void readFile(resolve('public', file.name)).then((body) => {
      response.writeHead(200, { 'Content-Type': file.contentType }).end(body);
    }).catch(() => response.writeHead(500).end());
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('The UI fixture server did not bind to a port.');
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/session', (route) => route.fulfill({ json: SESSION_DEFAULTS }));
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: TEST_JOB } }));
});

async function openAndFillOrder(page: Page) {
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await page.getByLabel('OpenAI API key', { exact: false }).fill('test-secret-api-key');
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF_FIXTURE);
}

test('sends CSRF-protected multipart data without R3 credentials and clears the API key after acceptance', async ({ page }) => {
  let headers: Record<string, string> = {};
  let uploadedBody = '';
  await page.route('**/api/jobs', async (route) => {
    headers = route.request().headers();
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    await route.fulfill({ status: 202, json: { job: TEST_JOB } });
  });
  await openAndFillOrder(page);
  await expect(page.locator('[name="username"], [name="password"]')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue('openai');
  await expect(page.locator('#provider option')).toHaveText(['OpenAI', 'Anthropic', 'Google', 'SpaceXAI']);
  await expect(page.getByLabel('Model ID', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('');
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveAttribute('placeholder', 'gpt-5.6-sol');
  expect(await page.locator('#provider').evaluate((element) => element.closest('.field')?.nextElementSibling?.contains(document.getElementById('model')))).toBe(true);
  await page.getByLabel('Payment method').selectOption('Request Payment From The Borrower');
  await page.getByLabel('This is a rush order').check();
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  expect(headers['x-csrf-token']).toBe(CSRF_TOKEN);
  expect(headers['content-type']).toContain('multipart/form-data; boundary=');
  expect(uploadedBody).toContain('name="provider"\r\n\r\nopenai');
  expect(uploadedBody).toContain('name="apiKey"\r\n\r\ntest-secret-api-key');
  expect(uploadedBody).not.toContain('name="openaiApiKey"');
  expect(uploadedBody).toMatch(/name="model"\r\n\r\n\r\n--/);
  expect(uploadedBody).toContain('name="loanNumber"\r\n\r\n685-2012345');
  expect(uploadedBody).toContain('Request Payment From The Borrower');
  expect(uploadedBody).toContain('name="rushOrder"\r\n\r\ntrue');
  expect(uploadedBody).toContain('filename="test-urla.pdf"');
  expect(uploadedBody).not.toContain('name="username"');
  expect(uploadedBody).not.toContain('name="password"');
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  await expect(page.getByLabel('URLA', { exact: false })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(stored).toEqual({ local: {}, session: { 'appraisal-desk-active-job': TEST_JOB.id } });
});

for (const { provider, name, defaultModel } of [
  { provider: 'anthropic', name: 'Anthropic', defaultModel: 'claude-opus-5' },
  { provider: 'google', name: 'Google Gemini', defaultModel: 'gemini-3.8-flash' },
  { provider: 'xai', name: 'Grok', defaultModel: 'grok-4.6' },
]) test(`switches to ${name}, clears the previous key, and submits its blank default model`, async ({ page }) => {
  let uploadedBody = '';
  await page.route('**/api/jobs', (route) => {
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    return route.fulfill({ status: 202, json: { job: TEST_JOB } });
  });
  await openAndFillOrder(page);
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption(provider);
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveValue('');
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveAttribute('placeholder', `Enter your ${name} API key`);
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('');
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveAttribute('placeholder', defaultModel);
  await expect(page.locator('#model-help')).toContainText(`Leave blank to use ${defaultModel}`);
  await expect(page.locator('#api-key-help')).toContainText(`sent to ${provider === 'xai' ? 'xAI' : name}`);
  await expect(page.locator('#api-key-help')).not.toContainText('OpenAI');
  if (provider === 'google') await expect(page.locator('#api-key-help')).toContainText("data handling depend on your Google account settings and Google's terms");
  await page.getByLabel(`${name} API key`, { exact: false }).fill(`synthetic-${provider}-key`);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  expect(uploadedBody).toContain(`name="provider"\r\n\r\n${provider}`);
  expect(uploadedBody).toContain(`name="apiKey"\r\n\r\nsynthetic-${provider}-key`);
  expect(uploadedBody).not.toContain('test-secret-api-key');
  expect(uploadedBody).toMatch(/name="model"\r\n\r\n\r\n--/);
  await expect(page.getByLabel(`${name} API key`, { exact: false })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toBeDisabled();
});

for (const provider of ['anthropic', 'google', 'xai'] as const) test(`keeps all provider custom models and preserves ${provider} during session renewal`, async ({ page }) => {
  let expired = true;
  let uploadedBody = '';
  let sessionReads = 0;
  await page.route('**/api/session', (route) => {
    sessionReads += 1;
    return route.fulfill({ json: { ...SESSION_DEFAULTS, model: 'server-default-must-not-overwrite',
      modelDefaults: { ...SESSION_DEFAULTS.modelDefaults, [provider]: sessionReads > 1 ? `${provider}-future-default` : SESSION_DEFAULTS.modelDefaults[provider] } } });
  });
  await page.route('**/api/jobs', (route) => {
    uploadedBody = route.request().postDataBuffer()?.toString('utf8') ?? '';
    return route.fulfill(expired
      ? { status: 403, json: { error: { message: 'Session expired.' } } }
      : { status: 202, json: { job: TEST_JOB } });
  });
  await openAndFillOrder(page);
  const model = page.getByLabel('Model ID', { exact: false });
  await model.fill('custom/openai-model:2026');
  for (const choice of ['anthropic', 'google', 'xai']) {
    await page.getByRole('combobox', { name: 'AI provider' }).selectOption(choice);
    await expect(model).toHaveValue('');
    await expect(page.locator('#apiKey')).toHaveValue('');
    await model.fill(`custom/${choice}-model:2026`);
    await page.locator('#apiKey').fill(`synthetic-${choice}-key`);
  }
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('openai');
  await expect(model).toHaveValue('custom/openai-model:2026');
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption(provider);
  await expect(model).toHaveValue(`custom/${provider}-model:2026`);
  await expect(page.locator('#apiKey')).toHaveValue('');
  await page.locator('#apiKey').fill(`synthetic-${provider}-key`);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('alert')).toContainText('Session expired.');
  expired = false;
  await page.getByRole('button', { name: 'Reconnect' }).click();
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue(provider);
  await expect(model).toHaveValue(`custom/${provider}-model:2026`);
  await expect(model).toHaveAttribute('placeholder', `${provider}-future-default`);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({ local: {}, session: {} });
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  expect(uploadedBody).toContain(`name="model"\r\n\r\ncustom/${provider}-model:2026`);
  expect(uploadedBody).toContain(`name="provider"\r\n\r\n${provider}`);
});

test('waits for human R3 sign-in across refresh and resumes preparation automatically', async ({ page }) => {
  let submissions = 0;
  let currentJob = { ...TEST_JOB };
  await page.route('**/api/session', (route) => route.fulfill({ json: {
    csrfToken: CSRF_TOKEN,
    model: 'gpt-5.6-sol',
    ...(submissions ? { activeJob: currentJob } : {}),
  } }));
  await page.route('**/api/jobs', (route) => {
    submissions += 1;
    return route.fulfill({ status: 202, json: { job: currentJob } });
  });
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  await openAndFillOrder(page);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  currentJob = { ...currentJob, status: 'awaiting_login', message: 'Sign in to R3 AMC in the browser that opened.' };
  await expect(page.getByRole('heading', { name: 'Sign in to R3 AMC.' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#login-notice')).toContainText('complete any CAPTCHA');
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  await expect(page.getByLabel('Loan number', { exact: false })).toBeDisabled();
  await expect(page.locator('#review-notice')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to R3 AMC.' })).toBeVisible();
  await expect(page.locator('#login-notice')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  currentJob = { ...currentJob, status: 'preparing', message: 'Preparing the appraisal order after sign-in.' };
  await expect(page.getByRole('heading', { name: 'Preparing your R3 order.' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#login-notice')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  expect(submissions).toBe(1);
  const stored = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(stored).toEqual({ local: {}, session: { 'appraisal-desk-active-job': TEST_JOB.id } });
});

test('hands control to the user and keeps the form locked until the browser closes', async ({ page }) => {
  let currentJob = { ...TEST_JOB, status: 'awaiting_review', message: 'Review the prepared order in the open browser.', warnings: ['Verify the property type.', '<img src=x onerror=alert(1)>'] };
  await page.route('**/api/jobs', (route) => route.fulfill({ status: 202, json: { job: currentJob } }));
  await page.route('**/api/jobs/*', (route) => route.fulfill({ json: { job: currentJob } }));
  await openAndFillOrder(page);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Review and finish your order.' })).toBeVisible();
  await expect(page.getByText('Continue in the R3 AMC browser.', { exact: true })).toBeVisible();
  await expect(page.getByText('Verify the property type.', { exact: true })).toBeVisible();
  await expect(page.locator('#warnings-list img')).toHaveCount(0);
  await expect(page.locator('#warnings-list')).toContainText('<img src=x onerror=alert(1)>');
  currentJob = { ...currentJob, status: 'user_submitted', message: 'Submission was detected. Close the R3 browser when finished.' };
  await expect(page.getByRole('heading', { name: 'Submission detected.' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  currentJob = { ...currentJob, status: 'browser_closed', message: 'The R3 browser was closed.' };
  await expect(page.getByRole('heading', { name: 'Your browser session is closed.' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Prepare another order' })).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});

test('rejects invalid loan numbers and non-PDF files before sending an order', async ({ page }) => {
  let submissions = 0;
  await page.route('**/api/jobs', (route) => {
    submissions += 1;
    return route.fulfill({ status: 202, json: { job: TEST_JOB } });
  });
  await openAndFillOrder(page);
  const loanNumber = page.getByLabel('Loan number', { exact: false });
  await loanNumber.fill('685-201234');
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  expect(await loanNumber.evaluate((element: HTMLInputElement) => element.validity.patternMismatch)).toBe(true);
  await loanNumber.fill('685-2012345');
  const urla = page.getByLabel('URLA', { exact: false });
  await urla.setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('not a PDF') });
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  expect(await urla.evaluate((element: HTMLInputElement) => element.validationMessage)).toBe('Choose a PDF document.');
  expect(submissions).toBe(0);
});

test('shows server validation details and permits correction without losing inputs', async ({ page }) => {
  await page.route('**/api/jobs', (route) => route.fulfill({
    status: 422,
    json: { error: { code: 'VALIDATION_ERROR', message: 'The order has an invalid field.', details: [{ field: 'fhaCaseNumber', message: 'Enter the FHA case number for this loan.' }] } },
  }));
  await openAndFillOrder(page);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter the FHA case number for this loan.');
  await expect(page.getByLabel('FHA case number', { exact: false })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Loan number', { exact: false })).toHaveValue('685-2012345');
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await page.getByLabel('FHA case number', { exact: false }).fill('123-4567890');
  await expect(page.getByLabel('FHA case number', { exact: false })).not.toHaveAttribute('aria-invalid', 'true');
});

test('recovers an accepted order after a lost POST response without resubmitting', async ({ page }) => {
  let submissions = 0;
  let accepted = false;
  await page.route('**/api/session', (route) => route.fulfill({ json: { csrfToken: CSRF_TOKEN, model: 'gpt-5.6-sol', ...(accepted ? { activeJob: TEST_JOB } : {}) } }));
  await page.route('**/api/jobs', (route) => {
    submissions += 1;
    accepted = true;
    return route.abort('failed');
  });
  await openAndFillOrder(page);
  await page.getByRole('button', { name: 'Prepare appraisal order' }).click();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  expect(submissions).toBe(1);
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toHaveValue('');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your order is in progress.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order preparation in progress' })).toBeDisabled();
  expect(submissions).toBe(1);
});

test('offers reconnection when workspace initialization fails', async ({ page }) => {
  let unavailable = true;
  await page.route('**/api/session', (route) => route.fulfill(unavailable
    ? { status: 503, json: { error: { code: 'UNAVAILABLE', message: 'The local workspace is unavailable.' } } }
    : { json: { csrfToken: CSRF_TOKEN, model: 'gpt-5.6-sol' } }));
  await page.goto(origin);
  await expect(page.getByText('The local workspace is unavailable.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workspace connection needed' })).toBeDisabled();
  unavailable = false;
  await page.getByRole('button', { name: 'Reconnect' }).click();
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Reconnect' })).toBeHidden();
});

test('fits desktop and mobile viewports and exposes keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'Prepare appraisal order' })).toBeEnabled();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to order form' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Skip to order form' })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('google');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('heading', { name: /A prepared order\./ })).toBeVisible();
  await expect(page.getByLabel('Google Gemini API key', { exact: false })).toBeVisible();
});
