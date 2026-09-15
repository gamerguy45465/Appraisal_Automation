# Line explanations: tests/extraction.test.ts

Source: [tests/extraction.test.ts](../../../tests/extraction.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests. |
| 2 | Import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages" for these regression tests. |
| 3 | Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests. |
| 4 | Import { buildFieldPlan, DEFAULT_MODEL, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests. |
| 5 | Import { SYSTEM_PROMPT } from "../src/system-prompt.js" for these regression tests. |
| 6 | Import { toProviderMessages } from "../src/model-messages.js" for these regression tests. |
| 7 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 8 | Declare `emptyContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent). |
| 9 | Declare `extracted` as an object whose fields are defined below. |
| 10 | Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". |
| 11 | Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to null (unknown or absent). Set fixture property `occupancy` to null (unknown or absent). |
| 12 | Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent). |
| 13 | Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to null (unknown or absent). |
| 14 | Set fixture property `salePrice` to null (unknown or absent). Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent). |
| 15 | Set fixture property `borrower` to `emptyContact`. Set fixture property `coBorrower` to `emptyContact`. Set fixture property `listingAgent` to `emptyContact`. Set fixture property `buyerAgent` to `emptyContact`. |
| 16 | Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. |
| 17 | Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase". |
| 18 | Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional". |
| 19 | Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase". |
| 20 | Set fixture property `warnings` to an empty array. |
| 21 | Close the fixture object for `extracted` and finish the surrounding syntax. |
| 22 | Declare `payload` as an object whose fields are defined below. |
| 23 | Set fixture property `input` to an object whose fields are defined below. |
| 24 | Set fixture property `loanNumber` to "685-2012345". Set fixture property `fhaCaseNumber` to "". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false. Set fixture property `model` to `DEFAULT_MODEL`. |
| 25 | Set fixture property `urla` to an object containing name: "urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nSynthetic URLA\n%%EOF". |
| 26 | Set fixture property `salesContract` to an object containing name: "sales-contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nSynthetic contract\n%%EOF". |
| 27 | Close the fixture object for `payload` and finish the surrounding syntax. |
| 28 | Define the TypeScript shape `WireBody` used by the test fixtures; this adds no runtime value. |
| 29 | Declare fixture property `model` with type `string`. |
| 30 | Declare optional fixture property `store` with type `boolean`. |
| 31 | Declare optional fixture property `temperature` with type `number`. |
| 32 | Declare fixture property `input` with type `Array&lt;{ type: string; content?: Array&lt;Record&lt;string, unknown&gt;&gt;; output?: unknown }&gt;`. |
| 33 | Declare optional fixture property `text` with type `{ format?: { type?: string; strict?: boolean; schema?: { properties?: Record&lt;string, unknown&gt;; required?: string[] } } }`. |
| 34 | Finish the surrounding expression and delimiters. |
| 35 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 36 | Existing comment: Responses API fixture: completed assistant message with structured JSON text. |
| 37 | Define helper `completedResponse` with parameters data for the fixture operations below. |
| 38 | Return an object whose fields are defined below to the caller. |
| 39 | Set fixture property `id` to "resp_synthetic". Set fixture property `object` to "response". Set fixture property `created_at` to 1. Set fixture property `status` to "completed". Set fixture property `model` to `DEFAULT_MODEL`. |
| 40 | Set fixture property `output` to an array containing an object whose fields are defined below. |
| 41 | Set fixture property `content` to an array containing an object containing type: "output_text", text: the result of `JSON.stringify` using `data`, annotations: an empty array. |
| 42 | Set fixture property `usage` to an object whose fields are defined below. |
| 43 | Set fixture property `input_tokens_details` to an object containing cached_tokens: 0. Set fixture property `output_tokens_details` to an object containing reasoning_tokens: 0. |
| 44 | Close the fixture object and finish the surrounding syntax. |
| 45 | Close the callback or control-flow body for `completedResponse` and finish the surrounding syntax. |
| 46 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 47 | Group regression tests for "OpenAI Responses wire compatibility". |
| 48 | Declare `requests` for assignment later. |
| 49 | Declare `responseData` for assignment later. |
| 50 | Run this setup before every test in the group. |
| 51 | Assign an empty array to `requests`. |
| 52 | Assign `extracted` to `responseData`. |
| 53 | Temporarily set environment variable "LANGSMITH_TRACING" to "false" for this test. |
| 54 | Temporarily set environment variable "LANGCHAIN_TRACING_V2" to "false" for this test. |
| 55 | Temporarily set environment variable "LANGCHAIN_TRACING" to "false" for this test. |
| 56 | Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows. |
| 57 | Declare `request` as a new `Request` instance initialized with `input`, `init`. |
| 58 | Append an object containing url: `request.url`, body: the resolved value from `request.json` with no arguments to `requests` for later inspection. |
| 59 | Return the result of `Response.json` using the result of `completedResponse` using `responseData` to the caller. |
| 60 | Close the callback or control-flow body and finish the surrounding syntax. |
| 61 | Close the callback or control-flow body and finish the surrounding syntax. |
| 62 | Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables.. |
| 63 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 64 | Register a test that "sends both PDFs as actual file inputs and receives strict structured output without a network call". |
| 65 | Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. |
| 66 | Assert that `result` deeply equals `extracted`. |
| 67 | Assert that `requests` has length 1. |
| 68 | Declare `request` as `requests[0]`. |
| 69 | Assert that `request.url` strictly equals "https://api.openai.com/v1/responses". |
| 70 | Assert that `request.body.model` strictly equals `DEFAULT_MODEL`. |
| 71 | Assert that `request.body.store` strictly equals false. |
| 72 | Assert that `request.body.temperature` is undefined. |
| 73 | Assert that `request.body.text?.format` contains the expected object fields an object containing type: "json_schema", strict: true. |
| 74 | Assert that `request.body.text?.format?.schema?.required` contains "buyerAgent". |
| 75 | Assert the structured extraction schema includes the separate buyerAgent property. |
| 76 | Declare `files` as the result of `request.body.input.flatMap(item =&gt; item.content ?? []).filter` using a callback that returns `item.type` strictly equals "input_file". |
| 77 | Assert that `files` deeply equals an array containing an object containing type: "input_file", filename: "urla.pdf", file_data: text interpolating the result of `payload.urla.buffer.toString` using `'base64'`, an object containing type: "input_file", filename: "sales-contract.pdf", file_data: text interpolating the result of `payload.salesContract!.buffer.toString` using `'base64'`. |
| 78 | Set fixture property `type` to "input_file". Set fixture property `filename` to "urla.pdf". Set fixture property `file_data` to text interpolating the result of `payload.urla.buffer.toString` using "base64". |
| 79 | Set fixture property `type` to "input_file". Set fixture property `filename` to "sales-contract.pdf". Set fixture property `file_data` to text interpolating the result of `payload.salesContract!.buffer.toString` using "base64". |
| 80 | Close the array of fixture values and finish the surrounding syntax. |
| 81 | Declare `bodyText` as the result of `JSON.stringify` using `request.body`. |
| 82 | Assert that `bodyText` does not satisfy: contains `payload.input.apiKey`. |
| 83 | Close the callback or control-flow body and finish the surrounding syntax. |
| 84 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 85 | Register a test that "sends only the URLA when no sales contract is supplied". |
| 86 | Call `extractOrder` with an object containing input: `payload.input`, urla: `payload.urla`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. Wait for completion before continuing. |
| 87 | Declare `files` as the result of `requests[0]!.body.input.flatMap(item =&gt; item.content ?? []).filter` using a callback that returns `item.type` strictly equals "input_file". |
| 88 | Assert that `files` has length 1. |
| 89 | Assert that `files[0]!.filename` strictly equals "urla.pdf". |
| 90 | Close the callback or control-flow body and finish the surrounding syntax. |
| 91 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 92 | Register a test that "sends explicit seller versus selling-agent rules to extraction and preserves them for preparation". |
| 93 | Call `extractOrder` with `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. Wait for completion before continuing. |
| 94 | Declare `instructions` as the result of `requests[0]!.body.input.flatMap(item =&gt; item.content ?? []) .filter(item =&gt; item.type === 'input_text').map(item =&gt; String(item.text)).join` using "\n". |
| 95 | Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions. |
| 96 | Iterate const prompt over an array containing `instructions`, `SYSTEM_PROMPT`. |
| 97 | Assert that `prompt` contains "\"listing agent\", \"seller's agent\", \"seller agent\" and \"seller representative\" as listingAgent". |
| 98 | Assert that `prompt` contains "\"buyer's agent\", \"buyer agent\", \"buying agent\", \"selling agent\" and \"cooperating agent\" as buyerAgent only when the document explicitly establishes...". |
| 99 | Assert that `prompt` contains "\"Seller's agent\" and \"selling agent\" are different labels". |
| 100 | Assert that `prompt` contains "Purchase access uses listingAgent (the seller's agent); refinance access uses borrower". |
| 101 | Assert that `prompt` contains "If a role is unclear, leave the agent role/details unknown and flag it for review". |
| 102 | Assert that `prompt` contains "human review and submission remain mandatory". |
| 103 | Close the callback or control-flow body and finish the surrounding syntax. |
| 104 | Close the callback or control-flow body and finish the surrounding syntax. |
| 105 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 106 | Register a test that "carries an unsigned sample contract purchase price through Responses extraction into the required sale-price plan". |
| 107 | Declare `documentWarning` as "Unsigned sample contract: confirm the final purchase price before submitting.". |
| 108 | Declare `priceEvidence` as an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase Price: $485,000.00". |
| 109 | Assign an object whose fields are defined below to `responseData`. |
| 110 | Set fixture property `evidence` to an array containing `...extracted.evidence`, `priceEvidence`. Set fixture property `warnings` to an array containing `documentWarning`. |
| 111 | Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. |
| 112 | Declare `instructions` as the result of `requests[0]!.body.input.flatMap(item =&gt; item.content ?? []) .filter(item =&gt; item.type === 'input_text').map(item =&gt; String(item.text)).join` using "\n". |
| 113 | Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions. |
| 114 | Existing comment: This checks the instructions actually sent, not merely an exported prompt constant. |
| 115 | Iterate const prompt over an array containing `instructions`, `SYSTEM_PROMPT`. |
| 116 | Assert that `prompt` does not satisfy: matches `/Use the signed contract for sale price/i`. |
| 117 | Assert that `prompt` matches `/\bunsigned\b/i`. |
| 118 | Assert that `prompt` matches `/\bsample\b/i`. |
| 119 | Assert that `prompt` matches `/\bdraft\b/i`. |
| 120 | Assert that `prompt` matches `/\bsalePrice\b/`. |
| 121 | Close the callback or control-flow body and finish the surrounding syntax. |
| 122 | Assert that `result.salePrice` strictly equals 485000. |
| 123 | Assert that `result.loanAmount` strictly equals 388000. |
| 124 | Assert that `result.evidence` contains a deeply equal entry `priceEvidence`. |
| 125 | Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `result`, `payload.input`, true. |
| 126 | Assert that the result of `plan.filter` using a callback that returns `field.key` strictly equals "salePrice" deeply equals an array containing an object containing key: "salePrice", value: "485000", kind: "text", required: true. |
| 127 | Assert that `plan.find(field =&gt; field.key === 'loanAmount')?.value` strictly equals "388000". |
| 128 | Assert that `warnings` contains `documentWarning`. |
| 129 | Assert that `missingRequiredFields` does not satisfy: contains "salePrice". |
| 130 | Close the callback or control-flow body and finish the surrounding syntax. |
| 131 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 132 | Register a test that "preserves a null model price as missing information without substituting zero or the loan amount". |
| 133 | Assign an object containing values copied from `extracted`, salePrice: null (unknown or absent), loanAmount: 388000, warnings: an array containing "The contract does not establish a purchase price." to `responseData`. |
| 134 | Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. |
| 135 | Assert that `result.salePrice` is null. |
| 136 | Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using `result`, `payload.input`, true. |
| 137 | Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals "salePrice" strictly equals false. |
| 138 | Assert that `missingRequiredFields` contains "salePrice". |
| 139 | Assert that `plan.find(field =&gt; field.key === 'loanAmount')?.value` strictly equals "388000". |
| 140 | Close the callback or control-flow body and finish the surrounding syntax. |
| 141 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 142 | Register a test that "turns free-form extracted descriptions into supported required dropdown values". |
| 143 | Configure mock `vi.mocked(fetch)` to resolve on its next call to the result of `Response.json` using the result of `completedResponse` using an object whose fields are defined below. |
| 144 | Set fixture property `loanType` to "Fixed Rate". Set fixture property `propertyType` to "Single-family detached residence". Set fixture property `product` to " ". |
| 145 | Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. |
| 146 | Declare `{ plan }` as the result of `buildFieldPlan` using `result`, `payload.input`, true. |
| 147 | Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "loanType" contains the expected object fields an object containing value: "Conventional", required: true. |
| 148 | Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "propertyType" contains the expected object fields an object containing value: "Single Family", required: true. |
| 149 | Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: "1004 SFR CONV", required: true. |
| 150 | Close the callback or control-flow body and finish the surrounding syntax. |
| 151 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 152 | Register a test that "preserves source-linked borrower and both agent identities through extraction and access planning". |
| 153 | Assign an object whose fields are defined below to `responseData`. |
| 154 | Set fixture property `borrower` to an object containing values copied from `emptyContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100". |
| 155 | Set fixture property `listingAgent` to an object containing values copied from `emptyContact`, firstName: "Lena", lastName: "Listing", mobilePhone: "7025550111", email: "listing@example.test". |
| 156 | Set fixture property `buyerAgent` to an object containing values copied from `emptyContact`, firstName: "Bailey", lastName: "Buyeragent", workPhone: "7025550222", email: "buyeragent@example.test". |
| 157 | Set fixture property `evidence` to an array containing `...extracted.evidence`, an object containing field: "borrower.homePhone", document: "urla", page: 1, quote: "Casey Borrower Home Phone 7025550100", an object containing field: "listingAgent.mobilePhone", document: "salesContract", page: 9, quote: "Seller's Agent: Lena Listing; Mobile: 7025550111", an object containing field: "buyerAgent.workPhone", document: "salesContract", page: 10, quote: "Buyer's Agent: Bailey Buyeragent; Office: 7025550222". |
| 158 | Set fixture property `field` to "borrower.homePhone". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Casey Borrower Home Phone 7025550100". |
| 159 | Set fixture property `field` to "listingAgent.mobilePhone". Set fixture property `document` to "salesContract". Set fixture property `page` to 9. Set fixture property `quote` to "Seller's Agent: Lena Listing; Mobile: 7025550111". |
| 160 | Set fixture property `field` to "buyerAgent.workPhone". Set fixture property `document` to "salesContract". Set fixture property `page` to 10. Set fixture property `quote` to "Buyer's Agent: Bailey Buyeragent; Office: 7025550222". |
| 161 | Close the array of fixture values for `evidence` and finish the surrounding syntax. |
| 162 | Close the fixture object and finish the surrounding syntax. |
| 163 | Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. |
| 164 | Assert that `result` deeply equals `responseData`. |
| 165 | Iterate const loanPurpose over an array containing "Purchase", "Refinance". |
| 166 | Declare `{ plan }` as the result of `buildFieldPlan` using an object containing values copied from `result`, loanPurpose, `payload.input`, true. |
| 167 | Assert that `plan.find(field =&gt; field.key === 'contact.firstName')?.value` strictly equals "Lena" when `loanPurpose` strictly equals "Purchase", otherwise "Casey". |
| 168 | Assert that `plan.find(field =&gt; field.key === 'contact.mobilePhone')?.value` strictly equals "7025550111" when `loanPurpose` strictly equals "Purchase", otherwise "". |
| 169 | Assert that `plan.find(field =&gt; field.key === 'contact.homePhone')?.value` strictly equals "7025550100" when `loanPurpose` strictly equals "Refinance", otherwise "". |
| 170 | Assert that `plan.find(field =&gt; field.key === 'listingAgent.email')?.value` strictly equals "listing@example.test". |
| 171 | Assert that `plan.find(field =&gt; field.key === 'buyerAgent.email')?.value` strictly equals "buyeragent@example.test". |
| 172 | Close the callback or control-flow body and finish the surrounding syntax. |
| 173 | Close the callback or control-flow body and finish the surrounding syntax. |
| 174 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 175 | Register a test that "transmits screenshot tool output as image input rather than a serialized text blob". |
| 176 | Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic order page screenshot.", an object containing type: "image_url", image_url: an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto". |
| 177 | Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page screenshot.". |
| 178 | Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto". |
| 179 | Close the array of fixture values for `screenshot` and finish the surrounding syntax. |
| 180 | Call `createModel(payload.input.apiKey, DEFAULT_MODEL).invoke` with the result of `toProviderMessages` using "openai", an array containing a new `HumanMessage` instance initialized with "Inspect the order page.", a new `AIMessage` instance initialized with an object containing content: `''`, tool_calls: `[{ id: 'call_screenshot', name: 'screenshot_page', args: {}, type: 'tool_call' }]`, a new `ToolMessage` instance initialized with an object containing tool_call_id: `'call_screenshot'`, name: `'screenshot_page'`, content: `screenshot`. Wait for completion before continuing. |
| 181 | Add a synthetic human message asking the model to inspect the order page. |
| 182 | Set fixture property `content` to "". Set fixture property `tool_calls` to an array containing an object containing id: "call_screenshot", name: "screenshot_page", args: an empty object, type: "tool_call". |
| 183 | Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `content` to `screenshot`. |
| 184 | Close the array of fixture values and finish the surrounding syntax. |
| 185 | Declare `toolOutput` as the result of `requests[0]!.body.input.find` using a callback that returns `item.type` strictly equals "function_call_output". |
| 186 | Assert that `toolOutput?.output` deeply equals an array containing an object containing type: "input_text", text: "Synthetic order page screenshot.", an object containing type: "input_image", image_url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto". |
| 187 | Set fixture property `type` to "input_text". Set fixture property `text` to "Synthetic order page screenshot.". |
| 188 | Set fixture property `type` to "input_image". Set fixture property `image_url` to "data:image/png;base64,iVBORw0KGgo=". Set fixture property `detail` to "auto". |
| 189 | Close the array of fixture values and finish the surrounding syntax. |
| 190 | Assert that `typeof toolOutput?.output` does not satisfy: strictly equals "string". |
| 191 | Close the callback or control-flow body and finish the surrounding syntax. |
| 192 | Close the callback or control-flow body and finish the surrounding syntax. |
