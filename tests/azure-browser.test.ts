import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const identity = vi.hoisted(() => ({ getToken: vi.fn(), construct: vi.fn() }));
vi.mock('@azure/identity', () => ({
  ManagedIdentityCredential: vi.fn(function (options: unknown) {
    identity.construct(options);
    return { getToken: identity.getToken };
  }),
}));

import { createAzureBrowserConnector, resolveAzureBrowserConfig } from '../src/azure-browser.js';
import { AppError } from '../src/errors.js';

const workspaceId = '671794d3-81e7-4fcd-8627-da08041d17fd';
const serviceUrl = `wss://westus3.api.playwright.microsoft.com/playwrightworkspaces/${workspaceId}/browsers`;
const managedIdentityClientId = '12345678-abcd-4321-1234-123456789abc';

beforeEach(() => {
  vi.clearAllMocks();
  identity.construct.mockReset();
  identity.getToken.mockReset().mockResolvedValue({ token: 'synthetic.access.token', expiresOnTimestamp: Date.now() + 3_600_000 });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('Azure browser deployment configuration', () => {
  it('accepts the exact public endpoint and optional deployment-specific identity', () => {
    const config = resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL: serviceUrl, APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID: managedIdentityClientId });
    expect(config).toEqual({ serviceUrl, managedIdentityClientId });
    expect(Object.isFrozen(config)).toBe(true);
    expect(resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL: serviceUrl, AZURE_CLIENT_ID: 'untrusted-inherited-default' })).toEqual({ serviceUrl });
  });

  it.each([
    undefined, '', ' https://secret.example', ` ${serviceUrl}`, `${serviceUrl}\n`,
    serviceUrl.replace('wss:', 'ws:'), serviceUrl.replace('wss:', 'https:'),
    serviceUrl.replace('westus3', 'invalidregion'), serviceUrl.replace('.microsoft.com', '.microsoft.com.secret.example'),
    serviceUrl.replace('westus3.api.playwright.microsoft.com', '127.0.0.1'),
    serviceUrl.replace('westus3.api.playwright.microsoft.com', 'westus3.api.playwright.azure.us'),
    serviceUrl.replace('westus3.api', 'WestUS3.api'), serviceUrl.replace('.com/', '.com:443/'),
    serviceUrl.replace('wss://', 'wss://user:secret@'), serviceUrl.replace(workspaceId, 'not-a-workspace'),
    serviceUrl.replace(workspaceId, workspaceId.toUpperCase()), serviceUrl.replace('/browsers', '/anything/../browsers'),
    `${serviceUrl}/`, `${serviceUrl}?`, `${serviceUrl}?token=secret`, `${serviceUrl}#`, `${serviceUrl}#secret`,
    `${serviceUrl}\\anything`, serviceUrl.replace('/browsers', '/%62rowsers'),
  ])('rejects malformed or untrusted service URL %j without disclosing it', PLAYWRIGHT_SERVICE_URL => {
    expect(() => resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL })).toThrow(AppError);
    try { resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL }); } catch (error) {
      expect(error).toMatchObject({ code: 'AZURE_BROWSER_CONFIG', statusCode: 500 });
      expect((error as Error).message).not.toContain('secret');
    }
  });

  it.each(['', 'secret', ` ${managedIdentityClientId}`, `${managedIdentityClientId}\n`, managedIdentityClientId.toUpperCase()])('rejects malformed identity %j', clientId => {
    expect(() => resolveAzureBrowserConfig({ PLAYWRIGHT_SERVICE_URL: serviceUrl, APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID: clientId })).toThrow(AppError);
  });

  it('revalidates manually constructed configuration before creating a credential', () => {
    expect(() => createAzureBrowserConnector({ serviceUrl: 'wss://secret.example/browser' })).toThrow(AppError);
    expect(identity.construct).not.toHaveBeenCalled();
  });
});

describe('trusted managed identity connector', () => {
  it('uses only managed identity and produces a private native connection with a fresh run ID', async () => {
    vi.stubEnv('PLAYWRIGHT_SERVICE_URL', 'wss://inherited.secret.example');
    vi.stubEnv('PLAYWRIGHT_SERVICE_ACCESS_TOKEN', 'inherited.secret.token');
    vi.stubEnv('_MPT_SERVICE_RUN_ID', 'inherited-secret-run');
    vi.stubEnv('AZURE_CLIENT_ID', 'inherited-secret-client');
    const connect = createAzureBrowserConnector({ serviceUrl });
    const first = await connect();
    const second = await connect();
    expect(identity.construct).toHaveBeenCalledExactlyOnceWith({});
    expect(identity.getToken).toHaveBeenCalledWith('https://management.core.windows.net/.default', { abortSignal: expect.any(AbortSignal) });
    const endpoint = new URL(first.wsEndpoint);
    expect(`${endpoint.origin}${endpoint.pathname}`).toBe(serviceUrl);
    expect(Object.fromEntries(endpoint.searchParams)).toEqual({
      runId: expect.stringMatching(/^[0-9a-f-]{36}$/), os: 'linux', sourceType: 'Others', 'api-version': '2025-09-01',
    });
    expect(second.wsEndpoint).not.toBe(first.wsEndpoint);
    expect(first.headers).toEqual({ Authorization: 'Bearer synthetic.access.token' });
    expect(first.timeout).toBe(30_000);
    expect(Object.keys(first).sort()).toEqual(['headers', 'timeout', 'wsEndpoint']);
    expect(process.env.PLAYWRIGHT_SERVICE_URL).toBe('wss://inherited.secret.example');
    expect(process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN).toBe('inherited.secret.token');
    expect(process.env._MPT_SERVICE_RUN_ID).toBe('inherited-secret-run');
  });

  it('pins the explicit user-assigned identity and copies configuration before use', async () => {
    const config = { serviceUrl, managedIdentityClientId };
    const connect = createAzureBrowserConnector(config);
    config.serviceUrl = 'wss://secret.example';
    config.managedIdentityClientId = 'secret';
    expect(identity.construct).toHaveBeenCalledExactlyOnceWith({ clientId: managedIdentityClientId });
    expect((await connect()).wsEndpoint.startsWith(`${serviceUrl}?`)).toBe(true);
  });

  it('sanitizes constructor and asynchronous credential failures', async () => {
    identity.construct.mockImplementationOnce(() => { throw new Error('secret credential detail'); });
    expect(() => createAzureBrowserConnector({ serviceUrl })).toThrow('The Azure browser could not authenticate.');
    identity.getToken.mockRejectedValueOnce(new Error('secret credential detail'));
    await expect(createAzureBrowserConnector({ serviceUrl })()).rejects.toMatchObject({ code: 'AZURE_BROWSER_AUTH', statusCode: 503 });
  });

  it.each([
    null,
    { token: '', expiresOnTimestamp: Infinity },
    { token: 'secret\r\nInjected: value', expiresOnTimestamp: Date.now() + 3_600_000 },
    { token: 'secret\n', expiresOnTimestamp: Date.now() + 3_600_000 },
    { token: 'secret token', expiresOnTimestamp: Date.now() + 3_600_000 },
    { token: 'x'.repeat(32_769), expiresOnTimestamp: Date.now() + 3_600_000 },
    { token: 'synthetic.token', expiresOnTimestamp: 0 },
    { token: 'synthetic.token', expiresOnTimestamp: Date.now() + 20_000 },
    { token: 'synthetic.token', expiresOnTimestamp: Infinity },
  ])('rejects missing, unsafe, or expiring bearer data (case %#)', async access => {
    identity.getToken.mockResolvedValueOnce(access);
    await expect(createAzureBrowserConnector({ serviceUrl })()).rejects.toMatchObject({
      code: 'AZURE_BROWSER_AUTH', statusCode: 503,
      message: 'The Azure browser could not authenticate. Check the App Service managed identity and its access to the Playwright workspace.',
    });
  });

  it('bounds authentication time and aborts the credential request', async () => {
    vi.useFakeTimers();
    identity.getToken.mockReturnValueOnce(new Promise(() => {}));
    const result = createAzureBrowserConnector({ serviceUrl })();
    const rejected = expect(result).rejects.toMatchObject({ code: 'AZURE_BROWSER_AUTH' });
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected;
    expect(identity.getToken.mock.calls[0]?.[1].abortSignal.aborted).toBe(true);
  });
});
