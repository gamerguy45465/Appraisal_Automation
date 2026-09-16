# Azure hosting

Appraisal Desk runs on **Windows Azure App Service** with Chromium in **Azure Playwright Workspaces**. Extraction runs in App Service, and an authenticated browser viewer on the website provides manual sign-in, CAPTCHA, review and final submission. Azure is the default and only supported hosted browser mode; Windows companion pairing and its backend have been removed.

Follow [Azure browser setup](azure-browser.md) for workspace permissions, managed identity, browser endpoint configuration, viewer behavior, and the separate live capability check. Before deploying this build, remove an old `APPRAISAL_BROWSER_MODE=companion` setting or change it to `azure`. The retired value is rejected at startup. Configure the workspace endpoint and managed identity before starting the hosted application.

## Azure configuration

Use Windows App Service with Node.js 24 and **one instance**. Keep one iisnode process per application (already set in `web.config`), disable automatic scale-out, enable **HTTPS Only** and **Always On**, and use one canonical website address. Sessions, jobs and browser ownership are process-local and live in memory. Multiple instances are unsupported. Set these App Service environment variables:

| Setting | Value |
| --- | --- |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~24` |
| `NODE_ENV` | `production` |
| `APPRAISAL_HOSTING_MODE` | `hosted` |
| `APPRAISAL_BROWSER_MODE` | `azure` (optional; hosted default) |
| `PLAYWRIGHT_SERVICE_URL` | Your workspace's canonical secure browser endpoint; see [workspace settings](azure-browser.md#app-service-identity-and-settings) |
| `APPRAISAL_AZURE_MANAGED_IDENTITY_CLIENT_ID` | Omit for system-assigned identity; otherwise the attached user-assigned identity's lowercase client GUID |
| `APPRAISAL_PUBLIC_ORIGIN` | Your exact address, e.g. `https://your-app.azurewebsites.net`, with no trailing slash |
| `APPRAISAL_ACCESS_KEY` | A random workspace access code, 32–256 non-space ASCII characters |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` for the ZIP deployment below |

Do not set `PORT` manually: iisnode supplies its Windows named-pipe address. Startup accepts that address unchanged. Hosted numeric listeners are also supported; ordinary local startup still binds only `127.0.0.1`.

The workspace access code protects this single-user website and is separate from all provider API keys and R3 credentials. Generate one on your own computer and save it in a password manager. For example, run this yourself in PowerShell, then copy its output into Azure's `APPRAISAL_ACCESS_KEY` setting:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The application provides its own workspace sign-in. The same authenticated website session protects cloud browser access. Keep the workspace access code configured; managed identity authenticates App Service to the Playwright workspace and does not replace website sign-in. Do not put the workspace access code in source files, deployment ZIPs or provider-key fields.

Open and bookmark the full **HTTPS** website address. Hosted mode permits an ordinary top-level browser GET navigation to `/` or `/index.html` from another site, so a portal link can open the public sign-in page. That exception requires browser navigation/document metadata; it does not permit cross-site API requests, form submissions, frames, or an unapproved Host or explicit Origin. Earlier deployments rejected external sign-in-page links with `ORIGIN_REJECTED`; entering the complete HTTPS address in a fresh tab works around that older behavior.

Azure Node version selection and Windows dependency installation follow [App Service's Node.js configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs?pivots=platform-windows). Enable ZIP build automation as described in [Deploy files to App Service](https://learn.microsoft.com/en-us/azure/app-service/deploy-zip#enable-build-automation-for-zip-deploy). This application does not use a Linux `web.config` workflow.

## Build and publish the website

From the project folder on your Windows PC:

```powershell
npm ci
npm run check
npm run azure:package
```

The ZIP is created under `output/deployment/`. It contains the compiled application, frontend, package manifests, `web.config`, `startup.cjs` and the fixed environment script. It excludes example/customer PDFs, output logs, `.env` files and local `node_modules`.

Deploy that ZIP through App Service ZIP deployment with build automation enabled. Azure installs production dependencies from the included package manifest. If using plain FTP/manual file copying instead, you must install the production dependencies in `site/wwwroot` with `npm ci --omit=dev`. Do not use a deployment option that skips dependency installation for this ZIP. The compiled `dist` files are already included; the Azure site does not need to run TypeScript or install Chromium.

The deployed root layout is:

```text
site/wwwroot/
  web.config
  startup.cjs
  package.json
  package-lock.json
  dist/server.js
  dist/...
  public/...
  scripts/environment.ps1
  node_modules/...       (installed by Azure)
```

IIS targets `startup.cjs`, a small CommonJS adapter that imports the actual entry point `dist/server.js`. This accommodates iisnode's loader while preserving the project's ES modules. All URLs pass through Express, which serves only `public` and its defined API routes. IIS permits 32 MiB requests so the two 15 MiB PDF uploads fit with multipart overhead. Debugging and detailed public startup errors are disabled.

## GitHub deployment and startup errors

The GitHub Actions workflow builds and deploys the website. Configure the App Service settings above separately in Azure; the Node version selected by `actions/setup-node` applies to the build runner. A successful GitHub deployment does not establish that the application has started.

If the website returns HTTP 500 or 503 after settings are applied, check the app's **Overview** status and **Diagnose and solve problems**. A 503 can occur while the application recycles, or because it cannot serve requests. The status code alone does not identify the cause.

To collect the startup error:

1. Open **Monitoring → App Service logs** in the App Service's left menu. Enable **Application logging (Filesystem)**, select **Information**, and save. This temporary logging setting switches itself off after 12 hours.
2. Open **Monitoring → Log stream**, restart the app once, and request the website again. Retain the first startup error; omit access codes, tokens, provider keys and document data when sharing logs.
3. If the stream remains empty, open **Development Tools → Advanced Tools → Go**, then Kudu's **Debug console → PowerShell**. Inspect the newest `stderr` log under `LogFiles/iisnode`. Also check `LogFiles/Application` and `LogFiles/eventlog.xml` for startup errors. Earlier deployments wrote iisnode logs under `site/wwwroot/iisnode`; check that folder if the logging update has not been deployed yet.

Keep `devErrorsEnabled` disabled: diagnosis belongs in private logs. The startup adapter reports recognized configuration and module-loading problems with fixed messages; unknown exceptions remain private and their raw contents are not printed. Check a deployed `iisnode.yml` for a stale Node executable override if the observed runtime differs from `WEBSITE_NODE_DEFAULT_VERSION`; the file is optional. The iisnode log directory is `..\..\LogFiles\iisnode`, relative to `HOME\site\wwwroot`, so logs are writable even when `WEBSITE_RUN_FROM_PACKAGE=1` makes the deployment directory read-only. Log stream can read logs in this location.

See Microsoft's [application logging instructions](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs), [503 troubleshooting](https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-http-502-http-503), and [Windows Node.js troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/azure/app-service/app-service-web-nodejs-best-practices-troubleshoot-guide).

## Preparation fails while setting the job environment

`Windows could not store the environment settings.` means the fixed `scripts/environment.ps1` helper exited unsuccessfully. Environment initialization runs before the selected AI provider or Azure browser connection, so this message alone does not indicate a provider-key or workspace-permission problem.

The September 16 hosted failure was traced with a synthetic Kudu request to `Console.InputEncoding`: setting the encoding threw `The handle is invalid.` App Service supplies redirected pipes without guaranteeing an attached console. The helper now uses explicit UTF-8 readers/writers over `Console.OpenStandardInput`, `Console.OpenStandardOutput` and `Console.OpenStandardError`, avoiding console code-page changes. Stream setup is inside the guarded operation and failures produce only a fixed private error.

Deploy the updated `scripts/environment.ps1` with the application. Submitted values remain literal JSON on stdin, only the five approved variable names are accepted, and Process scope keeps values out of User/Machine environment storage. Raw helper output from a real preparation can contain private values and must not be exposed in application logs or status messages. The helper's generic nonzero-exit error can also represent other failures; use synthetic values when diagnosing a recurrence.

### GitHub build stops before deployment

For commit `26efda79`, [GitHub Actions run 35148475419](https://github.com/gamerguy45465/Appraisal_Automation/actions/runs/35148475419) installed dependencies and compiled successfully, but its first real PowerShell test failed after 10,063 milliseconds. The other 528 tests, including the consoleless helper regression, passed. Artifact upload and Azure deployment were skipped, so that run did not deliver the console-handle fix to App Service.

The timing closely matches the former 10-second child-process limit and strongly suggests a cold Windows PowerShell startup timeout. Each production helper now has a finite 30-second limit, and the Windows integration tests allow enough total time for startup and their subsequent operations. A real helper delayed by 11 seconds verifies success beyond the old deadline; terminated helpers still fail without accepting their output, and cleanup waits for their closure. Do not bypass failing tests or change Azure credentials to repair this build failure. Push the corrected source so the normal workflow can build, test, and deploy it.

## Open the cloud browser

Use the signed-in website for the full workflow; see the [cloud browser workflow](azure-browser.md#human-browser-workflow).

1. Open the deployed HTTPS website and enter the workspace access code.
2. Enter the order details, selected provider key and PDFs, then start preparation.
3. Choose **Open R3 browser** when it becomes available. Sign into R3 and complete any CAPTCHA in that viewer. Human input pauses while preparation fills the order.
4. When preparation hands control back to you, review every field and submit manually in the same cloud browser.

Browser access belongs to the website session that created the order. Use that same session for uploads and refreshes. New orders reuse the cloud browser only after the existing job's cleanup has finished and you explicitly choose another order. Starting a successor can replace the old review form after new-document validation, so finish the previous order first.

## Connection loss, stopping and data lifetime

PDFs and the selected provider key are processed in App Service, and human R3 input, including login credentials, passes through App Service to the remote browser. That input is not exposed to model tools or stored as viewer history. Closing the viewer tab leaves the browser running; **Close cloud browser** ends it. See [Azure browser data handling and lifetime](azure-browser.md#human-browser-workflow).

- Workspace sessions expire after 24 hours, and cloud browser workers have a 24-hour maximum lifetime. Finish the order and explicitly close the cloud browser when done.
- Session expiry, App Service restart or browser connection loss can lose unsaved cloud work. Always On reduces idle unloading but does not make sessions durable. A replacement application deployment also loses in-memory sessions and ownership.
- If the viewer disconnects, reconnect through the owning website session and check whether its browser is still available. Input with an uncertain result is not automatically retried. Confirm R3 acceptance before repeating an order or submission.
- PDFs, provider credentials, job state and browser access remain memory-based. JavaScript strings, network buffers and OS memory cannot be guaranteed securely erased. Provider retention terms apply; the feature does not promise zero retention by Azure, the OS, Chromium, R3 or AI providers.

## Verification

The deployment-timeout correction passed TypeScript checking, all 531 unit/integration tests, and the production build locally. This includes the delayed real helper and terminated-helper draining checks. These results do not establish a successful new GitHub run or live Azure deployment.

The September 16 console-handle fix passed TypeScript checking, 529 unit/integration tests, 148 browser tests and the production build. Its final environment regression explicitly detaches a synthetic helper from the console, confirms the old encoding setter fails with `ERROR_INVALID_HANDLE`, and verifies the corrected helper in that same context, including private getters, Unicode/metacharacters and cleanup. The final 11-test environment suite also passed separately. The user's synthetic Kudu diagnostic established the original Azure failure; deployment of this correction and live provider/R3 acceptance remain separate.

The September 16 companion removal passed `npm run check`: 528 unit/integration tests, 148 browser tests, TypeScript and the production build. Compiled startup on a Windows named pipe also verified the default Azure mode, missing pairing controls and anonymous-session rejection. The live site's public configuration still reported `companion` during inspection; the Azure-only build requires deployment and the configuration above before production acceptance.

The September 15 Azure troubleshooting follow-up confirmed that the deployed site reaches its workspace sign-in page when opened using the full HTTPS address. A local browser regression reproduced rejection of an external link before the navigation fix and passed afterward, while an external link to the session API remained rejected. Validation for that follow-up passed 64 API/unit tests, 21 startup tests, two browser navigation tests, TypeScript checking and the production build. This historical result does not establish that the current Azure-only build has been deployed.

September 15, 2026 local verification passed **459 unit/integration tests**, **129 browser tests**, TypeScript checking and the production build (**588 tests total**). A separate compiled-startup smoke check launched `startup.cjs` on a real Windows named pipe, verified anonymous rejection, workspace sign-in and a secure authenticated session, then closed only that helper process. Desktop/mobile hosted setup screens were visually inspected with synthetic fixtures. The generated 60-file deployment ZIP passed its application-file allowlist check. No Azure deployment, paid model call or live R3 preparation was performed for this change.

Run `npm run check` for TypeScript, unit/integration tests, browser fixtures and the production build. The hosting tests cover exact origins, startup configuration, secure sessions and rejection of the retired companion mode using synthetic data. Azure browser regressions cover owner-scoped input, phase locking, native dialogs, popup selection, stale requests and viewer expiry. These tests do not establish live Azure, paid-provider or R3 acceptance. After publishing, verify website sign-in and the [Azure browser acceptance sequence](azure-browser.md#synthetic-live-capability-check), then run an explicitly authorized appraisal acceptance check with manual R3 sign-in and submission review.

Loopback local development is still available: leave the hosted settings unset and run `npm start` or `npm run dev`.
