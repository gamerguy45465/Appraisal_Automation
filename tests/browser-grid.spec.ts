import { test, expect, type Browser, type BrowserContext, type Dialog, type Page } from '@playwright/test';
import { createGuardedSession, type GuardedResponse } from '../src/browser/session.js';
import { maySendRequest, R3_AUTHENTICATED_URL, R3_ORDER_URL } from '../src/browser/guard.js';

const licensePath = '/Artifacts/Grid/License';
const licenseUrl = `https://clients.r3amc.com${licensePath}`;

async function gridFixture(browser: Browser, context: BrowserContext, page: Page, showLogout: boolean, accountMarkup = '') {
  const dialogs: Dialog[] = [];
  const licenseRequests: string[] = [];
  const statuses: string[] = [];
  const writes: string[] = [];
  const controller = new AbortController();
  let signedIn = false;
  page.on('dialog', dialog => dialogs.push(dialog));
  const searchHtml = `<!doctype html><html><head><title>Order Search</title></head><body>
    <header id="account">${accountMarkup}</header><h1>Order Search</h1>
    <div id="processing">Processing your request</div>
    <script>
      window.loadGridLicense = () => {
        document.getElementById('processing').hidden = false;
        const request = new XMLHttpRequest();
        request.open('GET', '${licensePath}?_=1234567890', false);
        try { request.send(); } catch { alert(undefined); return; }
        if (request.status !== 200) { alert(undefined); return; }
        document.documentElement.dataset.gridLoads = String(Number(document.documentElement.dataset.gridLoads || 0) + 1);
        document.getElementById('processing').hidden = true;
        if (${showLogout} && !document.querySelector('#account a')) {
          const logout = document.createElement('a');
          logout.href = '#'; logout.textContent = 'Log Out';
          document.getElementById('account').append(logout);
        }
      };
      window.loadGridLicense();
    </script></body></html>`;
  const session = await createGuardedSession(browser, context, page, {
    onStatus: status => statuses.push(status),
  }, async (route): Promise<GuardedResponse> => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(`${request.method()} ${url.pathname}`);
    if (url.pathname === licensePath) {
      licenseRequests.push(request.url());
      return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify('synthetic-grid-license') };
    }
    const body = url.pathname === '/Orders/Search' ? searchHtml
      : url.pathname === '/Orders/Create' ? '<h1>New Order</h1><input id="OrderItemEdit_LoanNumber">'
        : '<h1>Sign in manually</h1>';
    return { status: 200, headers: { 'content-type': 'text/html' }, body };
  });
  const login = session.waitForUserLogin({ signal: controller.signal }).then(() => { signedIn = true; return true; }, () => false);
  return {
    session, dialogs, licenseRequests, writes, statuses, login,
    signedIn: () => signedIn,
    cancelLogin: () => controller.abort(),
    async openSearch() {
      await expect.poll(() => statuses).toContain('awaiting_login');
      // Commit does not wait on the failure alert produced by the unfixed guard.
      await page.goto(R3_AUTHENTICATED_URL, { waitUntil: 'commit' });
    },
    async close() {
      // Production preserves authentication dialogs; only this synthetic fixture dismisses them for cleanup.
      for (const dialog of dialogs) await dialog.dismiss().catch(() => undefined);
      controller.abort();
      await context.close();
      await login;
    },
  };
}

test('grid licensing finishes without an undefined alert before authentication and after its phase transition', async ({ browser, context, page }) => {
  const fixture = await gridFixture(browser, context, page, true);
  try {
    await fixture.openSearch();
    await expect.poll(() => fixture.dialogs.length ? 'alert' : fixture.licenseRequests.length ? 'allowed' : 'pending', { timeout: 3000 }).toBe('allowed');
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    await expect(page.locator('#processing')).toBeHidden();
    await expect.poll(fixture.signedIn).toBe(true);
    expect(await fixture.login).toBe(true);
    expect(fixture.dialogs).toHaveLength(0);

    // Startup work may arrive after the exact authenticated marker switches the session to preparation.
    await page.evaluate(() => (window as unknown as { loadGridLicense(): void }).loadGridLicense());
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '2');
    expect(fixture.licenseRequests).toEqual([`${licenseUrl}?_=1234567890`, `${licenseUrl}?_=1234567890`]);
    expect(fixture.dialogs).toHaveLength(0);
    await fixture.session.navigateToOrder();
    expect(fixture.session.isOrderPage()).toBe(true);
    expect(await page.evaluate(() => Promise.all([
      fetch('/Orders/Create', { method: 'POST' }),
      fetch('/Orders/Submit?loan=synthetic'),
    ].map(request => request.then(() => true, () => false))))).toEqual([false, false]);
    expect(fixture.writes).toEqual([]);
  } finally {
    await fixture.close();
  }
});

test('successful grid licensing does not replace the required authenticated logout marker', async ({ browser, context, page }) => {
  const fixture = await gridFixture(browser, context, page, false);
  try {
    await fixture.openSearch();
    await expect.poll(() => fixture.dialogs.length ? 'alert' : fixture.licenseRequests.length ? 'allowed' : 'pending', { timeout: 3000 }).toBe('allowed');
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    expect(fixture.dialogs).toHaveLength(0);
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');
    expect(await page.evaluate(() => fetch('/Orders/Create', { method: 'POST' }).then(() => true, () => false))).toBe(false);
    expect(fixture.writes).toEqual([]);
    await page.evaluate(() => {
      const logout = document.createElement('a');
      logout.href = '#'; logout.textContent = 'Log Out';
      document.getElementById('account')!.append(logout);
    });
    await expect.poll(fixture.signedIn).toBe(true);
    expect(await fixture.login).toBe(true);
  } finally {
    await fixture.close();
  }
});

function accountMenu(navbarHidden = false): string {
  return `<style>.dropdown-menu { display: none; }</style>
    <ul class="navbar-nav navbar-right"${navbarHidden ? ' style="display:none"' : ''}>
      <li class="dropdown nav-menu-item my-2">
        <button type="button" aria-label="Account" onclick="document.body.dataset.accountClicked='yes'">Account</button>
        <ul class="dropdown-menu dropdown-navbar-menu px-3"><li><a href="">Log Out</a></li></ul>
      </li>
    </ul>`;
}

test('styled authenticated account menu confirms sign-in without opening the closed dropdown', async ({ browser, context, page }) => {
  const fixture = await gridFixture(browser, context, page, false, accountMenu());
  try {
    await fixture.openSearch();
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    await expect(page.getByRole('button', { name: 'Account', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log Out', exact: true, includeHidden: true })).toBeHidden();
    await expect.poll(fixture.signedIn, { timeout: 3000 }).toBe(true);
    expect(await fixture.login).toBe(true);
    expect(fixture.dialogs).toHaveLength(0);
    await expect(page.locator('body')).not.toHaveAttribute('data-account-clicked');
    await expect(page.locator('.dropdown-navbar-menu')).toBeHidden();
    await fixture.session.navigateToOrder();
    expect(fixture.session.isOrderPage()).toBe(true);
    expect(await page.evaluate(() => fetch('/Orders/Create', { method: 'POST' }).then(() => true, () => false))).toBe(false);
    expect(fixture.writes).toEqual([]);
  } finally {
    await fixture.close();
  }
});

test('hidden unrelated logout and hidden navbar cannot establish authentication', async ({ browser, context, page }) => {
  const fixture = await gridFixture(browser, context, page, false, '<a href="" hidden>Log Out</a>');
  try {
    await fixture.openSearch();
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');

    await page.locator('#account').evaluate((account, markup) => { account.innerHTML = markup; }, accountMenu(true));
    await expect(page.getByRole('button', { name: 'Account', exact: true, includeHidden: true })).toBeHidden();
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');

    const menuLogout = page.locator('.dropdown-navbar-menu a');
    await menuLogout.evaluate(element => { (element as HTMLElement).style.display = 'none'; });
    await page.locator('.navbar-nav').evaluate(element => { (element as HTMLElement).style.display = ''; });
    await expect(menuLogout).toHaveCSS('display', 'none');
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');

    await menuLogout.evaluate(element => {
      (element as HTMLElement).style.display = '';
      element.setAttribute('inert', '');
    });
    await expect(menuLogout).toHaveAttribute('inert', '');
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');

    await menuLogout.evaluate(element => {
      element.removeAttribute('inert');
      element.setAttribute('href', 'https://attacker.invalid/Orders/Search');
    });
    await expect(menuLogout).toHaveAttribute('href', 'https://attacker.invalid/Orders/Search');
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');

    await menuLogout.evaluate(element => element.setAttribute('href', ''));
    await expect.poll(fixture.signedIn, { timeout: 3000 }).toBe(true);
    expect(await fixture.login).toBe(true);
    expect(fixture.dialogs).toHaveLength(0);
    expect(fixture.writes).toEqual([]);
  } finally {
    await fixture.close();
  }
});

test('duplicate hidden and visible logout markers remain ambiguous until only the account marker remains', async ({ browser, context, page }) => {
  const fixture = await gridFixture(browser, context, page, false,
    `${accountMenu()}<a class="duplicate-logout" href="">Log Out</a>`);
  try {
    await fixture.openSearch();
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    await expect(page.getByRole('link', { name: 'Log Out', exact: true, includeHidden: true })).toHaveCount(2);
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');
    await page.locator('.duplicate-logout').evaluate(element => element.remove());
    await expect.poll(fixture.signedIn, { timeout: 3000 }).toBe(true);
    expect(await fixture.login).toBe(true);
    expect(fixture.dialogs).toHaveLength(0);
    expect(fixture.writes).toEqual([]);
  } finally {
    await fixture.close();
  }
});

async function expectExcludedMarkerUntilRestored(browser: Browser, markup: string): Promise<void> {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const fixture = await gridFixture(browser, context, page, false, markup);
  try {
    await fixture.openSearch();
    await expect(page.locator('html')).toHaveAttribute('data-grid-loads', '1');
    // Give the DOM-based marker wait two rendering turns to inspect the excluded marker.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(fixture.signedIn()).toBe(false);
    await expect(fixture.session.navigateToOrder()).rejects.toThrow('paused while you sign in');
    await page.locator('#account').evaluate(account => {
      for (const element of account.querySelectorAll('[aria-hidden], [inert]')) {
        element.removeAttribute('aria-hidden');
        element.removeAttribute('inert');
      }
    });
    await expect.poll(fixture.signedIn, { timeout: 3000 }).toBe(true);
    expect(await fixture.login).toBe(true);
    expect(fixture.dialogs).toHaveLength(0);
    expect(fixture.writes).toEqual([]);
  } finally {
    await fixture.close();
  }
}

test('visible logout markers excluded by aria-hidden or inert on the link or an ancestor do not confirm sign-in', async ({ browser }) => {
  for (const attribute of ['aria-hidden="true"', 'inert']) {
    await test.step(`${attribute} on the link`, async () => {
      await expectExcludedMarkerUntilRestored(browser, `<a href="" ${attribute}>Log Out</a>`);
    });
    await test.step(`${attribute} on a containing element`, async () => {
      await expectExcludedMarkerUntilRestored(browser, `<div ${attribute}><a href="">Log Out</a></div>`);
    });
  }
});

test('collapsed account markers excluded by aria-hidden or inert anywhere in their navbar ancestry do not confirm sign-in', async ({ browser }) => {
  for (const attribute of ['aria-hidden="true"', 'inert']) {
    for (const owner of ['menu', 'owner', 'navbar', 'wrapper']) {
      const source = accountMenu();
      const target = owner === 'menu' ? 'class="dropdown-menu dropdown-navbar-menu px-3"'
        : owner === 'owner' ? 'class="dropdown nav-menu-item my-2"' : 'class="navbar-nav navbar-right"';
      const markup = owner === 'wrapper' ? `<div ${attribute}>${source}</div>` : source.replace(target, `${target} ${attribute}`);
      await test.step(`${attribute} on ${owner}`, async () => {
        await expectExcludedMarkerUntilRestored(browser, markup);
      });
    }
  }
});

test('cancellation during the final account-marker read cannot record a late successful login', async ({ browser }) => {
  for (const cancellation of ['browser closure', 'abort signal'] as const) {
    await test.step(cancellation, async () => {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const fixture = await gridFixture(browser, context, page, true);
      const originalEvaluate = page.evaluate;
      let held = false;
      let release!: () => void;
      const resume = new Promise<void>(resolve => { release = resolve; });
      page.evaluate = (async (...args: Parameters<Page['evaluate']>) => {
        const result = await originalEvaluate.apply(page, args);
        const callback = args[0];
        if (!held && typeof callback === 'function' && callback.name === 'hasAuthenticatedAccountMarker' && result === true) {
          held = true;
          await resume;
        }
        return result;
      }) as Page['evaluate'];
      try {
        await fixture.openSearch();
        await expect.poll(() => held, { timeout: 3000 }).toBe(true);
        expect(fixture.signedIn()).toBe(false);
        // A user navigation can occur while the final marker's browser round trip is completing.
        await page.goto(R3_ORDER_URL);
        if (cancellation === 'browser closure') await context.close();
        else fixture.cancelLogin();
        expect(await fixture.login).toBe(false);
        await expect.poll(() => page.isClosed()).toBe(true);
        release();
        // Drain the resumed evaluate and its login continuation before checking the public state.
        await new Promise<void>(resolve => setImmediate(resolve));
        expect(fixture.session.isOrderPage()).toBe(false);
        await expect(fixture.session.navigateToOrder()).rejects.toThrow('closed');
        expect(fixture.writes).toEqual([]);
      } finally {
        release();
        page.evaluate = originalEvaluate;
        await fixture.close();
      }
    });
  }
});

test('grid license policy allows only the inspected GET XHR and bounded cache-buster', () => {
  const request = { url: licenseUrl, method: 'GET', isNavigation: false, isMainFrameNavigation: false, resourceType: 'xhr', phase: 'authenticating' as const };
  for (const phase of ['authenticating', 'preparing'] as const) {
    for (const query of ['', '?_=0', '?_=1234567890', `?_=${'9'.repeat(20)}`]) {
      expect(maySendRequest({ ...request, url: `${licenseUrl}${query}`, phase }), `${phase} ${query}`).toBe(true);
    }
    expect(maySendRequest({ ...request, url: 'https://clients.r3amc.com/artifacts/grid/license', phase })).toBe(true);
    for (const query of ['?_=', '?_=1&_=2', '?_=1&other=2', '?other=1', '?_=+1', '?_=-1', '?_=1.1', '?_=abc', '?_=1%202', '?_=%EF%BC%91', `?_=${'9'.repeat(21)}`]) {
      expect(maySendRequest({ ...request, url: `${licenseUrl}${query}`, phase }), `${phase} ${query}`).toBe(false);
    }
    for (const method of ['HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      expect(maySendRequest({ ...request, method, phase }), `${phase} ${method}`).toBe(false);
    }
    for (const resourceType of ['fetch', 'document', 'script', 'stylesheet', 'image', undefined]) {
      expect(maySendRequest({ ...request, resourceType, phase }), `${phase} ${String(resourceType)}`).toBe(false);
    }
    expect(maySendRequest({ ...request, isNavigation: true, phase })).toBe(false);
    for (const url of [
      `${licenseUrl}/`, `${licenseUrl}/Other`, `${licenseUrl}Other`,
      'https://clients.r3amc.com/Artifacts/Grid/Other',
      'http://clients.r3amc.com/Artifacts/Grid/License',
      'https://attacker.invalid/Artifacts/Grid/License',
      'https://clients.r3amc.com:8443/Artifacts/Grid/License',
      'https://synthetic-user@clients.r3amc.com/Artifacts/Grid/License',
    ]) expect(maySendRequest({ ...request, url, phase }), `${phase} ${url}`).toBe(false);
  }
  expect(maySendRequest({ ...request, phase: 'closed' })).toBe(false);
});
