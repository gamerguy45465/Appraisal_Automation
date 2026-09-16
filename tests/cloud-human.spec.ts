import { test, expect, chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createBrowserSession, createGuardedSession, type BrowserSession, type GuardedResponse } from '../src/browser/session.js';
import { createHumanBrowserView, validateHumanBrowserAction, type HumanBrowserAction } from '../src/browser/human-view.js';
import { R3_AUTHENTICATED_URL } from '../src/browser/guard.js';

async function fixture(browser: Browser, context: BrowserContext, page: Page) {
  const statuses: string[] = [];
  const writes: string[] = [];
  const session = await createGuardedSession(browser, context, page, {
    humanView: true, onStatus: status => statuses.push(status),
  }, async (route): Promise<GuardedResponse> => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(path);
    return { status: 200, headers: { 'content-type': 'text/html' }, body: path === '/Orders/Search'
      ? '<title>Order search</title><a href="#">Log Out</a>'
      : path === '/Orders/Create'
        ? '<title>New order</title><form action="/Orders/Create" method="post"><label>Loan number<input id="OrderItemEdit_LoanNumber"></label><button>Place this Order</button></form><button id="prompt" onclick="document.body.dataset.prompt = prompt(\'Synthetic prompt\', \'initial\')">Prompt</button>'
        : '<title>Sign in</title><label>Username<input id="username"></label><label>Password<input id="password" type="password"></label><button id="login" onclick="location.href=\'/Orders/Search\'">Login</button><div style="height:2000px"></div>' };
  });
  const login = session.waitForUserLogin();
  await expect.poll(() => statuses).toContain('awaiting_login');
  return { session, login, writes, statuses };
}

async function clickField(session: BrowserSession, page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  await session.humanView!.act({ type: 'click', x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 });
}

test('human-only viewer signs in, locks during preparation, and releases review without enabling model tools', async ({ browser, context, page }) => {
  const f = await fixture(browser, context, page);
  const viewer = f.session.humanView!;
  const loginFrame = await viewer.frame();
  expect(loginFrame).toMatchObject({ phase: 'authenticating', canControl: true });
  expect(Buffer.from(loginFrame.image, 'base64').subarray(0, 2).toString('hex')).toBe('ffd8');
  expect(f.session.tools.map(tool => tool.name).some(name => /human|click|keyboard|press/i.test(name))).toBe(false);
  expect(await f.session.tools.find(tool => tool.name === 'screenshot_page')!.invoke({})).toHaveProperty('error');
  await clickField(f.session, page, '#username');
  await viewer.act({ type: 'text', text: 'synthetic-human' });
  await viewer.act({ type: 'key', key: 'Tab' });
  await viewer.act({ type: 'text', text: 'synthetic-password' });
  await expect(page.locator('#username')).toHaveValue('synthetic-human');
  await expect(page.locator('#password')).toHaveValue('synthetic-password');
  await viewer.act({ type: 'scroll', deltaX: 0, deltaY: 400 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await viewer.act({ type: 'scroll', deltaX: 0, deltaY: -400 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await clickField(f.session, page, '#login');
  await f.login;
  expect(await viewer.frame()).toMatchObject({ phase: 'preparing', canControl: false });
  await expect(viewer.act({ type: 'key', key: 'Enter' })).rejects.toMatchObject({ code: 'HUMAN_BROWSER_PAUSED' });
  await f.session.navigateToOrder();
  f.session.setFieldPlan([{ key: 'loanNumber', value: '685-2000001', kind: 'text', required: true }]);
  await f.session.fillApprovedPlan();
  await f.session.handoff();
  expect(await viewer.frame()).toMatchObject({ phase: 'review', canControl: true });
  expect(await f.session.tools.find(tool => tool.name === 'fill_approved_plan')!.invoke({})).toHaveProperty('error');
  await clickField(f.session, page, '#OrderItemEdit_LoanNumber');
  await viewer.act({ type: 'key', key: 'Control+A' });
  await viewer.act({ type: 'text', text: '685-2000002' });
  await expect(page.locator('#OrderItemEdit_LoanNumber')).toHaveValue('685-2000002');
  expect(f.writes).toEqual([]);
});

test('viewer supports native prompt handling, review popups, and rejects old-session input after next order', async ({ browser, context, page }) => {
  const f = await fixture(browser, context, page);
  await page.goto(R3_AUTHENTICATED_URL);
  await f.login;
  await f.session.navigateToOrder();
  expect(await f.session.handoffIncomplete()).toBe(true);
  const viewer = f.session.humanView!;
  await viewer.frame();
  await clickField(f.session, page, '#prompt');
  const promptFrame = await viewer.frame();
  expect(promptFrame.dialog).toEqual({ type: 'prompt', message: 'Synthetic prompt', defaultValue: 'initial' });
  await viewer.act({ type: 'dialog', accept: true, promptText: 'human response' });
  await expect(page.locator('body')).toHaveAttribute('data-prompt', 'human response');
  const popup = await context.newPage();
  await popup.setContent('<title>Review popup</title><input id="popup"><button onclick="alert(\'Popup alert\')">Alert</button>');
  const popupFrame = await viewer.frame();
  const entry = popupFrame.pages.find(candidate => candidate.title === 'Review popup')!;
  await viewer.act({ type: 'select-page', pageId: entry.id });
  const selectedFrame = await viewer.frame();
  expect(selectedFrame.pages.find(candidate => candidate.id === entry.id)?.selected).toBe(true);
  await popup.locator('#popup').focus();
  await viewer.act({ type: 'text', text: 'review input' });
  await expect(popup.locator('#popup')).toHaveValue('review input');
  const box = await popup.getByRole('button', { name: 'Alert' }).boundingBox();
  await viewer.act({ type: 'click', x: box!.x + 5, y: box!.y + 5 });
  expect((await viewer.frame()).dialog?.message).toBe('Popup alert');
  await viewer.act({ type: 'dialog', accept: false });
  const next = await f.session.startNextOrder({ onStatus: () => undefined });
  expect(next.humanView).toBeDefined();
  await expect(viewer.act({ type: 'text', text: 'stale input' })).rejects.toMatchObject({ code: 'HUMAN_BROWSER_UNAVAILABLE' });
  await expect(viewer.frame()).rejects.toMatchObject({ code: 'HUMAN_BROWSER_UNAVAILABLE' });
  expect(popup.isClosed()).toBe(true);
  expect(await next.humanView!.frame()).toMatchObject({ phase: 'preparing', canControl: false });
  expect(f.writes).toEqual([]);
});

test('human input drains and queued inputs are revoked before the next phase', async ({ context, page }) => {
  await page.setContent('<input id="input">');
  await page.locator('#input').focus();
  let phase: 'authenticating' | 'preparing' = 'authenticating';
  const controller = createHumanBrowserView(context, page, () => ({ phase, canControl: phase === 'authenticating', closed: false }));
  let release!: () => void;
  let started!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  const didStart = new Promise<void>(resolve => { started = resolve; });
  const original = page.keyboard.insertText.bind(page.keyboard);
  page.keyboard.insertText = async value => { started(); await blocked; await original(value); };
  try {
    const active = controller.view.act({ type: 'text', text: 'active' });
    await didStart;
    const queued = controller.view.act({ type: 'text', text: 'stale' }).catch(error => error);
    let drained = false;
    const draining = controller.suspendAndDrain().then(() => { drained = true; phase = 'preparing'; });
    await Promise.resolve();
    expect(drained).toBe(false);
    release();
    await active;
    await draining;
    expect(await queued).toMatchObject({ code: 'HUMAN_BROWSER_PAUSED' });
    await expect(page.locator('#input')).toHaveValue('active');
    expect(await controller.view.frame()).toMatchObject({ phase: 'preparing', canControl: false });
  } finally { release(); page.keyboard.insertText = original; controller.dispose(); }
});

test('viewer rejects unbounded or executable inputs and sanitizes browser failures', async ({ context, page }) => {
  for (const input of [
    { type: 'evaluate', expression: 'alert(1)' }, { type: 'key', key: 'F12' },
    { type: 'key', key: 'Control+L' }, { type: 'text', text: 'x'.repeat(4097) },
    { type: 'click', x: Infinity, y: 5 }, { type: 'click', x: -1, y: 5 },
    { type: 'scroll', deltaX: 0, deltaY: 2001 }, { type: 'text', text: 'ok', url: 'https://example.com' },
  ]) expect(() => validateHumanBrowserAction(input)).toThrow('browser action is invalid');
  const controller = createHumanBrowserView(context, page, () => ({ phase: 'review', canControl: true, closed: false }));
  const original = page.keyboard.insertText.bind(page.keyboard);
  page.keyboard.insertText = async () => { throw new Error('private transport token synthetic-secret'); };
  try {
    await expect(controller.view.act({ type: 'text', text: 'synthetic' })).rejects.toMatchObject({
      code: 'HUMAN_BROWSER_ACTION_FAILED', message: 'The browser action could not finish. Refresh the browser view and try again.',
    });
    await expect(controller.view.act({ type: 'click', x: 4000, y: 4000 })).rejects.toMatchObject({ code: 'HUMAN_BROWSER_INVALID' });
    await expect(controller.view.act({ type: 'select-page', pageId: '00000000-0000-4000-8000-000000000001' } satisfies HumanBrowserAction)).rejects.toMatchObject({ code: 'HUMAN_BROWSER_INVALID' });
  } finally { page.keyboard.insertText = original; controller.dispose(); }
});

test('trusted connection callback creates the same isolated guarded context without local headed launch', async () => {
  const browser = await chromium.launch({ headless: true });
  let calls = 0;
  try {
    const session = await createBrowserSession({
      onStatus: () => undefined, humanView: true,
      connectBrowser: async () => { calls++; return browser; },
    });
    expect(calls).toBe(1);
    expect(browser.contexts()).toHaveLength(1);
    expect(browser.contexts()[0]!.pages()[0]!.viewportSize()).toEqual({ width: 1440, height: 1000 });
    expect(await session.humanView!.frame()).toMatchObject({ phase: 'preparing', canControl: false, width: 1440, height: 1000 });
    await session.close();
    expect(browser.isConnected()).toBe(false);
  } finally { await browser.close(); }
});

test('a modal raised by the last active human input is dismissed before phase draining completes', async ({ context, page }) => {
  await page.setContent('<button style="position:absolute;left:10px;top:10px;width:100px;height:50px" onclick="document.body.dataset.confirmed = String(confirm(\'Synthetic late modal\'))">Confirm</button>');
  const controller = createHumanBrowserView(context, page, () => ({ phase: 'authenticating', canControl: true, closed: false }));
  let release!: () => void;
  let started!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  const didStart = new Promise<void>(resolve => { started = resolve; });
  const original = page.mouse.click.bind(page.mouse);
  page.mouse.click = async (x, y, options) => { started(); await blocked; await original(x, y, options); };
  try {
    const active = controller.view.act({ type: 'click', x: 30, y: 30 });
    await didStart;
    const drain = controller.suspendAndDrain();
    release();
    await active;
    await drain;
    await expect(page.locator('body')).toHaveAttribute('data-confirmed', 'false');
    expect(await controller.view.frame()).toMatchObject({ canControl: false });
    expect((await controller.view.frame()).dialog).toBeUndefined();
  } finally { release(); page.mouse.click = original; controller.dispose(); }
});
