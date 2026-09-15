// Compare unauthenticated login entry routes with the application's compiled network guards.
import { chromium } from 'playwright';
import { createGuardedSession } from '../../dist/browser/session.js';
import { browserEnvironment } from '../../dist/browser/r3-fields.js';

// Retain only routing metadata; never inspect login fields, credentials, response bodies, or cookies.
const summarize = raw => { const url = new URL(raw); return { origin: url.origin, path: url.pathname, queryKeys: [...url.searchParams.keys()] }; };
const candidates = process.argv.includes('--current') ? [undefined] : ['https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F', 'https://clients.r3amc.com/'];
for (const entry of candidates) {
  // Each comparison uses a fresh visible browser and the same filtered environment as production.
  const browser = await chromium.launch({ headless: false, env: browserEnvironment(process.env) });
  try {
    // Block service workers/downloads and preserve the production viewport without stored authentication.
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
    const page = await context.newPage();
    // Observe only main-frame HTTP statuses and sanitized URL components.
    page.on('response', response => { const request = response.request(); if (request.isNavigationRequest() && request.frame() === page.mainFrame()) console.info(JSON.stringify({ event: 'navigation', status: response.status(), method: request.method(), ...summarize(response.url()) })); });
    const goto = page.goto.bind(page);
    // The comparison override changes only the initial fixed GET destination in this diagnostic, never application source.
    page.goto = async (url, options) => {
      const response = await goto(entry ?? url, options);
      console.info(JSON.stringify({ event: 'loaded', status: response?.status(), ...summarize(page.url()) }));
      return response;
    };
    let finishReady;
    const ready = new Promise(resolve => { finishReady = resolve; });
    const session = await createGuardedSession(browser, context, page, { onStatus: status => { console.info(JSON.stringify({ event: 'status', status })); if (status === 'awaiting_login') finishReady(); } });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const waiting = session.waitForUserLogin({ signal: controller.signal }).catch(error => console.info(JSON.stringify({ event: 'ended', code: error.code ?? error.name })));
    // Stop after initial navigation; no credentials, CAPTCHA interaction, order preparation, or provider calls occur.
    await Promise.race([ready, waiting]);
    controller.abort();
    await waiting;
    clearTimeout(timeout);
  } finally { await browser.close(); }
}
