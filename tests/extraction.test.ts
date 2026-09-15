// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages" for these regression tests.
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
// [L3] Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests.
import { createModel, extractOrder } from '../src/extraction.js';
// [L4] Import { buildFieldPlan, DEFAULT_MODEL, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests.
import { buildFieldPlan, DEFAULT_MODEL, type ExtractedOrder, type JobPayload } from '../src/domain.js';
// [L5] Import { SYSTEM_PROMPT } from "../src/system-prompt.js" for these regression tests.
import { SYSTEM_PROMPT } from '../src/system-prompt.js';
// [L6] Import { toProviderMessages } from "../src/model-messages.js" for these regression tests.
import { toProviderMessages } from '../src/model-messages.js';
// [L7] Blank line separating the surrounding declarations, statements, or document blocks.

// [L8] Declare `emptyContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L9] Declare `extracted` as an object whose fields are defined below.
const extracted: ExtractedOrder = {
  // [L10] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase".
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  // [L11] Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to null (unknown or absent). Set fixture property `occupancy` to null (unknown or absent).
  product: null, propertyType: null, occupancy: null,
  // [L12] Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent).
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  // [L13] Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to null (unknown or absent).
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: null,
  // [L14] Set fixture property `salePrice` to null (unknown or absent). Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent).
  salePrice: null, lastValuationAmount: null, lastValuationDate: null,
  // [L15] Set fixture property `borrower` to `emptyContact`. Set fixture property `coBorrower` to `emptyContact`. Set fixture property `listingAgent` to `emptyContact`. Set fixture property `buyerAgent` to `emptyContact`.
  borrower: emptyContact, coBorrower: emptyContact, listingAgent: emptyContact, buyerAgent: emptyContact,
  // [L16] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  complexProperty: false, highProfileCustomer: false,
  // [L17] Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase".
  evidence: [
    // [L18] Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional".
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    // [L19] Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase".
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
  // [L20] Set fixture property `warnings` to an empty array.
  ], warnings: [],
// [L21] Close the fixture object for `extracted` and finish the surrounding syntax.
};
// [L22] Declare `payload` as an object whose fields are defined below.
const payload: JobPayload = {
  // [L23] Set fixture property `input` to an object whose fields are defined below.
  input: { provider: 'openai', apiKey: 'sk-synthetic-test-key-only',
    // [L24] Set fixture property `loanNumber` to "685-2012345". Set fixture property `fhaCaseNumber` to "". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false. Set fixture property `model` to `DEFAULT_MODEL`.
    loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
  // [L25] Set fixture property `urla` to an object containing name: "urla.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nSynthetic URLA\n%%EOF".
  urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic URLA\n%%EOF') },
  // [L26] Set fixture property `salesContract` to an object containing name: "sales-contract.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7\nSynthetic contract\n%%EOF".
  salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic contract\n%%EOF') },
// [L27] Close the fixture object for `payload` and finish the surrounding syntax.
};
// [L28] Define the TypeScript shape `WireBody` used by the test fixtures; this adds no runtime value.
interface WireBody {
  // [L29] Declare fixture property `model` with type `string`.
  model: string;
  // [L30] Declare optional fixture property `store` with type `boolean`.
  store?: boolean;
  // [L31] Declare optional fixture property `temperature` with type `number`.
  temperature?: number;
  // [L32] Declare fixture property `input` with type `Array<{ type: string; content?: Array<Record<string, unknown>>; output?: unknown }>`.
  input: Array<{ type: string; content?: Array<Record<string, unknown>>; output?: unknown }>;
  // [L33] Declare optional fixture property `text` with type `{ format?: { type?: string; strict?: boolean; schema?: { properties?: Record<string, unknown>; required?: string[] } } }`.
  text?: { format?: { type?: string; strict?: boolean; schema?: { properties?: Record<string, unknown>; required?: string[] } } };
// [L34] Finish the surrounding expression and delimiters.
}
// [L35] Blank line separating the surrounding declarations, statements, or document blocks.

// [L36] Existing comment: Responses API fixture: completed assistant message with structured JSON text.
/** Responses API fixture: completed assistant message with structured JSON text. */
// [L37] Define helper `completedResponse` with parameters data for the fixture operations below.
function completedResponse(data: ExtractedOrder = extracted) {
  // [L38] Return an object whose fields are defined below to the caller.
  return {
    // [L39] Set fixture property `id` to "resp_synthetic". Set fixture property `object` to "response". Set fixture property `created_at` to 1. Set fixture property `status` to "completed". Set fixture property `model` to `DEFAULT_MODEL`.
    id: 'resp_synthetic', object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODEL,
    // [L40] Set fixture property `output` to an array containing an object whose fields are defined below.
    output: [{ id: 'msg_synthetic', type: 'message', status: 'completed', role: 'assistant',
      // [L41] Set fixture property `content` to an array containing an object containing type: "output_text", text: the result of `JSON.stringify` using `data`, annotations: an empty array.
      content: [{ type: 'output_text', text: JSON.stringify(data), annotations: [] }] }],
    // [L42] Set fixture property `usage` to an object whose fields are defined below.
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20,
      // [L43] Set fixture property `input_tokens_details` to an object containing cached_tokens: 0. Set fixture property `output_tokens_details` to an object containing reasoning_tokens: 0.
      input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
  // [L44] Close the fixture object and finish the surrounding syntax.
  };
// [L45] Close the callback or control-flow body for `completedResponse` and finish the surrounding syntax.
}
// [L46] Blank line separating the surrounding declarations, statements, or document blocks.

// [L47] Group regression tests for "OpenAI Responses wire compatibility".
describe('OpenAI Responses wire compatibility', () => {
  // [L48] Declare `requests` for assignment later.
  let requests: Array<{ url: string; body: WireBody }>;
  // [L49] Declare `responseData` for assignment later.
  let responseData: ExtractedOrder;
  // [L50] Run this setup before every test in the group.
  beforeEach(() => {
    // [L51] Assign an empty array to `requests`.
    requests = [];
    // [L52] Assign `extracted` to `responseData`.
    responseData = extracted;
    // [L53] Temporarily set environment variable "LANGSMITH_TRACING" to "false" for this test.
    vi.stubEnv('LANGSMITH_TRACING', 'false');
    // [L54] Temporarily set environment variable "LANGCHAIN_TRACING_V2" to "false" for this test.
    vi.stubEnv('LANGCHAIN_TRACING_V2', 'false');
    // [L55] Temporarily set environment variable "LANGCHAIN_TRACING" to "false" for this test.
    vi.stubEnv('LANGCHAIN_TRACING', 'false');
    // [L56] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows.
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      // [L57] Declare `request` as a new `Request` instance initialized with `input`, `init`.
      const request = new Request(input, init);
      // [L58] Append an object containing url: `request.url`, body: the resolved value from `request.json` with no arguments to `requests` for later inspection.
      requests.push({ url: request.url, body: await request.json() as WireBody });
      // [L59] Return the result of `Response.json` using the result of `completedResponse` using `responseData` to the caller.
      return Response.json(completedResponse(responseData));
    // [L60] Close the callback or control-flow body and finish the surrounding syntax.
    }));
  // [L61] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L62] Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables..
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
// [L63] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L64] Register a test that "sends both PDFs as actual file inputs and receives strict structured output without a network call".
  it('sends both PDFs as actual file inputs and receives strict structured output without a network call', async () => {
    // [L65] Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`.
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L66] Assert that `result` deeply equals `extracted`.
    expect(result).toEqual(extracted);
    // [L67] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L68] Declare `request` as `requests[0]`.
    const request = requests[0]!;
    // [L69] Assert that `request.url` strictly equals "https://api.openai.com/v1/responses".
    expect(request.url).toBe('https://api.openai.com/v1/responses');
    // [L70] Assert that `request.body.model` strictly equals `DEFAULT_MODEL`.
    expect(request.body.model).toBe(DEFAULT_MODEL);
    // [L71] Assert that `request.body.store` strictly equals false.
    expect(request.body.store).toBe(false);
    // [L72] Assert that `request.body.temperature` is undefined.
    expect(request.body.temperature).toBeUndefined();
    // [L73] Assert that `request.body.text?.format` contains the expected object fields an object containing type: "json_schema", strict: true.
    expect(request.body.text?.format).toMatchObject({ type: 'json_schema', strict: true });
    // [L74] Assert that `request.body.text?.format?.schema?.required` contains "buyerAgent".
    expect(request.body.text?.format?.schema?.required).toContain('buyerAgent');
    // [L75] Assert the structured extraction schema includes the separate buyerAgent property.
    expect(request.body.text?.format?.schema?.properties).toHaveProperty('buyerAgent');
    // [L76] Declare `files` as the result of `request.body.input.flatMap(item => item.content ?? []).filter` using a callback that returns `item.type` strictly equals "input_file".
    const files = request.body.input.flatMap(item => item.content ?? []).filter(item => item.type === 'input_file');
    // [L77] Assert that `files` deeply equals an array containing an object containing type: "input_file", filename: "urla.pdf", file_data: text interpolating the result of `payload.urla.buffer.toString` using `'base64'`, an object containing type: "input_file", filename: "sales-contract.pdf", file_data: text interpolating the result of `payload.salesContract!.buffer.toString` using `'base64'`.
    expect(files).toEqual([
      // [L78] Set fixture property `type` to "input_file". Set fixture property `filename` to "urla.pdf". Set fixture property `file_data` to text interpolating the result of `payload.urla.buffer.toString` using "base64".
      { type: 'input_file', filename: 'urla.pdf', file_data: `data:application/pdf;base64,${payload.urla.buffer.toString('base64')}` },
      // [L79] Set fixture property `type` to "input_file". Set fixture property `filename` to "sales-contract.pdf". Set fixture property `file_data` to text interpolating the result of `payload.salesContract!.buffer.toString` using "base64".
      { type: 'input_file', filename: 'sales-contract.pdf', file_data: `data:application/pdf;base64,${payload.salesContract!.buffer.toString('base64')}` },
    // [L80] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L81] Declare `bodyText` as the result of `JSON.stringify` using `request.body`.
    const bodyText = JSON.stringify(request.body);
    // [L82] Assert that `bodyText` does not satisfy: contains `payload.input.apiKey`.
    expect(bodyText).not.toContain(payload.input.apiKey);
  // [L83] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L84] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L85] Register a test that "sends only the URLA when no sales contract is supplied".
  it('sends only the URLA when no sales contract is supplied', async () => {
    // [L86] Call `extractOrder` with an object containing input: `payload.input`, urla: `payload.urla`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. Wait for completion before continuing.
    await extractOrder({ input: payload.input, urla: payload.urla }, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L87] Declare `files` as the result of `requests[0]!.body.input.flatMap(item => item.content ?? []).filter` using a callback that returns `item.type` strictly equals "input_file".
    const files = requests[0]!.body.input.flatMap(item => item.content ?? []).filter(item => item.type === 'input_file');
    // [L88] Assert that `files` has length 1.
    expect(files).toHaveLength(1);
    // [L89] Assert that `files[0]!.filename` strictly equals "urla.pdf".
    expect(files[0]!.filename).toBe('urla.pdf');
  // [L90] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L91] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L92] Register a test that "sends explicit seller versus selling-agent rules to extraction and preserves them for preparation".
  it('sends explicit seller versus selling-agent rules to extraction and preserves them for preparation', async () => {
    // [L93] Call `extractOrder` with `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`. Wait for completion before continuing.
    await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L94] Declare `instructions` as the result of `requests[0]!.body.input.flatMap(item => item.content ?? []) .filter(item => item.type === 'input_text').map(item => String(item.text)).join` using "\n".
    const instructions = requests[0]!.body.input.flatMap(item => item.content ?? [])
      // [L95] Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions.
      .filter(item => item.type === 'input_text').map(item => String(item.text)).join('\n');
    // [L96] Iterate const prompt over an array containing `instructions`, `SYSTEM_PROMPT`.
    for (const prompt of [instructions, SYSTEM_PROMPT]) {
      // [L97] Assert that `prompt` contains "\"listing agent\", \"seller's agent\", \"seller agent\" and \"seller representative\" as listingAgent".
      expect(prompt).toContain('"listing agent", "seller\'s agent", "seller agent" and "seller representative" as listingAgent');
      // [L98] Assert that `prompt` contains "\"buyer's agent\", \"buyer agent\", \"buying agent\", \"selling agent\" and \"cooperating agent\" as buyerAgent only when the document explicitly establishes...".
      expect(prompt).toContain('"buyer\'s agent", "buyer agent", "buying agent", "selling agent" and "cooperating agent" as buyerAgent only when the document explicitly establishes representation of the buyer');
      // [L99] Assert that `prompt` contains "\"Seller's agent\" and \"selling agent\" are different labels".
      expect(prompt).toContain('"Seller\'s agent" and "selling agent" are different labels');
      // [L100] Assert that `prompt` contains "Purchase access uses listingAgent (the seller's agent); refinance access uses borrower".
      expect(prompt).toContain('Purchase access uses listingAgent (the seller\'s agent); refinance access uses borrower');
      // [L101] Assert that `prompt` contains "If a role is unclear, leave the agent role/details unknown and flag it for review".
      expect(prompt).toContain('If a role is unclear, leave the agent role/details unknown and flag it for review');
      // [L102] Assert that `prompt` contains "human review and submission remain mandatory".
      expect(prompt).toContain('human review and submission remain mandatory');
    // [L103] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L104] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L105] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L106] Register a test that "carries an unsigned sample contract purchase price through Responses extraction into the required sale-price plan".
  it('carries an unsigned sample contract purchase price through Responses extraction into the required sale-price plan', async () => {
    // [L107] Declare `documentWarning` as "Unsigned sample contract: confirm the final purchase price before submitting.".
    const documentWarning = 'Unsigned sample contract: confirm the final purchase price before submitting.';
    // [L108] Declare `priceEvidence` as an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase Price: $485,000.00".
    const priceEvidence = { field: 'salePrice', document: 'salesContract' as const, page: 1, quote: 'Purchase Price: $485,000.00' };
    // [L109] Assign an object whose fields are defined below to `responseData`.
    responseData = { ...extracted, salePrice: 485000, loanAmount: 388000,
      // [L110] Set fixture property `evidence` to an array containing `...extracted.evidence`, `priceEvidence`. Set fixture property `warnings` to an array containing `documentWarning`.
      evidence: [...extracted.evidence, priceEvidence], warnings: [documentWarning] };
    // [L111] Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`.
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L112] Declare `instructions` as the result of `requests[0]!.body.input.flatMap(item => item.content ?? []) .filter(item => item.type === 'input_text').map(item => String(item.text)).join` using "\n".
    const instructions = requests[0]!.body.input.flatMap(item => item.content ?? [])
      // [L113] Keep native input_text blocks, convert their text to strings, and join them with newlines for instruction assertions.
      .filter(item => item.type === 'input_text').map(item => String(item.text)).join('\n');
    // [L114] Existing comment: This checks the instructions actually sent, not merely an exported prompt constant.
    // This checks the instructions actually sent, not merely an exported prompt constant.
    // [L115] Iterate const prompt over an array containing `instructions`, `SYSTEM_PROMPT`.
    for (const prompt of [instructions, SYSTEM_PROMPT]) {
      // [L116] Assert that `prompt` does not satisfy: matches `/Use the signed contract for sale price/i`.
      expect(prompt).not.toMatch(/Use the signed contract for sale price/i);
      // [L117] Assert that `prompt` matches `/\bunsigned\b/i`.
      expect(prompt).toMatch(/\bunsigned\b/i);
      // [L118] Assert that `prompt` matches `/\bsample\b/i`.
      expect(prompt).toMatch(/\bsample\b/i);
      // [L119] Assert that `prompt` matches `/\bdraft\b/i`.
      expect(prompt).toMatch(/\bdraft\b/i);
      // [L120] Assert that `prompt` matches `/\bsalePrice\b/`.
      expect(prompt).toMatch(/\bsalePrice\b/);
    // [L121] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L122] Assert that `result.salePrice` strictly equals 485000.
    expect(result.salePrice).toBe(485000);
    // [L123] Assert that `result.loanAmount` strictly equals 388000.
    expect(result.loanAmount).toBe(388000);
    // [L124] Assert that `result.evidence` contains a deeply equal entry `priceEvidence`.
    expect(result.evidence).toContainEqual(priceEvidence);
    // [L125] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `result`, `payload.input`, true.
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(result, payload.input, true);
    // [L126] Assert that the result of `plan.filter` using a callback that returns `field.key` strictly equals "salePrice" deeply equals an array containing an object containing key: "salePrice", value: "485000", kind: "text", required: true.
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '485000', kind: 'text', required: true }]);
    // [L127] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    // [L128] Assert that `warnings` contains `documentWarning`.
    expect(warnings).toContain(documentWarning);
    // [L129] Assert that `missingRequiredFields` does not satisfy: contains "salePrice".
    expect(missingRequiredFields).not.toContain('salePrice');
  // [L130] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L131] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L132] Register a test that "preserves a null model price as missing information without substituting zero or the loan amount".
  it('preserves a null model price as missing information without substituting zero or the loan amount', async () => {
    // [L133] Assign an object containing values copied from `extracted`, salePrice: null (unknown or absent), loanAmount: 388000, warnings: an array containing "The contract does not establish a purchase price." to `responseData`.
    responseData = { ...extracted, salePrice: null, loanAmount: 388000, warnings: ['The contract does not establish a purchase price.'] };
    // [L134] Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`.
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L135] Assert that `result.salePrice` is null.
    expect(result.salePrice).toBeNull();
    // [L136] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using `result`, `payload.input`, true.
    const { plan, missingRequiredFields } = buildFieldPlan(result, payload.input, true);
    // [L137] Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals "salePrice" strictly equals false.
    expect(plan.some(field => field.key === 'salePrice')).toBe(false);
    // [L138] Assert that `missingRequiredFields` contains "salePrice".
    expect(missingRequiredFields).toContain('salePrice');
    // [L139] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  // [L140] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L141] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L142] Register a test that "turns free-form extracted descriptions into supported required dropdown values".
  it('turns free-form extracted descriptions into supported required dropdown values', async () => {
    // [L143] Configure mock `vi.mocked(fetch)` to resolve on its next call to the result of `Response.json` using the result of `completedResponse` using an object whose fields are defined below.
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(completedResponse({ ...extracted,
      // [L144] Set fixture property `loanType` to "Fixed Rate". Set fixture property `propertyType` to "Single-family detached residence". Set fixture property `product` to " ".
      loanType: 'Fixed Rate', propertyType: 'Single-family detached residence', product: ' ' })));
    // [L145] Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`.
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L146] Declare `{ plan }` as the result of `buildFieldPlan` using `result`, `payload.input`, true.
    const { plan } = buildFieldPlan(result, payload.input, true);
    // [L147] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "loanType" contains the expected object fields an object containing value: "Conventional", required: true.
    expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: 'Conventional', required: true });
    // [L148] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "propertyType" contains the expected object fields an object containing value: "Single Family", required: true.
    expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: 'Single Family', required: true });
    // [L149] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: "1004 SFR CONV", required: true.
    expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR CONV', required: true });
  // [L150] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L151] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L152] Register a test that "preserves source-linked borrower and both agent identities through extraction and access planning".
  it('preserves source-linked borrower and both agent identities through extraction and access planning', async () => {
    // [L153] Assign an object whose fields are defined below to `responseData`.
    responseData = { ...extracted,
      // [L154] Set fixture property `borrower` to an object containing values copied from `emptyContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100".
      borrower: { ...emptyContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
      // [L155] Set fixture property `listingAgent` to an object containing values copied from `emptyContact`, firstName: "Lena", lastName: "Listing", mobilePhone: "7025550111", email: "listing@example.test".
      listingAgent: { ...emptyContact, firstName: 'Lena', lastName: 'Listing', mobilePhone: '7025550111', email: 'listing@example.test' },
      // [L156] Set fixture property `buyerAgent` to an object containing values copied from `emptyContact`, firstName: "Bailey", lastName: "Buyeragent", workPhone: "7025550222", email: "buyeragent@example.test".
      buyerAgent: { ...emptyContact, firstName: 'Bailey', lastName: 'Buyeragent', workPhone: '7025550222', email: 'buyeragent@example.test' },
      // [L157] Set fixture property `evidence` to an array containing `...extracted.evidence`, an object containing field: "borrower.homePhone", document: "urla", page: 1, quote: "Casey Borrower Home Phone 7025550100", an object containing field: "listingAgent.mobilePhone", document: "salesContract", page: 9, quote: "Seller's Agent: Lena Listing; Mobile: 7025550111", an object containing field: "buyerAgent.workPhone", document: "salesContract", page: 10, quote: "Buyer's Agent: Bailey Buyeragent; Office: 7025550222".
      evidence: [...extracted.evidence,
        // [L158] Set fixture property `field` to "borrower.homePhone". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Casey Borrower Home Phone 7025550100".
        { field: 'borrower.homePhone', document: 'urla', page: 1, quote: 'Casey Borrower Home Phone 7025550100' },
        // [L159] Set fixture property `field` to "listingAgent.mobilePhone". Set fixture property `document` to "salesContract". Set fixture property `page` to 9. Set fixture property `quote` to "Seller's Agent: Lena Listing; Mobile: 7025550111".
        { field: 'listingAgent.mobilePhone', document: 'salesContract', page: 9, quote: "Seller's Agent: Lena Listing; Mobile: 7025550111" },
        // [L160] Set fixture property `field` to "buyerAgent.workPhone". Set fixture property `document` to "salesContract". Set fixture property `page` to 10. Set fixture property `quote` to "Buyer's Agent: Bailey Buyeragent; Office: 7025550222".
        { field: 'buyerAgent.workPhone', document: 'salesContract', page: 10, quote: "Buyer's Agent: Bailey Buyeragent; Office: 7025550222" },
      // [L161] Close the array of fixture values for `evidence` and finish the surrounding syntax.
      ],
    // [L162] Close the fixture object and finish the surrounding syntax.
    };
    // [L163] Declare `result` as the resolved value from `extractOrder` using `payload`, the result of `createModel` using `payload.input.apiKey`, `DEFAULT_MODEL`, `new AbortController().signal`.
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    // [L164] Assert that `result` deeply equals `responseData`.
    expect(result).toEqual(responseData);
    // [L165] Iterate const loanPurpose over an array containing "Purchase", "Refinance".
    for (const loanPurpose of ['Purchase', 'Refinance'] as const) {
      // [L166] Declare `{ plan }` as the result of `buildFieldPlan` using an object containing values copied from `result`, loanPurpose, `payload.input`, true.
      const { plan } = buildFieldPlan({ ...result, loanPurpose }, payload.input, true);
      // [L167] Assert that `plan.find(field => field.key === 'contact.firstName')?.value` strictly equals "Lena" when `loanPurpose` strictly equals "Purchase", otherwise "Casey".
      expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe(loanPurpose === 'Purchase' ? 'Lena' : 'Casey');
      // [L168] Assert that `plan.find(field => field.key === 'contact.mobilePhone')?.value` strictly equals "7025550111" when `loanPurpose` strictly equals "Purchase", otherwise "".
      expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe(loanPurpose === 'Purchase' ? '7025550111' : '');
      // [L169] Assert that `plan.find(field => field.key === 'contact.homePhone')?.value` strictly equals "7025550100" when `loanPurpose` strictly equals "Refinance", otherwise "".
      expect(plan.find(field => field.key === 'contact.homePhone')?.value).toBe(loanPurpose === 'Refinance' ? '7025550100' : '');
      // [L170] Assert that `plan.find(field => field.key === 'listingAgent.email')?.value` strictly equals "listing@example.test".
      expect(plan.find(field => field.key === 'listingAgent.email')?.value).toBe('listing@example.test');
      // [L171] Assert that `plan.find(field => field.key === 'buyerAgent.email')?.value` strictly equals "buyeragent@example.test".
      expect(plan.find(field => field.key === 'buyerAgent.email')?.value).toBe('buyeragent@example.test');
    // [L172] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L173] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L174] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L175] Register a test that "transmits screenshot tool output as image input rather than a serialized text blob".
  it('transmits screenshot tool output as image input rather than a serialized text blob', async () => {
    // [L176] Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic order page screenshot.", an object containing type: "image_url", image_url: an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
    const screenshot = [
      // [L177] Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page screenshot.".
      { type: 'text', text: 'Synthetic order page screenshot.' },
      // [L178] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    // [L179] Close the array of fixture values for `screenshot` and finish the surrounding syntax.
    ];
    // [L180] Call `createModel(payload.input.apiKey, DEFAULT_MODEL).invoke` with the result of `toProviderMessages` using "openai", an array containing a new `HumanMessage` instance initialized with "Inspect the order page.", a new `AIMessage` instance initialized with an object containing content: `''`, tool_calls: `[{ id: 'call_screenshot', name: 'screenshot_page', args: {}, type: 'tool_call' }]`, a new `ToolMessage` instance initialized with an object containing tool_call_id: `'call_screenshot'`, name: `'screenshot_page'`, content: `screenshot`. Wait for completion before continuing.
    await createModel(payload.input.apiKey, DEFAULT_MODEL).invoke(toProviderMessages('openai', [
      // [L181] Add a synthetic human message asking the model to inspect the order page.
      new HumanMessage('Inspect the order page.'),
      // [L182] Set fixture property `content` to "". Set fixture property `tool_calls` to an array containing an object containing id: "call_screenshot", name: "screenshot_page", args: an empty object, type: "tool_call".
      new AIMessage({ content: '', tool_calls: [{ id: 'call_screenshot', name: 'screenshot_page', args: {}, type: 'tool_call' }] }),
      // [L183] Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `content` to `screenshot`.
      new ToolMessage({ tool_call_id: 'call_screenshot', name: 'screenshot_page', content: screenshot }),
    // [L184] Close the array of fixture values and finish the surrounding syntax.
    ]));
    // [L185] Declare `toolOutput` as the result of `requests[0]!.body.input.find` using a callback that returns `item.type` strictly equals "function_call_output".
    const toolOutput = requests[0]!.body.input.find(item => item.type === 'function_call_output');
    // [L186] Assert that `toolOutput?.output` deeply equals an array containing an object containing type: "input_text", text: "Synthetic order page screenshot.", an object containing type: "input_image", image_url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
    expect(toolOutput?.output).toEqual([
      // [L187] Set fixture property `type` to "input_text". Set fixture property `text` to "Synthetic order page screenshot.".
      { type: 'input_text', text: 'Synthetic order page screenshot.' },
      // [L188] Set fixture property `type` to "input_image". Set fixture property `image_url` to "data:image/png;base64,iVBORw0KGgo=". Set fixture property `detail` to "auto".
      { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' },
    // [L189] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L190] Assert that `typeof toolOutput?.output` does not satisfy: strictly equals "string".
    expect(typeof toolOutput?.output).not.toBe('string');
  // [L191] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L192] Close the callback or control-flow body and finish the surrounding syntax.
});
