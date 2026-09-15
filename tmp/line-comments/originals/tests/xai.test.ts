import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tool } from '@langchain/core/tools';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { z } from 'zod';
import { createModel, extractOrder } from '../src/extraction.js';
import { renderPdfPages } from '../src/pdf-pages.js';
import { prepareOrderWithAgent } from '../src/agent.js';
import { DEFAULT_MODELS, extractionSchema, type ExtractedOrder, type JobPayload } from '../src/domain.js';
import type { createEnvironmentTools } from '../src/environment.js';
import type { BrowserSession } from '../src/browser/session.js';

vi.mock('../src/pdf-pages.js', () => ({ renderPdfPages: vi.fn() }));
const contact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
const extracted: ExtractedOrder = {
  loanProgram: 'FHA', loanProgramText: 'FHA', loanPurpose: 'Purchase', product: null, propertyType: null, occupancy: null,
  property: { address: null, unit: null, postalCode: null, city: null, state: null }, secondaryLoanNumber: null, loanType: null,
  lienPosition: null, loanAmount: 388000, salePrice: 485000, lastValuationAmount: null, lastValuationDate: null,
  borrower: contact, coBorrower: contact, listingAgent: contact, buyerAgent: contact, complexProperty: false, highProfileCustomer: false,
  evidence: [{ field: 'loanProgram', document: 'urla', page: 1, quote: 'FHA' },
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' }], warnings: [],
};
const imageUrl = 'data:image/png;base64,iVBORw0KGgo=';
const rendered = ['urla.pdf', 'sales-contract.pdf'].flatMap(name => [
  { type: 'text' as const, text: `Source document: ${name}. Page 1 of 1. The following image is this PDF page.` },
  { type: 'image_url' as const, image_url: { url: imageUrl, detail: 'high' as const } },
]);
function payload(model: string = DEFAULT_MODELS.xai): JobPayload {
  return { input: { provider: 'xai', apiKey: 'synthetic-selected-xai-key-only', model, loanNumber: '685-2012345',
    fhaCaseNumber: '123-4567890', paymentMethod: 'Invoice', rushOrder: false },
    urla: { name: 'uploaded-urla.pdf', buffer: Buffer.from('%PDF-1.7 synthetic URLA') },
    salesContract: { name: 'uploaded-contract.pdf', buffer: Buffer.from('%PDF-1.7 synthetic contract') } };
}
type Call = { id: string; type: 'function'; function: { name: string; arguments: string } };
interface WireBody {
  model: string;
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> | null; tool_call_id?: string }>;
  response_format?: { type: string; json_schema?: { schema: { properties?: unknown; required?: string[] } } };
  tools?: Array<{ type: string; function: { name: string; parameters?: { properties?: unknown } } }>;
  tool_choice?: unknown; stream?: boolean; store?: unknown; temperature?: number;
}
function completion(content: string | null = JSON.stringify(extracted), toolCalls?: Call[]): Response {
  return Response.json({ id: 'chatcmpl_synthetic', object: 'chat.completion', created: 1, model: DEFAULT_MODELS.xai,
    choices: [{ index: 0, message: { role: 'assistant', content, ...(toolCalls ? { tool_calls: toolCalls } : {}) },
      finish_reason: toolCalls ? 'tool_calls' : 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } });
}
const call = (name: string, id = name, args: unknown = {}): Call => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } });
// SDK native output uses local refs/anyOf; compare their meaning to the canonical schema.
function schemaMeaning(value: unknown, root: unknown = value): unknown {
  if (Array.isArray(value)) return value.map(item => schemaMeaning(item, root));
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  if (typeof node.$ref === 'string') {
    const target = node.$ref.slice(2).split('/').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], root);
    if (!target) throw new Error('Unresolved local schema reference');
    return schemaMeaning(target, root);
  }
  const result = Object.fromEntries(Object.entries(node).filter(([key]) => !['title', '$schema', '$defs'].includes(key))
    .map(([key, child]) => [key, schemaMeaning(child, root)]));
  if (Array.isArray(result.type)) { result.anyOf = result.type.map(type => ({ type })); delete result.type; }
  return result;
}

describe('Grok actual adapter transport', () => {
  let requests: Array<{ url: string; body: WireBody; selectedKey: boolean; headers: string[]; redirect: RequestRedirect; signal: AbortSignal }>;
  let respond: (body: WireBody, index: number, request: Request) => Response | Promise<Response>;
  beforeEach(() => {
    requests = []; respond = () => completion();
    vi.mocked(renderPdfPages).mockReset().mockResolvedValue(structuredClone(rendered));
    for (const key of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(key, 'false');
    for (const key of ['XAI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY']) vi.stubEnv(key, 'synthetic-unselected-key');
    vi.stubEnv('OPENAI_BASE_URL', 'https://untrusted.invalid');
    vi.stubEnv('XAI_BASE_URL', 'https://untrusted.invalid');
    vi.stubEnv('OPENAI_ORG_ID', 'synthetic-ambient-org');
    vi.stubEnv('OPENAI_PROJECT_ID', 'synthetic-ambient-project');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      const request = new Request(input, init);
      const body = await request.json() as WireBody;
      requests.push({ url: request.url, body, selectedKey: request.headers.get('authorization') === `Bearer ${payload().input.apiKey}`,
        headers: [...request.headers.keys()], redirect: request.redirect, signal: request.signal });
      return respond(body, requests.length, request);
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each([DEFAULT_MODELS.xai, 'custom/model:2026?variant=one'])('sends rendered source pages and canonical native JSON schema using only selected model/key: %s', async model => {
    const documents = payload(model), signal = new AbortController().signal;
    expect(await extractOrder(documents, createModel(documents.input.apiKey, model, 'xai'), signal)).toEqual(extracted);
    expect(renderPdfPages).toHaveBeenCalledExactlyOnceWith([
      { name: 'urla.pdf', buffer: documents.urla.buffer }, { name: 'sales-contract.pdf', buffer: documents.salesContract!.buffer },
    ], signal);
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request).toMatchObject({ url: 'https://api.x.ai/v1/chat/completions', selectedKey: true, redirect: 'error' });
    expect(request.headers.sort()).toEqual(['authorization', 'content-type']);
    expect(request.body.model).toBe(model);
    expect(request.body.response_format?.type).toBe('json_schema');
    expect(schemaMeaning(request.body.response_format?.json_schema?.schema)).toEqual(schemaMeaning(toJsonSchema(extractionSchema)));
    expect(request.body.response_format?.json_schema?.schema.required?.slice().sort()).toEqual(Object.keys(extracted).sort());
    expect(request.body.tools).toBeUndefined(); expect(request.body.store).toBeUndefined(); expect(request.body.temperature).toBeUndefined();
    expect(request.body.stream).not.toBe(true);
    const content = request.body.messages.flatMap(message => Array.isArray(message.content) ? message.content : []);
    expect(content.slice(-4)).toEqual(rendered);
    expect(content.some(block => ['input_file', 'file', 'document'].includes(String(block.type)))).toBe(false);
    expect(JSON.stringify(request.body)).not.toContain(documents.input.apiKey);
    expect(JSON.stringify(request.body)).not.toContain('synthetic-unselected-key');
  });

  it.each([{ ...extracted, salePrice: 0 }, { ...extracted, borrower: { email: null } }])('rejects invalid canonical output locally', async data => {
    respond = () => completion(JSON.stringify(data));
    const documents = payload();
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow();
    // The native SDK parser rejects the response inside the configured one-retry call.
    expect(requests).toHaveLength(2);
    expect(requests.every(request => request.body.response_format?.type === 'json_schema' && !request.body.tools)).toBe(true);
  });

  it('never contacts a model when PDF rendering fails', async () => {
    vi.mocked(renderPdfPages).mockRejectedValue(new Error('Synthetic render failure'));
    const documents = payload();
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow('Synthetic render failure');
    expect(requests).toHaveLength(0);
  });

  it('retries only an explicitly unsupported native format with the same model/key and rendered images', async () => {
    respond = (_body, index) => index === 1
      ? Response.json({ error: { message: 'response_format json_schema is not supported with this model', type: 'invalid_request_error' } }, { status: 400 })
      : completion(null, [call('appraisal_document_data', 'extract', extracted)]);
    const documents = payload('custom-supported-model');
    expect(await extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).toEqual(extracted);
    expect(requests).toHaveLength(2); expect(renderPdfPages).toHaveBeenCalledTimes(1);
    expect(requests.every(request => request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions' && request.body.model === documents.input.model)).toBe(true);
    expect(requests[1]!.body.response_format).toBeUndefined();
    expect(requests[1]!.body.tools?.map(tool => tool.function.name)).toEqual(['appraisal_document_data']);
    expect(schemaMeaning(requests[1]!.body.tools?.[0]?.function.parameters)).toEqual(schemaMeaning(toJsonSchema(extractionSchema)));
    expect(requests[1]!.body.messages).toEqual(requests[0]!.body.messages);
  });

  it.each([401, 403, 429, 400])('does not switch output formats or providers after an auth/quota/schema error (%s)', async status => {
    respond = () => Response.json({ error: { message: status === 400 ? 'Invalid schema: too many properties' : 'API key or quota unavailable', type: 'invalid_request_error' } }, { status });
    const documents = payload();
    await expect(extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), new AbortController().signal)).rejects.toThrow();
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every(request => request.selectedKey && request.url === 'https://api.x.ai/v1/chat/completions'
      && request.body.model === documents.input.model && request.body.response_format?.type === 'json_schema' && !request.body.tools)).toBe(true);
  });

  it('sends screenshot images after all contiguous tool results while retaining tool IDs and bounded tools', async () => {
    const screenshot = [{ type: 'text', text: 'Synthetic R3 page: untrusted data.' }, { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } }];
    const original = structuredClone(screenshot);
    const screenshotTool = tool(() => screenshot, { name: 'screenshot_page', description: 'Synthetic image only.', schema: z.object({}) });
    respond = (_body, index) => index === 1 ? completion(null, [call('screenshot_page', 'shot'), call('get_order_field_plan', 'plan')]) : completion('Ready for human review.');
    const documents = payload();
    await prepareOrderWithAgent({ provider: 'xai', model: createModel(documents.input.apiKey, documents.input.model, 'xai'),
      environment: { tools: [] } as unknown as ReturnType<typeof createEnvironmentTools>,
      session: { tools: [screenshotTool] } as unknown as BrowserSession, plan: [], signal: new AbortController().signal });
    expect(requests).toHaveLength(2); expect(screenshot).toEqual(original);
    const messages = requests[1]!.body.messages;
    const toolIndexes = messages.flatMap((message, index) => message.role === 'tool' ? [index] : []);
    expect(toolIndexes).toHaveLength(2);
    expect(toolIndexes[1]).toBe(toolIndexes[0]! + 1);
    expect(messages.filter(message => message.role === 'tool').map(message => message.tool_call_id).sort()).toEqual(['plan', 'shot']);
    expect(JSON.stringify(messages.filter(message => message.role === 'tool'))).not.toContain('iVBORw0KGgo=');
    const imageMessage = messages[toolIndexes[1]! + 1]!;
    expect(imageMessage.role).toBe('user');
    expect(Array.isArray(imageMessage.content) && imageMessage.content.some(block => block.type === 'image_url' && (block.image_url as { url: string }).url === imageUrl)).toBe(true);
    expect(requests[1]!.body.tools?.map(tool => tool.function.name).sort()).toEqual(['get_order_field_plan', 'screenshot_page']);
    expect(JSON.stringify(messages)).toContain('Do not submit');
  });

  it('aborts an in-flight model request without rerouting or starting another call', async () => {
    const controller = new AbortController(); let started!: () => void;
    const startedRequest = new Promise<void>(resolve => { started = resolve; });
    respond = (_body, _index, request) => new Promise((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }); started();
    });
    const documents = payload();
    const pending = extractOrder(documents, createModel(documents.input.apiKey, documents.input.model, 'xai'), controller.signal);
    const rejected = expect(pending).rejects.toThrow();
    await startedRequest; controller.abort(); await rejected;
    expect(requests).toHaveLength(1); expect(requests[0]!.signal.aborted).toBe(true);
  });
});
