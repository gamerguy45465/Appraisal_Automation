// [L1] Import { describe, expect, it } from "vitest" for these regression tests.
import { describe, expect, it } from 'vitest';
// [L2] Import { aiProviders, buildFieldPlan, DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, extractionSchema, inputSchema, validateLoan, validatePdf, type ExtractedOrder } from "../src/domain.js" for these regression tests.
import { aiProviders, buildFieldPlan, DEFAULT_MODEL, DEFAULT_MODELS, DEFAULT_PROVIDER, extractionSchema, inputSchema, validateLoan, validatePdf, type ExtractedOrder } from '../src/domain.js';
// [L3] Blank line separating the surrounding declarations, statements, or document blocks.

// [L4] Declare `contact` as an object containing firstName: "Sample", lastName: "Borrower", workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: "7025550100", email: "borrower@example.test".
const contact = { firstName: 'Sample', lastName: 'Borrower', workPhone: null, homePhone: null, mobilePhone: '7025550100', email: 'borrower@example.test' };
// [L5] Declare `emptyContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const emptyContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L6] Declare `sourceOrder` as an object whose fields are defined below.
export const sourceOrder: ExtractedOrder = {
  // [L7] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to "1004 SFR CONV". Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "Owner (Primary Residence)".
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: '1004 SFR CONV', propertyType: 'Single Family', occupancy: 'Owner (Primary Residence)',
  // [L8] Set fixture property `property` to an object containing address: "123 Example St", unit: null (unknown or absent), postalCode: "89135", city: "Las Vegas", state: "NV".
  property: { address: '123 Example St', unit: null, postalCode: '89135', city: 'Las Vegas', state: 'NV' },
  // [L9] Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to "Conventional". Set fixture property `lienPosition` to "First". Set fixture property `loanAmount` to 300000. Set fixture property `salePrice` to 400000.
  secondaryLoanNumber: null, loanType: 'Conventional', lienPosition: 'First', loanAmount: 300000, salePrice: 400000,
  // [L10] Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent). Set fixture property `borrower` to `contact`. Set fixture property `coBorrower` to an object containing values copied from `contact`, firstName: null (unknown or absent), lastName: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent). Set fixture property `listingAgent` to an object containing values copied from `contact`, workPhone: "7025550101".
  lastValuationAmount: null, lastValuationDate: null, borrower: contact, coBorrower: { ...contact, firstName: null, lastName: null, mobilePhone: null, email: null }, listingAgent: { ...contact, workPhone: '7025550101' },
  // [L11] Set fixture property `buyerAgent` to `emptyContact`.
  buyerAgent: emptyContact,
  // [L12] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false. Set fixture property `evidence` to an array containing an object containing field: "loanProgram", document: "urla", page: 1, quote: "Conventional", an object containing field: "loanPurpose", document: "urla", page: 1, quote: "Purchase", an object containing field: "product", document: "urla", page: 1, quote: "Appraisal required: 1004 SFR CONV".
  complexProperty: false, highProfileCustomer: false, evidence: [
    // [L13] Set fixture property `field` to "loanProgram". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Conventional". Set fixture property `field` to "loanPurpose". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Purchase".
    { field: 'loanProgram', document: 'urla', page: 1, quote: 'Conventional' }, { field: 'loanPurpose', document: 'urla', page: 1, quote: 'Purchase' },
    // [L14] Set fixture property `field` to "product". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "Appraisal required: 1004 SFR CONV".
    { field: 'product', document: 'urla', page: 1, quote: 'Appraisal required: 1004 SFR CONV' },
  // [L15] Set fixture property `warnings` to an empty array.
  ], warnings: [],
// [L16] Close the fixture object for `sourceOrder` and finish the surrounding syntax.
};
// [L17] Declare `input` as the result of `inputSchema.parse` using an object containing apiKey: "test-key-not-real-1234567890", loanNumber: "685-2012345", paymentMethod: "Invoice".
export const input = inputSchema.parse({ apiKey: 'test-key-not-real-1234567890', loanNumber: '685-2012345', paymentMethod: 'Invoice' });
// [L18] Blank line separating the surrounding declarations, statements, or document blocks.

// [L19] Group regression tests for "AI provider input boundary".
describe('AI provider input boundary', () => {
  // [L20] Register a test that "exposes exactly the supported provider choices".
  it('exposes exactly the supported provider choices', () => {
    // [L21] Assert that `aiProviders` deeply equals an array containing "openai", "anthropic", "google", "xai".
    expect(aiProviders).toEqual(['openai', 'anthropic', 'google', 'xai']);
    // [L22] Assert that `DEFAULT_MODELS.google` strictly equals "gemini-3.8-flash".
    expect(DEFAULT_MODELS.google).toBe('gemini-3.8-flash');
    // [L23] Assert that `DEFAULT_MODELS.xai` strictly equals "grok-4.6".
    expect(DEFAULT_MODELS.xai).toBe('grok-4.6');
  // [L24] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L25] Register a test that "defaults omitted provider and model to OpenAI without accepting the obsolete key field".
  it('defaults omitted provider and model to OpenAI without accepting the obsolete key field', () => {
    // [L26] Assert that `input` contains the expected object fields an object containing provider: `DEFAULT_PROVIDER`, model: `DEFAULT_MODEL`, apiKey: "test-key-not-real-1234567890".
    expect(input).toMatchObject({ provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL, apiKey: 'test-key-not-real-1234567890' });
    // [L27] Declare `{ apiKey, ...withoutKey }` as `input`.
    const { apiKey, ...withoutKey } = input;
    // [L28] Assert that `inputSchema.safeParse(withoutKey).success` strictly equals false.
    expect(inputSchema.safeParse(withoutKey).success).toBe(false);
    // [L29] Assert that `inputSchema.safeParse({ ...withoutKey, openaiApiKey: apiKey }).success` strictly equals false.
    expect(inputSchema.safeParse({ ...withoutKey, openaiApiKey: apiKey }).success).toBe(false);
  // [L30] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L31] Register a parameterized test that "resolves omitted, empty, or whitespace-only models for %s".
  it.each(aiProviders)('resolves omitted, empty, or whitespace-only models for %s', (provider) => {
    // [L32] Iterate const model over an array containing `undefined`, "", "  \t ".
    for (const model of [undefined, '', '  \t ']) {
      // [L33] Assert that `inputSchema.parse({ ...input, provider, model }).model` strictly equals `DEFAULT_MODELS[provider]`.
      expect(inputSchema.parse({ ...input, provider, model }).model).toBe(DEFAULT_MODELS[provider]);
    // [L34] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L35] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L36] Register a parameterized test that "preserves custom model IDs for %s instead of enforcing a model prefix".
  it.each(aiProviders)('preserves custom model IDs for %s instead of enforcing a model prefix', (provider) => {
    // [L37] Iterate const model over an array containing "claude-opus-5", "claude-sonnet-4-20250514", "gpt-5.6-sol", "gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-custom-model-id", "grok-4.6", "grok-custom-model-id", "ft:gpt-4.1:organization:custom:id", "vendor/model-v2", the result of `'x'.repeat` using 200.
    for (const model of ['claude-opus-5', 'claude-sonnet-4-20250514', 'gpt-5.6-sol', 'gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-custom-model-id', 'grok-4.6', 'grok-custom-model-id', 'ft:gpt-4.1:organization:custom:id', 'vendor/model-v2', 'x'.repeat(200)]) {
      // [L38] Assert that `inputSchema.parse({ ...input, provider, model: ` ${model} ` }).model` strictly equals `model`.
      expect(inputSchema.parse({ ...input, provider, model: `  ${model}  ` }).model).toBe(model);
    // [L39] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L40] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L41] Register a test that "rejects unsupported providers, missing or unreasonable keys, and malformed model IDs".
  it('rejects unsupported providers, missing or unreasonable keys, and malformed model IDs', () => {
    // [L42] For each unsupported provider value (unknown, empty string, incorrectly capitalized OpenAI, or null), assert that input validation fails.
    for (const provider of ['unknown', '', 'OpenAI', null]) expect(inputSchema.safeParse({ ...input, provider }).success).toBe(false);
    // [L43] For missing, null, empty, too-short, and 513-character API keys, assert that input validation fails.
    for (const apiKey of [undefined, null, '', 'short', 'x'.repeat(513)]) expect(inputSchema.safeParse({ ...input, apiKey }).success).toBe(false);
    // [L44] Begin invalid model-ID cases covering null, nontext values, excessive length, whitespace, and control characters.
    for (const model of [null, 5, 'x'.repeat(201), 'model name', 'model\nname', 'model\tname', 'model\u0000name', 'model\u007fname', 'model\u0085name']) {
      // [L45] Assert that `inputSchema.safeParse({ ...input, model }).success` strictly equals false.
      expect(inputSchema.safeParse({ ...input, model }).success).toBe(false);
    // [L46] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L47] Assert that `inputSchema.parse({ ...input, apiKey: ` ${input.apiKey} ` }).apiKey` strictly equals `input.apiKey`.
    expect(inputSchema.parse({ ...input, apiKey: ` ${input.apiKey} ` }).apiKey).toBe(input.apiKey);
  // [L48] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L49] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L50] Blank line separating the surrounding declarations, statements, or document blocks.

// [L51] Group regression tests for "mortgage preparation rules".
describe('mortgage preparation rules', () => {
  // [L52] Register a test that "requires the API key, exact loan number and valid payments without R3 credentials".
  it('requires the API key, exact loan number and valid payments without R3 credentials', () => {
    // [L53] Assert that each malformed loan-number example fails the required branch-specific loan-number validation.
    for (const loanNumber of ['685-201234', '685-20123456', '685-2112345', 'abc685-2012345']) expect(inputSchema.safeParse({ ...input, loanNumber }).success).toBe(false);
    // [L54] Assert that `inputSchema.safeParse({ ...input, paymentMethod: 'Cash' }).success` strictly equals false.
    expect(inputSchema.safeParse({ ...input, paymentMethod: 'Cash' }).success).toBe(false);
    // [L55] Assert that `inputSchema.safeParse({ ...input, apiKey: '' }).success` strictly equals false.
    expect(inputSchema.safeParse({ ...input, apiKey: '' }).success).toBe(false);
    // [L56] Assert that `inputSchema.safeParse(input).success` strictly equals true.
    expect(inputSchema.safeParse(input).success).toBe(true);
  // [L57] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L58] Register a test that "blocks all VA classifications before browser work".
  it('blocks all VA classifications before browser work', () => {
    // [L59] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, loanProgram: "VA", `input` throws an error matching "VA portal".
    expect(() => validateLoan({ ...sourceOrder, loanProgram: 'VA' }, input)).toThrow('VA portal');
    // [L60] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, loanProgramText: "VA Interest Rate Reduction", `input` throws an error matching "VA portal".
    expect(() => validateLoan({ ...sourceOrder, loanProgramText: 'VA Interest Rate Reduction' }, input)).toThrow('VA portal');
  // [L61] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L62] Register a parameterized test that "requires an FHA case for %s".
  it.each(['FHA', 'FHA Zero Down'] as const)('requires an FHA case for %s', (loanProgram) => {
    // [L63] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, loanProgram, `input` throws an error matching "FHA Case Number".
    expect(() => validateLoan({ ...sourceOrder, loanProgram }, input)).toThrow('FHA Case Number');
    // [L64] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, loanProgram, an object containing values copied from `input`, fhaCaseNumber: "123-4567890" does not satisfy: throws an error.
    expect(() => validateLoan({ ...sourceOrder, loanProgram }, { ...input, fhaCaseNumber: '123-4567890' })).not.toThrow();
  // [L65] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L66] Register a test that "requires URLA evidence for program and purpose, not contract guesses".
  it('requires URLA evidence for program and purpose, not contract guesses', () => {
    // [L67] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, evidence: an empty array, `input` throws an error matching "supported by the URLA".
    expect(() => validateLoan({ ...sourceOrder, evidence: [] }, input)).toThrow('supported by the URLA');
    // [L68] Assert that a callback that returns the result of `validateLoan` using an object containing values copied from `sourceOrder`, loanProgram: "Unknown", `input` throws an error matching "could not be established".
    expect(() => validateLoan({ ...sourceOrder, loanProgram: 'Unknown' }, input)).toThrow('could not be established');
  // [L69] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L70] Register a test that "allows sale price only with purchase AND contract, and flips access to borrower on refinance".
  it('allows sale price only with purchase AND contract, and flips access to borrower on refinance', () => {
    // [L71] Assert that `buildFieldPlan(sourceOrder, input, true).plan.find(p => p.key === 'salePrice')?.value` strictly equals "400000".
    expect(buildFieldPlan(sourceOrder, input, true).plan.find(p => p.key === 'salePrice')?.value).toBe('400000');
    // [L72] Assert that `buildFieldPlan(sourceOrder, input, false).plan.find(p => p.key === 'salePrice')?.value` strictly equals "".
    expect(buildFieldPlan(sourceOrder, input, false).plan.find(p => p.key === 'salePrice')?.value).toBe('');
    // [L73] Declare `refi` as `buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance' }, input, true).plan`.
    const refi = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance' }, input, true).plan;
    // [L74] Assert that `refi.find(p => p.key === 'salePrice')?.value` strictly equals "".
    expect(refi.find(p => p.key === 'salePrice')?.value).toBe('');
    // [L75] Assert that `refi.find(p => p.key === 'borrowerIsAccessContact')?.value` strictly equals true.
    expect(refi.find(p => p.key === 'borrowerIsAccessContact')?.value).toBe(true);
    // [L76] Assert that `refi.find(p => p.key === 'contact.firstName')?.value` strictly equals `sourceOrder.borrower.firstName`.
    expect(refi.find(p => p.key === 'contact.firstName')?.value).toBe(sourceOrder.borrower.firstName);
    // [L77] Assert that `refi.find(p => p.key === 'contact.mobilePhone')?.value` strictly equals `sourceOrder.borrower.mobilePhone`.
    expect(refi.find(p => p.key === 'contact.mobilePhone')?.value).toBe(sourceOrder.borrower.mobilePhone);
  // [L78] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L79] Register a test that "keeps the stated purchase price distinct from loan amount and preserves unsigned-document review".
  it('keeps the stated purchase price distinct from loan amount and preserves unsigned-document review', () => {
    // [L80] Declare `documentWarning` as "The supplied purchase contract is an unsigned sample. Confirm the final terms during review.".
    const documentWarning = 'The supplied purchase contract is an unsigned sample. Confirm the final terms during review.';
    // [L81] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using an object whose fields are defined below, `input`, true.
    const { plan, warnings, missingRequiredFields } = buildFieldPlan({ ...sourceOrder,
      // [L82] Set fixture property `salePrice` to 485000. Set fixture property `loanAmount` to 388000. Set fixture property `warnings` to an array containing `documentWarning`.
      salePrice: 485000, loanAmount: 388000, warnings: [documentWarning],
      // [L83] Set fixture property `evidence` to an array containing `...sourceOrder.evidence`, an object containing field: "salePrice", document: "salesContract", page: 1, quote: "Purchase Price: $485,000.00".
      evidence: [...sourceOrder.evidence, { field: 'salePrice', document: 'salesContract', page: 1, quote: 'Purchase Price: $485,000.00' }],
    // [L84] Finish the synthetic extracted order, then pass the trusted input and a true contract-present flag to the field planner.
    }, input, true);
    // [L85] Assert that the result of `plan.filter` using a callback that returns `field.key` strictly equals "salePrice" deeply equals an array containing an object containing key: "salePrice", value: "485000", kind: "text", required: true.
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '485000', kind: 'text', required: true }]);
    // [L86] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    // [L87] Assert that `missingRequiredFields` does not satisfy: contains "salePrice".
    expect(missingRequiredFields).not.toContain('salePrice');
    // [L88] Assert that `warnings` contains `documentWarning`.
    expect(warnings).toContain(documentWarning);
  // [L89] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L90] Register a parameterized test that "leaves an unknown purchase price unresolved: %s".
  it.each(['No explicit purchase price appears in the contract.', 'Conflicting purchase prices require confirmation.'])('leaves an unknown purchase price unresolved: %s', (warning) => {
    // [L91] Declare `data` as the result of `extractionSchema.parse` using an object containing values copied from `sourceOrder`, salePrice: null (unknown or absent), loanAmount: 388000, warnings: an array containing `warning`.
    const data = extractionSchema.parse({ ...sourceOrder, salePrice: null, loanAmount: 388000, warnings: [warning] });
    // [L92] Assert that `data.salePrice` is null.
    expect(data.salePrice).toBeNull();
    // [L93] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `data`, `input`, true.
    const { plan, warnings, missingRequiredFields } = buildFieldPlan(data, input, true);
    // [L94] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "salePrice" is undefined.
    expect(plan.find(field => field.key === 'salePrice')).toBeUndefined();
    // [L95] Assert that `missingRequiredFields` contains "salePrice".
    expect(missingRequiredFields).toContain('salePrice');
    // [L96] Assert that `warnings` contains `warning`.
    expect(warnings).toContain(warning);
    // [L97] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
    // [L98] Assert that `extractionSchema.safeParse({ ...data, salePrice: 0 }).success` strictly equals false.
    expect(extractionSchema.safeParse({ ...data, salePrice: 0 }).success).toBe(false);
  // [L99] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L100] Register a parameterized test that "explicitly clears sale price for %s when contract supplied is %s".
  it.each([
    // [L101] Provide a parameterized test row with ['Purchase', false], ['Refinance', true], ['Refinance', false],; the test receives these values as its inputs and expectations.
    ['Purchase', false], ['Refinance', true], ['Refinance', false],
  // [L102] Apply the preceding scenario rows to the parameterized test "explicitly clears sale price for %s when contract supplied is %s" and begin its callback.
  ] as const)('explicitly clears sale price for %s when contract supplied is %s', (loanPurpose, hasContract) => {
    // [L103] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose, salePrice: 485000, loanAmount: 388000, `input`, `hasContract`.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, salePrice: 485000, loanAmount: 388000 }, input, hasContract);
    // [L104] Assert that the result of `plan.filter` using a callback that returns `field.key` strictly equals "salePrice" deeply equals an array containing an object containing key: "salePrice", value: "", kind: "text", required: false.
    expect(plan.filter(field => field.key === 'salePrice')).toEqual([{ key: 'salePrice', value: '', kind: 'text', required: false }]);
    // [L105] Assert that `missingRequiredFields` does not satisfy: contains "salePrice".
    expect(missingRequiredFields).not.toContain('salePrice');
    // [L106] Assert that `plan.find(field => field.key === 'loanAmount')?.value` strictly equals "388000".
    expect(plan.find(field => field.key === 'loanAmount')?.value).toBe('388000');
  // [L107] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L108] Register a test that "preserves fixed branch/contact and user inputs with a unique immutable value plan".
  it('preserves fixed branch/contact and user inputs with a unique immutable value plan', () => {
    // [L109] Declare `{ plan }` as the result of `buildFieldPlan` using `sourceOrder`, an object containing values copied from `input`, rushOrder: true, paymentMethod: "Request Payment From The Borrower", true.
    const { plan } = buildFieldPlan(sourceOrder, { ...input, rushOrder: true, paymentMethod: 'Request Payment From The Borrower' }, true);
    // [L110] Assert that `plan.find(p => p.key === 'branch')?.value` strictly equals "GUILD 685 SUMMERLIN ONE".
    expect(plan.find(p => p.key === 'branch')?.value).toBe('GUILD 685 SUMMERLIN ONE');
    // [L111] Assert that `plan.find(p => p.key === 'statusContact.email')?.value` strictly equals "ambercolemanteam@guildmortgage.net".
    expect(plan.find(p => p.key === 'statusContact.email')?.value).toBe('ambercolemanteam@guildmortgage.net');
    // [L112] Assert that `plan.find(p => p.key === 'statusContact.lastName')?.value` strictly equals "".
    expect(plan.find(p => p.key === 'statusContact.lastName')?.value).toBe('');
    // [L113] Assert that `plan.find(p => p.key === 'rushOrder')?.value` strictly equals true.
    expect(plan.find(p => p.key === 'rushOrder')?.value).toBe(true);
    // [L114] Assert that `plan.find(p => p.key === 'paymentMethod')?.value` strictly equals "Request Payment From The Borrower".
    expect(plan.find(p => p.key === 'paymentMethod')?.value).toBe('Request Payment From The Borrower');
    // [L115] Assert that `new Set(plan.map(p => p.key)).size` strictly equals `plan.length`.
    expect(new Set(plan.map(p => p.key)).size).toBe(plan.length);
  // [L116] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L117] Register a test that "always plans the fixed loan officer independently of provider, purpose, contract and extracted contacts".
  it('always plans the fixed loan officer independently of provider, purpose, contract and extracted contacts', () => {
    // [L118] Iterate const provider over `aiProviders`.
    for (const provider of aiProviders) for (const loanPurpose of ['Purchase', 'Refinance'] as const) for (const hasContract of [false, true]) {
      // [L119] Declare `source` as an object whose fields are defined below.
      const source = { ...sourceOrder, loanPurpose, listingAgent: emptyContact, buyerAgent: emptyContact,
        // [L120] Set fixture property `loanOfficer` to an object containing firstName: "Untrusted", lastName: "Document Officer", workPhone: "7025550999", email: "other@example.test".
        loanOfficer: { firstName: 'Untrusted', lastName: 'Document Officer', workPhone: '7025550999', email: 'other@example.test' } };
      // [L121] Declare `{ plan }` as the result of `buildFieldPlan` using `source`, an object containing values copied from `input`, provider, model: `DEFAULT_MODELS[provider]`, `hasContract`.
      const { plan } = buildFieldPlan(source, { ...input, provider, model: DEFAULT_MODELS[provider] }, hasContract);
      // [L122] Assert that the result of `plan.filter` using a callback that returns the result of `field.key.startsWith` using "loanOfficer." deeply equals an array containing an object containing key: "loanOfficer.firstName", value: "Amber", kind: "text", required: true, an object containing key: "loanOfficer.lastName", value: "Coleman", kind: "text", required: true, an object containing key: "loanOfficer.workPhone", value: "702-604-7027", kind: "text", required: true, an object containing key: "loanOfficer.email", value: "acoleman@guildmortgage.net", kind: "text", required: true.
      expect(plan.filter(field => field.key.startsWith('loanOfficer.'))).toEqual([
        // [L123] Set fixture property `key` to "loanOfficer.firstName". Set fixture property `value` to "Amber". Set fixture property `kind` to "text". Set fixture property `required` to true.
        { key: 'loanOfficer.firstName', value: 'Amber', kind: 'text', required: true },
        // [L124] Set fixture property `key` to "loanOfficer.lastName". Set fixture property `value` to "Coleman". Set fixture property `kind` to "text". Set fixture property `required` to true.
        { key: 'loanOfficer.lastName', value: 'Coleman', kind: 'text', required: true },
        // [L125] Set fixture property `key` to "loanOfficer.workPhone". Set fixture property `value` to "702-604-7027". Set fixture property `kind` to "text". Set fixture property `required` to true.
        { key: 'loanOfficer.workPhone', value: '702-604-7027', kind: 'text', required: true },
        // [L126] Set fixture property `key` to "loanOfficer.email". Set fixture property `value` to "acoleman@guildmortgage.net". Set fixture property `kind` to "text". Set fixture property `required` to true.
        { key: 'loanOfficer.email', value: 'acoleman@guildmortgage.net', kind: 'text', required: true },
      // [L127] Close the array of fixture values and finish the surrounding syntax.
      ]);
      // [L128] Assert that `plan.find(field => field.key === 'statusContact.firstName')?.value` strictly equals "Amber Coleman Team".
      expect(plan.find(field => field.key === 'statusContact.firstName')?.value).toBe('Amber Coleman Team');
      // [L129] Assert that `plan.find(field => field.key === 'statusContact.email')?.value` strictly equals "ambercolemanteam@guildmortgage.net".
      expect(plan.find(field => field.key === 'statusContact.email')?.value).toBe('ambercolemanteam@guildmortgage.net');
      // [L130] Parse the extracted source and assert that an untrusted loanOfficer property is absent from the validated document facts.
      expect(extractionSchema.parse(source)).not.toHaveProperty('loanOfficer');
    // [L131] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L132] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L133] Register a test that "keeps source warnings and identifies unavailable required information".
  it('keeps source warnings and identifies unavailable required information', () => {
    // [L134] Declare `{ warnings, plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, product: null (unknown or absent), propertyType: null (unknown or absent), warnings: an array containing "Contract price conflicts with URLA.", `input`, false.
    const { warnings, plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, product: null, propertyType: null, warnings: ['Contract price conflicts with URLA.'] }, input, false);
    // [L135] Assert that `warnings` contains "Contract price conflicts with URLA.".
    expect(warnings).toContain('Contract price conflicts with URLA.');
    // [L136] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "product" strictly equals true.
    expect(warnings.some(warning => warning.includes('product'))).toBe(true);
    // [L137] Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals "product" strictly equals false.
    expect(plan.some(field => field.key === 'product')).toBe(false);
    // [L138] Assert that `missingRequiredFields` deeply equals the result of `expect.arrayContaining` using an array containing "product", "propertyType".
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['product', 'propertyType']));
  // [L139] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L140] Register a test that "normalizes inspected dropdowns and identifies baseline product inference for review".
  it('normalizes inspected dropdowns and identifies baseline product inference for review', () => {
    // [L141] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, product: null (unknown or absent), propertyType: "condo", occupancy: "primary residence", loanProgram: "FHA", lienPosition: "1st", lastValuationDate: "2026-01-20", an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, product: null, propertyType: 'condo', occupancy: 'primary residence', loanProgram: 'FHA', lienPosition: '1st', lastValuationDate: '2026-01-20' }, { ...input, fhaCaseNumber: '123-4567890' }, true);
    // [L142] Assert that `plan.find(p => p.key === 'product')?.value` strictly equals "1073 CONDO FHA".
    expect(plan.find(p => p.key === 'product')?.value).toBe('1073 CONDO FHA');
    // [L143] Assert that `plan.find(p => p.key === 'propertyType')?.value` strictly equals "Condominium".
    expect(plan.find(p => p.key === 'propertyType')?.value).toBe('Condominium');
    // [L144] Assert that `plan.find(p => p.key === 'occupancy')?.value` strictly equals "Owner (Primary Residence)".
    expect(plan.find(p => p.key === 'occupancy')?.value).toBe('Owner (Primary Residence)');
    // [L145] Assert that `plan.find(p => p.key === 'lastValuationDate')?.value` strictly equals "01/20/2026".
    expect(plan.find(p => p.key === 'lastValuationDate')?.value).toBe('01/20/2026');
    // [L146] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "selected from the loan program" strictly equals true.
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(true);
  // [L147] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L148] Register a parameterized test that "selects the supported appraisal product dynamically for %s without changing property or occupancy".
  it.each(['FHA', 'FHA Zero Down'] as const)('selects the supported appraisal product dynamically for %s without changing property or occupancy', (loanProgram) => {
    // [L149] Iterate const [propertyType, expectedProduct] over an array containing an array containing "Single Family", "1004 SFR - FHA", an array containing "Condominium", "1073 CONDO FHA", an array containing "Manufactured Home", "1004C Manuf - FHA", an array containing "Two To Four Family", "1025 Multi - FHA".
    for (const [propertyType, expectedProduct] of [
      // [L150] Provide a parameterized test row with ['Single Family', '1004 SFR - FHA'],; the test receives these values as its inputs and expectations.
      ['Single Family', '1004 SFR - FHA'],
      // [L151] Provide a parameterized test row with ['Condominium', '1073 CONDO FHA'],; the test receives these values as its inputs and expectations.
      ['Condominium', '1073 CONDO FHA'],
      // [L152] Provide a parameterized test row with ['Manufactured Home', '1004C Manuf - FHA'],; the test receives these values as its inputs and expectations.
      ['Manufactured Home', '1004C Manuf - FHA'],
      // [L153] Provide a parameterized test row with ['Two To Four Family', '1025 Multi - FHA'],; the test receives these values as its inputs and expectations.
      ['Two To Four Family', '1025 Multi - FHA'],
    // [L154] Iterate const product over an array containing null (unknown or absent), "", " \t ".
    ] as const) for (const product of [null, '', ' \t ']) {
      // [L155] Declare `order` as an object whose fields are defined below.
      const order = { ...sourceOrder, loanProgram, loanProgramText: loanProgram, loanType: 'Fixed Rate', propertyType, product,
        // [L156] Set fixture property `evidence` to the result of `sourceOrder.evidence.map` using a callback that returns an object containing values copied from `item`, quote: `loanProgram` when `item.field` strictly equals `'loanProgram'`, otherwise `item`.
        evidence: sourceOrder.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item) };
      // [L157] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `order`, an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, { ...input, fhaCaseNumber: '123-4567890' }, true);
      // [L158] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: `expectedProduct`, kind: "select", required: true.
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: expectedProduct, kind: 'select', required: true });
      // [L159] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "loanType" contains the expected object fields an object containing value: "FHA", required: true.
      expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: 'FHA', required: true });
      // [L160] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "propertyType" contains the expected object fields an object containing value: `propertyType`, required: true.
      expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: propertyType, required: true });
      // [L161] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      // [L162] Assert that `missingRequiredFields` does not satisfy: contains "product".
      expect(missingRequiredFields).not.toContain('product');
      // [L163] Assert that `warnings` contains text interpolating `expectedProduct`.
      expect(warnings).toContain(`Product ${expectedProduct} was selected from the loan program and property type. Confirm that it matches the lender's appraisal requirements.`);
      // [L164] Run the following branch when `propertyType` strictly equals "Condominium". Assert that `plan.find(field => field.key === 'product')?.allowedLabels` or, if null/undefined, an empty array deeply equals an empty array.
      if (propertyType === 'Condominium') expect(plan.find(field => field.key === 'product')?.allowedLabels ?? []).toEqual([]);
    // [L165] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L166] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L167] Register a parameterized test that "approves only the equivalent FHA product labels %s and %s while preserving the stated product".
  it.each([
    // [L168] Provide a parameterized test row with ['1004 SFR - FHA', '1004 SFR FHA'],; the test receives these values as its inputs and expectations.
    ['1004 SFR - FHA', '1004 SFR FHA'],
    // [L169] Provide a parameterized test row with ['1004C Manuf - FHA', '1004C Manuf FHA'],; the test receives these values as its inputs and expectations.
    ['1004C Manuf - FHA', '1004C Manuf FHA'],
    // [L170] Provide a parameterized test row with ['1025 Multi - FHA', '1025 Multi FHA'],; the test receives these values as its inputs and expectations.
    ['1025 Multi - FHA', '1025 Multi FHA'],
  // [L171] Apply the preceding scenario rows to the parameterized test "approves only the equivalent FHA product labels %s and %s while preserving the stated product" and begin its callback.
  ])('approves only the equivalent FHA product labels %s and %s while preserving the stated product', (canonical, alias) => {
    // [L172] Iterate const [product, equivalent] over an array containing an array containing `canonical`, `alias`, an array containing `alias`, `canonical`.
    for (const [product, equivalent] of [[canonical, alias], [alias, canonical]] as const) {
      // [L173] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object whose fields are defined below, an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
      const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product,
        // [L174] Set fixture property `evidence` to the result of `sourceOrder.evidence.map` using a callback that returns an object containing values copied from `item`, quote: ``Appraisal required: ${product}`` when `item.field` strictly equals `'product'`, otherwise `item`. Copy the entries of `input` into this fixture. Set fixture property `fhaCaseNumber` to "123-4567890".
        evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: `Appraisal required: ${product}` } : item) }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      // [L175] Declare `entry` as the result of `plan.find` using a callback that returns `field.key` strictly equals "product".
      const entry = plan.find(field => field.key === 'product');
      // [L176] Assert that `entry` contains the expected object fields an object containing value: `product`, kind: "select", required: true.
      expect(entry).toMatchObject({ value: product, kind: 'select', required: true });
      // [L177] Assert that `entry?.allowedLabels` contains `equivalent`.
      expect(entry?.allowedLabels).toContain(equivalent);
      // [L178] Assert that the result of `entry?.allowedLabels?.every` using a callback that returns the result of `[canonical, alias].includes` using `label` strictly equals true.
      expect(entry?.allowedLabels?.every(label => [canonical, alias].includes(label))).toBe(true);
      // [L179] Assert that `plan.find(field => field.key === 'propertyType')?.value` strictly equals `sourceOrder.propertyType`.
      expect(plan.find(field => field.key === 'propertyType')?.value).toBe(sourceOrder.propertyType);
      // [L180] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      // [L181] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "selected from the loan program" strictly equals false.
      expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    // [L182] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L183] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L184] Register a parameterized test that "does not infer a single-family product from %s alone".
  it.each(['FHA', 'FHA Zero Down'] as const)('does not infer a single-family product from %s alone', (loanProgram) => {
    // [L185] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanProgram, loanProgramText: `loanProgram`, propertyType: null (unknown or absent), product: null (unknown or absent), an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanProgram, loanProgramText: loanProgram, propertyType: null, product: null }, { ...input, fhaCaseNumber: '123-4567890' }, true);
    // [L186] Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals `'product'` or `field.key` strictly equals `'propertyType'` strictly equals false.
    expect(plan.some(field => field.key === 'product' || field.key === 'propertyType')).toBe(false);
    // [L187] Assert that `missingRequiredFields` deeply equals the result of `expect.arrayContaining` using an array containing "product", "propertyType".
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['product', 'propertyType']));
    // [L188] Assert that `plan.find(field => field.key === 'loanType')?.value` strictly equals "FHA".
    expect(plan.find(field => field.key === 'loanType')?.value).toBe('FHA');
    // [L189] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
    expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
  // [L190] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L191] Register a test that "preserves unusual stated appraisal products without granting FHA aliases".
  it('preserves unusual stated appraisal products without granting FHA aliases', () => {
    // [L192] Iterate const product over an array containing "Document-specific product", "1004 SFR FHA with completion report", "1004 SFR CONV".
    for (const product of ['Document-specific product', '1004 SFR FHA with completion report', '1004 SFR CONV']) {
      // [L193] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object whose fields are defined below, an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
      const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product,
        // [L194] Set fixture property `evidence` to the result of `sourceOrder.evidence.map` using a callback that returns an object containing values copied from `item`, quote: ``Appraisal required: ${product}`` when `item.field` strictly equals `'product'`, otherwise `item`. Copy the entries of `input` into this fixture. Set fixture property `fhaCaseNumber` to "123-4567890".
        evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: `Appraisal required: ${product}` } : item) }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      // [L195] Declare `entry` as the result of `plan.find` using a callback that returns `field.key` strictly equals "product".
      const entry = plan.find(field => field.key === 'product');
      // [L196] Assert that `entry?.value` strictly equals `product`.
      expect(entry?.value).toBe(product);
      // [L197] Assert that `entry?.allowedLabels` or, if null/undefined, an empty array deeply equals an empty array.
      expect(entry?.allowedLabels ?? []).toEqual([]);
      // [L198] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "selected from the loan program" strictly equals false.
      expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    // [L199] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L200] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L201] Register a parameterized test that "uses the URLA %s program instead of free-form loan type text".
  it.each(['Conventional', 'FHA', 'FHA Zero Down'] as const)('uses the URLA %s program instead of free-form loan type text', (loanProgram) => {
    // [L202] Declare `order` as an object whose fields are defined below.
    const order = { ...sourceOrder, loanProgram, loanProgramText: loanProgram,
      // [L203] Set fixture property `evidence` to the result of `sourceOrder.evidence.map` using a callback that returns an object containing values copied from `item`, quote: `loanProgram` when `item.field` strictly equals `'loanProgram'`, otherwise `item`.
      evidence: sourceOrder.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item) };
    // [L204] Iterate const loanType over an array containing null (unknown or absent), "", "  ", "Fixed Rate", "FHA" when `loanProgram` strictly equals "Conventional", otherwise "Conventional".
    for (const loanType of [null, '', '  ', 'Fixed Rate', loanProgram === 'Conventional' ? 'FHA' : 'Conventional']) {
      // [L205] Declare `{ plan }` as the result of `buildFieldPlan` using an object containing values copied from `order`, loanType, an object containing values copied from `input`, fhaCaseNumber: "123-4567890", true.
      const { plan } = buildFieldPlan({ ...order, loanType }, { ...input, fhaCaseNumber: '123-4567890' }, true);
      // [L206] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "loanType" contains the expected object fields an object containing value: "Conventional" when `loanProgram` strictly equals "Conventional", otherwise "FHA", kind: "select", required: true.
      expect(plan.find(field => field.key === 'loanType')).toMatchObject({ value: loanProgram === 'Conventional' ? 'Conventional' : 'FHA', kind: 'select', required: true });
    // [L207] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L208] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L209] Register a parameterized test that "maps explicit property description %s before inferring a product".
  it.each([
    // [L210] Provide a parameterized test row with [' Single-family detached residence ', 'Single Family', '1004 SFR CONV'],; the test receives these values as its inputs and expectations.
    [' Single-family detached residence ', 'Single Family', '1004 SFR CONV'],
    // [L211] Provide a parameterized test row with ['DETACHED SINGLE FAMILY HOME', 'Single Family', '1004 SFR CONV'],; the test receives these values as its inputs and expectations.
    ['DETACHED SINGLE FAMILY HOME', 'Single Family', '1004 SFR CONV'],
    // [L212] Provide a parameterized test row with ['Single\u2011family residence', 'Single Family', '1004 SFR CONV'],; the test receives these values as its inputs and expectations.
    ['Single\u2011family residence', 'Single Family', '1004 SFR CONV'],
    // [L213] Provide a parameterized test row with ['single   family home', 'Single Family', '1004 SFR CONV'],; the test receives these values as its inputs and expectations.
    ['single   family home', 'Single Family', '1004 SFR CONV'],
    // [L214] Provide a parameterized test row with ['Condominium Unit', 'Condominium', '1073 CONDO CONV'],; the test receives these values as its inputs and expectations.
    ['Condominium Unit', 'Condominium', '1073 CONDO CONV'],
    // [L215] Provide a parameterized test row with ['Manufactured housing', 'Manufactured Home', '1004C MANU CONV'],; the test receives these values as its inputs and expectations.
    ['Manufactured housing', 'Manufactured Home', '1004C MANU CONV'],
    // [L216] Provide a parameterized test row with ['2\u20134 units', 'Two To Four Family', '1025 Multi-Family CONV'],; the test receives these values as its inputs and expectations.
    ['2\u20134 units', 'Two To Four Family', '1025 Multi-Family CONV'],
  // [L217] Apply the preceding scenario rows to the parameterized test "maps explicit property description %s before inferring a product" and begin its callback.
  ])('maps explicit property description %s before inferring a product', (propertyType, expectedProperty, expectedProduct) => {
    // [L218] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, propertyType, product: " \t ", `input`, true.
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType, product: ' \t ' }, input, true);
    // [L219] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "propertyType" contains the expected object fields an object containing value: `expectedProperty`, required: true.
    expect(plan.find(field => field.key === 'propertyType')).toMatchObject({ value: expectedProperty, required: true });
    // [L220] Assert that `plan.find(field => field.key === 'product')?.value` strictly equals `expectedProduct`.
    expect(plan.find(field => field.key === 'product')?.value).toBe(expectedProduct);
    // [L221] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "selected from the loan program" strictly equals true.
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(true);
  // [L222] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L223] Register a parameterized test that "leaves ambiguous or unsupported property description %s unresolved".
  it.each(['1 unit', 'One Unit', 'Detached', 'PUD', 'Modular Home', 'Single Family / Condominium', 'constructor'])('leaves ambiguous or unsupported property description %s unresolved', (propertyType) => {
    // [L224] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, propertyType, product: "", `input`, true.
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType, product: '' }, input, true);
    // [L225] Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals `'propertyType'` or `field.key` strictly equals `'product'` strictly equals false.
    expect(plan.some(field => field.key === 'propertyType' || field.key === 'product')).toBe(false);
    // [L226] Assert that `warnings` contains "The document property type could not be mapped to an inspected R3 option. Select it during review.".
    expect(warnings).toContain('The document property type could not be mapped to an inspected R3 option. Select it during review.');
  // [L227] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L228] Register a test that "preserves a stated product and distinguishes townhouse from single family".
  it('preserves a stated product and distinguishes townhouse from single family', () => {
    // [L229] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object whose fields are defined below, `input`, true.
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, propertyType: 'Townhouse or Rowhouse', product: 'Document-specific product',
      // [L230] Set fixture property `evidence` to the result of `sourceOrder.evidence.map` using a callback that returns an object containing values copied from `item`, quote: `'Appraisal required: Document-specific product'` when `item.field` strictly equals `'product'`, otherwise `item`.
      evidence: sourceOrder.evidence.map(item => item.field === 'product' ? { ...item, quote: 'Appraisal required: Document-specific product' } : item) }, input, true);
    // [L231] Assert that `plan.find(field => field.key === 'propertyType')?.value` strictly equals "Townhouse or Rowhouse".
    expect(plan.find(field => field.key === 'propertyType')?.value).toBe('Townhouse or Rowhouse');
    // [L232] Assert that `plan.find(field => field.key === 'product')?.value` strictly equals "Document-specific product".
    expect(plan.find(field => field.key === 'product')?.value).toBe('Document-specific product');
    // [L233] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "selected from the loan program" strictly equals false.
    expect(warnings.some(warning => warning.includes('selected from the loan program'))).toBe(false);
    // [L234] Assert that the result of `buildFieldPlan({ ...sourceOrder, propertyType: 'townhouse', product: null }, input, true).plan.some` using a callback that returns `field.key` strictly equals "product" strictly equals false.
    expect(buildFieldPlan({ ...sourceOrder, propertyType: 'townhouse', product: null }, input, true).plan.some(field => field.key === 'product')).toBe(false);
  // [L235] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L236] Register a test that "leaves Other programs for review without adopting unsupported loan type text".
  it('leaves Other programs for review without adopting unsupported loan type text', () => {
    // [L237] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanProgram: "Other", loanProgramText: "Other program", loanType: "Fixed Rate", `input`, true.
    const { plan, warnings } = buildFieldPlan({ ...sourceOrder, loanProgram: 'Other', loanProgramText: 'Other program', loanType: 'Fixed Rate' }, input, true);
    // [L238] Assert that the result of `plan.some` using a callback that returns `field.key` strictly equals "loanType" strictly equals false.
    expect(plan.some(field => field.key === 'loanType')).toBe(false);
    // [L239] Assert that `warnings` contains "Missing document information: loanType. Complete this during review.".
    expect(warnings).toContain('Missing document information: loanType. Complete this during review.');
  // [L240] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L241] Register a parameterized test that "uses the correct %s access contact and keeps both agent sections distinct".
  it.each(['Purchase', 'Refinance'] as const)('uses the correct %s access contact and keeps both agent sections distinct', (loanPurpose) => {
    // [L242] Declare `listingAgent` as an object containing values copied from `emptyContact`, firstName: "Lena", lastName: "Listing", mobilePhone: "7025550111", email: "listing@example.test".
    const listingAgent = { ...emptyContact, firstName: 'Lena', lastName: 'Listing', mobilePhone: '7025550111', email: 'listing@example.test' };
    // [L243] Declare `buyerAgent` as an object containing values copied from `emptyContact`, firstName: "Bailey", lastName: "Buyeragent", workPhone: "7025550222", email: "buyeragent@example.test".
    const buyerAgent = { ...emptyContact, firstName: 'Bailey', lastName: 'Buyeragent', workPhone: '7025550222', email: 'buyeragent@example.test' };
    // [L244] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose, listingAgent, buyerAgent, `input`, true.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, listingAgent, buyerAgent }, input, true);
    // [L245] Declare `expectedAccess` as `listingAgent` when `loanPurpose` strictly equals "Purchase", otherwise `sourceOrder.borrower`.
    const expectedAccess = loanPurpose === 'Purchase' ? listingAgent : sourceOrder.borrower;
    // [L246] Iterate const [section, expected] over the result of `Object.entries` using an object containing contact: `expectedAccess`, listingAgent, buyerAgent.
    for (const [section, expected] of Object.entries({ contact: expectedAccess, listingAgent, buyerAgent })) {
      // [L247] For every expected contact value, assert the matching section field-plan entry equals that value, replacing null or undefined with an explicit empty string.
      for (const [key, value] of Object.entries(expected)) expect(plan.find(field => field.key === `${section}.${key}`)?.value).toBe(value ?? '');
    // [L248] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L249] Assert that `plan.find(field => field.key === 'borrowerIsAccessContact')?.value` strictly equals `loanPurpose` strictly equals "Refinance".
    expect(plan.find(field => field.key === 'borrowerIsAccessContact')?.value).toBe(loanPurpose === 'Refinance');
    // [L250] Assert that the result of `missingRequiredFields.filter` using a callback that returns the result of `key.startsWith` using "contact." deeply equals an empty array.
    expect(missingRequiredFields.filter(key => key.startsWith('contact.'))).toEqual([]);
    // [L251] Assert that `new Set(plan.map(field => field.key)).size` strictly equals `plan.length`.
    expect(new Set(plan.map(field => field.key)).size).toBe(plan.length);
  // [L252] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L253] Register a parameterized test that "accepts a supported %s as the only borrower and access contact channel".
  it.each(['workPhone', 'homePhone', 'mobilePhone', 'email'] as const)('accepts a supported %s as the only borrower and access contact channel', (channel) => {
    // [L254] Declare `supportedContact` as an object containing values copied from `emptyContact`, firstName: "Known", lastName: "Person", [channel]: "contact@example.test" when `channel` strictly equals "email", otherwise "7025550333".
    const supportedContact = { ...emptyContact, firstName: 'Known', lastName: 'Person', [channel]: channel === 'email' ? 'contact@example.test' : '7025550333' };
    // [L255] Iterate const loanPurpose over an array containing "Purchase", "Refinance".
    for (const loanPurpose of ['Purchase', 'Refinance'] as const) {
      // [L256] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose, borrower: `supportedContact`, listingAgent: `supportedContact`, `input`, true.
      const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose, borrower: supportedContact, listingAgent: supportedContact }, input, true);
      // [L257] Assert that the result of `missingRequiredFields.filter` using a callback that returns the result of `key.startsWith` using `'borrower.'` or the result of `key.startsWith` using `'contact.'` deeply equals an empty array.
      expect(missingRequiredFields.filter(key => key.startsWith('borrower.') || key.startsWith('contact.'))).toEqual([]);
      // [L258] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals text interpolating `channel` contains the expected object fields an object containing value: `supportedContact[channel]`, required: true.
      expect(plan.find(field => field.key === `contact.${channel}`)).toMatchObject({ value: supportedContact[channel], required: true });
      // [L259] Iterate const other over the result of `['workPhone', 'homePhone', 'mobilePhone', 'email'].filter` using a callback that returns `key` does not strictly equal `channel`.
      for (const other of ['workPhone', 'homePhone', 'mobilePhone', 'email'].filter(key => key !== channel)) {
        // [L260] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals text interpolating `other` contains the expected object fields an object containing value: "", required: false.
        expect(plan.find(field => field.key === `contact.${other}`)).toMatchObject({ value: '', required: false });
      // [L261] Close the callback or control-flow body and finish the surrounding syntax.
      }
    // [L262] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L263] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L264] Register a test that "requires an access name and reachable channel without substituting a different person".
  it('requires an access name and reachable channel without substituting a different person', () => {
    // [L265] Declare `listingAgent` as an object containing values copied from `emptyContact`, firstName: "Only", lastName: " \t ".
    const listingAgent = { ...emptyContact, firstName: 'Only', lastName: ' \t ' };
    // [L266] Declare `buyerAgent` as an object containing values copied from `contact`, firstName: "Different", lastName: "Agent".
    const buyerAgent = { ...contact, firstName: 'Different', lastName: 'Agent' };
    // [L267] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, listingAgent, buyerAgent, `input`, true.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, listingAgent, buyerAgent }, input, true);
    // [L268] Assert that `missingRequiredFields` deeply equals the result of `expect.arrayContaining` using an array containing "contact.lastName", "contact.phoneOrEmail".
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['contact.lastName', 'contact.phoneOrEmail']));
    // [L269] Assert that `plan.find(field => field.key === 'contact.firstName')?.value` strictly equals "Only".
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('Only');
    // [L270] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "contact.lastName" contains the expected object fields an object containing value: "", required: false.
    expect(plan.find(field => field.key === 'contact.lastName')).toMatchObject({ value: '', required: false });
    // [L271] Assert that `plan.find(field => field.key === 'contact.mobilePhone')?.value` strictly equals "".
    expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe('');
    // [L272] Assert that `plan.find(field => field.key === 'contact.email')?.value` strictly equals "".
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe('');
    // [L273] Assert that `plan.find(field => field.key === 'buyerAgent.mobilePhone')?.value` strictly equals `buyerAgent.mobilePhone`.
    expect(plan.find(field => field.key === 'buyerAgent.mobilePhone')?.value).toBe(buyerAgent.mobilePhone);
  // [L274] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L275] Register a test that "omits empty agent sections but preserves partial supported agent facts".
  it('omits empty agent sections but preserves partial supported agent facts', () => {
    // [L276] Declare `{ plan }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose: "Refinance", listingAgent: `emptyContact`, buyerAgent: an object containing values copied from `emptyContact`, email: "supported@example.test", `input`, false.
    const { plan } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance', listingAgent: emptyContact, buyerAgent: { ...emptyContact, email: 'supported@example.test' } }, input, false);
    // [L277] Assert that the result of `plan.some` using a callback that returns the result of `field.key.startsWith` using "listingAgent." strictly equals false.
    expect(plan.some(field => field.key.startsWith('listingAgent.'))).toBe(false);
    // [L278] Assert that `plan.find(field => field.key === 'buyerAgent.email')?.value` strictly equals "supported@example.test".
    expect(plan.find(field => field.key === 'buyerAgent.email')?.value).toBe('supported@example.test');
    // [L279] Assert that `plan.find(field => field.key === 'buyerAgent.firstName')?.value` strictly equals "".
    expect(plan.find(field => field.key === 'buyerAgent.firstName')?.value).toBe('');
    // [L280] Assert that `plan.find(field => field.key === 'contact.email')?.value` strictly equals `sourceOrder.borrower.email`.
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe(sourceOrder.borrower.email);
  // [L281] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L282] Register a test that "leaves access contact unresolved when the loan purpose is not purchase or refinance".
  it('leaves access contact unresolved when the loan purpose is not purchase or refinance', () => {
    // [L283] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose: "Other", `input`, true.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Other' }, input, true);
    // [L284] Assert that `plan.find(field => field.key === 'contact.firstName')?.value` strictly equals "".
    expect(plan.find(field => field.key === 'contact.firstName')?.value).toBe('');
    // [L285] Assert that `plan.find(field => field.key === 'contact.email')?.value` strictly equals "".
    expect(plan.find(field => field.key === 'contact.email')?.value).toBe('');
    // [L286] Assert that `missingRequiredFields` deeply equals the result of `expect.arrayContaining` using an array containing "contact.firstName", "contact.lastName", "contact.phoneOrEmail".
    expect(missingRequiredFields).toEqual(expect.arrayContaining(['contact.firstName', 'contact.lastName', 'contact.phoneOrEmail']));
  // [L287] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L288] Register a test that "clears missing borrower names before refinance access copying while retaining incomplete-source review".
  it('clears missing borrower names before refinance access copying while retaining incomplete-source review', () => {
    // [L289] Declare `borrower` as an object containing values copied from `contact`, firstName: null (unknown or absent), lastName: " \t ".
    const borrower = { ...contact, firstName: null, lastName: ' \t ' };
    // [L290] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `sourceOrder`, loanPurpose: "Refinance", borrower, `input`, false.
    const { plan, missingRequiredFields } = buildFieldPlan({ ...sourceOrder, loanPurpose: 'Refinance', borrower }, input, false);
    // [L291] Iterate const key over an array containing "borrower.firstName", "borrower.lastName", "contact.firstName", "contact.lastName".
    for (const key of ['borrower.firstName', 'borrower.lastName', 'contact.firstName', 'contact.lastName']) {
      // [L292] Assert that the result of `plan.filter` using a callback that returns `field.key` strictly equals `key` deeply equals an array containing an object containing key, value: "", kind: "text", required: false.
      expect(plan.filter(field => field.key === key)).toEqual([{ key, value: '', kind: 'text', required: false }]);
      // [L293] Assert that `missingRequiredFields` contains `key`.
      expect(missingRequiredFields).toContain(key);
    // [L294] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L295] Assert that `plan.find(field => field.key === 'contact.mobilePhone')?.value` strictly equals `contact.mobilePhone`.
    expect(plan.find(field => field.key === 'contact.mobilePhone')?.value).toBe(contact.mobilePhone);
  // [L296] Close the callback or control-flow body and finish the surrounding syntax.
  });
  // [L297] Register a test that "validates structured extraction and rejects disguised uploads".
  it('validates structured extraction and rejects disguised uploads', () => {
    // [L298] Assert that `extractionSchema.safeParse(sourceOrder).success` strictly equals true.
    expect(extractionSchema.safeParse(sourceOrder).success).toBe(true);
    // [L299] Assert that a callback that returns the result of `validatePdf` using an object containing name: "test.pdf", buffer: the result of `Buffer.from` using `'<html>no PDF</html>'` throws an error matching "valid PDF".
    expect(() => validatePdf({ name: 'test.pdf', buffer: Buffer.from('<html>no PDF</html>') })).toThrow('valid PDF');
  // [L300] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L301] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L302] Blank line separating the surrounding declarations, statements, or document blocks.

// [L303] Group regression tests for "appraisal product recommendation provenance".
describe('appraisal product recommendation provenance', () => {
  // [L304] Declare `fhaInput` as an object containing values copied from `input`, fhaCaseNumber: "123-4567890".
  const fhaInput = { ...input, fhaCaseNumber: '123-4567890' };
  // [L305] Declare `recommendationEvidence` as an object whose fields are defined below.
  const recommendationEvidence: ExtractedOrder['evidence'][number] = {
    // [L306] Set fixture property `field` to "productRecommendation". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to "FHA; Number of Units: 1; Manufactured Home: No; Construction: Site Built".
    field: 'productRecommendation', document: 'urla', page: 1, quote: 'FHA; Number of Units: 1; Manufactured Home: No; Construction: Site Built',
  // [L307] Close the fixture object for `recommendationEvidence` and finish the surrounding syntax.
  };
  // [L308] Declare `recommendation` as a callback that returns an object whose fields are defined below.
  const recommendation = (overrides: Partial<ExtractedOrder> = {}): ExtractedOrder => ({
    // [L309] Copy the entries of `sourceOrder` into this fixture. Set fixture property `loanProgram` to "FHA". Set fixture property `loanProgramText` to "FHA". Set fixture property `product` to "1004 SFR - FHA". Set fixture property `propertyType` to null (unknown or absent).
    ...sourceOrder, loanProgram: 'FHA', loanProgramText: 'FHA', product: '1004 SFR - FHA', propertyType: null,
    // [L310] Set fixture property `evidence` to an array containing `...sourceOrder.evidence.filter(item => item.field !== 'product') .map(item => item.field === 'loanProgram' ? { ...item, quote: 'FHA' } : item)`, `recommendationEvidence`.
    evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
      // [L311] Copy the entries of `item` into this fixture. Set fixture property `quote` to "FHA".
      .map(item => item.field === 'loanProgram' ? { ...item, quote: 'FHA' } : item), recommendationEvidence],
    // [L312] Copy the entries of `overrides` into this fixture.
    ...overrides,
  // [L313] Close the fixture object and finish the surrounding syntax.
  });
// [L314] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L315] Register a parameterized test that "allows a supported %s recommendation while keeping unknown property type unresolved".
  it.each(['FHA', 'FHA Zero Down'] as const)('allows a supported %s recommendation while keeping unknown property type unresolved', (loanProgram) => {
    // [L316] Iterate const document over an array containing "urla", "salesContract".
    for (const document of ['urla', 'salesContract'] as const) for (const hasContract of document === 'urla' ? [false, true] : [true]) {
      // [L317] Declare `order` as the result of `recommendation` using an object whose fields are defined below.
      const order = recommendation({ loanProgram, loanProgramText: loanProgram,
        // [L318] Set fixture property `evidence` to an array containing `...sourceOrder.evidence.filter(item => item.field !== 'product') .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item)`, an object containing values copied from `recommendationEvidence`, document.
        evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
          // [L319] Copy the entries of `item` into this fixture. Set fixture property `quote` to `loanProgram`. Copy the entries of `recommendationEvidence` into this fixture. Include the current `document` value under the same property name.
          .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item), { ...recommendationEvidence, document }],
        // [L320] Set fixture property `warnings` to the result of `Array.from` using an object containing length: 14, a callback that returns text interpolating `index` plus `1`.
        warnings: Array.from({ length: 14 }, (_, index) => `Source warning ${index + 1}`),
      // [L321] Close the fixture object and finish the surrounding syntax.
      });
      // [L322] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `order`, `fhaInput`, `hasContract`.
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, fhaInput, hasContract);
      // [L323] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: "1004 SFR - FHA", kind: "select", required: true.
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: '1004 SFR - FHA', kind: 'select', required: true });
      // [L324] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "propertyType" is undefined.
      expect(plan.find(field => field.key === 'propertyType')).toBeUndefined();
      // [L325] Assert that `missingRequiredFields` contains "propertyType".
      expect(missingRequiredFields).toContain('propertyType');
      // [L326] Assert that `missingRequiredFields` does not satisfy: contains "product".
      expect(missingRequiredFields).not.toContain('product');
      // [L327] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      // [L328] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using `'agent recommendation'` and the result of `warning.includes` using `'Confirm the property classification'` strictly equals true.
      expect(warnings.some(warning => warning.includes('agent recommendation') && warning.includes('Confirm the property classification'))).toBe(true);
      // [L329] Assert that `order.propertyType` is null.
      expect(order.propertyType).toBeNull();
      // [L330] Assert that `order.warnings` has length 14.
      expect(order.warnings).toHaveLength(14);
    // [L331] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L332] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L333] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L334] Register a parameterized test that "accepts each inspected product family only when consistent with %s and the stated property".
  it.each(['Conventional', 'FHA', 'FHA Zero Down'] as const)('accepts each inspected product family only when consistent with %s and the stated property', (loanProgram) => {
    // [L335] Iterate const [propertyType, conventionalProduct, fhaProduct] over an array containing an array containing "Single Family", "1004 SFR CONV", "1004 SFR - FHA", an array containing "Condominium", "1073 CONDO CONV", "1073 CONDO FHA", an array containing "Manufactured Home", "1004C MANU CONV", "1004C Manuf - FHA", an array containing "Two To Four Family", "1025 Multi-Family CONV", "1025 Multi - FHA".
    for (const [propertyType, conventionalProduct, fhaProduct] of [
      // [L336] Provide a parameterized test row with ['Single Family', '1004 SFR CONV', '1004 SFR - FHA'],; the test receives these values as its inputs and expectations.
      ['Single Family', '1004 SFR CONV', '1004 SFR - FHA'],
      // [L337] Provide a parameterized test row with ['Condominium', '1073 CONDO CONV', '1073 CONDO FHA'],; the test receives these values as its inputs and expectations.
      ['Condominium', '1073 CONDO CONV', '1073 CONDO FHA'],
      // [L338] Provide a parameterized test row with ['Manufactured Home', '1004C MANU CONV', '1004C Manuf - FHA'],; the test receives these values as its inputs and expectations.
      ['Manufactured Home', '1004C MANU CONV', '1004C Manuf - FHA'],
      // [L339] Provide a parameterized test row with ['Two To Four Family', '1025 Multi-Family CONV', '1025 Multi - FHA'],; the test receives these values as its inputs and expectations.
      ['Two To Four Family', '1025 Multi-Family CONV', '1025 Multi - FHA'],
    // [L340] Finish the scenario array and begin the loop body that checks each listed case.
    ] as const) {
      // [L341] Declare `product` as `conventionalProduct` when `loanProgram` strictly equals "Conventional", otherwise `fhaProduct`.
      const product = loanProgram === 'Conventional' ? conventionalProduct : fhaProduct;
      // [L342] Declare `order` as the result of `recommendation` using an object whose fields are defined below.
      const order = recommendation({ loanProgram, loanProgramText: loanProgram, propertyType, product,
        // [L343] Set fixture property `evidence` to an array containing `...sourceOrder.evidence.filter(item => item.field !== 'product') .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item)`, an object containing values copied from `recommendationEvidence`, quote: text interpolating `loanProgram`, `propertyType`.
        evidence: [...sourceOrder.evidence.filter(item => item.field !== 'product')
          // [L344] Copy the entries of `item` into this fixture. Set fixture property `quote` to `loanProgram`. Copy the entries of `recommendationEvidence` into this fixture. Set fixture property `quote` to text interpolating `loanProgram`, `propertyType`.
          .map(item => item.field === 'loanProgram' ? { ...item, quote: loanProgram } : item), { ...recommendationEvidence, quote: `${loanProgram}; Property type: ${propertyType}` }],
      // [L345] Close the fixture object and finish the surrounding syntax.
      });
      // [L346] Declare `{ plan, warnings, missingRequiredFields }` as the result of `buildFieldPlan` using `order`, `fhaInput`, true.
      const { plan, warnings, missingRequiredFields } = buildFieldPlan(order, fhaInput, true);
      // [L347] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" contains the expected object fields an object containing value: `product`, required: true.
      expect(plan.find(field => field.key === 'product')).toMatchObject({ value: product, required: true });
      // [L348] Assert that `plan.find(field => field.key === 'propertyType')?.value` strictly equals `propertyType`.
      expect(plan.find(field => field.key === 'propertyType')?.value).toBe(propertyType);
      // [L349] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
      // [L350] Assert that `missingRequiredFields` does not satisfy: contains "product".
      expect(missingRequiredFields).not.toContain('product');
      // [L351] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "agent recommendation" strictly equals true.
      expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(true);
    // [L352] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L353] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L354] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L355] Register a test that "accepts only the finite FHA punctuation aliases for recommendations".
  it('accepts only the finite FHA punctuation aliases for recommendations', () => {
    // [L356] Iterate const [product, canonical] over an array containing an array containing "1004 SFR FHA", "1004 SFR - FHA", an array containing "1004C Manuf FHA", "1004C Manuf - FHA", an array containing "1025 Multi FHA", "1025 Multi - FHA".
    for (const [product, canonical] of [
      // [L357] Provide a parameterized test row with ['1004 SFR FHA', '1004 SFR - FHA'], ['1004C Manuf FHA', '1004C Manuf - FHA'], ['1025 Multi FHA', '1025 Multi - FHA'],; the test receives these values as its inputs and expectations.
      ['1004 SFR FHA', '1004 SFR - FHA'], ['1004C Manuf FHA', '1004C Manuf - FHA'], ['1025 Multi FHA', '1025 Multi - FHA'],
    // [L358] Finish the scenario array and begin the loop body that checks each listed case.
    ] as const) {
      // [L359] Declare `{ plan }` as the result of `buildFieldPlan` using the result of `recommendation` using an object containing product, `fhaInput`, true.
      const { plan } = buildFieldPlan(recommendation({ product }), fhaInput, true);
      // [L360] Declare `entry` as the result of `plan.find` using a callback that returns `field.key` strictly equals "product".
      const entry = plan.find(field => field.key === 'product');
      // [L361] Assert that `entry` contains the expected object fields an object containing kind: "select", required: true.
      expect(entry).toMatchObject({ kind: 'select', required: true });
      // [L362] Assert that an array containing `entry?.value`, `...(entry?.allowedLabels ?? [])` contains `canonical`.
      expect([entry?.value, ...(entry?.allowedLabels ?? [])]).toContain(canonical);
    // [L363] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L364] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L365] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L366] Register a test that "keeps malformed or mixed recommendation provenance out of the explicit-product and baseline paths".
  it('keeps malformed or mixed recommendation provenance out of the explicit-product and baseline paths', () => {
    // [L367] Declare `base` as the result of `recommendation` using an object containing propertyType: "Single Family".
    const base = recommendation({ propertyType: 'Single Family' });
    // [L368] Declare `classificationEvidence` as the result of `base.evidence.filter` using a callback that returns `item.field` does not strictly equal "productRecommendation".
    const classificationEvidence = base.evidence.filter(item => item.field !== 'productRecommendation');
    // [L369] Declare `explicitEvidence` as an object containing field: "product", document: "urla", page: 1, quote: "Appraisal: 1004 SFR - FHA".
    const explicitEvidence: ExtractedOrder['evidence'][number] = { field: 'product', document: 'urla', page: 1, quote: 'Appraisal: 1004 SFR - FHA' };
    // [L370] Begin evidence-validation scenarios for proposed appraisal products, pairing each product/evidence combination with whether a contract was supplied.
    const cases: Array<{ name: string; product: string | null; evidence: ExtractedOrder['evidence']; hasContract: boolean }> = [
      // [L371] Set fixture property `name` to "empty recommendation quote". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing an object containing values copied from `recommendationEvidence`, quote: " \t ". Set fixture property `hasContract` to true.
      { name: 'empty recommendation quote', product: base.product, evidence: [{ ...recommendationEvidence, quote: ' \t ' }], hasContract: true },
      // [L372] Set fixture property `name` to "citation to an absent contract". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing an object containing values copied from `recommendationEvidence`, document: "salesContract". Set fixture property `hasContract` to false.
      { name: 'citation to an absent contract', product: base.product, evidence: [{ ...recommendationEvidence, document: 'salesContract' }], hasContract: false },
      // [L373] Set fixture property `name` to "valid quote alongside an empty recommendation quote". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing `recommendationEvidence`, an object containing values copied from `recommendationEvidence`, quote: "". Set fixture property `hasContract` to true.
      { name: 'valid quote alongside an empty recommendation quote', product: base.product, evidence: [recommendationEvidence, { ...recommendationEvidence, quote: '' }], hasContract: true },
      // [L374] Set fixture property `name` to "URLA quote alongside citation to an absent contract". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing `recommendationEvidence`, an object containing values copied from `recommendationEvidence`, document: "salesContract". Set fixture property `hasContract` to false.
      { name: 'URLA quote alongside citation to an absent contract', product: base.product, evidence: [recommendationEvidence, { ...recommendationEvidence, document: 'salesContract' }], hasContract: false },
      // [L375] Set fixture property `name` to "mixed explicit and recommendation citations". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing `recommendationEvidence`, `explicitEvidence`. Set fixture property `hasContract` to true.
      { name: 'mixed explicit and recommendation citations', product: base.product, evidence: [recommendationEvidence, explicitEvidence], hasContract: true },
      // [L376] Set fixture property `name` to "malformed recommendation beside valid explicit citation". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing an object containing values copied from `recommendationEvidence`, quote: "", `explicitEvidence`. Set fixture property `hasContract` to true.
      { name: 'malformed recommendation beside valid explicit citation', product: base.product, evidence: [{ ...recommendationEvidence, quote: '' }, explicitEvidence], hasContract: true },
      // [L377] Set fixture property `name` to "missing recommended value". Set fixture property `product` to null (unknown or absent). Set fixture property `evidence` to an array containing `recommendationEvidence`. Set fixture property `hasContract` to true.
      { name: 'missing recommended value', product: null, evidence: [recommendationEvidence], hasContract: true },
      // [L378] Set fixture property `name` to "blank recommended value". Set fixture property `product` to " \t ". Set fixture property `evidence` to an array containing `recommendationEvidence`. Set fixture property `hasContract` to true.
      { name: 'blank recommended value', product: ' \t ', evidence: [recommendationEvidence], hasContract: true },
      // [L379] Set fixture property `name` to "unmarked product". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an empty array. Set fixture property `hasContract` to true.
      { name: 'unmarked product', product: base.product, evidence: [], hasContract: true },
      // [L380] Set fixture property `name` to "unrecognized provenance marker". Set fixture property `product` to `base.product`. Set fixture property `evidence` to an array containing an object containing values copied from `recommendationEvidence`, field: "ProductRecommendation". Set fixture property `hasContract` to true.
      { name: 'unrecognized provenance marker', product: base.product, evidence: [{ ...recommendationEvidence, field: 'ProductRecommendation' }], hasContract: true },
    // [L381] Close the array of fixture values for `cases` and finish the surrounding syntax.
    ];
    // [L382] Iterate const { name, product, evidence, hasContract } over `cases`.
    for (const { name, product, evidence, hasContract } of cases) {
      // [L383] Declare `{ plan, missingRequiredFields, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `base`, product, evidence: an array containing `...classificationEvidence`, `...evidence`, `fhaInput`, `hasContract`.
      const { plan, missingRequiredFields, warnings } = buildFieldPlan({ ...base, product, evidence: [...classificationEvidence, ...evidence] }, fhaInput, hasContract);
      // [L384] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" is undefined.
      expect(plan.find(field => field.key === 'product'), name).toBeUndefined();
      // [L385] Assert that `missingRequiredFields` contains "product".
      expect(missingRequiredFields, name).toContain('product');
      // [L386] Assert that the result of `warnings.some` using a callback that returns the result of `/product/i.test` using `warning` strictly equals true.
      expect(warnings.some(warning => /product/i.test(warning)), name).toBe(true);
      // [L387] Assert that `plan.find(field => field.key === 'propertyType')?.value` strictly equals "Single Family".
      expect(plan.find(field => field.key === 'propertyType')?.value, name).toBe('Single Family');
      // [L388] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value, name).toBe(sourceOrder.occupancy);
    // [L389] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L390] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L391] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L392] Register a test that "rejects unsupported, conflicting and wrong-program recommendations instead of guessing a substitute".
  it('rejects unsupported, conflicting and wrong-program recommendations instead of guessing a substitute', () => {
    // [L393] Declare `cases` as an array containing an object containing product: "FHA 30-year fixed", an object containing product: "1004 SFR FHA with completion report", an object containing product: "1004 SFR FHA / 1073 CONDO FHA", an object containing product: "1073 CONDO - FHA", an object containing product: "1004 SFR CONV", an object containing product: "1004 SFR USDA", an object containing loanProgram: "Conventional", loanProgramText: "Conventional", an object containing loanProgram: "Other", loanProgramText: "Other program", an object containing propertyType: "Condominium", an object containing propertyType: "Manufactured Home", an object containing propertyType: "Two To Four Family", an object containing propertyType: "Townhouse or Rowhouse", an object containing propertyType: "One Unit", an object containing propertyType: "Single Family / Condominium", an object containing propertyType: "PUD".
    const cases: Array<Partial<ExtractedOrder>> = [
      // [L394] Set fixture property `product` to "FHA 30-year fixed". Set fixture property `product` to "1004 SFR FHA with completion report".
      { product: 'FHA 30-year fixed' }, { product: '1004 SFR FHA with completion report' },
      // [L395] Set fixture property `product` to "1004 SFR FHA / 1073 CONDO FHA". Set fixture property `product` to "1073 CONDO - FHA".
      { product: '1004 SFR FHA / 1073 CONDO FHA' }, { product: '1073 CONDO - FHA' },
      // [L396] Set fixture property `product` to "1004 SFR CONV". Set fixture property `product` to "1004 SFR USDA".
      { product: '1004 SFR CONV' }, { product: '1004 SFR USDA' },
      // [L397] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanProgram` to "Other". Set fixture property `loanProgramText` to "Other program".
      { loanProgram: 'Conventional', loanProgramText: 'Conventional' }, { loanProgram: 'Other', loanProgramText: 'Other program' },
      // [L398] Set fixture property `propertyType` to "Condominium". Set fixture property `propertyType` to "Manufactured Home". Set fixture property `propertyType` to "Two To Four Family".
      { propertyType: 'Condominium' }, { propertyType: 'Manufactured Home' }, { propertyType: 'Two To Four Family' },
      // [L399] Set fixture property `propertyType` to "Townhouse or Rowhouse". Set fixture property `propertyType` to "One Unit".
      { propertyType: 'Townhouse or Rowhouse' }, { propertyType: 'One Unit' },
      // [L400] Set fixture property `propertyType` to "Single Family / Condominium". Set fixture property `propertyType` to "PUD".
      { propertyType: 'Single Family / Condominium' }, { propertyType: 'PUD' },
    // [L401] Close the array of fixture values for `cases` and finish the surrounding syntax.
    ];
    // [L402] Iterate const overrides over `cases`.
    for (const overrides of cases) {
      // [L403] Declare `order` as the result of `recommendation` using `overrides`.
      const order = recommendation(overrides);
      // [L404] Assign the result of `order.evidence.map` using a callback that returns an object containing values copied from `item`, quote: `order.loanProgramText!` when `item.field` strictly equals `'loanProgram'`, otherwise `item` to `order.evidence`.
      order.evidence = order.evidence.map(item => item.field === 'loanProgram' ? { ...item, quote: order.loanProgramText! } : item);
      // [L405] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using `order`, `fhaInput`, true.
      const { plan, missingRequiredFields } = buildFieldPlan(order, fhaInput, true);
      // [L406] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" is undefined.
      expect(plan.find(field => field.key === 'product'), JSON.stringify(overrides)).toBeUndefined();
      // [L407] Assert that `missingRequiredFields` contains "product".
      expect(missingRequiredFields, JSON.stringify(overrides)).toContain('product');
      // [L408] Assert that `plan.find(field => field.key === 'occupancy')?.value` strictly equals `sourceOrder.occupancy`.
      expect(plan.find(field => field.key === 'occupancy')?.value).toBe(sourceOrder.occupancy);
    // [L409] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L410] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L411] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L412] Register a test that "requires a supplied-document citation for explicit products without relabelling them as recommendations".
  it('requires a supplied-document citation for explicit products without relabelling them as recommendations', () => {
    // [L413] Declare `product` as "Document-specific appraisal with completion inspection".
    const product = 'Document-specific appraisal with completion inspection';
    // [L414] Declare `base` as an object containing values copied from `sourceOrder`, product.
    const base = { ...sourceOrder, product };
    // [L415] Declare `classificationEvidence` as the result of `sourceOrder.evidence.filter` using a callback that returns `item.field` does not strictly equal "product".
    const classificationEvidence = sourceOrder.evidence.filter(item => item.field !== 'product');
    // [L416] Iterate const document over an array containing "urla", "salesContract".
    for (const document of ['urla', 'salesContract'] as const) {
      // [L417] Declare `evidence` as an array containing `...classificationEvidence`, an object containing field: "product", document, page: 1, quote: text interpolating `product`.
      const evidence = [...classificationEvidence, { field: 'product', document, page: 1, quote: `Appraisal required: ${product}` }];
      // [L418] Declare `{ plan, warnings }` as the result of `buildFieldPlan` using an object containing values copied from `base`, evidence, `input`, true.
      const { plan, warnings } = buildFieldPlan({ ...base, evidence }, input, true);
      // [L419] Declare `entry` as the result of `plan.find` using a callback that returns `field.key` strictly equals "product".
      const entry = plan.find(field => field.key === 'product');
      // [L420] Assert that `entry` contains the expected object fields an object containing value: `product`, required: true.
      expect(entry).toMatchObject({ value: product, required: true });
      // [L421] Assert that `entry?.allowedLabels` or, if null/undefined, an empty array deeply equals an empty array.
      expect(entry?.allowedLabels ?? []).toEqual([]);
      // [L422] Assert that the result of `warnings.some` using a callback that returns the result of `warning.includes` using "agent recommendation" strictly equals false.
      expect(warnings.some(warning => warning.includes('agent recommendation'))).toBe(false);
    // [L423] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L424] Iterate const evidence over an array containing `classificationEvidence`, an array containing `...classificationEvidence`, an object containing field: "product", document: `'urla'`, page: 1, quote: " \t ", an array containing `...classificationEvidence`, an object containing field: "product", document: `'salesContract'`, page: 1, quote: `product`.
    for (const evidence of [
      // [L425] Include the supported property-classification evidence among the recommendation evidence cases.
      classificationEvidence,
      // [L426] Copy the entries of `classificationEvidence` into this fixture. Set fixture property `field` to "product". Set fixture property `document` to "urla". Set fixture property `page` to 1. Set fixture property `quote` to " \t ".
      [...classificationEvidence, { field: 'product', document: 'urla' as const, page: 1, quote: ' \t ' }],
      // [L427] Copy the entries of `classificationEvidence` into this fixture. Set fixture property `field` to "product". Set fixture property `document` to "salesContract". Set fixture property `page` to 1. Set fixture property `quote` to `product`.
      [...classificationEvidence, { field: 'product', document: 'salesContract' as const, page: 1, quote: product }],
    // [L428] Finish the scenario array and begin the loop body that checks each listed case.
    ]) {
      // [L429] Declare `{ plan, missingRequiredFields }` as the result of `buildFieldPlan` using an object containing values copied from `base`, evidence, `input`, false.
      const { plan, missingRequiredFields } = buildFieldPlan({ ...base, evidence }, input, false);
      // [L430] Assert that the result of `plan.find` using a callback that returns `field.key` strictly equals "product" is undefined.
      expect(plan.find(field => field.key === 'product')).toBeUndefined();
      // [L431] Assert that `missingRequiredFields` contains "product".
      expect(missingRequiredFields).toContain('product');
    // [L432] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L433] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L434] Close the callback or control-flow body and finish the surrounding syntax.
});
