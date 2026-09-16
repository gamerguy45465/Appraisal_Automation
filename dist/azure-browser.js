import { randomUUID } from 'node:crypto';
import { ManagedIdentityCredential } from '@azure/identity';
import { AppError } from './errors.js';
const REGIONS = new Set([
    'australiaeast', 'eastasia', 'eastus', 'japaneast',
    'switzerlandnorth', 'westeurope', 'westus3',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CONNECT_TIMEOUT_MS = 30_000;
const TOKEN_SCOPE = 'https://management.core.windows.net/.default';
function configurationError() {
    return new AppError('AZURE_BROWSER_CONFIG', 'Configure a canonical public Azure Playwright workspace browser endpoint and, if needed, a valid managed identity client ID.', 500);
}
function authenticationError() {
    return new AppError('AZURE_BROWSER_AUTH', 'The Azure browser could not authenticate. Check the App Service managed identity and its access to the Playwright workspace.', 503);
}
function validateConfig(serviceUrl, clientId) {
    let endpoint;
    try {
        endpoint = new URL(serviceUrl ?? '');
    }
    catch {
        throw configurationError();
    }
    const hostname = /^([a-z0-9]+)\.api\.playwright\.microsoft\.com$/.exec(endpoint.hostname);
    const path = /^\/playwrightworkspaces\/([0-9a-f-]+)\/browsers$/.exec(endpoint.pathname);
    if (serviceUrl !== `${endpoint.origin}${endpoint.pathname}` || endpoint.protocol !== 'wss:' || endpoint.username || endpoint.password
        || endpoint.port || endpoint.search || endpoint.hash || !hostname?.[1] || !REGIONS.has(hostname[1])
        || !path?.[1] || path[1].length !== 36 || !UUID.test(path[1])) {
        throw configurationError();
    }
    if (clientId !== undefined && (clientId.length !== 36 || !UUID.test(clientId)))
        throw configurationError();
    return Object.freeze({ serviceUrl, ...(clientId === undefined ? {} : { managedIdentityClientId: clientId }) });
}
/** Read deployment-owned configuration only; request data cannot choose Azure targets. */
export function resolveAzureBrowserConfig(env = process.env) {
    return validateConfig(env.PLAYWRIGHT_SERVICE_URL, env.APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID);
}
/**
 * Use Azure's published native Playwright connection contract with an explicit MI.
 * The SDK helper caches bearer tokens/run IDs in process.env; constructing its
 * documented endpoint here keeps those credentials out of the process environment.
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/loadtesting/playwright/src/core/playwrightService.ts
 * https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/loadtesting/playwright/src/common/constants.ts
 */
export function createAzureBrowserConnector(config) {
    const trusted = validateConfig(config.serviceUrl, config.managedIdentityClientId);
    let credential;
    try {
        credential = new ManagedIdentityCredential(trusted.managedIdentityClientId
            ? { clientId: trusted.managedIdentityClientId }
            : {});
    }
    catch {
        throw authenticationError();
    }
    return async () => {
        const controller = new AbortController();
        let timer;
        try {
            const timeout = new Promise((_resolve, reject) => {
                timer = setTimeout(() => {
                    controller.abort();
                    reject(authenticationError());
                }, CONNECT_TIMEOUT_MS);
                timer.unref();
            });
            const access = await Promise.race([
                credential.getToken(TOKEN_SCOPE, { abortSignal: controller.signal }),
                timeout,
            ]);
            if (!access || typeof access.token !== 'string' || access.token.length > 32_768 || access.token.trim() !== access.token
                || !/^[A-Za-z0-9._~+\/-]+=*$/.test(access.token)
                || !Number.isFinite(access.expiresOnTimestamp) || access.expiresOnTimestamp <= Date.now() + 60_000) {
                throw authenticationError();
            }
            const endpoint = new URL(trusted.serviceUrl);
            endpoint.searchParams.set('runId', randomUUID());
            endpoint.searchParams.set('os', 'linux');
            endpoint.searchParams.set('sourceType', 'Others');
            endpoint.searchParams.set('api-version', '2025-09-01');
            return {
                wsEndpoint: endpoint.href,
                headers: { Authorization: `Bearer ${access.token}` },
                timeout: CONNECT_TIMEOUT_MS,
            };
        }
        catch {
            throw authenticationError();
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    };
}
//# sourceMappingURL=azure-browser.js.map