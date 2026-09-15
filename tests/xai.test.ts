// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { tool } from "@langchain/core/tools" for these regression tests.
import { tool } from '@langchain/core/tools';
// [L3] Import { toJsonSchema } from "@langchain/core/utils/json_schema" for these regression tests.
import { toJsonSchema } from '@langchain/core/utils/json_schema';
// [L4] Import { z } from "zod" for these regression tests.
import { z } from 'zod';
// [L5] Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests.
import { createModel, extractOrder } from '../src/extraction.js';
// [L6] Import { renderPdfPages } from "../src/pdf-pages.js" for these regression tests.
import { renderPdfPages } from '../src/pdf-pages.js';
// [L7] Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests.
import { prepareOrderWithAgent } from '../src/agent.js';
// [L8] Import { DEFAULT_MODELS, extractionSchema, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODELS, extractionSchema, type ExtractedOrder, type JobPayload } from '../src/domain.js';
// [L9] Import type { createEnvironmentTools } from "../src/environment.js" for these regression tests.
import type { createEnvironmentTools } from '../src/environment.js';
// [L10] Import type { BrowserSession } from "../src/browser/session.js" for these regression tests.
import type { BrowserSession } from '../src/browser/session.js';
// [L11] Blank line separating the surrounding declarations, statements, or document blocks.

// [L12] Replace local PDF rendering with a controllable mock so the Grok transport tests can supply fixed page blocks and rendering failures.
vi.mock('../src/pdf-pages.js', () => ({ renderPdfPages: vi.fn() }));
// [L13] Declare `contact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const contact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L14] Declare `extracted` as an object whose fields are defined below.
const extracted: ExtractedOrder = {
  // [L15] Set fixture property `loanProgram` to "FHA". Set fixture property `loanProgramText` to "FHA". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to null (unknown or absent). Set fixture property `occupancy` to null (unknown or absent).
  loanProgram: 'FHA', loanProgramText: 'FHA', loanPurpose: 'Purchase', product: null, propertyType: null, occupancy: null,
  // [L16] Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent). Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent).
  property: { address: null, unit: null, postalCode: null, city: null, state: null }, secondaryLoanNumber: null, loanType: null,
  // [L17] Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000. Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent).
  lienPosition: null, loanAmount: 388000, salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  // [L18] Set fixture property `borrower` to `contact`. Set fixture property `coBorrower` to `contact`. Set fixture property `listingAgent` to `contact`. Set fixture property `buyerAgent` to `contact`. Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  borrower: contact, coBorrower: contact, listingAgent: contact, buyerAgent: contact, complexProperty: false, highProfileCustomer: false,
  // [L19] Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "FHA", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase".
  evidence: [{ field: 'loanProgram', document: 'urla', page: 1, quote: 'FHA' },
    // [L20] Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase". Set fixture property `warnings` to an empty array.
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' }], warnings: [],
// [L21] Close the fixture object for `extracted` and finish the surrounding syntax.
};
// [L22] Declare `imageUrl` as "data:image/png;base64,iVBORw0KGgo=".
const imageUrl = 'data:image/png;base64,iVBORw0KGgo=';
// [L23] Declare `rendered` as the result of `['urla.pdf', 'sales-contract.pdf'].flatMap` using a callback that returns an array containing an object containing type: `'text' as const`, text: ``Source document: ${name}. Page 1 of 1. The following image is this PDF page.``, an object containing type: `'image_url' as const`, image_url: `{ url: imageUrl, detail: 'high' as const }`.
const rendered = ['urla.pdf', 'sales-contract.pdf'].flatMap(name => [
  // [L24] Set fixture property `type` to "text". Set fixture property `text` to text interpolating `name`.
  { type: 'text' as const, text: `Source document: ${name}. Page 1 of 1. The following image is this PDF page.` },
  // [L25] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "high".
  { type: 'image_url' as const, image_url: { url: imageUrl, detail: 'high' as const } },
// [L26] Close the array of fixture values and finish the surrounding syntax.
]);
// [L27] Define helper `payload` with parameters model for the fixture operations below.
function payload(model: string = DEFAULT_MODELS.xai): JobPayload {
  // [L28] Return an object whose fields are defined below to the caller.
  return { input: { provider: 'xai', apiKey: 'synthetic-selected-xai-key-only', model, loanNumber: '685-2012345',
    // [L29] Set fixture property `fhaCaseNumber` to "123-4567890". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false.
    fhaCaseNumber: '123-4567890', paymentMethod: 'Invoice', rushOrder: false },
    // [L30] Set fixture property `urla` to an object containing name: "uploaded-urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA".
    urla: { name: 'uploaded-urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    // [L31] Set fixture property `salesContract` to an object containing name: "uploaded-contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract".
    salesContract: { name: 'uploaded-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
// [L32] Close the callback or control-flow body for `payload` and finish the surrounding syntax.
}
// [L33] Define the TypeScript shape `Call` used by the test fixtures; this adds no runtime value.
type Call = { id: string; type: 'function'; function: { name: string; arguments: string } };
// [L34] Define the TypeScript shape `WireBody` used by the test fixtures; this adds no runtime value.
interface WireBody {
  // [L35] Declare fixture property `model` with type `string`.
  model: string;
  // [L36] Declare fixture property `messages` with type `Array<{ role: string; content: string | Array<Record<string, unknown>> | null; tool_call_id?: string }>`.
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> | null; tool_call_id?: string }>;
  // [L37] Declare optional fixture property `response_format` with type `{ type: string; json_schema?: { schema: { properties?: unknown; required?: string[] } } }`.
  response_format?: { type: string; json_schema?: { schema: { properties?: unknown; required?: string[] } } };
  // [L38] Declare optional fixture property `tools` with type `Array<{ type: string; function: { name: string; parameters?: { properties?: unknown } } }>`.
  tools?: Array<{ type: string; function: { name: string; parameters?: { properties?: unknown } } }>;
  // [L39] Declare optional fixture property `tool_choice` with type `unknown`. Declare optional fixture property `stream` with type `boolean`. Declare optional fixture property `store` with type `unknown`. Declare optional fixture property `temperature` with type `number`.
  tool_choice?: unknown; stream?: boolean; store?: unknown; temperature?: number;
// [L40] Finish the surrounding expression and delimiters.
}
// [L41] Define helper `completion` with parameters content, toolCalls for the fixture operations below.
function completion(content: string | null = JSON.stringify(extracted), toolCalls?: Call[]): Response {
  // [L42] Return the result of `Response.json` using an object whose fields are defined below to the caller.
  return Response.json({ id: 'chatcmpl_synthetic', object: 'chat.completion', created: 1, model: DEFAULT_MODELS.xai,
    // [L43] Set fixture property `choices` to an array containing an object whose fields are defined below.
    choices: [{ index: 0, message: { role: 'assistant', content, ...(toolCalls ? { tool_calls: toolCalls } : {}) },
      // [L44] Set fixture property `finish_reason` to "tool_calls" when `toolCalls`, otherwise "stop". Set fixture property `usage` to an object containing prompt_tokens: 10, completion_tokens: 10, total_tokens: 20.
      finish_reason: toolCalls ? 'tool_calls' : 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } });
// [L45] Close the callback or control-flow body for `completion` and finish the surrounding syntax.
}
// [L46] Declare `call` as a callback that returns an object containing id, type: "function", function: an object containing name, arguments: `JSON.stringify(args)`.
const call = (name: string, id = name, args: unknown = {}): Call => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } });
// [L47] Existing comment: SDK native output uses local refs/anyOf; compare their meaning to the canonical schema.
// SDK native output uses local refs/anyOf; compare their meaning to the canonical schema.
// [L48] Define helper `schemaMeaning` with parameters value, root for the fixture operations below.
function schemaMeaning(value: unknown, root: unknown = value): unknown {
  // [L49] Run the following branch when the result of `Array.isArray` using `value`. Return the result of `value.map` using a callback that returns the result of `schemaMeaning` using `item`, `root` to the caller.
  if (Array.isArray(value)) return value.map(item => schemaMeaning(item, root));
  // [L50] Run the following branch when the negation of `value` or `typeof value` does not strictly equal "object". Return `value` to the caller.
  if (!value || typeof value !== 'object') return value;
  // [L51] Declare `node` as `value`.
  const node = value as Record<string, unknown>;
  // [L52] Run the following branch when `typeof node.$ref` strictly equals "string".
  if (typeof node.$ref === 'string') {
    // [L53] Declare `target` as the result of `node.$ref.slice(2).split('/').reduce` using a callback that returns `(current as Record<string, unknown>)[key]`, `root`.
    const target = node.$ref.slice(2).split('/').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], root);
    // [L54] Run the following branch when the negation of `target`. Throw a new `Error` instance initialized with "Unresolved local schema reference" to simulate or report the failure.
    if (!target) throw new Error('Unresolved local schema reference');
    // [L55] Return the result of `schemaMeaning` using `target`, `root` to the caller.
    return schemaMeaning(target, root);
  // [L56] Close the callback or control-flow body and finish the surrounding syntax.
  }
  // [L57] Declare `result` as the result of `Object.fromEntries` using the result of `Object.entries(node).filter(([key]) => !['title', '$schema', '$defs'].includes(key)) .map` using a callback that returns an array containing `key`, `schemaMeaning(child, root)`.
  const result = Object.fromEntries(Object.entries(node).filter(([key]) => !['title', '$schema', '$defs'].includes(key))
    // [L58] Recursively normalize each remaining schema property while keeping its key, then rebuild the normalized object.
    .map(([key, child]) => [key, schemaMeaning(child, root)]));
  // [L59] When schema.type is an array, convert its alternatives into anyOf objects and delete type so semantically equivalent schemas compare consistently.
  if (Array.isArray(result.type)) { result.anyOf = result.type.map(type => ({ type })); delete result.type; }
  // [L60] Return `result` to the caller.
  return result;
// [L61] Close the callback or control-flow body for `schemaMeaning` and finish the surrounding syntax.
}
// [L62] Blank line separating the surrounding declarations, statements, or document blocks.

// [L63] Group regression tests for "Grok actual adapter transport".
describe('Grok actual adapter transport', () => {
  // [L64] Declare `requests` for assignment later.
  let requests: Array<{ url: string; body: WireBody; selectedKey: boolean; headers: string[]; redirect: RequestRedirect; signal: AbortSignal }>;
  // [L65] Declare `respond` for assignment later.
  let respond: (body: WireBody, index: number, request: Request) => Response | Promise<Response>;
  // [L66] Run this setup before every test in the group.
  beforeEach(() => {
    // [L67] Assign an empty array to `requests`. Assign a callback that returns the result of `completion` with no arguments to `respond`.
    requests = []; respond = () => completion();
    // [L68] Configure mock `vi.mocked(renderPdfPages).mockReset()` to resolve to the result of `structuredClone` using `rendered`.
    vi.mocked(renderPdfPages).mockReset().mockResolvedValue(structuredClone(rendered));
    // [L69] Disable all LangSmith/LangChain tracing flags before running the Grok adapter tests.
    for (const key of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(key, 'false');
    // [L70] Populate ambient xAI, OpenAI, Anthropic, and Google keys with synthetic unselected values to verify the transport uses only the explicit job key.
    for (const key of ['XAI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY']) vi.stubEnv(key, 'synthetic-unselected-key');
    // [L71] Temporarily set environment variable "OPENAI_BASE_URL" to "https://untrusted.invalid" for this test.
    vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.invalid');
    // [L72] Temporarily set environment variable "XAI_BASE_URL" to "https://untrusted.invalid" for this test.
    vi.stubEnv('XAI_BASE_URL', 'https://untrusted.invalid');
    // [L73] Temporarily set environment variable "OPENAI_ORG_ID" to "synthetic-ambient-org" for this test.
    vi.stubEnv('OPENAI_ORG_ID', 'synthetic-ambient-org');
    // [L74] Temporarily set environment variable "OPENAI_PROJECT_ID" to "synthetic-ambient-project" for this test.
    vi.stubEnv('OPENAI_PROJECT_ID', 'synthetic-ambient-project');
    // [L75] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows.
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      // [L76] Declare `request` as a new `Request` instance initialized with `input`, `init`.
      const request = new Request(input, init);
      // [L77] Declare `body` as the resolved value from `request.json` with no arguments.
      const body = await request.json() as WireBody;
      // [L78] Append an object whose fields are defined below to `requests` for later inspection.
      requests.push({ url: request.url, body, selectedKey: request.headers.get('authorization') === `Bearer ${payload().input.apiKey}`,
        // [L79] Set fixture property `headers` to an array containing `...request.headers.keys()`. Set fixture property `redirect` to `request.redirect`. Set fixture property `signal` to `request.signal`.
        headers: [...request.headers.keys()], redirect: request.redirect, signal: request.signal });
      // [L80] Return the result of `respond` using `body`, `requests.length`, `request` to the caller.
      return respond(body, requests.length, request);
    // [L81] Close the callback or control-flow body and finish the surrounding syntax.
    }));
  // [L82] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L83] Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables..
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
// [L84] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L85] Register a parameterized test that "sends rendered source pages and canonical native JSON schema using only selected model/key: %s".
  it.each([DEFAULT_MODELS.xai, 'custom/model:2026?variant=one'])('sends rendered source pages and canonical native JSON schema using only selected model/key: %s', async model => {
    // [L86] Declare `documents` as the result of `payload` using `model`. Declare `signal` as `new AbortController().signal`.
    const documents = payload(model), signal = new AbortController().signal;
    // [L87] Assert that the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `model`, "xai", `signal` deeply equals `extracted`.
    expect(await extractOrder(documents, createModel(documents.input.apiKey, model, 'xai'), signal)).toEqual(extracted);
    // [L88] Assert that `renderPdfPages` was called exactly once with an array containing an object containing name: "urla.pdf", buffer: `documents.urla.buffer`, an object containing name: "sales-contract.pdf", buffer: `documents.salesContract!.buffer`, `signal`.
    expect(renderPdfPages).toHaveBeenCalledExactlyOnceWith([
      // [L89] Set fixture property `name` to "urla.pdf". Set fixture property `buffer` to `documents.urla.buffer`. Set fixture property `name` to "sales-contract.pdf". Set fixture property `buffer` to `documents.salesContract!.buffer`.
      { name: 'urla.pdf', buffer: documents.urla.buffer }, { name: 'sales-contract.pdf', buffer: documents.salesContract!.buffer },
    // [L90] Finish the model input messages and pass the cancellation signal into the request.
    ], signal);
    // [L91] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L92] Declare `request` as `requests[0]`.
    const request = requests[0]!;
    // [L93] Assert that `request` contains the expected object fields an object containing url: "https://api.x.ai/v1/chat/completions", selectedKey: true, redirect: "error".
    expect(request).toMatchObject({ url: 'https://api.x.ai/v1/chat/completions', selectedKey: true, redirect: 'error' });
    // [L94] Assert that the result of `request.headers.sort` with no arguments deeply equals an array containing "authorization", "content-type".
    expect(request.headers.sort()).toEqual(['authorization', 'content-type']);
    // [L95] Assert that `request.body.model` strictly equals `model`.
    expect(request.body.model).toBe(model);
    // [L96] Assert that `request.body.response_format?.type` strictly equals "json_schema".
    expect(request.body.response_format?.type).toBe('json_schema');
    // [L97] Assert that the result of `schemaMeaning` using `request.body.response_format?.json_schema?.schema` deeply equals the result of `schemaMeaning` using the result of `toJsonSchema` using `extractionSchema`.
    expect(schemaMeaning(request.body.response_format?.json_schema?.schema)).toEqual(schemaMeaning(toJsonSchema(extractionSchema)));
    // [L98] Assert that the result of `request.body.response_format?.json_schema?.schema.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments.
    expect(request.body.response_format?.json_schema?.schema.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    // [L99] Assert that `request.body.tools` is undefined. Assert that `request.body.store` is undefined. Assert that `request.body.temperature` is undefined.
    expect(request.body.tools).toBeUndefined(); expect(request.body.store).toBeUndefined(); expect(request.body.temperature).toBeUndefined();
    // [L100] Assert that `request.body.stream` does not satisfy: strictly equals true.
    expect(request.body.stream).not.toBe(true);
    // [L101] Declare `content` as the result of `request.body.messages.flatMap` using a callback that returns `message.content` when the result of `Array.isArray` using `message.content`, otherwise an empty array.
    const content = request.body.messages.flatMap(message => Array.isArray(message.content) ? message.content : []);
    // [L102] Assert that the result of `content.slice` using `-4` deeply equals `rendered`.
    expect(content.slice(-4)).toEqual(rendered);
    // [L103] Assert that the result of `content.some` using a callback that returns the result of `['input_file', 'file', 'document'].includes` using the result of `String` using `block.type` strictly equals false.
    expect(content.some(block => ['input_file', 'file', 'document'].includes(String(block.type)))).toBe(false);
    // [L104] Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains `documents.input.apiKey`.
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    // [L105] Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains "synthetic-unselected-key".
    expect(JSON.stringify(request.body)).not.toContain('synthetic-unselected-key');
  // [L106] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L107] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L108] Register a parameterized test that "rejects invalid canonical output locally".
  it.each([{ ...extracted, salePrice: 0 }, { ...extracted, borrower: { email: null } }])('rejects invalid canonical output locally', async data => {
    // [L109] Assign a callback that returns the result of `completion` using the result of `JSON.stringify` using `data` to `respond`.
    respond = () => completion(JSON.stringify(data));
    // [L110] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L111] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow();
    // [L112] Existing comment: The native SDK parser rejects the response inside the configured one-retry call.
    // The native SDK parser rejects the response inside the configured one-retry call.
    // [L113] Assert that `requests` has length 2.
    expect(requests).toHaveLength(2);
    // [L114] Assert that the result of `requests.every` using a callback that returns `request.body.response_format?.type` strictly equals `'json_schema'` and the negation of `request.body.tools` strictly equals true.
    expect(requests.every(request => request.body.response_format?.type === 'json_schema' && !request.body.tools)).toBe(true);
  // [L115] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L116] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L117] Register a test that "never contacts a model when PDF rendering fails".
  it('never contacts a model when PDF rendering fails', async () => {
    // [L118] Configure mock `vi.mocked(renderPdfPages)` to reject with a new `Error` instance initialized with "Synthetic render failure".
    vi.mocked(renderPdfPages).mockRejectedValue(new Error('Synthetic render failure'));
    // [L119] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L120] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error matching "Synthetic render failure". Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow('Synthetic render failure');
    // [L121] Assert that `requests` has length 0.
    expect(requests).toHaveLength(0);
  // [L122] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L123] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L124] Register a test that "retries only an explicitly unsupported native format with the same model/key and rendered images".
  it('retries only an explicitly unsupported native format with the same model/key and rendered images', async () => {
    // [L125] Configure the response sequence to reject the first native output-format request and return an extraction tool call on the retry.
    respond = (_body, index) => index === 1
      // [L126] Set fixture property `error` to an object containing message: "response_format json_schema is not supported with this model", type: "invalid_request_error". Set fixture property `status` to 400.
      ? Response.json({ error: { message: 'response_format json_schema is not supported with this model', type: 'invalid_request_error' } }, { status: 400 })
      // [L127] For the tool-format branch, return a synthetic completion with an appraisal_document_data extraction tool call.
      : completion(null, [call('appraisal_document_data', 'extract', extracted)]);
    // [L128] Declare `documents` as the result of `payload` using "custom-supported-model".
    const documents = payload('custom-supported-model');
    // [L129] Assert that the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` deeply equals `extracted`.
    expect(await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).toEqual(extracted);
    // [L130] Assert that `requests` has length 2. Assert that `renderPdfPages` was called this many times: 1.
    expect(requests).toHaveLength(2); expect(renderPdfPages).toHaveBeenCalledTimes(1);
    // [L131] Assert that the result of `requests.every` using a callback that returns `request.selectedKey` and `request.url === 'https://api.x.ai/v1/chat/completions'` and `request.body.model` strictly equals `documents.input.model` strictly equals true.
    expect(requests.every(request => request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions' && request.body.model === documents.input.model)).toBe(true);
    // [L132] Assert that `requests[1]!.body.response_format` is undefined.
    expect(requests[1]!.body.response_format).toBeUndefined();
    // [L133] Assert that the result of `requests[1]!.body.tools?.map` using a callback that returns `tool.function.name` deeply equals an array containing "appraisal_document_data".
    expect(requests[1]!.body.tools?.map(tool => tool.function.name)).toEqual(['appraisal_document_data']);
    // [L134] Assert that the result of `schemaMeaning` using `requests[1]!.body.tools?.[0]?.function.parameters` deeply equals the result of `schemaMeaning` using the result of `toJsonSchema` using `extractionSchema`.
    expect(schemaMeaning(requests[1]!.body.tools?.[0]?.function.parameters)).toEqual(schemaMeaning(toJsonSchema(extractionSchema)));
    // [L135] Assert that `requests[1]!.body.messages` deeply equals `requests[0]!.body.messages`.
    expect(requests[1]!.body.messages).toEqual(requests[0]!.body.messages);
  // [L136] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L137] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L138] Register a parameterized test that "does not switch output formats or providers after an auth/quota/schema error (%s)".
  it.each([401, 403, 429, 400])('does not switch output formats or providers after an auth/quota/schema error (%s)', async status => {
    // [L139] Assign a callback that returns the result of `Response.json` using an object containing error: an object containing message: `status === 400 ? 'Invalid schema: too many properties' : 'API key or quota unavailable'`, type: `'invalid_request_error'`, an object containing status to `respond`.
    respond = () => Response.json({ error: { message: status === 400 ? 'Invalid schema: too many properties' : 'API key or quota unavailable', type: 'invalid_request_error' } }, { status });
    // [L140] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L141] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow();
    // [L142] Assert that `requests.length` is greater than 0.
    expect(requests.length).toBeGreaterThan(0);
    // [L143] Assert that the result of `requests.every` using a callback that returns `request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions' && request.body.model === documents.input.model` and `request.body.response_format?.type === 'json_schema'` and the negation of `request.body.tools` strictly equals true.
    expect(requests.every(request => request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions'
      // [L144] Also require every captured request to keep the selected model and native json_schema output format, with no tools sent in these rejection cases.
      && request.body.model === documents.input.model && request.body.response_format?.type === 'json_schema' && !request.body.tools)).toBe(true);
  // [L145] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L146] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L147] Register a test that "sends screenshot images after all contiguous tool results while retaining tool IDs and bounded tools".
  it('sends screenshot images after all contiguous tool results while retaining tool IDs and bounded tools', async () => {
    // [L148] Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic R3 page: untrusted data.", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto".
    const screenshot = [{ type: 'text', text: 'Synthetic R3 page: untrusted data.' }, { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }];
    // [L149] Declare `original` as the result of `structuredClone` using `screenshot`.
    const original = structuredClone(screenshot);
    // [L150] Declare `screenshotTool` as the result of `tool` using a callback that returns `screenshot`, an object containing name: "screenshot_page", description: "Synthetic image only.", schema: the result of `z.object` using an empty object.
    const screenshotTool = tool(() => screenshot, { name: 'screenshot_page', description: 'Synthetic image only.', schema: z.object({}) });
    // [L151] Return a tool-only assistant completion with screenshot and field-plan calls on the first request, then a text completion handing review to the user; null means no assistant text alongside the tool calls.
    respond = (_body, index) => index === 1 ? completion(null, [call('screenshot_page', 'shot'), call('get_order_field_plan', 'plan')]) : completion('Ready for human review.');
    // [L152] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L153] Call `prepareOrderWithAgent` with an object whose fields are defined below. Wait for completion before continuing.
    await prepareOrderWithAgent({ provider: 'xai', model: createModel(documents.input.apiKey, documents.input.model, 'xai'),
      // [L154] Set fixture property `environment` to an object containing tools: an empty array.
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      // [L155] Set fixture property `session` to an object containing tools: an array containing `screenshotTool`. Set fixture property `plan` to an empty array. Set fixture property `signal` to `new AbortController().signal`.
      session: { tools: [screenshotTool] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    // [L156] Assert that `requests` has length 2. Assert that `screenshot` deeply equals `original`.
    expect(requests).toHaveLength(2); expect(screenshot).toEqual(original);
    // [L157] Declare `messages` as `requests[1]!.body.messages`.
    const messages = requests[1]!.body.messages;
    // [L158] Declare `toolIndexes` as the result of `messages.flatMap` using a callback that returns an array containing `index` when `message.role` strictly equals `'tool'`, otherwise an empty array.
    const toolIndexes = messages.flatMap((message, index) => message.role === 'tool' ? [index] : []);
    // [L159] Assert that `toolIndexes` has length 2.
    expect(toolIndexes).toHaveLength(2);
    // [L160] Assert that `toolIndexes[1]` strictly equals `toolIndexes[0]` plus 1.
    expect(toolIndexes[1]).toBe(toolIndexes[0]! + 1);
    // [L161] Assert that the result of `messages.filter(message => message.role === 'tool').map(message => message.tool_call_id).sort` with no arguments deeply equals an array containing "plan", "shot".
    expect(messages.filter(message => message.role === 'tool').map(message => message.tool_call_id).sort()).toEqual(['plan', 'shot']);
    // [L162] Assert that the result of `JSON.stringify` using the result of `messages.filter` using a callback that returns `message.role` strictly equals `'tool'` does not satisfy: contains "iVBORw0KGgo=".
    expect(JSON.stringify(messages.filter(message => message.role === 'tool'))).not.toContain('iVBORw0KGgo=');
    // [L163] Declare `imageMessage` as `messages[toolIndexes[1]! + 1]`.
    const imageMessage = messages[toolIndexes[1]! + 1]!;
    // [L164] Assert that `imageMessage.role` strictly equals "user".
    expect(imageMessage.role).toBe('user');
    // [L165] Assert that the result of `Array.isArray` using `imageMessage.content` and the result of `imageMessage.content.some` using a callback that returns `block.type === 'image_url'` and `(block.image_url as { url: string }).url === imageUrl` strictly equals true.
    expect(Array.isArray(imageMessage.content) && imageMessage.content.some(block => block.type === 'image_url' && (block.image_url as { url: string }).url === imageUrl)).toBe(true);
    // [L166] Assert that the result of `requests[1]!.body.tools?.map(tool => tool.function.name).sort` with no arguments deeply equals an array containing "get_order_field_plan", "screenshot_page".
    expect(requests[1]!.body.tools?.map(tool => tool.function.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
    // [L167] Assert that the result of `JSON.stringify` using `messages` contains "Do not submit".
    expect(JSON.stringify(messages)).toContain('Do not submit');
  // [L168] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L169] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L170] Register a test that "aborts an in-flight model request without rerouting or starting another call".
  it('aborts an in-flight model request without rerouting or starting another call', async () => {
    // [L171] Declare `controller` as a new `AbortController` instance. Declare `started` for assignment later.
    const controller = new AbortController(); let started!: () => void;
    // [L172] Declare `startedRequest` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `started`..
    const startedRequest = new Promise<void>(resolve => { started = resolve; });
    // [L173] Assign a callback that returns a new `Promise` instance initialized with a callback whose body follows to `respond`.
    respond = (_body, _index, request) => new Promise((_resolve, reject) => {
      // [L174] Call `request.signal.addEventListener` with "abort", a callback that returns the result of `reject` using `request.signal.reason`, an object containing once: true. Call `started` without arguments.
      request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }); started();
    // [L175] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L176] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L177] Declare `pending` as the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "xai", `controller.signal`.
    const pending = extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), controller.signal);
    // [L178] Declare `rejected` as the result of `expect(pending).rejects.toThrow` with no arguments.
    const rejected = expect(pending).rejects.toThrow();
    // [L179] Wait for `startedRequest` to settle before continuing. Abort `controller`. Wait for `rejected` to settle before continuing.
    await startedRequest; controller.abort(); await rejected;
    // [L180] Assert that `requests` has length 1. Assert that `requests[0]!.signal.aborted` strictly equals true.
    expect(requests).toHaveLength(1); expect(requests[0]!.signal.aborted).toBe(true);
  // [L181] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L182] Close the callback or control-flow body and finish the surrounding syntax.
});
