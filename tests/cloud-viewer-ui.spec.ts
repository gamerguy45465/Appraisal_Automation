import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { createCanvas } from '@napi-rs/canvas';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

const JOB_ID = '10000000-0000-4000-8000-000000000001';
const CSRF = 'synthetic-cloud-viewer-csrf';
const SESSION = { csrfToken: CSRF, hostingMode: 'hosted', browserMode: 'azure' };
const JOB = { id: JOB_ID, status: 'awaiting_login', message: 'Sign in manually.', canStartAnother: false };
const FRAME_PATH = `/api/jobs/${JOB_ID}/browser`;
const canvas = createCanvas(800, 400);
canvas.getContext('2d').fillRect(0, 0, 800, 400);
const FRAME = { image: canvas.toBuffer('image/jpeg').toString('base64'), width: 800, height: 400, phase: 'authenticating', canControl: true, pages: [] };
let server: Server;
let origin: string;

test.beforeAll(async () => {
  const files: Record<string, string> = { '/': 'index.html', '/app.js': 'app.js', '/styles.css': 'styles.css', '/browser.html': 'browser.html', '/browser.js': 'browser.js', '/browser.css': 'browser.css' };
  server = createServer((request, response) => {
    const name = files[request.url ?? ''];
    if (!name) { response.writeHead(404).end(); return; }
    const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.css') ? 'text/css' : 'text/javascript';
    void readFile(resolve('public', name)).then(body => response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }).end(body)).catch(() => response.writeHead(500).end());
  });
  await new Promise<void>(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Cloud viewer fixture did not bind.');
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose())));

async function sessionRoute(page: Page) {
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob: JOB } }));
}
async function openViewer(page: Page) {
  await page.goto(`${origin}/browser.html#${JOB_ID}`);
  await expect(page.locator('#browser-keyboard')).toBeEnabled();
}
async function noStorage(page: Page) {
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual({ local: {}, session: {} });
}

test('Azure mode discloses cloud processing and opens the owning job without companion gating', async ({ page }) => {
  let companionRequests = 0;
  await page.clock.install();
  await page.route('**/api/config', route => route.fulfill({ json: SESSION }));
  await page.route('**/api/session', route => route.fulfill({ json: SESSION }));
  await page.route('**/api/companion-status', route => { companionRequests += 1; return route.fulfill({ json: {} }); });
  await page.route('**/api/jobs', route => route.fulfill({ json: { job: JOB } }));
  await page.route(`**/api/jobs/${JOB_ID}`, route => route.fulfill({ json: { job: { ...JOB, status: 'awaiting_review', canStartAnother: true } } }));
  await page.goto(origin);
  await expect(page.locator('#companion-panel')).toBeHidden();
  await expect(page.locator('#cloud-browser-panel')).toContainText('processed in Azure memory');
  await expect(page.locator('#submit-button')).toBeEnabled();
  await page.getByLabel('OpenAI API key', { exact: false }).fill('synthetic-provider-key');
  await page.getByLabel('Loan number', { exact: false }).fill('685-2012345');
  await page.getByLabel('URLA', { exact: false }).setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 synthetic') });
  await page.locator('#submit-button').click();
  await expect(page.locator('#open-browser-link')).toHaveAttribute('href', `/browser.html#${JOB_ID}`);
  await expect(page.locator('#open-browser-link')).toHaveAttribute('rel', 'noopener');
  await page.clock.runFor(6000);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeEnabled();
  expect(companionRequests).toBe(0);
  await page.getByRole('button', { name: 'Prepare another order', exact: true }).click();
  await expect(page.locator('#open-browser-link')).toBeHidden();
  await expect(page.locator('#submit-button')).toBeEnabled();
});

test('maps scaled clicks, types Unicode, and sends ordered authenticated input without storing secrets', async ({ page }) => {
  const actions: unknown[] = [];
  let requestsInFlight = 0;
  let maxRequests = 0;
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill({ json: { frame: FRAME } }));
  await page.route(`**${FRAME_PATH}/input`, async route => {
    requestsInFlight += 1; maxRequests = Math.max(maxRequests, requestsInFlight);
    expect(route.request().headers()['x-csrf-token']).toBe(CSRF);
    actions.push(route.request().postDataJSON());
    await new Promise(resolveDelay => setTimeout(resolveDelay, 25));
    await route.fulfill({ json: { ok: true } });
    requestsInFlight -= 1;
  });
  await openViewer(page);
  const box = await page.locator('#browser-frame').boundingBox();
  if (!box) throw new Error('Missing frame');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.insertText('Synthetic 中文');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Shift+ArrowLeft');
  await page.keyboard.press('Control+Home');
  await expect.poll(() => actions.length).toBe(6);
  expect(actions[0]).toMatchObject({ type: 'click', button: 'left' });
  const point = actions[0] as { x: number; y: number };
  expect(Math.abs(point.x - 400)).toBeLessThanOrEqual(1);
  expect(Math.abs(point.y - 200)).toBeLessThanOrEqual(1);
  expect(actions.slice(1)).toEqual([{ type: 'text', text: 'Synthetic 中文' }, { type: 'key', key: 'Tab' }, { type: 'key', key: 'Control+A' }, { type: 'key', key: 'Shift+ArrowLeft' }, { type: 'key', key: 'Control+Home' }]);
  expect(maxRequests).toBe(1);
  await expect(page.locator('#browser-keyboard')).toHaveValue('');
  await noStorage(page);
});

test('rejects controls during preparation and clears queued input after the server takes control', async ({ page }) => {
  let preparing = false;
  let inputRequests = 0;
  let releaseInput: (() => void) | undefined;
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill({ json: { frame: { ...FRAME, phase: preparing ? 'preparing' : 'authenticating', canControl: !preparing } } }));
  await page.route(`**${FRAME_PATH}/input`, async route => {
    inputRequests += 1;
    await new Promise<void>(resolveInput => { releaseInput = resolveInput; });
    await route.fulfill({ status: 409, json: {} });
  });
  await openViewer(page);
  await page.locator('#browser-frame').click();
  await expect.poll(() => inputRequests).toBe(1);
  await page.keyboard.insertText('must be discarded');
  await page.keyboard.press('Enter');
  preparing = true;
  releaseInput?.();
  await expect(page.locator('#browser-heading')).toHaveText('Preparing your R3 order');
  await expect(page.locator('#browser-keyboard')).toBeDisabled();
  await expect(page.locator('#input-notice')).toContainText('Queued input was cleared');
  await page.locator('#browser-frame').click();
  expect(inputRequests).toBe(1);
});

test('does not retry uncertain actions and clears the image when the workspace session expires', async ({ page }) => {
  let expired = false;
  let inputRequests = 0;
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill(expired ? { status: 401, json: {} } : { json: { frame: FRAME } }));
  await page.route(`**${FRAME_PATH}/input`, async route => {
    inputRequests += 1;
    expired = true;
    await route.abort();
  });
  await openViewer(page);
  await page.locator('#browser-frame').click();
  await expect(page.locator('#browser-heading')).toHaveText('Workspace sign-in needed');
  await expect(page.locator('#browser-frame')).not.toHaveAttribute('src');
  await expect(page.locator('#browser-keyboard')).toBeDisabled();
  expect(inputRequests).toBe(1);
  await noStorage(page);
});

test('renders popup titles as text and handles native R3 prompts with only explicit human actions', async ({ page }) => {
  const actions: unknown[] = [];
  let promptOpen = true;
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill({ json: { frame: {
    ...FRAME, image: promptOpen ? '' : FRAME.image, phase: 'review',
    pages: [{ id: 'page-one', title: 'Order review', selected: true }, { id: 'page-two', title: '<script>Synthetic popup</script>', selected: false }],
    ...(promptOpen ? { dialog: { type: 'prompt', message: '<img src=x onerror=alert(1)>', defaultValue: 'Synthetic response' } } : {}),
  } } }));
  await page.route(`**${FRAME_PATH}/input`, async route => {
    actions.push(route.request().postDataJSON()); promptOpen = false;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto(`${origin}/browser.html#${JOB_ID}`);
  await expect(page.locator('#dialog-message')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#dialog-message img')).toHaveCount(0);
  await expect(page.locator('#browser-keyboard')).toBeDisabled();
  expect(actions).toEqual([]);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('#remote-dialog')).toBeHidden();
  await expect(page.locator('#dialog-prompt')).toHaveValue('');
  await page.getByLabel('Browser page', { exact: false }).selectOption('page-two');
  await expect.poll(() => actions.length).toBe(2);
  expect(actions).toEqual([{ type: 'dialog', accept: true, promptText: 'Synthetic response' }, { type: 'select-page', pageId: 'page-two' }]);
  await noStorage(page);
});

test('retries a not-ready browser with serial polls and closes only after confirmation', async ({ page }) => {
  let ready = false;
  let closed = 0;
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill(ready ? { json: { frame: FRAME } } : { status: 409, json: {} }));
  await page.route(`**${FRAME_PATH}/close`, route => { closed += 1; expect(route.request().headers()['x-csrf-token']).toBe(CSRF); return route.fulfill({ json: { ok: true } }); });
  await page.goto(`${origin}/browser.html#${JOB_ID}`);
  await expect(page.locator('#browser-heading')).toHaveText('Waiting for your browser');
  ready = true;
  await expect(page.locator('#browser-keyboard')).toBeEnabled();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Close cloud browser', exact: true }).click();
  expect(closed).toBe(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Close cloud browser', exact: true }).click();
  await expect(page.locator('#browser-heading')).toHaveText('Cloud browser closed');
  expect(closed).toBe(1);
  await expect(page.locator('#browser-frame')).not.toHaveAttribute('src');
});

test('ignores forged job fragments and never requests a browser session', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/**', route => { requests += 1; return route.fulfill({ status: 500, json: {} }); });
  await page.goto(`${origin}/browser.html#../../other-session`);
  await expect(page.locator('#browser-heading')).toHaveText('Choose an order first');
  expect(requests).toBe(0);
  await noStorage(page);
});

test('forwards plain-text paste and IME composition once, clears transient text, and bounds pasted input', async ({ page }) => {
  const actions: unknown[] = [];
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => route.fulfill({ json: { frame: FRAME } }));
  await page.route(`**${FRAME_PATH}/input`, route => { actions.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true } }); });
  await openViewer(page);
  await page.locator('#browser-keyboard').evaluate(element => {
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', 'Synthetic pasted text');
    clipboard.setData('text/html', '<b>Ignored HTML</b>');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard }));
    element.dispatchEvent(new CompositionEvent('compositionstart'));
    (element as HTMLTextAreaElement).value = '合成';
    element.dispatchEvent(new InputEvent('input', { data: '合成', isComposing: true }));
    element.dispatchEvent(new CompositionEvent('compositionend', { data: '合成' }));
    element.dispatchEvent(new InputEvent('input', { data: '合成', isComposing: false }));
  });
  await expect.poll(() => actions.length).toBe(2);
  expect(actions).toEqual([{ type: 'text', text: 'Synthetic pasted text' }, { type: 'text', text: '合成' }]);
  await page.locator('#browser-keyboard').evaluate(element => {
    const clipboard = new DataTransfer(); clipboard.setData('text/plain', 'x'.repeat(4097));
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard }));
  });
  await expect(page.locator('#input-notice')).toContainText('4,096');
  await expect(page.locator('#browser-keyboard')).toHaveValue('');
  expect(actions).toHaveLength(2);
  await noStorage(page);
});

test('never overlaps frame polls and blocks inconsistent preparation control flags', async ({ page }) => {
  let requests = 0;
  let releaseFrame: (() => void) | undefined;
  await page.clock.install();
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, async route => {
    requests += 1;
    await new Promise<void>(resolveFrame => { releaseFrame = resolveFrame; });
    await route.fulfill({ json: { frame: { ...FRAME, phase: 'preparing', canControl: true } } });
  });
  await page.goto(`${origin}/browser.html#${JOB_ID}`);
  await expect.poll(() => requests).toBe(1);
  await page.clock.runFor(4000);
  expect(requests).toBe(1);
  releaseFrame?.();
  await expect(page.locator('#browser-heading')).toHaveText('Preparing your R3 order');
  await expect(page.locator('#browser-keyboard')).toBeDisabled();
});

test('keeps a retained review browser reachable when a successor preparation fails', async ({ page }) => {
  await page.route('**/api/config', route => route.fulfill({ json: SESSION }));
  await page.route('**/api/session', route => route.fulfill({ json: { ...SESSION, activeJob: { ...JOB, status: 'failed', canStartAnother: true, message: 'New documents could not be prepared. The previous browser is still open.' } } }));
  await page.goto(origin);
  await expect(page.locator('#open-browser-link')).toBeVisible();
  await expect(page.locator('#open-browser-link')).toHaveAttribute('href', `/browser.html#${JOB_ID}`);
  await expect(page.getByRole('button', { name: 'Prepare another order', exact: true })).toBeEnabled();
  await page.route(`**${FRAME_PATH}`, route => route.fulfill({ json: { frame: { ...FRAME, phase: 'review' } } }));
  await openViewer(page);
  await expect(page.locator('#browser-heading')).toHaveText('Review and finish your order');
});

test('ends a retired viewer on 410 and clears the last image without polling or replaying input', async ({ page }) => {
  let retired = false;
  let requests = 0;
  await page.clock.install();
  await sessionRoute(page);
  await page.route(`**${FRAME_PATH}`, route => {
    requests += 1;
    return route.fulfill(retired ? { status: 410, json: {} } : { json: { frame: FRAME } });
  });
  await openViewer(page);
  retired = true;
  await page.clock.runFor(1100);
  await expect(page.locator('#browser-heading')).toHaveText('Browser session unavailable');
  await expect(page.locator('#browser-frame')).not.toHaveAttribute('src');
  await expect(page.locator('#browser-keyboard')).toBeDisabled();
  const endedRequests = requests;
  await page.clock.runFor(5000);
  expect(requests).toBe(endedRequests);
});
