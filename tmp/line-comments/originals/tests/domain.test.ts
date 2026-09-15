import { describe, expect, it } from 'vitest';
import { aiProviders, buildFieldPlan, DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, extractionSchema, inputSchema, validateLoan, validatePdf, type ExtractedOrder } from '../src/domain.js';

const contact = { firstName: 'Sample', lastName: 'Borrower', workPhone: null, homePhone: null, mobilePhone: '7025550100', email: 'borrower@example.test' };
const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
export const sourceOrder: ExtractedOrder = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: '1004 SFR CONV', propertyType: 'Single Family', occupancy: 'Owner (Primary Residence)',
  property: { address: '123 Example St', unit: null, postalCode: '89135', city: 'Las Vegas', state: 'NV' },
  secondaryLoanNumber: null, loanType: 'Conventional', lienPosition: 'First', loanAmount: 300000, salePrice: 400000,
  lastValuationAmount: null, lastValuationDate: null, borrower: contact, coBorrower: { ...contact, firstName: null, lastName: null, mobilePhone: null, email: null }, listingAgent: { ...contact, workPhone: '7025550101' },
  buyerAgent: emptyContact,
  complexProperty: false, highProfileCustomer: false, evidence: [
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' }, { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    { field: 'product', document: 'urla', page: 1, quote: 'Appraisal required: 1004 SFR CONV' },
  ], warnings: [],
};
export const input = inputSchema.parse({ apiKey: 'test-key-not-real-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' });

describe('AI provider input boundary', () => {
  it('exposes exactly the supported provider choices', () => {
    expect(aiProviders).toEqual(['openai', 'anthropic', 'google', 'xai']);
    expect(DEFAULT_MODELS.google).toBe('gemini-3.8-flash');
    expect(DEFAULT_MODELS.xai).toBe('grok-4.6');
  });
  it('defaults omitted provider and model to OpenAI without accepting the obsolete key field', () => {
    expect(input).toMatchObject({ provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL, apiKey: 'test-key-not-real-1234567890' });
    const { apiKey, ...withoutKey } = input;
    expect(inputSchema.safeParse(withoutKey).success).toBe(false);
    expect(inputSchema.safeParse({ ...withoutKey, openaiApiKey: apiKey }).success).toBe(false);
  });
  it.each(aiProviders)('resolves omitted, empty, or whitespace-only models for %s', (provider) => {
    for (const model of [undefined, '', '  \t ']) {
      expect(inputSchema.parse({ ...input, provider, model }).model).toBe(DEFAULT_MODELS[provider]);
    }
  });
  it.each(aiProviders)('preserves custom model IDs for %s instead of enforcing a model prefix', (provider) => {
    for (const model of ['claude-opus-5', 'claude-sonnet-4-20250514', 'gpt-5.6-sol', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-custom-model-id', 'grok-4.6', 'grok-custom-model-id', 'ft:gpt-4.1:organization:custom:id', 'vendor/model-v2', 'x'.repeat(200)]) {
      expect(inputSchema.parse({ ...input, provider, model: `  ${model}  ` }).model).toBe(model);
    }
  });
  it('rejects unsupported providers, missing or unreasonable keys, and malformed model IDs', () => {
    for (const provider of ['unknown', '', 'OpenAI', null]) expect(inputSchema.safeParse({ ...input, provider }).success).toBe(false);
    for (const apiKey of [undefined, null, '', 'short', 'x'.repeat(513)]) expect(inputSchema.safeParse({ ...input, apiKey }).success).toBe(false);
    for (const model of [null, 5, 'x'.repeat(201), 'model name', 'model\nname', 'model\tname', 'model\u0000name', 'model\u007fname', 'model\u0085name']) {
      expect(inputSchema.safeParse({ ...input, model }).success).toBe(false);
    }
    expect(inputSchema.parse({ ...input, apiKey: ` ${input.apiKey} ` }).apiKey).toBe(input.apiKey);
  });
});

describe('mortgage preparation rules', () => {
  it('requires the API key, exact loan number and valid payments without R3 credentials', () => {
    for (const loanNumber of ['685-201234', '685-20123456', '685-2112345', 'abc685-2012345']) expect(inputSchema.safeParse({ ...input, loanNumber }).success).toBe(false);
    expect(inputSchema.safeParse({ ...input, paymentMethod: 'Cash' }).success).toBe(false);
    expect(inputSchema.safeParse({ ...input, apiKey: '' }).success).toBe(false);
    expect(inputSchema.safeParse(input).success).toBe(true);
  });
  it('blocks all VA classifications before browser work', () => {
    expect(() => validateLoan({ ...sourceOrder, loanProgram: 'VA' }, input)).toThrow('VA portal');
    expect(() => validateLoan({ ...sourceOrder, loanProgramText: 'VA Interest Rate Reduction' }, input)).toThrow('VA portal');
  });
  it.each(['FHA', 'FHA Zero Down'] as const)('requires an FHA case for %s', (loanProgram) => {
    expect(() => validateLoan({ ...sourceOrder, loanProgram }, input)).toThrow('FHA Case Number');
    expect(() => validateLoan({ ...sourceOrder, loanProgram }, { ...input, fhaCaseNumber: '123-4567890' })).not.toThrow();
  });
  it('requires URLA evidence for program and purpose, not contract guesses', () => {
    expect(() => validateLoan({ ...sourceOrder, evidence: [] }, input)).toThrow('supported by the URLA');
    expect(() => validateLoan({ ...sourceOrder, loanProgram: 'Unknown' }, input)).toThrow('could not be established');
  });
  it('allows sale price only with purchase AND contract, and flips access to borrower on refinance', () => {
    expect(buildFieldPlan(sourceOrder, input, true).plan.find(p => p.key === 'salePrice')?.value).toBe('400000');
    expect(buildFieldPlan(sourceOrder, input, false).plan.find(p => p.key === 'salePrice')?.value).toBe('');
    const refi = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance' }, input, true).plan;
    expect(refi.find(p => p.key === 'salePrice')?.value).toBe('');
    expect(refi.find(p => p.key === 'borrowerIsAccessContact')?.value).toBe(true);
    expect(refi.find(p => p.key === 'contact.firstName')?.value).toBe(sourceOrder.borrower.firstName);
    expect(refi.find(p => p.key === 'contact.mobilePhone')?.value).toBe(sourceOrder.borrower.mobilePhone);
  });
  it('keeps the stated purchase price distinct from loan amount and preserves unsigned-document review', () => {
    const documentWarning = 'The supplied purchase contract is an unsigned sample. Confirm the final terms during review.';
    const { plan, warnings, missingRequiredFields } = buildFieldPlan({ ...sourceOrder,
      salePrice: 485000, loanAmount: 388000, warnings: [documentWarning],
      evidence: [...sourceOrder.evidence, { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase Price: $485,000.00' }],
    }, input, true);
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '485000', kind: 'text', required: true }]);
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    expect(missingRequiredFields).not.toContain('salePrice');
    expect(warnings).toContain(documentWarning);
  });
  it.each(['No explicit purchase price appears in the contract.', 'Conflicting purchase prices require confirmation.'])('leaves an unknown purchase price unresolved: %s', (warning) => {
    const data = extractionSchema.parse({ ...sourceOrder, salePrice: null, loanAmount: 388000, warnings: [warning] });
    expect(data.salePrice).toBeNull();
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(data, input, true);
    expect(plan.find(field => field.key === 'salePrice')).toBeUndefined();
    expect(missingRequiredFields).toContain('salePrice');
    expect(warnings).toContain(warning);
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    expect(extractionSchema.safeParse({ ...data, salePrice: 0 }).success).toBe(false);
  });
  it.each([
    ['Purchase', false], ['Refinance', true], ['Refinance', false],
  ] as const)('explicitly clears sale price for %s when contract supplied is %s', (loanPurpose, hasContract) => {
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, salePrice: 485000, loanAmount: 388000 }, input, hasContract);
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '', kind: 'text', required: false }]);
    expect(missingRequiredFields).not.toContain('salePrice');
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  });
  it('preserves fixed branch/contact and user inputs with a unique immutable value plan', () => {
    const { plan } = buildFieldPlan(sourceOrder, { ...input, rushOrder: true, paymentMethod: 'Request Payment From The Borrower' }, true);
    expect(plan.find(p => p.key === 'branch')?.value).toBe('GUILD 685 SUMMERLIN ONE');
    expect(plan.find(p => p.key === 'statusContact.email')?.value).toBe('ambercolemanteam@guildmortgage.net');
    expect(plan.find(p => p.key === 'statusContact.lastName')?.value).toBe('');
    expect(plan.find(p => p.key === 'rushOrder')?.value).toBe(true);
    expect(plan.find(p => p.key === 'paymentMethod')?.value).toBe('Request Payment From The Borrower');
    expect(new Set(plan.map(p => p.key)).size).toBe(plan.length);
  });
  it('always plans the fixed loan officer independently of provider, purpose, contract and extracted contacts', () => {
    for (const provider of aiProviders) for (const loanPurpose of ['Purchase', 'Refinance'] as const) for (const hasContract of [false, true]) {
      const source = { ...sourceOrder, loanPurpose, listingAgent: emptyContact, buyerAgent: emptyContact,
        loanOfficer: { firstName: 'Untrusted', lastName: 'Document Officer', workPhone: '7025550999', email: 'other@example.test' } };
      const { plan } = buildFieldPlan(source, { ...input, provider, model: DEFAULT_MODELS[provider] }, hasContract);
      expect(plan.filter(field => field.key.startsWith('loanOfficer.'))).toEqual([
        { key: 'loanOfficer.firstName', value: 'Amber', kind: 'text', required: true },
        { key: 'loanOfficer.lastName', value: 'Coleman', kind: 'text', required: true },
        { key: 'loanOfficer.workPhone', value: '702-604-7027', kind: 'text', required: true },
        { key: 'loanOfficer.email', value: 'acoleman@guildmortgage.net', kind: 'text', required: true },
      ]);
      expect(plan.find(field => field.key === 'statusContact.firstName')?.value).toBe('Amber Coleman Team');
      expect(plan.find(field => field.key === 'statusContact.email')?.value).toBe('ambercolemanteam@guildmortgage.net');
      expect(extractionSchema.parse(source)).not.toHaveProperty('loanOfficer');
    }
  });
  it('keeps source warnings and identifies unavailable required information', () => {
    const { warnings, plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, product: null, propertyType: null, warnings: ['Contract price conflicts with URLA.'] }, input, false);
    expect(warnings).toContain('Contract price conflicts with URLA.');
    expect(warnings.some(warning => warning.includes('product'))).toBe(true);
    expect(plan.some(field => field.key === 'product')).toBe(false);
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['product', 'propertyType']));
  });
  it('normalizes inspected dropdowns and identifies baseline product inference for review', () => {
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, product: null, propertyType: 'condo', occupancy: 'primary residence', loanProgram: 'FHA', lienPosition: '1st', lastValuationDate: '2026-01-20' }, { ...input, fhaCaseNumber: '123-4567890' }, true);
    expect(plan.find(p => p.key === 'product')?.value).toBe('1073 CONDO FHA');
    expect(plan.find(p => p.key === 'propertyType')?.value).toBe('Condominium');
    expect(plan.find(p => p.key === 'occupancy')?.value).toBe('Owner (Primary Residence)');
    expect(plan.find(p => p.key === 'lastValuationDate')?.value).toBe('01/20/2026');
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(true);
  });
  it.each(['FHA', 'FHA Zero Down'] as const)('selects the supported appraisal product dynamically for %s without changing property or occupancy', (loanProgram) => {
    for (const [propertyType, expectedProduct] of [
      ['Single Family', '1004 SFR - FHA'],
      ['Condominium', '1073 CONDO FHA'],
      ['Manufactured Home', '1004C Manuf - FHA'],
      ['Two To Four Family', '1025 Multi - FHA'],
    ] as const) for (const product of [null, '', ' \t ']) {
      const order = { ...sourceOrder, loanProgram, loanProgramText: loanProgram, loanType: 'Fixed Rate', propertyType, product,
        evidence: sourceOrder.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item) };
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, { ...input, fhaCaseNumber: '123-4567890' }, true);
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: expectedProduct, kind: 'select', required: true });
      expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: 'FHA', required: true });
      expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: propertyType, required: true });
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      expect(missingRequiredFields).not.toContain('product');
      expect(warnings).toContain(`Product ${expectedProduct} was selected from the loan program and property type. Confirm that it matches the lender's appraisal requirements.`);
      if (propertyType === 'Condominium') expect(plan.find(field => field.key === 'product')?.allowedLabels ?? []).toEqual([]);
    }
  });
  it.each([
    ['1004 SFR - FHA', '1004 SFR FHA'],
    ['1004C Manuf - FHA', '1004C Manuf FHA'],
    ['1025 Multi - FHA', '1025 Multi FHA'],
  ])('approves only the equivalent FHA product labels %s and %s while preserving the stated product', (canonical, alias) => {
    for (const [product, equivalent] of [[canonical, alias], [alias, canonical]] as const) {
      const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product,
        evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: `Appraisal required: ${product}` } : item) }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      const entry = plan.find(field => field.key === 'product');
      expect(entry).toMatchObject({ value: product, kind: 'select', required: true });
      expect(entry?.allowedLabels).toContain(equivalent);
      expect(entry?.allowedLabels?.every(label => [canonical, alias].includes(label))).toBe(true);
      expect(plan.find(field => field.key === 'propertyType')?.value).toBe(sourceOrder.propertyType);
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    }
  });
  it.each(['FHA', 'FHA Zero Down'] as const)('does not infer a single-family product from %s alone', (loanProgram) => {
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanProgram, loanProgramText: loanProgram, propertyType: null, product: null }, { ...input, fhaCaseNumber: '123-4567890' }, true);
    expect(plan.some(field => field.key === 'product' || field.key === 'propertyType')).toBe(false);
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['product', 'propertyType']));
    expect(plan.find(field => field.key === 'loanType')?.value).toBe('FHA');
    expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
  });
  it('preserves unusual stated appraisal products without granting FHA aliases', () => {
    for (const product of ['Document-specific product', '1004 SFR FHA with completion report', '1004 SFR CONV']) {
      const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product,
        evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: `Appraisal required: ${product}` } : item) }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      const entry = plan.find(field => field.key === 'product');
      expect(entry?.value).toBe(product);
      expect(entry?.allowedLabels ?? []).toEqual([]);
      expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    }
  });
  it.each(['Conventional', 'FHA', 'FHA Zero Down'] as const)('uses the URLA %s program instead of free-form loan type text', (loanProgram) => {
    const order = { ...sourceOrder, loanProgram, loanProgramText: loanProgram,
      evidence: sourceOrder.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item) };
    for (const loanType of [null, '', '  ', 'Fixed Rate', loanProgram === 'Conventional' ? 'FHA' : 'Conventional']) {
      const { plan } = buildFieldPlan({ ...order, loanType }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: loanProgram === 'Conventional' ? 'Conventional' : 'FHA', kind: 'select', required: true });
    }
  });
  it.each([
    [' Single-family detached residence ', 'Single Family', '1004 SFR CONV'],
    ['DETACHED SINGLE FAMILY HOME', 'Single Family', '1004 SFR CONV'],
    ['Single\u2011family residence', 'Single Family', '1004 SFR CONV'],
    ['single   family home', 'Single Family', '1004 SFR CONV'],
    ['Condominium Unit', 'Condominium', '1073 CONDO CONV'],
    ['Manufactured housing', 'Manufactured Home', '1004C MANU CONV'],
    ['2\u20134 units', 'Two To Four Family', '1025 Multi-Family CONV'],
  ])('maps explicit property description %s before inferring a product', (propertyType, expectedProperty, expectedProduct) => {
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType, product: ' \t ' }, input, true);
    expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: expectedProperty, required: true });
    expect(plan.find(field => field.key === 'product')?.value).toBe(expectedProduct);
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(true);
  });
  it.each(['1 unit', 'One Unit', 'Detached', 'PUD', 'Modular Home', 'Single Family / Condominium', 'constructor'])('leaves ambiguous or unsupported property description %s unresolved', (propertyType) => {
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType, product: '' }, input, true);
    expect(plan.some(field => field.key === 'propertyType' || field.key === 'product')).toBe(false);
    expect(warnings).toContain('The document property type could not be mapped to an inspected R3 option. Select it during review.');
  });
  it('preserves a stated product and distinguishes townhouse from single family', () => {
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType: 'Townhouse or Rowhouse', product: 'Document-specific product',
      evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: 'Appraisal required: Document-specific product' } : item) }, input, true);
    expect(plan.find(field => field.key === 'propertyType')?.value).toBe('Townhouse or Rowhouse');
    expect(plan.find(field => field.key === 'product')?.value).toBe('Document-specific product');
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    expect(buildFieldPlan({ ...sourceOrder, propertyType: 'townhouse', product: null }, input, true).plan.some(field => field.key === 'product')).toBe(false);
  });
  it('leaves Other programs for review without adopting unsupported loan type text', () => {
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'Other', loanProgramText: 'Other program', loanType: 'Fixed Rate' }, input, true);
    expect(plan.some(field => field.key === 'loanType')).toBe(false);
    expect(warnings).toContain('Missing document information: loanType. Complete this during review.');
  });
  it.each(['Purchase', 'Refinance'] as const)('uses the correct %s access contact and keeps both agent sections distinct', (loanPurpose) => {
    const listingAgent = { ...emptyContact, firstName: 'Lena', lastName: 'Listing', mobilePhone: '7025550111', email: 'listing@example.test' };
    const buyerAgent = { ...emptyContact, firstName: 'Bailey', lastName: 'Buyeragent', workPhone: '7025550222', email: 'buyeragent@example.test' };
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, listingAgent, buyerAgent }, input, true);
    const expectedAccess = loanPurpose === 'Purchase' ? listingAgent : sourceOrder.borrower;
    for (const [section, expected] of Object.entries({ contact: expectedAccess, listingAgent, buyerAgent })) {
      for (const [key, value] of Object.entries(expected)) expect(plan.find(field => field.key === `${section}.${key}`)?.value).toBe(value ?? '');
    }
    expect(plan.find(field => field.key === 'borrowerIsAccessContact')?.value).toBe(loanPurpose === 'Refinance');
    expect(missingRequiredFields.filter(key => key.startsWith('contact.'))).toEqual([]);
    expect(new Set(plan.map(field => field.key)).size).toBe(plan.length);
  });
  it.each(['workPhone', 'homePhone', 'mobilePhone', 'email'] as const)('accepts a supported %s as the only borrower and access contact channel', (channel) => {
    const supportedContact = { ...emptyContact, firstName: 'Known', lastName: 'Person', [channel]: channel === 'email' ? 'contact@example.test' : '7025550333' };
    for (const loanPurpose of ['Purchase', 'Refinance'] as const) {
      const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, borrower: supportedContact, listingAgent: supportedContact }, input, true);
      expect(missingRequiredFields.filter(key => key.startsWith('borrower.') || key.startsWith('contact.'))).toEqual([]);
      expect(plan.find(field => field.key === `contact.${channel}`)).toMatchObject({ value: supportedContact[channel], required: true });
      for (const other of ['workPhone', 'homePhone', 'mobilePhone', 'email'].filter(key => key !== channel)) {
        expect(plan.find(field => field.key === `contact.${other}`)).toMatchObject({ value: '', required: false });
      }
    }
  });
  it('requires an access name and reachable channel without substituting a different person', () => {
    const listingAgent = { ...emptyContact, firstName: 'Only', lastName: ' \t ' };
    const buyerAgent = { ...contact, firstName: 'Different', lastName: 'Agent' };
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, listingAgent, buyerAgent }, input, true);
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['contact.lastName', 'contact.phoneOrEmail']));
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('Only');
    expect(plan.find(field => field.key === 'contact.lastName')).toMatchObject({ value: '', required: false });
    expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe('');
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe('');
    expect(plan.find(field => field.key === 'buyerAgent.mobilePhone')?.value).toBe(buyerAgent.mobilePhone);
  });
  it('omits empty agent sections but preserves partial supported agent facts', () => {
    const { plan } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance', listingAgent: emptyContact, buyerAgent: { ...emptyContact, email: 'supported@example.test' } }, input, false);
    expect(plan.some(field => field.key.startsWith('listingAgent.'))).toBe(false);
    expect(plan.find(field => field.key === 'buyerAgent.email')?.value).toBe('supported@example.test');
    expect(plan.find(field => field.key === 'buyerAgent.firstName')?.value).toBe('');
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe(sourceOrder.borrower.email);
  });
  it('leaves access contact unresolved when the loan purpose is not purchase or refinance', () => {
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Other' }, input, true);
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('');
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe('');
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['contact.firstName', 'contact.lastName', 'contact.phoneOrEmail']));
  });
  it('clears missing borrower names before refinance access copying while retaining incomplete-source review', () => {
    const borrower = { ...contact, firstName: null, lastName: ' \t ' };
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance', borrower }, input, false);
    for (const key of ['borrower.firstName', 'borrower.lastName', 'contact.firstName', 'contact.lastName']) {
      expect(plan.filter(field => field.key === key)).toEqual([{ key, value: '', kind: 'text', required: false }]);
      expect(missingRequiredFields).toContain(key);
    }
    expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe(contact.mobilePhone);
  });
  it('validates structured extraction and rejects disguised uploads', () => {
    expect(extractionSchema.safeParse(sourceOrder).success).toBe(true);
    expect(() => validatePdf({ name: 'test.pdf', buffer: Buffer.from('<html>no PDF</html>') })).toThrow('valid PDF');
  });
});

describe('appraisal product recommendation provenance', () => {
  const fhaInput = { ...input, fhaCaseNumber: '123-4567890' };
  const recommendationEvidence: ExtractedOrder['evidence'][number] = {
    field: 'productRecommendation', document: 'urla', page: 1, quote: 'FHA; Number of Units: 1; Manufactured Home: No; Construction: Site Built',
  };
  const recommendation = (overrides: Partial<ExtractedOrder> = {}): ExtractedOrder => ({
    ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product: '1004 SFR - FHA', propertyType: null,
    evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
      .map(item => item.field === 'loanProgram' ? { ...item, quote: 'FHA' } : item), recommendationEvidence],
    ...overrides,
  });

  it.each(['FHA', 'FHA Zero Down'] as const)('allows a supported %s recommendation while keeping unknown property type unresolved', (loanProgram) => {
    for (const document of ['urla', 'salesContract'] as const) for (const hasContract of document === 'urla' ? [false, true] : [true]) {
      const order = recommendation({ loanProgram, loanProgramText: loanProgram,
        evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
          .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item), { ...recommendationEvidence, document }],
        warnings: Array.from({ length: 14 }, (_, index) => `Source warning ${index + 1}`),
      });
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, fhaInput, hasContract);
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR - FHA', kind: 'select', required: true });
      expect(plan.find(field => field.key === 'propertyType')).toBeUndefined();
      expect(missingRequiredFields).toContain('propertyType');
      expect(missingRequiredFields).not.toContain('product');
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      expect(warnings.some(warning => warning.includes('agent recommendation') && warning.includes('Confirm the property classification'))).toBe(true);
      expect(order.propertyType).toBeNull();
      expect(order.warnings).toHaveLength(14);
    }
  });

  it.each(['Conventional', 'FHA', 'FHA Zero Down'] as const)('accepts each inspected product family only when consistent with %s and the stated property', (loanProgram) => {
    for (const [propertyType, conventionalProduct, fhaProduct] of [
      ['Single Family', '1004 SFR CONV', '1004 SFR - FHA'],
      ['Condominium', '1073 CONDO CONV', '1073 CONDO FHA'],
      ['Manufactured Home', '1004C MANU CONV', '1004C Manuf - FHA'],
      ['Two To Four Family', '1025 Multi-Family CONV', '1025 Multi - FHA'],
    ] as const) {
      const product = loanProgram === 'Conventional' ? conventionalProduct : fhaProduct;
      const order = recommendation({ loanProgram, loanProgramText: loanProgram, propertyType, product,
        evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
          .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item), { ...recommendationEvidence, quote: `${loanProgram}; Property type: ${propertyType}` }],
      });
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, fhaInput, true);
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: product, required: true });
      expect(plan.find(field => field.key === 'propertyType')?.value).toBe(propertyType);
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      expect(missingRequiredFields).not.toContain('product');
      expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(true);
    }
  });

  it('accepts only the finite FHA punctuation aliases for recommendations', () => {
    for (const [product, canonical] of [
      ['1004 SFR FHA', '1004 SFR - FHA'], ['1004C Manuf FHA', '1004C Manuf - FHA'], ['1025 Multi FHA', '1025 Multi - FHA'],
    ] as const) {
      const { plan } = buildFieldPlan(recommendation({ product }), fhaInput, true);
      const entry = plan.find(field => field.key === 'product');
      expect(entry).toMatchObject({ kind: 'select', required: true });
      expect([entry?.value, ...(entry?.allowedLabels ?? [])]).toContain(canonical);
    }
  });

  it('keeps malformed or mixed recommendation provenance out of the explicit-product and baseline paths', () => {
    const base = recommendation({ propertyType: 'Single Family' });
    const classificationEvidence = base.evidence.filter(item => item.field !== 'productRecommendation');
    const explicitEvidence: ExtractedOrder['evidence'][number] = { field: 'product', document: 'urla', page: 1, quote: 'Appraisal: 1004 SFR - FHA' };
    const cases: Array<{ name: string; product: string | null; evidence: ExtractedOrder['evidence']; hasContract: boolean }> = [
      { name: 'empty recommendation quote', product: base.product, evidence: [{ ...recommendationEvidence, quote: ' \t ' }], hasContract: true },
      { name: 'citation to an absent contract', product: base.product, evidence: [{ ...recommendationEvidence, document: 'salesContract' }], hasContract: false },
      { name: 'valid quote alongside an empty recommendation quote', product: base.product, evidence: [recommendationEvidence, { ...recommendationEvidence, quote: '' }], hasContract: true },
      { name: 'URLA quote alongside citation to an absent contract', product: base.product, evidence: [recommendationEvidence, { ...recommendationEvidence, document: 'salesContract' }], hasContract: false },
      { name: 'mixed explicit and recommendation citations', product: base.product, evidence: [recommendationEvidence, explicitEvidence], hasContract: true },
      { name: 'malformed recommendation beside valid explicit citation', product: base.product, evidence: [{ ...recommendationEvidence, quote: '' }, explicitEvidence], hasContract: true },
      { name: 'missing recommended value', product: null, evidence: [recommendationEvidence], hasContract: true },
      { name: 'blank recommended value', product: ' \t ', evidence: [recommendationEvidence], hasContract: true },
      { name: 'unmarked product', product: base.product, evidence: [], hasContract: true },
      { name: 'unrecognized provenance marker', product: base.product, evidence: [{ ...recommendationEvidence, field: 'ProductRecommendation' }], hasContract: true },
    ];
    for (const { name, product, evidence, hasContract } of cases) {
      const { plan, missingRequiredFields, warnings } = buildFieldPlan({ ...base, product, evidence: [...classificationEvidence, ...evidence] }, fhaInput, hasContract);
      expect(plan.find(field => field.key === 'product'), name).toBeUndefined();
      expect(missingRequiredFields, name).toContain('product');
      expect(warnings.some(warning => /product/i.test(warning)), name).toBe(true);
      expect(plan.find(field => field.key === 'propertyType')?.value, name).toBe('Single Family');
      expect(plan.find(field => field.key === 'occupancy')?.value, name).toBe(sourceOrder.occupancy);
    }
  });

  it('rejects unsupported, conflicting and wrong-program recommendations instead of guessing a substitute', () => {
    const cases: Array<Partial<ExtractedOrder>> = [
      { product: 'FHA 30-year fixed' }, { product: '1004 SFR FHA with completion report' },
      { product: '1004 SFR FHA / 1073 CONDO FHA' }, { product: '1073 CONDO - FHA' },
      { product: '1004 SFR CONV' }, { product: '1004 SFR USDA' },
      { loanProgram: 'Conventional', loanProgramText: 'Conventional' }, { loanProgram: 'Other', loanProgramText: 'Other program' },
      { propertyType: 'Condominium' }, { propertyType: 'Manufactured Home' }, { propertyType: 'Two To Four Family' },
      { propertyType: 'Townhouse or Rowhouse' }, { propertyType: 'One Unit' },
      { propertyType: 'Single Family / Condominium' }, { propertyType: 'PUD' },
    ];
    for (const overrides of cases) {
      const order = recommendation(overrides);
      order.evidence = order.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: order.loanProgramText! } : item);
      const { plan, missingRequiredFields } = buildFieldPlan(order, fhaInput, true);
      expect(plan.find(field => field.key === 'product'), JSON.stringify(overrides)).toBeUndefined();
      expect(missingRequiredFields, JSON.stringify(overrides)).toContain('product');
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
    }
  });

  it('requires a supplied-document citation for explicit products without relabelling them as recommendations', () => {
    const product = 'Document-specific appraisal with completion inspection';
    const base = { ...sourceOrder, product };
    const classificationEvidence = sourceOrder.evidence.filter(item => item.field !== 'product');
    for (const document of ['urla', 'salesContract'] as const) {
      const evidence = [...classificationEvidence, { field: 'product', document, page: 1, quote: `Appraisal required: ${product}` }];
      const { plan, warnings } = buildFieldPlan({ ...base, evidence }, input, true);
      const entry = plan.find(field => field.key === 'product');
      expect(entry).toMatchObject({ value: product, required: true });
      expect(entry?.allowedLabels ?? []).toEqual([]);
      expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(false);
    }
    for (const evidence of [
      classificationEvidence,
      [...classificationEvidence, { field: 'product', document: 'urla' as const, page: 1, quote: ' \t ' }],
      [...classificationEvidence, { field: 'product', document: 'salesContract' as const, page: 1, quote: product }],
    ]) {
      const { plan, missingRequiredFields } = buildFieldPlan({ ...base, evidence }, input, false);
      expect(plan.find(field => field.key === 'product')).toBeUndefined();
      expect(missingRequiredFields).toContain('product');
    }
  });
});
