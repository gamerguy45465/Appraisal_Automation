# Line explanations: tests/errors.test.ts

Source: [tests/errors.test.ts](../../../tests/errors.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { describe, expect, it } from "vitest" for these regression tests. |
| 2 | Import { APIError } from "@anthropic-ai/sdk" for these regression tests. |
| 3 | Import { APIError as OpenAIAPIError } from "openai" for these regression tests. |
| 4 | Import { AppError, publicError } from "../src/errors.js" for these regression tests. |
| 5 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 6 | Existing comment: These SDK classes are not public exports; resolve beside the installed public entry point. |
| 7 | Declare `googleErrors` as the resolved value from `import` using `new URL('./utils/errors.js', import.meta.resolve('@langchain/google')).href`. |
| 8 | Declare `googleKey` as "synthetic-google-key-not-real". |
| 9 | Declare `googlePrivateUrl` as text interpolating `googleKey`. |
| 10 | Define helper `googleSdkError` with parameters message, statusCode, reason for the fixture operations below. |
| 11 | Return a new `googleErrors.RequestError` instance initialized with an object whose fields are defined below to the caller. |
| 12 | Set fixture property `message` to text interpolating `message`, `privateDetail`. Include the current `statusCode` value under the same property name. Set fixture property `statusText` to "Synthetic rejection". Set fixture property `url` to `googlePrivateUrl`. |
| 13 | Set fixture property `headers` to an object containing 'x-goog-api-key': `googleKey`. |
| 14 | Set fixture property `data` to an object containing error: an object containing code: `statusCode`, message: text interpolating `message`, `privateDetail`, status: "INVALID_ARGUMENT", details: an array containing `{ reason }` when `reason`, otherwise an empty array. |
| 15 | Close the fixture object and finish the surrounding syntax. |
| 16 | Close the callback or control-flow body for `googleSdkError` and finish the surrounding syntax. |
| 17 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 18 | Define helper `expectSanitizedGoogle` with parameters error, code, action for the fixture operations below. |
| 19 | Declare `result` as the result of `publicError` using `error`, "google". |
| 20 | Assert that `result` contains the expected object fields an object containing code, statusCode: 504 when `code` strictly equals "TIMEOUT", otherwise 502. |
| 21 | Assert that `result.message` contains `action`. |
| 22 | Assert that `result.message` contains "Google Gemini". |
| 23 | Iterate const output over an array containing `result.message`, `result.stack`, the result of `JSON.stringify` using `result`. |
| 24 | Assert that `output` does not satisfy: contains `privateDetail`. |
| 25 | Assert that `output` does not satisfy: contains `googleKey`. |
| 26 | Assert that `output` does not satisfy: contains `googlePrivateUrl`. |
| 27 | Assert that `output` does not satisfy: contains "generativelanguage.googleapis.com". |
| 28 | Close the callback or control-flow body and finish the surrounding syntax. |
| 29 | Close the callback or control-flow body for `expectSanitizedGoogle` and finish the surrounding syntax. |
| 30 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 31 | Declare `privateDetail` as "PRIVATE_PDF_TEXT_sk-synthetic-secret". |
| 32 | Define helper `sdkError` with parameters message, status for the fixture operations below. |
| 33 | Return the result of `APIError.generate` using `status`, an object containing type: "error", error: an object containing type: "invalid_request_error", message: text interpolating `message`, `privateDetail`, `undefined`, a new `Headers` instance to the caller. |
| 34 | Close the callback or control-flow body for `sdkError` and finish the surrounding syntax. |
| 35 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 36 | Group regression tests for "actionable Anthropic rejection messages". |
| 37 | Register a parameterized test that "classifies %s from an actual SDK error without exposing its body". |
| 38 | Provide a parameterized test row with ['Your credit balance is too low to access the Anthropic API.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations. |
| 39 | Provide a parameterized test row with ['Insufficient credits.', 'API_QUOTA', 'credit balance'],; the test receives these values as its inputs and expectations. |
| 40 | Provide a parameterized test row with ['Schema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 41 | Provide a parameterized test row with ['Too many parameters with union types; maximum is 16.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 42 | Provide a parameterized test row with ['Maximum optional parameters exceeded.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 43 | Provide a parameterized test row with ['prompt is too long: 250000 tokens &gt; 200000 maximum', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations. |
| 44 | Provide a parameterized test row with ['PDF has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations. |
| 45 | Provide a parameterized test row with ['Request exceeds size limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations. |
| 46 | Provide a parameterized test row with ['PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],; the test receives these values as its inputs and expectations. |
| 47 | Provide a parameterized test row with ['Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],; the test receives these values as its inputs and expectations. |
| 48 | Provide a parameterized test row with ['output_config.format is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 49 | Provide a parameterized test row with ['This model does not support PDF input.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 50 | Apply the preceding scenario rows to the parameterized test "classifies %s from an actual SDK error without exposing its body" and begin its callback. |
| 51 | Declare `result` as the result of `publicError` using the result of `sdkError` using `message`, "anthropic". |
| 52 | Assert that `result` contains the expected object fields an object containing code, statusCode: 502. |
| 53 | Assert that `result.message` contains `action`. |
| 54 | Assert that `result.message` contains "Anthropic". |
| 55 | Assert that `result.message` does not satisfy: contains `privateDetail`. |
| 56 | Assert that the result of `JSON.stringify` using `result` does not satisfy: contains `privateDetail`. |
| 57 | Assert that `result.stack` does not satisfy: contains `privateDetail`. |
| 58 | Close the callback or control-flow body and finish the surrounding syntax. |
| 59 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 60 | Register a parameterized test that "recognizes plain, direct and nested SDK shapes". |
| 61 | Set fixture property `status` to 400. Set fixture property `message` to "Schema is too complex for compilation.". |
| 62 | Set fixture property `status` to 422. Set fixture property `error` to an object containing message: "Schema is too complex for compilation.". |
| 63 | Set fixture property `status` to 400. Set fixture property `error` to an object containing error: an object containing message: "Schema is too complex for compilation.". |
| 64 | Apply the preceding scenario rows to the parameterized test "recognizes plain, direct and nested SDK shapes" and begin its callback. |
| 65 | Assert that `publicError(error, 'anthropic').code` strictly equals "MODEL_SCHEMA". |
| 66 | Close the callback or control-flow body and finish the surrounding syntax. |
| 67 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 68 | Register a test that "retains authentication/access/rate-limit precedence and OpenAI behavior". |
| 69 | Iterate const [status, code] over an array containing an array containing 401, "API_AUTH", an array containing 403, "MODEL_ACCESS", an array containing 404, "MODEL_ACCESS", an array containing 429, "API_RATE_LIMIT". |
| 70 | Assert that `publicError(sdkError('Schema is too complex for compilation.', status), 'anthropic').code` strictly equals `code`. |
| 71 | Close the callback or control-flow body and finish the surrounding syntax. |
| 72 | Assert that `publicError(sdkError('Schema is too complex for compilation.'), 'openai').code` strictly equals "MODEL_REQUEST". |
| 73 | Assert that `publicError(new Error('Schema is too complex for compilation.'), 'anthropic').code` strictly equals "PREPARATION_FAILED". |
| 74 | Close the callback or control-flow body and finish the surrounding syntax. |
| 75 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 76 | Register a test that "preserves safe application errors and sanitizes unrecognized or malformed responses". |
| 77 | Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "A known safe message.". |
| 78 | Assert that the result of `publicError` using `safe`, "anthropic" strictly equals `safe`. |
| 79 | Iterate const error over an array containing the result of `sdkError` using `privateDetail`, an object containing status: 400, error: an object containing message: an object containing privateDetail. |
| 80 | Declare `result` as the result of `publicError` using `error`, "anthropic". |
| 81 | Assert that `result.code` strictly equals "MODEL_REQUEST". |
| 82 | Assert that `result.message` does not satisfy: contains `privateDetail`. |
| 83 | Close the callback or control-flow body and finish the surrounding syntax. |
| 84 | Close the callback or control-flow body and finish the surrounding syntax. |
| 85 | Close the callback or control-flow body and finish the surrounding syntax. |
| 86 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 87 | Group regression tests for "sanitized Google Gemini errors". |
| 88 | Register a parameterized test that "classifies SDK HTTP %s: %s without forwarding private details". |
| 89 | Provide a parameterized test row with [400, 'API key not valid. Please pass a valid API key.', 'API_AUTH', 'Google AI Studio'],; the test receives these values as its inputs and expectations. |
| 90 | Provide a parameterized test row with [400, 'API key expired. Please renew the API key.', 'API_AUTH', 'Google AI Studio'],; the test receives these values as its inputs and expectations. |
| 91 | Provide a parameterized test row with [403, 'Your API key was reported as leaked. Please use another API key.', 'API_AUTH', 'restrictions'],; the test receives these values as its inputs and expectations. |
| 92 | Provide a parameterized test row with [400, 'Please enable billing on your Google Cloud project.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations. |
| 93 | Provide a parameterized test row with [403, 'Billing is not enabled.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations. |
| 94 | Provide a parameterized test row with [429, 'You exceeded your current quota.', 'API_QUOTA', 'usage limits'],; the test receives these values as its inputs and expectations. |
| 95 | Provide a parameterized test row with [400, 'PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],; the test receives these values as its inputs and expectations. |
| 96 | Provide a parameterized test row with [400, 'Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],; the test receives these values as its inputs and expectations. |
| 97 | Provide a parameterized test row with [400, 'Request payload size exceeds the limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations. |
| 98 | Provide a parameterized test row with [400, 'The input token count exceeds the maximum allowed number.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations. |
| 99 | Provide a parameterized test row with [400, 'The document has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations. |
| 100 | Provide a parameterized test row with [400, 'responseSchema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 101 | Provide a parameterized test row with [400, 'responseJsonSchema has invalid nesting depth.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 102 | Provide a parameterized test row with [400, 'responseMimeType application/json is not supported for this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 103 | Provide a parameterized test row with [422, 'This model does not support response_json_schema.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 104 | Provide a parameterized test row with [400, 'PDF input is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 105 | Provide a parameterized test row with [400, 'This model does not support function calling.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 106 | Provide a parameterized test row with [401, 'Synthetic rejection.', 'API_AUTH', 'API key'],; the test receives these values as its inputs and expectations. |
| 107 | Provide a parameterized test row with [403, 'Permission denied for this resource.', 'MODEL_ACCESS', 'account access'],; the test receives these values as its inputs and expectations. |
| 108 | Provide a parameterized test row with [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],; the test receives these values as its inputs and expectations. |
| 109 | Provide a parameterized test row with [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],; the test receives these values as its inputs and expectations. |
| 110 | Provide a parameterized test row with [413, 'Synthetic rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],; the test receives these values as its inputs and expectations. |
| 111 | Provide a parameterized test row with [503, 'Synthetic backend outage.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations. |
| 112 | Provide a parameterized test row with [500, 'Synthetic internal error.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations. |
| 113 | Provide a parameterized test row with [504, 'Synthetic deadline exceeded.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations. |
| 114 | Apply the preceding scenario rows to the parameterized test "classifies SDK HTTP %s: %s without forwarding private details" and begin its callback. |
| 115 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using `message`, `status`, `code`, `action`. |
| 116 | Close the callback or control-flow body and finish the surrounding syntax. |
| 117 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 118 | Register a test that "uses recognized structured reasons without depending on private message text". |
| 119 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 400, "API_KEY_INVALID", "API_AUTH", "Google AI Studio". |
| 120 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 403, "API_KEY_HTTP_REFERRER_BLOCKED", "API_AUTH", "restrictions". |
| 121 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 403, "BILLING_DISABLED", "API_QUOTA", "billing". |
| 122 | Call `expectSanitizedGoogle` with a new `googleErrors.AuthError` instance initialized with an object containing message: `privateDetail`, statusCode: 403, data: an object containing secret: `googleKey`, "API_AUTH", "API key". |
| 123 | Close the callback or control-flow body and finish the surrounding syntax. |
| 124 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 125 | Register a test that "keeps unknown rejections neutral and retains access/rate-limit precedence". |
| 126 | Iterate const status over an array containing 400, 422. |
| 127 | Declare `error` as the result of `googleSdkError` using `privateDetail`, `status`. |
| 128 | Call `expectSanitizedGoogle` with `error`, "MODEL_REQUEST", "rejected the request". |
| 129 | Assert that `publicError(error, 'google').message` does not satisfy: contains "does not support". |
| 130 | Close the callback or control-flow body and finish the surrounding syntax. |
| 131 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using "responseSchema is not supported.", 403, "MODEL_ACCESS", "account access". |
| 132 | Call `expectSanitizedGoogle` with the result of `googleSdkError` using "responseSchema is not supported.", 429, "API_RATE_LIMIT", "usage limits". |
| 133 | Assert that `publicError(googleSdkError('API key not valid.'), 'openai').code` strictly equals "PREPARATION_FAILED". |
| 134 | Assert that `publicError({ status: 400, message: 'API key not valid.' }, 'anthropic').code` strictly equals "MODEL_REQUEST". |
| 135 | Assert that `publicError({ statusCode: 400, data: { error: { message: { secret: googleKey }, details: 'not an array' } } }, 'google').code` strictly equals "MODEL_REQUEST". |
| 136 | Close the callback or control-flow body and finish the surrounding syntax. |
| 137 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 138 | Register a test that "sanitizes SDK blocked, empty, malformed and configuration outcomes". |
| 139 | Call `expectSanitizedGoogle` with a new `googleErrors.PromptBlockedError` instance initialized with an object containing blockReason: "SAFETY", message: `privateDetail`, "MODEL_OUTPUT_BLOCKED", "blocked". |
| 140 | Call `expectSanitizedGoogle` with a new `googleErrors.NoCandidatesError` instance, "MODEL_OUTPUT_INVALID", "usable extraction". |
| 141 | Call `expectSanitizedGoogle` with a new `googleErrors.MalformedOutputError` instance initialized with an object containing message: `privateDetail`, cause: an object containing key: `googleKey`, "MODEL_OUTPUT_INVALID", "usable extraction". |
| 142 | Call `expectSanitizedGoogle` with a new `googleErrors.InvalidInputError` instance initialized with `privateDetail`, "MODEL_REQUEST", "Restart". |
| 143 | Call `expectSanitizedGoogle` with a new `googleErrors.ConfigurationError` instance initialized with `privateDetail`, "MODEL_REQUEST", "Restart". |
| 144 | Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "Known safe application message.". |
| 145 | Assert that the result of `publicError` using `safe`, "google" strictly equals `safe`. |
| 146 | Close the callback or control-flow body and finish the surrounding syntax. |
| 147 | Close the callback or control-flow body and finish the surrounding syntax. |
| 148 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 149 | Group regression tests for "sanitized SpaceXAI Grok errors". |
| 150 | Declare `xaiKey` as "xai-synthetic-key-not-real". |
| 151 | Declare `privateUrl` as text interpolating `xaiKey`. |
| 152 | Define helper `xaiSdkError` with parameters message, status, code for the fixture operations below. |
| 153 | Return the result of `OpenAIAPIError.generate` using `status`, an object whose fields are defined below, `undefined`, a new `Headers` instance initialized with an object containing 'authorization': text interpolating `xaiKey` to the caller. |
| 154 | Set fixture property `message` to text interpolating `message`, `privateDetail`, `privateUrl`. Include the current `code` value under the same property name. Set fixture property `type` to "invalid_request_error". |
| 155 | Set fixture property `'authorization'` to text interpolating `xaiKey`. |
| 156 | Close the callback or control-flow body for `xaiSdkError` and finish the surrounding syntax. |
| 157 | Define helper `expectSanitized` with parameters error, code, action for the fixture operations below. |
| 158 | Declare `result` as the result of `publicError` using `error`, "xai". |
| 159 | Assert that `result` contains the expected object fields an object containing code, statusCode: 504 when `code` strictly equals "TIMEOUT", otherwise 502. |
| 160 | Assert that `result.message` contains "SpaceXAI (Grok)". |
| 161 | Assert that `result.message` contains `action`. |
| 162 | Iterate const output over an array containing `result.message`, `result.stack`, the result of `JSON.stringify` using `result`. |
| 163 | Assert that `output` does not satisfy: contains `privateDetail`. |
| 164 | Assert that `output` does not satisfy: contains `xaiKey`. |
| 165 | Assert that `output` does not satisfy: contains `privateUrl`. |
| 166 | Assert that `output` does not satisfy: contains "api.x.ai". |
| 167 | Close the callback or control-flow body and finish the surrounding syntax. |
| 168 | Close the callback or control-flow body for `expectSanitized` and finish the surrounding syntax. |
| 169 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 170 | Register a parameterized test that "classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details". |
| 171 | Provide a parameterized test row with [400, 'Incorrect API key provided.', 'API_AUTH', 'Grok API key'],; the test receives these values as its inputs and expectations. |
| 172 | Provide a parameterized test row with [400, 'API key is invalid.', 'API_AUTH', 'Grok API key'],; the test receives these values as its inputs and expectations. |
| 173 | Provide a parameterized test row with [401, 'Synthetic rejection.', 'API_AUTH', 'selected provider'],; the test receives these values as its inputs and expectations. |
| 174 | Provide a parameterized test row with [402, 'Synthetic payment rejection.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations. |
| 175 | Provide a parameterized test row with [403, "Your team doesn't have any credits yet.", 'API_QUOTA', 'credit balance'],; the test receives these values as its inputs and expectations. |
| 176 | Provide a parameterized test row with [429, 'Monthly spending limit reached.', 'API_QUOTA', 'spending limits'],; the test receives these values as its inputs and expectations. |
| 177 | Provide a parameterized test row with [403, 'Your team is blocked.', 'MODEL_ACCESS', 'account access'],; the test receives these values as its inputs and expectations. |
| 178 | Provide a parameterized test row with [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],; the test receives these values as its inputs and expectations. |
| 179 | Provide a parameterized test row with [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],; the test receives these values as its inputs and expectations. |
| 180 | Provide a parameterized test row with [400, 'Invalid argument.', 'MODEL_REQUEST', 'rejected the request'],; the test receives these values as its inputs and expectations. |
| 181 | Provide a parameterized test row with [422, 'Invalid field format.', 'MODEL_REQUEST', 'rejected the request'],; the test receives these values as its inputs and expectations. |
| 182 | Provide a parameterized test row with [400, 'json_schema is invalid.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations. |
| 183 | Provide a parameterized test row with [400, 'response_format json_schema is not supported.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 184 | Provide a parameterized test row with [400, 'This model does not support image input.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 185 | Provide a parameterized test row with [422, 'Function calling is not supported by this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations. |
| 186 | Provide a parameterized test row with [400, 'The maximum context length was exceeded.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations. |
| 187 | Provide a parameterized test row with [400, 'The request payload is too large.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations. |
| 188 | Provide a parameterized test row with [413, 'Synthetic size rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],; the test receives these values as its inputs and expectations. |
| 189 | Provide a parameterized test row with [408, 'Synthetic request timeout.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations. |
| 190 | Provide a parameterized test row with [504, 'Synthetic gateway timeout.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations. |
| 191 | Provide a parameterized test row with [500, 'Synthetic internal failure.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations. |
| 192 | Provide a parameterized test row with [502, 'Synthetic upstream failure.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations. |
| 193 | Provide a parameterized test row with [503, 'Synthetic unavailable.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations. |
| 194 | Apply the preceding scenario rows to the parameterized test "classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details" and begin its callback. |
| 195 | Call `expectSanitized` with the result of `xaiSdkError` using `message`, `status`, `code`, `action`. |
| 196 | Close the callback or control-flow body and finish the surrounding syntax. |
| 197 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 198 | Register a test that "recognizes direct and nested structured error codes and string messages privately". |
| 199 | Call `expectSanitized` with the result of `xaiSdkError` using `privateDetail`, 429, "insufficient_quota", "API_QUOTA", "billing". |
| 200 | Call `expectSanitized` with an object containing status: 400, error: an object containing code: "invalid_api_key", message: `privateDetail`, "API_AUTH", "Grok API key". |
| 201 | Call `expectSanitized` with an object containing status: 400, error: an object containing error: an object containing code: "model_not_found", message: `privateDetail`, "MODEL_ACCESS", "model ID". |
| 202 | Call `expectSanitized` with an object containing status: 403, error: an object containing error: an object containing code: "billing_hard_limit_reached", message: `privateDetail`, "API_QUOTA", "billing". |
| 203 | Call `expectSanitized` with an object containing status: 400, error: text interpolating `privateDetail`, "API_AUTH", "Grok API key". |
| 204 | Call `expectSanitized` with an object containing status: 400, error: an object containing error: text interpolating `privateDetail`, "API_AUTH", "Grok API key". |
| 205 | Close the callback or control-flow body and finish the surrounding syntax. |
| 206 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 207 | Register a test that "keeps unknown errors neutral, preserves HTTP precedence and does not change other providers". |
| 208 | Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 401, "API_AUTH", "selected provider". |
| 209 | Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 403, "MODEL_ACCESS", "account access". |
| 210 | Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 429, "API_RATE_LIMIT", "usage limits". |
| 211 | Iterate const status over an array containing 400, 422. |
| 212 | Call `expectSanitized` with an object containing status, error: an object containing error: an object containing message: an object containing secret: `xaiKey`, "MODEL_REQUEST", "rejected the request". |
| 213 | Assert that `publicError(xaiSdkError(privateDetail, status), 'xai').message` does not satisfy: contains "does not support". |
| 214 | Close the callback or control-flow body and finish the surrounding syntax. |
| 215 | Iterate const provider over an array containing "openai", "anthropic", "google". |
| 216 | Assert that `publicError(xaiSdkError('Incorrect API key provided.', 400), provider).code` strictly equals "MODEL_REQUEST". |
| 217 | Assert that `publicError(xaiSdkError('Your team has no credits.', 403), provider).code` strictly equals "MODEL_ACCESS". |
| 218 | Close the callback or control-flow body and finish the surrounding syntax. |
| 219 | Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "Known safe application message.". |
| 220 | Assert that the result of `publicError` using `safe`, "xai" strictly equals `safe`. |
| 221 | Declare `unknown` as the result of `publicError` using a new `Error` instance initialized with text interpolating `privateDetail`, `privateUrl`, "xai". |
| 222 | Assert that `unknown.code` strictly equals "PREPARATION_FAILED". |
| 223 | Assert that `unknown.message` does not satisfy: contains `privateDetail`. |
| 224 | Assert that `unknown.stack` does not satisfy: contains `xaiKey`. |
| 225 | Close the callback or control-flow body and finish the surrounding syntax. |
| 226 | Close the callback or control-flow body and finish the surrounding syntax. |
