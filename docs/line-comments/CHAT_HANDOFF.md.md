# Line explanations: CHAT_HANDOFF.md

Source: [CHAT_HANDOFF.md](../../CHAT_HANDOFF.md). Numbers refer to the original file before comments were added.

The original file was unchanged during annotation. Later login-entry and PostLogon repair sections record the observed failures, narrow fixes, and their verification status; consult the current handoff for those additions. The table below describes the historical annotation snapshot.

| Original line | Explanation |
| ---: | --- |
| 1 | Introduce the "Appraisal Automation — chat handoff" section of this document. |
| 2 | Blank line separating adjacent document blocks. |
| 3 | Document this statement under "Appraisal Automation — chat handoff": Prepared September 9, 2026. |
| 4 | Blank line separating adjacent document blocks. |
| 5 | Introduce the "Project and purpose" section of this document. |
| 6 | Blank line separating adjacent document blocks. |
| 7 | Record this item under "Project and purpose": Workspace: C:\Users\jorda\OneDrive\Documents\Appraisal_Automation |
| 8 | Record this item under "Project and purpose": Platform: Windows, PowerShell, Node.js 24 or newer, npm. |
| 9 | Record this item under "Project and purpose": Application: Appraisal Desk, a local application that extracts facts from a URLA PDF and optional sales contract, then prepares an R3 AMC appraisal order in a visible Playwright Chromium window. |
| 10 | Record this item under "Project and purpose": The user reviews and submits the actual appraisal order. |
| 11 | Record this item under "Project and purpose": Stack: TypeScript, Express, HTML/CSS/JavaScript frontend, LangChain JavaScript, OpenAI Responses, Anthropic Messages, Google Gemini Generate Content, xAI Chat Completions, Zod, Playwright. |
| 12 | Record this item under "Project and purpose": Provider defaults: initial selection OpenAI with **gpt-5.6-sol**; Anthropic with **claude-opus-5**; Google Gemini with **gemini-3.8-flash**; SpaceXAI (Grok) with **grok-4.6**. |
| 13 | Record this item under "Project and purpose": No Git repository or remote was present during development. |
| 14 | Blank line separating adjacent document blocks. |
| 15 | Introduce the "User requests and completed work" section of this document. |
| 16 | Blank line separating adjacent document blocks. |
| 17 | Record this item under "User requests and completed work": Developed the application from the user's original specification, with the local frontend, PDF extraction, loan rules, browser form preparation, and human submission handoff. |
| 18 | Record this item under "User requests and completed work": Stopped the application when requested. |
| 19 | Record this item under "User requests and completed work": Changed only the application model setting to GPT-5.6 Sol when requested. |
| 20 | Record this item under "User requests and completed work": Replaced automated R3 credential entry with manual login because of CAPTCHA problems. |
| 21 | Record this item under "User requests and completed work": Diagnosed and fixed a subsequent ERR_BLOCKED_BY_CLIENT error after manual login. |
| 22 | Record this item under "User requests and completed work": Addressed the user's report of missing Loan Program/Property Type selections and the browser closing after preparation ran for a while. |
| 23 | Record this item under "User requests and completed work": Addressed empty access contact fields and the requested separate Listing Agent and Buyer's Agent sections. |
| 24 | Record this item under "User requests and completed work": Clarified that listing agent means seller's agent and updated the fictional purchase contract with explicit agents. |
| 25 | Record this item under "User requests and completed work": Confirmed the active sample's $485,000.00 sale price on pages 1 and 9, then clarified extraction/preparation instructions to retain explicit prices from unsigned/draft/sample contracts with a review warning. |
| 26 | Record this item under "User requests and completed work": Added OpenAI/Anthropic selection, a visible custom model textbox, provider-specific document/message adapters and sanitized errors. |
| 27 | Record this item under "User requests and completed work": Investigated a generic Anthropic 400/422 failure and corrected an independently confirmed outbound-schema limit violation, with more specific sanitized errors. |
| 28 | Record this item under "User requests and completed work": Added the user's fixed loan-officer details as four required approved-plan values for every order. |
| 29 | Record this item under "User requests and completed work": Added scoped recovery for a loan-officer Work Phone that does not retain the approved value after filling and blur. |
| 30 | Record this item under "User requests and completed work": Expanded that recovery to all existing mapped phone fields using each field's own approved number, preserving blank values and existing plans/mappings. |
| 31 | Record this item under "User requests and completed work": Added a bounded appraisal-product recommendation path after reviewing the new Whitmore sample PDFs, while preserving independently extracted Property Type and Occupancy. |
| 32 | Record this item under "User requests and completed work": Added Google Gemini selection with default gemini-3.8-flash, an API-key-only pinned transport, native inline PDFs, structured extraction, and sanitized errors. |
| 33 | Blank line separating adjacent document blocks. |
| 34 | Document this statement under "User requests and completed work": The user prefers narrowly scoped changes and explicitly said to leave everything else the same during the model and login changes. |
| 35 | Blank line separating adjacent document blocks. |
| 36 | Introduce the "Current manual login workflow" section of this document. |
| 37 | Blank line separating adjacent document blocks. |
| 38 | Document this statement under "Current manual login workflow": The local form collects provider, its API key, an optional visible model ID immediately below the provider selector, loan number, optional FHA case number, payment method, rush flag, required URLA PDF, and optional sales contract PDF. |
| 39 | Blank line separating adjacent document blocks. |
| 40 | Document this statement under "Current manual login workflow": R3 username and password fields have been removed from the frontend, backend input schema, environment operations, and agent tools. |
| 41 | Blank line separating adjacent document blocks. |
| 42 | Document this statement under "Current manual login workflow": The worker first extracts and validates the documents, then opens a visible isolated Chromium browser at: |
| 43 | Blank line separating adjacent document blocks. |
| 44 | Document this statement under "Current manual login workflow": https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F |
| 45 | Blank line separating adjacent document blocks. |
| 46 | Document this statement under "Current manual login workflow": The user enters credentials directly on R3, completes any CAPTCHA, and clicks Login. |
| 47 | Blank line separating adjacent document blocks. |
| 48 | Document this statement under "Current manual login workflow": During the wait: |
| 49 | Blank line separating adjacent document blocks. |
| 50 | Record this item under "Current manual login workflow": Job status is awaiting_login; the local frontend displays sign-in instructions and keeps polling. |
| 51 | Record this item under "Current manual login workflow": Refreshing the local page recovers the job through the owning session. |
| 52 | Record this item under "Current manual login workflow": Browser tools remain disabled and the single active-job lock remains held. |
| 53 | Record this item under "Current manual login workflow": Both preparation watchdogs pause. |
| 54 | Record this item under "Current manual login workflow": Closing the browser cancels pending login; the active slot is released when the worker closes. |
| 55 | Blank line separating adjacent document blocks. |
| 56 | Document this statement under "Current manual login workflow": After successful login, timers resume and the worker navigates to https://clients.r3amc.com/Orders/Create, prepares and verifies approved fields, and hands the browser to the user. |
| 57 | Blank line separating adjacent document blocks. |
| 58 | Introduce the "Latest change: SpaceXAI / Grok provider" section of this document. |
| 59 | Blank line separating adjacent document blocks. |
| 60 | Document this statement under "Latest change: SpaceXAI / Grok provider": The dropdown now includes **SpaceXAI**, using canonical provider xai and a **Grok API key**. |
| 61 | Blank line separating adjacent document blocks. |
| 62 | Document this statement under "Latest change: SpaceXAI / Grok provider": src/xai.ts uses @langchain/xai 1.4.12 ChatXAI with the pinned https://api.x.ai/v1/chat/completions endpoint. |
| 63 | Blank line separating adjacent document blocks. |
| 64 | Document this statement under "Latest change: SpaceXAI / Grok provider": The [xAI file interface](https://docs.x.ai/developers/model-capabilities/files/chat-with-files) documents uploaded IDs and public URLs. |
| 65 | Blank line separating adjacent document blocks. |
| 66 | Document this statement under "Latest change: SpaceXAI / Grok provider": Grok uses the canonical nullable extraction schema, native JSON output, and the existing narrow HTTP 400 unsupported-format fallback to a tool call on the same provider/model/key. |
| 67 | Blank line separating adjacent document blocks. |
| 68 | Document this statement under "Latest change: SpaceXAI / Grok provider": npm run check passed with exit code 0: TypeScript checking, 314 unit/integration tests across 14 files, 66 Playwright tests, and the production build (380 tests total). |
| 69 | Blank line separating adjacent document blocks. |
| 70 | Introduce the "Previous change: Google Gemini provider" section of this document. |
| 71 | Blank line separating adjacent document blocks. |
| 72 | Document this statement under "Previous change: Google Gemini provider": Google Gemini is a third visible provider, using a Google AI Studio API key and default gemini-3.8-flash when Model is blank. |
| 73 | Blank line separating adjacent document blocks. |
| 74 | Document this statement under "Previous change: Google Gemini provider": The implementation uses @langchain/google 0.2.5 ChatGoogle through src/google.ts, with platformType: 'gai'. |
| 75 | Blank line separating adjacent document blocks. |
| 76 | Document this statement under "Previous change: Google Gemini provider": Google PDFs use standard base64 file blocks converted to native inlineData, each immediately preceded by a source-document text label because the native block has no filename. |
| 77 | Blank line separating adjacent document blocks. |
| 78 | Document this statement under "Previous change: Google Gemini provider": Standard screenshot text/image blocks, existing tool-call IDs, and Google thought signatures stay in the original message history. |
| 79 | Blank line separating adjacent document blocks. |
| 80 | Introduce the "Previous change: bounded appraisal-product recommendations" section of this document. |
| 81 | Blank line separating adjacent document blocks. |
| 82 | Document this statement under "Previous change: bounded appraisal-product recommendations": The user wants the agent to choose an appropriate appraisal product. |
| 83 | Blank line separating adjacent document blocks. |
| 84 | Document this statement under "Previous change: bounded appraisal-product recommendations": Shared APPRAISAL_PRODUCT_INSTRUCTIONS now permit a tentative inspected baseline recommendation from combined facts, with supporting quotes in the existing evidence array under field productRecommendation. |
| 85 | Blank line separating adjacent document blocks. |
| 86 | Document this statement under "Previous change: bounded appraisal-product recommendations": The domain checks the recommendation marker first so malformed evidence cannot fall through to an explicit request. |
| 87 | Blank line separating adjacent document blocks. |
| 88 | Introduce the "Previous change: recovery for existing mapped phone fields" section of this document. |
| 89 | Blank line separating adjacent document blocks. |
| 90 | Document this statement under "Previous change: recovery for existing mapped phone fields": Recovery now covers exactly 19 existing approved phone keys: work/home/mobile phone keys for borrower, coBorrower, contact (access contact), listingAgent, buyerAgent, and statusContact, plus loanOfficer.workPhone only. |
| 91 | Blank line separating adjacent document blocks. |
| 92 | Document this statement under "Previous change: recovery for existing mapped phone fields": After ordinary fill/blur fails verification, try equivalent hyphenated XXX-XXX-XXXX and then parenthesized (XXX)XXX-XXXX / (XXX) XXX-XXXX formats, followed by private per-digit entry of that same number if necessary. |
| 93 | Blank line separating adjacent document blocks. |
| 94 | Introduce the "Previous change: loan-officer Work Phone recovery" section of this document. |
| 95 | Blank line separating adjacent document blocks. |
| 96 | Document this statement under "Previous change: loan-officer Work Phone recovery": The user reported that the other three loan-officer values filled while Work Phone remained blank. |
| 97 | Blank line separating adjacent document blocks. |
| 98 | Document this statement under "Previous change: loan-officer Work Phone recovery": This initial recovery applied only to loanOfficer.workPhone after normal fill and blur failed verification. |
| 99 | Blank line separating adjacent document blocks. |
| 100 | Document this statement under "Previous change: loan-officer Work Phone recovery": Two synthetic clear-on-blur/keyboard-mask regressions failed before the fix; all five focused recovery and guard tests passed afterward, including correct existing values, role changes, revocation, and stale resets. |
| 101 | Blank line separating adjacent document blocks. |
| 102 | Introduce the "Previous change: fixed loan officer" section of this document. |
| 103 | Blank line separating adjacent document blocks. |
| 104 | Document this statement under "Previous change: fixed loan officer": Always populate first name Amber, last name Coleman, work phone 702-604-7027, and email acoleman@guildmortgage.net in the loan-officer section. |
| 105 | Blank line separating adjacent document blocks. |
| 106 | Document this statement under "Previous change: fixed loan officer": Only these four loan-officer fields extend the existing bounded section/label resolver, under the exact screenshot-supported heading Is there a loan officer?. |
| 107 | Blank line separating adjacent document blocks. |
| 108 | Introduce the "Previous change: Anthropic schema compatibility and errors" section of this document. |
| 109 | Blank line separating adjacent document blocks. |
| 110 | Document this statement under "Previous change: Anthropic schema compatibility and errors": The previous outbound extraction schema contained 40 union-typed fields: 37 nullable strings and 3 nullable numbers. |
| 111 | Blank line separating adjacent document blocks. |
| 112 | Document this statement under "Previous change: Anthropic schema compatibility and errors": For Anthropic only, derive the outbound schema from the canonical schema and represent those 37 nullable text fields as required strings with empty string for unknown. |
| 113 | Blank line separating adjacent document blocks. |
| 114 | Document this statement under "Previous change: Anthropic schema compatibility and errors": Recognized credit/billing, schema, PDF, and capability rejections now have specific sanitized messages. |
| 115 | Blank line separating adjacent document blocks. |
| 116 | Introduce the "Previous change: OpenAI and Anthropic support" section of this document. |
| 117 | Blank line separating adjacent document blocks. |
| 118 | Document this statement under "Previous change: OpenAI and Anthropic support": The user may select OpenAI or Anthropic and use any suitable account-accessible model ID (up to 200 characters, no spaces/control characters). |
| 119 | Blank line separating adjacent document blocks. |
| 120 | Document this statement under "Previous change: OpenAI and Anthropic support": Clients receive the selected key explicitly and use pinned official endpoints (https://api.openai.com/v1 and https://api.anthropic.com). |
| 121 | Blank line separating adjacent document blocks. |
| 122 | Document this statement under "Previous change: OpenAI and Anthropic support": Both providers first request native JSON schema output. |
| 123 | Blank line separating adjacent document blocks. |
| 124 | Document this statement under "Previous change: OpenAI and Anthropic support": The generic worker variable APPRAISAL_AI_API_KEY replaces OPENAI_API_KEY. |
| 125 | Blank line separating adjacent document blocks. |
| 126 | Introduce the "Previous change: sale-price extraction" section of this document. |
| 127 | Blank line separating adjacent document blocks. |
| 128 | Document this statement under "Previous change: sale-price extraction": The active contract contains a purchase price of $485,000.00 in page 1's purchase-price field and page 9's Exhibit A. |
| 129 | Blank line separating adjacent document blocks. |
| 130 | Document this statement under "Previous change: sale-price extraction": The prior extraction prompt said "Use the signed contract for sale price." That restriction could suppress the price from this unsigned sample, but the actual model output from the reported run was not captured, so this is not a confirmed diagnosis of that run. |
| 131 | Blank line separating adjacent document blocks. |
| 132 | Document this statement under "Previous change: sale-price extraction": The existing write rule remains purchase plus supplied contract only; refinance or no-contract orders leave sale price blank. |
| 133 | Blank line separating adjacent document blocks. |
| 134 | Introduce the "Previous change: seller's-agent terminology and sample contract" section of this document. |
| 135 | Blank line separating adjacent document blocks. |
| 136 | Document this statement under "Previous change: seller's-agent terminology and sample contract": Listing agent and seller's agent identify the seller's representative. |
| 137 | Blank line separating adjacent document blocks. |
| 138 | Document this statement under "Previous change: seller's-agent terminology and sample contract": Use Example_Pdfs/Sample_Form_1003_URLA.pdf with the updated active Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf for the fictional purchase example. |
| 139 | Blank line separating adjacent document blocks. |
| 140 | Document this statement under "Previous change: seller's-agent terminology and sample contract": The updated contract was validated as 10 pages with all 145 interactive fields preserved. |
| 141 | Blank line separating adjacent document blocks. |
| 142 | Document this statement under "Previous change: seller's-agent terminology and sample contract": Historical npm run check passed TypeScript checking, 97 unit/integration tests across 7 files, 44 browser tests, and the production build: 141 passing tests. |
| 143 | Blank line separating adjacent document blocks. |
| 144 | Introduce the "Previous change: access and agent contacts" section of this document. |
| 145 | Blank line separating adjacent document blocks. |
| 146 | Document this statement under "Previous change: access and agent contacts": The previous refinance plan checked UseBorrowerForAccess but omitted contact.* entries, leaving R3's checkbox behavior responsible for access details. |
| 147 | Blank line separating adjacent document blocks. |
| 148 | Document this statement under "Previous change: access and agent contacts": Missing required borrower/access names emit explicit blanks while retaining missing-source metadata, so stale identities are cleared without reporting complete preparation. |
| 149 | Blank line separating adjacent document blocks. |
| 150 | Document this statement under "Previous change: access and agent contacts": Extraction now returns separate listingAgent and buyerAgent objects alongside borrower/co-borrower contacts. |
| 151 | Blank line separating adjacent document blocks. |
| 152 | Document this statement under "Previous change: access and agent contacts": No live Create-page DOM evidence or new agent-field IDs were captured for this change. |
| 153 | Blank line separating adjacent document blocks. |
| 154 | Document this statement under "Previous change: access and agent contacts": Historical npm run check passed TypeScript checking, 96 unit/integration tests across 7 files, 44 browser tests, and the production build: 140 tests in total. |
| 155 | Blank line separating adjacent document blocks. |
| 156 | Introduce the "Previous change: dropdown preparation and browser lifetime" section of this document. |
| 157 | Blank line separating adjacent document blocks. |
| 158 | Document this statement under "Previous change: dropdown preparation and browser lifetime": The user's screenshot and report showed missing Loan Program/Property Type selections and an R3 window that closed after a delay. |
| 159 | Blank line separating adjacent document blocks. |
| 160 | Document this statement under "Previous change: dropdown preparation and browser lifetime": runPreparation in src/preparation.ts now owns the lifecycle; src/worker.ts handles job and cancellation IPC. |
| 161 | Blank line separating adjacent document blocks. |
| 162 | Document this statement under "Previous change: dropdown preparation and browser lifetime": Strict complete handoff still requires fresh verification. |
| 163 | Blank line separating adjacent document blocks. |
| 164 | Document this statement under "Previous change: dropdown preparation and browser lifetime": Verification for this change passed TypeScript checking, 68 unit/integration tests across 6 files, 33 browser tests, and the production build. |
| 165 | Blank line separating adjacent document blocks. |
| 166 | Introduce the "Previous login bug: confirmed cause and fix" section of this document. |
| 167 | Blank line separating adjacent document blocks. |
| 168 | Document this statement under "Previous login bug: confirmed cause and fix": The user's screenshot showed Chromium's native error page at the original Login URL: |
| 169 | Blank line separating adjacent document blocks. |
| 170 | Document this statement under "Previous login bug: confirmed cause and fix": ERR_BLOCKED_BY_CLIENT |
| 171 | Blank line separating adjacent document blocks. |
| 172 | Document this statement under "Previous login bug: confirmed cause and fix": The application deliberately generates this error when its network guard rejects a request or redirect. |
| 173 | Blank line separating adjacent document blocks. |
| 174 | Open a literal code/command example labeled text. |
| 175 | Show this literal command, path, or recorded diagnostic step in the documentation: POST https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F. |
| 176 | Show this literal command, path, or recorded diagnostic step in the documentation: HTTP 302 -&gt; GET https://clients.r3amc.com/Account/PostLogin. |
| 177 | Show this literal command, path, or recorded diagnostic step in the documentation: application's CDP response guard: Fetch.failRequest / BlockedByClient. |
| 178 | Close the preceding literal code/command example. |
| 179 | Blank line separating adjacent document blocks. |
| 180 | Document this statement under "Previous login bug: confirmed cause and fix": The login handoff route /Account/PostLogin was missing from the allowlist. |
| 181 | Blank line separating adjacent document blocks. |
| 182 | Document this statement under "Previous login bug: confirmed cause and fix": The fix in src/browser/guard.ts allows only: |
| 183 | Blank line separating adjacent document blocks. |
| 184 | Record this item under "Previous login bug: confirmed cause and fix": The exact client portal origin and /Account/PostLogin path, with existing case/trailing-slash normalization. |
| 185 | Record this item under "Previous login bug: confirmed cause and fix": GET or HEAD navigation, with no query parameters. |
| 186 | Record this item under "Previous login bug: confirmed cause and fix": The authenticating phase. |
| 187 | Blank line separating adjacent document blocks. |
| 188 | Document this statement under "Previous login bug: confirmed cause and fix": Order POSTs remain blocked before human review. |
| 189 | Blank line separating adjacent document blocks. |
| 190 | Document this statement under "Previous login bug: confirmed cause and fix": The user then signed in again in a diagnostic browser using the rebuilt code. |
| 191 | Blank line separating adjacent document blocks. |
| 192 | Open a literal code/command example labeled text. |
| 193 | Show this literal command, path, or recorded diagnostic step in the documentation: POST /Login.aspx -&gt; HTTP 302 -&gt; GET /Account/PostLogin. |
| 194 | Show this literal command, path, or recorded diagnostic step in the documentation: GET /Account/PostLogin -&gt; HTTP 302 -&gt; GET /Orders/Search. |
| 195 | Show this literal command, path, or recorded diagnostic step in the documentation: Application result: signed_in. |
| 196 | Close the preceding literal code/command example. |
| 197 | Blank line separating adjacent document blocks. |
| 198 | Document this statement under "Previous login bug: confirmed cause and fix": The application recognized the authenticated page. |
| 199 | Blank line separating adjacent document blocks. |
| 200 | Document this statement under "Previous login bug: confirmed cause and fix": tests/browser.spec.ts contains a native redirect regression that failed before the fix and passed afterward. |
| 201 | Blank line separating adjacent document blocks. |
| 202 | Document this statement under "Previous login bug: confirmed cause and fix": Do not assume all other redirect variants are supported. |
| 203 | Blank line separating adjacent document blocks. |
| 204 | Introduce the "Important architecture and files" section of this document. |
| 205 | Blank line separating adjacent document blocks. |
| 206 | Document this statement under "Important architecture and files": All paths below are relative to the workspace. |
| 207 | Blank line separating adjacent document blocks. |
| 208 | Provide the table columns/row under "Important architecture and files": File; Responsibility. |
| 209 | Separate the table header from its rows and specify Markdown column alignment. |
| 210 | Provide the table columns/row under "Important architecture and files": `public/index.html`, `public/app.js`, `public/styles.css`; Local form, progress display, session recovery, human login/review prompts. |
| 211 | Provide the table columns/row under "Important architecture and files": `src/app.ts`, `src/server.ts`; Loopback Express server, sessions, CSRF, upload validation, job endpoints. |
| 212 | Provide the table columns/row under "Important architecture and files": `src/domain.ts`; Default model, input schema, job types, deterministic loan rules and field plan. |
| 213 | Provide the table columns/row under "Important architecture and files": `src/extraction.ts`; Explicit provider/model clients, native PDF blocks, structured output with narrow same-model format retry. |
| 214 | Provide the table columns/row under "Important architecture and files": `src/model-messages.ts`; Provider adaptation of recognized screenshot tool messages. |
| 215 | Provide the table columns/row under "Important architecture and files": `src/environment.ts`, `scripts/environment.ps1`; Fixed PowerShell environment operations for API key and loan settings. |
| 216 | Provide the table columns/row under "Important architecture and files": `src/jobs.ts`; Isolated worker lifecycle, owner-scoped status, single-job lock, parent watchdog. |
| 217 | Provide the table columns/row under "Important architecture and files": `src/worker.ts`; Worker job and `stop_preparation` IPC handling. |
| 218 | Provide the table columns/row under "Important architecture and files": `src/preparation.ts`; `runPreparation`: extraction, validation, manual login, deterministic fill, optional model reconciliation, verification, complete/incomplete handoff, cleanup. |
| 219 | Provide the table columns/row under "Important architecture and files": `src/pausable-timeout.ts`; Pause/resume helper preserving remaining active processing time. |
| 220 | Provide the table columns/row under "Important architecture and files": `src/agent.ts`, `src/system-prompt.ts`; Bounded LangChain preparation workflow; manual login is completed before agent execution. |
| 221 | Provide the table columns/row under "Important architecture and files": `src/browser/session.ts`; Headed browser, manual authentication wait, network enforcement, bounded field tools, review handoff. |
| 222 | Provide the table columns/row under "Important architecture and files": `src/browser/guard.ts`; Request and URL policy, including the confirmed PostLogin fix. |
| 223 | Provide the table columns/row under "Important architecture and files": `src/browser/r3-fields.ts`; Previously inspected R3 field IDs, labels and baseline products; bounded section/label resolver for the two new agent sections. |
| 224 | Provide the table columns/row under "Important architecture and files": `tests/*.test.ts`, `tests/*.spec.ts`; Unit/integration and synthetic browser tests. |
| 225 | Provide the table columns/row under "Important architecture and files": `README.md`, `docs/security-review.md`; Setup, architecture, development evidence and limitations. |
| 226 | Blank line separating adjacent document blocks. |
| 227 | Document this statement under "Important architecture and files": output/playwright/diagnose-login.mjs is a diagnostic helper, separate from the app. |
| 228 | Blank line separating adjacent document blocks. |
| 229 | Introduce the "Existing protections and behavior to preserve" section of this document. |
| 230 | Blank line separating adjacent document blocks. |
| 231 | Record this item under "Existing protections and behavior to preserve": Local server binds to 127.0.0.1:3000 by default; Host/Origin checks, session ownership, CSRF protection, and one active job are implemented. |
| 232 | Record this item under "Existing protections and behavior to preserve": PDFs are bounded to 15 MiB each and processed in memory. |
| 233 | Record this item under "Existing protections and behavior to preserve": Worker and Chromium environments are allowlisted to avoid inheriting unrelated credentials, tracing, proxies, or preload hooks. |
| 234 | Record this item under "Existing protections and behavior to preserve": PowerShell receives literal JSON over stdin; submitted values are not interpolated into executable shell commands. |
| 235 | Record this item under "Existing protections and behavior to preserve": The selected provider's API key is consumed privately by backend code through APPRAISAL_AI_API_KEY; model tool results expose only availability for secrets. |
| 236 | Record this item under "Existing protections and behavior to preserve": All four providers use structured extraction with local Zod validation; OpenAI Responses requests set store: false, while Anthropic, Google, and Grok omit unsupported storage flags. |
| 237 | Record this item under "Existing protections and behavior to preserve": During manual authentication, native Chromium networking preserves normal login/cookie/CAPTCHA behavior. |
| 238 | Record this item under "Existing protections and behavior to preserve": During preparation, writes are denied and dynamic reads are limited to inspected lookup routes. |
| 239 | Record this item under "Existing protections and behavior to preserve": Form values come from an immutable server-approved plan. |
| 240 | Record this item under "Existing protections and behavior to preserve": At complete or incomplete handoff, new and queued agent tools are disabled and in-flight actions are drained before writes become available to the user. |
| 241 | Blank line separating adjacent document blocks. |
| 242 | Introduce the "Business rules already implemented" section of this document. |
| 243 | Blank line separating adjacent document blocks. |
| 244 | Record this item under "Business rules already implemented": Loan number must match ^685-20\d{5}$. |
| 245 | Record this item under "Business rules already implemented": VA loans are rejected with instructions to use the VA portal. |
| 246 | Record this item under "Business rules already implemented": FHA/FHA Zero Down require the separately entered FHA case number. |
| 247 | Record this item under "Business rules already implemented": Supported URLA program classification sets R3 Loan Type; free-form rate/type text cannot override it. |
| 248 | Record this item under "Business rules already implemented": Branch is GUILD 685 SUMMERLIN ONE; status contact is Amber Coleman Team. |
| 249 | Record this item under "Business rules already implemented": Loan officer is always first name Amber, last name Coleman, work phone 702-604-7027, and email acoleman@guildmortgage.net; these required constants do not come from extraction. |
| 250 | Record this item under "Business rules already implemented": Sale price is populated only for a purchase with a supplied contract. |
| 251 | Record this item under "Business rules already implemented": Refinance access explicitly uses the borrower's values, filled and verified after borrower fields and the borrower-access checkbox. |
| 252 | Record this item under "Business rules already implemented": Listing agent means seller's agent. |
| 253 | Record this item under "Business rules already implemented": Explicitly designated fields remain blank or unchecked as specified in domain.ts and the maintenance skill. |
| 254 | Record this item under "Business rules already implemented": Product means appraisal service/form, not mortgage financing. |
| 255 | Blank line separating adjacent document blocks. |
| 256 | Introduce the "Verification and current runtime context" section of this document. |
| 257 | Blank line separating adjacent document blocks. |
| 258 | Document this statement under "Verification and current runtime context": Historical npm run check after the PostLogin fix, September 9, 2026: |
| 259 | Blank line separating adjacent document blocks. |
| 260 | Record this item under "Verification and current runtime context": TypeScript checking passed. |
| 261 | Record this item under "Verification and current runtime context": 34 unit/integration tests passed across 5 files. |
| 262 | Record this item under "Verification and current runtime context": 25 Playwright browser tests passed. |
| 263 | Record this item under "Verification and current runtime context": Production build passed. |
| 264 | Record this item under "Verification and current runtime context": Total: **59 passing tests**. |
| 265 | Blank line separating adjacent document blocks. |
| 266 | Document this statement under "Verification and current runtime context": The real user-assisted manual login and authenticated-page recognition also passed after the PostLogin fix. |
| 267 | Blank line separating adjacent document blocks. |
| 268 | Document this statement under "Verification and current runtime context": Historical local verification after the dropdown and incomplete-review fix, September 9, 2026: |
| 269 | Blank line separating adjacent document blocks. |
| 270 | Record this item under "Verification and current runtime context": TypeScript checking passed. |
| 271 | Record this item under "Verification and current runtime context": 68 unit/integration tests passed across 6 files. |
| 272 | Record this item under "Verification and current runtime context": 33 Playwright browser tests passed. |
| 273 | Record this item under "Verification and current runtime context": Production build passed, including dist/preparation.js. |
| 274 | Record this item under "Verification and current runtime context": Total: **101 passing tests**. |
| 275 | Blank line separating adjacent document blocks. |
| 276 | Document this statement under "Verification and current runtime context": These results are separate from the historical 59-test result above. |
| 277 | Blank line separating adjacent document blocks. |
| 278 | Document this statement under "Verification and current runtime context": Historical npm run check after the contact changes completed with exit code 0: |
| 279 | Blank line separating adjacent document blocks. |
| 280 | Record this item under "Verification and current runtime context": TypeScript checking passed. |
| 281 | Record this item under "Verification and current runtime context": 96 unit/integration tests passed across 7 files. |
| 282 | Record this item under "Verification and current runtime context": 44 Playwright browser tests passed. |
| 283 | Record this item under "Verification and current runtime context": Production build passed. |
| 284 | Record this item under "Verification and current runtime context": Total: **140 passing tests**. |
| 285 | Blank line separating adjacent document blocks. |
| 286 | Document this statement under "Verification and current runtime context": These results are separate from both historical totals above. |
| 287 | Blank line separating adjacent document blocks. |
| 288 | Document this statement under "Verification and current runtime context": The seller's-agent wording and sample-contract update passed historical npm run check with exit code 0: TypeScript checking, 97 unit/integration tests across 7 files, 44 browser tests, and the production build, for **141 passing tests**. |
| 289 | Blank line separating adjacent document blocks. |
| 290 | Document this statement under "Verification and current runtime context": Historical npm run check passed TypeScript checking, 105 unit/integration tests across 7 files, 47 browser tests, and the production build: 152 passing tests. |
| 291 | Blank line separating adjacent document blocks. |
| 292 | Document this statement under "Verification and current runtime context": The provider-selection npm run check exited successfully: TypeScript checking, 143 unit/integration tests across 9 files, 49 Playwright browser tests, and the production build passed (192 tests total). |
| 293 | Blank line separating adjacent document blocks. |
| 294 | Document this statement under "Verification and current runtime context": During the earlier login diagnosis, the user had restarted the application and one server was listening on port 3000; the agent left it untouched and closed only its diagnostic browsers. |
| 295 | Blank line separating adjacent document blocks. |
| 296 | Document this statement under "Verification and current runtime context": Useful commands, from the workspace: |
| 297 | Blank line separating adjacent document blocks. |
| 298 | Open a literal code/command example labeled powershell. |
| 299 | Show this literal command, path, or recorded diagnostic step in the documentation: npm run check. |
| 300 | Show this literal command, path, or recorded diagnostic step in the documentation: npm run build. |
| 301 | Show this literal command, path, or recorded diagnostic step in the documentation: npm start. |
| 302 | Close the preceding literal code/command example. |
| 303 | Blank line separating adjacent document blocks. |
| 304 | Document this statement under "Verification and current runtime context": npm run dev runs the TypeScript server; npm run browsers:install installs Chromium when needed. |
| 305 | Blank line separating adjacent document blocks. |
| 306 | Introduce the "Maintenance skill and original specification" section of this document. |
| 307 | Blank line separating adjacent document blocks. |
| 308 | Record this item under "Maintenance skill and original specification": Project skill source: skills\appraisal-automation\SKILL.md. |
| 309 | Record this item under "Maintenance skill and original specification": Installed matching copy: C:\Users\jorda\.codex\skills\appraisal-automation\SKILL.md. |
| 310 | Record this item under "Maintenance skill and original specification": The source and installed copy were synchronized for provider selection. |
| 311 | Record this item under "Maintenance skill and original specification": The skill records both provider defaults and adapters, manual-login workflow, business invariants, submission boundary, PostLogin diagnosis guidance, deterministic fill, safe incomplete handoff on timeout, and contact-role mapping constraints. |
| 312 | Record this item under "Maintenance skill and original specification": The original user-pasted specification was supplied at C:\Users\jorda\.codex\attachments\0997fee2-3c43-469e-98e5-d84f64a2a027\pasted-text.txt. |
| 313 | Blank line separating adjacent document blocks. |
| 314 | Document this statement under "Maintenance skill and original specification": No API keys, R3 credentials, browser authentication state, or customer documents are included in this handoff. |
