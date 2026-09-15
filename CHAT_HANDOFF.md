# Appraisal Automation — chat handoff

Prepared September 9, 2026; latest sequential-order update September 14, 2026. This document summarizes the working context and verified results from previous chats. It is not the complete conversation or a copy of the application. Check current files and runtime state before continuing; the user's next request determines the next task.

## Project and purpose

- Workspace: `C:\Users\jorda\OneDrive\Documents\Appraisal_Automation`
- Platform: Windows, PowerShell, Node.js 24 or newer, npm.
- Application: Appraisal Desk, a local application that extracts facts from a URLA PDF and optional sales contract, then prepares an R3 AMC appraisal order in a visible Playwright Chromium window.
- The user reviews and submits the actual appraisal order. The application never automatically submits it.
- Stack: TypeScript, Express, HTML/CSS/JavaScript frontend, LangChain JavaScript, OpenAI Responses, Anthropic Messages, Google Gemini Generate Content, xAI Chat Completions, Zod, Playwright.
- Provider defaults: initial selection OpenAI with **`gpt-5.6-sol`**; Anthropic with **`claude-opus-5`**; Google Gemini with **`gemini-3.8-flash`**; SpaceXAI (Grok) with **`grok-4.6`**. Blank model text uses the selected provider's default. Custom IDs are supported without a model-prefix requirement or allowlist; never silently switch provider or model. The user's four-provider request supersedes earlier provider restrictions.
- No Git repository or remote was present during development. Do not assume changes were committed or pushed.

## User requests and completed work

1. Developed the application from the user's original specification, with the local frontend, PDF extraction, loan rules, browser form preparation, and human submission handoff.
2. Stopped the application when requested.
3. Changed only the application model setting to GPT-5.6 Sol when requested.
4. Replaced automated R3 credential entry with manual login because of CAPTCHA problems. The user explicitly wanted R3 username/password inputs removed and all other behavior retained.
5. Diagnosed and fixed a subsequent `ERR_BLOCKED_BY_CLIENT` error after manual login. The cause was our application's request guard, confirmed by a live user-assisted reproduction. Details follow.
6. Addressed the user's report of missing Loan Program/Property Type selections and the browser closing after preparation ran for a while. Preparation now begins with a deterministic approved-plan fill; interrupted or incomplete work is handed to the user in the open browser. TypeScript checking, 101 local tests, and the production build passed; no paid-model or live order-preparation acceptance run was performed for this fix.
7. Addressed empty access contact fields and the requested separate Listing Agent and Buyer's Agent sections. Refinance access now explicitly receives the borrower's values, purchase access uses the listing agent, and both agent roles are extracted separately. TypeScript checking, 140 local tests, and the production build passed; no live or paid acceptance run was performed.
8. Clarified that listing agent means seller's agent and updated the fictional purchase contract with explicit agents. The active sample matches the validated 10-page/145-interactive-field output; TypeScript checking, 141 local tests, and the production build passed.
9. Confirmed the active sample's $485,000.00 sale price on pages 1 and 9, then clarified extraction/preparation instructions to retain explicit prices from unsigned/draft/sample contracts with a review warning. The PDF was unchanged for this fix; TypeScript checking, 152 local tests, and the production build passed.
10. Added OpenAI/Anthropic selection, a visible custom model textbox, provider-specific document/message adapters and sanitized errors. TypeScript checking, 192 local tests, and the production build passed; no live-provider or live R3 acceptance was performed. Restart the local application and refresh its page after updating.
11. Investigated a generic Anthropic 400/422 failure and corrected an independently confirmed outbound-schema limit violation, with more specific sanitized errors. The exact reported rejection reason is unconfirmed because its raw error was not retained. TypeScript checking, 220 local tests, and the production build passed; live-provider and live R3 acceptance remain unverified.
12. Added the user's fixed loan-officer details as four required approved-plan values for every order. TypeScript checking, 224 local tests, and the production build passed; no live-provider or live R3 acceptance was performed.
13. Added scoped recovery for a loan-officer Work Phone that does not retain the approved value after filling and blur. TypeScript checking, 229 local tests, and the production build passed. The exact live cause and live R3 acceptance remain unverified.
14. Expanded that recovery to all existing mapped phone fields using each field's own approved number, preserving blank values and existing plans/mappings. TypeScript checking, 236 local tests, and the production build passed; live R3 masks and acceptance remain unverified.
15. Added a bounded appraisal-product recommendation path after reviewing the new Whitmore sample PDFs, while preserving independently extracted Property Type and Occupancy. Product label matching accepts only finite optional-dash variants. TypeScript checking, 257 local tests, and the production build passed; no live-provider or live R3 acceptance was performed.
16. Added Google Gemini selection with default `gemini-3.8-flash`, an API-key-only pinned transport, native inline PDFs, structured extraction, and sanitized errors. TypeScript checking, 315 local tests, and the production build passed; no live Google or R3 acceptance was performed.

The user prefers narrowly scoped changes and explicitly said to leave everything else the same during the model and login changes.

## Current manual login workflow

The local form collects provider, its API key, an optional visible model ID immediately below the provider selector, loan number, optional FHA case number, payment method, rush flag, required URLA PDF, and optional sales contract PDF. Canonical fields are `provider` (`openai`/`anthropic`/`google`/`xai`), `apiKey`, and `model`. Switching provider clears the key and updates the disclosure; custom model choices remain separate in page memory and are not overwritten during reconnection.

R3 username and password fields have been removed from the frontend, backend input schema, environment operations, and agent tools. Old clients' extra credential properties are stripped by the schema. There are no `get_credentials` or `login_r3` tools. The agent does not read or operate login or CAPTCHA controls.

The worker first extracts and validates the documents, then opens a visible isolated Chromium browser at:

`https://clients.r3amc.com/`

The portal root currently redirects to `/Account/Logon?ReturnUrl=%2F`. On September 10, 2026, unauthenticated HTTP checks and a visible browser using the application's compiled guards reproduced HTTP 404 from the old `/Login.aspx?ReturnUrl=%2F` address and HTTP 302 -> 200 through the root/current route. This is distinct from the historical `ERR_BLOCKED_BY_CLIENT` PostLogin issue. `R3_LOGIN_URL` now means the fixed portal entry; startup also checks the navigation's HTTP response before reporting a usable sign-in page. The existing origin/path/method allowlists, manual credentials, authentication marker, and submission boundary are unchanged. No credentials, CAPTCHA, provider call, order preparation, or submission was used for this live page-load check.

The user enters credentials directly on R3, completes any CAPTCHA, and clicks Login. The application waits for confirmed successful authentication, rather than resuming after an unsuccessful button click. The current success check requires the exact client-portal `/Orders/Search` URL without query parameters and a unique `Log Out` link, either visible or in the inspected collapsed account-menu structure described below.

During the wait:

- Job status is `awaiting_login`; the local frontend displays sign-in instructions and keeps polling.
- Refreshing the local page recovers the job through the owning session.
- Browser tools remain disabled and the single active-job lock remains held.
- Both preparation watchdogs pause. User sign-in time does not consume or reset their remaining processing budgets.
- Closing the browser cancels pending login; the active slot is released on confirmed browser closure, with worker cleanup handled separately.

After successful login, timers resume and the worker navigates to `https://clients.r3amc.com/Orders/Create`, prepares and verifies approved fields, and hands the browser to the user. Failed login and unfinished CAPTCHA leave the application waiting.

## Latest change: sequential appraisal preparations

The user requested another appraisal from the same Appraisal Desk page without restarting npm, including reuse of a still-open R3 window and recovery after closing it. The old parent released its lock only on worker-process exit, while the frontend unlocked on `browser_closed`; closing the final page could leave Playwright handles alive and produce a contradictory Closed / Close the current browser error. Review popups also lacked complete last-page closure tracking.

The new lifecycle separates an active preparation from retained same-owner browser ownership. The worker accepts job-correlated prepare/cancel commands and reports readiness after preparation cleanup and environment operations drain. Each order has a fresh controller, provider model, environment and field plan. The parent uses an explicit current job, ignores retired callbacks, permits only the same owner to reuse the browser, and releases a closed host without waiting indefinitely for child exit.

An explicit **Prepare another order** action resets loan/FHA/rush/key/files and old review notes while preserving provider/custom models/payment. New-document validation precedes replacement of the previous R3 form. A still-open browser transfers to a fresh guarded session with permanently revoked old tools, retired handlers and review sockets, blank form state, and renewed authentication confirmation. Closing R3 instead permits a fresh browser. Frontend generations and predecessor-aware recovery prevent old polling or a lost second POST from confusing jobs. R3 submission remains human-only; confirm actual acceptance in the portal before beginning the next order.

The user reported closing both R3 and npm before implementation. No user-facing application server or live model/R3 order was started for this change; automated tests use isolated synthetic fixtures. The earlier rush-information request diagnosis remains investigation-only: the live portal uses a RushInfo endpoint/query shape rejected by the old guard; its fix has not been authorized or included here.

Final `npm run check` passed TypeScript checking, **336 unit/integration tests across 15 files**, **122 Playwright tests**, and the production build: **458 passing tests total**. The complete log is `output/playwright/sequential-orders-check.log`. Coverage includes repeated preparations, owner isolation, readiness/closure races, helper error-before-close draining, retained and expired synthetic sign-in, fresh guarded plans, old tool revocation, WebSocket retirement and real owned Chromium shutdown. Independent review found and resolved the helper-drain and disconnect races, then found no further actionable browser-transfer issue. These are synthetic/offline checks; live R3 sequential-order acceptance and paid-model extraction were not run. The npm server remains stopped and the installed maintenance skill matches the repository copy. Run `npm start` and refresh Appraisal Desk to load the update; no restart is needed between subsequent orders.

## Previous change: current R3 contact fields

After the alert repair, the user reported incomplete borrower, co-borrower, access, listing/buyer agent, loan-officer and status fields with Gemini. This was confirmed as a shared browser mapping failure: all providers run the same deterministic fill, and even the fixed officer/status constants failed. The user runs the application through npm and explicitly requested that the assistant's earlier server be stopped; it was stopped and port 3000 verified free. Leave the user's current server and order windows alone.

Two separate authenticated, read-only form inspections established that R3 now generates `OrderItemEdit_Contacts_<UUID>__<attribute>` IDs and matching `OrderItemEdit.Contacts[<UUID>].<attribute>` names. UUIDs differed between forms. The historical Borrower/Coborrower/Access/Customer IDs were absent. All six contact captions use direct `SPAN.input-group-text` siblings; the previous observer supported only `input-group-addon` or native/ARIA labels. Agent/officer matching also rejected UUID hyphens. The page had 202 eligible controls, below the 350-control limit. The direct `cvc-group-title` section structure remains usable. Static metadata, without values, is in `output/playwright/contact-structure-diagnostic.log` and `contact-structure-complete.log`.

The new bounded resolver in `src/browser/r3-fields.ts` supports all seven known roles using exact nearest headings and field captions, native text/email/tel inputs, UUID/suffix agreement between ID and name, and the existing allowed attributes. Malformed Contacts namespaces cannot fall back to the older agent resolver. Historical exact IDs and the legacy agent/officer resolver remain supported. `src/browser/session.ts` recognizes a unique sibling caption only when its input group has one form control, requires one contact identity across all fields in a role, pins that identity after its first approved action, and rechecks it before writes and during final verification. Split, duplicate or changed identities remain unresolved instead of being filled.

R3's status section contains five UUID contact wrappers under one heading, with four initially hidden. Only visible status candidates participate; revealing two creates ambiguity. Dynamic hidden access fields may be read only after fresh borrower verification when the plan and observed borrower-copy checkbox are true. Correct hidden copies remain untouched; stale copies receive the existing single guarded refresh. An actual borrower mutation invalidates copy readiness, while an already-correct field retry does not. No new contact-address mappings, extra officer fields, provider/model settings, unrestricted tools or submission permissions were added.

The initial minimal live fill test omitted product selection: borrower, co-borrower, access and status verified, while R3 kept agent/officer sections hidden. The acceptance helper was corrected to include the normal branch, loan type, property type and product selections before contacts. With that normal dependency sequence, **all 44 planned fields verified with no errors**, covering all seven contact roles and the fixed officer/status values. Evidence is `output/playwright/contact-fill-product-acceptance.log`; `contact-fill-acceptance.log` records the narrower earlier diagnostic. The helper `output/playwright/check-contact-fill.mjs` uses fixed synthetic contacts and the user's fixed constants, logs only keyed verification booleans and sanitized errors, and never calls a model, loads PDFs, releases submission guards or submits an order. A paid extraction/full real-order acceptance was not run.

The 16 new cases in `tests/browser-contacts.spec.ts` cover current Bootstrap/UUID markup for all seven roles, shared hidden status wrappers, malformed ID/name bindings, duplicate/split/changed identities, final readback, and correct/stale/hidden/read-only/disabled refinance copies. The original caption regression failed before the fix. Final `npm run check` passed: TypeScript checking, 314 unit/integration tests, 104 Playwright tests and the production build (**418 tests total**), recorded in `output/playwright/contact-fields-check.log`. Independent final review found no remaining actionable issue. The repository and installed maintenance skill are synchronized. Only owned diagnostic browsers were closed; the user's npm server and existing order were preserved. New job workers load the rebuilt code; an existing handed-off order cannot resume automation with the new implementation.

## Previous change: R3 undefined alert and styled sign-in recognition

On September 14, 2026, the user reported a native `undefined` alert and a stuck processing overlay immediately after manual Login. Their selected provider was Gemini, but the cause was in shared browser code. The initial read-only directory/handoff review was completed before the user's subsequent authorization to inspect and fix the issue.

The user-assisted failing diagnostic captured a blocked synchronous GET XHR to the exact portal `/Artifacts/Grid/License` endpoint, followed by an alert whose message was `undefined`. R3's public `clearvaluebundle.js` uses that read to initialize AG Grid; its failure handler alerts the failed request's missing `responseText`. This establishes the cause independently of provider extraction or the local review notes. Sanitized evidence is in `output/playwright/search-alert-diagnostic.log`; license responses and keys were never inspected or retained.

`src/browser/guard.ts` now permits only GET XHR to that exact case-normalized path on `https://clients.r3amc.com`, during authentication or preparation, with no query or exactly one lowercase `_` whose value is 1-20 ASCII digits. Duplicate/unknown parameters, other methods and resource types, navigation, other paths/origins and closed sessions remain denied. Existing redirect and order-write restrictions remain in effect. No dialog suppression was added.

The next diagnostic returned HTTP 200 with no alert but exposed a second issue: restored R3 styling puts the unique `Log Out` link in a collapsed account menu, while the old check required visibility. The observed ancestor chain is `LI` -> `UL.dropdown-menu.dropdown-navbar-menu` -> `LI.dropdown.nav-menu-item` -> `UL.navbar-nav.navbar-right`. The private sign-in predicate now accepts that exact structure only with a visible owner/navbar, a CSS-collapsed menu, and a link resolving back to the exact landing URL. A unique visible legacy marker also remains supported. Unrelated hidden links, duplicate markers, independently hidden links/items, and hidden/inert/accessibility-hidden ancestry are rejected. The marker, exact URL and cancellation state are revalidated after native redirect-guard shutdown; no account-menu clicks, credential reads or new model tools were added. Structure-only evidence is in `output/playwright/search-alert-fixed-diagnostic.log`.

The final user-assisted live diagnostic, `output/playwright/search-alert-acceptance.log`, confirmed the license request returned HTTP 200, automatic `signed_in` with the collapsed marker, no alert, and navigation to the unfilled `/Orders/Create` page. Both current CSS bundles, all six script bundles and the preferred icon font returned HTTP 200; the page had 19 stylesheets with jQuery and Bootstrap loaded. This supersedes the earlier pending order-resource check below. No provider call, field filling or submission ran, and existing user jobs/windows were not restarted. New workers load the rebuilt code; an already-open failed worker keeps its earlier code.

`npm run check` passed with exit code 0: TypeScript checking, 314 unit/integration tests, 88 Playwright tests and the production build (**402 tests total**). The nine new cases in `tests/browser-grid.spec.ts` cover synthetic synchronous-XHR startup and strict request policy, delayed/missing/duplicate/excluded markers, styled-menu authentication, and cancellation during the final awaited marker read. The alert and styled-marker regressions failed before their respective fixes. Independent final review found no remaining actionable issue in the changes. Full verification is recorded in `output/playwright/search-alert-check.log`; repository and installed maintenance skills are synchronized.

The diagnostic helper's optional `--login-resources` mode records request metadata and only the sign-out marker's labels/structure, with query key names rather than values; combined with `--order-resources`, it checks the blank order page after human sign-in. Never capture credentials, headers, response bodies, license keys, general account/order text or document values. The owned diagnostic was stopped after acceptance. The local application was then started from the final build on loopback port 3000, with no preparation job started; inspect current runtime state before relying on this historical status.

## Previous change: R3 stylesheet and JavaScript asset repair

The user then showed an unstyled `/Orders/Create` page. JavaScript was not disabled in Chromium. A separate public-page resource diagnostic reproduced `ERR_BLOCKED_BY_CLIENT` for R3's current `/css/bootstrapbundle.css`, `/css/clearvaluebundle.css` and six `/js/` bundles: `jquerybundle.js`, `thirdpartybundle.js`, `bootstrap.bundle.min.js`, `bootstrapextrabundle.js`, `aggridbundle.js`, and `clearvaluebundle.js`. The older guard allowed `/Content/`, `/Scripts/`, `/bundles/` and `/fonts/`, so the newer asset locations were blocked. The live evidence is `output/playwright/public-resources.log`.

The guard now permits only those exact stylesheet/script files with their matching browser resource types, exact HTTPS portal origin, and existing GET/HEAD non-navigation restrictions. Query options are limited to zero or one lowercase `v` with a 1-128-character URL-safe version token. Loading the CSS revealed two icon-font dependencies, `/css/bootstrap-icons/font/fonts/bootstrap-icons.woff2` and `.woff`; those exact font requests are allowed with the optional version token and at most one bare hexadecimal fingerprint key. Duplicate or unknown parameters, wrong types, unknown files and writes remain denied. The existing subresource-redirect restrictions are unchanged. All shared CSS/JS files and the preferred icon font subsequently returned HTTP 200 in `output/playwright/public-resources-fixed.log`.

The optional `--order-resources` mode of `output/playwright/diagnose-login.mjs` waits for manual authentication, opens the exact unfilled order page under the preparation guard, and records asset metadata and nonprivate rendering indicators. It never fills or submits an order or calls a model. The existing app worker and filled order window were left running. That earlier diagnostic ended with `LOGIN_CANCELLED` in `output/playwright/order-resources-diagnostic.log`; the September 14 acceptance above subsequently completed the authenticated resource check.

`npm run check` passed with exit code 0: TypeScript checking, 314 unit/integration tests, 79 Playwright tests, and the production build (**393 tests total**). The two new browser cases verify actual CSS layout, execution of all six external scripts on a synthetic authenticated order page, unchanged blocked order writes, and the exact asset/query policy matrix. The full log is `output/playwright/portal-assets-check.log`. The source and installed maintenance skill are synchronized. New job workers load the rebuilt guard; the existing filled order was not refreshed or restarted.

## Previous change: current R3 PostLogon redirect repair

The next user-assisted diagnostic captured `POST /Account/Logon` returning HTTP 302 to the exact client-portal `/Account/PostLogon` path with the sole query key `returnUrl`. The application's CDP guard then issued `Fetch.failRequest` with `BlockedByClient`, and Chromium reported `net::ERR_BLOCKED_BY_CLIENT` for the login POST. This proves the application's guard caused the observed block; the screenshot's login address was the redirect source. The older allowed path is spelled `/Account/PostLogin` and does not match the current path.

The narrow fix permits GET/HEAD navigation to `/Account/PostLogon` only during authentication, on the exact HTTPS portal origin, with exactly one case-insensitive `returnUrl` parameter whose decoded value is `/`. This fixed destination matches the application's portal-root entry; query values were not retained in the live diagnostic. Missing, duplicate or unknown parameters and other return destinations remain denied, as do POSTs to the handoff and preparation-phase access. Historical queryless `/Account/PostLogin` behavior, native Chromium login, CAPTCHA, authentication markers, and order-write restrictions are unchanged.

The sanitized failing trace is `output/playwright/postlogon-block-diagnostic.log`. After rebuilding, the user's repeat sign-in succeeded: `POST /Account/Logon` -> HTTP 302 -> `GET /Account/PostLogon` -> HTTP 302 -> `GET /Orders/Search`, followed by the application's `signed_in` result. The user also confirmed reaching the orders page. The success trace is `output/playwright/postlogon-success-diagnostic.log`; no query values, credentials, response bodies, or authentication state were saved. No provider call, order preparation, or submission ran.

`npm run check` passed with exit code 0: TypeScript checking, 314 unit/integration tests, 77 Playwright tests, and the production build (**391 tests total**). Three new cases cover the current login chain with its required success marker and blocked order writes, an unsafe later redirect from the new handoff route, and strict query/method/origin/phase rules. The native login regression failed before the guard fix. After live acceptance established the direct PostLogon-to-Orders/Search hop, its synthetic fixture was aligned to that exact chain and all three PostLogon tests passed again. The log is `output/playwright/postlogon-check.log`. The maintenance skill is synchronized to the installed copy. Restart the app and begin a new job to use the rebuilt fix; the diagnostic browser performs sign-in only.

## Previous change: R3 login entry repair

The user supplied a screenshot of HTTP 404 at the former `Login.aspx` entry. The live failure was reproduced without credentials, and the portal root was confirmed to redirect to the current `Account/Logon` page with HTTP 200 through the application's visible guarded Playwright session. The app now starts at the already-approved portal root. It retains only main-frame GET response statuses from the existing CDP metadata guard, checks for HTTP errors before sign-in-ready notification, and preserves the status in failures where Chromium returns no Playwright Response or rejects navigation. No guard allowlist was expanded, no login POST retry was added, and credentials/CAPTCHA/submission remain human controlled.

`npm run check` completed with exit code 0: TypeScript checking, 314 unit/integration tests, 74 Playwright tests, and the production build (**388 tests total**). Eight new browser cases cover the current root redirect, direct/redirected 404 and 500 responses including empty error bodies, and unsafe redirects; existing manual-login, CAPTCHA, and historical PostLogin checks remain. The diagnostic scripts `output/playwright/inspect-public-login.mjs` and `output/playwright/check-login-entry.mjs` collect only routing metadata and close their isolated browsers. No authenticated login, paid model call, live order preparation, or submission was performed for this repair. The local app was not running on port 3000 during verification; start/restart it and begin a new job to use the rebuilt code. The installed maintenance skill is synchronized with the project copy.

## Previous change: SpaceXAI / Grok provider

The dropdown now includes **SpaceXAI**, using canonical provider `xai` and a **Grok API key**. A blank model uses `grok-4.6`; surrounding whitespace is trimmed and custom compatible model IDs retain the existing validation. Key clearing, per-provider model memory, reconnection, and manual submission are unchanged.

`src/xai.ts` uses `@langchain/xai` 1.4.12 `ChatXAI` with the pinned `https://api.x.ai/v1/chat/completions` endpoint. The installed constructor replaces its configuration object, so the application sets public lazy-client configuration afterwards. Its transport supplies only the selected key, removes ambient organization/project headers, rejects redirects, and honors cancellation plus a 120-second request timeout. No server-side search tools are enabled. The installed `ChatXAIResponses` lacks the structured-output/tool/cancellation behavior needed here; the application uses Chat Completions.

The [xAI file interface](https://docs.x.ai/developers/model-capabilities/files/chat-with-files) documents uploaded IDs and public URLs. To preserve the existing in-memory workflow, `src/pdf-pages.ts` renders every local PDF page with PDF.js and native canvas, then sends labeled PNG pages through supported image input. Scanned pages and visible form appearances are retained. Rendering uses 144 DPI capped at 2400 pixels per edge; it rejects more than 50 total pages, over 20 MiB in one PNG or 40 MiB total PNG data before base64 expansion, or conversion exceeding its 60-second cooperative budget. Invalid, encrypted, or unsupported XFA documents produce a clear error instead of partial extraction. Fonts/CMaps/wasm come only from fixed package directories; no PDF URLs, scripts, or remote assets are executed or fetched. Other providers retain their native inline PDFs and the common 15 MiB upload limit is unchanged.

Grok uses the canonical nullable extraction schema, native JSON output, and the existing narrow HTTP 400 unsupported-format fallback to a tool call on the same provider/model/key. Local validation and all loan/field rules remain. `src/model-messages.ts` keeps recognized screenshot tool results textual and appends their image content in a user message after contiguous tool results; IDs, metadata, and original history are preserved. Error messages and environment isolation cover xAI without exposing raw provider details.

`npm run check` passed with exit code 0: TypeScript checking, 314 unit/integration tests across 14 files, 66 Playwright tests, and the production build (380 tests total). The 13 PDF-rendering tests and 12 Grok adapter tests passed, and local rendering processed all 29 sample PDF pages without provider calls or disk image output. Dependency installation reported zero known vulnerabilities. No live Grok or R3 acceptance run has been performed; the prior 315-test Google result is historical.

## Previous change: Google Gemini provider

Google Gemini is a third visible provider, using a Google AI Studio API key and default `gemini-3.8-flash` when Model is blank. Custom capable model IDs remain supported, with existing length/character validation and no automatic provider/model switch. The model textbox stays directly below the selector; key clearing, provider disclosure, and per-provider in-memory model choices apply to Google too.

The implementation uses `@langchain/google` 0.2.5 `ChatGoogle` through `src/google.ts`, with `platformType: 'gai'`. Its custom API-key-only `apiClient` bypasses SDK ambient Cloud credential discovery and gateway routing, pins `https://generativelanguage.googleapis.com` and `v1beta`, encodes the selected model into the Generate Content path, and supplies only the selected `x-goog-api-key`. Redirects are rejected. Caller abort and a 120-second timeout bound each request. Existing worker/browser environment allowlists are unchanged and exclude Google keys, ADC/Cloud credentials, Vertex/project/endpoint settings, and proxies. Installation's dependency audit reported zero known vulnerabilities.

Google PDFs use standard base64 file blocks converted to native `inlineData`, each immediately preceded by a source-document text label because the native block has no filename. No Files API upload is added and the local 15 MiB-per-PDF limit is unchanged; [Google's Generate Content file-input limits](https://ai.google.dev/gemini-api/docs/generate-content/file-input-methods) and model context/page limits still apply. Google uses the existing canonical nullable schema and local Zod validation. Only an explicit HTTP 400 unsupported-native-output-format rejection allows a `functionCalling` retry on the same provider/model/key/schema. No thinking/sampling or unsupported storage flags are forced; provider data terms apply.

Standard screenshot text/image blocks, existing tool-call IDs, and Google thought signatures stay in the original message history. The same restricted browser tools, preparation budgets, and human-only submission remain in place. Google SDK `statusCode` and private error details are classified into fixed messages without exposing raw errors, key-bearing URLs, or document text; unknown 400/422 rejections remain neutral. `npm run check` passed with exit code 0: TypeScript checking, 251 unit/integration tests across 12 files, 64 Playwright tests, and the production build (315 tests total). Current verification uses mocked adapters and local browser fixtures; no live Google or R3 acceptance was performed. The 18 Google adapter tests cover source labels, native PDFs and schemas, local validation, credential isolation, narrow format fallback, screenshots, preserved thought signatures, and cancellation before/during requests. The earlier 257-test product result is historical. Restart the local app and refresh its page after updating.

## Previous change: bounded appraisal-product recommendations

The user wants the agent to choose an appropriate appraisal product. Review of all eight pages of `Example_Pdfs/SAMPLE_URLA_1003_FHA_Whitmore.pdf` and `Example_Pdfs/SAMPLE_Nevada_Residential_Purchase_Agreement.pdf` found FHA financing (URLA page 1), one unit and primary-residence occupancy (URLA page 2), and “Not applicable — site-built residence” in the agreement's manufactured/mobile disclosure (page 3). Neither PDF explicitly names Single Family/SFR or an appraisal form. “FHA 203(b) 30-Year Fixed” on URLA page 4 is mortgage financing, not an appraisal service. The earlier baseline required a mapped property type, leaving no product baseline when that classification was unknown. The PDFs were not edited; task renders remain as diagnostic artifacts in `tmp/pdfs/whitmore-product-evidence`.

Shared `APPRAISAL_PRODUCT_INSTRUCTIONS` now permit a tentative inspected baseline recommendation from combined facts, with supporting quotes in the existing evidence array under field `productRecommendation`. A one-unit site-built residence with no contrary condominium/manufactured/multi-unit facts may support a tentative SFR recommendation; FHA status, one unit, occupancy, price, or loan amount alone does not. Keep Property Type and Occupancy independently extracted and leave uncertain facts unresolved. Their normalizers and all schema fields/union counts remain unchanged; only the product description changes.

The domain checks the recommendation marker first so malformed evidence cannot fall through to an explicit request. Require nonempty quotes naming supplied documents, reject mixed `product`/`productRecommendation` evidence, permit only inspected products matching the loan program, and reject any explicit incompatible or unsupported property description. Always add a warning to confirm property classification and lender requirements. Explicit requests need `product` evidence; uncited nonblank products remain unresolved. With no product supplied, the original server baseline remains available for the four supported property/program families. Quote presence/source checks do not independently prove factual accuracy. Only finite optional-dash aliases for FHA SFR, Manuf, and Multi labels are added through the immutable plan's `allowedLabels`; no fuzzy matching or new browser permissions are introduced. `npm run check` passed with exit code 0: TypeScript checking, 195 unit/integration tests across 11 files, all 62 Playwright tests, and the production build (257 tests total). These are local fixture results; the 236-test phone-recovery result is historical. Human review and submission remain mandatory; no live-provider or live R3 acceptance was performed.

## Previous change: recovery for existing mapped phone fields

Recovery now covers exactly 19 existing approved phone keys: work/home/mobile phone keys for `borrower`, `coBorrower`, `contact` (access contact), `listingAgent`, `buyerAgent`, and `statusContact`, plus `loanOfficer.workPhone` only. It adds no planned values or mappings; each field uses its own approved number, never the officer's number as a substitute, and blanks stay blank.

After ordinary fill/blur fails verification, try equivalent hyphenated `XXX-XXX-XXXX` and then parenthesized `(XXX)XXX-XXXX` / `(XXX) XXX-XXXX` formats, followed by private per-digit entry of that same number if necessary. Skip a format identical to the original plan value because the initial fill already tried it. The conservative `phoneInputDigits` helper identifies eligible US numbers. Support ten US digits with common formatting and an optional `1`/`+1` prefix, including parenthesized formats such as `(702)604-7027` and `(702) 604-7027`. Do not truncate extensions or international numbers to make them fit this recovery. Before every mutation, freshly check field identity, approved mapping, editability, and active preparation; final readback must still match the approved number. Refinance borrower verification remains before the protected access-contact copy. No model keyboard/event tool or submission action is added. `npm run check` passed with exit code 0: TypeScript checking, 176 unit/integration tests across 11 files, all 60 Playwright tests, and the production build (236 tests total). These are local fixture checks; the 229-test loan-officer-only result is historical. No exact live mask cause or live R3 acceptance has been confirmed.

## Previous change: loan-officer Work Phone recovery

The user reported that the other three loan-officer values filled while Work Phone remained blank. The live field was unavailable for inspection, and public bundles did not identify its mask. Do not claim that a specific live R3 mask or rejection cause was confirmed; the strict-format and keyboard-mask fixtures are synthetic regressions.

This initial recovery applied only to `loanOfficer.workPhone` after normal fill and blur failed verification. It tried equivalent `(702)604-7027` and `(702) 604-7027` representations of the immutable `702-604-7027` value, then privately entered exactly its ten approved digits if necessary. Fresh field identity, mapping, editability, active-preparation checks, and final approved-number verification remain required in the expanded recovery described above.

Two synthetic clear-on-blur/keyboard-mask regressions failed before the fix; all five focused recovery and guard tests passed afterward, including correct existing values, role changes, revocation, and stale resets. The full `npm run check` then passed with exit code 0: TypeScript checking, 172 unit/integration tests across 11 files, 57 Playwright tests, and the production build (229 tests total). The 224-test fixed-contact result is historical. These fixtures do not establish the exact live cause; live-provider and live R3 acceptance remain unverified.

## Previous change: fixed loan officer

Always populate first name `Amber`, last name `Coleman`, work phone `702-604-7027`, and email `acoleman@guildmortgage.net` in the loan-officer section. These four required values are immutable approved-plan constants, independent of PDF contents, selected provider, and loan purpose. Domain rules and the preparation prompt agree; no extraction-schema change was added. The separate status contact remains `Amber Coleman Team` and `ambercolemanteam@guildmortgage.net`.

Only these four loan-officer fields extend the existing bounded section/label resolver, under the exact screenshot-supported heading `Is there a loan officer?`. Require exact field labels, a unique visible text input, an `OrderItemEdit_` ID shape, exclusion of IDs reserved by existing mappings, and final section/uniqueness verification. No loan-officer home/mobile phone or address fields were added. Actual live loan-officer DOM IDs have not been captured. Missing or ambiguous controls require review; the browser lifetime and human-only submission boundary are unchanged. The update passed `npm run check` with exit code 0: TypeScript checking, 172 unit/integration tests across 11 files, 52 Playwright tests, and the production build (224 tests total). The earlier 220-test result is historical.

## Previous change: Anthropic schema compatibility and errors

The previous outbound extraction schema contained 40 union-typed fields: 37 nullable strings and 3 nullable numbers. [Anthropic documents a limit of 16 union-typed parameters](https://platform.claude.com/docs/en/build-with-claude/structured-outputs#schema-complexity-limits) across strict schemas in one request. This incompatibility is confirmed from the schema; it does not establish the exact reason for the user's reported 400/422 because the raw provider error was not retained.

For Anthropic only, derive the outbound schema from the canonical schema and represent those 37 nullable text fields as required strings with empty string for unknown. Normalize only those designated text paths back to canonical null, then apply the full canonical Zod validation. Leave the three numeric/null fields and OpenAI's schema unchanged. The native extraction request now has 3 unions and remains a single request using the selected provider/model/key with no forced thinking settings. The existing explicit unsupported-native-format retry remains narrowly scoped; schema-complexity, billing, and PDF failures do not authorize changing providers or models.

Recognized credit/billing, schema, PDF, and capability rejections now have specific sanitized messages. An unclassified 400/422 receives neutral guidance instead of asserting that the selected model lacks required capabilities. Raw errors are not exposed. The fix passed `npm run check` with exit code 0: TypeScript checking, 171 unit/integration tests across 11 files, 49 Playwright tests, and the production build (220 tests total). The earlier 192-test provider-selection result is historical. No live-provider or live R3 acceptance was performed.

## Previous change: OpenAI and Anthropic support

The user may select OpenAI or Anthropic and use any suitable account-accessible model ID (up to 200 characters, no spaces/control characters). Blank IDs use `gpt-5.6-sol` or `claude-opus-5`. The selected model must support PDF, image, tool, and structured-extraction capabilities. The Opus default is documented in [Anthropic's model overview](https://platform.claude.com/docs/en/models/opus-5/overview); the implementation uses [LangChain ChatAnthropic](https://docs.langchain.com/oss/javascript/integrations/chat/anthropic) from `@langchain/anthropic` 1.5.9. Installation's dependency audit reported zero known vulnerabilities.

Clients receive the selected key explicitly and use pinned official endpoints (`https://api.openai.com/v1` and `https://api.anthropic.com`). PDFs are sent inline from memory: OpenAI `input_file` base64 blocks or Anthropic `document.source` base64 blocks, with no Files API uploads. OpenAI Responses requests use `store: false`; Anthropic Messages requests do not receive that unsupported flag. Provider retention terms/account settings still apply. Each local PDF may be at most 15 MiB, but Anthropic's 32 MB whole-request limit includes base64 expansion and both PDFs; provider-size errors are sanitized and actionable.

Both providers first request native JSON schema output. Only an explicit HTTP 400 unsupported-output-format response permits a `functionCalling` retry on the same provider/model/key/schema, followed by local Zod parsing. This is an output-format retry, never a provider/model fallback. No thinking or sampling parameters are forced. Reconciliation uses the selected model with the same restricted tools and manual handoff. Browser screenshots use standard text/image blocks; `providerMessageMiddleware` in `src/model-messages.ts` converts only recognized PNG `screenshot_page` ToolMessages to OpenAI-native Responses content while preserving original history. Anthropic's adapter handles the standard blocks.

The generic worker variable `APPRAISAL_AI_API_KEY` replaces `OPENAI_API_KEY`. Fixed PowerShell allowlists, secret-availability-only model tools, environment cleanup, and rejection of inherited provider keys/proxies remain enforced. Restart the local application and refresh its page after updating: the canonical `provider`/`apiKey` fields and worker variable changed, so the new frontend can fail against an old running server. This update's historical full local check passed with 192 tests; the earlier 152-test result is separate. No live-provider or live R3 acceptance run was performed for this update.

## Previous change: sale-price extraction

The active contract contains a purchase price of $485,000.00 in page 1's purchase-price field and page 9's Exhibit A. Both the page 1 widget value and canonical AcroForm value agree. The document is explicitly unsigned and fictional. No PDF changes were made for this fix.

The prior extraction prompt said "Use the signed contract for sale price." That restriction could suppress the price from this unsigned sample, but the actual model output from the reported run was not captured, so this is not a confirmed diagnosis of that run. Shared `SALE_PRICE_INSTRUCTIONS` in `src/system-prompt.ts` now guide extraction and preparation, with a matching schema description: read explicit purchase/sale price from all supplied contract pages, form fields, exhibits, and addenda even when unsigned, draft, or sample; retain the document-status warning. Request `salePrice` evidence with `salesContract`, page, and supporting quote. Keep the positive numeric price distinct from loan amount, down payment, earnest money, cash to close, and appraised value; return null and a review warning for missing or unresolved values, never zero or a calculated guess.

The existing write rule remains purchase plus supplied contract only; refinance or no-contract orders leave sale price blank. Historical `npm run check` passed TypeScript checking, 105 unit/integration tests across 7 files, 47 browser tests, and the production build: 152 passing tests. No paid model call or live R3 acceptance was performed for this fix.

## Previous change: seller's-agent terminology and sample contract

Listing agent and seller's agent identify the seller's representative. A selling/cooperating agent belongs in `buyerAgent` only when explicit document evidence establishes buyer representation; do not infer the role merely from similar terminology.

Use `Example_Pdfs/Sample_Form_1003_URLA.pdf` with the updated active `Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf` for the fictional purchase example. The generated copy is `output/pdf/Sample_Nevada_Purchase_Contract_With_Agents.pdf`; the original no-agent contract is preserved at `output/pdf/source-backups/Sample_Nevada_Purchase_Contract.before-agents.pdf`.

The updated contract was validated as 10 pages with all 145 interactive fields preserved. New Exhibit B names fictional listing/seller's agent Avery Ellis and buyer's agent Morgan Rivera, with explicit typed phone numbers and emails. Exhibit A's statement that no agents are included was removed, page 8's printed agent names were updated, and page 7 references both exhibits. The document remains an unsigned fictional practice example.

Historical `npm run check` passed TypeScript checking, 97 unit/integration tests across 7 files, 44 browser tests, and the production build: 141 passing tests. The active sample's SHA256 matches the validated generated output, and the original backup is retained. No paid model call, live R3 acceptance, application launch, or submission was performed for this update.

## Previous change: access and agent contacts

The previous refinance plan checked `UseBorrowerForAccess` but omitted `contact.*` entries, leaving R3's checkbox behavior responsible for access details. The current plan explicitly includes borrower values for refinance access. Browser preparation fills and verifies the borrower first, enables the checkbox next, then fills and verifies the access fields. Purchase access uses the listing agent and keeps the checkbox unchecked. Required borrower/access contacts need first and last names and at least one supported phone number or email; unknown details remain unresolved for review.

Missing required borrower/access names emit explicit blanks while retaining missing-source metadata, so stale identities are cleared without reporting complete preparation. If refinance borrower access was already checked and the copied contact is stale, the session refreshes only that approved native checkbox's change event after freshly verifying borrower fields. It never toggles the checkbox off or exposes arbitrary event dispatch, and leaves already correct copied values alone.

Extraction now returns separate `listingAgent` and `buyerAgent` objects alongside borrower/co-borrower contacts. It requests exact contact-field evidence and agent-role evidence from the contract and URLA, preferring the contract's explicit representation statements for agents and the URLA for borrowers. Listing agent means seller's agent. Classify a selling/cooperating agent as `buyerAgent` only with explicit buyer-representation evidence. Unknown roles, phone types, names, or contact values are not invented. Separate agent sections are populated when any source fact for that role exists.

No live Create-page DOM evidence or new agent-field IDs were captured for this change. At that stage, only the two new agent sections used a bounded resolver based on the screenshot's exact nearest section heading and exact field labels, a visible text input with an `OrderItemEdit_` ID shape, and a unique candidate. It rejects IDs reserved by existing mappings; older keys keep their exact-ID policy. Final verification rechecks role identity and uniqueness. The agent-contact scope is six fields: first/last name, work/home/mobile phone, and email. No contact-address mapping was added; the later loan-officer extension is described above.

Historical `npm run check` passed TypeScript checking, 96 unit/integration tests across 7 files, 44 browser tests, and the production build: 140 tests in total. The model default, human-only submission boundary, and preparation timeout behavior remain as previously implemented. No application launch, live contact-field acceptance run, paid model call, or appraisal submission was performed for this change.

## Previous change: dropdown preparation and browser lifetime

The user's screenshot and report showed missing Loan Program/Property Type selections and an R3 window that closed after a delay. Code review found that a worker preparation timeout closed any browser not already handed off, strict handoff rejected incomplete fields into that same cleanup path, and the parent watchdog independently killed the worker.

`runPreparation` in `src/preparation.ts` now owns the lifecycle; `src/worker.ts` handles job and cancellation IPC. Both watchdogs preserve their active processing budgets and pause for manual login, but the parent sends `stop_preparation` instead of killing the browser-owning worker. A deterministic approved-plan fill precedes optional model reconciliation of unresolved fields. Supported URLA program classification controls R3 Loan Type rather than free-form rate/type text, and conservative explicit property aliases map to inspected options. An absent or blank document product can use only the existing supported baseline mapping with its review warning.

Strict complete handoff still requires fresh verification. `session.handoffIncomplete` stops new and queued tool actions and drains in-flight actions before enabling human writes. Timeout, failed preparation, or unresolved fields on the order form enter explicit incomplete `awaiting_review`; the partial browser stays open and the active-job lock remains held until it closes. The local heading is “Review and finish your order.” The user completes missing fields, reviews all values, and submits directly in R3. No automatic submission was added. Keeping the local server running remains necessary for the browser session.

Verification for this change passed TypeScript checking, 68 unit/integration tests across 6 files, 33 browser tests, and the production build. Synthetic checks do not establish paid-model extraction or live R3 order-preparation acceptance.

## Previous login bug: confirmed cause and fix

The user's screenshot showed Chromium's native error page at the original Login URL:

`ERR_BLOCKED_BY_CLIENT`

The application deliberately generates this error when its network guard rejects a request or redirect. The original Login GET/POST itself was allowed. A sign-in-only diagnostic using the same compiled browser session captured this real sequence:

```text
POST https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F
  HTTP 302 -> GET https://clients.r3amc.com/Account/PostLogin
  application's CDP response guard: Fetch.failRequest / BlockedByClient
```

The login handoff route `/Account/PostLogin` was missing from the allowlist. This was a local application bug; the captured block was not evidence of R3 rejecting Playwright as a bot.

The fix in `src/browser/guard.ts` allows only:

- The exact client portal origin and `/Account/PostLogin` path, with existing case/trailing-slash normalization.
- GET or HEAD navigation, with no query parameters.
- The `authenticating` phase.

Order POSTs remain blocked before human review. No broad domain/path allowance or CAPTCHA bypass was added.

The user then signed in again in a diagnostic browser using the rebuilt code. The captured real sequence was:

```text
POST /Login.aspx -> HTTP 302 -> GET /Account/PostLogin
GET /Account/PostLogin -> HTTP 302 -> GET /Orders/Search
Application result: signed_in
```

The application recognized the authenticated page. The diagnostic did not call OpenAI, prepare an order, or submit anything. Both diagnostic browser windows were closed afterward.

`tests/browser.spec.ts` contains a native redirect regression that failed before the fix and passed afterward. Its synthetic chain also includes an intermediate `/` hop and verifies order POSTs remain blocked after login.

Do not assume all other redirect variants are supported. In particular, the existing successful-login check is strict. A future R3 route change should be investigated using actual redirect metadata before widening permissions.

## Important architecture and files

All paths below are relative to the workspace.

| File | Responsibility |
| --- | --- |
| `public/index.html`, `public/app.js`, `public/styles.css` | Local form, progress display, session recovery, human login/review prompts |
| `src/app.ts`, `src/server.ts` | Loopback Express server, sessions, CSRF, upload validation, job endpoints |
| `src/domain.ts` | Default model, input schema, job types, deterministic loan rules and field plan |
| `src/extraction.ts` | Explicit provider/model clients, native PDF blocks, structured output with narrow same-model format retry |
| `src/model-messages.ts` | Provider adaptation of recognized screenshot tool messages |
| `src/environment.ts`, `scripts/environment.ps1` | Fixed PowerShell environment operations for API key and loan settings |
| `src/jobs.ts` | Isolated worker lifecycle, owner-scoped status, single-job lock, parent watchdog |
| `src/worker.ts` | Worker job and `stop_preparation` IPC handling |
| `src/preparation.ts` | `runPreparation`: extraction, validation, manual login, deterministic fill, optional model reconciliation, verification, complete/incomplete handoff, cleanup |
| `src/pausable-timeout.ts` | Pause/resume helper preserving remaining active processing time |
| `src/agent.ts`, `src/system-prompt.ts` | Bounded LangChain preparation workflow; manual login is completed before agent execution |
| `src/browser/session.ts` | Headed browser, manual authentication wait, network enforcement, bounded field tools, review handoff |
| `src/browser/guard.ts` | Request and URL policy, including the confirmed PostLogin fix |
| `src/browser/r3-fields.ts` | Previously inspected R3 field IDs, labels and baseline products; bounded section/label resolver for the two new agent sections |
| `tests/*.test.ts`, `tests/*.spec.ts` | Unit/integration and synthetic browser tests |
| `README.md`, `docs/security-review.md` | Setup, architecture, development evidence and limitations |

`output/playwright/diagnose-login.mjs` is a diagnostic helper, separate from the app. It opens a sign-in-only browser with the same compiled guarded session, prints redirect status/method/origin/path/query-key names, and stops short of order preparation. It never records credential fields, bodies, cookies, header dumps, or query values. It uses `dist`, so build first if using it again. It closes its browser on Ctrl+C or after a 15-minute diagnostic timeout. Do not confuse this helper with the application server.

## Existing protections and behavior to preserve

- Local server binds to `127.0.0.1:3000` by default; Host/Origin checks, session ownership, CSRF protection, and one active job are implemented.
- PDFs are bounded to 15 MiB each and processed in memory. Parent buffers are wiped after IPC transfer; worker buffers and environment values are cleared during cleanup.
- Worker and Chromium environments are allowlisted to avoid inheriting unrelated credentials, tracing, proxies, or preload hooks.
- PowerShell receives literal JSON over stdin; submitted values are not interpolated into executable shell commands. Process environment scope is used, not persistent User/Machine scope. R3 credentials have no environment operations.
- The selected provider's API key is consumed privately by backend code through `APPRAISAL_AI_API_KEY`; model tool results expose only availability for secrets.
- All four providers use structured extraction with local Zod validation; OpenAI Responses requests set `store: false`, while Anthropic, Google, and Grok omit unsupported storage flags. Tracing is disabled. This is not a claim of zero provider retention or secure erasure of all OS/browser memory.
- During manual authentication, native Chromium networking preserves normal login/cookie/CAPTCHA behavior. A CDP response-stage guard checks redirects without retrieving request bodies or credentials.
- During preparation, writes are denied and dynamic reads are limited to inspected lookup routes. Redirect hops are checked. Agent tools cannot perform arbitrary scripts, unrestricted clicks, Enter, payments, or submissions.
- Form values come from an immutable server-approved plan. The tools verify the exact order URL, field mapping, dependent dropdown completion, and resulting values. Existing exact-ID mappings remain intact; listing/buyer agent fields and the four requested loan-officer fields use the constrained heading/label resolver, with final section identity and uniqueness verification.
- At complete or incomplete handoff, new and queued agent tools are disabled and in-flight actions are drained before writes become available to the user. Preparation timeouts request a safe stop instead of closing a partial order browser. The browser remains open until the user closes it while the local server stays running. Submission detection is not proof R3 accepted an order.

## Business rules already implemented

- Loan number must match `^685-20\d{5}$`.
- VA loans are rejected with instructions to use the VA portal.
- FHA/FHA Zero Down require the separately entered FHA case number.
- Supported URLA program classification sets R3 Loan Type; free-form rate/type text cannot override it. Property Type uses conservative explicit aliases for inspected options and leaves unsupported descriptions for review.
- Branch is `GUILD 685 SUMMERLIN ONE`; status contact is `Amber Coleman Team`.
- Loan officer is always first name `Amber`, last name `Coleman`, work phone `702-604-7027`, and email `acoleman@guildmortgage.net`; these required constants do not come from extraction.
- Sale price is populated only for a purchase with a supplied contract. Explicit prices from unsigned/draft/sample contracts remain extractable with a status warning and contract-page evidence. Missing or unresolved prices stay null for review, never zero; financing/valuation amounts are not substitutes. Refinances and orders without a contract leave it blank.
- Refinance access explicitly uses the borrower's values, filled and verified after borrower fields and the borrower-access checkbox. Purchase access uses supported listing-agent facts. Required borrower/access contacts need first/last names and at least one supported phone or email.
- Listing agent means seller's agent. Keep the buyer's role separate and classify a selling/cooperating agent as `buyerAgent` only with explicit buyer-representation evidence. Populate the six name/phone/email fields in each separate agent section when any source fact for that role is known; do not invent unknown values or map contact addresses.
- Explicitly designated fields remain blank or unchecked as specified in `domain.ts` and the maintenance skill.
- Product means appraisal service/form, not mortgage financing. Explicit requests require `product` citations. A separate `productRecommendation` path may choose only a program-matching inspected baseline from cited combined facts, with mandatory property/lender review; reject mixed evidence and explicit incompatible/unsupported property types. Recommendations do not establish Property Type or Occupancy. The no-product server baseline retains its four inspected property families, and finite approved FHA dash variants do not permit fuzzy matching.

## Verification and current runtime context

Historical `npm run check` after the PostLogin fix, September 9, 2026:

- TypeScript checking passed.
- 34 unit/integration tests passed across 5 files.
- 25 Playwright browser tests passed.
- Production build passed.
- Total: **59 passing tests**.

The real user-assisted manual login and authenticated-page recognition also passed after the PostLogin fix. The full paid-model extraction, actual order filling, and human submission flow was not run during this diagnosis. Do not describe that complete live workflow as verified.

Historical local verification after the dropdown and incomplete-review fix, September 9, 2026:

- TypeScript checking passed.
- 68 unit/integration tests passed across 6 files.
- 33 Playwright browser tests passed.
- Production build passed, including `dist/preparation.js`.
- Total: **101 passing tests**.

These results are separate from the historical 59-test result above. No paid model call, live order-preparation acceptance run, or appraisal submission was performed for that fix.

Historical `npm run check` after the contact changes completed with exit code 0:

- TypeScript checking passed.
- 96 unit/integration tests passed across 7 files.
- 44 Playwright browser tests passed.
- Production build passed.
- Total: **140 passing tests**.

These results are separate from both historical totals above. No live contact-field acceptance run, paid model call, or appraisal submission was performed for the contact fix, and the application was not launched for it.

The seller's-agent wording and sample-contract update passed historical `npm run check` with exit code 0: TypeScript checking, 97 unit/integration tests across 7 files, 44 browser tests, and the production build, for **141 passing tests**. PDF validation confirmed 10 pages and 145 interactive fields, and the active sample matches the validated generated output. These results are separate from the historical 140-test result.

Historical `npm run check` passed TypeScript checking, 105 unit/integration tests across 7 files, 47 browser tests, and the production build: 152 passing tests. The 141-test result above is separate. Sale-price regressions cover unsigned/sample price instructions, purchase/refinance planning, missing-price review, currency formatting, repair after a reset to zero, and rejection of stale zero at handoff. No paid model call, live R3 acceptance, or appraisal submission was performed.

The provider-selection `npm run check` exited successfully: TypeScript checking, 143 unit/integration tests across 9 files, 49 Playwright browser tests, and the production build passed (192 tests total). Synthetic provider tests cover selected official endpoints/credentials, native PDF/JSON output, the restricted same-provider/model format retry, actual bounded two-turn screenshot reconciliation for both providers, and sanitized errors including Anthropic SDK timeouts. Desktop and mobile visual checks passed. `@langchain/anthropic` 1.5.9 was installed and its dependency audit reported zero known vulnerabilities. No live-provider or live R3 acceptance was performed for this update.

During the earlier login diagnosis, the user had restarted the application and one server was listening on port 3000; the agent left it untouched and closed only its diagnostic browsers. For the earlier dropdown and incomplete-review fix, the production build completed successfully, but automatic approval review blocked the attempt to start the local application with a generic policy rejection. No server was started by the agent, and the user was told to run `npm start`. Inspect current runtime state before deciding whether to start or stop anything.

Useful commands, from the workspace:

```powershell
npm run check
npm run build
npm start
```

`npm run dev` runs the TypeScript server; `npm run browsers:install` installs Chromium when needed. Dependencies were not changed for the historical manual-login or PostLogin fixes; provider selection adds `@langchain/anthropic`. Tests use synthetic fixtures. Do not make paid provider calls or real order submissions merely to repeat the local suite.

## Maintenance skill and original specification

- Project skill source: `skills\appraisal-automation\SKILL.md`.
- Installed matching copy: `C:\Users\jorda\.codex\skills\appraisal-automation\SKILL.md`.
- The source and installed copy were synchronized for provider selection. The source passed the skill creator's validator after the earlier login fix; that historical result does not describe the current changes.
- The skill records both provider defaults and adapters, manual-login workflow, business invariants, submission boundary, PostLogin diagnosis guidance, deterministic fill, safe incomplete handoff on timeout, and contact-role mapping constraints.
- The original user-pasted specification was supplied at `C:\Users\jorda\.codex\attachments\0997fee2-3c43-469e-98e5-d84f64a2a027\pasted-text.txt`. This attachment may not be available in another environment. The user's later manual-login and model changes supersede conflicting parts of that original specification.

No API keys, R3 credentials, browser authentication state, or customer documents are included in this handoff. Another chat needs access to the project files separately. Grok verification passed with 380 tests, TypeScript checking, and the production build; the prior Google result passed 315 tests, TypeScript checking, and the production build; the 257-test product-recommendation result is historical. Restart the local application and refresh its page after updating. Live-provider and live R3 acceptance remain unverified.
