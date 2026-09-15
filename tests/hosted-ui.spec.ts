import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

const CSRF = 'synthetic-hosted-csrf';
const ACCESS_CODE = 'synthetic-workspace-access-code-for-fixtures';
const PAIRING_CODE = 'synthetic-one-time-companion-pairing-code';
const SESSION = { csrfToken: CSRF, hostingMode: 'hosted', defaultProvider: 'openai' };
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

async function expectNoStoredSecrets(page: Page) {
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({ local: {}, session: {} });
}

test('signs in, pairs the Windows companion, and clears one-time secrets on connection', async ({ page }) => {
  let authenticated = false;
  let connected = false;
  let paired = false;
  let loginBody: unknown;
  let pairingHeaders: Record<string, string> = {};
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill(authenticated
    ? { json: { ...SESSION, companion: { paired: false, connected: false } } }
    : { status: 401, json: LOGIN_REQUIRED }));
  await page.route('**/api/login', async route => {
    loginBody = route.request().postDataJSON();
    authenticated = true;
    await route.fulfill({ json: { ok: true } });
  });
  await page.route('**/api/pairing', async route => {
    pairingHeaders = route.request().headers();
    paired = true;
    await route.fulfill({ json: { token: PAIRING_CODE, expiresAt: Date.now() + 600000 } });
  });
  await page.route('**/api/companion-status', route => route.fulfill({ json: { paired, connected } }));
  await page.goto(origin);
  await expect(page.getByLabel('Workspace access code', { exact: true })).toBeVisible();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await page.getByLabel('Workspace access code', { exact: true }).fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Sign in to workspace', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pair Windows companion', exact: true })).toBeVisible();
  expect(loginBody).toEqual({ accessKey: ACCESS_CODE });
  await expect(page.locator('#workspace-access-code')).toHaveValue('');
  await expect(page.locator('#workspace-mode-label')).toHaveText('Hosted workspace');
  await expect(page.locator('#companion-panel')).toContainText('pass through Azure in memory');
  await expect(page.locator('#r3-browser-help')).toContainText('on your Windows PC');
  await page.getByRole('button', { name: 'Pair Windows companion', exact: true }).click();
  await expect(page.getByLabel('One-time pairing code', { exact: true })).toHaveValue(PAIRING_CODE);
  await expect(page.getByLabel('One-time pairing code', { exact: true })).toHaveAttribute('readonly', '');
  await expect(page.locator('#pairing-expiry')).toContainText('Expires at');
  expect(pairingHeaders['x-csrf-token']).toBe(CSRF);
  await expectNoStoredSecrets(page);
  await page.clock.runFor(5100);
  await expect(page.locator('#companion-status')).toContainText('Waiting for your Windows companion');
  await expect(page.getByLabel('One-time pairing code', { exact: true })).toHaveValue(PAIRING_CODE);
  connected = true;
  await page.clock.runFor(5100);
  await expect(page.locator('#companion-status')).toContainText('Windows companion connected');
  await expect(page.locator('#pairing-token')).toHaveValue('');
  await expect(page.locator('#pairing-code-panel')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Prepare appraisal order', exact: true })).toBeEnabled();
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
  await expect(page.locator('#companion-panel')).toBeHidden();
  await expectNoStoredSecrets(page);
});

test('blocks offline submission while preserving provider choices, documents, and entered values', async ({ page }) => {
  let connected = true;
  let jobRequests = 0;
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, companion: { paired: true, connected } } }));
  await page.route('**/api/companion-status', route => route.fulfill({ json: { paired: true, connected } }));
  await page.route('**/api/jobs', route => { jobRequests += 1; return route.fulfill({ status: 400, json: { error: { message: 'Fixture must not submit.' } } }); });
  await page.goto(origin);
  await page.getByRole('combobox', { name: 'AI provider' }).selectOption('google');
  await page.getByLabel('Model ID', { exact: false }).fill('synthetic-custom-google');
  await page.getByLabel('Google Gemini API key', { exact: false }).fill('synthetic-provider-key');
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF);
  connected = false;
  await page.clock.runFor(5100);
  await expect(page.locator('#companion-status')).toContainText('offline');
  await expect(page.getByRole('button', { name: 'Pair Windows companion', exact: true })).toBeVisible();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'AI provider' })).toHaveValue('google');
  await expect(page.getByLabel('Model ID', { exact: false })).toHaveValue('synthetic-custom-google');
  await expect(page.getByLabel('Google Gemini API key', { exact: false })).toHaveValue('synthetic-provider-key');
  await expect(page.getByLabel('Loan number', { exact: false })).toHaveValue('685-2012345');
  await expect(page.locator('#urla-selection')).toContainText(PDF.name);
  await page.locator('#order-form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(jobRequests).toBe(0);
  await expectNoStoredSecrets(page);
  connected = true;
  await page.clock.runFor(5100);
  await expect(page.getByRole('button', { name: 'Prepare appraisal order', exact: true })).toBeEnabled();
  await expect(page.locator('#urla-selection')).toContainText(PDF.name);
});

test('removes an expired pairing code and offers a new one', async ({ page }) => {
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, companion: { paired: false, connected: false } } }));
  await page.route('**/api/companion-status', route => route.fulfill({ json: { paired: false, connected: false } }));
  await page.route('**/api/pairing', route => route.fulfill({ json: { token: PAIRING_CODE, expiresAt: Date.now() + 2000 } }));
  await page.goto(origin);
  await page.getByRole('button', { name: 'Pair Windows companion', exact: true }).click();
  await expect(page.getByLabel('One-time pairing code', { exact: true })).toHaveValue(PAIRING_CODE);
  await page.clock.runFor(3000);
  await expect(page.locator('#pairing-code-panel')).toBeHidden();
  await expect(page.locator('#pairing-token')).toHaveValue('');
  await expect(page.locator('#pairing-error')).toContainText('expired');
  await expect(page.getByRole('button', { name: 'Pair Windows companion', exact: true })).toBeEnabled();
  await expectNoStoredSecrets(page);
});

test('requires sign-in again when the hosted workspace session expires', async ({ page }) => {
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, companion: { paired: true, connected: true } } }));
  await page.route('**/api/companion-status', route => route.fulfill({ status: 401, json: LOGIN_REQUIRED }));
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'Prepare appraisal order', exact: true })).toBeEnabled();
  await page.clock.runFor(5100);
  await expect(page.getByLabel('Workspace access code', { exact: true })).toBeVisible();
  await expect(page.locator('#submit-button')).toBeDisabled();
  await expect(page.locator('#companion-panel')).toBeHidden();
  await expectNoStoredSecrets(page);
});

test('uses companion state from active-job polling before offering another order', async ({ page }) => {
  let connected = true;
  const job = { id: 'synthetic-review-job', status: 'awaiting_review', message: 'Review this synthetic order.', canStartAnother: true };
  await page.clock.install();
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob: job, companion: { paired: true, connected: true } } }));
  await page.route('**/api/jobs/*', route => route.fulfill({ json: { job, companion: { paired: true, connected } } }));
  await page.goto(origin);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeEnabled();
  await expect(page.locator('#review-notice')).toContainText('on your Windows PC');
  connected = false;
  await page.clock.runFor(2600);
  await expect(page.locator('#companion-status')).toContainText('offline');
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeDisabled();
  connected = true;
  await page.clock.runFor(2600);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeEnabled();
});

test('can request a fresh code for an offline paired companion and retains the form if replacement is refused', async ({ page }) => {
  let locked = true;
  let pairingRequests = 0;
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, companion: { paired: true, connected: false } } }));
  await page.route('**/api/companion-status', route => route.fulfill({ json: { paired: true, connected: false } }));
  await page.route('**/api/pairing', route => {
    pairingRequests += 1;
    expect(route.request().headers()['x-csrf-token']).toBe(CSRF);
    return route.fulfill(locked
      ? { status: 409, json: { error: { code: 'COMPANION_BUSY', message: 'Finish the current preparation and close its R3 browser before pairing another companion.' } } }
      : { json: { token: PAIRING_CODE, expiresAt: Date.now() + 600000 } });
  });
  await page.goto(origin);
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles(PDF);
  await page.getByRole('button', { name: 'Pair Windows companion', exact: true }).click();
  await expect(page.locator('#pairing-error')).toContainText('close its R3 browser');
  await expect(page.getByLabel('Loan number', { exact: false })).toHaveValue('685-2012345');
  await expect(page.locator('#urla-selection')).toContainText(PDF.name);
  locked = false;
  await page.getByRole('button', { name: 'Pair Windows companion', exact: true }).click();
  await expect(page.getByLabel('One-time pairing code', { exact: true })).toHaveValue(PAIRING_CODE);
  expect(pairingRequests).toBe(2);
  await expectNoStoredSecrets(page);
});
