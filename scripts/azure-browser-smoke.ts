import { randomUUID } from 'node:crypto';
import type { Browser } from 'playwright';

// Developer-only, explicit live probe. No R3, loan documents, provider calls, or saved artifacts.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FIXTURE_URL = 'https://example.test/';
const FIXTURE = '<!doctype html><html><head><title>Synthetic Azure browser check</title></head><body><label for="input">Synthetic input</label><input id="input"><button id="button" onclick="this.textContent=\'clicked\'">Click</button></body></html>';
const checks = {
  configuration: false,
  authentication: false,
  nativeConnection: false,
  httpRouting: false,
  webSocketRouting: false,
  cdpFetchCommands: false,
  screenshot: false,
  keyboard: false,
  mouse: false,
  browserClosed: false,
};
type Stage = 'configuration' | 'identity_initialization' | 'authentication' | 'native_connection' | 'capability_probe' | 'cleanup';

function safeFailure(error: unknown, stage: Stage): Record<string, string | number> {
  const fields = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const output: Record<string, string | number> = { stage };
  // Only short error identifiers and numeric HTTP status are diagnostic output.
  // Never include messages, stacks, causes, response bodies, URLs, or headers.
  for (const name of ['name', 'errorCode', 'code'] as const) {
    const value = fields[name];
    if (typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(value)) output[name] = value;
  }
  const status = fields.statusCode ?? fields.status;
  if (typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599) output.status = status;
  // Azure Identity can discard the MSAL code while wrapping it in AuthenticationRequiredError.
  // Extract only the leading machine identifier and fixed-format Entra number from that message.
  if (fields.name === 'AuthenticationRequiredError' && typeof fields.message === 'string') {
    const code = /^([a-z][a-z_]{2,79}):/.exec(fields.message)?.[1];
    const entra = /\bAADSTS[0-9]{4,10}\b/.exec(fields.message)?.[0];
    if (code) output.errorCode ??= code;
    if (entra) output.entraCode = entra;
    if (fields.message === 'Unexpected sign-in prompt.') output.errorCode = 'unexpected_device_prompt';
  }
  return output;
}

async function deadline<T>(work: Promise<T>, milliseconds: number, onTimeout?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => { onTimeout?.(); reject(new Error('Probe deadline.')); }, milliseconds);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

async function probe(browser: Browser): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, serviceWorkers: 'block' });
  context.setDefaultTimeout(10_000);
  context.setDefaultNavigationTimeout(10_000);
  let routed = false;
  // Every HTTP request is handled locally; nothing is forwarded to a website.
  await context.route('**/*', async route => {
    if (route.request().url() !== FIXTURE_URL) { await route.abort(); return; }
    routed = true;
    await route.fulfill({ status: 200, contentType: 'text/html', body: FIXTURE });
  });
  // Calling connectToServer is intentionally absent: this socket is a local mock.
  let socketRouted = false;
  await context.routeWebSocket('**/*', socket => {
    if (socket.url() !== 'wss://example.test/echo') { void socket.close(); return; }
    socketRouted = true;
    socket.onMessage(message => { if (message === 'synthetic') socket.send('synthetic-ok'); });
  });
  const page = await context.newPage();
  await page.goto(FIXTURE_URL);
  checks.httpRouting = routed && await page.title() === 'Synthetic Azure browser check';

  const echoed = await page.evaluate(() => new Promise<boolean>(resolve => {
    const socket = new WebSocket('wss://example.test/echo');
    const timer = setTimeout(() => { socket.close(); resolve(false); }, 5000);
    socket.onopen = () => { socket.send('synthetic'); };
    socket.onmessage = event => { clearTimeout(timer); socket.close(); resolve(event.data === 'synthetic-ok'); };
    socket.onerror = () => { clearTimeout(timer); socket.close(); resolve(false); };
  }));
  checks.webSocketRouting = socketRouted && echoed;

  // This verifies command support, not the complete production redirect guard.
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await cdp.send('Fetch.disable');
    checks.cdpFetchCommands = true;
  } finally { await cdp.detach(); }

  const input = page.locator('#input');
  await input.focus();
  await page.keyboard.insertText('synthetic input');
  checks.keyboard = await input.inputValue() === 'synthetic input';
  const button = page.locator('#button');
  const bounds = await button.boundingBox();
  if (bounds) {
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    checks.mouse = await button.textContent() === 'clicked';
  }
  const screenshot = await page.screenshot({ type: 'jpeg', quality: 65, timeout: 10_000 });
  checks.screenshot = screenshot.length > 100 && screenshot[0] === 0xff && screenshot[1] === 0xd8;
  // The only image is synthetic and stays in memory until this function returns.
  await context.close();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    console.info('Usage: npx tsx scripts/azure-browser-smoke.ts --live [--auth device]');
    console.info('Required: PLAYWRIGHT_SERVICE_URL and APPRAISAL_AZURE_SMOKE_TENANT_ID. Optional: APPRAISAL_AZURE_SMOKE_CLIENT_ID.');
    console.info('Creates one short-lived Azure browser after interactive developer sign-in. Outputs only sign-in instructions and capability booleans.');
    return;
  }
  if (!(args.length === 1 && args[0] === '--live')
    && !(args.length === 3 && args[0] === '--live' && args[1] === '--auth' && args[2] === 'device')) {
    console.error('Use --help or --live --auth device.');
    process.exitCode = 1;
    return;
  }

  let browser: Browser | undefined;
  let stage: Stage = 'configuration';
  let failure: Record<string, string | number> | undefined;
  const controller = new AbortController();
  const interrupted = (): void => { controller.abort(); void browser?.close().catch(() => undefined); };
  process.once('SIGINT', interrupted);
  process.once('SIGTERM', interrupted);
  // Hard bound only this CLI process if a transport does not honor cancellation.
  const watchdog = setTimeout(() => {
    interrupted();
    console.info(JSON.stringify(checks));
    process.exit(1);
  }, 420_000);
  try {
    // Check before loading either SDK; SDK debug output can contain private connection data.
    if (['DEBUG', 'AZURE_LOG_LEVEL', 'PWDEBUG', 'NODE_DEBUG'].some(name => Boolean(process.env[name]))) throw new Error('Disable debug logging.');
    const tenantId = process.env.APPRAISAL_AZURE_SMOKE_TENANT_ID;
    const clientId = process.env.APPRAISAL_AZURE_SMOKE_CLIENT_ID;
    if (!tenantId || !UUID.test(tenantId) || (clientId !== undefined && !UUID.test(clientId))) throw new Error('Invalid developer identity configuration.');
    const { resolveAzureBrowserConfig } = await import('../src/azure-browser.js');
    const config = resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL: process.env.PLAYWRIGHT_SERVICE_URL });
    checks.configuration = true;
    stage = 'identity_initialization';
    const { DeviceCodeCredential } = await import('@azure/identity');
    const credential = new DeviceCodeCredential({
      tenantId,
      ...(clientId ? { clientId } : {}),
      authorityHost: 'https://login.microsoftonline.com',
      additionallyAllowedTenants: [],
      tokenCachePersistenceOptions: { enabled: false },
      loggingOptions: { allowLoggingAccountIdentifiers: false, enableUnsafeSupportLogging: false },
      userPromptCallback: info => {
        const uri = new URL(info.verificationUri);
        if (uri.protocol !== 'https:' || !['microsoft.com', 'www.microsoft.com', 'login.microsoft.com', 'login.microsoftonline.com'].includes(uri.hostname)
          || uri.username || uri.password || uri.port || !/^[A-Z0-9-]{4,20}$/.test(info.userCode)) throw new Error('Unexpected sign-in prompt.');
        console.info(`Sign in at ${uri.href}`);
        console.info(`Device code: ${info.userCode}`);
      },
    });
    stage = 'authentication';
    let token: Awaited<ReturnType<typeof credential.getToken>> | null = await deadline(credential.getToken('https://management.core.windows.net/.default', {
      abortSignal: controller.signal,
    }), 300_000, () => controller.abort());
    if (!token || !/^[A-Za-z0-9._~+\/-]+=*$/.test(token.token) || token.token.length > 32_768
      || !Number.isFinite(token.expiresOnTimestamp) || token.expiresOnTimestamp <= Date.now() + 60_000) throw new Error('Token unavailable.');
    checks.authentication = true;
    if (controller.signal.aborted) throw new Error('Probe cancelled.');
    const endpoint = new URL(config.serviceUrl);
    endpoint.searchParams.set('runId', randomUUID());
    endpoint.searchParams.set('os', 'linux');
    endpoint.searchParams.set('sourceType', 'Others');
    endpoint.searchParams.set('api-version', '2025-09-01');
    stage = 'native_connection';
    const { chromium } = await import('playwright');
    browser = await chromium.connect(endpoint.href, {
      headers: { Authorization: `Bearer ${token.token}` }, timeout: 30_000, exposeNetwork: '',
    });
    token = null;
    checks.nativeConnection = true;
    if (controller.signal.aborted) throw new Error('Probe cancelled.');
    stage = 'capability_probe';
    await deadline(probe(browser), 60_000, () => { void browser?.close().catch(() => undefined); });
  } catch (error) {
    // Do not print raw Azure/Playwright errors, which can carry headers or endpoint credentials.
    failure = safeFailure(error, stage);
    process.exitCode = 1;
  } finally {
    if (browser) {
      try { await deadline(browser.close(), 10_000); checks.browserClosed = true; }
      catch (error) { failure ??= safeFailure(error, 'cleanup'); process.exitCode = 1; }
    }
    controller.abort();
    clearTimeout(watchdog);
    process.off('SIGINT', interrupted);
    process.off('SIGTERM', interrupted);
    console.info(JSON.stringify({ ...checks, ...(failure ? { failure } : {}) }));
    if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
  }
}

await main();
