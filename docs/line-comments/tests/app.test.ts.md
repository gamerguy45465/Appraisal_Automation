# Line explanations: tests/app.test.ts

Source: [tests/app.test.ts](../../../tests/app.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import request from "supertest" for these regression tests. |
| 2 | Import { beforeEach, describe, expect, it, vi } from "vitest" for these regression tests. |
| 3 | Import { createApp } from "../src/app.js" for these regression tests. |
| 4 | Import type { JobRunner } from "../src/jobs.js" for these regression tests. |
| 5 | Import { DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, type JobPayload } from "../src/domain.js" for these regression tests. |
| 6 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 7 | Declare `pdf` as the result of `Buffer.from` using "%PDF-1.7\n% synthetic test only\n%%EOF". |
| 8 | Declare `form` as an object containing apiKey: "test-key-not-real-1234567890", loanNumber: "685-2012345", paymentMethod: "Invoice". |
| 9 | Declare `invalidAiSettings` as an array containing an object containing caseName: "provider", fields: an object containing provider: "invalid", an object containing caseName: "display-only provider name", fields: an object containing provider: "SpaceXAI", an object containing caseName: "empty key", fields: an object containing apiKey: "", an object containing caseName: "short key", fields: an object containing apiKey: "short", an object containing caseName: "oversized key", fields: an object containing apiKey: the result of `'x'.repeat` using `513`, an object containing caseName: "model whitespace", fields: an object containing model: "model with spaces", an object containing caseName: "oversized model", fields: an object containing model: the result of `'x'.repeat` using `201`. |
| 10 | Set fixture property `caseName` to "provider". Set fixture property `fields` to an object containing provider: "invalid". |
| 11 | Set fixture property `caseName` to "display-only provider name". Set fixture property `fields` to an object containing provider: "SpaceXAI". |
| 12 | Set fixture property `caseName` to "empty key". Set fixture property `fields` to an object containing apiKey: "". |
| 13 | Set fixture property `caseName` to "short key". Set fixture property `fields` to an object containing apiKey: "short". |
| 14 | Set fixture property `caseName` to "oversized key". Set fixture property `fields` to an object containing apiKey: the result of `'x'.repeat` using 513. |
| 15 | Set fixture property `caseName` to "model whitespace". Set fixture property `fields` to an object containing model: "model with spaces". |
| 16 | Set fixture property `caseName` to "oversized model". Set fixture property `fields` to an object containing model: the result of `'x'.repeat` using 201. |
| 17 | Close the array of fixture values for `invalidAiSettings` and finish the surrounding syntax. |
| 18 | Declare `runner` for assignment later. |
| 19 | Run this setup before every test in the group. |
| 20 | Assign an object containing create: the result of `vi.fn` using a callback that returns `{ id: 'job-id', status: 'queued', message: 'Queued' }`, get: the result of `vi.fn` using a callback that returns `undefined`, shutdown: the result of `vi.fn` with no arguments to `runner`. |
| 21 | Close the callback or control-flow body and finish the surrounding syntax. |
| 22 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 23 | Define helper `setup` with no parameters for the fixture operations below. |
| 24 | Declare `{ app }` as the result of `createApp` using an object containing runner. |
| 25 | Declare `client` as the result of `request.agent` using `app`. |
| 26 | Declare `session` as the resolved value from `client.get('/api/session').set('Host', '127.0.0.1:3000').expect` using 200. |
| 27 | Return an object containing app, client, token: `session.body.csrfToken` to the caller. |
| 28 | Close the callback or control-flow body for `setup` and finish the surrounding syntax. |
| 29 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 30 | Group regression tests for "local upload boundary". |
| 31 | Register a test that "publishes provider-specific model defaults without exposing credentials". |
| 32 | Declare `{ app }` as the result of `createApp` using an object containing runner. |
| 33 | Declare `response` as the resolved value from `request(app).get('/api/session').set('Host', '127.0.0.1:3000').expect` using 200. |
| 34 | Assert that `response.body` contains the expected object fields an object containing defaultProvider: `DEFAULT_PROVIDER`, model: `DEFAULT_MODEL`, modelDefaults: `DEFAULT_MODELS`. |
| 35 | Assert that response.body does not contain the "apiKey" property, preserving the credential-exclusion boundary. |
| 36 | Close the callback or control-flow body and finish the surrounding syntax. |
| 37 | Register a test that "requires a session and rejects remote hosts/origins before accepting uploads". |
| 38 | Declare `{ app }` as the result of `createApp` using an object containing runner. |
| 39 | Call `request(app).get('/api/session').set('Host', 'attacker.example:3000').expect` with 403. Wait for completion before continuing. |
| 40 | Call `request(app).get('/api/session').set('Host', '127.0.0.1:3000').set('Origin', 'https://attacker.example').expect` with 403. Wait for completion before continuing. |
| 41 | Call `request(app).post('/api/jobs').set('Host', '127.0.0.1:3000').expect` with 401. Wait for completion before continuing. |
| 42 | Close the callback or control-flow body and finish the surrounding syntax. |
| 43 | Register a parameterized test that "rejects missing and malformed CSRF tokens for a %s upload". |
| 44 | Declare `{ client }` as the resolved value from `setup` with no arguments. |
| 45 | Call `client.post('/api/jobs').set('Host', '127.0.0.1:3000') .field({ ...form, provider }).attach('urla', pdf, 'urla.pdf').expect` with 403. Wait for completion before continuing. |
| 46 | Copy the entries of `form` into this fixture. Include the current `provider` value under the same property name. |
| 47 | Call `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', 'é'.repeat(64)).expect` with 403. Wait for completion before continuing. |
| 48 | Assert that `runner.create` does not satisfy: was called. |
| 49 | Close the callback or control-flow body and finish the surrounding syntax. |
| 50 | Register a test that "accepts the required multipart form and provides only a safe job response". |
| 51 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 52 | Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', pdf, { filename: 'urla.pdf', contentType: 'application/pdf' }).expect` using 202. |
| 53 | Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued". |
| 54 | Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`. |
| 55 | Assert that `payload.input.loanNumber` strictly equals "685-2012345". |
| 56 | Assert that `payload.input` contains the expected object fields an object containing provider: "openai", model: `DEFAULT_MODEL`, apiKey: `form.apiKey`. |
| 57 | Assert that `payload.urla.name` strictly equals "urla.pdf". |
| 58 | Assert that `payload.salesContract` is undefined. |
| 59 | Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary. |
| 60 | Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary. |
| 61 | Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `form.apiKey`. |
| 62 | Close the callback or control-flow body and finish the surrounding syntax. |
| 63 | Register a parameterized test that "passes resolved provider/model from a $provider upload to its isolated job ($model)". |
| 64 | Set fixture property `provider` to "openai". Set fixture property `model` to "". Set fixture property `expected` to `DEFAULT_MODELS.openai`. |
| 65 | Set fixture property `provider` to "anthropic". Set fixture property `expected` to `DEFAULT_MODELS.anthropic`. |
| 66 | Set fixture property `provider` to "anthropic". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.anthropic`. |
| 67 | Set fixture property `provider` to "anthropic". Set fixture property `model` to "  claude-sonnet-4-20250514  ". Set fixture property `expected` to "claude-sonnet-4-20250514". |
| 68 | Set fixture property `provider` to "google". Set fixture property `expected` to `DEFAULT_MODELS.google`. |
| 69 | Set fixture property `provider` to "google". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.google`. |
| 70 | Set fixture property `provider` to "google". Set fixture property `model` to "  gemini-custom:2026  ". Set fixture property `expected` to "gemini-custom:2026". |
| 71 | Set fixture property `provider` to "xai". Set fixture property `expected` to `DEFAULT_MODELS.xai`. |
| 72 | Set fixture property `provider` to "xai". Set fixture property `model` to "  ". Set fixture property `expected` to `DEFAULT_MODELS.xai`. |
| 73 | Set fixture property `provider` to "xai". Set fixture property `model` to "grok-4.6 ". Set fixture property `expected` to "grok-4.6". |
| 74 | Set fixture property `provider` to "xai". Set fixture property `model` to "  custom/grok-model:2026  ". Set fixture property `expected` to "custom/grok-model:2026". |
| 75 | Set fixture property `provider` to "openai". Set fixture property `model` to "ft:gpt-4.1:organization:custom:id". Set fixture property `expected` to "ft:gpt-4.1:organization:custom:id". |
| 76 | Apply the preceding scenario rows to the parameterized test "passes resolved provider/model from a $provider upload to its isolated job ($model)" and begin its callback. |
| 77 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 78 | Declare `fields` as an object whose fields are defined below. |
| 79 | Include the current `provider` value under the same property name. Copy the entries of an empty object when `model` strictly equals `undefined`, otherwise an object containing model into this fixture. |
| 80 | Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field(fields).attach('urla', pdf, 'urla.pdf').expect` using 202. |
| 81 | Attach all form fields and the synthetic URLA PDF to the multipart request, then require HTTP 202 Accepted. |
| 82 | Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`. |
| 83 | Assert that `runner.create` was called this many times: 1. |
| 84 | Assert that `payload.input` contains the expected object fields an object containing provider, model: `expected`, apiKey: `fields.apiKey`. |
| 85 | Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary. |
| 86 | Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary. |
| 87 | Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued". |
| 88 | Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `fields.apiKey`. |
| 89 | Close the callback or control-flow body and finish the surrounding syntax. |
| 90 | Register a parameterized test that "rejects invalid $caseName before starting a worker". |
| 91 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 92 | Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field({ ...form, ...fields }).attach('urla', pdf, 'urla.pdf').expect` using 400. |
| 93 | Copy the entries of `form` into this fixture. Copy the entries of `fields` into this fixture. |
| 94 | Assert that `response.body.error.code` strictly equals "VALIDATION_ERROR". |
| 95 | Assert that the result of `JSON.stringify` using `response.body` does not satisfy: contains `form.apiKey`. |
| 96 | Assert that `runner.create` does not satisfy: was called. |
| 97 | Close the callback or control-flow body and finish the surrounding syntax. |
| 98 | Register a parameterized test that "discards outdated R3 credentials from a %s upload instead of passing them to the worker". |
| 99 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 100 | Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token) .field({ ...form, provider, username: 'obsolete-user', password: 'obsolete-password' }).attach(...` using 202. |
| 101 | Copy the entries of `form` into this fixture. Include the current `provider` value under the same property name. Set fixture property `username` to "obsolete-user". Set fixture property `password` to "obsolete-password". |
| 102 | Declare `payload` as `vi.mocked(runner.create).mock.calls[0]?.[1]`. |
| 103 | Assert that payload.input does not contain the "username" property, preserving the credential-exclusion boundary. |
| 104 | Assert that payload.input does not contain the "password" property, preserving the credential-exclusion boundary. |
| 105 | Assert that `response.body` deeply equals an object containing job: an object containing id: "job-id", status: "queued", message: "Queued". |
| 106 | Close the callback or control-flow body and finish the surrounding syntax. |
| 107 | Register a test that "rejects missing URLA, invalid loan numbers, fake PDFs and excess files". |
| 108 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 109 | Declare `post` as a callback that returns the result of `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set` using "X-CSRF-Token", `token`. |
| 110 | Assert that `(await post().field(form).expect(400)).body.error.code` strictly equals "URLA_REQUIRED". |
| 111 | Call `post().field({ ...form, loanNumber: 'bad' }).attach('urla', pdf, 'urla.pdf').expect` with 400. Wait for completion before continuing. |
| 112 | Call `post().field(form).attach('urla', Buffer.from('this is not a PDF'), { filename: 'fake.pdf', contentType: 'application/pdf' }).expect` with 400. Wait for completion before continuing. |
| 113 | Call `post().field(form).attach('urla', pdf, 'urla.pdf').attach('urla', pdf, 'second.pdf').expect` with 400. Wait for completion before continuing. |
| 114 | Assert that `runner.create` does not satisfy: was called. |
| 115 | Close the callback or control-flow body and finish the surrounding syntax. |
| 116 | Register a test that "makes status session-specific and denies unknown operations". |
| 117 | Declare `{ client }` as the resolved value from `setup` with no arguments. |
| 118 | Call `client.get('/api/jobs/not-owned').set('Host', '127.0.0.1:3000').expect` with 404. Wait for completion before continuing. |
| 119 | Call `client.get('/api/secrets').set('Host', '127.0.0.1:3000').expect` with 404. Wait for completion before continuing. |
| 120 | Close the callback or control-flow body and finish the surrounding syntax. |
| 121 | Register a test that "rejects oversized documents before starting a worker". |
| 122 | Declare `{ client, token }` as the resolved value from `setup` with no arguments. |
| 123 | Declare `oversized` as the result of `Buffer.alloc` using `15` times `1024` times 1024 plus 1. |
| 124 | Call `pdf.copy` with `oversized`. |
| 125 | Declare `response` as the resolved value from `client.post('/api/jobs').set('Host', '127.0.0.1:3000').set('X-CSRF-Token', token).field(form).attach('urla', oversized, 'urla.pdf').expect` using 400. |
| 126 | Assert that `response.body.error.code` strictly equals "UPLOAD_LIMIT". |
| 127 | Assert that `runner.create` does not satisfy: was called. |
| 128 | Close the callback or control-flow body and finish the surrounding syntax. |
| 129 | Register a test that "serves the working form with strict CSP, no caching, and no server version". |
| 130 | Declare `{ app }` as the result of `createApp` using an object containing runner. |
| 131 | Declare `response` as the resolved value from `request(app).get('/').set('Host', '127.0.0.1:3000').expect` using 200. |
| 132 | Assert that `response.text` contains "enctype=\"multipart/form-data\"". |
| 133 | Assert that `response.headers['content-security-policy']` contains "script-src 'self'". |
| 134 | Assert that `response.headers['cache-control']` strictly equals "no-store". |
| 135 | Assert that `response.headers['x-powered-by']` is undefined. |
| 136 | Close the callback or control-flow body and finish the surrounding syntax. |
| 137 | Close the callback or control-flow body and finish the surrounding syntax. |
