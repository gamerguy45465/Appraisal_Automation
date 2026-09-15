# Line explanations: docs/security-review.md

Source: [docs/security-review.md](../../security-review.md). Numbers refer to the original file before comments were added.

The original file was unchanged during annotation. Later login-entry and PostLogon sections explain HTTP error handling, the root-only return destination, unchanged authentication/submission boundaries, and separate fixture/live evidence. The table below describes the historical annotation snapshot.

| Original line | Explanation |
| ---: | --- |
| 1 | Introduce the "Security review" section of this document. |
| 2 | Blank line separating adjacent document blocks. |
| 3 | Document this statement under "Security review": This implementation was reviewed against the [OWASP Top 10:2025](https://owasp.org/Top10/2025/) with emphasis on a local Windows application handling mortgage documents and authenticated browser automation. |
| 4 | Blank line separating adjacent document blocks. |
| 5 | Provide the table columns/row under "Security review": OWASP category; Application treatment. |
| 6 | Separate the table header from its rows and specify Markdown column alignment. |
| 7 | Provide the table columns/row under "Security review": A01 Broken Access Control; Bind to loopback; validate Host/Origin; require the local session and CSRF token for writes; restrict job access to its session. Automation resumes only after a confirmed authenticated R3 URL, and browser tools validate the order-page destination before observing or filling fields.. |
| 8 | Provide the table columns/row under "Security review": A02 Security Misconfiguration; Use restrictive security headers, local assets, no public CORS, no debug response stacks, and no network exposure setting. Disable inherited external tracing for mortgage data.. |
| 9 | Provide the table columns/row under "Security review": A03 Software Supply Chain Failures; Install dependencies with npm, retain the lockfile, use reproducible installation, and review dependency audit findings. Recheck changed dependencies instead of assuming a prior clean audit remains current.. |
| 10 | Provide the table columns/row under "Security review": A04 Cryptographic Failures; OpenAI, Anthropic, Google Gemini, xAI, and R3 connections use HTTPS with certificate verification. Provider clients receive an explicit key and pinned official endpoint. Google's transport rejects redirects and ignores ambient Cloud credentials. Form traffic is restricted to loopback. Keep the selected key in process memory rather than persistent environment scopes or plaintext application files; R3 credentials are entered directly on R3 and are not collected by the local application.. |
| 11 | Provide the table columns/row under "Security review": A05 Injection; Validate inputs and PDF signatures; pass secrets as data to fixed PowerShell code; render status text without HTML interpolation. Treat uploaded documents and page content as untrusted data. Do not expose arbitrary JavaScript, shell execution, or submission tools to the agent.. |
| 12 | Provide the table columns/row under "Security review": A06 Insecure Design; Deterministic VA/FHA/purchase rules precede browser work. Tool restrictions enforce human-only order submission; prompt text is not the only control. One active job and bounded model/tool execution limit concurrent cost and state confusion.. |
| 13 | Provide the table columns/row under "Security review": A07 Authentication Failures; The user completes R3 sign-in, CAPTCHA, and additional authentication in the visible browser. No R3 credential fields, environment operations, or login tools exist in the application. Agent observations and mutations remain unavailable until authenticated order-page preparation begins.. |
| 14 | Provide the table columns/row under "Security review": A08 Software or Data Integrity Failures; Validate model output against a structured schema and business rules. Check the exact R3 create-order URL; fill only the immutable approved plan. Appraisal recommendations use cited source facts, inspected program-matching products, and a mandatory property/lender-requirements review warning without changing uncertain property facts. Restrict runtime reads to inspected page/static/lookup routes and reject unknown or ambiguous browser targets.. |
| 15 | Provide the table columns/row under "Security review": A09 Security Logging and Alerting Failures; Report meaningful stages and sanitized, provider-aware errors, without credentials, document content, raw provider errors, or session identifiers. This local tool has no centralized security alerting service.. |
| 16 | Provide the table columns/row under "Security review": A10 Mishandling of Exceptional Conditions; Bound uploads, model calls, browser operations, and active jobs. Pause preparation watchdogs during manual sign-in, resume their remaining execution budgets afterward, and retain the single-job lock throughout. The parent watchdog requests cancellation over IPC instead of killing the worker. Interrupted order preparation stops automation and hands the partial form to the user with explicit warnings while keeping the browser open. Closing the login window cancels the job. Use typed errors and cleanup; distinguish uncertain order results from confirmed R3 acceptance.. |
| 17 | Blank line separating adjacent document blocks. |
| 18 | Introduce the "Trust and residual risk" section of this document. |
| 19 | Blank line separating adjacent document blocks. |
| 20 | Document this statement under "Trust and residual risk": The local form selects openai, anthropic, google, or xai and sends canonical provider, apiKey, and model fields. |
| 21 | Blank line separating adjacent document blocks. |
| 22 | Document this statement under "Trust and residual risk": Native JSON schema output is attempted first for all four providers. |
| 23 | Blank line separating adjacent document blocks. |
| 24 | Document this statement under "Trust and residual risk": src/google.ts constructs @langchain/google 0.2.5 ChatGoogle with platformType: 'gai' and a custom API-key-only apiClient. |
| 25 | Blank line separating adjacent document blocks. |
| 26 | Document this statement under "Trust and residual risk": Google RequestError uses numeric statusCode and private data.error details and may retain a key-bearing URL. |
| 27 | Blank line separating adjacent document blocks. |
| 28 | Document this statement under "Trust and residual risk": Anthropic's outbound extraction schema is derived from the canonical schema: its 37 nullable text fields become required strings using empty string for unknown, while the three nullable numeric fields remain unchanged. |
| 29 | Blank line separating adjacent document blocks. |
| 30 | Document this statement under "Trust and residual risk": The model sees document content and relevant order-form observations. |
| 31 | Blank line separating adjacent document blocks. |
| 32 | Document this statement under "Trust and residual risk": The deterministic fill pass runs before optional model reconciliation and uses the immutable approved plan. |
| 33 | Blank line separating adjacent document blocks. |
| 34 | Document this statement under "Trust and residual risk": Contact extraction requests field-specific source evidence and explicit agent-role evidence. |
| 35 | Blank line separating adjacent document blocks. |
| 36 | Document this statement under "Trust and residual risk": Missing required borrower/access names produce explicit blank plan values while retaining missing-source metadata, clearing stale identities without claiming completeness. |
| 37 | Blank line separating adjacent document blocks. |
| 38 | Document this statement under "Trust and residual risk": Listing Agent, Buyer's Agent, and four requested loan-officer fields use a bounded semantic resolver: exact screenshot-supported nearest section heading and field label, a visible text input, the OrderItemEdit_ ID shape, and one unique candidate. |
| 39 | Blank line separating adjacent document blocks. |
| 40 | Document this statement under "Trust and residual risk": The loan officer is a user-authorized constant in the immutable approved plan: first name Amber, last name Coleman, work phone 702-604-7027, and email acoleman@guildmortgage.net. |
| 41 | Blank line separating adjacent document blocks. |
| 42 | Document this statement under "Trust and residual risk": Phone recovery is limited to exactly 19 existing mapped and approved phone keys: work/home/mobile keys for borrower, coBorrower, contact, listingAgent, buyerAgent, and statusContact, plus loanOfficer.workPhone only. |
| 43 | Blank line separating adjacent document blocks. |
| 44 | Document this statement under "Trust and residual risk": Complete handoff requires fresh verification. |
| 45 | Blank line separating adjacent document blocks. |
| 46 | Document this statement under "Trust and residual risk": Appraisal Product has three paths. |
| 47 | Blank line separating adjacent document blocks. |
| 48 | Document this statement under "Trust and residual risk": Recommendations may consider combined one-unit/site-built facts and absence of contrary project/structure information without asserting Single Family as an extracted fact. |
| 49 | Blank line separating adjacent document blocks. |
| 50 | Document this statement under "Trust and residual risk": PowerShell Process environment changes cannot update the parent Node worker. |
| 51 | Blank line separating adjacent document blocks. |
| 52 | Document this statement under "Trust and residual risk": Clearing the preparation environment also revokes its helpers. |
| 53 | Blank line separating adjacent document blocks. |
| 54 | Document this statement under "Trust and residual risk": PDFs are sent inline from memory: OpenAI input_file blocks, Anthropic document.source blocks, or Google standard base64 file blocks converted to native inlineData. |
| 55 | Blank line separating adjacent document blocks. |
| 56 | Document this statement under "Trust and residual risk": In-memory uploads avoid application-managed document files, but do not guarantee zero copies in OS memory, swap, crash reports, temporary browser data, or provider systems. |
| 57 | Blank line separating adjacent document blocks. |
| 58 | Introduce the "Acceptance still required" section of this document. |
| 59 | Blank line separating adjacent document blocks. |
| 60 | Document this statement under "Acceptance still required": The authenticated R3 create-order page and its inline scripts were inspected read-only. |
| 61 | Blank line separating adjacent document blocks. |
| 62 | Document this statement under "Acceptance still required": Development verification on September 8, 2026: npm audit --omit=dev reported zero known vulnerabilities in production dependencies; TypeScript checking, the production build, and all 28 unit/integration tests passed. |
| 63 | Blank line separating adjacent document blocks. |
| 64 | Document this statement under "Acceptance still required": Historical local verification of the September 9 dropdown and incomplete-review fix passed TypeScript checking, all 68 unit/integration tests across 6 files, all 33 browser tests, and the production build: 101 passing tests in total. |
| 65 | Blank line separating adjacent document blocks. |
| 66 | Document this statement under "Acceptance still required": Historical npm run check for the subsequent contact changes passed TypeScript checking, all 96 unit/integration tests across 7 files, all 44 browser tests, and the production build: 140 passing tests in total. |
| 67 | Blank line separating adjacent document blocks. |
| 68 | Document this statement under "Acceptance still required": The earlier sale-price fix passed 152 tests before provider support changed. |
| 69 | Blank line separating adjacent document blocks. |
| 70 | Document this statement under "Acceptance still required": The later Anthropic schema/error-message fix passed historical npm run check with exit code 0: TypeScript checking, 171 unit/integration tests across 11 files, 49 Playwright tests, and the production build (220 tests total). |
| 71 | Blank line separating adjacent document blocks. |
| 72 | Document this statement under "Acceptance still required": The fixed loan-officer plan and mapping update passed historical npm run check with exit code 0: TypeScript checking, 172 unit/integration tests across 11 files, 52 Playwright tests, and the production build (224 tests total). |
| 73 | Blank line separating adjacent document blocks. |
| 74 | Document this statement under "Acceptance still required": The initial scoped Work Phone recovery passed historical npm run check with exit code 0: TypeScript checking, 172 unit/integration tests across 11 files, 57 Playwright tests, and the production build (229 tests total). |
| 75 | Blank line separating adjacent document blocks. |
| 76 | Document this statement under "Acceptance still required": For the expansion to all existing mapped phone fields, historical npm run check passed with exit code 0: TypeScript checking, 176 unit/integration tests across 11 files, all 60 Playwright tests, and the production build (236 tests total). |
| 77 | Blank line separating adjacent document blocks. |
| 78 | Document this statement under "Acceptance still required": The bounded product-recommendation update passed historical npm run check with exit code 0: TypeScript checking, 195 unit/integration tests across 11 files, all 62 Playwright tests, and the production build (257 tests total). |
| 79 | Blank line separating adjacent document blocks. |
| 80 | Document this statement under "Acceptance still required": The Google Gemini integration passed its full local check. |
| 81 | Blank line separating adjacent document blocks. |
| 82 | Document this statement under "Acceptance still required": Restart the local application and refresh its page after this update: canonical provider/apiKey fields and the APPRAISAL_AI_API_KEY worker variable replace the previous API/environment contract, so a new frontend with an old running server can fail. |
| 83 | Blank line separating adjacent document blocks. |
| 84 | Introduce the "SpaceXAI / Grok change" section of this document. |
| 85 | Blank line separating adjacent document blocks. |
| 86 | Document this statement under "SpaceXAI / Grok change": src/xai.ts uses LangChain ChatXAI and a fixed xAI Chat Completions endpoint. |
| 87 | Blank line separating adjacent document blocks. |
| 88 | Document this statement under "SpaceXAI / Grok change": Grok documents are rendered locally in memory through PDF.js and native canvas, without public URLs or Files API uploads. |
| 89 | Blank line separating adjacent document blocks. |
| 90 | Document this statement under "SpaceXAI / Grok change": The canonical schema and loan rules are unchanged. |
| 91 | Blank line separating adjacent document blocks. |
| 92 | Document this statement under "SpaceXAI / Grok change": npm run check passed with exit code 0: TypeScript checking, 314 unit/integration tests across 14 files, 66 Playwright tests, and the production build (380 tests total). |
