import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { createModel, extractOrder } from '../src/extraction.js';
import { buildFieldPlan, DEFAULT_MODEL, type ExtractedOrder, type JobPayload } from '../src/domain.js';
import { SYSTEM_PROMPT } from '../src/system-prompt.js';
import { toProviderMessages } from '../src/model-messages.js';

const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
const extracted: ExtractedOrder = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase',
  product: null, propertyType: null, occupancy: null,
  property: { address: null, unit: null, postalCode: null, city: null, state: null },
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: null,
  salePrice: null, lastValuationAmount: null, lastValuationDate: null,
  borrower: emptyContact, coBorrower: emptyContact, listingAgent: emptyContact, buyerAgent: emptyContact,
  complexProperty: false, highProfileCustomer: false,
  evidence: [
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' },
    { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
  ], warnings: [],
};
const payload: JobPayload = {
  input: { provider: 'openai', apiKey: 'sk-synthetic-test-key-only',
    loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL },
  urla: { name: 'urla.pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic URLA\n%%EOF') },
  salesContract: { name: 'sales-contract.pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic contract\n%%EOF') },
};
interface WireBody {
  model: string;
  store?: boolean;
  temperature?: number;
  input: Array<{ type: string; content?: Array<Record<string, unknown>>; output?: unknown }>;
  text?: { format?: { type?: string; strict?: boolean; schema?: { properties?: Record<string, unknown>; required?: string[] } } };
}

/** Responses API fixture: completed assistant message with structured JSON text. */
function completedResponse(data: ExtractedOrder = extracted) {
  return {
    id: 'resp_synthetic', object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODEL,
    output: [{ id: 'msg_synthetic', type: 'message', status: 'completed', role: 'assistant',
      content: [{ type: 'output_text', text: JSON.stringify(data), annotations: [] }] }],
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20,
      input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
  };
}

describe('OpenAI Responses wire compatibility', () => {
  let requests: Array<{ url: string; body: WireBody }>;
  let responseData: ExtractedOrder;
  beforeEach(() => {
    requests = [];
    responseData = extracted;
    vi.stubEnv('LANGSMITH_TRACING', 'false');
    vi.stubEnv('LANGCHAIN_TRACING_V2', 'false');
    vi.stubEnv('LANGCHAIN_TRACING', 'false');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      const request = new Request(input, init);
      requests.push({ url: request.url, body: await request.json() as WireBody });
      return Response.json(completedResponse(responseData));
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('sends both PDFs as actual file inputs and receives strict structured output without a network call', async () => {
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    expect(result).toEqual(extracted);
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request.url).toBe('https://api.openai.com/v1/responses');
    expect(request.body.model).toBe(DEFAULT_MODEL);
    expect(request.body.store).toBe(false);
    expect(request.body.temperature).toBeUndefined();
    expect(request.body.text?.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(request.body.text?.format?.schema?.required).toContain('buyerAgent');
    expect(request.body.text?.format?.schema?.properties).toHaveProperty('buyerAgent');
    const files = request.body.input.flatMap(item => item.content ?? []).filter(item => item.type === 'input_file');
    expect(files).toEqual([
      { type: 'input_file', filename: 'urla.pdf', file_data: `data:application/pdf;base64,${payload.urla.buffer.toString('base64')}` },
      { type: 'input_file', filename: 'sales-contract.pdf', file_data: `data:application/pdf;base64,${payload.salesContract!.buffer.toString('base64')}` },
    ]);
    const bodyText = JSON.stringify(request.body);
    expect(bodyText).not.toContain(payload.input.apiKey);
  });

  it('sends only the URLA when no sales contract is supplied', async () => {
    await extractOrder({ input: payload.input, urla: payload.urla }, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    const files = requests[0]!.body.input.flatMap(item => item.content ?? []).filter(item => item.type === 'input_file');
    expect(files).toHaveLength(1);
    expect(files[0]!.filename).toBe('urla.pdf');
  });

  it('sends explicit seller versus selling-agent rules to extraction and preserves them for preparation', async () => {
    await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    const instructions = requests[0]!.body.input.flatMap(item => item.content ?? [])
      .filter(item => item.type === 'input_text').map(item => String(item.text)).join('\n');
    for (const prompt of [instructions, SYSTEM_PROMPT]) {
      expect(prompt).toContain('"listing agent", "seller\'s agent", "seller agent" and "seller representative" as listingAgent');
      expect(prompt).toContain('"buyer\'s agent", "buyer agent", "buying agent", "selling agent" and "cooperating agent" as buyerAgent only when the document explicitly establishes representation of the buyer');
      expect(prompt).toContain('"Seller\'s agent" and "selling agent" are different labels');
      expect(prompt).toContain('Purchase access uses listingAgent (the seller\'s agent); refinance access uses borrower');
      expect(prompt).toContain('If a role is unclear, leave the agent role/details unknown and flag it for review');
      expect(prompt).toContain('human review and submission remain mandatory');
    }
  });

  it('carries an unsigned sample contract purchase price through Responses extraction into the required sale-price plan', async () => {
    const documentWarning = 'Unsigned sample contract: confirm the final purchase price before submitting.';
    const priceEvidence = { field: 'salePrice', document: 'salesContract' as const, page: 1, quote: 'Purchase Price: $485,000.00' };
    responseData = { ...extracted, salePrice: 485000, loanAmount: 388000,
      evidence: [...extracted.evidence, priceEvidence], warnings: [documentWarning] };
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    const instructions = requests[0]!.body.input.flatMap(item => item.content ?? [])
      .filter(item => item.type === 'input_text').map(item => String(item.text)).join('\n');
    // This checks the instructions actually sent, not merely an exported prompt constant.
    for (const prompt of [instructions, SYSTEM_PROMPT]) {
      expect(prompt).not.toMatch(/Use the signed contract for sale price/i);
      expect(prompt).toMatch(/\bunsigned\b/i);
      expect(prompt).toMatch(/\bsample\b/i);
      expect(prompt).toMatch(/\bdraft\b/i);
      expect(prompt).toMatch(/\bsalePrice\b/);
    }
    expect(result.salePrice).toBe(485000);
    expect(result.loanAmount).toBe(388000);
    expect(result.evidence).toContainEqual(priceEvidence);
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(result, payload.input, true);
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '485000', kind: 'text', required: true }]);
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    expect(warnings).toContain(documentWarning);
    expect(missingRequiredFields).not.toContain('salePrice');
  });

  it('preserves a null model price as missing information without substituting zero or the loan amount', async () => {
    responseData = { ...extracted, salePrice: null, loanAmount: 388000, warnings: ['The contract does not establish a purchase price.'] };
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    expect(result.salePrice).toBeNull();
    const { plan, missingRequiredFields } = buildFieldPlan(result, payload.input, true);
    expect(plan.some(field => field.key === 'salePrice')).toBe(false);
    expect(missingRequiredFields).toContain('salePrice');
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  });

  it('turns free-form extracted descriptions into supported required dropdown values', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(completedResponse({ ...extracted,
      loanType: 'Fixed Rate', propertyType: 'Single-family detached residence', product: ' ' })));
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    const { plan } = buildFieldPlan(result, payload.input, true);
    expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: 'Conventional', required: true });
    expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: 'Single Family', required: true });
    expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR CONV', required: true });
  });

  it('preserves source-linked borrower and both agent identities through extraction and access planning', async () => {
    responseData = { ...extracted,
      borrower: { ...emptyContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
      listingAgent: { ...emptyContact, firstName: 'Lena', lastName: 'Listing', mobilePhone: '7025550111', email: 'listing@example.test' },
      buyerAgent: { ...emptyContact, firstName: 'Bailey', lastName: 'Buyeragent', workPhone: '7025550222', email: 'buyeragent@example.test' },
      evidence: [...extracted.evidence,
        { field: 'borrower.homePhone', document: 'urla', page: 1, quote: 'Casey Borrower Home Phone 7025550100' },
        { field: 'listingAgent.mobilePhone', document: 'salesContract', page: 9, quote: "Seller's Agent: Lena Listing; Mobile: 7025550111" },
        { field: 'buyerAgent.workPhone', document: 'salesContract', page: 10, quote: "Buyer's Agent: Bailey Buyeragent; Office: 7025550222" },
      ],
    };
    const result = await extractOrder(payload, createModel(payload.input.apiKey, DEFAULT_MODEL), new AbortController().signal);
    expect(result).toEqual(responseData);
    for (const loanPurpose of ['Purchase', 'Refinance'] as const) {
      const { plan } = buildFieldPlan({ ...result, loanPurpose }, payload.input, true);
      expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe(loanPurpose === 'Purchase' ? 'Lena' : 'Casey');
      expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe(loanPurpose === 'Purchase' ? '7025550111' : '');
      expect(plan.find(field => field.key === 'contact.homePhone')?.value).toBe(loanPurpose === 'Refinance' ? '7025550100' : '');
      expect(plan.find(field => field.key === 'listingAgent.email')?.value).toBe('listing@example.test');
      expect(plan.find(field => field.key === 'buyerAgent.email')?.value).toBe('buyeragent@example.test');
    }
  });

  it('transmits screenshot tool output as image input rather than a serialized text blob', async () => {
    const screenshot = [
      { type: 'text', text: 'Synthetic order page screenshot.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' } },
    ];
    await createModel(payload.input.apiKey, DEFAULT_MODEL).invoke(toProviderMessages('openai', [
      new HumanMessage('Inspect the order page.'),
      new AIMessage({ content: '', tool_calls: [{ id: 'call_screenshot', name: 'screenshot_page', args: {}, type: 'tool_call' }] }),
      new ToolMessage({ tool_call_id: 'call_screenshot', name: 'screenshot_page', content: screenshot }),
    ]));
    const toolOutput = requests[0]!.body.input.find(item => item.type === 'function_call_output');
    expect(toolOutput?.output).toEqual([
      { type: 'input_text', text: 'Synthetic order page screenshot.' },
      { type: 'input_image', image_url: 'data:image/png;base64,iVBORw0KGgo=', detail: 'auto' },
    ]);
    expect(typeof toolOutput?.output).not.toBe('string');
  });
});
