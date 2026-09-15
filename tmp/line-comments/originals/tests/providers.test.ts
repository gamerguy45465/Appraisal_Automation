import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { APIConnectionTimeoutError } from '@anthropic-ai/sdk';
import { createModel, extractOrder } from '../src/extraction.js';
import { prepareOrderWithAgent } from '../src/agent.js';
import { DEFAULT_MODELS, buildFieldPlan, type AiProvider, type ExtractedOrder, type JobPayload } from '../src/domain.js';
import { publicError } from '../src/errors.js';
import { APPRAISAL_PRODUCT_INSTRUCTIONS, SYSTEM_PROMPT } from '../src/system-prompt.js';
import type { createEnvironmentTools } from '../src/environment.js';
import type { BrowserSession } from '../src/browser/session.js';

const contact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
const extracted: ExtractedOrder = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  product: null, propertyType: 'Single Family', occupancy: 'Primary Residence',
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000,
  salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  borrower: contact, coBorrower: contact, listingAgent: { ...contact, firstName: 'Avery', lastName: 'Ellis', email: 'listing@example.test' }, buyerAgent: contact,
  complexProperty: false, highProfileCustomer: false,
  evidence: [
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase price $485,000' },
  ], warnings: [],
};
function payload(provider: AiProvider, model: string = DEFAULT_MODELS[provider]): JobPayload {
  return { input: { provider, model, apiKey: 'sk-synthetic-provider-key-only', loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'sample.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    salesContract: { name: 'purchase.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
}

// Synthetic Anthropic responses use the transport sentinel only for nullable text.
function anthropicWireResult(value: unknown, key = ''): unknown {
  if (value === null && !['loanAmount', 'salePrice', 'lastValuationAmount'].includes(key)) return '';
  if (Array.isArray(value)) return value.map(item => anthropicWireResult(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, anthropicWireResult(child, childKey)]));
  return value;
}
function unionCount(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((count, item) => count + unionCount(item), 0);
  if (!value || typeof value !== 'object') return 0;
  const node = value as Record<string, unknown>;
  return Number(Array.isArray(node.anyOf) || Array.isArray(node.type)) + Object.values(node).reduce<number>((count, child) => count + unionCount(child), 0);
}
interface WireBody {
  model: string;
  messages?: Array<{ role: string; content: Array<Record<string, unknown>> }>;
  input?: Array<Record<string, unknown>>;
  tools?: Array<{ name: string; input_schema?: { required: string[] }; function?: unknown }>;
  tool_choice?: unknown;
  output_config?: { format?: { type: string; schema: unknown } };
  text?: { format?: { type: string } };
  store?: boolean;
  temperature?: number;
  thinking?: unknown;
}
function anthropicResponse(content: Array<Record<string, unknown>> = [{ type: 'text', text: JSON.stringify(anthropicWireResult(extracted)) }], stop = 'end_turn') {
  return { id: 'msg_synthetic', type: 'message', role: 'assistant', model: 'claude-opus-5', content,
    stop_reason: stop, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } };
}
function openaiResponse(output: Array<Record<string, unknown>> = [{ id: 'msg_synthetic', type: 'message', role: 'assistant', status: 'completed',
  content: [{ type: 'output_text', text: JSON.stringify(extracted), annotations: [] }] }]) {
  return { id: 'resp_synthetic', object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODELS.openai, output,
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } } };
}

describe('selected-provider transport and preparation', () => {
  let requests: Array<{ url: string; body: WireBody; keyMatches: boolean }>;
  let respond: (body: WireBody, index: number) => Response;
  beforeEach(() => {
    requests = [];
    respond = () => Response.json(anthropicResponse());
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    // These must not redirect documents or replace the explicitly selected key.
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://untrusted.invalid');
    vi.stubEnv('ANTHROPIC_API_URL', 'https://untrusted.invalid');
    vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.invalid');
    vi.stubEnv('ANTHROPIC_API_KEY', 'synthetic-unselected-key');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-unselected-key');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      const request = new Request(input, init);
      const body = await request.json() as WireBody;
      const selectedKey = payload('anthropic').input.apiKey;
      requests.push({ url: request.url, body, keyMatches: request.headers.get('x-api-key') === selectedKey || request.headers.get('authorization') === `Bearer ${selectedKey}` });
      if (request.url === 'https://api.anthropic.com/v1/messages' && unionCount(body.output_config?.format?.schema) > 16) {
        return Response.json({ error: { type: 'invalid_request_error', message: 'Schema is too complex for compilation.' } }, { status: 400 });
      }
      return respond(body, requests.length);
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001', 'custom-model:future'])('sends native PDFs and validated structured extraction with Anthropic model %s', async modelId => {
    const documents = payload('anthropic', modelId);
    const result = await extractOrder(documents, createModel(documents.input.apiKey, modelId, 'anthropic'), new AbortController().signal);
    expect(result).toEqual(extracted);
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request.url).toBe('https://api.anthropic.com/v1/messages');
    expect(request.keyMatches).toBe(true);
    expect(request.body.model).toBe(modelId);
    expect(request.body.output_config?.format).toMatchObject({ type: 'json_schema' });
    expect(unionCount(request.body.output_config?.format?.schema)).toBe(3);
    expect(request.body.tool_choice).toBeUndefined();
    expect(request.body.store).toBeUndefined();
    expect(request.body.temperature).toBeUndefined();
    expect(request.body.thinking).toBeUndefined();
    const instructions = request.body.messages!.flatMap(message => message.content).filter(block => block.type === 'text').map(block => String(block.text)).join('\n');
    expect(instructions).toContain('encode unavailable or uncertain nullable text fields as empty strings');
    expect(instructions).toContain('Keep unavailable numeric amounts null');
    expect(instructions).toContain('keep missing fields an empty string');
    expect(instructions).toContain('leave that value as an empty string');
    expect(instructions).not.toContain('keep missing fields null');
    expect(instructions).not.toContain('Use null for unavailable values');
    const files = request.body.messages!.flatMap(message => message.content).filter(block => block.type === 'document');
    expect(files).toEqual([
      { type: 'document', title: 'urla.pdf', source: { type: 'base64', media_type: 'application/pdf', data: documents.urla.buffer.toString('base64') } },
      { type: 'document', title: 'sales-contract.pdf', source: { type: 'base64', media_type: 'application/pdf', data: documents.salesContract!.buffer.toString('base64') } },
    ]);
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    const { plan } = buildFieldPlan(result, documents.input, true);
    expect(plan.find(field => field.key === 'salePrice')?.value).toBe('485000');
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('Avery');
  });

  it('sends only the required URLA to Anthropic when no contract is supplied', async () => {
    const documents = payload('anthropic');
    delete (documents as { salesContract?: unknown }).salesContract;
    await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal);
    expect(requests[0]!.body.messages!.flatMap(message => message.content).filter(block => block.type === 'document')).toHaveLength(1);
  });

  it.each(['openai', 'anthropic'] as const)('carries an FHA product recommendation through %s without inventing a property classification', async provider => {
    const documents = payload(provider);
    documents.input.fhaCaseNumber = '123-4567890';
    const recommendation: ExtractedOrder = { ...extracted, loanProgram: 'FHA', loanProgramText: 'FHA 203(b)',
      product: '1004 SFR FHA', propertyType: null, occupancy: null,
      evidence: [
        { field: 'loanProgram', document: 'urla', page: 1, quote: 'FHA 203(b)' },
        { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
        { field: 'productRecommendation', document: 'urla', page: 2, quote: 'Number of Units: 1; Manufactured Home: No' },
        { field: 'productRecommendation', document: 'salesContract', page: 3, quote: 'Not applicable — site-built residence' },
      ], warnings: [] };
    respond = () => provider === 'anthropic'
      ? Response.json(anthropicResponse([{ type: 'text', text: JSON.stringify(anthropicWireResult(recommendation)) }]))
      : Response.json(openaiResponse([{ id: 'msg_recommendation', type: 'message', role: 'assistant', status: 'completed',
        content: [{ type: 'output_text', text: JSON.stringify(recommendation), annotations: [] }] }]));
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal);
    expect(result).toEqual(recommendation);
    expect(requests).toHaveLength(1);
    const body = requests[0]!.body;
    const blocks = provider === 'anthropic' ? body.messages!.flatMap(message => message.content)
      : body.input!.flatMap(message => Array.isArray(message.content) ? message.content as Array<Record<string, unknown>> : []);
    const instructions = blocks.filter(block => ['text', 'input_text'].includes(String(block.type))).map(block => String(block.text)).join('\n');
    expect(instructions).toContain(APPRAISAL_PRODUCT_INSTRUCTIONS);
    expect(SYSTEM_PROMPT).toContain(APPRAISAL_PRODUCT_INSTRUCTIONS);
    expect(instructions).not.toContain('never infer an appraisal product from property type');
    expect(instructions).toContain('One unit, detached alone, PUD membership, or primary-residence occupancy does not establish Single Family');
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(result, documents.input, true);
    expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR FHA', allowedLabels: ['1004 SFR - FHA'], required: true });
    expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(true);
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['propertyType', 'occupancy']));
    expect(missingRequiredFields).not.toContain('product');
    expect(plan.some(field => ['propertyType', 'occupancy'].includes(field.key))).toBe(false);
  });

  it.each(['openai', 'anthropic'] as const)('uses a tool schema on %s only after native output is explicitly unsupported, retaining provider and model', async provider => {
    const documents = payload(provider, 'custom-supported-model');
    respond = (_body, index) => {
      if (index === 1) return Response.json({ error: { type: 'invalid_request_error', message: provider === 'openai'
        ? 'response_format json_schema is not supported with this model' : 'output_config.format is not supported with this model' } }, { status: 400 });
      return provider === 'anthropic'
        ? Response.json(anthropicResponse([{ type: 'tool_use', id: 'toolu_extract', name: 'appraisal_document_data', input: anthropicWireResult(extracted) }], 'tool_use'))
        : Response.json(openaiResponse([{ type: 'function_call', id: 'fc_extract', call_id: 'call_extract', name: 'appraisal_document_data', arguments: JSON.stringify(extracted), status: 'completed' }]));
    };
    const result = await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal);
    expect(result).toEqual(extracted);
    expect(requests).toHaveLength(2);
    expect(new Set(requests.map(request => request.url)).size).toBe(1);
    expect(requests.every(request => request.keyMatches && request.body.model === documents.input.model)).toBe(true);
    expect(requests[1]!.body.tools?.some(candidate => candidate.name === 'appraisal_document_data')).toBe(true);
  });

  it.each(['openai', 'anthropic'] as const)('never switches provider/model on %s authentication or model-access failures', async provider => {
    const documents = payload(provider);
    for (const status of [401, 404]) {
      requests = [];
      respond = () => Response.json({ error: { type: 'authentication_error', message: 'Synthetic private detail' } }, { status });
      await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, provider), new AbortController().signal)).rejects.toMatchObject({ status });
      expect(requests).toHaveLength(1);
      expect(requests[0]!.body.model).toBe(documents.input.model);
    }
  });

  it.each([
    { caseName: 'zero sale price', data: { ...extracted, salePrice: 0 } },
    { caseName: 'missing required contact name', data: { ...extracted, listingAgent: { email: 'listing@example.test' } } },
    { caseName: 'invalid classification', data: { ...extracted, loanProgram: 'Invalid' } },
    { caseName: 'invalid evidence source', data: { ...extracted, evidence: [{ field: 'salePrice', document: 'unknown', page: 1, quote: 'Synthetic' }] } },
  ])('rejects malformed Anthropic $caseName before browser planning', async ({ data }) => {
    respond = () => Response.json(anthropicResponse([{ type: 'text', text: JSON.stringify(anthropicWireResult(data)) }]));
    const documents = payload('anthropic');
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal)).rejects.toThrow();
    expect(requests).toHaveLength(1);
  });

  it.each([
    'Your credit balance is too low to access the Anthropic API.',
    'Schema is too complex for compilation.',
  ])('does not retry output formats after an Anthropic 400 rejection: %s', async message => {
    respond = () => Response.json({ error: { type: 'invalid_request_error', message } }, { status: 400 });
    const documents = payload('anthropic');
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'anthropic'), new AbortController().signal)).rejects.toMatchObject({ status: 400 });
    expect(requests).toHaveLength(1);
    expect(requests[0]!.body.model).toBe(documents.input.model);
    expect(requests[0]!.keyMatches).toBe(true);
  });

  it.each(['openai', 'anthropic'] as const)('runs the bounded %s preparation agent with screenshot tool results as images', async provider => {
    const documents = payload(provider);
    const screenshot = tool(async () => [
      { type: 'text', text: 'Synthetic order page only.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    ], { name: 'screenshot_page', description: 'Read a synthetic page image.', schema: z.object({}) });
    respond = (_body, index) => provider === 'anthropic'
      ? Response.json(index === 1 ? anthropicResponse([{ type: 'tool_use', id: 'toolu_image', name: 'screenshot_page', input: {} }], 'tool_use')
        : anthropicResponse([{ type: 'text', text: 'Ready for human review.' }]))
      : Response.json(index === 1 ? openaiResponse([{ type: 'function_call', id: 'fc_image', call_id: 'call_image', name: 'screenshot_page', arguments: '{}', status: 'completed' }])
        : openaiResponse());
    await prepareOrderWithAgent({ provider, model: createModel(documents.input.apiKey, documents.input.model, provider),
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      session: { tools: [screenshot] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    expect(requests).toHaveLength(2);
    expect(requests.every(request => request.keyMatches && request.body.model === documents.input.model)).toBe(true);
    const final = requests[1]!.body;
    if (provider === 'anthropic') {
      const result = final.messages!.flatMap(message => message.content).find(block => block.type === 'tool_result');
      expect(result?.content).toEqual([
        { type: 'text', text: 'Synthetic order page only.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } },
      ]);
    } else {
      const result = final.input!.find(block => block.type === 'function_call_output');
      expect(result?.output).toEqual([
        { type: 'input_text', text: 'Synthetic order page only.' },
        { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' },
      ]);
    }
    expect(final.tools?.map(candidate => candidate.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
  });

  it.each(['openai', 'anthropic'] as const)('returns safe actionable %s errors without raw provider responses', provider => {
    const label = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
    for (const status of [400, 401, 403, 404, 413, 422, 429, 503, 529]) {
      const error = publicError({ status, message: 'PRIVATE_DOCUMENT_AND_KEY_CONTENT' }, provider);
      expect(error.message).toContain(label);
      expect(error.message).not.toContain('PRIVATE_DOCUMENT_AND_KEY_CONTENT');
    }
  });

  it('classifies the Anthropic SDK transport timeout without exposing its raw details', () => {
    const error = publicError(new APIConnectionTimeoutError({ message: 'PRIVATE_TRANSPORT_DETAIL' }), 'anthropic');
    expect(error.code).toBe('TIMEOUT');
    expect(error.statusCode).toBe(504);
    expect(error.message).not.toContain('PRIVATE_TRANSPORT_DETAIL');
  });
});
