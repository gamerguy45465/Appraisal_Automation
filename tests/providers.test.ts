// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { tool } from "@langchain/core/tools" for these regression tests.
import { tool } from '@langchain/core/tools';
// [L3] Import { z } from "zod" for these regression tests.
import { z } from 'zod';
// [L4] Import { APIConnectionTimeoutError } from "@anthropic-ai/sdk" for these regression tests.
import { APIConnectionTimeoutError } from '@anthropic-ai/sdk';
// [L5] Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests.
import { createModel, extractOrder } from '../src/extraction.js';
// [L6] Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests.
import { prepareOrderWithAgent } from '../src/agent.js';
// [L7] Import { DEFAULT_MODELS, buildFieldPlan, type AiProvider, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODELS, buildFieldPlan, type AiProvider, type ExtractedOrder, type JobPayload } from '../src/domain.js';
// [L8] Import { publicError } from "../src/errors.js" for these regression tests.
import { publicError } from '../src/errors.js';
// [L9] Import { APPRAISAL_PRODUCT_INSTRUCTIONS, SYSTEM_PROMPT } from "../src/system-prompt.js" for these regression tests.
import { APPRAISAL_PRODUCT_INSTRUCTIONS, SYSTEM_PROMPT } from '../src/system-prompt.js';
// [L10] Import type { createEnvironmentTools } from "../src/environment.js" for these regression tests.
import type { createEnvironmentTools } from '../src/environment.js';
// [L11] Import type { BrowserSession } from "../src/browser/session.js" for these regression tests.
import type { BrowserSession } from '../src/browser/session.js';
// [L12] Blank line separating the surrounding declarations, statements, or document blocks.

// [L13] Declare `contact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const contact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L14] Declare `extracted` as an object whose fields are defined below.
const extracted: ExtractedOrder = {
  // [L15] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase".
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  // [L16] Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "Primary Residence".
  product: null, propertyType: 'Single Family', occupancy: 'Primary Residence',
  // [L17] Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent).
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  // [L18] Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000.
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000,
  // [L19] Set fixture property `salePrice` to 485000. Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent).
  salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  // [L20] Set fixture property `borrower` to `contact`. Set fixture property `coBorrower` to `contact`. Set fixture property `listingAgent` to an object containing values copied from `contact`, firstName: "Avery", lastName: "Ellis", email: "listing@example.test". Set fixture property `buyerAgent` to `contact`.
  borrower: contact, coBorrower: contact, listingAgent: { ...contact, firstName: 'Avery', lastName: 'Ellis', email: 'listing@example.test' }, buyerAgent: contact,
  // [L21] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  complexProperty: false, highProfileCustomer: false,
  // [L22] Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase", an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase price $485,000".
  evidence: [
    // [L23] Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional".
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    // [L24] Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase".
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    // [L25] Set fixture property `field` to "salePrice". Set fixture property `document` to "salesContract". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase price $485,000".
    { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase price $485,000' },
  // [L26] Set fixture property `warnings` to an empty array.
  ], warnings: [],
// [L27] Close the fixture object for `extracted` and finish the surrounding syntax.
};
// [L28] Define helper `payload` with parameters provider, model for the fixture operations below.
function payload(provider: AiProvider, model: string = DEFAULT_MODELS[provider]): JobPayload {
  // [L29] Return an object whose fields are defined below to the caller.
  return { input: { provider, model, apiKey: 'sk-synthetic-provider-key-only', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    // [L30] Set fixture property `urla` to an object containing name: "sample.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA".
    urla: { name: 'sample.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    // [L31] Set fixture property `salesContract` to an object containing name: "purchase.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract".
    salesContract: { name: 'purchase.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
// [L32] Close the callback or control-flow body for `payload` and finish the surrounding syntax.
}
// [L33] Blank line separating the surrounding declarations, statements, or document blocks.

// [L34] Existing comment: Synthetic Anthropic responses use the transport sentinel only for nullable text.
// Synthetic Anthropic responses use the transport sentinel only for nullable text.
// [L35] Define helper `anthropicWireResult` with parameters value, key for the fixture operations below.
function anthropicWireResult(value: unknown, key = ''): unknown {
  // [L36] Run the following branch when `value` strictly equals null (unknown or absent) and the negation of the result of `['loanAmount', 'salePrice', 'lastValuationAmount'].includes` using `key`. Return "" to the caller.
  if (value === null && !['loanAmount', 'salePrice', 'lastValuationAmount'].includes(key)) return '';
  // [L37] Run the following branch when the result of `Array.isArray` using `value`. Return the result of `value.map` using a callback that returns the result of `anthropicWireResult` using `item` to the caller.
  if (Array.isArray(value)) return value.map(item => anthropicWireResult(item));
  // [L38] Run the following branch when `value` and `typeof value` strictly equals "object". Return the result of `Object.fromEntries` using the result of `Object.entries(value).map` using a callback that returns an array containing `childKey`, `anthropicWireResult(child, childKey)` to the caller.
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, anthropicWireResult(child, childKey)]));
  // [L39] Return `value` to the caller.
  return value;
// [L40] Close the callback or control-flow body for `anthropicWireResult` and finish the surrounding syntax.
}
// [L41] Define helper `unionCount` with parameters value for the fixture operations below.
function unionCount(value: unknown): number {
  // [L42] Run the following branch when the result of `Array.isArray` using `value`. Return the result of `value.reduce` using a callback that returns `count` plus the result of `unionCount` using `item`, 0 to the caller.
  if (Array.isArray(value)) return value.reduce((count, item) => count + unionCount(item), 0);
  // [L43] Run the following branch when the negation of `value` or `typeof value` does not strictly equal "object". Return 0 to the caller.
  if (!value || typeof value !== 'object') return 0;
  // [L44] Declare `node` as `value`.
  const node = value as Record<string, unknown>;
  // [L45] Return the result of `Number` using the result of `Array.isArray` using `node.anyOf` or the result of `Array.isArray` using `node.type` plus the result of `Object.values(node).reduce` using a callback that returns `count` plus `unionCount(child)`, 0 to the caller.
  return Number(Array.isArray(node.anyOf) || Array.isArray(node.type)) + Object.values(node).reduce<number>((count, child) => count + unionCount(child), 0);
// [L46] Close the callback or control-flow body for `unionCount` and finish the surrounding syntax.
}
// [L47] Define the TypeScript shape `WireBody` used by the test fixtures; this adds no runtime value.
interface WireBody {
  // [L48] Declare fixture property `model` with type `string`.
  model: string;
  // [L49] Declare optional fixture property `messages` with type `Array<{ role: string; content: Array<Record<string, unknown>> }>`.
  messages?: Array<{ role: string; content: Array<Record<string, unknown>> }>;
  // [L50] Declare optional fixture property `input` with type `Array<Record<string, unknown>>`.
  input?: Array<Record<string, unknown>>;
  // [L51] Declare optional fixture property `tools` with type `Array<{ name: string; input_schema?: { required: string[] }; function?: unknown }>`.
  tools?: Array<{ name: string; input_schema?: { required: string[] }; function?: unknown }>;
  // [L52] Declare optional fixture property `tool_choice` with type `unknown`.
  tool_choice?: unknown;
  // [L53] Declare optional fixture property `output_config` with type `{ format?: { type: string; schema: unknown } }`.
  output_config?: { format?: { type: string; schema: unknown } };
  // [L54] Declare optional fixture property `text` with type `{ format?: { type: string } }`.
  text?: { format?: { type: string } };
  // [L55] Declare optional fixture property `store` with type `boolean`.
  store?: boolean;
  // [L56] Declare optional fixture property `temperature` with type `number`.
  temperature?: number;
  // [L57] Declare optional fixture property `thinking` with type `unknown`.
  thinking?: unknown;
// [L58] Finish the surrounding expression and delimiters.
}
// [L59] Define helper `anthropicResponse` with parameters content, stop for the fixture operations below.
function anthropicResponse(content: Array<Record<string, unknown>> = [{ type: 'text', text: JSON.stringify(anthropicWireResult(extracted)) }], stop = 'end_turn') {
  // [L60] Return an object whose fields are defined below to the caller.
  return { id: 'msg_synthetic', type: 'message', role: 'assistant', model: 'claude-opus-5', content,
    // [L61] Set the synthetic Anthropic stop reason, use null to indicate no matched stop sequence, and report fixed synthetic token usage.
    stop_reason: stop, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } };
// [L62] Close the callback or control-flow body for `anthropicResponse` and finish the surrounding syntax.
}
// [L63] Define helper `openaiResponse` with parameters output for the fixture operations below.
function openaiResponse(output: Array<Record<string, unknown>> = [{ id: 'msg_synthetic', type: 'message', role: 'assistant', status: 'completed',
  // [L64] Set fixture property `content` to an array containing an object containing type: "output_text", text: the result of `JSON.stringify` using `extracted`, annotations: an empty array.
  content: [{ type: 'output_text', text: JSON.stringify(extracted), annotations: [] }] }]) {
  // [L65] Return an object whose fields are defined below to the caller.
  return { id: 'resp_synthetic', object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODELS.openai, output,
    // [L66] Set fixture property `usage` to an object containing input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: an object containing cached_tokens: 0, output_tokens_details: an object containing reasoning_tokens: 0.
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } } };
// [L67] Close the callback or control-flow body for `openaiResponse` and finish the surrounding syntax.
}
// [L68] Blank line separating the surrounding declarations, statements, or document blocks.

// [L69] Group regression tests for "selected-provider transport and preparation".
describe('selected-provider transport and preparation', () => {
  // [L70] Declare `requests` for assignment later.
  let requests: Array<{ url: string; body: WireBody; keyMatches: boolean }>;
  // [L71] Declare `respond` for assignment later.
  let respond: (body: WireBody, index: number) => Response;
  // [L72] Run this setup before every test in the group.
  beforeEach(() => {
    // [L73] Assign an empty array to `requests`.
    requests = [];
    // [L74] Assign a callback that returns the result of `Response.json` using the result of `anthropicResponse` with no arguments to `respond`.
    respond = () => Response.json(anthropicResponse());
    // [L75] Set all LangSmith/LangChain tracing environment flags to false to keep provider tests free of tracing requests.
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    // [L76] Existing comment: These must not redirect documents or replace the explicitly selected key.
    // These must not redirect documents or replace the explicitly selected key.
    // [L77] Temporarily set environment variable "ANTHROPIC_BASE_URL" to "https://untrusted.invalid" for this test.
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://untrusted.invalid');
    // [L78] Temporarily set environment variable "ANTHROPIC_API_URL" to "https://untrusted.invalid" for this test.
    vi.stubEnv('ANTHROPIC_API_URL', 'https://untrusted.invalid');
    // [L79] Temporarily set environment variable "OPENAI_BASE_URL" to "https://untrusted.invalid" for this test.
    vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.invalid');
    // [L80] Temporarily set environment variable "ANTHROPIC_API_KEY" to "synthetic-unselected-key" for this test.
    vi.stubEnv('ANTHROPIC_API_KEY', 'synthetic-unselected-key');
    // [L81] Temporarily set environment variable "OPENAI_API_KEY" to "synthetic-unselected-key" for this test.
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-unselected-key');
    // [L82] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows.
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      // [L83] Declare `request` as a new `Request` instance initialized with `input`, `init`.
      const request = new Request(input, init);
      // [L84] Declare `body` as the resolved value from `request.json` with no arguments.
      const body = await request.json() as WireBody;
      // [L85] Declare `selectedKey` as `payload('anthropic').input.apiKey`.
      const selectedKey = payload('anthropic').input.apiKey;
      // [L86] Append an object containing url: `request.url`, body, keyMatches: the result of `request.headers.get` using `'x-api-key'` strictly equals `selectedKey` or the result of `request.headers.get` using `'authorization'` strictly equals text interpolating `selectedKey` to `requests` for later inspection.
      requests.push({ url: request.url, body, keyMatches: request.headers.get('x-api-key') === selectedKey || request.headers.get('authorization') === `Bearer ${selectedKey}` });
      // [L87] Run the following branch when `request.url` strictly equals "https://api.anthropic.com/v1/messages" and the result of `unionCount` using `body.output_config?.format?.schema` is greater than 16.
      if (request.url === 'https://api.anthropic.com/v1/messages' && unionCount(body.output_config?.format?.schema) > 16) {
        // [L88] Return the result of `Response.json` using an object containing error: an object containing type: "invalid_request_error", message: "Schema is too complex for compilation.", an object containing status: 400 to the caller.
        return Response.json({ error: { type: 'invalid_request_error', message: 'Schema is too complex for compilation.' } }, { status: 400 });
      // [L89] Close the callback or control-flow body and finish the surrounding syntax.
      }
      // [L90] Return the result of `respond` using `body`, `requests.length` to the caller.
      return respond(body, requests.length);
    // [L91] Close the callback or control-flow body and finish the surrounding syntax.
    }));
  // [L92] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L93] Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables..
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
// [L94] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L95] Register a parameterized test that "sends native PDFs and validated structured extraction with Anthropic model %s".
  it.each(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001', 'custom-model:future'])('sends native PDFs and validated structured extraction with Anthropic model %s', async modelId => {
    // [L96] Declare `documents` as the result of `payload` using "anthropic", `modelId`.
    const documents = payload('anthropic', modelId);
    // [L97] Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `modelId`, "anthropic", `new AbortController().signal`.
    const result = await extractOrder(documents, createModel(documents.input.apiKey, modelId, 'anthropic'), new AbortController().signal);
    // [L98] Assert that `result` deeply equals `extracted`.
    expect(result).toEqual(extracted);
    // [L99] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L100] Declare `request` as `requests[0]`.
    const request = requests[0]!;
    // [L101] Assert that `request.url` strictly equals "https://api.anthropic.com/v1/messages".
    expect(request.url).toBe('https://api.anthropic.com/v1/messages');
    // [L102] Assert that `request.keyMatches` strictly equals true.
    expect(request.keyMatches).toBe(true);
    // [L103] Assert that `request.body.model` strictly equals `modelId`.
    expect(request.body.model).toBe(modelId);
    // [L104] Assert that `request.body.output_config?.format` contains the expected object fields an object containing type: "json_schema".
    expect(request.body.output_config?.format).toMatchObject({ type: 'json_schema' });
    // [L105] Assert that the result of `unionCount` using `request.body.output_config?.format?.schema` strictly equals 3.
    expect(unionCount(request.body.output_config?.format?.schema)).toBe(3);
    // [L106] Assert that `request.body.tool_choice` is undefined.
    expect(request.body.tool_choice).toBeUndefined();
    // [L107] Assert that `request.body.store` is undefined.
    expect(request.body.store).toBeUndefined();
    // [L108] Assert that `request.body.temperature` is undefined.
    expect(request.body.temperature).toBeUndefined();
    // [L109] Assert that `request.body.thinking` is undefined.
    expect(request.body.thinking).toBeUndefined();
    // [L110] Declare `instructions` as the result of `request.body.messages!.flatMap(message => message.content).filter(block => block.type === 'text').map(block => String(block.text)).join` using "\n".
    const instructions = request.body.messages!.flatMap(message => message.content).filter(block => block.type === 'text').map(block => String(block.text)).join('\n');
    // [L111] Assert that `instructions` contains "encode unavailable or uncertain nullable text fields as empty strings".
    expect(instructions).toContain('encode unavailable or uncertain nullable text fields as empty strings');
    // [L112] Assert that `instructions` contains "Keep unavailable numeric amounts null".
    expect(instructions).toContain('Keep unavailable numeric amounts null');
    // [L113] Assert that `instructions` contains "keep missing fields an empty string".
    expect(instructions).toContain('keep missing fields an empty string');
    // [L114] Assert that `instructions` contains "leave that value as an empty string".
    expect(instructions).toContain('leave that value as an empty string');
    // [L115] Assert that `instructions` does not satisfy: contains "keep missing fields null".
    expect(instructions).not.toContain('keep missing fields null');
    // [L116] Assert that `instructions` does not satisfy: contains "Use null for unavailable values".
    expect(instructions).not.toContain('Use null for unavailable values');
    // [L117] Declare `files` as the result of `request.body.messages!.flatMap(message => message.content).filter` using a callback that returns `block.type` strictly equals "document".
    const files = request.body.messages!.flatMap(message => message.content).filter(block => block.type === 'document');
    // [L118] Assert that `files` deeply equals an array containing an object containing type: "document", title: "urla.pdf", source: an object containing type: "base64", media_type: "application/pdf", data: the result of `documents.urla.buffer.toString` using `'base64'`, an object containing type: "document", title: "sales-contract.pdf", source: an object containing type: "base64", media_type: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using `'base64'`.
    expect(files).toEqual([
      // [L119] Set fixture property `type` to "document". Set fixture property `title` to "urla.pdf". Set fixture property `source` to an object containing type: "base64", media_type: "application/pdf", data: the result of `documents.urla.buffer.toString` using "base64".
      { type: 'document', title: 'urla.pdf', source: { type: 'base64', media_type: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
      // [L120] Set fixture property `type` to "document". Set fixture property `title` to "sales-contract.pdf". Set fixture property `source` to an object containing type: "base64", media_type: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using "base64".
      { type: 'document', title: 'sales-contract.pdf', source: { type: 'base64', media_type: 'application/pdf', data: documents.salesContract!.buffer.toString('base64') } },
    // [L121] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L122] Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains `documents.input.apiKey`.
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    // [L123] Declare `{ plan }` as the result of `buildFieldPlan` using `result`, `documents.input`, true.
    const { plan } = buildFieldPlan(result, documents.input, true);
    // [L124] Assert that `plan.find(field => field.key === 'salePrice')?.value` strictly equals "485000".
    expect(plan.find(field => field.key === 'salePrice')?.value).toBe('485000');
    // [L125] Assert that `plan.find(field => field.key === 'contact.firstName')?.value` strictly equals "Avery".
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('Avery');
  // [L126] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L127] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L128] Register a test that "sends only the required URLA to Anthropic when no contract is supplied".
  it('sends only the required URLA to Anthropic when no contract is supplied', async () => {
    // [L129] Declare `documents` as the result of `payload` using "anthropic".
    const documents = payload('anthropic');
    // [L130] Delete property `(documents as { salesContract?: unknown }).salesContract` from the fixture object.
    delete (documents as { salesContract?: unknown }).salesContract;
    // [L131] Call `extractOrder` with `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "anthropic", `new AbortController().signal`. Wait for completion before continuing.
    await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal);
    // [L132] Assert that the result of `requests[0]!.body.messages!.flatMap(message => message.content).filter` using a callback that returns `block.type` strictly equals "document" has length 1.
    expect(requests[0]!.body.messages!.flatMap(message => message.content).filter(block => block.type === 'document')).toHaveLength(1);
  // [L133] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L134] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L135] Register a parameterized test that "carries an FHA product recommendation through %s without inventing a property classification".
  it.each(['openai', 'anthropic'] as const)('carries an FHA product recommendation through %s without inventing a property classification', async provider => {
    // [L136] Declare `documents` as the result of `payload` using `provider`.
    const documents = payload(provider);
    // [L137] Assign "123-4567890" to `documents.input.fhaCaseNumber`.
    documents.input.fhaCaseNumber = '123-4567890';
    // [L138] Declare `recommendation` as an object whose fields are defined below.
    const recommendation: ExtractedOrder = { ...extracted, loanProgram: 'FHA', loanProgramText: 'FHA 203(b)',
      // [L139] Set fixture property `product` to "1004 SFR FHA". Set fixture property `propertyType` to null (unknown or absent). Set fixture property `occupancy` to null (unknown or absent).
      product: '1004 SFR FHA', propertyType: null, occupancy: null,
      // [L140] Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "FHA 203(b)", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase", an object containing field: "productRecommendation", document: "urla", page: 2, quote: "Number of Units: 1; Manufactured Home: No", an object containing field: "productRecommendation", document: "salesContract", page: 3, quote: "Not applicable — site-built residence".
      evidence: [
        // [L141] Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "FHA 203(b)".
        { field: 'loanProgram', document: 'urla', page: 1, quote: 'FHA 203(b)' },
        // [L142] Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase".
        { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
        // [L143] Set fixture property `field` to "productRecommendation". Set fixture property `document` to "urla". Set fixture property `page` to 2. Set fixture property `quote` to "Number of Units: 1; Manufactured Home: No".
        { field: 'productRecommendation', document: 'urla', page: 2, quote: 'Number of Units: 1; Manufactured Home: No' },
        // [L144] Set fixture property `field` to "productRecommendation". Set fixture property `document` to "salesContract". Set fixture property `page` to 3. Set fixture property `quote` to "Not applicable — site-built residence".
        { field: 'productRecommendation', document: 'salesContract', page: 3, quote: 'Not applicable — site-built residence' },
      // [L145] Set fixture property `warnings` to an empty array.
      ], warnings: [] };
    // [L146] Assign a callback that returns the result of `Response.json` using the result of `anthropicResponse` using `[{ type: 'text', text: JSON.stringify(anthropicWireResult(recommendation)) }]` when `provider` strictly equals "anthropic", otherwise the result of `Response.json` using the result of `openaiResponse` using `[{ id: 'msg_recommendation', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify(recommendation), annotations: [] }] }]` to `respond`.
    respond = () => provider === 'anthropic'
      // [L147] Set fixture property `type` to "text". Set fixture property `text` to the result of `JSON.stringify` using the result of `anthropicWireResult` using `recommendation`.
      ? Response.json(anthropicResponse([{ type: 'text', text: JSON.stringify(anthropicWireResult(recommendation)) }]))
      // [L148] Set fixture property `id` to "msg_recommendation". Set fixture property `type` to "message". Set fixture property `role` to "assistant". Set fixture property `status` to "completed".
      : Response.json(openaiResponse([{ id: 'msg_recommendation', type: 'message', role: 'assistant', status: 'completed',
        // [L149] Set fixture property `content` to an array containing an object containing type: "output_text", text: the result of `JSON.stringify` using `recommendation`, annotations: an empty array.
        content: [{ type: 'output_text', text: JSON.stringify(recommendation), annotations: [] }] }]));
    // [L150] Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, `provider`, `new AbortController().signal`.
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal);
    // [L151] Assert that `result` deeply equals `recommendation`.
    expect(result).toEqual(recommendation);
    // [L152] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L153] Declare `body` as `requests[0]!.body`.
    const body = requests[0]!.body;
    // [L154] Declare `blocks` as the result of `body.messages!.flatMap` using a callback that returns `message.content` when `provider` strictly equals "anthropic", otherwise the result of `body.input!.flatMap` using a callback that returns `message.content as Array<Record<string, unknown>>` when `Array.isArray(message.content)`, otherwise `[]`.
    const blocks = provider === 'anthropic' ? body.messages!.flatMap(message => message.content)
      // [L155] For the OpenAI branch, flatten array-valued message content from the native input list and ignore other content shapes.
      : body.input!.flatMap(message => Array.isArray(message.content) ? message.content as Array<Record<string, unknown>> : []);
    // [L156] Declare `instructions` as the result of `blocks.filter(block => ['text', 'input_text'].includes(String(block.type))).map(block => String(block.text)).join` using "\n".
    const instructions = blocks.filter(block => ['text', 'input_text'].includes(String(block.type))).map(block => String(block.text)).join('\n');
    // [L157] Assert that `instructions` contains `APPRAISAL_PRODUCT_INSTRUCTIONS`.
    expect(instructions).toContain(APPRAISAL_PRODUCT_INSTRUCTIONS);
    // [L158] Assert that `SYSTEM_PROMPT` contains `APPRAISAL_PRODUCT_INSTRUCTIONS`.
    expect(SYSTEM_PROMPT).toContain(APPRAISAL_PRODUCT_INSTRUCTIONS);
    // [L159] Assert that `instructions` does not satisfy: contains "never infer an appraisal product from property type".
    expect(instructions).not.toContain('never infer an appraisal product from property type');
    // [L160] Assert that `instructions` contains "One unit, detached alone, PUD membership, or primary-residence occupancy does not establish Single Family".
    expect(instructions).toContain('One unit, detached alone, PUD membership, or primary-residence occupancy does not establish Single Family');
    // [L161] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `result`, `documents.input`, true.
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(result, documents.input, true);
    // [L162] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: "1004 SFR FHA", allowedLabels: an array containing "1004 SFR - FHA", required: true.
    expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR FHA', allowedLabels: ['1004 SFR - FHA'], required: true });
    // [L163] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "agent recommendation" strictly equals true.
    expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(true);
    // [L164] Assert that `missingRequiredFields` deeply equals the result of `expect.arrayContaining` using an array containing "propertyType", "occupancy".
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['propertyType', 'occupancy']));
    // [L165] Assert that `missingRequiredFields` does not satisfy: contains "product".
    expect(missingRequiredFields).not.toContain('product');
    // [L166] Assert that the result of `plan.some` using a callback that returns the result of `['propertyType', 'occupancy'].includes` using `field.key` strictly equals false.
    expect(plan.some(field => ['propertyType', 'occupancy'].includes(field.key))).toBe(false);
  // [L167] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L168] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L169] Register a parameterized test that "uses a tool schema on %s only after native output is explicitly unsupported, retaining provider and model".
  it.each(['openai', 'anthropic'] as const)('uses a tool schema on %s only after native output is explicitly unsupported, retaining provider and model', async provider => {
    // [L170] Declare `documents` as the result of `payload` using `provider`, "custom-supported-model".
    const documents = payload(provider, 'custom-supported-model');
    // [L171] Assign a callback whose body follows to `respond`.
    respond = (_body, index) => {
      // [L172] Run the following branch when `index` strictly equals 1. Return the result of `Response.json` using an object whose fields are defined below, an object containing status: 400 to the caller.
      if (index === 1) return Response.json({ error: { type: 'invalid_request_error', message: provider === 'openai'
        // [L173] Set fixture property `status` to 400.
        ? 'response_format json_schema is not supported with this model' : 'output_config.format is not supported with this model' } }, { status: 400 });
      // [L174] Return the result of `Response.json` using the result of `anthropicResponse` using an array containing `{ type: 'tool_use', id: 'toolu_extract', name: 'appraisal_document_data', input: anthropicWireResult(extracted) }`, "tool_use" when `provider` strictly equals "anthropic", otherwise the result of `Response.json` using the result of `openaiResponse` using an array containing `{ type: 'function_call', id: 'fc_extract', call_id: 'call_extract', name: 'appraisal_document_data', arguments: JSON.stringify(extracted), status: 'completed' }` to the caller.
      return provider === 'anthropic'
        // [L175] Set fixture property `type` to "tool_use". Set fixture property `id` to "toolu_extract". Set fixture property `name` to "appraisal_document_data". Set fixture property `input` to the result of `anthropicWireResult` using `extracted`.
        ? Response.json(anthropicResponse([{ type: 'tool_use', id: 'toolu_extract', name: 'appraisal_document_data', input: anthropicWireResult(extracted) }], 'tool_use'))
        // [L176] Set fixture property `type` to "function_call". Set fixture property `id` to "fc_extract". Set fixture property `call_id` to "call_extract". Set fixture property `name` to "appraisal_document_data". Set fixture property `arguments` to the result of `JSON.stringify` using `extracted`. Set fixture property `status` to "completed".
        : Response.json(openaiResponse([{ type: 'function_call', id: 'fc_extract', call_id: 'call_extract', name: 'appraisal_document_data', arguments: JSON.stringify(extracted), status: 'completed' }]));
    // [L177] Close the callback or control-flow body and finish the surrounding syntax.
    };
    // [L178] Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, `provider`, `new AbortController().signal`.
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal);
    // [L179] Assert that `result` deeply equals `extracted`.
    expect(result).toEqual(extracted);
    // [L180] Assert that `requests` has length 2.
    expect(requests).toHaveLength(2);
    // [L181] Assert that `new Set(requests.map(request => request.url)).size` strictly equals 1.
    expect(new Set(requests.map(request => request.url)).size).toBe(1);
    // [L182] Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.body.model` strictly equals `documents.input.model` strictly equals true.
    expect(requests.every(request => request.keyMatches && request.body.model === documents.input.model)).toBe(true);
    // [L183] Assert that the result of `requests[1]!.body.tools?.some` using a callback that returns `candidate.name` strictly equals "appraisal_document_data" strictly equals true.
    expect(requests[1]!.body.tools?.some(candidate => candidate.name === 'appraisal_document_data')).toBe(true);
  // [L184] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L185] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L186] Register a parameterized test that "never switches provider/model on %s authentication or model-access failures".
  it.each(['openai', 'anthropic'] as const)('never switches provider/model on %s authentication or model-access failures', async provider => {
    // [L187] Declare `documents` as the result of `payload` using `provider`.
    const documents = payload(provider);
    // [L188] Iterate const status over an array containing 401, 404.
    for (const status of [401, 404]) {
      // [L189] Assign an empty array to `requests`.
      requests = [];
      // [L190] Assign a callback that returns the result of `Response.json` using an object containing error: an object containing type: `'authentication_error'`, message: `'Synthetic private detail'`, an object containing status to `respond`.
      respond = () => Response.json({ error: { type: 'authentication_error', message: 'Synthetic private detail' } }, { status });
      // [L191] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, `provider`, `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing status. Wait for the asynchronous assertion to settle.
      await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal)).rejects.toMatchObject({ status });
      // [L192] Assert that `requests` has length 1.
      expect(requests).toHaveLength(1);
      // [L193] Assert that `requests[0]!.body.model` strictly equals `documents.input.model`.
      expect(requests[0]!.body.model).toBe(documents.input.model);
    // [L194] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L195] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L196] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L197] Register a parameterized test that "rejects malformed Anthropic $caseName before browser planning".
  it.each([
    // [L198] Set fixture property `caseName` to "zero sale price". Set fixture property `data` to an object containing values copied from `extracted`, salePrice: 0.
    { caseName: 'zero sale price', data: { ...extracted, salePrice: 0 } },
    // [L199] Set fixture property `caseName` to "missing required contact name". Set fixture property `data` to an object containing values copied from `extracted`, listingAgent: an object containing email: "listing@example.test".
    { caseName: 'missing required contact name', data: { ...extracted, listingAgent: { email: 'listing@example.test' } } },
    // [L200] Set fixture property `caseName` to "invalid classification". Set fixture property `data` to an object containing values copied from `extracted`, loanProgram: "Invalid".
    { caseName: 'invalid classification', data: { ...extracted, loanProgram: 'Invalid' } },
    // [L201] Set fixture property `caseName` to "invalid evidence source". Set fixture property `data` to an object containing values copied from `extracted`, evidence: an array containing an object containing field: "salePrice", document: "unknown", page: 1, quote: "Synthetic".
    { caseName: 'invalid evidence source', data: { ...extracted, evidence: [{ field: 'salePrice', document: 'unknown', page: 1, quote: 'Synthetic' }] } },
  // [L202] Apply the preceding scenario rows to the parameterized test "rejects malformed Anthropic $caseName before browser planning" and begin its callback.
  ])('rejects malformed Anthropic $caseName before browser planning', async ({ data }) => {
    // [L203] Assign a callback that returns the result of `Response.json` using the result of `anthropicResponse` using an array containing `{ type: 'text', text: JSON.stringify(anthropicWireResult(data)) }` to `respond`.
    respond = () => Response.json(anthropicResponse([{ type: 'text', text: JSON.stringify(anthropicWireResult(data)) }]));
    // [L204] Declare `documents` as the result of `payload` using "anthropic".
    const documents = payload('anthropic');
    // [L205] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "anthropic", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal)).rejects.toThrow();
    // [L206] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
  // [L207] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L208] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L209] Register a parameterized test that "does not retry output formats after an Anthropic 400 rejection: %s".
  it.each([
    // [L210] Provide a synthetic insufficient-credit rejection to ensure billing failures never trigger output-format fallback.
    'Your credit balance is too low to access the Anthropic API.',
    // [L211] Provide a synthetic schema-complexity rejection to ensure schema failures never trigger output-format fallback.
    'Schema is too complex for compilation.',
  // [L212] Apply the preceding scenario rows to the parameterized test "does not retry output formats after an Anthropic 400 rejection: %s" and begin its callback.
  ])('does not retry output formats after an Anthropic 400 rejection: %s', async message => {
    // [L213] Assign a callback that returns the result of `Response.json` using an object containing error: an object containing type: `'invalid_request_error'`, message, an object containing status: 400 to `respond`.
    respond = () => Response.json({ error: { type: 'invalid_request_error', message } }, { status: 400 });
    // [L214] Declare `documents` as the result of `payload` using "anthropic".
    const documents = payload('anthropic');
    // [L215] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "anthropic", `new AbortController().signal` rejects and the rejection contains the expected object fields an object containing status: 400. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal)).rejects.toMatchObject({ status: 400 });
    // [L216] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L217] Assert that `requests[0]!.body.model` strictly equals `documents.input.model`.
    expect(requests[0]!.body.model).toBe(documents.input.model);
    // [L218] Assert that `requests[0]!.keyMatches` strictly equals true.
    expect(requests[0]!.keyMatches).toBe(true);
  // [L219] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L220] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L221] Register a parameterized test that "runs the bounded %s preparation agent with screenshot tool results as images".
  it.each(['openai', 'anthropic'] as const)('runs the bounded %s preparation agent with screenshot tool results as images', async provider => {
    // [L222] Declare `documents` as the result of `payload` using `provider`.
    const documents = payload(provider);
    // [L223] Declare `screenshot` as the result of `tool` using a promise-returning callback that returns an array containing an object containing type: `'text'`, text: `'Synthetic order page only.'`, an object containing type: `'image_url'`, image_url: `{ url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' }`, an object containing name: "screenshot_page", description: "Read a synthetic page image.", schema: the result of `z.object` using an empty object.
    const screenshot = tool(async () => [
      // [L224] Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page only.".
      { type: 'text', text: 'Synthetic order page only.' },
      // [L225] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    // [L226] Set fixture property `name` to "screenshot_page". Set fixture property `description` to "Read a synthetic page image.". Set fixture property `schema` to the result of `z.object` using an empty object.
    ], { name: 'screenshot_page', description: 'Read a synthetic page image.', schema: z.object({}) });
    // [L227] Assign a callback that returns the result of `Response.json` using `anthropicResponse([{ type: 'tool_use', id: 'toolu_image', name: 'screenshot_page', input: {} }], 'tool_use')` when `index === 1`, otherwise `anthropicResponse([{ type: 'text', text: 'Ready for human review.' }])` when `provider` strictly equals "anthropic", otherwise the result of `Response.json` using `openaiResponse([{ type: 'function_call', id: 'fc_image', call_id: 'call_image', name: 'screenshot_page', arguments: '{}', status: 'completed' }])` when `index === 1`, otherwise `openaiResponse()` to `respond`.
    respond = (_body, index) => provider === 'anthropic'
      // [L228] Set fixture property `type` to "tool_use". Set fixture property `id` to "toolu_image". Set fixture property `name` to "screenshot_page". Set fixture property `input` to an empty object.
      ? Response.json(index === 1 ? anthropicResponse([{ type: 'tool_use', id: 'toolu_image', name: 'screenshot_page', input: {} }], 'tool_use')
        // [L229] Set fixture property `type` to "text". Set fixture property `text` to "Ready for human review.".
        : anthropicResponse([{ type: 'text', text: 'Ready for human review.' }]))
      // [L230] Set fixture property `type` to "function_call". Set fixture property `id` to "fc_image". Set fixture property `call_id` to "call_image". Set fixture property `name` to "screenshot_page". Set fixture property `arguments` to "{}". Set fixture property `status` to "completed".
      : Response.json(index === 1 ? openaiResponse([{ type: 'function_call', id: 'fc_image', call_id: 'call_image', name: 'screenshot_page', arguments: '{}', status: 'completed' }])
        // [L231] For the alternate provider branch, return the synthetic OpenAI response.
        : openaiResponse());
    // [L232] Call `prepareOrderWithAgent` with an object whose fields are defined below. Wait for completion before continuing.
    await prepareOrderWithAgent({ provider, model: createModel(documents.input.apiKey, documents.input.model, provider),
      // [L233] Set fixture property `environment` to an object containing tools: an empty array.
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      // [L234] Set fixture property `session` to an object containing tools: an array containing `screenshot`. Set fixture property `plan` to an empty array. Set fixture property `signal` to `new AbortController().signal`.
      session: { tools: [screenshot] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    // [L235] Assert that `requests` has length 2.
    expect(requests).toHaveLength(2);
    // [L236] Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.body.model` strictly equals `documents.input.model` strictly equals true.
    expect(requests.every(request => request.keyMatches && request.body.model === documents.input.model)).toBe(true);
    // [L237] Declare `final` as `requests[1]!.body`.
    const final = requests[1]!.body;
    // [L238] Run the following branch when `provider` strictly equals "anthropic".
    if (provider === 'anthropic') {
      // [L239] Declare `result` as the result of `final.messages!.flatMap(message => message.content).find` using a callback that returns `block.type` strictly equals "tool_result".
      const result = final.messages!.flatMap(message => message.content).find(block => block.type === 'tool_result');
      // [L240] Assert that `result?.content` deeply equals an array containing an object containing type: "text", text: "Synthetic order page only.", an object containing type: "image", source: an object containing type: "base64", media_type: "image/png", data: "iVBORw0KGgo=".
      expect(result?.content).toEqual([
        // [L241] Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page only.".
        { type: 'text', text: 'Synthetic order page only.' },
        // [L242] Set fixture property `type` to "image". Set fixture property `source` to an object containing type: "base64", media_type: "image/png", data: "iVBORw0KGgo=".
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } },
      // [L243] Close the array of fixture values and finish the surrounding syntax.
      ]);
    // [L244] Use this alternative branch when the preceding condition was false.
    } else {
      // [L245] Declare `result` as the result of `final.input!.find` using a callback that returns `block.type` strictly equals "function_call_output".
      const result = final.input!.find(block => block.type === 'function_call_output');
      // [L246] Assert that `result?.output` deeply equals an array containing an object containing type: "input_text", text: "Synthetic order page only.", an object containing type: "input_image", image_url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
      expect(result?.output).toEqual([
        // [L247] Set fixture property `type` to "input_text". Set fixture property `text` to "Synthetic order page only.".
        { type: 'input_text', text: 'Synthetic order page only.' },
        // [L248] Set fixture property `type` to "input_image". Set fixture property `image_url` to "data:image/png;base64,iVBORw0KGgo=". Set fixture property `detail` to "auto".
        { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' },
      // [L249] Close the array of fixture values and finish the surrounding syntax.
      ]);
    // [L250] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L251] Assert that the result of `final.tools?.map(candidate => candidate.name).sort` with no arguments deeply equals an array containing "get_order_field_plan", "screenshot_page".
    expect(final.tools?.map(candidate => candidate.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
  // [L252] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L253] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L254] Register a parameterized test that "returns safe actionable %s errors without raw provider responses".
  it.each(['openai', 'anthropic'] as const)('returns safe actionable %s errors without raw provider responses', provider => {
    // [L255] Declare `label` as "Anthropic" when `provider` strictly equals "anthropic", otherwise "OpenAI".
    const label = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
    // [L256] Iterate const status over an array containing 400, 401, 403, 404, 413, 422, 429, 503, 529.
    for (const status of [400, 401, 403, 404, 413, 422, 429, 503, 529]) {
      // [L257] Declare `error` as the result of `publicError` using an object containing status, message: "PRIVATE_DOCUMENT_AND_KEY_CONTENT", `provider`.
      const error = publicError({ status, message: 'PRIVATE_DOCUMENT_AND_KEY_CONTENT' }, provider);
      // [L258] Assert that `error.message` contains `label`.
      expect(error.message).toContain(label);
      // [L259] Assert that `error.message` does not satisfy: contains "PRIVATE_DOCUMENT_AND_KEY_CONTENT".
      expect(error.message).not.toContain('PRIVATE_DOCUMENT_AND_KEY_CONTENT');
    // [L260] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L261] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L262] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L263] Register a test that "classifies the Anthropic SDK transport timeout without exposing its raw details".
  it('classifies the Anthropic SDK transport timeout without exposing its raw details', () => {
    // [L264] Declare `error` as the result of `publicError` using a new `APIConnectionTimeoutError` instance initialized with an object containing message: "PRIVATE_TRANSPORT_DETAIL", "anthropic".
    const error = publicError(new APIConnectionTimeoutError({ message: 'PRIVATE_TRANSPORT_DETAIL' }), 'anthropic');
    // [L265] Assert that `error.code` strictly equals "TIMEOUT".
    expect(error.code).toBe('TIMEOUT');
    // [L266] Assert that `error.statusCode` strictly equals 504.
    expect(error.statusCode).toBe(504);
    // [L267] Assert that `error.message` does not satisfy: contains "PRIVATE_TRANSPORT_DETAIL".
    expect(error.message).not.toContain('PRIVATE_TRANSPORT_DETAIL');
  // [L268] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L269] Close the callback or control-flow body and finish the surrounding syntax.
});
