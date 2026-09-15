// [L1] Imports Playwright's Chromium browser launcher.
import { chromium } from 'playwright';
// [L2] Imports the compiled guarded-browser-session factory used by the application.
import { createGuardedSession } from '../../dist/browser/session.js';
// [L3] Imports the compiled environment-filtering helper used when launching Chromium.
import { browserEnvironment } from '../../dist/browser/r3-fields.js';
import { contactMetadata } from './contact-metadata.mjs';
// [L4] Blank line separating the surrounding declarations, statements, or document blocks.

// [L5] Documents that login diagnostics must omit form values, headers, bodies, and query values.
// Sign-in diagnostics only: never collect form values, headers, bodies or query values.
// [L6] Defines a URL summarizer that retains origin, pathname, and query parameter names without query values.
function describeUrl(value) {
  // [L7] Attempts to parse the supplied URL while permitting invalid input to be summarized safely.
  try {
    // [L8] Parses the supplied string with the URL constructor.
    const url = new URL(value);
    // [L9] Returns the URL origin, path, and unique query parameter names, omitting parameter values.
    return { origin: url.origin, path: url.pathname, queryKeys: [...new Set(url.searchParams.keys())] };
  // [L10] Returns an invalidUrl marker when URL parsing fails.
  } catch { return { invalidUrl: true }; }
// [L11] Ends the URL-summary helper.
}
// [L12] Defines a reporter that emits one JSON object containing the event name and supplied details.
function report(event, details) { console.info(JSON.stringify({ event, ...details })); }
// Enable optional read-only resource checks on the order page only after confirmed manual authentication.
const inspectOrderResources = process.argv.includes('--order-resources');
// Inspect the login landing page's background reads without recording request data.
const inspectLoginResources = process.argv.includes('--login-resources');
// Optional contact structure inspection records only static identifiers and known captions, never values.
const inspectContacts = process.argv.includes('--contact-structure');
// [L13] Blank line separating the surrounding declarations, statements, or document blocks.

// [L14] Launches a visible Chromium browser with the application-filtered process environment.
const browser = await chromium.launch({ headless: false, env: browserEnvironment(process.env) });
// [L15] Creates a 1440-by-1000 context that blocks service workers and does not accept downloads.
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
// [L16] Creates the browser page used for manual sign-in diagnostics.
const page = await context.newPage();
if (inspectLoginResources) {
  const isBackgroundRead = request => ['xhr', 'fetch'].includes(request.resourceType());
  page.on('request', request => { if (isBackgroundRead(request)) report('background_request', { method: request.method(), type: request.resourceType(), ...describeUrl(request.url()) }); });
  page.on('response', response => { if (isBackgroundRead(response.request())) report('background_response', { method: response.request().method(), type: response.request().resourceType(), ...describeUrl(response.url()), status: response.status() }); });
  page.on('requestfailed', request => { if (isBackgroundRead(request)) report('background_failed', { method: request.method(), type: request.resourceType(), ...describeUrl(request.url()), error: request.failure()?.errorText }); });
  // Preserve human control of dialogs; retain no message content or credentials.
  page.on('dialog', dialog => report('login_dialog', { type: dialog.type(), undefinedMessage: dialog.message() === 'undefined' }));
  page.on('pageerror', error => report('page_script_error', { name: error.name }));
  page.on('domcontentloaded', () => {
    if (page.url() !== 'https://clients.r3amc.com/Orders/Search') return;
    // Inspect only the sign-out marker's structure, never login fields or account/order text.
    void page.evaluate(() => [...document.querySelectorAll('a')]
      .filter(link => /^(?:log\s*out|sign\s*out)$/i.test(link.textContent?.trim() ?? ''))
      .map(link => {
        const destination = new URL(link.href, location.href);
        const ancestors = [];
        for (let element = link.parentElement; element && ancestors.length < 5; element = element.parentElement) {
          ancestors.push({ tag: element.tagName, className: element.className });
        }
        return {
          exactLogOutLabel: link.textContent?.trim() === 'Log Out',
          visible: Boolean(link.getClientRects().length) && getComputedStyle(link).visibility !== 'hidden',
          destination: { origin: destination.origin, path: destination.pathname, queryKeys: [...destination.searchParams.keys()] },
          ancestors,
        };
      }))
      .then(markers => report('authenticated_marker_structure', { markers }))
      .catch(() => undefined);
  });
}
// Asset checks record public routing metadata only, never form values or response bodies.
if (inspectOrderResources) {
  // Restrict response observations to stylesheet, script, image and font resource requests.
  const isAsset = request => ['stylesheet', 'script', 'font', 'image'].includes(request.resourceType());
  // Report asset HTTP status with query names and omit all query values.
  page.on('response', response => { if (isAsset(response.request())) report('asset_response', { type: response.request().resourceType(), ...describeUrl(response.url()), status: response.status() }); });
  // Identify failed asset loads without collecting private page text or response content.
  page.on('requestfailed', request => { if (isAsset(request)) report('asset_failed', { type: request.resourceType(), ...describeUrl(request.url()), error: request.failure()?.errorText }); });
  // Retain only the JavaScript error category, never its potentially private message or stack.
  page.on('pageerror', error => report('page_script_error', { name: error.name }));
// Finish optional asset instrumentation without changing any request decision.
}
// [L17] Preserves the bound original CDP-session factory before wrapping it for instrumentation.
const originalSession = context.newCDPSession.bind(context);
// [L18] Replaces the CDP-session factory with an instrumented asynchronous wrapper.
context.newCDPSession = async (target) => {
  // [L19] Creates the real Chrome DevTools Protocol session for the requested target.
  const cdp = await originalSession(target);
  // [L20] Creates a per-CDP-session map linking paused redirect request IDs to sanitized diagnostic details.
  const redirects = new Map();
  // [L21] Observes Fetch.requestPaused events without deciding whether the guarded request should proceed.
  cdp.on('Fetch.requestPaused', (event) => {
    // [L22] Reads the paused response's status code, defaulting to zero when absent.
    const status = event.responseStatusCode ?? 0;
    // [L23] Ignores events outside the HTTP 300-399 redirect-status range.
    if (status < 300 || status >= 400) return;
    // [L24] Finds the Location header case-insensitively and reads its value when present.
    const location = event.responseHeaders?.find(header => header.name.toLowerCase() === 'location')?.value;
    // [L25] Ignores redirect-status responses without a Location header.
    if (!location) return;
    // [L26] Starts a diagnostic object describing the redirect without exposing query parameter values.
    const details = {
      // [L27] Records the redirect's HTTP status, request method, and resource type.
      status, method: event.request.method, resourceType: event.resourceType,
      // [L28] Summarizes source and destination URLs, resolving a relative Location against the source URL.
      from: describeUrl(event.request.url), to: describeUrl(new URL(location, event.request.url).href),
    // [L29] Completes the redirect-details object.
    };
    // [L30] Associates the sanitized redirect details with the paused request ID.
    redirects.set(event.requestId, details);
    // [L31] Emits the redirect diagnostic event.
    report('redirect', details);
  // [L32] Ends and registers the paused-request listener.
  });
  // [L33] Preserves the CDP session's bound send method before adding diagnostic reporting.
  const originalSend = cdp.send.bind(cdp);
  // [L34] Wraps CDP send so guard-triggered request failures can be reported.
  cdp.send = async (method, params) => {
    // [L35] Reports Fetch.failRequest calls with saved redirect details or the protocol's failure reason.
    if (method === 'Fetch.failRequest') report('guard_blocked_redirect', redirects.get(params.requestId) ?? { reason: params.errorReason });
    // [L36] Forwards the CDP command and parameters to the original send method unchanged.
    return originalSend(method, params);
  // [L37] Ends the wrapped CDP send implementation.
  };
  // [L38] Returns the instrumented CDP session to its caller.
  return cdp;
// [L39] Ends the instrumented CDP-session factory assignment.
};
// [L40] Observes page requests that fail.
page.on('requestfailed', request => {
  // [L41] Reports only navigation-request failures with method, sanitized URL, and Playwright's failure text.
  if (request.isNavigationRequest()) report('navigation_failed', { method: request.method(), url: describeUrl(request.url()), error: request.failure()?.errorText });
// [L42] Ends and registers the failed-request listener.
});
// [L43] Creates the application's guarded session around the diagnostic browser, context, and page.
const session = await createGuardedSession(browser, context, page, {
  // [L44] Reports session status updates as structured diagnostic events.
  onStatus: (status) => report('status', { status }),
// [L45] Completes guarded-session creation with the status callback.
});
// [L46] Closes the guarded session asynchronously when the process receives Ctrl+C/SIGINT.
process.on('SIGINT', () => { void session.close(); });
// [L47] Starts a 15-minute timer that reports expiration and requests session closure.
const deadline = setTimeout(() => { report('diagnostic_timeout', {}); void session.close(); }, 15 * 60 * 1000);
// [L48] Begins waiting for manual login under diagnostic error handling.
try {
  // [L49] Waits for the user to complete sign-in through the guarded browser session.
  await session.waitForUserLogin();
  // [L50] Reports successful login with the sanitized destination and explicitly records that order preparation has not started.
  report('signed_in', { destination: describeUrl(page.url()), orderPreparationStarted: false });
  // Inspect the unfilled order page only when the explicit resource diagnostic mode was requested.
  if (inspectOrderResources || inspectContacts) {
    // Use the application's exact authenticated order navigation with its normal preparation guard.
    await session.navigateToOrder();
    // Allow asynchronous presentation assets to finish without filling or submitting the form.
    await page.waitForLoadState('load', { timeout: 15000 });
    // Bound the remaining font/script-settling interval in the diagnostic browser only.
    await page.waitForTimeout(2000);
    // Observe rendering indicators on the confirmed order page, excluding field values and page text.
    const presentation = await page.evaluate(() => ({ stylesheets: document.styleSheets.length, fontFamily: getComputedStyle(document.body).fontFamily, jqueryLoaded: typeof window.jQuery === 'function', bootstrapLoaded: typeof window.bootstrap === 'object' }));
    // Mark resource inspection completion separately from actual order filling or submission.
    report('order_resources_checked', { destination: describeUrl(page.url()), ...presentation, fieldsFilled: false, orderSubmitted: false });
    if (inspectContacts) report('contact_structure', await page.evaluate(contactMetadata));
  // End optional order resource checking and leave the diagnostic visible for human comparison.
  }
  // [L51] Keeps diagnostics alive until the guarded browser session closes.
  await session.waitUntilClosed();
// [L52] Handles a login-wait or browser-session termination error.
} catch (error) {
  // [L53] Reports the error's string code when available, otherwise BROWSER_CLOSED.
  report('diagnostic_finished', { code: typeof error?.code === 'string' ? error.code : 'BROWSER_CLOSED' });
// [L54] Begins cleanup that executes after success or failure.
} finally {
  // [L55] Cancels the diagnostic deadline timer.
  clearTimeout(deadline);
  // [L56] Awaits guarded-session closure to release browser resources.
  await session.close();
// [L57] Ends diagnostic cleanup.
}
