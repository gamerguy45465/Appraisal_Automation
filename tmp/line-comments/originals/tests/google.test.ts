import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createModel, extractOrder } from '../src/extraction.js';
import { prepareOrderWithAgent } from '../src/agent.js';
import { buildFieldPlan, DEFAULT_MODELS, type ExtractedOrder, type JobPayload } from '../src/domain.js';
import type { createEnvironmentTools } from '../src/environment.js';
import type { BrowserSession } from '../src/browser/session.js';

const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
const extracted: ExtractedOrder = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  product: null, propertyType: 'Single Family', occupancy: 'Primary Residence',
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000,
  salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  borrower: emptyContact, coBorrower: emptyContact,
  listingAgent: { ...emptyContact, firstName: 'Avery', lastName: 'Ellis', email: 'listing@example.test' }, buyerAgent: emptyContact,
  complexProperty: false, highProfileCustomer: false,
  evidence: [
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase price $485,000' },
  ], warnings: [],
};

function payload(model: string = DEFAULT_MODELS.google): JobPayload {
  return { input: { provider: 'google', model, apiKey: 'synthetic-google-selected-key-only', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'sample.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    salesContract: { name: 'purchase.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
}

interface JsonSchema {
  type?: string | string[];
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  exclusiveMinimum?: number;
  anyOf?: JsonSchema[];
}
interface GooglePart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: unknown;
  functionCall?: { id?: string; name: string; args: unknown };
  functionResponse?: { id?: string; name: string; response: { result: unknown } };
  thoughtSignature?: string;
}
interface GoogleBody {
  contents: Array<{ role: string; parts: GooglePart[] }>;
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: { responseMimeType?: string; responseJsonSchema?: JsonSchema; temperature?: number; thinkingConfig?: unknown };
  tools?: Array<{ functionDeclarations?: Array<{ name: string; parameters: JsonSchema }> }>;
  toolConfig?: { functionCallingConfig?: { mode?: string; allowedFunctionNames?: string[] } };
  store?: unknown;
}
function googleResponse(parts: GooglePart[] = [{ text: JSON.stringify(extracted) }]) {
  return { candidates: [{ index: 0, content: { role: 'model', parts }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 }, modelVersion: DEFAULT_MODELS.google };
}

describe('Google Gemini actual adapter transport', () => {
  let requests: Array<{ url: string; body: GoogleBody; keyMatches: boolean; authorization: string | null; redirect: RequestRedirect; signal: AbortSignal }>;
  let respond: (body: GoogleBody, index: number) => Response | Promise<Response>;
  beforeEach(() => {
    requests = [];
    respond = () => Response.json(googleResponse());
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    for (const name of ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']) vi.stubEnv(name, 'synthetic-unselected-key');
    vi.stubEnv('GOOGLE_CLOUD_CREDENTIALS', 'malformed-synthetic-credentials-must-not-be-parsed');
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', 'C:/synthetic-missing-credentials.json');
    vi.stubEnv('GOOGLE_GENAI_USE_VERTEXAI', 'true');
    vi.stubEnv('LANGSMITH_GATEWAY', 'https://untrusted.invalid/google');
    vi.stubEnv('GOOGLE_GEMINI_BASE_URL', 'https://untrusted.invalid/google');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      const request = new Request(input, init);
      const body = await request.json() as GoogleBody;
      requests.push({ url: request.url, body, keyMatches: request.headers.get('x-goog-api-key') === payload().input.apiKey,
        authorization: request.headers.get('authorization'), redirect: request.redirect, signal: request.signal });
      return respond(body, requests.length);
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each(['gemini-3.8-flash', 'gemini-2.5-pro', 'custom:model/variant?mode=safe#id'])('uses the explicitly selected key/model with inline PDFs and native JSON schema for %s', async modelId => {
    const documents = payload(modelId);
    const result = await extractOrder(documents, createModel(documents.input.apiKey, modelId, 'google'), new AbortController().signal);
    expect(result).toEqual(extracted);
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request.url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`);
    expect(request.keyMatches).toBe(true);
    expect(request.authorization).toBeNull();
    expect(request.redirect).toBe('error');
    expect(request.body.store).toBeUndefined();
    expect(request.body.tools).toBeUndefined();
    expect(request.body.generationConfig?.temperature).toBeUndefined();
    expect(request.body.generationConfig?.thinkingConfig).toBeUndefined();
    expect(request.body.generationConfig?.responseMimeType).toBe('application/json');
    const schema = request.body.generationConfig?.responseJsonSchema;
    expect(schema?.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    expect(schema?.properties?.borrower?.properties?.firstName?.type).toEqual(['string', 'null']);
    expect(schema?.properties?.loanAmount).toMatchObject({ anyOf: [{ type: 'number', exclusiveMinimum: 0 }, { type: 'null' }] });
    const parts = request.body.contents.flatMap(content => content.parts);
    expect(parts.filter(part => part.inlineData)).toEqual([
      { inlineData: { mimeType: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
      { inlineData: { mimeType: 'application/pdf', data: documents.salesContract!.buffer.toString('base64') } },
    ]);
    for (const [filename, otherFilename, data] of [
      ['urla.pdf', 'sales-contract.pdf', documents.urla.buffer.toString('base64')],
      ['sales-contract.pdf', 'urla.pdf', documents.salesContract!.buffer.toString('base64')],
    ] as const) {
      const pdfIndex = parts.findIndex(part => part.inlineData?.data === data);
      const sourceMarker = parts[pdfIndex - 1]?.text;
      expect(sourceMarker).toContain(filename);
      expect(sourceMarker).not.toContain(otherFilename);
    }
    expect(parts.some(part => part.fileData)).toBe(false);
    expect(parts.map(part => part.text ?? '').join('\n')).toContain('Keep unavailable text and numeric amounts null');
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    expect(JSON.stringify(request.body)).not.toContain('synthetic-unselected-key');
    const { plan } = buildFieldPlan(result, documents.input, true);
    expect(plan.find(field => field.key === 'salePrice')?.value).toBe('485000');
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  });

  it('sends only the URLA when the optional contract is absent', async () => {
    const { salesContract: _contract, ...documents } = payload();
    await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal);
    expect(requests).toHaveLength(1);
    const parts = requests[0]!.body.contents.flatMap(content => content.parts);
    expect(parts.filter(part => part.inlineData)).toEqual([
      { inlineData: { mimeType: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
    ]);
    const sourceMarker = parts[parts.findIndex(part => part.inlineData) - 1]?.text;
    expect(sourceMarker).toContain('urla.pdf');
    expect(sourceMarker).not.toContain('sales-contract.pdf');
  });

  it('sends no request when the caller cancels before extraction starts', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('Synthetic caller cancellation', 'AbortError'));
    const documents = payload();
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), controller.signal)).rejects.toThrow();
    expect(requests).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('propagates in-flight caller cancellation to the actual Google transport without retrying', async () => {
    let markStarted!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    let transportAborted = false;
    respond = () => new Promise<Response>((_resolve, reject) => {
      const transportSignal = requests.at(-1)!.signal;
      transportSignal.addEventListener('abort', () => {
        transportAborted = true;
        reject(transportSignal.reason);
      }, { once: true });
      markStarted();
    });
    const controller = new AbortController();
    const documents = payload();
    const result = extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), controller.signal);
    const rejected = expect(result).rejects.toThrow();
    await started;
    expect(requests).toHaveLength(1);
    expect(requests[0]!.signal.aborted).toBe(false);
    controller.abort(new DOMException('Synthetic caller cancellation', 'AbortError'));
    await rejected;
    expect(transportAborted).toBe(true);
    expect(requests[0]!.signal.aborted).toBe(true);
    expect(requests).toHaveLength(1);
  });

  it.each([
    { name: 'zero sale price', data: { ...extracted, salePrice: 0 } },
    { name: 'missing required contact property', data: { ...extracted, listingAgent: { email: 'listing@example.test' } } },
    { name: 'invalid classification', data: { ...extracted, loanProgram: 'Invalid' } },
    { name: 'invalid evidence source', data: { ...extracted, evidence: [{ field: 'salePrice', document: 'unknown', page: 1, quote: 'Synthetic' }] } },
  ])('locally rejects $name despite a successful native JSON response', async ({ data }) => {
    respond = () => Response.json(googleResponse([{ text: JSON.stringify(data) }]));
    const documents = payload();
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal)).rejects.toThrow();
    expect(requests).toHaveLength(1);
  });

  it('retries an explicitly unsupported native schema once with a tool schema on the same provider/model/key', async () => {
    const documents = payload('custom-supported-model');
    respond = (_body, index) => index === 1
      ? Response.json({ error: { code: 400, status: 'INVALID_ARGUMENT', message: 'responseJsonSchema is not supported with this model' } }, { status: 400 })
      : Response.json(googleResponse([{ functionCall: { name: 'appraisal_document_data', args: extracted }, thoughtSignature: 'c3ludGhldGljLWV4dHJhY3Q=' }]));
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal);
    expect(result).toEqual(extracted);
    expect(requests).toHaveLength(2);
    expect(new Set(requests.map(request => request.url)).size).toBe(1);
    expect(requests.every(request => request.keyMatches && request.authorization === null)).toBe(true);
    expect(requests[0]!.body.generationConfig?.responseJsonSchema).toBeDefined();
    expect(requests[1]!.body.generationConfig?.responseJsonSchema).toBeUndefined();
    const functions = requests[1]!.body.tools?.flatMap(tool => tool.functionDeclarations ?? []);
    expect(functions?.map(fn => fn.name)).toEqual(['appraisal_document_data']);
    expect(functions?.[0]?.parameters.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    expect(functions?.[0]?.parameters.properties?.borrower?.properties?.firstName).toMatchObject({ type: 'string', nullable: true });
    expect(requests[1]!.body.toolConfig?.functionCallingConfig).toMatchObject({ mode: 'ANY', allowedFunctionNames: ['appraisal_document_data'] });
  });

  it.each([
    { status: 400, message: 'Invalid schema: too many nested fields in responseJsonSchema' },
    { status: 400, message: 'Billing is not enabled for this project.' },
    { status: 401, message: 'Invalid API key.' },
    { status: 403, message: 'Permission denied for this model.' },
    { status: 404, message: 'Requested model was not found.' },
    { status: 422, message: 'responseJsonSchema is not supported with this model' },
  ])('does not retry output formats or reroute after HTTP $status: $message', async ({ status, message }) => {
    respond = () => Response.json({ error: { code: status, status: 'INVALID_ARGUMENT', message } }, { status });
    const documents = payload('selected-custom-model');
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'google'), new AbortController().signal)).rejects.toThrow();
    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/selected-custom-model:generateContent');
    expect(requests[0]!.keyMatches).toBe(true);
    expect(requests[0]!.body.tools).toBeUndefined();
  });

  it('preserves real screenshot image parts and both thought signatures across bounded agent tool steps', async () => {
    const documents = payload();
    const imageContent = [
      { type: 'text', text: 'Synthetic order page only.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    ];
    const originalContent = structuredClone(imageContent);
    const screenshot = tool(async () => imageContent, { name: 'screenshot_page', description: 'Read a synthetic page image.', schema: z.object({}) });
    const signatureA = 'c3ludGhldGljLXNpZ25hdHVyZS1h';
    const signatureB = 'c3ludGhldGljLXNpZ25hdHVyZS1i';
    respond = (_body, index) => Response.json(googleResponse(index === 1
      ? [{ functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA }]
      : index === 2 ? [{ functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB }]
        : [{ text: 'Ready for human review.' }]));
    await prepareOrderWithAgent({ provider: 'google', model: createModel(documents.input.apiKey, documents.input.model, 'google'),
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      session: { tools: [screenshot] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    expect(requests).toHaveLength(3);
    expect(requests.every(request => request.keyMatches && request.url === requests[0]!.url)).toBe(true);
    expect(imageContent).toEqual(originalContent);
    const secondParts = requests[1]!.body.contents.flatMap(content => content.parts);
    expect(secondParts.filter(part => part.inlineData)).toEqual([{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }]);
    const result = secondParts.find(part => part.functionResponse?.name === 'screenshot_page')?.functionResponse;
    expect(result?.response.result).toEqual([{ type: 'text', text: 'Synthetic order page only.' }]);
    expect(JSON.stringify(result)).not.toContain('iVBORw0KGgo=');
    const signedCalls = requests[2]!.body.contents.filter(content => content.role === 'model')
      .flatMap(content => content.parts).filter(part => part.functionCall);
    expect(signedCalls).toEqual([
      { functionCall: { id: 'synthetic_screenshot', name: 'screenshot_page', args: {} }, thoughtSignature: signatureA },
      { functionCall: { id: 'synthetic_plan', name: 'get_order_field_plan', args: {} }, thoughtSignature: signatureB },
    ]);
    expect(requests[2]!.body.tools?.flatMap(tool => tool.functionDeclarations ?? []).map(fn => fn.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
    expect(requests[2]!.body.systemInstruction?.parts.map(part => part.text).join('\n')).toContain('Do not submit');
  });
});
