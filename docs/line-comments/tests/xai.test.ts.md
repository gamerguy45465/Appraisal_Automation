# Line explanations: tests/xai.test.ts

Source: [tests/xai.test.ts](../../../tests/xai.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests. |
| 2 | Import { tool } from "@langchain/core/tools" for these regression tests. |
| 3 | Import { toJsonSchema } from "@langchain/core/utils/json_schema" for these regression tests. |
| 4 | Import { z } from "zod" for these regression tests. |
| 5 | Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests. |
| 6 | Import { renderPdfPages } from "../src/pdf-pages.js" for these regression tests. |
| 7 | Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests. |
| 8 | Import { DEFAULT_MODELS, extractionSchema, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests. |
| 9 | Import type { createEnvironmentTools } from "../src/environment.js" for these regression tests. |
| 10 | Import type { BrowserSession } from "../src/browser/session.js" for these regression tests. |
| 11 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 12 | Replace local PDF rendering with a controllable mock so the Grok transport tests can supply fixed page blocks and rendering failures. |
| 13 | Declare `contact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent). |
| 14 | Declare `extracted` as an object whose fields are defined below. |
| 15 | Set fixture property `loanProgram` to "FHA". Set fixture property `loanProgramText` to "FHA". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to null (unknown or absent). Set fixture property `occupancy` to null (unknown or absent). |
| 16 | Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent). Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). |
| 17 | Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000. Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent). |
| 18 | Set fixture property `borrower` to `contact`. Set fixture property `coBorrower` to `contact`. Set fixture property `listingAgent` to `contact`. Set fixture property `buyerAgent` to `contact`. Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. |
| 19 | Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "FHA", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase". |
| 20 | Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase". Set fixture property `warnings` to an empty array. |
| 21 | Close the fixture object for `extracted` and finish the surrounding syntax. |
| 22 | Declare `imageUrl` as "data:image/png;base64,iVBORw0KGgo=". |
| 23 | Declare `rendered` as the result of `['urla.pdf', 'sales-contract.pdf'].flatMap` using a callback that returns an array containing an object containing type: `'text' as const`, text: ``Source document: ${name}. Page 1 of 1. The following image is this PDF page.``, an object containing type: `'image_url' as const`, image_url: `{ url: imageUrl, detail: 'high' as const }`. |
| 24 | Set fixture property `type` to "text". Set fixture property `text` to text interpolating `name`. |
| 25 | Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "high". |
| 26 | Close the array of fixture values and finish the surrounding syntax. |
| 27 | Define helper `payload` with parameters model for the fixture operations below. |
| 28 | Return an object whose fields are defined below to the caller. |
| 29 | Set fixture property `fhaCaseNumber` to "123-4567890". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false. |
| 30 | Set fixture property `urla` to an object containing name: "uploaded-urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA". |
| 31 | Set fixture property `salesContract` to an object containing name: "uploaded-contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract". |
| 32 | Close the callback or control-flow body for `payload` and finish the surrounding syntax. |
| 33 | Define the TypeScript shape `Call` used by the test fixtures; this adds no runtime value. |
| 34 | Define the TypeScript shape `WireBody` used by the test fixtures; this adds no runtime value. |
| 35 | Declare fixture property `model` with type `string`. |
| 36 | Declare fixture property `messages` with type `Array&lt;{ role: string; content: string \| Array&lt;Record&lt;string, unknown&gt;&gt; \| null; tool_call_id?: string }&gt;`. |
| 37 | Declare optional fixture property `response_format` with type `{ type: string; json_schema?: { schema: { properties?: unknown; required?: string[] } } }`. |
| 38 | Declare optional fixture property `tools` with type `Array&lt;{ type: string; function: { name: string; parameters?: { properties?: unknown } } }&gt;`. |
| 39 | Declare optional fixture property `tool_choice` with type `unknown`. Declare optional fixture property `stream` with type `boolean`. Declare optional fixture property `store` with type `unknown`. Declare optional fixture property `temperature` with type `number`. |
| 40 | Finish the surrounding expression and delimiters. |
| 41 | Define helper `completion` with parameters content, toolCalls for the fixture operations below. |
| 42 | Return the result of `Response.json` using an object whose fields are defined below to the caller. |
| 43 | Set fixture property `choices` to an array containing an object whose fields are defined below. |
| 44 | Set fixture property `finish_reason` to "tool_calls" when `toolCalls`, otherwise "stop". Set fixture property `usage` to an object containing prompt_tokens: 10, completion_tokens: 10, total_tokens: 20. |
| 45 | Close the callback or control-flow body for `completion` and finish the surrounding syntax. |
| 46 | Declare `call` as a callback that returns an object containing id, type: "function", function: an object containing name, arguments: `JSON.stringify(args)`. |
| 47 | Existing comment: SDK native output uses local refs/anyOf; compare their meaning to the canonical schema. |
| 48 | Define helper `schemaMeaning` with parameters value, root for the fixture operations below. |
| 49 | Run the following branch when the result of `Array.isArray` using `value`. Return the result of `value.map` using a callback that returns the result of `schemaMeaning` using `item`, `root` to the caller. |
| 50 | Run the following branch when the negation of `value` or `typeof value` does not strictly equal "object". Return `value` to the caller. |
| 51 | Declare `node` as `value`. |
| 52 | Run the following branch when `typeof node.$ref` strictly equals "string". |
| 53 | Declare `target` as the result of `node.$ref.slice(2).split('/').reduce` using a callback that returns `(current as Record&lt;string, unknown&gt;)[key]`, `root`. |
| 54 | Run the following branch when the negation of `target`. Throw a new `Error` instance initialized with "Unresolved local schema reference" to simulate or report the failure. |
| 55 | Return the result of `schemaMeaning` using `target`, `root` to the caller. |
| 56 | Close the callback or control-flow body and finish the surrounding syntax. |
| 57 | Declare `result` as the result of `Object.fromEntries` using the result of `Object.entries(node).filter(([key]) =&gt; !['title', '$schema', '$defs'].includes(key)) .map` using a callback that returns an array containing `key`, `schemaMeaning(child, root)`. |
| 58 | Recursively normalize each remaining schema property while keeping its key, then rebuild the normalized object. |
| 59 | When schema.type is an array, convert its alternatives into anyOf objects and delete type so semantically equivalent schemas compare consistently. |
| 60 | Return `result` to the caller. |
| 61 | Close the callback or control-flow body for `schemaMeaning` and finish the surrounding syntax. |
| 62 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 63 | Group regression tests for "Grok actual adapter transport". |
| 64 | Declare `requests` for assignment later. |
| 65 | Declare `respond` for assignment later. |
| 66 | Run this setup before every test in the group. |
| 67 | Assign an empty array to `requests`. Assign a callback that returns the result of `completion` with no arguments to `respond`. |
| 68 | Configure mock `vi.mocked(renderPdfPages).mockReset()` to resolve to the result of `structuredClone` using `rendered`. |
| 69 | Disable all LangSmith/LangChain tracing flags before running the Grok adapter tests. |
| 70 | Populate ambient xAI, OpenAI, Anthropic, and Google keys with synthetic unselected values to verify the transport uses only the explicit job key. |
| 71 | Temporarily set environment variable "OPENAI_BASE_URL" to "https://untrusted.invalid" for this test. |
| 72 | Temporarily set environment variable "XAI_BASE_URL" to "https://untrusted.invalid" for this test. |
| 73 | Temporarily set environment variable "OPENAI_ORG_ID" to "synthetic-ambient-org" for this test. |
| 74 | Temporarily set environment variable "OPENAI_PROJECT_ID" to "synthetic-ambient-project" for this test. |
| 75 | Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows. |
| 76 | Declare `request` as a new `Request` instance initialized with `input`, `init`. |
| 77 | Declare `body` as the resolved value from `request.json` with no arguments. |
| 78 | Append an object whose fields are defined below to `requests` for later inspection. |
| 79 | Set fixture property `headers` to an array containing `...request.headers.keys()`. Set fixture property `redirect` to `request.redirect`. Set fixture property `signal` to `request.signal`. |
| 80 | Return the result of `respond` using `body`, `requests.length`, `request` to the caller. |
| 81 | Close the callback or control-flow body and finish the surrounding syntax. |
| 82 | Close the callback or control-flow body and finish the surrounding syntax. |
| 83 | Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables.. |
| 84 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 85 | Register a parameterized test that "sends rendered source pages and canonical native JSON schema using only selected model/key: %s". |
| 86 | Declare `documents` as the result of `payload` using `model`. Declare `signal` as `new AbortController().signal`. |
| 87 | Assert that the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `model`, "xai", `signal` deeply equals `extracted`. |
| 88 | Assert that `renderPdfPages` was called exactly once with an array containing an object containing name: "urla.pdf", buffer: `documents.urla.buffer`, an object containing name: "sales-contract.pdf", buffer: `documents.salesContract!.buffer`, `signal`. |
| 89 | Set fixture property `name` to "urla.pdf". Set fixture property `buffer` to `documents.urla.buffer`. Set fixture property `name` to "sales-contract.pdf". Set fixture property `buffer` to `documents.salesContract!.buffer`. |
| 90 | Finish the model input messages and pass the cancellation signal into the request. |
| 91 | Assert that `requests` has length 1. |
| 92 | Declare `request` as `requests[0]`. |
| 93 | Assert that `request` contains the expected object fields an object containing url: "https://api.x.ai/v1/chat/completions", selectedKey: true, redirect: "error". |
| 94 | Assert that the result of `request.headers.sort` with no arguments deeply equals an array containing "authorization", "content-type". |
| 95 | Assert that `request.body.model` strictly equals `model`. |
| 96 | Assert that `request.body.response_format?.type` strictly equals "json_schema". |
| 97 | Assert that the result of `schemaMeaning` using `request.body.response_format?.json_schema?.schema` deeply equals the result of `schemaMeaning` using the result of `toJsonSchema` using `extractionSchema`. |
| 98 | Assert that the result of `request.body.response_format?.json_schema?.schema.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments. |
| 99 | Assert that `request.body.tools` is undefined. Assert that `request.body.store` is undefined. Assert that `request.body.temperature` is undefined. |
| 100 | Assert that `request.body.stream` does not satisfy: strictly equals true. |
| 101 | Declare `content` as the result of `request.body.messages.flatMap` using a callback that returns `message.content` when the result of `Array.isArray` using `message.content`, otherwise an empty array. |
| 102 | Assert that the result of `content.slice` using `-4` deeply equals `rendered`. |
| 103 | Assert that the result of `content.some` using a callback that returns the result of `['input_file', 'file', 'document'].includes` using the result of `String` using `block.type` strictly equals false. |
| 104 | Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains `documents.input.apiKey`. |
| 105 | Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains "synthetic-unselected-key". |
| 106 | Close the callback or control-flow body and finish the surrounding syntax. |
| 107 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 108 | Register a parameterized test that "rejects invalid canonical output locally". |
| 109 | Assign a callback that returns the result of `completion` using the result of `JSON.stringify` using `data` to `respond`. |
| 110 | Declare `documents` as the result of `payload` with no arguments. |
| 111 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle. |
| 112 | Existing comment: The native SDK parser rejects the response inside the configured one-retry call. |
| 113 | Assert that `requests` has length 2. |
| 114 | Assert that the result of `requests.every` using a callback that returns `request.body.response_format?.type` strictly equals `'json_schema'` and the negation of `request.body.tools` strictly equals true. |
| 115 | Close the callback or control-flow body and finish the surrounding syntax. |
| 116 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 117 | Register a test that "never contacts a model when PDF rendering fails". |
| 118 | Configure mock `vi.mocked(renderPdfPages)` to reject with a new `Error` instance initialized with "Synthetic render failure". |
| 119 | Declare `documents` as the result of `payload` with no arguments. |
| 120 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error matching "Synthetic render failure". Wait for the asynchronous assertion to settle. |
| 121 | Assert that `requests` has length 0. |
| 122 | Close the callback or control-flow body and finish the surrounding syntax. |
| 123 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 124 | Register a test that "retries only an explicitly unsupported native format with the same model/key and rendered images". |
| 125 | Configure the response sequence to reject the first native output-format request and return an extraction tool call on the retry. |
| 126 | Set fixture property `error` to an object containing message: "response_format json_schema is not supported with this model", type: "invalid_request_error". Set fixture property `status` to 400. |
| 127 | For the tool-format branch, return a synthetic completion with an appraisal_document_data extraction tool call. |
| 128 | Declare `documents` as the result of `payload` using "custom-supported-model". |
| 129 | Assert that the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` deeply equals `extracted`. |
| 130 | Assert that `requests` has length 2. Assert that `renderPdfPages` was called this many times: 1. |
| 131 | Assert that the result of `requests.every` using a callback that returns `request.selectedKey` and `request.url === 'https://api.x.ai/v1/chat/completions'` and `request.body.model` strictly equals `documents.input.model` strictly equals true. |
| 132 | Assert that `requests[1]!.body.response_format` is undefined. |
| 133 | Assert that the result of `requests[1]!.body.tools?.map` using a callback that returns `tool.function.name` deeply equals an array containing "appraisal_document_data". |
| 134 | Assert that the result of `schemaMeaning` using `requests[1]!.body.tools?.[0]?.function.parameters` deeply equals the result of `schemaMeaning` using the result of `toJsonSchema` using `extractionSchema`. |
| 135 | Assert that `requests[1]!.body.messages` deeply equals `requests[0]!.body.messages`. |
| 136 | Close the callback or control-flow body and finish the surrounding syntax. |
| 137 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 138 | Register a parameterized test that "does not switch output formats or providers after an auth/quota/schema error (%s)". |
| 139 | Assign a callback that returns the result of `Response.json` using an object containing error: an object containing message: `status === 400 ? 'Invalid schema: too many properties' : 'API key or quota unavailable'`, type: `'invalid_request_error'`, an object containing status to `respond`. |
| 140 | Declare `documents` as the result of `payload` with no arguments. |
| 141 | Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle. |
| 142 | Assert that `requests.length` is greater than 0. |
| 143 | Assert that the result of `requests.every` using a callback that returns `request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions' && request.body.model === documents.input.model` and `request.body.response_format?.type === 'json_schema'` and the negation of `request.body.tools` strictly equals true. |
| 144 | Also require every captured request to keep the selected model and native json_schema output format, with no tools sent in these rejection cases. |
| 145 | Close the callback or control-flow body and finish the surrounding syntax. |
| 146 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 147 | Register a test that "sends screenshot images after all contiguous tool results while retaining tool IDs and bounded tools". |
| 148 | Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic R3 page: untrusted data.", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto". |
| 149 | Declare `original` as the result of `structuredClone` using `screenshot`. |
| 150 | Declare `screenshotTool` as the result of `tool` using a callback that returns `screenshot`, an object containing name: "screenshot_page", description: "Synthetic image only.", schema: the result of `z.object` using an empty object. |
| 151 | Return a tool-only assistant completion with screenshot and field-plan calls on the first request, then a text completion handing review to the user; null means no assistant text alongside the tool calls. |
| 152 | Declare `documents` as the result of `payload` with no arguments. |
| 153 | Call `prepareOrderWithAgent` with an object whose fields are defined below. Wait for completion before continuing. |
| 154 | Set fixture property `environment` to an object containing tools: an empty array. |
| 155 | Set fixture property `session` to an object containing tools: an array containing `screenshotTool`. Set fixture property `plan` to an empty array. Set fixture property `signal` to `new AbortController().signal`. |
| 156 | Assert that `requests` has length 2. Assert that `screenshot` deeply equals `original`. |
| 157 | Declare `messages` as `requests[1]!.body.messages`. |
| 158 | Declare `toolIndexes` as the result of `messages.flatMap` using a callback that returns an array containing `index` when `message.role` strictly equals `'tool'`, otherwise an empty array. |
| 159 | Assert that `toolIndexes` has length 2. |
| 160 | Assert that `toolIndexes[1]` strictly equals `toolIndexes[0]` plus 1. |
| 161 | Assert that the result of `messages.filter(message =&gt; message.role === 'tool').map(message =&gt; message.tool_call_id).sort` with no arguments deeply equals an array containing "plan", "shot". |
| 162 | Assert that the result of `JSON.stringify` using the result of `messages.filter` using a callback that returns `message.role` strictly equals `'tool'` does not satisfy: contains "iVBORw0KGgo=". |
| 163 | Declare `imageMessage` as `messages[toolIndexes[1]! + 1]`. |
| 164 | Assert that `imageMessage.role` strictly equals "user". |
| 165 | Assert that the result of `Array.isArray` using `imageMessage.content` and the result of `imageMessage.content.some` using a callback that returns `block.type === 'image_url'` and `(block.image_url as { url: string }).url === imageUrl` strictly equals true. |
| 166 | Assert that the result of `requests[1]!.body.tools?.map(tool =&gt; tool.function.name).sort` with no arguments deeply equals an array containing "get_order_field_plan", "screenshot_page". |
| 167 | Assert that the result of `JSON.stringify` using `messages` contains "Do not submit". |
| 168 | Close the callback or control-flow body and finish the surrounding syntax. |
| 169 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 170 | Register a test that "aborts an in-flight model request without rerouting or starting another call". |
| 171 | Declare `controller` as a new `AbortController` instance. Declare `started` for assignment later. |
| 172 | Declare `startedRequest` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `started`.. |
| 173 | Assign a callback that returns a new `Promise` instance initialized with a callback whose body follows to `respond`. |
| 174 | Call `request.signal.addEventListener` with "abort", a callback that returns the result of `reject` using `request.signal.reason`, an object containing once: true. Call `started` without arguments. |
| 175 | Close the callback or control-flow body and finish the surrounding syntax. |
| 176 | Declare `documents` as the result of `payload` with no arguments. |
| 177 | Declare `pending` as the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `controller.signal`. |
| 178 | Declare `rejected` as the result of `expect(pending).rejects.toThrow` with no arguments. |
| 179 | Wait for `startedRequest` to settle before continuing. Abort `controller`. Wait for `rejected` to settle before continuing. |
| 180 | Assert that `requests` has length 1. Assert that `requests[0]!.signal.aborted` strictly equals true. |
| 181 | Close the callback or control-flow body and finish the surrounding syntax. |
| 182 | Close the callback or control-flow body and finish the surrounding syntax. |
