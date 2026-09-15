import { describe, expect, it } from 'vitest';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { extractionSchema, type ExtractedOrder } from '../src/domain.js';
import { anthropicExtractionSchema, normalizeAnthropicExtraction } from '../src/extraction-schema.js';

type Node = Record<string, unknown>;
function schemaNodes(value: unknown, path = '$'): Array<{ path: string; node: Node }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const node = value as Node;
  return [{ path, node }, ...Object.entries(node).flatMap(([key, child]) => Array.isArray(child)
    ? child.flatMap((item, index) => schemaNodes(item, `${path}.${key}[${index}]`))
    : schemaNodes(child, `${path}.${key}`))];
}

const blankContact = { firstName: '', lastName: '', workPhone: '', homePhone: '', mobilePhone: '', email: '' };
const missingContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
const wire = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: '', propertyType: 'Single Family', occupancy: '  ',
  property: { address: '123 Synthetic St', unit: '', postalCode: '', city: '', state: '' },
  secondaryLoanNumber: '', loanType: '', lienPosition: '', loanAmount: 388000, salePrice: 485000,
  lastValuationAmount: null, lastValuationDate: '',
  borrower: { ...blankContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
  coBorrower: blankContact,
  listingAgent: { ...blankContact, firstName: 'Avery', lastName: 'Ellis', email: 'avery@example.test' },
  buyerAgent: { ...blankContact, firstName: 'Morgan', lastName: 'Rivera', workPhone: '7025550120' },
  complexProperty: false, highProfileCustomer: false,
  evidence: [{ field: 'salePrice', document: 'salesContract', page: 1, quote: '' }], warnings: [''],
};
const canonical: ExtractedOrder = {
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: null, propertyType: 'Single Family', occupancy: null,
  property: { address: '123 Synthetic St', unit: null, postalCode: null, city: null, state: null },
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000, salePrice: 485000,
  lastValuationAmount: null, lastValuationDate: null,
  borrower: { ...missingContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
  coBorrower: missingContact,
  listingAgent: { ...missingContact, firstName: 'Avery', lastName: 'Ellis', email: 'avery@example.test' },
  buyerAgent: { ...missingContact, firstName: 'Morgan', lastName: 'Rivera', workPhone: '7025550120' },
  complexProperty: false, highProfileCustomer: false,
  evidence: [{ field: 'salePrice', document: 'salesContract', page: 1, quote: '' }], warnings: [''],
};

describe('Anthropic extraction schema boundary', () => {
  it('preserves all canonical fields and required lists while reducing 40 unions to the three nullable amounts', () => {
    const original = schemaNodes(toJsonSchema(extractionSchema));
    const adapted = schemaNodes(anthropicExtractionSchema);
    const structure = (nodes: typeof original) => nodes.filter(({ node }) => node.properties).map(({ path, node }) => ({
      path, properties: Object.keys(node.properties as Node), required: node.required, additionalProperties: node.additionalProperties,
    }));
    expect(structure(adapted)).toEqual(structure(original));
    const union = ({ node }: typeof original[number]) => Array.isArray(node.type) || Array.isArray(node.anyOf);
    expect(original.filter(union)).toHaveLength(40);
    expect(adapted.filter(union).map(({ path }) => path)).toEqual([
      '$.properties.loanAmount', '$.properties.salePrice', '$.properties.lastValuationAmount',
    ]);
    const nullableText = original.filter(({ node }) => Array.isArray(node.type) && node.type.includes('string') && node.type.includes('null'));
    expect(nullableText).toHaveLength(37);
    for (const { path } of nullableText) expect(adapted.find(item => item.path === path)?.node.type).toBe('string');
  });

  it('decodes missing text without merging contacts, changing evidence/warnings, or mutating provider output', () => {
    const original = structuredClone(wire);
    const normalized = normalizeAnthropicExtraction(wire);
    expect(extractionSchema.parse(normalized)).toEqual(canonical);
    expect(wire).toEqual(original);
    expect(normalizeAnthropicExtraction(canonical)).toEqual(canonical);
  });

  it('keeps all three absent amounts null without filling them with zero', () => {
    const result = extractionSchema.parse(normalizeAnthropicExtraction({ ...wire, loanAmount: null, salePrice: null, lastValuationAmount: null }));
    expect([result.loanAmount, result.salePrice, result.lastValuationAmount]).toEqual([null, null, null]);
  });

  it('preserves invalid or missing fields so unchanged canonical validation rejects them', () => {
    const missingName = structuredClone(wire) as Record<string, unknown>;
    delete (missingName.borrower as Record<string, unknown>).lastName;
    const malformed = [
      missingName, { ...wire, salePrice: 0 }, { ...wire, loanAmount: '388000' }, { ...wire, lastValuationAmount: '' },
      { ...wire, loanProgram: '' }, { ...wire, loanPurpose: 'purchase' }, { ...wire, complexProperty: '' },
      { ...wire, borrower: { ...wire.borrower, firstName: 123 } },
      { ...wire, evidence: [{ ...wire.evidence[0], document: '' }] },
      { ...wire, evidence: [{ ...wire.evidence[0], page: 0 }] },
      { ...wire, evidence: [{ ...wire.evidence[0], quote: 'x'.repeat(301) }] }, { ...wire, warnings: [null] },
    ];
    for (const value of malformed) expect(extractionSchema.safeParse(normalizeAnthropicExtraction(value)).success).toBe(false);
    expect((normalizeAnthropicExtraction(missingName) as typeof wire).borrower).not.toHaveProperty('lastName');
  });
});
