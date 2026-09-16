import { createServer, type Server } from 'node:http';
import { expect, test } from '@playwright/test';
import { createApp } from '../src/app.js';
import type { HostingConfig } from '../src/hosting.js';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL });

let website: Server;
let referringSite: Server;
let websiteUrl: string;
let referringUrl: string;
let stopRunner: () => void;
const navigations: { path: string; site?: string; mode?: string; destination?: string }[] = [];

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Navigation fixture did not bind a port.');
  return address.port;
}

test.beforeAll(async () => {
  let serve: ReturnType<typeof createApp>['app'];
  website = createServer((request, response) => {
    navigations.push({ path: request.url ?? '', site: request.headers['sec-fetch-site'] as string | undefined,
      mode: request.headers['sec-fetch-mode'] as string | undefined,
      destination: request.headers['sec-fetch-dest'] as string | undefined });
    serve(request, response);
  });
  const port = await listen(website);
  websiteUrl = `http://localhost:${port}`;
  // Loopback HTTP is a test transport. Production still validates a canonical HTTPS origin.
  // localhost and 127.0.0.1 let Chromium generate real cross-site navigation metadata.
  const hosting: HostingConfig = {
    mode: 'hosted', listen: { port, host: '0.0.0.0' }, secureCookies: true,
    publicOrigin: websiteUrl, allowedOrigins: [websiteUrl], allowedHosts: [`localhost:${port}`],
  };
  const instance = createApp({ hosting, accessKey: 'synthetic-navigation-workspace-key-1234567890' });
  serve = instance.app;
  stopRunner = () => instance.runner.shutdown();
  referringSite = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(`<a href="${websiteUrl}/">Open workspace</a><a href="${websiteUrl}/api/session">Open session API</a>`);
  });
  referringUrl = `http://127.0.0.1:${await listen(referringSite)}`;
});

test.afterAll(async () => {
  stopRunner?.();
  for (const server of [website, referringSite]) {
    if (!server?.listening) continue;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('an external link opens the hosted sign-in page with native browser metadata', async ({ page, context }) => {
  navigations.length = 0;
  await page.goto(referringUrl);
  const responsePromise = page.waitForResponse(response => response.url() === `${websiteUrl}/`);
  await page.getByRole('link', { name: 'Open workspace', exact: true }).click();
  expect((await responsePromise).status()).toBe(200);
  expect(navigations.find(item => item.path === '/')).toMatchObject({ site: 'cross-site', mode: 'navigate', destination: 'document' });
  await expect(page.getByLabel('Workspace access code', { exact: true })).toBeVisible();
  expect(await context.cookies()).toEqual([]);
});

test('an external link to the session API remains rejected', async ({ page }) => {
  navigations.length = 0;
  await page.goto(referringUrl);
  const responsePromise = page.waitForResponse(response => response.url() === `${websiteUrl}/api/session`);
  await page.getByRole('link', { name: 'Open session API', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ error: { code: 'ORIGIN_REJECTED' } });
  expect(navigations.find(item => item.path === '/api/session')).toMatchObject({ site: 'cross-site', mode: 'navigate', destination: 'document' });
});
