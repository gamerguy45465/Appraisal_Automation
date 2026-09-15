// Observe public sign-in resource requests through the production guard without inspecting the login page.
import { chromium } from 'playwright';
// Use the same compiled session and filtered browser environment as the application.
import { createGuardedSession } from '../../dist/browser/session.js';
import { browserEnvironment } from '../../dist/browser/r3-fields.js';
// Retain only public asset paths and query key names, never cookies, bodies, headers or query values.
const summarize = raw => { const url = new URL(raw); return { origin: url.origin, path: url.pathname, queryKeys: [...url.searchParams.keys()] }; };
// Open an isolated visible browser without touching an existing order window.
const browser = await chromium.launch({ headless: false, env: browserEnvironment(process.env) });
// Close this diagnostic's resources even if a request or initial navigation fails.
try {
  // Match production isolation settings while leaving JavaScript at Chromium's enabled default.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
  // Create a fresh public-page tab with no stored authentication.
  const page = await context.newPage();
  // Limit resource observations to presentation assets, excluding forms and authentication requests.
  const isAsset = request => ['stylesheet', 'script', 'font', 'image'].includes(request.resourceType());
  // Record each failed asset's browser error code and sanitized address.
  page.on('requestfailed', request => { if (isAsset(request)) console.info(JSON.stringify({ event: 'asset_failed', type: request.resourceType(), ...summarize(request.url()), error: request.failure()?.errorText })); });
  // Record only HTTP status and sanitized address for asset responses.
  page.on('response', response => { if (isAsset(response.request())) console.info(JSON.stringify({ event: 'asset_response', type: response.request().resourceType(), ...summarize(response.url()), status: response.status() })); });
  // Resolve only when the application's initial login-page load is ready.
  let finishReady;
  const ready = new Promise(resolve => { finishReady = resolve; });
  // Keep the real native login guard; no credential fields or CAPTCHA controls are operated.
  const session = await createGuardedSession(browser, context, page, { onStatus: status => { if (status === 'awaiting_login') finishReady(); } });
  // Bound startup independently of the application's indefinite human sign-in wait.
  const controller = new AbortController();
  // Abort this diagnostic if initial public page loading takes too long.
  const timer = setTimeout(() => controller.abort(), 20000);
  // Handle cancellation immediately without exposing private exception details.
  const waiting = session.waitForUserLogin({ signal: controller.signal }).catch(() => undefined);
  // Wait for initial readiness or an early failure; never submit a login.
  await Promise.race([ready, waiting]);
  // Let remaining public presentation assets settle for a bounded diagnostic interval.
  await page.waitForTimeout(3000);
  // Stop sign-in waiting after resource observation completes.
  controller.abort();
  // Drain the cancellation before releasing the browser.
  await waiting;
  // Clear the diagnostic startup deadline.
  clearTimeout(timer);
} finally {
  // Close only this isolated diagnostic browser.
  await browser.close();
}
