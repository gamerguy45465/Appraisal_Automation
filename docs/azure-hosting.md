# Azure hosting

Appraisal Desk runs on **Windows Azure App Service** with a choice of two browser modes. Hosted mode defaults to a Windows companion: extraction and the visible R3 browser run on your PC, and the relay delivers validated jobs and progress without browser-control APIs. The optional `azure` mode runs extraction in App Service and Chromium in Azure Playwright Workspaces, with an authenticated browser viewer on the website. Sign-in, CAPTCHA, review and final submission remain manual in both modes.

Follow [Azure browser setup](azure-browser.md) for workspace permissions, managed identity, browser endpoint configuration, viewer behavior, and the separate live capability check. The companion instructions below apply when `APPRAISAL_BROWSER_MODE` is absent or set to `companion`.

## Azure configuration

Use Windows App Service with Node.js 24 and **one instance**. Keep one iisnode process per application (already set in `web.config`), disable automatic scale-out, enable **HTTPS Only** and **Always On**, and use one canonical website address. Sessions, jobs and browser ownership are process-local; companion pairing credentials and pending relay payloads also live in memory. Multiple instances are unsupported. Set these App Service environment variables:

| Setting | Value |
| --- | --- |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~24` |
| `NODE_ENV` | `production` |
| `APPRAISAL_HOSTING_MODE` | `hosted` |
| `APPRAISAL_BROWSER_MODE` | `companion` (default), or `azure` with the [additional workspace settings](azure-browser.md#app-service-identity-and-settings) |
| `APPRAISAL_PUBLIC_ORIGIN` | Your exact address, e.g. `https://your-app.azurewebsites.net`, with no trailing slash |
| `APPRAISAL_ACCESS_KEY` | A random workspace access code, 32–256 non-space ASCII characters |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` for the ZIP deployment below |

Do not set `PORT` manually: iisnode supplies its Windows named-pipe address. Startup accepts that address unchanged. Hosted numeric listeners are also supported; ordinary local startup still binds only `127.0.0.1`.

The workspace access code protects this single-user website and is separate from all provider API keys and R3 credentials. Generate one on your own computer and save it in a password manager. For example, run this yourself in PowerShell, then copy its output into Azure's `APPRAISAL_ACCESS_KEY` setting:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The application provides its own workspace sign-in. In companion mode, if you separately enable App Service Authentication/Easy Auth, its authentication must also permit the companion endpoints `/api/companion/connect` and `/api/companion/exchange`; these endpoints require their own high-entropy bearer tokens. Otherwise Easy Auth will reject the companion before its token reaches this application. Azure browser mode uses the signed-in website session and does not require companion pairing. Do not put the workspace access code in source files, deployment ZIPs or provider-key fields.

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
  dist/companion.js
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

## Connect your Windows PC

This section applies to companion mode. In Azure browser mode, start the order on the website and choose **Open R3 browser** for manual sign-in and review; see the [cloud browser workflow](azure-browser.md#human-browser-workflow).

1. Open the deployed HTTPS website and enter the workspace access code.
2. Choose **Pair Windows companion** to generate a one-time pairing code.
3. On your PC, install project dependencies, build, and install Chromium once:

   ```powershell
   npm ci
   npm run build
   npm run browsers:install
   ```

4. Start the companion from an interactive Windows terminal:

   ```powershell
   npm run companion
   ```

5. Enter the website's HTTPS address and paste the one-time pairing code into the hidden prompt. The code expires after ten minutes and can be used once. The companion connects outward over HTTPS; no inbound port, local browser extension, CORS bypass or router change is needed.
6. Keep that terminal running. Once the website reports the companion connected, enter the order details, selected provider key and PDFs as usual. R3 opens on **your PC**. Sign in there, then review and submit there after preparation hands control back to you.

The companion is bound to the browser session that paired it. Use that same browser session for uploads and refreshes. New orders reuse the local R3 window only after the existing job's cleanup has finished and you explicitly choose another order. Starting a successor can replace the old review form after new-document validation, so finish the previous order first.

## Connection loss, stopping and data lifetime

The following behaviors describe companion mode. In Azure browser mode, PDFs and the selected provider key are processed in App Service, and human R3 input, including login credentials, passes through App Service to the remote browser. That input is not exposed to model tools or stored as viewer history. Closing the viewer tab leaves the browser running; **Close cloud browser** ends it. Session expiry, App Service restart or browser connection loss can lose unsaved cloud work. Always On reduces idle unloading but does not make sessions durable. See [Azure browser data handling and lifetime](azure-browser.md#human-browser-workflow).

- A brief internet interruption does not restart the local preparation or close R3. The companion retries with the same job identity, and the website blocks new work while the companion is offline.
- PDFs and provider keys transit Azure memory before reaching the companion. The relay removes its payload when the companion acknowledges accepting it, or after five minutes waiting for acknowledgment. Delivered-but-unconfirmed work remains locked instead of being reassigned, because it may already be running locally. JavaScript strings, network buffers and OS memory cannot be guaranteed securely erased.
- Pairing/bearer credentials are memory-only. The server keeps their hashes; the companion retains the bearer in its own memory. They are not exposed to the model, preparation-worker environment, URL query strings or files. R3 credentials and browser authentication stay in the local R3 browser.
- Workspace sessions and companion connections expire after 24 hours. Restarting/redeploying Azure loses its in-memory session and relay state. If this happens during an order, finish in the existing local R3 window, close it, restart the companion, sign into the website again and pair with a new code. Do not resend the old order just because its website status disappeared.
- Pressing Ctrl+C requests a graceful companion stop: it stops taking new jobs and waits for you to finish and close R3. Keep the terminal open until it exits. Force-closing the terminal, killing processes, logging off or shutting down Windows is not a graceful stop.
- The app remains single-user. Review warning text and job status return through the relay to the owning website session. Existing provider retention terms apply; this feature does not promise zero retention by Azure, the OS, Chromium, R3 or AI providers.

## Verification

The September 15 Azure troubleshooting follow-up confirmed that the deployed site reaches its workspace sign-in page when opened using the full HTTPS address. A local browser regression reproduced rejection of an external link before the navigation fix and passed afterward, while an external link to the session API remained rejected. Validation for the follow-up changes passed 64 API/unit tests, 21 startup tests, two browser navigation tests, TypeScript checking and the production build. The navigation/logging updates require a subsequent GitHub deployment; workspace sign-in, companion pairing and order preparation have not been verified live in this follow-up.

September 15, 2026 local verification passed **459 unit/integration tests**, **129 browser tests**, TypeScript checking and the production build (**588 tests total**). A separate compiled-startup smoke check launched `startup.cjs` on a real Windows named pipe, verified anonymous rejection, workspace sign-in and a secure authenticated session, then closed only that helper process. Desktop/mobile hosted setup screens were visually inspected with synthetic fixtures. The generated 60-file deployment ZIP passed its application-file allowlist check. No Azure deployment, paid model call or live R3 preparation was performed for this change.

Run `npm run check` for TypeScript, unit/integration tests, browser fixtures and the production build. The hosting tests cover exact origins, startup configuration, secure sessions, pairing, job delivery, retry deduplication, delayed acknowledgments and shutdown behavior using synthetic data. Azure browser regressions additionally cover owner-scoped input, phase locking, native dialogs, popup selection, stale requests and viewer expiry. These tests do not establish live Azure, paid-provider or R3 acceptance. After publishing, verify website sign-in and either companion pairing or the [Azure browser acceptance sequence](azure-browser.md#synthetic-live-capability-check), then run an explicitly authorized appraisal acceptance check with manual R3 sign-in and submission review.

The existing local mode is still available: leave the hosted settings unset and run `npm start` or `npm run dev`.
