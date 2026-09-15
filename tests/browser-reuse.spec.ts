import { test, expect, chromium, type Browser, type BrowserContext, type Page, type WebSocketRoute } from '@playwright/test';
import { createGuardedSession, type BrowserSession, type BrowserSessionOptions, type GuardedResponse } from '../src/browser/session.js';
import { R3_AUTHENTICATED_URL, R3_LOGIN_URL } from '../src/browser/guard.js';

async function fixture(browser: Browser, context: BrowserContext, page: Page, ownsBrowser = false, honorSessionCookie = false) {
  const writes: string[] = [];
  const statuses: string[][] = [[]];
  const options = (index: number): BrowserSessionOptions => ({ onStatus: status => statuses[index]!.push(status) });
  const session = await createGuardedSession(browser, context, page, options(0), async (route): Promise<GuardedResponse> => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${path}`);
    if (honorSessionCookie && path === '/' && (await request.allHeaders()).cookie?.includes('synthetic-session=retained-in-memory')) {
      return { status: 303, headers: { location: '/Orders/Search' }, body: '' };
    }
    return { status: 200, headers: { 'content-type': 'text/html' }, body: path === '/Orders/Search'
      ? '<a href="#">Log Out</a><h1>Orders</h1>' : path === '/Orders/Create'
        ? '<form action="/Orders/Create" method="post"><label>Loan number<input id="OrderItemEdit_LoanNumber"></label><button>Place this Order</button></form>'
        : '<h1>Manual sign in</h1>' };
  }, ownsBrowser);
  const signIn = async (target: BrowserSession, index: number): Promise<void> => {
    const login = target.waitForUserLogin();
    await expect.poll(() => statuses[index]).toContain('awaiting_login');
    await page.goto(R3_AUTHENTICATED_URL);
    await login;
    await target.navigateToOrder();
  };
  const prepare = async (target: BrowserSession, value: string): Promise<void> => {
    target.setFieldPlan([{ key: 'loanNumber', value, kind: 'text', required: true }]);
    expect((await target.fillApprovedPlan()).errors).toEqual([]);
    await target.handoff();
  };
  const nextOptions = (): BrowserSessionOptions => {
    statuses.push([]);
    return options(statuses.length - 1);
  };
  return { session, writes, statuses, signIn, prepare, nextOptions };
}

test('explicit next order retains one browser context while replacing plans, tools, observers and authentication', async ({ browser, context, page }) => {
  const f = await fixture(browser, context, page);
  await f.signIn(f.session, 0);
  await context.addCookies([{ name: 'synthetic-session', value: 'retained-in-memory', url: R3_LOGIN_URL }]);
  await f.prepare(f.session, '685-2000001');
  // Playwright's runtime EventEmitter exposes listenerCount, although its browser API types omit it.
  const contextEvents = context as BrowserContext & { listenerCount(event: string): number };
  const pageEvents = page as Page & { listenerCount(event: string): number };
  const listenerCounts = () => [contextEvents.listenerCount('request'), contextEvents.listenerCount('requestfinished'), contextEvents.listenerCount('requestfailed'), contextEvents.listenerCount('page'), pageEvents.listenerCount('dialog'), pageEvents.listenerCount('response')];
  const initialCounts = listenerCounts();
  const popup = await context.newPage();
  await page.evaluate(() => window.addEventListener('pagehide', () => { navigator.sendBeacon('/Orders/Create', 'synthetic-unload-write'); }));
  const retiredLifetime = f.session.waitUntilClosed();
  const next = await f.session.startNextOrder(f.nextOptions());
  await retiredLifetime;
  expect(page.url()).toBe('about:blank');
  expect(popup.isClosed()).toBe(true);
  expect(context.pages()).toEqual([page]);
  expect(listenerCounts()).toEqual(initialCounts);
  expect((await context.cookies()).find(cookie => cookie.name === 'synthetic-session')?.value).toBe('retained-in-memory');
  expect(f.statuses[0]).not.toContain('browser_closed');
  expect(f.session.isClosed()).toBe(true);
  expect(next.isClosed()).toBe(false);
  await expect(next.navigateToOrder()).rejects.toThrow('paused while you sign in');
  await f.session.close();
  expect(page.isClosed()).toBe(false);
  expect(await f.session.tools.find(tool => tool.name === 'fill_approved_plan')!.invoke({})).toHaveProperty('error');
  await f.signIn(next, 1);
  expect(await next.getFieldReport()).toEqual([]);
  await expect(page.locator('#OrderItemEdit_LoanNumber')).toHaveValue('');
  await f.prepare(next, '685-2000002');
  await expect(page.locator('#OrderItemEdit_LoanNumber')).toHaveValue('685-2000002');
  expect(f.session.isOrderPage()).toBe(false);
  const third = await next.startNextOrder(f.nextOptions());
  expect(listenerCounts()).toEqual(initialCounts);
  await f.signIn(third, 2);
  await f.prepare(third, '685-2000003');
  expect(f.writes).toEqual([]);
});

test('reuse is unavailable during preparation and an unconfirmed login receives an explicit fresh-browser fallback', async ({ browser, context, page }) => {
  const f = await fixture(browser, context, page);
  await expect(f.session.startNextOrder(f.nextOptions())).rejects.toThrow('only after');
  const controller = new AbortController();
  const login = f.session.waitForUserLogin({ signal: controller.signal }).catch(() => undefined);
  await expect.poll(() => f.statuses[0]).toContain('awaiting_login');
  expect(await f.session.handoffIncomplete()).toBe(false);
  await expect(f.session.startNextOrder(f.nextOptions())).rejects.toMatchObject({ code: 'BROWSER_REUSE_UNAVAILABLE' });
  expect(page.isClosed()).toBe(false);
  expect(f.writes).toEqual([]);
  controller.abort();
  await login;
});

test('a retained session cookie signs in the next order automatically while an expired cookie still requires manual sign-in', async ({ browser, context, page }) => {
  const f = await fixture(browser, context, page, false, true);
  await f.signIn(f.session, 0);
  await context.addCookies([{ name: 'synthetic-session', value: 'retained-in-memory', url: R3_LOGIN_URL }]);
  expect((await context.cookies(R3_LOGIN_URL)).some(cookie => cookie.name === 'synthetic-session')).toBe(true);
  await f.prepare(f.session, '685-2000001');
  const next = await f.session.startNextOrder(f.nextOptions());
  // The synthetic server honors the retained cookie at the fixed portal root; no manual navigation follows.
  await next.waitForUserLogin();
  expect(page.url()).toBe(R3_AUTHENTICATED_URL);
  await next.navigateToOrder();
  await f.prepare(next, '685-2000002');
  await context.clearCookies();
  const expired = await next.startNextOrder(f.nextOptions());
  let signedIn = false;
  const login = expired.waitForUserLogin().then(() => { signedIn = true; });
  await expect(page.getByRole('heading', { name: 'Manual sign in' })).toBeVisible();
  await expect.poll(() => f.statuses[2]).toContain('awaiting_login');
  expect(signedIn).toBe(false);
  expired.setFieldPlan([{ key: 'loanNumber', value: '685-2000003', kind: 'text', required: true }]);
  await expect(expired.fillApprovedPlan()).rejects.toThrow('paused while you sign in');
  await expect(expired.navigateToOrder()).rejects.toThrow('paused while you sign in');
  // This navigation stands in for the user's completed manual authentication after expiry.
  await page.goto(R3_AUTHENTICATED_URL);
  await login;
  await expired.navigateToOrder();
  expect((await expired.fillApprovedPlan()).errors).toEqual([]);
  await expect(page.locator('#OrderItemEdit_LoanNumber')).toHaveValue('685-2000003');
  expect(f.writes).toEqual([]);
});

function syntheticSocket() {
  let connected = 0;
  let clientClosed = 0;
  let serverClosed = 0;
  let fromClient: ((message: string | Buffer) => unknown) | undefined;
  let fromServer: ((message: string | Buffer) => unknown) | undefined;
  const receivedByServer: Array<string | Buffer> = [];
  const receivedByClient: Array<string | Buffer> = [];
  const server = {
    close: async () => { serverClosed += 1; }, send: (message: string | Buffer) => receivedByServer.push(message),
    onMessage: (handler: typeof fromServer) => { fromServer = handler; }, onClose: () => undefined,
  } as unknown as WebSocketRoute;
  const client = {
    connectToServer: () => { connected += 1; return server; }, close: async () => { clientClosed += 1; },
    send: (message: string | Buffer) => receivedByClient.push(message),
    onMessage: (handler: typeof fromClient) => { fromClient = handler; }, onClose: () => undefined,
  } as unknown as WebSocketRoute;
  return { client, connected: () => connected, clientClosed: () => clientClosed, serverClosed: () => serverClosed,
    fromClient: (message: string) => fromClient?.(message), fromServer: (message: string) => fromServer?.(message), receivedByServer, receivedByClient };
}

test('one context WebSocket gate retires both sides and prevents old review sockets from forwarding into a new order', async ({ browser, context, page }) => {
  let registrations = 0;
  let handler!: Parameters<BrowserContext['routeWebSocket']>[1];
  const original = context.routeWebSocket;
  context.routeWebSocket = async (url, callback) => { registrations += 1; handler = callback; await original.call(context, url, callback); };
  const f = await fixture(browser, context, page);
  try {
    const blocked = syntheticSocket();
    await handler(blocked.client);
    expect(blocked.connected()).toBe(0);
    expect(blocked.clientClosed()).toBe(1);
    await f.signIn(f.session, 0);
    expect(await f.session.handoffIncomplete()).toBe(true);
    const old = syntheticSocket();
    await handler(old.client);
    old.fromClient('human review message');
    expect(old.receivedByServer).toEqual(['human review message']);
    const next = await f.session.startNextOrder(f.nextOptions());
    expect(registrations).toBe(1);
    expect(old.clientClosed()).toBe(1);
    expect(old.serverClosed()).toBe(1);
    old.fromClient('late old message');
    old.fromServer('late old reply');
    expect(old.receivedByServer).toEqual(['human review message']);
    expect(old.receivedByClient).toEqual([]);
    const preparing = syntheticSocket();
    await handler(preparing.client);
    expect(preparing.connected()).toBe(0);
    await f.signIn(next, 1);
    await f.prepare(next, '685-2000002');
    const current = syntheticSocket();
    await handler(current.client);
    current.fromClient('new human review message');
    expect(current.receivedByServer).toEqual(['new human review message']);
    expect(f.writes).toEqual([]);
  } finally {
    context.routeWebSocket = original;
  }
});

for (const closeMode of ['last review popup', 'context'] as const) {
  test(`closing the ${closeMode} shuts down an owned Chromium process and resolves its lifetime`, async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    try {
      const f = await fixture(browser, context, page, true);
      await f.signIn(f.session, 0);
      expect(await f.session.handoffIncomplete()).toBe(true);
      const lifetime = f.session.waitUntilClosed();
      if (closeMode === 'last review popup') {
        const popup = await context.newPage();
        await page.close();
        expect(browser.isConnected()).toBe(true);
        expect(f.session.isClosed()).toBe(false);
        expect(f.statuses[0]).not.toContain('browser_closed');
        await expect(f.session.startNextOrder(f.nextOptions())).rejects.toMatchObject({ code: 'BROWSER_REUSE_UNAVAILABLE' });
        expect(popup.isClosed()).toBe(false);
        await popup.close();
      } else await context.close();
      await lifetime;
      await expect.poll(() => browser.isConnected()).toBe(false);
      expect(f.statuses[0]!.filter(status => status === 'browser_closed')).toHaveLength(1);
      expect(f.session.isClosed()).toBe(true);
      expect(f.session.isOrderPage()).toBe(false);
    } finally {
      await browser.close();
    }
  });
}
