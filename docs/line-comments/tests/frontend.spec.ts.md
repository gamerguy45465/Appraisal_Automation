# Line explanations: tests/frontend.spec.ts

Source: [tests/frontend.spec.ts](../../../tests/frontend.spec.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { createServer, type Server } from "node:http" for these regression tests. |
| 2 | Import { readFile } from "node:fs/promises" for these regression tests. |
| 3 | Import { resolve } from "node:path" for these regression tests. |
| 4 | Import { test, expect, type Page } from "@playwright/test" for these regression tests. |
| 5 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 6 | Configure Playwright to use the browser channel named by PLAYWRIGHT_CHANNEL when one is supplied. |
| 7 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 8 | Declare `CSRF_TOKEN` as "test-session-csrf-token". |
| 9 | Declare `SESSION_DEFAULTS` as an object containing csrfToken: `CSRF_TOKEN`, defaultProvider: "openai", modelDefaults: an object containing openai: "gpt-5.6-sol", anthropic: "claude-opus-5", google: "gemini-3.8-flash", xai: "grok-4.6". |
| 10 | Declare `TEST_JOB` as an object containing id: "test-job-001", status: "queued", message: "Your order is queued.". |
| 11 | Declare `PDF_FIXTURE` as an object containing name: "test-urla.pdf", mimeType: "application/pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nTest fixture\n%%EOF". |
| 12 | Declare `server` for assignment later. |
| 13 | Declare `origin` for assignment later. |
| 14 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 15 | Start the shared local static fixture server once before the frontend browser tests. |
| 16 | Declare `files` as an object whose fields are defined below. |
| 17 | Set fixture property `'/'` to an object containing name: "index.html", contentType: "text/html; charset=utf-8". |
| 18 | Set fixture property `'/styles.css'` to an object containing name: "styles.css", contentType: "text/css; charset=utf-8". |
| 19 | Set fixture property `'/app.js'` to an object containing name: "app.js", contentType: "application/javascript; charset=utf-8". |
| 20 | Close the fixture object for `files` and finish the surrounding syntax. |
| 21 | Assign the result of `createServer` using a callback whose body follows to `server`. |
| 22 | Declare `file` as `files[request.url ?? '']`. |
| 23 | Run the following branch when the negation of `file`. |
| 24 | Finish requests for unknown fixture paths with HTTP 404. |
| 25 | Return immediately without a value. |
| 26 | Close the callback or control-flow body and finish the surrounding syntax. |
| 27 | Start reading the requested public asset asynchronously and attach response/error handlers; void intentionally discards the handled promise. |
| 28 | Send the public asset bytes with HTTP 200 and the mapped content type. |
| 29 | If the asynchronous local fixture request handler fails, finish the HTTP response with status 500. |
| 30 | Close the callback or control-flow body and finish the surrounding syntax. |
| 31 | Wait for a new `Promise` instance initialized with a callback whose body follows to settle before continuing. |
| 32 | Reject server startup if its one-time error event fires before listening succeeds. |
| 33 | Bind the fixture server to an available ephemeral IPv4 loopback port and resolve startup when it is listening. |
| 34 | Close the callback or control-flow body and finish the surrounding syntax. |
| 35 | Declare `address` as the result of `server.address` with no arguments. |
| 36 | Run the following branch when the negation of `address` or `typeof address` strictly equals "string". Throw a new `Error` instance initialized with "The UI fixture server did not bind to a port." to simulate or report the failure. |
| 37 | Build the fixture origin from the actual loopback port assigned by the operating system. |
| 38 | Close the callback or control-flow body and finish the surrounding syntax. |
| 39 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 40 | Call `test.afterAll` with a promise-returning callback whose body follows. |
| 41 | Wait for a new `Promise` instance initialized with a callback that returns the result of `server.close` using a callback that returns `error ? reject(error) : resolveClose()` to settle before continuing. |
| 42 | Close the callback or control-flow body and finish the surrounding syntax. |
| 43 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 44 | Call `test.beforeEach` with a promise-returning callback whose body follows. |
| 45 | Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 46 | Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 47 | Close the callback or control-flow body and finish the surrounding syntax. |
| 48 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 49 | Define helper `openAndFillOrder` with parameters page for the fixture operations below. |
| 50 | Navigate `page` to `origin`. Wait for completion before continuing. |
| 51 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle. |
| 52 | Replace the matched form control text with "test-secret-api-key". Wait for completion before continuing. |
| 53 | Replace the matched form control text with "685-2012345". Wait for completion before continuing. |
| 54 | Call `page.getByLabel('URLA', { exact: false }).setInputFiles` with `PDF_FIXTURE`. Wait for completion before continuing. |
| 55 | Close the callback or control-flow body for `openAndFillOrder` and finish the surrounding syntax. |
| 56 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 57 | Register a test that "sends CSRF-protected multipart data without R3 credentials and clears the API key after acceptance". |
| 58 | Declare `headers` as an empty object. |
| 59 | Declare `uploadedBody` as "". |
| 60 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 61 | Assign the result of `route.request().headers` with no arguments to `headers`. |
| 62 | Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`. |
| 63 | Answer the intercepted browser request with an object containing status: 202, json: an object containing job: `TEST_JOB`. Wait for completion before continuing. |
| 64 | Close the callback or control-flow body and finish the surrounding syntax. |
| 65 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 66 | Assert that the result of `page.locator` using "[name=\"username\"], [name=\"password\"]" has this many matching elements: 0. Wait for the asynchronous assertion to settle. |
| 67 | Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" has form value "openai". Wait for the asynchronous assertion to settle. |
| 68 | Assert that the result of `page.locator` using "#provider option" has text an array containing "OpenAI", "Anthropic", "Google", "SpaceXAI". Wait for the asynchronous assertion to settle. |
| 69 | Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false is visible. Wait for the asynchronous assertion to settle. |
| 70 | Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 71 | Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has the specified attribute/value "placeholder", "gpt-5.6-sol". Wait for the asynchronous assertion to settle. |
| 72 | Assert that the resolved value from `page.locator('#provider').evaluate` using a callback that returns the result of `element.closest('.field')?.nextElementSibling?.contains` using `document.getElementById('model')` strictly equals true. |
| 73 | Call `page.getByLabel('Payment method').selectOption` with "Request Payment From The Borrower". Wait for completion before continuing. |
| 74 | Call `page.getByLabel('This is a rush order').check` without arguments. Wait for completion before continuing. |
| 75 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 76 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 77 | Assert that `headers['x-csrf-token']` strictly equals `CSRF_TOKEN`. |
| 78 | Assert that `headers['content-type']` contains "multipart/form-data; boundary=". |
| 79 | Assert that `uploadedBody` contains "name=\"provider\"\r\n\r\nopenai". |
| 80 | Assert that `uploadedBody` contains "name=\"apiKey\"\r\n\r\ntest-secret-api-key". |
| 81 | Assert that `uploadedBody` does not satisfy: contains "name=\"openaiApiKey\"". |
| 82 | Assert that `uploadedBody` matches `/name="model"\r\n\r\n\r\n--/`. |
| 83 | Assert that `uploadedBody` contains "name=\"loanNumber\"\r\n\r\n685-2012345". |
| 84 | Assert that `uploadedBody` contains "Request Payment From The Borrower". |
| 85 | Assert that `uploadedBody` contains "name=\"rushOrder\"\r\n\r\ntrue". |
| 86 | Assert that `uploadedBody` contains "filename=\"test-urla.pdf\"". |
| 87 | Assert that `uploadedBody` does not satisfy: contains "name=\"username\"". |
| 88 | Assert that `uploadedBody` does not satisfy: contains "name=\"password\"". |
| 89 | Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 90 | Assert that the result of `page.getByLabel` using "URLA", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 91 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 92 | Declare `stored` as the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }`. |
| 93 | Assert that `stored` deeply equals an object containing local: an empty object, session: an object containing 'appraisal-desk-active-job': `TEST_JOB.id`. |
| 94 | Close the callback or control-flow body and finish the surrounding syntax. |
| 95 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 96 | Iterate const { provider, name, defaultModel } over an array containing an object containing provider: "anthropic", name: "Anthropic", defaultModel: "claude-opus-5", an object containing provider: "google", name: "Google Gemini", defaultModel: "gemini-3.8-flash", an object containing provider: "xai", name: "Grok", defaultModel: "grok-4.6". |
| 97 | Set fixture property `provider` to "anthropic". Set fixture property `name` to "Anthropic". Set fixture property `defaultModel` to "claude-opus-5". |
| 98 | Set fixture property `provider` to "google". Set fixture property `name` to "Google Gemini". Set fixture property `defaultModel` to "gemini-3.8-flash". |
| 99 | Set fixture property `provider` to "xai". Set fixture property `name` to "Grok". Set fixture property `defaultModel` to "grok-4.6". |
| 100 | Call `test` with text interpolating `name`, a promise-returning callback whose body follows. |
| 101 | Declare `uploadedBody` as "". |
| 102 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 103 | Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`. |
| 104 | Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller. |
| 105 | Close the callback or control-flow body and finish the surrounding syntax. |
| 106 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 107 | Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `provider`. Wait for completion before continuing. |
| 108 | Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 109 | Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has the specified attribute/value "placeholder", text interpolating `name`. Wait for the asynchronous assertion to settle. |
| 110 | Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 111 | Assert that the result of `page.getByLabel` using "Model ID", an object containing exact: false has the specified attribute/value "placeholder", `defaultModel`. Wait for the asynchronous assertion to settle. |
| 112 | Assert that the result of `page.locator` using "#model-help" contains text text interpolating `defaultModel`. Wait for the asynchronous assertion to settle. |
| 113 | Assert that the result of `page.locator` using "#api-key-help" contains text text interpolating "xAI" when `provider` strictly equals "xai", otherwise `name`. Wait for the asynchronous assertion to settle. |
| 114 | Assert that the result of `page.locator` using "#api-key-help" does not satisfy: contains text "OpenAI". Wait for the asynchronous assertion to settle. |
| 115 | Run the following branch when `provider` strictly equals "google". Assert that the result of `page.locator` using "#api-key-help" contains text "data handling depend on your Google account settings and Google's terms". Wait for the asynchronous assertion to settle. |
| 116 | Replace the matched form control text with text interpolating `provider`. Wait for completion before continuing. |
| 117 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 118 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 119 | Assert that `uploadedBody` contains text interpolating `provider`. |
| 120 | Assert that `uploadedBody` contains text interpolating `provider`. |
| 121 | Assert that `uploadedBody` does not satisfy: contains "test-secret-api-key". |
| 122 | Assert that `uploadedBody` matches `/name="model"\r\n\r\n\r\n--/`. |
| 123 | Assert that the result of `page.getByLabel` using text interpolating `name`, an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 124 | Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" is disabled. Wait for the asynchronous assertion to settle. |
| 125 | Close the callback or control-flow body and finish the surrounding syntax. |
| 126 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 127 | Iterate const provider over an array containing "anthropic", "google", "xai". |
| 128 | Declare `expired` as true. |
| 129 | Declare `uploadedBody` as "". |
| 130 | Declare `sessionReads` as 0. |
| 131 | Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 132 | Assign 1 to `sessionReads`, using +=. |
| 133 | Return the result of `route.fulfill` using an object whose fields are defined below to the caller. |
| 134 | Set fixture property `modelDefaults` to an object containing values copied from `SESSION_DEFAULTS.modelDefaults`, [provider]: text interpolating `provider` when `sessionReads` is greater than 1, otherwise `SESSION_DEFAULTS.modelDefaults[provider]`. |
| 135 | Close the callback or control-flow body and finish the surrounding syntax. |
| 136 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 137 | Assign the result of `route.request().postDataBuffer()?.toString` using "utf8" or, if null/undefined, "" to `uploadedBody`. |
| 138 | Return the result of `route.fulfill` using an object containing status: 403, json: an object containing error: `{ message: 'Session expired.' }` when `expired`, otherwise an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller. |
| 139 | Set fixture property `status` to 403. Set fixture property `json` to an object containing error: an object containing message: "Session expired.". |
| 140 | Set fixture property `status` to 202. Set fixture property `json` to an object containing job: `TEST_JOB`. |
| 141 | Close the callback or control-flow body and finish the surrounding syntax. |
| 142 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 143 | Declare `model` as the result of `page.getByLabel` using "Model ID", an object containing exact: false. |
| 144 | Replace the matched form control text with "custom/openai-model:2026". Wait for completion before continuing. |
| 145 | Iterate const choice over an array containing "anthropic", "google", "xai". |
| 146 | Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `choice`. Wait for completion before continuing. |
| 147 | Assert that `model` has form value "". Wait for the asynchronous assertion to settle. |
| 148 | Assert that the result of `page.locator` using "#apiKey" has form value "". Wait for the asynchronous assertion to settle. |
| 149 | Replace the matched form control text with text interpolating `choice`. Wait for completion before continuing. |
| 150 | Replace the matched form control text with text interpolating `choice`. Wait for completion before continuing. |
| 151 | Close the callback or control-flow body and finish the surrounding syntax. |
| 152 | Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with "openai". Wait for completion before continuing. |
| 153 | Assert that `model` has form value "custom/openai-model:2026". Wait for the asynchronous assertion to settle. |
| 154 | Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 155 | Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with `provider`. Wait for completion before continuing. |
| 156 | Assert that `model` has form value text interpolating `provider`. Wait for the asynchronous assertion to settle. |
| 157 | Assert that the result of `page.locator` using "#apiKey" has form value "". Wait for the asynchronous assertion to settle. |
| 158 | Replace the matched form control text with text interpolating `provider`. Wait for completion before continuing. |
| 159 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 160 | Assert that the result of `page.getByRole` using "alert" contains text "Session expired.". Wait for the asynchronous assertion to settle. |
| 161 | Assign false to `expired`. |
| 162 | Click `page.getByRole('button', { name: 'Reconnect' })` in the synthetic browser test. Wait for completion before continuing. |
| 163 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle. |
| 164 | Assert that the result of `page.getByRole` using "combobox", an object containing name: "AI provider" has form value `provider`. Wait for the asynchronous assertion to settle. |
| 165 | Assert that `model` has form value text interpolating `provider`. Wait for the asynchronous assertion to settle. |
| 166 | Assert that `model` has the specified attribute/value "placeholder", text interpolating `provider`. Wait for the asynchronous assertion to settle. |
| 167 | Assert that the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }` deeply equals an object containing local: an empty object, session: an empty object. |
| 168 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 169 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 170 | Assert that `uploadedBody` contains text interpolating `provider`. |
| 171 | Assert that `uploadedBody` contains text interpolating `provider`. |
| 172 | Close the callback or control-flow body and finish the surrounding syntax. |
| 173 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 174 | Register a test that "waits for human R3 sign-in across refresh and resumes preparation automatically". |
| 175 | Declare `submissions` as 0. |
| 176 | Declare `currentJob` as an object containing values copied from `TEST_JOB`. |
| 177 | Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 178 | Set fixture property `csrfToken` to `CSRF_TOKEN`. |
| 179 | Set fixture property `model` to "gpt-5.6-sol". |
| 180 | Copy the entries of an object containing activeJob: `currentJob` when `submissions`, otherwise an empty object into this fixture. |
| 181 | Close the fixture object for `json` and finish the surrounding syntax. |
| 182 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 183 | Assign 1 to `submissions`, using +=. |
| 184 | Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `currentJob` to the caller. |
| 185 | Close the callback or control-flow body and finish the surrounding syntax. |
| 186 | Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 187 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 188 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 189 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 190 | Assign an object containing values copied from `currentJob`, status: "awaiting_login", message: "Sign in to R3 AMC in the browser that opened." to `currentJob`. |
| 191 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Sign in to R3 AMC." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle. |
| 192 | Assert that the result of `page.locator` using "#login-notice" contains text "complete any CAPTCHA". Wait for the asynchronous assertion to settle. |
| 193 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 194 | Assert that the result of `page.getByLabel` using "Loan number", an object containing exact: false is disabled. Wait for the asynchronous assertion to settle. |
| 195 | Assert that the result of `page.locator` using "#review-notice" is hidden. Wait for the asynchronous assertion to settle. |
| 196 | Call `page.reload` without arguments. Wait for completion before continuing. |
| 197 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Sign in to R3 AMC." is visible. Wait for the asynchronous assertion to settle. |
| 198 | Assert that the result of `page.locator` using "#login-notice" is visible. Wait for the asynchronous assertion to settle. |
| 199 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 200 | Assign an object containing values copied from `currentJob`, status: "preparing", message: "Preparing the appraisal order after sign-in." to `currentJob`. |
| 201 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Preparing your R3 order." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle. |
| 202 | Assert that the result of `page.locator` using "#login-notice" is hidden. Wait for the asynchronous assertion to settle. |
| 203 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 204 | Assert that `submissions` strictly equals 1. |
| 205 | Declare `stored` as the resolved value from `page.evaluate` using a callback that returns `{ local: { ...localStorage }, session: { ...sessionStorage } }`. |
| 206 | Assert that `stored` deeply equals an object containing local: an empty object, session: an object containing 'appraisal-desk-active-job': `TEST_JOB.id`. |
| 207 | Close the callback or control-flow body and finish the surrounding syntax. |
| 208 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 209 | Register a test that "hands control to the user and keeps the form locked until the browser closes". |
| 210 | Declare `currentJob` as an object containing values copied from `TEST_JOB`, status: "awaiting_review", message: "Review the prepared order in the open browser.", warnings: an array containing "Verify the property type.", "&lt;img src=x onerror=alert(1)&gt;". |
| 211 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 212 | Intercept requests matching "**/api/jobs/*" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 213 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 214 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 215 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Review and finish your order." is visible. Wait for the asynchronous assertion to settle. |
| 216 | Assert that the result of `page.getByText` using "Continue in the R3 AMC browser.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle. |
| 217 | Assert that the result of `page.getByText` using "Verify the property type.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle. |
| 218 | Assert that the result of `page.locator` using "#warnings-list img" has this many matching elements: 0. Wait for the asynchronous assertion to settle. |
| 219 | Assert that the result of `page.locator` using "#warnings-list" contains text "&lt;img src=x onerror=alert(1)&gt;". Wait for the asynchronous assertion to settle. |
| 220 | Assign an object containing values copied from `currentJob`, status: "user_submitted", message: "Submission was detected. Close the R3 browser when finished." to `currentJob`. |
| 221 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Submission detected." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle. |
| 222 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 223 | Assign an object containing values copied from `currentJob`, status: "browser_closed", message: "The R3 browser was closed." to `currentJob`. |
| 224 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your browser session is closed." is visible an object containing timeout: 10000. Wait for the asynchronous assertion to settle. |
| 225 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare another order" is enabled. Wait for the asynchronous assertion to settle. |
| 226 | Assert that the resolved value from `page.evaluate` using a callback that returns `sessionStorage.length` strictly equals 0. |
| 227 | Close the callback or control-flow body and finish the surrounding syntax. |
| 228 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 229 | Register a test that "rejects invalid loan numbers and non-PDF files before sending an order". |
| 230 | Declare `submissions` as 0. |
| 231 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 232 | Assign 1 to `submissions`, using +=. |
| 233 | Return the result of `route.fulfill` using an object containing status: 202, json: an object containing job: `TEST_JOB` to the caller. |
| 234 | Close the callback or control-flow body and finish the surrounding syntax. |
| 235 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 236 | Declare `loanNumber` as the result of `page.getByLabel` using "Loan number", an object containing exact: false. |
| 237 | Replace the matched form control text with "685-201234". Wait for completion before continuing. |
| 238 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 239 | Assert that the resolved value from `loanNumber.evaluate` using a callback that returns `element.validity.patternMismatch` strictly equals true. |
| 240 | Replace the matched form control text with "685-2012345". Wait for completion before continuing. |
| 241 | Declare `urla` as the result of `page.getByLabel` using "URLA", an object containing exact: false. |
| 242 | Call `urla.setInputFiles` with an object containing name: "test.txt", mimeType: "text/plain", buffer: the result of `Buffer.from` using "not a PDF". Wait for completion before continuing. |
| 243 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 244 | Assert that the resolved value from `urla.evaluate` using a callback that returns `element.validationMessage` strictly equals "Choose a PDF document.". |
| 245 | Assert that `submissions` strictly equals 0. |
| 246 | Close the callback or control-flow body and finish the surrounding syntax. |
| 247 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 248 | Register a test that "shows server validation details and permits correction without losing inputs". |
| 249 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 250 | Set fixture property `status` to 422. |
| 251 | Set fixture property `json` to an object containing error: an object containing code: "VALIDATION_ERROR", message: "The order has an invalid field.", details: an array containing an object containing field: `'fhaCaseNumber'`, message: `'Enter the FHA case number for this loan.'`. |
| 252 | Close the fixture object and finish the surrounding syntax. |
| 253 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 254 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 255 | Assert that the result of `page.getByRole` using "alert" contains text "Enter the FHA case number for this loan.". Wait for the asynchronous assertion to settle. |
| 256 | Assert that the result of `page.getByLabel` using "FHA case number", an object containing exact: false has the specified attribute/value "aria-invalid", "true". Wait for the asynchronous assertion to settle. |
| 257 | Assert that the result of `page.getByLabel` using "Loan number", an object containing exact: false has form value "685-2012345". Wait for the asynchronous assertion to settle. |
| 258 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle. |
| 259 | Replace the matched form control text with "123-4567890". Wait for completion before continuing. |
| 260 | Assert that the result of `page.getByLabel` using "FHA case number", an object containing exact: false does not satisfy: has the specified attribute/value "aria-invalid", "true". Wait for the asynchronous assertion to settle. |
| 261 | Close the callback or control-flow body and finish the surrounding syntax. |
| 262 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 263 | Register a test that "recovers an accepted order after a lost POST response without resubmitting". |
| 264 | Declare `submissions` as 0. |
| 265 | Declare `accepted` as false. |
| 266 | Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 267 | Intercept requests matching "**/api/jobs" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 268 | Assign 1 to `submissions`, using +=. |
| 269 | Assign true to `accepted`. |
| 270 | Return the result of `route.abort` using "failed" to the caller. |
| 271 | Close the callback or control-flow body and finish the surrounding syntax. |
| 272 | Call `openAndFillOrder` with `page`. Wait for completion before continuing. |
| 273 | Click `page.getByRole('button', { name: 'Prepare appraisal order' })` in the synthetic browser test. Wait for completion before continuing. |
| 274 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 275 | Assert that `submissions` strictly equals 1. |
| 276 | Assert that the result of `page.getByRole` using "alert" is hidden. Wait for the asynchronous assertion to settle. |
| 277 | Assert that the result of `page.getByLabel` using "OpenAI API key", an object containing exact: false has form value "". Wait for the asynchronous assertion to settle. |
| 278 | Call `page.reload` without arguments. Wait for completion before continuing. |
| 279 | Assert that the result of `page.getByRole` using "heading", an object containing name: "Your order is in progress." is visible. Wait for the asynchronous assertion to settle. |
| 280 | Assert that the result of `page.getByRole` using "button", an object containing name: "Order preparation in progress" is disabled. Wait for the asynchronous assertion to settle. |
| 281 | Assert that `submissions` strictly equals 1. |
| 282 | Close the callback or control-flow body and finish the surrounding syntax. |
| 283 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 284 | Register a test that "offers reconnection when workspace initialization fails". |
| 285 | Declare `unavailable` as true. |
| 286 | Intercept requests matching "**/api/session" and handle them with the synthetic route callback. Wait for completion before continuing. |
| 287 | Set fixture property `status` to 503. Set fixture property `json` to an object containing error: an object containing code: "UNAVAILABLE", message: "The local workspace is unavailable.". |
| 288 | Set fixture property `json` to an object containing csrfToken: `CSRF_TOKEN`, model: "gpt-5.6-sol". |
| 289 | Navigate `page` to `origin`. Wait for completion before continuing. |
| 290 | Assert that the result of `page.getByText` using "The local workspace is unavailable.", an object containing exact: true is visible. Wait for the asynchronous assertion to settle. |
| 291 | Assert that the result of `page.getByRole` using "button", an object containing name: "Workspace connection needed" is disabled. Wait for the asynchronous assertion to settle. |
| 292 | Assign false to `unavailable`. |
| 293 | Click `page.getByRole('button', { name: 'Reconnect' })` in the synthetic browser test. Wait for completion before continuing. |
| 294 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle. |
| 295 | Assert that the result of `page.getByRole` using "button", an object containing name: "Reconnect" is hidden. Wait for the asynchronous assertion to settle. |
| 296 | Close the callback or control-flow body and finish the surrounding syntax. |
| 297 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 298 | Register a test that "fits desktop and mobile viewports and exposes keyboard focus". |
| 299 | Call `page.setViewportSize` with an object containing width: 1440, height: 1100. Wait for completion before continuing. |
| 300 | Navigate `page` to `origin`. Wait for completion before continuing. |
| 301 | Assert that the result of `page.getByRole` using "button", an object containing name: "Prepare appraisal order" is enabled. Wait for the asynchronous assertion to settle. |
| 302 | Call `page.keyboard.press` with "Tab". Wait for completion before continuing. |
| 303 | Await an assertion that the Skip to order form link has keyboard focus. |
| 304 | Assert that the result of `page.getByRole` using "link", an object containing name: "Skip to order form" is visible. Wait for the asynchronous assertion to settle. |
| 305 | Call `page.setViewportSize` with an object containing width: 375, height: 812. Wait for completion before continuing. |
| 306 | Call `page.getByRole('combobox', { name: 'AI provider' }).selectOption` with "google". Wait for completion before continuing. |
| 307 | Assert that the resolved value from `page.evaluate` using a callback that returns `document.documentElement.scrollWidth` is at most `window.innerWidth` strictly equals true. |
| 308 | Assert that the result of `page.getByRole` using "heading", an object containing name: `/A prepared order\./` is visible. Wait for the asynchronous assertion to settle. |
| 309 | Assert that the result of `page.getByLabel` using "Google Gemini API key", an object containing exact: false is visible. Wait for the asynchronous assertion to settle. |
| 310 | Close the callback or control-flow body and finish the surrounding syntax. |
