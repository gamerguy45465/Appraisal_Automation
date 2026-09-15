// [L1] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { tool } from "@langchain/core/tools" for these regression tests.
import { tool } from '@langchain/core/tools';
// [L3] Import { z } from "zod" for these regression tests.
import { z } from 'zod';
// [L4] Import { createModel, extractOrder } from "../src/extraction.js" for these regression tests.
import { createModel, extractOrder } from '../src/extraction.js';
// [L5] Import { prepareOrderWithAgent } from "../src/agent.js" for these regression tests.
import { prepareOrderWithAgent } from '../src/agent.js';
// [L6] Import { buildFieldPlan, DEFAULT_MODELS, type ExtractedOrder, type JobPayload } from "../src/domain.js" for these regression tests.
import { buildFieldPlan, DEFAULT_MODELS, type ExtractedOrder, type JobPayload } from '../src/domain.js';
// [L7] Import type { createEnvironmentTools } from "../src/environment.js" for these regression tests.
import type { createEnvironmentTools } from '../src/environment.js';
// [L8] Import type { BrowserSession } from "../src/browser/session.js" for these regression tests.
import type { BrowserSession } from '../src/browser/session.js';
// [L9] Blank line separating the surrounding declarations, statements, or document blocks.

// [L10] Declare `emptyContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L11] Declare `extracted` as an object whose fields are defined below.
const extracted: ExtractedOrder = {
  // [L12] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase".
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  // [L13] Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "Primary Residence".
  product: null, propertyType: 'Single Family', occupancy: 'Primary Residence',
  // [L14] Set fixture property `property` to an object containing address: null (unknown or absent), unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent).
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  // [L15] Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000.
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000,
  // [L16] Set fixture property `salePrice` to 485000. Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent).
  salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  // [L17] Set fixture property `borrower` to `emptyContact`. Set fixture property `coBorrower` to `emptyContact`.
  borrower: emptyContact, coBorrower: emptyContact,
  // [L18] Set fixture property `listingAgent` to an object containing values copied from `emptyContact`, firstName: "Avery", lastName: "Ellis", email: "listing@example.test". Set fixture property `buyerAgent` to `emptyContact`.
  listingAgent: { ...emptyContact, firstName: 'Avery', lastName: 'Ellis', email: 'listing@example.test' }, buyerAgent: emptyContact,
  // [L19] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  complexProperty: false, highProfileCustomer: false,
  // [L20] Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase", an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase price $485,000".
  evidence: [
    // [L21] Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional".
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    // [L22] Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase".
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    // [L23] Set fixture property `field` to "salePrice". Set fixture property `document` to "salesContract". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase price $485,000".
    { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase price $485,000' },
  // [L24] Set fixture property `warnings` to an empty array.
  ], warnings: [],
// [L25] Close the fixture object for `extracted` and finish the surrounding syntax.
};
// [L26] Blank line separating the surrounding declarations, statements, or document blocks.

// [L27] Define helper `payload` with parameters model for the fixture operations below.
function payload(model: string = DEFAULT_MODELS.google): JobPayload {
  // [L28] Return an object whose fields are defined below to the caller.
  return { input: { provider: 'google', model, apiKey: 'synthetic-google-selected-key-only', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    // [L29] Set fixture property `urla` to an object containing name: "sample.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic URLA".
    urla: { name: 'sample.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    // [L30] Set fixture property `salesContract` to an object containing name: "purchase.pdf", buffer: the result of `Buffer.from` using "%PDF-1.7 synthetic contract".
    salesContract: { name: 'purchase.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
// [L31] Close the callback or control-flow body for `payload` and finish the surrounding syntax.
}
// [L32] Blank line separating the surrounding declarations, statements, or document blocks.

// [L33] Define the TypeScript shape `JsonSchema` used by the test fixtures; this adds no runtime value.
interface JsonSchema {
  // [L34] Declare optional fixture property `type` with type `string | string[]`.
  type?: string | string[];
  // [L35] Declare optional fixture property `nullable` with type `boolean`.
  nullable?: boolean;
  // [L36] Declare optional fixture property `required` with type `string[]`.
  required?: string[];
  // [L37] Declare optional fixture property `properties` with type `Record<string, JsonSchema>`.
  properties?: Record<string, JsonSchema>;
  // [L38] Declare optional fixture property `exclusiveMinimum` with type `number`.
  exclusiveMinimum?: number;
  // [L39] Declare optional fixture property `anyOf` with type `JsonSchema[]`.
  anyOf?: JsonSchema[];
// [L40] Finish the surrounding expression and delimiters.
}
// [L41] Define the TypeScript shape `GooglePart` used by the test fixtures; this adds no runtime value.
interface GooglePart {
  // [L42] Declare optional fixture property `text` with type `string`.
  text?: string;
  // [L43] Declare optional fixture property `inlineData` with type `{ mimeType: string; data: string }`.
  inlineData?: { mimeType: string; data: string };
  // [L44] Declare optional fixture property `fileData` with type `unknown`.
  fileData?: unknown;
  // [L45] Declare optional fixture property `functionCall` with type `{ id?: string; name: string; args: unknown }`.
  functionCall?: { id?: string; name: string; args: unknown };
  // [L46] Declare optional fixture property `functionResponse` with type `{ id?: string; name: string; response: { result: unknown } }`.
  functionResponse?: { id?: string; name: string; response: { result: unknown } };
  // [L47] Declare optional fixture property `thoughtSignature` with type `string`.
  thoughtSignature?: string;
// [L48] Finish the surrounding expression and delimiters.
}
// [L49] Define the TypeScript shape `GoogleBody` used by the test fixtures; this adds no runtime value.
interface GoogleBody {
  // [L50] Declare fixture property `contents` with type `Array<{ role: string; parts: GooglePart[] }>`.
  contents: Array<{ role: string; parts: GooglePart[] }>;
  // [L51] Declare optional fixture property `systemInstruction` with type `{ parts: Array<{ text: string }> }`.
  systemInstruction?: { parts: Array<{ text: string }> };
  // [L52] Declare optional fixture property `generationConfig` with type `{ responseMimeType?: string; responseJsonSchema?: JsonSchema; temperature?: number; thinkingConfig?: unknown }`.
  generationConfig?: { responseMimeType?: string; responseJsonSchema?: JsonSchema; temperature?: number; thinkingConfig?: unknown };
  // [L53] Declare optional fixture property `tools` with type `Array<{ functionDeclarations?: Array<{ name: string; parameters: JsonSchema }> }>`.
  tools?: Array<{ functionDeclarations?: Array<{ name: string; parameters: JsonSchema }> }>;
  // [L54] Declare optional fixture property `toolConfig` with type `{ functionCallingConfig?: { mode?: string; allowedFunctionNames?: string[] } }`.
  toolConfig?: { functionCallingConfig?: { mode?: string; allowedFunctionNames?: string[] } };
  // [L55] Declare optional fixture property `store` with type `unknown`.
  store?: unknown;
// [L56] Finish the surrounding expression and delimiters.
}
// [L57] Define helper `googleResponse` with parameters parts for the fixture operations below.
function googleResponse(parts: GooglePart[] = [{ text: JSON.stringify(extracted) }]) {
  // [L58] Return an object whose fields are defined below to the caller.
  return { candidates: [{ index: 0, content: { role: 'model', parts }, finishReason: 'STOP' }],
    // [L59] Set fixture property `usageMetadata` to an object containing promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20. Set fixture property `modelVersion` to `DEFAULT_MODELS.google`.
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 }, modelVersion: DEFAULT_MODELS.google };
// [L60] Close the callback or control-flow body for `googleResponse` and finish the surrounding syntax.
}
// [L61] Blank line separating the surrounding declarations, statements, or document blocks.

// [L62] Group regression tests for "Google Gemini actual adapter transport".
describe('Google Gemini actual adapter transport', () => {
  // [L63] Declare `requests` for assignment later.
  let requests: Array<{ url: string; body: GoogleBody; keyMatches: boolean; authorization: string | null; redirect: RequestRedirect; signal: AbortSignal }>;
  // [L64] Declare `respond` for assignment later.
  let respond: (body: GoogleBody, index: number) => Response | Promise<Response>;
  // [L65] Run this setup before every test in the group.
  beforeEach(() => {
    // [L66] Assign an empty array to `requests`.
    requests = [];
    // [L67] Assign a callback that returns the result of `Response.json` using the result of `googleResponse` with no arguments to `respond`.
    respond = () => Response.json(googleResponse());
    // [L68] Set all three LangSmith/LangChain tracing environment flags to false for the test.
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    // [L69] Set ambient Google, Gemini, OpenAI, and Anthropic keys to synthetic unselected values so the transport must use the explicit job key.
    for (const name of ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']) vi.stubEnv(name, 'synthetic-unselected-key');
    // [L70] Temporarily set environment variable "GOOGLE_CLOUD_CREDENTIALS" to "malformed-synthetic-credentials-must-not-be-parsed" for this test.
    vi.stubEnv('GOOGLE_CLOUD_CREDENTIALS', 'malformed-synthetic-credentials-must-not-be-parsed');
    // [L71] Temporarily set environment variable "GOOGLE_APPLICATION_CREDENTIALS" to "C:/synthetic-missing-credentials.json" for this test.
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', 'C:/synthetic-missing-credentials.json');
    // [L72] Temporarily set environment variable "GOOGLE_GENAI_USE_VERTEXAI" to "true" for this test.
    vi.stubEnv('GOOGLE_GENAI_USE_VERTEXAI', 'true');
    // [L73] Temporarily set environment variable "LANGSMITH_GATEWAY" to "https://untrusted.invalid/google" for this test.
    vi.stubEnv('LANGSMITH_GATEWAY', 'https://untrusted.invalid/google');
    // [L74] Temporarily set environment variable "GOOGLE_GEMINI_BASE_URL" to "https://untrusted.invalid/google" for this test.
    vi.stubEnv('GOOGLE_GEMINI_BASE_URL', 'https://untrusted.invalid/google');
    // [L75] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows.
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      // [L76] Declare `request` as a new `Request` instance initialized with `input`, `init`.
      const request = new Request(input, init);
      // [L77] Declare `body` as the resolved value from `request.json` with no arguments.
      const body = await request.json() as GoogleBody;
      // [L78] Append an object whose fields are defined below to `requests` for later inspection.
      requests.push({ url: request.url, body, keyMatches: request.headers.get('x-goog-api-key') === payload().input.apiKey,
        // [L79] Set fixture property `authorization` to the result of `request.headers.get` using "authorization". Set fixture property `redirect` to `request.redirect`. Set fixture property `signal` to `request.signal`.
        authorization: request.headers.get('authorization'), redirect: request.redirect, signal: request.signal });
      // [L80] Return the result of `respond` using `body`, `requests.length` to the caller.
      return respond(body, requests.length);
    // [L81] Close the callback or control-flow body and finish the surrounding syntax.
    }));
  // [L82] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L83] Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables..
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
// [L84] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L85] Register a parameterized test that "uses the explicitly selected key/model with inline PDFs and native JSON schema for %s".
  it.each(['gemini-3.8-flash', 'gemini-2.5-pro', 'custom:model/variant?mode=safe#id'])('uses the explicitly selected key/model with inline PDFs and native JSON schema for %s', async modelId => {
    // [L86] Declare `documents` as the result of `payload` using `modelId`.
    const documents = payload(modelId);
    // [L87] Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `modelId`, "google", `new AbortController().signal`.
    const result = await extractOrder(documents, createModel(documents.input.apiKey, modelId, 'google'), new AbortController().signal);
    // [L88] Assert that `result` deeply equals `extracted`.
    expect(result).toEqual(extracted);
    // [L89] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L90] Declare `request` as `requests[0]`.
    const request = requests[0]!;
    // [L91] Assert that `request.url` strictly equals text interpolating the result of `encodeURIComponent` using `modelId`.
    expect(request.url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`);
    // [L92] Assert that `request.keyMatches` strictly equals true.
    expect(request.keyMatches).toBe(true);
    // [L93] Assert that `request.authorization` is null.
    expect(request.authorization).toBeNull();
    // [L94] Assert that `request.redirect` strictly equals "error".
    expect(request.redirect).toBe('error');
    // [L95] Assert that `request.body.store` is undefined.
    expect(request.body.store).toBeUndefined();
    // [L96] Assert that `request.body.tools` is undefined.
    expect(request.body.tools).toBeUndefined();
    // [L97] Assert that `request.body.generationConfig?.temperature` is undefined.
    expect(request.body.generationConfig?.temperature).toBeUndefined();
    // [L98] Assert that `request.body.generationConfig?.thinkingConfig` is undefined.
    expect(request.body.generationConfig?.thinkingConfig).toBeUndefined();
    // [L99] Assert that `request.body.generationConfig?.responseMimeType` strictly equals "application/json".
    expect(request.body.generationConfig?.responseMimeType).toBe('application/json');
    // [L100] Declare `schema` as `request.body.generationConfig?.responseJsonSchema`.
    const schema = request.body.generationConfig?.responseJsonSchema;
    // [L101] Assert that the result of `schema?.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments.
    expect(schema?.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    // [L102] Assert that `schema?.properties?.borrower?.properties?.firstName?.type` deeply equals an array containing "string", "null".
    expect(schema?.properties?.borrower?.properties?.firstName?.type).toEqual(['string', 'null']);
    // [L103] Assert that `schema?.properties?.loanAmount` contains the expected object fields an object containing anyOf: an array containing an object containing type: "number", exclusiveMinimum: 0, an object containing type: "null".
    expect(schema?.properties?.loanAmount).toMatchObject({ anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'null' }] });
    // [L104] Declare `parts` as the result of `request.body.contents.flatMap` using a callback that returns `content.parts`.
    const parts = request.body.contents.flatMap(content => content.parts);
    // [L105] Assert that the result of `parts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using `'base64'`, an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using `'base64'`.
    expect(parts.filter(part => part.inlineData)).toEqual([
      // [L106] Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using "base64".
      { inlineData: { mimeType: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
      // [L107] Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.salesContract!.buffer.toString` using "base64".
      { inlineData: { mimeType: 'application/pdf', data: documents.salesContract!.buffer.toString('base64') } },
    // [L108] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L109] Iterate const [filename, otherFilename, data] over an array containing an array containing "urla.pdf", "sales-contract.pdf", the result of `documents.urla.buffer.toString` using `'base64'`, an array containing "sales-contract.pdf", "urla.pdf", the result of `documents.salesContract!.buffer.toString` using `'base64'`.
    for (const [filename, otherFilename, data] of [
      // [L110] Provide a parameterized test row with ['urla.pdf', 'sales-contract.pdf', documents.urla.buffer.toString('base64')],; the test receives these values as its inputs and expectations.
      ['urla.pdf', 'sales-contract.pdf', documents.urla.buffer.toString('base64')],
      // [L111] Provide a parameterized test row with ['sales-contract.pdf', 'urla.pdf', documents.salesContract!.buffer.toString('base64')],; the test receives these values as its inputs and expectations.
      ['sales-contract.pdf', 'urla.pdf', documents.salesContract!.buffer.toString('base64')],
    // [L112] Finish the scenario array and begin the loop body that checks each listed case.
    ] as const) {
      // [L113] Declare `pdfIndex` as the result of `parts.findIndex` using a callback that returns `part.inlineData?.data` strictly equals `data`.
      const pdfIndex = parts.findIndex(part => part.inlineData?.data === data);
      // [L114] Declare `sourceMarker` as `parts[pdfIndex - 1]?.text`.
      const sourceMarker = parts[pdfIndex - 1]?.text;
      // [L115] Assert that `sourceMarker` contains `filename`.
      expect(sourceMarker).toContain(filename);
      // [L116] Assert that `sourceMarker` does not satisfy: contains `otherFilename`.
      expect(sourceMarker).not.toContain(otherFilename);
    // [L117] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L118] Assert that the result of `parts.some` using a callback that returns `part.fileData` strictly equals false.
    expect(parts.some(part => part.fileData)).toBe(false);
    // [L119] Assert that the result of `parts.map(part => part.text ?? '').join` using "\n" contains "Keep unavailable text and numeric amounts null".
    expect(parts.map(part => part.text ?? '').join('\n')).toContain('Keep unavailable text and numeric amounts null');
    // [L120] Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains `documents.input.apiKey`.
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    // [L121] Assert that the result of `JSON.stringify` using `request.body` does not satisfy: contains "synthetic-unselected-key".
    expect(JSON.stringify(request.body)).not.toContain('synthetic-unselected-key');
    // [L122] Declare `{ plan }` as the result of `buildFieldPlan` using `result`, `documents.input`, true.
    const { plan } = buildFieldPlan(result, documents.input, true);
    // [L123] Assert that `plan.find(field => field.key === 'salePrice')?.value` strictly equals "485000".
    expect(plan.find(field => field.key === 'salePrice')?.value).toBe('485000');
    // [L124] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  // [L125] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L126] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L127] Register a test that "sends only the URLA when the optional contract is absent".
  it('sends only the URLA when the optional contract is absent', async () => {
    // [L128] Declare `{ salesContract: _contract, ...documents }` as the result of `payload` with no arguments.
    const { salesContract: _contract, ...documents } = payload();
    // [L129] Call `extractOrder` with `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal`. Wait for completion before continuing.
    await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal);
    // [L130] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L131] Declare `parts` as the result of `requests[0]!.body.contents.flatMap` using a callback that returns `content.parts`.
    const parts = requests[0]!.body.contents.flatMap(content => content.parts);
    // [L132] Assert that the result of `parts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using `'base64'`.
    expect(parts.filter(part => part.inlineData)).toEqual([
      // [L133] Set fixture property `inlineData` to an object containing mimeType: "application/pdf", data: the result of `documents.urla.buffer.toString` using "base64".
      { inlineData: { mimeType: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
    // [L134] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L135] Declare `sourceMarker` as `parts[parts.findIndex(part => part.inlineData) - 1]?.text`.
    const sourceMarker = parts[parts.findIndex(part => part.inlineData) - 1]?.text;
    // [L136] Assert that `sourceMarker` contains "urla.pdf".
    expect(sourceMarker).toContain('urla.pdf');
    // [L137] Assert that `sourceMarker` does not satisfy: contains "sales-contract.pdf".
    expect(sourceMarker).not.toContain('sales-contract.pdf');
  // [L138] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L139] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L140] Register a test that "sends no request when the caller cancels before extraction starts".
  it('sends no request when the caller cancels before extraction starts', async () => {
    // [L141] Declare `controller` as a new `AbortController` instance.
    const controller = new AbortController();
    // [L142] Abort `controller` with a new `DOMException` instance initialized with "Synthetic caller cancellation", "AbortError".
    controller.abort(new DOMException('Synthetic caller cancellation', 'AbortError'));
    // [L143] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L144] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `controller.signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), controller.signal)).rejects.toThrow();
    // [L145] Assert that `requests` has length 0.
    expect(requests).toHaveLength(0);
    // [L146] Assert that `fetch` does not satisfy: was called.
    expect(fetch).not.toHaveBeenCalled();
  // [L147] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L148] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L149] Register a test that "propagates in-flight caller cancellation to the actual Google transport without retrying".
  it('propagates in-flight caller cancellation to the actual Google transport without retrying', async () => {
    // [L150] Declare `markStarted` for assignment later.
    let markStarted!: () => void;
    // [L151] Declare `started` as a new `Promise` instance initialized with a callback that performs: Assign `resolve` to `markStarted`..
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    // [L152] Declare `transportAborted` as false.
    let transportAborted = false;
    // [L153] Assign a callback that returns a new `Promise` instance initialized with a callback whose body follows to `respond`.
    respond = () => new Promise<Response>((_resolve, reject) => {
      // [L154] Declare `transportSignal` as `requests.at(-1)!.signal`.
      const transportSignal = requests.at(-1)!.signal;
      // [L155] Call `transportSignal.addEventListener` with "abort", a callback whose body follows, an object containing once: true.
      transportSignal.addEventListener('abort', () => {
        // [L156] Assign true to `transportAborted`.
        transportAborted = true;
        // [L157] Call `reject` with `transportSignal.reason`.
        reject(transportSignal.reason);
      // [L158] Set fixture property `once` to true.
      }, { once: true });
      // [L159] Call `markStarted` without arguments.
      markStarted();
    // [L160] Close the callback or control-flow body and finish the surrounding syntax.
    });
    // [L161] Declare `controller` as a new `AbortController` instance.
    const controller = new AbortController();
    // [L162] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L163] Declare `result` as the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `controller.signal`.
    const result = extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), controller.signal);
    // [L164] Declare `rejected` as the result of `expect(result).rejects.toThrow` with no arguments.
    const rejected = expect(result).rejects.toThrow();
    // [L165] Wait for `started` to settle before continuing.
    await started;
    // [L166] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L167] Assert that `requests[0]!.signal.aborted` strictly equals false.
    expect(requests[0]!.signal.aborted).toBe(false);
    // [L168] Abort `controller` with a new `DOMException` instance initialized with "Synthetic caller cancellation", "AbortError".
    controller.abort(new DOMException('Synthetic caller cancellation', 'AbortError'));
    // [L169] Wait for `rejected` to settle before continuing.
    await rejected;
    // [L170] Assert that `transportAborted` strictly equals true.
    expect(transportAborted).toBe(true);
    // [L171] Assert that `requests[0]!.signal.aborted` strictly equals true.
    expect(requests[0]!.signal.aborted).toBe(true);
    // [L172] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
  // [L173] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L174] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L175] Register a parameterized test that "locally rejects $name despite a successful native JSON response".
  it.each([
    // [L176] Set fixture property `name` to "zero sale price". Set fixture property `data` to an object containing values copied from `extracted`, salePrice: 0.
    { name: 'zero sale price', data: { ...extracted, salePrice: 0 } },
    // [L177] Set fixture property `name` to "missing required contact property". Set fixture property `data` to an object containing values copied from `extracted`, listingAgent: an object containing email: "listing@example.test".
    { name: 'missing required contact property', data: { ...extracted, listingAgent: { email: 'listing@example.test' } } },
    // [L178] Set fixture property `name` to "invalid classification". Set fixture property `data` to an object containing values copied from `extracted`, loanProgram: "Invalid".
    { name: 'invalid classification', data: { ...extracted, loanProgram: 'Invalid' } },
    // [L179] Set fixture property `name` to "invalid evidence source". Set fixture property `data` to an object containing values copied from `extracted`, evidence: an array containing an object containing field: "salePrice", document: "unknown", page: 1, quote: "Synthetic".
    { name: 'invalid evidence source', data: { ...extracted, evidence: [{ field: 'salePrice', document: 'unknown', page: 1, quote: 'Synthetic' }] } },
  // [L180] Apply the preceding scenario rows to the parameterized test "locally rejects $name despite a successful native JSON response" and begin its callback.
  ])('locally rejects $name despite a successful native JSON response', async ({ data }) => {
    // [L181] Assign a callback that returns the result of `Response.json` using the result of `googleResponse` using an array containing `{ text: JSON.stringify(data) }` to `respond`.
    respond = () => Response.json(googleResponse([{ text: JSON.stringify(data) }]));
    // [L182] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L183] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal)).rejects.toThrow();
    // [L184] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
  // [L185] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L186] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L187] Register a test that "retries an explicitly unsupported native schema once with a tool schema on the same provider/model/key".
  it('retries an explicitly unsupported native schema once with a tool schema on the same provider/model/key', async () => {
    // [L188] Declare `documents` as the result of `payload` using "custom-supported-model".
    const documents = payload('custom-supported-model');
    // [L189] Assign a callback that returns the result of `Response.json` using an object containing error: `{ code: 400, status: 'INVALID_ARGUMENT', message: 'responseJsonSchema is not supported with this model' }`, an object containing status: `400` when `index` strictly equals 1, otherwise the result of `Response.json` using the result of `googleResponse` using `[{ functionCall: { name: 'appraisal_document_data', args: extracted }, thoughtSignature: 'c3ludGhldGljLWV4dHJhY3Q=' }]` to `respond`.
    respond = (_body, index) => index === 1
      // [L190] Set fixture property `error` to an object containing code: 400, status: "INVALID_ARGUMENT", message: "responseJsonSchema is not supported with this model". Set fixture property `status` to 400.
      ? Response.json({ error: { code: 400, status: 'INVALID_ARGUMENT', message: 'responseJsonSchema is not supported with this model' } }, { status: 400 })
      // [L191] Set fixture property `functionCall` to an object containing name: "appraisal_document_data", args: `extracted`. Set fixture property `thoughtSignature` to "c3ludGhldGljLWV4dHJhY3Q=".
      : Response.json(googleResponse([{ functionCall: { name: 'appraisal_document_data', args: extracted }, thoughtSignature: 'c3ludGhldGljLWV4dHJhY3Q=' }]));
    // [L192] Declare `result` as the resolved value from `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal`.
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal);
    // [L193] Assert that `result` deeply equals `extracted`.
    expect(result).toEqual(extracted);
    // [L194] Assert that `requests` has length 2.
    expect(requests).toHaveLength(2);
    // [L195] Assert that `new Set(requests.map(request => request.url)).size` strictly equals 1.
    expect(new Set(requests.map(request => request.url)).size).toBe(1);
    // [L196] Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.authorization` strictly equals `null` strictly equals true.
    expect(requests.every(request => request.keyMatches && request.authorization === null)).toBe(true);
    // [L197] Assert that `requests[0]!.body.generationConfig?.responseJsonSchema` is defined.
    expect(requests[0]!.body.generationConfig?.responseJsonSchema).toBeDefined();
    // [L198] Assert that `requests[1]!.body.generationConfig?.responseJsonSchema` is undefined.
    expect(requests[1]!.body.generationConfig?.responseJsonSchema).toBeUndefined();
    // [L199] Declare `functions` as the result of `requests[1]!.body.tools?.flatMap` using a callback that returns `tool.functionDeclarations` or, if null/undefined, an empty array.
    const functions = requests[1]!.body.tools?.flatMap(tool => tool.functionDeclarations ?? []);
    // [L200] Assert that the result of `functions?.map` using a callback that returns `fn.name` deeply equals an array containing "appraisal_document_data".
    expect(functions?.map(fn => fn.name)).toEqual(['appraisal_document_data']);
    // [L201] Assert that the result of `functions?.[0]?.parameters.required?.slice().sort` with no arguments deeply equals the result of `Object.keys(extracted).sort` with no arguments.
    expect(functions?.[0]?.parameters.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    // [L202] Assert that `functions?.[0]?.parameters.properties?.borrower?.properties?.firstName` contains the expected object fields an object containing type: "string", nullable: true.
    expect(functions?.[0]?.parameters.properties?.borrower?.properties?.firstName).toMatchObject({ type: 'string', nullable: true });
    // [L203] Assert that `requests[1]!.body.toolConfig?.functionCallingConfig` contains the expected object fields an object containing mode: "ANY", allowedFunctionNames: an array containing "appraisal_document_data".
    expect(requests[1]!.body.toolConfig?.functionCallingConfig).toMatchObject({ mode: 'ANY', allowedFunctionNames: ['appraisal_document_data'] });
  // [L204] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L205] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L206] Register a parameterized test that "does not retry output formats or reroute after HTTP $status: $message".
  it.each([
    // [L207] Set fixture property `status` to 400. Set fixture property `message` to "Invalid schema: too many nested fields in responseJsonSchema".
    { status: 400, message: 'Invalid schema: too many nested fields in responseJsonSchema' },
    // [L208] Set fixture property `status` to 400. Set fixture property `message` to "Billing is not enabled for this project.".
    { status: 400, message: 'Billing is not enabled for this project.' },
    // [L209] Set fixture property `status` to 401. Set fixture property `message` to "Invalid API key.".
    { status: 401, message: 'Invalid API key.' },
    // [L210] Set fixture property `status` to 403. Set fixture property `message` to "Permission denied for this model.".
    { status: 403, message: 'Permission denied for this model.' },
    // [L211] Set fixture property `status` to 404. Set fixture property `message` to "Requested model was not found.".
    { status: 404, message: 'Requested model was not found.' },
    // [L212] Set fixture property `status` to 422. Set fixture property `message` to "responseJsonSchema is not supported with this model".
    { status: 422, message: 'responseJsonSchema is not supported with this model' },
  // [L213] Apply the preceding scenario rows to the parameterized test "does not retry output formats or reroute after HTTP $status: $message" and begin its callback.
  ])('does not retry output formats or reroute after HTTP $status: $message', async ({ status, message }) => {
    // [L214] Assign a callback that returns the result of `Response.json` using an object containing error: an object containing code: `status`, status: `'INVALID_ARGUMENT'`, message, an object containing status to `respond`.
    respond = () => Response.json({ error: { code: status, status: 'INVALID_ARGUMENT', message } }, { status });
    // [L215] Declare `documents` as the result of `payload` using "selected-custom-model".
    const documents = payload('selected-custom-model');
    // [L216] Assert that the result of `extractOrder` using `documents`, the result of `createModel` using `documents.input.apiKey`, `documents.input.model`, "google", `new AbortController().signal` rejects with an error. Wait for the asynchronous assertion to settle.
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal)).rejects.toThrow();
    // [L217] Assert that `requests` has length 1.
    expect(requests).toHaveLength(1);
    // [L218] Assert that `requests[0]!.url` strictly equals "https://generativelanguage.googleapis.com/v1beta/models/selected-custom-model:generateContent".
    expect(requests[0]!.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/selected-custom-model:generateContent');
    // [L219] Assert that `requests[0]!.keyMatches` strictly equals true.
    expect(requests[0]!.keyMatches).toBe(true);
    // [L220] Assert that `requests[0]!.body.tools` is undefined.
    expect(requests[0]!.body.tools).toBeUndefined();
  // [L221] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L222] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L223] Register a test that "preserves real screenshot image parts and both thought signatures across bounded agent tool steps".
  it('preserves real screenshot image parts and both thought signatures across bounded agent tool steps', async () => {
    // [L224] Declare `documents` as the result of `payload` with no arguments.
    const documents = payload();
    // [L225] Declare `imageContent` as an array containing an object containing type: "text", text: "Synthetic order page only.", an object containing type: "image_url", image_url: an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
    const imageContent = [
      // [L226] Set fixture property `type` to "text". Set fixture property `text` to "Synthetic order page only.".
      { type: 'text', text: 'Synthetic order page only.' },
      // [L227] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: "data:image/png;base64,iVBORw0KGgo=", detail: "auto".
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    // [L228] Close the array of fixture values for `imageContent` and finish the surrounding syntax.
    ];
    // [L229] Declare `originalContent` as the result of `structuredClone` using `imageContent`.
    const originalContent = structuredClone(imageContent);
    // [L230] Declare `screenshot` as the result of `tool` using a promise-returning callback that returns `imageContent`, an object containing name: "screenshot_page", description: "Read a synthetic page image.", schema: the result of `z.object` using an empty object.
    const screenshot = tool(async () => imageContent, { name: 'screenshot_page', description: 'Read a synthetic page image.', schema: z.object({}) });
    // [L231] Declare `signatureA` as "c3ludGhldGljLXNpZ25hdHVyZS1h".
    const signatureA = 'c3ludGhldGljLXNpZ25hdHVyZS1h';
    // [L232] Declare `signatureB` as "c3ludGhldGljLXNpZ25hdHVyZS1i".
    const signatureB = 'c3ludGhldGljLXNpZ25hdHVyZS1i';
    // [L233] Assign a callback that returns the result of `Response.json` using the result of `googleResponse` using `[{ functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA }]` when `index === 1`, otherwise `index === 2 ? [{ functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB }] : [{ text: 'Ready for human review.' }]` to `respond`.
    respond = (_body, index) => Response.json(googleResponse(index === 1
      // [L234] Set fixture property `functionCall` to an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object. Set fixture property `thoughtSignature` to `signatureA`.
      ? [{ functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA }]
      // [L235] Set fixture property `functionCall` to an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object. Set fixture property `thoughtSignature` to `signatureB`.
      : index === 2 ? [{ functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB }]
        // [L236] Set fixture property `text` to "Ready for human review.".
        : [{ text: 'Ready for human review.' }]));
    // [L237] Call `prepareOrderWithAgent` with an object whose fields are defined below. Wait for completion before continuing.
    await prepareOrderWithAgent({ provider: 'google', model: createModel(documents.input.apiKey, documents.input.model, 'google'),
      // [L238] Set fixture property `environment` to an object containing tools: an empty array.
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      // [L239] Set fixture property `session` to an object containing tools: an array containing `screenshot`. Set fixture property `plan` to an empty array. Set fixture property `signal` to `new AbortController().signal`.
      session: { tools: [screenshot] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    // [L240] Assert that `requests` has length 3.
    expect(requests).toHaveLength(3);
    // [L241] Assert that the result of `requests.every` using a callback that returns `request.keyMatches` and `request.url` strictly equals `requests[0]!.url` strictly equals true.
    expect(requests.every(request => request.keyMatches && request.url === requests[0]!.url)).toBe(true);
    // [L242] Assert that `imageContent` deeply equals `originalContent`.
    expect(imageContent).toEqual(originalContent);
    // [L243] Declare `secondParts` as the result of `requests[1]!.body.contents.flatMap` using a callback that returns `content.parts`.
    const secondParts = requests[1]!.body.contents.flatMap(content => content.parts);
    // [L244] Assert that the result of `secondParts.filter` using a callback that returns `part.inlineData` deeply equals an array containing an object containing inlineData: an object containing mimeType: "image/png", data: "iVBORw0KGgo=".
    expect(secondParts.filter(part => part.inlineData)).toEqual([{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }]);
    // [L245] Declare `result` as `secondParts.find(part => part.functionResponse?.name === 'screenshot_page')?.functionResponse`.
    const result = secondParts.find(part => part.functionResponse?.name === 'screenshot_page')?.functionResponse;
    // [L246] Assert that `result?.response.result` deeply equals an array containing an object containing type: "text", text: "Synthetic order page only.".
    expect(result?.response.result).toEqual([{ type: 'text', text: 'Synthetic order page only.' }]);
    // [L247] Assert that the result of `JSON.stringify` using `result` does not satisfy: contains "iVBORw0KGgo=".
    expect(JSON.stringify(result)).not.toContain('iVBORw0KGgo=');
    // [L248] Declare `signedCalls` as the result of `requests[2]!.body.contents.filter(content => content.role === 'model') .flatMap(content => content.parts).filter` using a callback that returns `part.functionCall`.
    const signedCalls = requests[2]!.body.contents.filter(content => content.role === 'model')
      // [L249] Flatten all message parts and keep only native functionCall parts for tool-history assertions.
      .flatMap(content => content.parts).filter(part => part.functionCall);
    // [L250] Assert that `signedCalls` deeply equals an array containing an object containing functionCall: an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object, thoughtSignature: `signatureA`, an object containing functionCall: an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object, thoughtSignature: `signatureB`.
    expect(signedCalls).toEqual([
      // [L251] Set fixture property `functionCall` to an object containing id: "synthetic_screenshot", name: "screenshot_page", args: an empty object. Set fixture property `thoughtSignature` to `signatureA`.
      { functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA },
      // [L252] Set fixture property `functionCall` to an object containing id: "synthetic_plan", name: "get_order_field_plan", args: an empty object. Set fixture property `thoughtSignature` to `signatureB`.
      { functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB },
    // [L253] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L254] Assert that the result of `requests[2]!.body.tools?.flatMap(tool => tool.functionDeclarations ?? []).map(fn => fn.name).sort` with no arguments deeply equals an array containing "get_order_field_plan", "screenshot_page".
    expect(requests[2]!.body.tools?.flatMap(tool => tool.functionDeclarations ?? []).map(fn => fn.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
    // [L255] Assert that the result of `requests[2]!.body.systemInstruction?.parts.map(part => part.text).join` using "\n" contains "Do not submit".
    expect(requests[2]!.body.systemInstruction?.parts.map(part => part.text).join('\n')).toContain('Do not submit');
  // [L256] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L257] Close the callback or control-flow body and finish the surrounding syntax.
});
