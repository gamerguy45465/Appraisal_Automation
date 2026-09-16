# Azure browser for Appraisal Desk

Hosted mode runs preparation in Windows App Service and opens Chromium in the existing Azure Playwright workspace. `azure` is the default and only supported hosted browser mode. The signed-in website displays the remote browser and accepts human input during sign-in and review. The user completes R3 sign-in, CAPTCHA, review, and final submission. Automatic preparation pauses human input; model tools never gain access to the viewer's keyboard, mouse, or dialog controls.

Windows companion pairing and its backend have been removed. Loopback local development remains available. General Windows App Service startup, workspace access-code authentication, and ZIP packaging are described in [Azure hosting](azure-hosting.md).

## Existing resources

These identifiers and settings came from the resource JSON supplied during implementation; they are not proof that new code or configuration has been deployed.

| Resource | Value |
| --- | --- |
| Tenant | `b64bc999-b7b8-405d-b0db-3565ef9bfd83` |
| Subscription | `e46a42e7-ad6e-4537-8538-b708f26853af` |
| Resource group | `Loan_Pipeline` |
| App Service | `Appraisal-Automation-proto` |
| Website origin | `https://appraisal-automation-proto-h5drbvhhg4dhdeg3.westus3-01.azurewebsites.net` |
| Playwright workspace | `Appraisal-Automation-t` |
| Workspace region | `westus3` |
| Workspace ID | `671794d3-81e7-4fcd-8627-da08041d17fd` |

The workspace resource ID is:

```text
/subscriptions/e46a42e7-ad6e-4537-8538-b708f26853af/resourceGroups/Loan_Pipeline/providers/Microsoft.LoadTestService/playwrightworkspaces/Appraisal-Automation-t
```

The workspace showed local authentication disabled, reporting enabled, and regional affinity enabled. Keep local authentication disabled: this integration uses Microsoft Entra tokens. Regional affinity may place browsers near the caller; the workspace's region alone does not establish where every browser executes. See [workspace authentication](https://learn.microsoft.com/azure/app-testing/playwright-workspaces/how-to-manage-authentication) and [regional affinity](https://learn.microsoft.com/javascript/api/@azure/arm-playwright/playwrightworkspaceproperties?view=azure-node-latest#@azure-arm-playwright-playwrightworkspaceproperties-regionalaffinity).

## App Service identity and settings

1. Enable a system-assigned managed identity on **Appraisal-Automation-proto**. A user-assigned managed identity attached to this app is also supported using its client ID below. The supplied App Service JSON did not include a top-level managed identity; `keyVaultReferenceIdentity: SystemAssigned` alone does not enable one. The workspace's own `identity: None` is separate from the identity of the caller. See [App Service managed identities](https://learn.microsoft.com/azure/app-service/overview-managed-identity).
2. On **Appraisal-Automation-t → Access control (IAM)**, assign **Playwright Workspace Contributor** to the app's managed identity, scoped to this workspace. Workspace Reader cannot run browsers. Role changes can take time to propagate. See [workspace access roles](https://learn.microsoft.com/azure/app-testing/playwright-workspaces/how-to-manage-workspace-access).
3. Keep Windows Node.js 24, one App Service instance, and one iisnode process. Enable **HTTPS Only** and **Always On**. The supplied Basic-plan configuration had Always On disabled; Basic supports it. Without Always On, App Service can unload an idle app after 20 minutes. Always On does not preserve state across a restart or service interruption. See [general settings](https://learn.microsoft.com/azure/app-service/configure-common#configure-general-settings).
4. Set the following deployment-owned App Service environment variables. Retain the existing private workspace access code and dependency-installation settings from the hosting guide.

| Setting | Value |
| --- | --- |
| `APPRAISAL_HOSTING_MODE` | `hosted` |
| `APPRAISAL_BROWSER_MODE` | `azure` (optional; hosted default) |
| `APPRAISAL_PUBLIC_ORIGIN` | `https://appraisal-automation-proto-h5drbvhhg4dhdeg3.westus3-01.azurewebsites.net` |
| `PLAYWRIGHT_SERVICE_URL` | `wss://westus3.api.playwright.microsoft.com/playwrightworkspaces/671794d3-81e7-4fcd-8627-da08041d17fd/browsers` |
| `APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID` | Omit for system-assigned identity; otherwise the attached user-assigned identity's lowercase client GUID |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~24` |
| `NODE_ENV` | `production` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` for ZIP deployment |

The production connector explicitly uses `ManagedIdentityCredential`. It does not fall back to a developer login, a client secret, or a workspace access token. The trusted server acquires the token and passes the connection privately to the isolated preparation worker. Connection details are excluded from model tools and public job status. Do not configure `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` for this integration.

The server uses the published native Playwright endpoint and bearer-header contract, with a unique run ID, `os=linux`, `sourceType=Others`, and `api-version=2025-09-01`. The Azure SDK's convenience helper was not adopted because it caches access tokens and run IDs in the process environment. The connector keeps these values in memory. Review Microsoft's [native connection implementation](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/loadtesting/playwright/src/core/playwrightService.ts) and [protocol constants](https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/loadtesting/playwright/src/common/constants.ts) when upgrading dependencies.

The remote browser connection is an outbound secure WebSocket. The App Service **Web sockets** setting governs inbound hosting and is not the switch for this outbound connection. The human viewer uses authenticated same-origin HTTP requests. Browser network exposure is explicitly empty (`exposeNetwork: ''`); the workspace cannot use this connection to reach App Service loopback or private networks.

## Human browser workflow

The browser image comes from the current remote page, through the owning application session. Human inputs require the same session, exact origin, and CSRF protection. Browser input is disabled while automatic preparation is active, including queued input during a phase change. After preparation, the existing guard permanently revokes model mutations before enabling human review and submission. The viewer supports page selection and JavaScript dialogs; it is not a Windows desktop or a native operating-system dialog viewer.

R3 login input passes through App Service to the remote browser in Azure. Credentials are not supplied to the model. PDFs, provider credentials, job state, and browser access remain memory-based; required documents and preparation observations are still sent to the selected AI provider under that provider's policies. The viewer does not persist screenshots or input history. The workspace's **reporting enabled** property does not mean this standalone application automatically uploads test reports, videos, or traces. This integration configures no test reporter or recording. Azure and provider service policies still apply. See [reporting configuration](https://learn.microsoft.com/azure/app-testing/playwright-workspaces/quickstart-advanced-diagnostic-with-playwright-workspaces-reporting).

Keep the website and cloud browser available until review is complete. Browser closure, session expiry, App Service restart, or connection loss can end the in-memory session and lose unsaved work. A new job must not silently submit or recreate a previous order. Verify R3 acceptance directly before starting another order. Use the explicit next-order action to reuse a still-open authenticated browser; the previous form is replaced only after the new documents pass validation.

## Synthetic live capability check

The developer-only helper creates one short-lived browser and tests native connection, intercepted synthetic HTTP/WebSocket traffic, CDP Fetch command availability, screenshots, and keyboard/mouse input. All page requests are fulfilled or aborted locally, with only synthetic content at `example.test`. It does not open R3, use documents or an AI provider, save screenshots, configure Azure resources, or submit an order. Creating the session uses normal workspace browser capacity and billing.

From the project folder after installing dependencies:

```powershell
$env:PLAYWRIGHT_SERVICE_URL = 'wss://westus3.api.playwright.microsoft.com/playwrightworkspaces/671794d3-81e7-4fcd-8627-da08041d17fd/browsers'
$env:APPRAISAL_AZURE_SMOKE_TENANT_ID = 'b64bc999-b7b8-405d-b0db-3565ef9bfd83'
npx tsx scripts/azure-browser-smoke.ts --live --auth device
```

Complete only the device-code sign-in requested by this local command. The helper uses an explicit `DeviceCodeCredential` and does not save a token cache or write tokens into environment variables. By default, the SDK uses its development sign-in application. If tenant policy requires an approved public client, set `APPRAISAL_AZURE_SMOKE_CLIENT_ID` to that application's lowercase GUID. It must permit the device-code flow and Azure Service Management delegated access. The signed-in developer also needs permission to run browsers in the workspace. See [DeviceCodeCredential options](https://learn.microsoft.com/javascript/api/@azure/identity/devicecodecredentialoptions?view=azure-node-latest).

Run with diagnostic logging disabled: the helper rejects `DEBUG`, `AZURE_LOG_LEVEL`, `PWDEBUG`, and `NODE_DEBUG`. Output consists of the Microsoft verification URL/device code followed by fixed capability booleans and, on failure, a stage and sanitized error identifiers/status. No tokens, connection headers, raw errors, page contents, or screenshots are printed. Authentication is limited to five minutes, connection to 30 seconds, and probing to one minute; the browser closes in `finally`. A hard process deadline bounds an unresponsive transport.

All booleans must be `true` for exit code 0. An early failure leaves subsequent checks `false`; for example, authentication succeeding while native connection fails can indicate workspace permission, connectivity, or Playwright-version compatibility problems. The helper deliberately omits raw transport errors. `cdpFetchCommands=true` proves those commands were accepted, not that the full redirect guard passed. A developer smoke pass does not prove the App Service managed identity or production network is configured.

On September 16, 2026, this helper completed successfully against **Appraisal-Automation-t** with developer device-code authentication and Playwright 1.63. All ten booleans were true, including browser closure. This is live evidence for the synthetic capabilities listed above; no R3 page, loan data, or AI provider was involved.

Before production acceptance, run the project's local checks, the synthetic live probe, and an owner-authenticated test of the deployed viewer. Confirm manual sign-in/CAPTCHA, human input locked during preparation, guarded HTTP/WebSocket/redirect behavior, review handoff, disconnect behavior, and sequential-order ownership. Real R3 and paid-provider acceptance are separate checks; local fixtures do not establish those results. This guide does not claim that Azure configuration, deployment, or production acceptance has already occurred.

## Migrate an existing hosted deployment

Hosted mode defaults to `azure` when `APPRAISAL_BROWSER_MODE` is absent. Remove an old `APPRAISAL_BROWSER_MODE=companion` setting or change it to `azure` before deploying this build; the retired value is rejected at startup. Configure the workspace endpoint and managed identity even when the browser-mode setting is omitted. There is no companion fallback if the Azure connection fails. Local development defaults to `local`, which cannot be combined with hosted configuration. Deployment or settings changes restart the application, so finish or deliberately abandon any active cloud review first.
