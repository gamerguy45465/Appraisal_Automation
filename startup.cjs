'use strict';

// Only fixed messages may reach the startup log; errors can contain credentials or paths.
const configurationAdvice = new Map([
  ['APPRAISAL_HOSTING_MODE must be local or hosted.', 'APPRAISAL_HOSTING_MODE must be local or hosted.'],
  ['Local hosting cannot be selected inside Azure App Service or with APPRAISAL_PUBLIC_ORIGIN configured.', 'Set APPRAISAL_HOSTING_MODE to hosted when running in Azure App Service.'],
  ['Hosted mode requires APPRAISAL_PUBLIC_ORIGIN to identify the exact public HTTPS address.', 'Set APPRAISAL_PUBLIC_ORIGIN to the exact public HTTPS origin, without a trailing slash.'],
  ['APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin with a DNS hostname, no trailing slash, path, query, fragment, credentials, or wildcard.', 'APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin with a DNS hostname, no trailing slash, path, query, fragment, credentials, or wildcard.'],
  ['PORT must be an integer from 1024 to 65535, or a local Windows named pipe in hosted mode.', 'PORT must be an integer from 1024 to 65535, or a local Windows named pipe in hosted mode. Let iisnode supply PORT in Azure.'],
  ['Hosted mode requires APPRAISAL_ACCESS_KEY with 32 to 256 non-space ASCII characters.', 'Set APPRAISAL_ACCESS_KEY to a random workspace sign-in code with 32 to 256 non-space ASCII characters.'],
  ['APPRAISAL_BROWSER_MODE must be local or azure.', 'Set APPRAISAL_BROWSER_MODE to azure for the hosted website or local for loopback development.'],
  ['Azure browsers require hosted mode; local browsers require local mode.', 'Use APPRAISAL_HOSTING_MODE=hosted with the Azure browser.'],
]);

const moduleAdvice = new Map([
  ['AZURE_BROWSER_CONFIG', 'Set PLAYWRIGHT_SERVICE_URL to the workspace wss browser endpoint. Check APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID if configured.'],
  ['AZURE_BROWSER_AUTH', 'Check the App Service managed identity and its access to the Playwright workspace.'],
  ['ERR_MODULE_NOT_FOUND', 'A required application file or dependency is missing. Rebuild the application and deploy dist together with its production dependencies.'],
  ['MODULE_NOT_FOUND', 'A required application file or dependency is missing. Rebuild the application and deploy dist together with its production dependencies.'],
  ['ERR_DLOPEN_FAILED', 'A native dependency could not load. Install production dependencies for the App Service operating system, processor architecture and Node.js runtime.'],
  ['ERR_PACKAGE_PATH_NOT_EXPORTED', 'A dependency could not load. Restore the locked production dependencies and rebuild the application.'],
  ['ERR_UNKNOWN_FILE_EXTENSION', 'An application module could not load. Deploy the compiled dist files and use startup.cjs as the entry point.'],
]);

function startupFailed(advice) {
  console.error(`Appraisal Desk could not start. ${advice}`);
  process.exitCode = 1;
}

// iisnode requires this CommonJS adapter; do not guard it with require.main.
if (Number.parseInt(process.versions.node, 10) < 24) {
  startupFailed('Node.js 24 or newer is required. Configure the App Service Node.js runtime, then restart the application.');
} else {
  import('./dist/server.js').catch(error => {
    let advice;
    try {
      if (error instanceof Error) {
        // Do not invoke error accessors; third-party failures may define throwing getters.
        const message = Object.getOwnPropertyDescriptor(error, 'message')?.value;
        const code = Object.getOwnPropertyDescriptor(error, 'code')?.value;
        advice = configurationAdvice.get(message) || moduleAdvice.get(code);
      }
    } catch {
      // Even an unusual thrown proxy must use the same fixed fallback.
    }
    startupFailed(advice || 'Check the build, Node.js runtime, PORT, APPRAISAL_PUBLIC_ORIGIN and APPRAISAL_ACCESS_KEY settings.');
  });
}
