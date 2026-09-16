import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

const CSRF = 'synthetic-hosted-csrf';
const ACCESS_CODE = 'synthetic-workspace-access-code-for-fixtures';
const SESSION = { csrfToken: CSRF, hostingMode: 'hosted', browserMode: 'azure', defaultProvider: 'openai' };
const JOB_ID = '10000000-0000-4000-8000-000000000001';
const LOGIN_JOB = { id: JOB_ID, status: 'awaiting_login', message: 'Sign in manually.', canStartAnother: false };
const LOGIN_REQUIRED = { error: { code: 'WORKSPACE_LOGIN_REQUIRED', message: 'Sign in to your private workspace.' } };
const PDF = { name: 'synthetic-urla.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic fixture\n%%EOF') };
let server: Server;
let origin: string;

test.beforeAll(async () => {
  const files: Record<string, { name: string; type: string }> = {
    '/': { name: 'index.html', type: 'text/html; charset=utf-8' },
    '/app.js': { name: 'app.js', type: 'text/javascript; charset=utf-8' },
    '/styles.css': { name: 'styles.css', type: 'text/css; charset=utf-8' },
  };
  server = createServer((request, response) => {
    const file = files[request.url ?? ''];
    if (!file) { response.writeHead(404).end(); return; }
    void readFile(resolve('public', file.name))
      .then(body => response.writeHead(200, { 'Content-Type': file.type }).end(body))
      .catch(() => response.writeHead(500).end());
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Hosted UI fixture did not bind a TCP port.');
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/config', route => route.fulfill({ json: { hostingMode: 'hosted', browserMode: 'azure' } }));
});

async function expectNoStoredSecrets(page: Page) {
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage.local).toEqual({});
  expect(Object.keys(storage.session).filter(key => key !== 'appraisal-desk-active-job')).toEqual([]);
  expect(Object.values(storage.session).every(value => value === JOB_ID)).toBe(true);
}

async function fillOrder(page: Page) {
  await page.getByLabel('OpenAI API key', { exact: false }).fill('synthetic-provider-key');
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF);
}

test('signs in directly to the Azure workspace without pairing controls or companion requests', async ({ page }) => {
  let authenticated = false;
  let loginBody: unknown;
  const legacyRequests: string[] = [];
  await page.clock.install();
  page.on('request', request => {
    if (/\/api\/(?:pairing|companion)/.test(request.url())) legacyRequests.push(request.url());
  });
  await page.route('**/api/session', route => route.fulfill(authenticated
    ? { json: SESSION }
    : { status: 401, json: LOGIN_REQUIRED }));
  await page.route('**/api/login', async route => {
    loginBody = route.request().postDataJSON();
    authenticated = true;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto(origin);
  await expect(page.getByLabel('Workspace access code', { exact: true })).toBeVisible();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await expect(page.getByRole('button', { name: /pair.*companion/i })).toHaveCount(0);
  await expect(page.locator('[id*="pairing"], [id*="companion"]')).toHaveCount(0);
  await page.getByLabel('Workspace access code', { exact: true }).fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Sign in to workspace', exact: true }).click();
  expect(loginBody).toEqual({ accessKey: ACCESS_CODE });
  await expect(page.locator('#workspace-access-code')).toHaveValue('');
  await expect(page.locator('#workspace-login-form')).toBeHidden();
  await expect(page.locator('#workspace-mode-label')).toHaveText('Azure browser workspace');
  await expect(page.locator('#workspace-connection-heading')).toHaveText('Your Azure workspace');
  await expect(page.locator('#cloud-browser-panel')).toContainText('Your R3 browser runs in Azure');
  await expect(page.locator('#r3-browser-help')).toContainText('your cloud browser');
  await expect(page.getByRole('button', { name: 'Prepare appraisal order', exact: true })).toBeEnabled();
  await page.clock.runFor(16000);
  expect(legacyRequests).toEqual([]);
  await expectNoStoredSecrets(page);
});

test('rejects an invalid workspace code without enabling the form or retaining the code', async ({ page }) => {
  await page.route('**/api/session', route => route.fulfill({ status: 401, json: LOGIN_REQUIRED }));
  await page.route('**/api/login', route => route.fulfill({ status: 401, json: { error: { code: 'ACCESS_REJECTED', message: 'The workspace access code was not accepted.' } } }));
  await page.goto(origin);
  await page.getByLabel('Workspace access code', { exact: true }).fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Sign in to workspace', exact: true }).click();
  await expect(page.locator('#workspace-login-error')).toHaveText('The workspace access code was not accepted.');
  await expect(page.getByLabel('Workspace access code', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('OpenAI API key', { exact: false })).toBeDisabled();
  await expect(page.locator('#open-browser-link')).toBeHidden();
  await expectNoStoredSecrets(page);
});

test('renews a stale session while preserving provider choices, documents, and entered values', async ({ page }) => {
  let jobRequests = 0;
  await page.route('**/api/session', route => route.fulfill({ json: SESSION }));
  await page.route('**/api/jobs', route => {
    jobRequests += 1;
    expect(route.request().headers()['x-csrf-token']).toBe(CSRF);
    return route.fulfill({ status: 403, json: { error: { code: 'CSRF_REJECTED', message: 'Reconnect to renew your workspace session.' } } });
  });
  await page.goto(origin);
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('google');
  await page.getByLabel('Model ID', { exact: false }).fill('synthetic-custom-google');
  await page.getByLabel('Google Gemini API key', { exact: false }).fill('synthetic-provider-key');
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF);
  await page.locator('#submit-button').click();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await page.locator('#reconnect-button').click();
  await expect(page.getByRole('button', { name: 'Prepare appraisal order', exact: true })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue('google');
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('synthetic-custom-google');
  await expect(page.getByLabel('Google Gemini API key', { exact: false })).toHaveValue('synthetic-provider-key');
  await expect(page.getByLabel('Loan number', { exact: false })).toHaveValue('685-2012345');
  await expect(page.locator('#urla-selection')).toContainText(PDF.name);
  expect(jobRequests).toBe(1);
  await expectNoStoredSecrets(page);
});

test('starts a cloud order immediately and restores its viewer after a refresh', async ({ page }) => {
  let activeJob: typeof LOGIN_JOB | undefined;
  let jobRequests = 0;
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob } }));
  await page.route('**/api/jobs', route => {
    jobRequests += 1;
    activeJob = LOGIN_JOB;
    expect(route.request().headers()['x-csrf-token']).toBe(CSRF);
    return route.fulfill({ json: { job: LOGIN_JOB } });
  });
  await page.goto(origin);
  await fillOrder(page);
  await page.locator('#submit-button').click();
  await expect(page.locator('#open-browser-link')).toHaveAttribute('href', `/browser.html#${JOB_ID}`);
  await expect(page.locator('#login-notice')).toContainText('cloud R3 browser');
  await expect(page.locator('#apiKey')).toHaveValue('');
  await page.reload();
  await expect(page.locator('#open-browser-link')).toBeVisible();
  await expect(page.locator('#open-browser-link')).toHaveAttribute('href', `/browser.html#${JOB_ID}`);
  await expect(page.locator('#submit-button')).toBeDisabled();
  expect(jobRequests).toBe(1);
  await expectNoStoredSecrets(page);
});

test('requires sign-in after expiry during job polling and restores the cloud viewer after authentication', async ({ page }) => {
  let expired = false;
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill(expired
    ? { status: 401, json: LOGIN_REQUIRED }
    : { json: { ...SESSION, activeJob: LOGIN_JOB } }));
  await page.route('**/api/jobs/*', route => route.fulfill(expired
    ? { status: 401, json: LOGIN_REQUIRED }
    : { json: { job: LOGIN_JOB } }));
  await page.route('**/api/login', route => { expired = false; return route.fulfill({ json: { ok: true } }); });
  await page.goto(origin);
  await expect(page.locator('#open-browser-link')).toBeVisible();
  expired = true;
  await page.clock.runFor(2600);
  await expect(page.getByLabel('Workspace access code', { exact: true })).toBeVisible();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await expect(page.locator('#open-browser-link')).toBeHidden();
  await page.getByLabel('Workspace access code', { exact: true }).fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Sign in to workspace', exact: true }).click();
  await expect(page.locator('#open-browser-link')).toBeVisible();
  await expect(page.locator('#workspace-access-code')).toHaveValue('');
  await expectNoStoredSecrets(page);
});

test('waits for browser cleanup before offering the next cloud order', async ({ page }) => {
  let ready = false;
  const reviewJob = { ...LOGIN_JOB, status: 'awaiting_review', message: 'Review this synthetic order.' };
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob: reviewJob } }));
  await page.route('**/api/jobs/*', route => route.fulfill({ json: { job: { ...reviewJob, canStartAnother: ready } } }));
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeHidden();
  await expect(page.locator('#review-notice')).toContainText('cloud R3 browser');
  ready = true;
  await page.clock.runFor(2600);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Prepare another order', exact: true }).click();
  await expect(page.locator('#open-browser-link')).toBeHidden();
  await expect(page.locator('#submit-button')).toBeEnabled();
  await expect(page.locator('#status-message')).toContainText('replace its form');
  await expectNoStoredSecrets(page);
});

test('recovers progress after a transient connection loss without submitting another job', async ({ page }) => {
  let offline = false;
  let jobRequests = 0;
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob: LOGIN_JOB } }));
  await page.route('**/api/jobs', route => { jobRequests += 1; return route.fulfill({ status: 500, json: {} }); });
  await page.route('**/api/jobs/*', route => offline
    ? route.abort()
    : route.fulfill({ json: { job: LOGIN_JOB } }));
  await page.goto(origin);
  await expect(page.locator('#open-browser-link')).toBeVisible();
  offline = true;
  await page.clock.runFor(2600);
  await expect(page.locator('#connection-message')).toContainText('Reconnecting automatically');
  await expect(page.locator('#submit-button')).toBeDisabled();
  offline = false;
  await page.locator('#reconnect-button').click();
  await expect(page.locator('#connection-message')).toBeHidden();
  await expect(page.locator('#open-browser-link')).toHaveAttribute('href', `/browser.html#${JOB_ID}`);
  expect(jobRequests).toBe(0);
  await expectNoStoredSecrets(page);
});
