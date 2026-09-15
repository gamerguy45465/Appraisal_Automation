# Azure website with a Windows companion

Appraisal Desk can host its website on **Windows Azure App Service** while its Windows companion runs extraction and the visible R3 browser on your PC. Sign-in, CAPTCHA, review and final R3 submission remain manual in that local browser. The cloud relay can deliver validated appraisal jobs and receive progress; it has no browser-click, login or submission API.

## Azure configuration

Use Windows App Service with Node.js 24 and **one instance**. Keep one iisnode process per application (already set in `web.config`), disable automatic scale-out, enable **HTTPS Only** and **Always On**, and use one canonical website address. Sessions, pairing credentials and pending jobs are held in one process's memory, so multiple instances are unsupported. Set these App Service environment variables:

| Setting | Value |
| --- | --- |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~24` |
| `NODE_ENV` | `production` |
| `APPRAISAL_HOSTING_MODE` | `hosted` |
| `APPRAISAL_PUBLIC_ORIGIN` | Your exact address, e.g. `https://your-app.azurewebsites.net`, with no trailing slash |
| `APPRAISAL_ACCESS_KEY` | A random workspace access code, 32–256 non-space ASCII characters |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` for the ZIP deployment below |

Do not set `PORT` manually: iisnode supplies its Windows named-pipe address. Startup accepts that address unchanged. Hosted numeric listeners are also supported; ordinary local startup still binds only `127.0.0.1`.

The workspace access code protects this single-user website and is separate from all provider API keys and R3 credentials. Generate one on your own computer and save it in a password manager. For example, run this yourself in PowerShell, then copy its output into Azure's `APPRAISAL_ACCESS_KEY` setting:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The application provides its own workspace sign-in. If you separately enable App Service Authentication/Easy Auth, its authentication must also permit the companion endpoints `/api/companion/connect` and `/api/companion/exchange`; these endpoints require their own high-entropy bearer tokens. Otherwise Easy Auth will reject the companion before its token reaches this application. Do not put the workspace access code in source files, deployment ZIPs or provider-key fields.

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

## Connect your Windows PC

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

- A brief internet interruption does not restart the local preparation or close R3. The companion retries with the same job identity, and the website blocks new work while the companion is offline.
- PDFs and provider keys transit Azure memory before reaching the companion. The relay removes its payload when the companion acknowledges accepting it, or after five minutes waiting for acknowledgment. Delivered-but-unconfirmed work remains locked instead of being reassigned, because it may already be running locally. JavaScript strings, network buffers and OS memory cannot be guaranteed securely erased.
- Pairing/bearer credentials are memory-only. The server keeps their hashes; the companion retains the bearer in its own memory. They are not exposed to the model, preparation-worker environment, URL query strings or files. R3 credentials and browser authentication stay in the local R3 browser.
- Workspace sessions and companion connections expire after 24 hours. Restarting/redeploying Azure loses its in-memory session and relay state. If this happens during an order, finish in the existing local R3 window, close it, restart the companion, sign into the website again and pair with a new code. Do not resend the old order just because its website status disappeared.
- Pressing Ctrl+C requests a graceful companion stop: it stops taking new jobs and waits for you to finish and close R3. Keep the terminal open until it exits. Force-closing the terminal, killing processes, logging off or shutting down Windows is not a graceful stop.
- The app remains single-user. Review warning text and job status return through the relay to the owning website session. Existing provider retention terms apply; this feature does not promise zero retention by Azure, the OS, Chromium, R3 or AI providers.

## Verification

September 15, 2026 local verification passed **459 unit/integration tests**, **129 browser tests**, TypeScript checking and the production build (**588 tests total**). A separate compiled-startup smoke check launched `startup.cjs` on a real Windows named pipe, verified anonymous rejection, workspace sign-in and a secure authenticated session, then closed only that helper process. Desktop/mobile hosted setup screens were visually inspected with synthetic fixtures. The generated 60-file deployment ZIP passed its application-file allowlist check. No Azure deployment, paid model call or live R3 preparation was performed for this change.

Run `npm run check` for TypeScript, unit/integration tests, browser fixtures and the production build. The hosting tests cover exact origins, startup configuration, secure sessions, pairing, job delivery, retry deduplication, delayed acknowledgments and shutdown behavior using synthetic data. These tests do not establish live Azure, paid-provider or R3 acceptance. After publishing, verify website sign-in and companion pairing, then run an explicitly authorized appraisal acceptance check with manual R3 sign-in and submission review.

The existing local mode is still available: leave the hosted settings unset and run `npm start` or `npm run dev`.
