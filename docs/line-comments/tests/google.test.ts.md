# Line explanations: tests/google.test.ts

Source: [tests/google.test.ts](../../../tests/google.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests. |
| 2 | Import { tool } from "@langchain/core/tools" for these regression tests. |
| 3 | Import { z } from "zod" for these regression tests. |
| 4 | Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests. |
| 5 | Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests. |
| 6 | Import { buildFieldPlan, DEFAULT_MODELS, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests. |
| 7 | Import type { createEnvironmentTools } from "../src/environment.js" for these regression tests. |
| 8 | Import type { BrowserSession } from "../src/browser/session.js" for these regression tests. |
| 9 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 10 | Declare `emptyContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent). |
| 11 | Declare `extracted` as an object whose fields are defined below. |
| 12 | Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". |
| 13 | Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "Primary Residence". |
| 14 | Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent). |
| 15 | Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000. |
| 16 | Set fixture property `salePrice` to 485000. Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent). |
| 17 | Set fixture property `borrower` to `emptyContact`. Set fixture property `coBorrower` to `emptyContact`. |
| 18 | Set fixture property `listingAgent` to an object containing values copied from `emptyContact`, firstName: "Avery", lastName: "Ellis", email: "listing@example.test". Set fixture property `buyerAgent` to `emptyContact`. |
| 19 | Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. |
| 20 | Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase", an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase price $485,000". |
| 21 | Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional". |
| 22 | Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase". |
| 23 | Set fixture property `field` to "salePrice". Set fixture property `document` to "salesContract". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase price $485,000". |
| 24 | Set fixture property `warnings` to an empty array. |
| 25 | Close the fixture object for `extracted` and finish the surrounding syntax. |
| 26 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 27 | Define helper `payload` with parameters model for the fixture operations below. |
| 28 | Return an object whose fields are defined below to the caller. |
| 29 | Set fixture property `urla` to an object containing name: "sample.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA". |
| 30 | Set fixture property `salesContract` to an object containing name: "purchase.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract". |
| 31 | Close the callback or control-flow body for `payload` and finish the surrounding syntax. |
| 32 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 33 | Define the TypeScript shape `JsonSchema` used by the test fixtures; this adds no runtime value. |
| 34 | Declare optional fixture property `type` with type `string \| string[]`. |
| 35 | Declare optional fixture property `nullable` with type `boolean`. |
| 36 | Declare optional fixture property `required` with type `string[]`. |
| 37 | Declare optional fixture property `properties` with type `Record&lt;string, JsonSchema&gt;`. |
| 38 | Declare optional fixture property `exclusiveMinimum` with type `number`. |
| 39 | Declare optional fixture property `anyOf` with type `JsonSchema[]`. |
| 40 | Finish the surrounding expression and delimiters. |
| 41 | Define the TypeScript shape `GooglePart` used by the test fixtures; this adds no runtime value. |
| 42 | Declare optional fixture property `text` with type `string`. |
| 43 | Declare optional fixture property `inlineData` with type `{ mimeType: string; data: string }`. |
| 44 | Declare optional fixture property `fileData` with type `unknown`. |
| 45 | Declare optional fixture property `functionCall` with type `{ id?: string; name: string; args: unknown }`. |
| 46 | Declare optional fixture property `functionResponse` with type `{ id?: string; name: string; response: { result: unknown } }`. |
| 47 | Declare optional fixture property `thoughtSignature` with type `string`. |
| 48 | Finish the surrounding expression and delimiters. |
| 49 | Define the TypeScript shape `GoogleBody` used by the test fixtures; this adds no runtime value. |
| 50 | Declare fixture property `contents` with type `Array&lt;{ role: string; parts: GooglePart[] }&gt;`. |
| 51 | Declare optional fixture property `systemInstruction` with type `{ parts: Array&lt;{ text: string }&gt; }`. |
| 52 | Declare optional fixture property `generationConfig` with type `{ responseMimeType?: string; responseJsonSchema?: JsonSchema; temperature?: number; thinkingConfig?: unknown }`. |
| 53 | Declare optional fixture property `tools` with type `Array&lt;{ functionDeclarations?: Array&lt;{ name: string; parameters: JsonSchema }&gt; }&gt;`. |
| 54 | Declare optional fixture property `toolConfig` with type `{ functionCallingConfig?: { mode?: string; allowedFunctionNames?: string[] } }`. |
| 55 | Declare optional fixture property `store` with type `unknown`. |
| 56 | Finish the surrounding expression and delimiters. |
| 57 | Define helper `googleResponse` with parameters parts for the fixture operations below. |
| 58 | Return an object whose fields are defined below to the caller. |
| 59 | Set fixture property `usageMetadata` to an object containing promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20. Set fixture property `modelVersion` to `DEFAULT_MODELS.google`. |
| 60 | Close the callback or control-flow body for `googleResponse` and finish the surrounding syntax. |
| 61 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 62 | Group regression tests for "Google Gemini actual adapter transport". |
| 63 | Declare `requests` for assignment later. |
| 64 | Declare `respond` for assignment later. |
| 65 | Run this setup before every test in the group. |
| 66 | Assign an empty array to `requests`. |
| 67 | Assign a callback that returns the result of `Response.json` using the result of `googleResponse` with no arguments to `respond`. |
| 68 | Set all three LangSmith/LangChain tracing environment flags to false for the test. |
| 69 | Set ambient Google, Gemini, OpenAI, and Anthropic keys to synthetic unselected values so the transport must use the explicit job key. |
| 70 | Temporarily set environment variable "GOOGLE_CLOUD_CREDENTIALS" to "malformed-synthetic-credentials-must-not-be-parsed" for this test. |
| 71 | Temporarily set environment variable "GOOGLE_APPLICATION_CREDENTIALS" to "C:/synthetic-missing-credentials.json" for this test. |
| 72 | Temporarily set environment variable "GOOGLE_GENAI_USE_VERTEXAI" to "true" for this test. |
| 73 | Temporarily set environment variable "LANGSMITH_GATEWAY" to "https://untrusted.invalid/google" for this test. |
| 74 | Temporarily set environment variable "GOOGLE_GEMINI_BASE_URL" to "https://untrusted.invalid/google" for this test. |
| 75 | Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows. |
| 76 | Declare `request` as a new `Request` instance initialized with `input`, `init`. |
| 77 | Declare `body` as the resolved value from `request.json` with no arguments. |
| 78 | Append an object whose fields are defined below to `requests` for later inspection. |
| 79 | Set fixture property `authorization` to the result of `request.headers.get` using "authorization". Set fixture property `redirect` to `request.redirect`. Set fixture property `signal` to `request.signal`. |
| 80 | Return the result of `respond` using `body`, `requests.length` to the caller. |
| 81 | Close the callback or control-flow body and finish the surrounding syntax. |
| 82 | Close the callback or control-flow body and finish the surrounding syntax. |
| 83 | Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables.. |
| 84 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 85 | Register a parameterized test that "uses the explicitly selected key/model with inline PDFs and native JSON schema for %s". |
| 86 | Declare `documents` as the result of `payload` using `modelId`. |
| 87 | Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `modelId`, "google", `new AbortController().signal`. |
| 88 | Assert that `result` deeply equals `extracted`. |
| 89 | Assert that `requests` has length 1. |
| 90 | Declare `request` as `requests[0]`. |
| 91 | Assert that `request.url` strictly equals text interpolating the result of `encodeURIComponent` using `modelId`. |
| 92 | Assert that `request.keyMatches` strictly equals true. |
| 93 | Assert that `request.authorization` is null. |
| 94 | Assert that `request.redirect` strictly equals "error". |
| 95 | Assert that `request.body.store` is undefined. |
| 96 | Assert that `request.body.tools` is undefined. |
| 97 | Assert that `request.body.generationConfig?.temperature` is undefined. |
| 98 | Assert that `request.body.generationConfig?.thinkingConfig` is undefined. |
| 99 | Assert that `request.body.generationConfig?.responseMimeType` strictly equals "application/json". |
| 100 | Declare `schema` as `request.body.generationConfig?.responseJsonSchema`. |
| 101 | Assert that the result of `schema?.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments. |
| 102 | Assert that `schema?.properties?.borrower?.properties?.firstName?.type` deeply equals an array containing "string", "null". |
| 103 | Assert that `schema?.properties?.loanAmount` contains the expected object fields an object containing anyOf: an array containing an object containing type: "number", exclusiveMinimum: 0, an object containing type: "null". |
| 104 | Declare `parts` as the result of `request.body.contents.flatMap` using a callback that returns `content.parts`. |
| 105 | Assert that the result of `parts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using `'base64'`, an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using `'base64'`. |
| 106 | Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using "base64". |
| 107 | Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using "base64". |
| 108 | Close the array of fixture values and finish the surrounding syntax. |
| 109 | Iterate const [filename, otherFilename, data] over an array containing an array containing "urla.pdf", "sales-contract.pdf", the result of `documents.urla.buffer.toString` using `'base64'`, an array containing "sales-contract.pdf", "urla.pdf", the result of `documents.salesContract!.buffer.toString` using `'base64'`. |
| 110 | Provide a parameterized test row with ['urla.pdf', 'sales-contract.pdf', documents.urla.buffer.toString('base64')],; the test receives these values as its inputs and expectations. |
| 111 | Provide a parameterized test row with ['sales-contract.pdf', 'urla.pdf', documents.salesContract!.buffer.toString('base64')],; the test receives these values as its inputs and expectations. |
| 112 | Finish the scenario array and begin the loop body that checks each listed case. |
| 113 | Declare `pdfIndex` as the result of `parts.findIndex` using a callback that returns `part.inlineData?.data` strictly equals `data`. |
| 114 | Declare `sourceMarker` as `parts[pdfIndex - 1]?.text`. |
| 115 | Assert that `sourceMarker` contains `filename`. |
| 116 | Assert that `sourceMarker` does not satisfy: contains `otherFilename`. |
| 117 | Close the callback or control-flow body and finish the surrounding syntax. |
| 118 | Assert that the result of `parts.some` using a callback that returns `part.fileData` strictly equals false. |
| 119 | Assert that the result of `parts.map(part =&gt; part.text ?? '').join` using "\n" contains "Keep unavailable text and numeric amounts null". |
| 120 | Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains `documents.input.apiKey`. |
| 121 | Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains "synthetic-unselected-key". |
| 122 | Declare `{ plan }` as the result of `buildFieldPlan` using `result`, `documents.input`, true. |
| 123 | Assert that `plan.find(field =&gt; field.key === 'salePrice')?.value` strictly equals "485000". |
| 124 | Assert that `plan.find(field =&gt; field.key === 'loanAmount')?.value` strictly equals "388000". |
| 125 | Close the callback or control-flow body and finish the surrounding syntax. |
| 126 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 127 | Register a test that "sends only the URLA when the optional contract is absent". |
| 128 | Declare `{ salesContract: _contract, ...documents }` as the result of `payload` with no arguments. |
| 129 | Call `extractOrder` with `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal`. Wait for completion before continuing. |
| 130 | Assert that `requests` has length 1. |
| 131 | Declare `parts` as the result of `requests[0]!.body.contents.flatMap` using a callback that returns `content.parts`. |
| 132 | Assert that the result of `parts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using `'base64'`. |
| 133 | Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using "base64". |
| 134 | Close the array of fixture values and finish the surrounding syntax. |
| 135 | Declare `sourceMarker` as `parts[parts.findIndex(part =&gt; part.inlineData) - 1]?.text`. |
| 136 | Assert that `sourceMarker` contains "urla.pdf". |
| 137 | Assert that `sourceMarker` does not satisfy: contains "sales-contract.pdf". |
| 138 | Close the callback or control-flow body and finish the surrounding syntax. |
| 139 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 140 | Register a test that "sends no request when the caller cancels before extraction starts". |
| 141 | Declare `controller` as a new `AbortController` instance. |
| 142 | Abort `controller` with a new `DOMException` instance initialized with "Synthetic caller cancellation", "AbortError". |
| 143 | Declare `documents` as the result of `payload` with no arguments. |
| 144 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `controller.signal` rejects with an error. Wait for the asynchronous assertion to settle. |
| 145 | Assert that `requests` has length 0. |
| 146 | Assert that `fetch` does not satisfy: was called. |
| 147 | Close the callback or control-flow body and finish the surrounding syntax. |
| 148 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 149 | Register a test that "propagates in-flight caller cancellation to the actual Google transport without retrying". |
| 150 | Declare `markStarted` for assignment later. |
| 151 | Declare `started` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `markStarted`.. |
| 152 | Declare `transportAborted` as false. |
| 153 | Assign a callback that returns a new `Promise` instance initialized with a callback whose body follows to `respond`. |
| 154 | Declare `transportSignal` as `requests.at(-1)!.signal`. |
| 155 | Call `transportSignal.addEventListener` with "abort", a callback whose body follows, an object containing once: true. |
| 156 | Assign true to `transportAborted`. |
| 157 | Call `reject` with `transportSignal.reason`. |
| 158 | Set fixture property `once` to true. |
| 159 | Call `markStarted` without arguments. |
| 160 | Close the callback or control-flow body and finish the surrounding syntax. |
| 161 | Declare `controller` as a new `AbortController` instance. |
| 162 | Declare `documents` as the result of `payload` with no arguments. |
| 163 | Declare `result` as the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `controller.signal`. |
| 164 | Declare `rejected` as the result of `expect(result).rejects.toThrow` with no arguments. |
| 165 | Wait for `started` to settle before continuing. |
| 166 | Assert that `requests` has length 1. |
| 167 | Assert that `requests[0]!.signal.aborted` strictly equals false. |
| 168 | Abort `controller` with a new `DOMException` instance initialized with "Synthetic caller cancellation", "AbortError". |
| 169 | Wait for `rejected` to settle before continuing. |
| 170 | Assert that `transportAborted` strictly equals true. |
| 171 | Assert that `requests[0]!.signal.aborted` strictly equals true. |
| 172 | Assert that `requests` has length 1. |
| 173 | Close the callback or control-flow body and finish the surrounding syntax. |
| 174 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 175 | Register a parameterized test that "locally rejects $name despite a successful native JSON response". |
| 176 | Set fixture property `name` to "zero sale price". Set fixture property `data` to an object containing values copied from `extracted`, salePrice: 0. |
| 177 | Set fixture property `name` to "missing required contact property". Set fixture property `data` to an object containing values copied from `extracted`, listingAgent: an object containing email: "listing@example.test". |
| 178 | Set fixture property `name` to "invalid classification". Set fixture property `data` to an object containing values copied from `extracted`, loanProgram: "Invalid". |
| 179 | Set fixture property `name` to "invalid evidence source". Set fixture property `data` to an object containing values copied from `extracted`, evidence: an array containing an object containing field: "salePrice", document: "unknown", page: 1, quote: "Synthetic". |
| 180 | Apply the preceding scenario rows to the parameterized test "locally rejects $name despite a successful native JSON response" and begin its callback. |
| 181 | Assign a callback that returns the result of `Response.json` using the result of `googleResponse` using an array containing `{ text: JSON.stringify(data) }` to `respond`. |
| 182 | Declare `documents` as the result of `payload` with no arguments. |
| 183 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle. |
| 184 | Assert that `requests` has length 1. |
| 185 | Close the callback or control-flow body and finish the surrounding syntax. |
| 186 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 187 | Register a test that "retries an explicitly unsupported native schema once with a tool schema on the same provider/model/key". |
| 188 | Declare `documents` as the result of `payload` using "custom-supported-model". |
| 189 | Assign a callback that returns the result of `Response.json` using an object containing error: `{ code: 400, status: 'INVALID_ARGUMENT', message: 'responseJsonSchema is not supported with this model' }`, an object containing status: `400` when `index` strictly equals 1, otherwise the result of `Response.json` using the result of `googleResponse` using `[{ functionCall: { name: 'appraisal_document_data', args: extracted }, thoughtSignature: 'c3ludGhldGljLWV4dHJhY3Q=' }]` to `respond`. |
| 190 | Set fixture property `error` to an object containing code: 400, status: "INVALID_ARGUMENT", message: "responseJsonSchema is not supported with this model". Set fixture property `status` to 400. |
| 191 | Set fixture property `functionCall` to an object containing name: "appraisal_document_data", args: `extracted`. Set fixture property `thoughtSignature` to "c3ludGhldGljLWV4dHJhY3Q=". |
| 192 | Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal`. |
| 193 | Assert that `result` deeply equals `extracted`. |
| 194 | Assert that `requests` has length 2. |
| 195 | Assert that `new Set(requests.map(request =&gt; request.url)).size` strictly equals 1. |
| 196 | Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.authorization` strictly equals `null` strictly equals true. |
| 197 | Assert that `requests[0]!.body.generationConfig?.responseJsonSchema` is defined. |
| 198 | Assert that `requests[1]!.body.generationConfig?.responseJsonSchema` is undefined. |
| 199 | Declare `functions` as the result of `requests[1]!.body.tools?.flatMap` using a callback that returns `tool.functionDeclarations` or, if null/undefined, an empty array. |
| 200 | Assert that the result of `functions?.map` using a callback that returns `fn.name` deeply equals an array containing "appraisal_document_data". |
| 201 | Assert that the result of `functions?.[0]?.parameters.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments. |
| 202 | Assert that `functions?.[0]?.parameters.properties?.borrower?.properties?.firstName` contains the expected object fields an object containing type: "string", nullable: true. |
| 203 | Assert that `requests[1]!.body.toolConfig?.functionCallingConfig` contains the expected object fields an object containing mode: "ANY", allowedFunctionNames: an array containing "appraisal_document_data". |
| 204 | Close the callback or control-flow body and finish the surrounding syntax. |
| 205 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 206 | Register a parameterized test that "does not retry output formats or reroute after HTTP $status: $message". |
| 207 | Set fixture property `status` to 400. Set fixture property `message` to "Invalid schema: too many nested fields in responseJsonSchema". |
| 208 | Set fixture property `status` to 400. Set fixture property `message` to "Billing is not enabled for this project.". |
| 209 | Set fixture property `status` to 401. Set fixture property `message` to "Invalid API key.". |
| 210 | Set fixture property `status` to 403. Set fixture property `message` to "Permission denied for this model.". |
| 211 | Set fixture property `status` to 404. Set fixture property `message` to "Requested model was not found.". |
| 212 | Set fixture property `status` to 422. Set fixture property `message` to "responseJsonSchema is not supported with this model". |
| 213 | Apply the preceding scenario rows to the parameterized test "does not retry output formats or reroute after HTTP $status: $message" and begin its callback. |
| 214 | Assign a callback that returns the result of `Response.json` using an object containing error: an object containing code: `status`, status: `'INVALID_ARGUMENT'`, message, an object containing status to `respond`. |
| 215 | Declare `documents` as the result of `payload` using "selected-custom-model". |
| 216 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle. |
| 217 | Assert that `requests` has length 1. |
| 218 | Assert that `requests[0]!.url` strictly equals "https://generativelanguage.googleapis.com/v1beta/models/selected-custom-model:generateContent". |
| 219 | Assert that `requests[0]!.keyMatches` strictly equals true. |
| 220 | Assert that `requests[0]!.body.tools` is undefined. |
| 221 | Close the callback or control-flow body and finish the surrounding syntax. |
| 222 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 223 | Register a test that "preserves real screenshot image parts and both thought signatures across bounded agent tool steps". |
| 224 | Declare `documents` as the result of `payload` with no arguments. |
| 225 | Declare `imageContent` as an array containing an object containing type: "text", text: "Synthetic order page only.", an object containing type: "image_url", image_url: an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto". |
| 226 | Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page only.". |
| 227 | Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto". |
| 228 | Close the array of fixture values for `imageContent` and finish the surrounding syntax. |
| 229 | Declare `originalContent` as the result of `structuredClone` using `imageContent`. |
| 230 | Declare `screenshot` as the result of `tool` using a promise-returning callback that returns `imageContent`, an object containing name: "screenshot_page", description: "Read a synthetic page image.", schema: the result of `z.object` using an empty object. |
| 231 | Declare `signatureA` as "c3ludGhldGljLXNpZ25hdHVyZS1h". |
| 232 | Declare `signatureB` as "c3ludGhldGljLXNpZ25hdHVyZS1i". |
| 233 | Assign a callback that returns the result of `Response.json` using the result of `googleResponse` using `[{ functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA }]` when `index === 1`, otherwise `index === 2 ? [{ functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB }] : [{ text: 'Ready for human review.' }]` to `respond`. |
| 234 | Set fixture property `functionCall` to an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object. Set fixture property `thoughtSignature` to `signatureA`. |
| 235 | Set fixture property `functionCall` to an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object. Set fixture property `thoughtSignature` to `signatureB`. |
| 236 | Set fixture property `text` to "Ready for human review.". |
| 237 | Call `prepareOrderWithAgent` with an object whose fields are defined below. Wait for completion before continuing. |
| 238 | Set fixture property `environment` to an object containing tools: an empty array. |
| 239 | Set fixture property `session` to an object containing tools: an array containing `screenshot`. Set fixture property `plan` to an empty array. Set fixture property `signal` to `new AbortController().signal`. |
| 240 | Assert that `requests` has length 3. |
| 241 | Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.url` strictly equals `requests[0]!.url` strictly equals true. |
| 242 | Assert that `imageContent` deeply equals `originalContent`. |
| 243 | Declare `secondParts` as the result of `requests[1]!.body.contents.flatMap` using a callback that returns `content.parts`. |
| 244 | Assert that the result of `secondParts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "image/png", data: "iVBORw0KGgo=". |
| 245 | Declare `result` as `secondParts.find(part =&gt; part.functionResponse?.name === 'screenshot_page')?.functionResponse`. |
| 246 | Assert that `result?.response.result` deeply equals an array containing an object containing type: "text", text: "Synthetic order page only.". |
| 247 | Assert that the result of `JSON.stringify` using `result` does not satisfy: contains "iVBORw0KGgo=". |
| 248 | Declare `signedCalls` as the result of `requests[2]!.body.contents.filter(content =&gt; content.role === 'model') .flatMap(content =&gt; content.parts).filter` using a callback that returns `part.functionCall`. |
| 249 | Flatten all message parts and keep only native functionCall parts for tool-history assertions. |
| 250 | Assert that `signedCalls` deeply equals an array containing an object containing functionCall: an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object, thoughtSignature: `signatureA`, an object containing functionCall: an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object, thoughtSignature: `signatureB`. |
| 251 | Set fixture property `functionCall` to an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object. Set fixture property `thoughtSignature` to `signatureA`. |
| 252 | Set fixture property `functionCall` to an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object. Set fixture property `thoughtSignature` to `signatureB`. |
| 253 | Close the array of fixture values and finish the surrounding syntax. |
| 254 | Assert that the result of `requests[2]!.body.tools?.flatMap(tool =&gt; tool.functionDeclarations ?? []).map(fn =&gt; fn.name).sort` with no arguments deeply equals an array containing "get_order_field_plan", "screenshot_page". |
| 255 | Assert that the result of `requests[2]!.body.systemInstruction?.parts.map(part =&gt; part.text).join` using "\n" contains "Do not submit". |
| 256 | Close the callback or control-flow body and finish the surrounding syntax. |
| 257 | Close the callback or control-flow body and finish the surrounding syntax. |
