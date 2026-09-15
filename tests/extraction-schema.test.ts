// [L1] Import { describe, expect, it } from "vitest" for these regression tests.
import { describe, expect, it } from 'vitest';
// [L2] Import { toJsonSchema } from "@langchain/core/utils/json_schema" for these regression tests.
import { toJsonSchema } from '@langchain/core/utils/json_schema';
// [L3] Import { extractionSchema, type ExtractedOrder } from "../src/domain.js" for these regression tests.
import { extractionSchema, type ExtractedOrder } from '../src/domain.js';
// [L4] Import { anthropicExtractionSchema, normalizeAnthropicExtraction } from "../src/extraction-schema.js" for these regression tests.
import { anthropicExtractionSchema, normalizeAnthropicExtraction } from '../src/extraction-schema.js';
// [L5] Blank line separating the surrounding declarations, statements, or document blocks.

// [L6] Define the TypeScript shape `Node` used by the test fixtures; this adds no runtime value.
type Node = Record<string, unknown>;
// [L7] Define helper `schemaNodes` with parameters value, path for the fixture operations below.
function schemaNodes(value: unknown, path = '$'): Array<{ path: string; node: Node }> {
  // [L8] Run the following branch when the negation of `value` or `typeof value` does not strictly equal "object" or the result of `Array.isArray` using `value`. Return an empty array to the caller.
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  // [L9] Declare `node` as `value`.
  const node = value as Node;
  // [L10] Return an array containing an object containing path, node, `...Object.entries(node).flatMap(([key, child]) => Array.isArray(child) ? child.flatMap((item, index) => schemaNodes(item, `${path}.${key}[${index}]`)) : schemaNodes(child, `${pa...` to the caller.
  return [{ path, node }, ...Object.entries(node).flatMap(([key, child]) => Array.isArray(child)
    // [L11] When a schema child is an array, recursively collect each element's schema nodes and append its index to the diagnostic path.
    ? child.flatMap((item, index) => schemaNodes(item, `${path}.${key}[${index}]`))
    // [L12] Otherwise recursively collect the single child schema with its property path, then finish the flattened node list.
    : schemaNodes(child, `${path}.${key}`))];
// [L13] Close the callback or control-flow body for `schemaNodes` and finish the surrounding syntax.
}
// [L14] Blank line separating the surrounding declarations, statements, or document blocks.

// [L15] Declare `blankContact` as an object containing firstName: "", lastName: "", workPhone: "", homePhone: "", mobilePhone: "", email: "".
const blankContact = { firstName: '', lastName: '', workPhone: '', homePhone: '', mobilePhone: '', email: '' };
// [L16] Declare `missingContact` as an object containing firstName: null (unknown or absent), lastName: null (unknown or absent), workPhone: null (unknown or absent), homePhone: null (unknown or absent), mobilePhone: null (unknown or absent), email: null (unknown or absent).
const missingContact = { firstName: null, lastName: null, workPhone: null, homePhone: null, mobilePhone: null, email: null };
// [L17] Declare `wire` as an object whose fields are defined below.
const wire = {
  // [L18] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to "". Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to "  ".
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: '', propertyType: 'Single Family', occupancy: '  ',
  // [L19] Set fixture property `property` to an object containing address: "123 Synthetic St", unit: "", postalCode: "", city: "", state: "".
  property: { address: '123 Synthetic St', unit: '', postalCode: '', city: '', state: '' },
  // [L20] Set fixture property `secondaryLoanNumber` to "". Set fixture property `loanType` to "". Set fixture property `lienPosition` to "". Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000.
  secondaryLoanNumber: '', loanType: '', lienPosition: '', loanAmount: 388000, salePrice: 485000,
  // [L21] Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to "".
  lastValuationAmount: null, lastValuationDate: '',
  // [L22] Set fixture property `borrower` to an object containing values copied from `blankContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100".
  borrower: { ...blankContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
  // [L23] Set fixture property `coBorrower` to `blankContact`.
  coBorrower: blankContact,
  // [L24] Set fixture property `listingAgent` to an object containing values copied from `blankContact`, firstName: "Avery", lastName: "Ellis", email: "avery@example.test".
  listingAgent: { ...blankContact, firstName: 'Avery', lastName: 'Ellis', email: 'avery@example.test' },
  // [L25] Set fixture property `buyerAgent` to an object containing values copied from `blankContact`, firstName: "Morgan", lastName: "Rivera", workPhone: "7025550120".
  buyerAgent: { ...blankContact, firstName: 'Morgan', lastName: 'Rivera', workPhone: '7025550120' },
  // [L26] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  complexProperty: false, highProfileCustomer: false,
  // [L27] Set fixture property `evidence` to an array containing an object containing field: "salePrice", document: "salesContract", page: 1, quote: "". Set fixture property `warnings` to an array containing "".
  evidence: [{ field: 'salePrice', document: 'salesContract', page: 1, quote: '' }], warnings: [''],
// [L28] Close the fixture object for `wire` and finish the surrounding syntax.
};
// [L29] Declare `canonical` as an object whose fields are defined below.
const canonical: ExtractedOrder = {
  // [L30] Set fixture property `loanProgram` to "Conventional". Set fixture property `loanProgramText` to "Conventional". Set fixture property `loanPurpose` to "Purchase". Set fixture property `product` to null (unknown or absent). Set fixture property `propertyType` to "Single Family". Set fixture property `occupancy` to null (unknown or absent).
  loanProgram: 'Conventional', loanProgramText: 'Conventional', loanPurpose: 'Purchase', product: null, propertyType: 'Single Family', occupancy: null,
  // [L31] Set fixture property `property` to an object containing address: "123 Synthetic St", unit: null (unknown or absent), postalCode: null (unknown or absent), city: null (unknown or absent), state: null (unknown or absent).
  property: { address: '123 Synthetic St', unit: null, postalCode: null, city: null, state: null },
  // [L32] Set fixture property `secondaryLoanNumber` to null (unknown or absent). Set fixture property `loanType` to null (unknown or absent). Set fixture property `lienPosition` to null (unknown or absent). Set fixture property `loanAmount` to 388000. Set fixture property `salePrice` to 485000.
  secondaryLoanNumber: null, loanType: null, lienPosition: null, loanAmount: 388000, salePrice: 485000,
  // [L33] Set fixture property `lastValuationAmount` to null (unknown or absent). Set fixture property `lastValuationDate` to null (unknown or absent).
  lastValuationAmount: null, lastValuationDate: null,
  // [L34] Set fixture property `borrower` to an object containing values copied from `missingContact`, firstName: "Casey", lastName: "Borrower", homePhone: "7025550100".
  borrower: { ...missingContact, firstName: 'Casey', lastName: 'Borrower', homePhone: '7025550100' },
  // [L35] Set fixture property `coBorrower` to `missingContact`.
  coBorrower: missingContact,
  // [L36] Set fixture property `listingAgent` to an object containing values copied from `missingContact`, firstName: "Avery", lastName: "Ellis", email: "avery@example.test".
  listingAgent: { ...missingContact, firstName: 'Avery', lastName: 'Ellis', email: 'avery@example.test' },
  // [L37] Set fixture property `buyerAgent` to an object containing values copied from `missingContact`, firstName: "Morgan", lastName: "Rivera", workPhone: "7025550120".
  buyerAgent: { ...missingContact, firstName: 'Morgan', lastName: 'Rivera', workPhone: '7025550120' },
  // [L38] Set fixture property `complexProperty` to false. Set fixture property `highProfileCustomer` to false.
  complexProperty: false, highProfileCustomer: false,
  // [L39] Set fixture property `evidence` to an array containing an object containing field: "salePrice", document: "salesContract", page: 1, quote: "". Set fixture property `warnings` to an array containing "".
  evidence: [{ field: 'salePrice', document: 'salesContract', page: 1, quote: '' }], warnings: [''],
// [L40] Close the fixture object for `canonical` and finish the surrounding syntax.
};
// [L41] Blank line separating the surrounding declarations, statements, or document blocks.

// [L42] Group regression tests for "Anthropic extraction schema boundary".
describe('Anthropic extraction schema boundary', () => {
  // [L43] Register a test that "preserves all canonical fields and required lists while reducing 40 unions to the three nullable amounts".
  it('preserves all canonical fields and required lists while reducing 40 unions to the three nullable amounts', () => {
    // [L44] Declare `original` as the result of `schemaNodes` using the result of `toJsonSchema` using `extractionSchema`.
    const original = schemaNodes(toJsonSchema(extractionSchema));
    // [L45] Declare `adapted` as the result of `schemaNodes` using `anthropicExtractionSchema`.
    const adapted = schemaNodes(anthropicExtractionSchema);
    // [L46] Declare `structure` as a callback that returns the result of `nodes.filter(({ node }) => node.properties).map` using a callback that returns `{ path, properties: Object.keys(node.properties as Node), required: node.required, additionalProperties: node.additionalProperties, }`.
    const structure = (nodes: typeof original) => nodes.filter(({ node }) => node.properties).map(({ path, node }) => ({
      // [L47] Include the current `path` value under the same property name. Set fixture property `properties` to the result of `Object.keys` using `node.properties`. Set fixture property `required` to `node.required`. Set fixture property `additionalProperties` to `node.additionalProperties`.
      path, properties: Object.keys(node.properties as Node), required: node.required, additionalProperties: node.additionalProperties,
    // [L48] Close the fixture object and finish the surrounding syntax.
    }));
    // [L49] Assert that the result of `structure` using `adapted` deeply equals the result of `structure` using `original`.
    expect(structure(adapted)).toEqual(structure(original));
    // [L50] Declare `union` as a callback that returns the result of `Array.isArray` using `node.type` or the result of `Array.isArray` using `node.anyOf`.
    const union = ({ node }: typeof original[number]) => Array.isArray(node.type) || Array.isArray(node.anyOf);
    // [L51] Assert that the result of `original.filter` using `union` has length 40.
    expect(original.filter(union)).toHaveLength(40);
    // [L52] Assert that the result of `adapted.filter(union).map` using a callback that returns `path` deeply equals an array containing "$.properties.loanAmount", "$.properties.salePrice", "$.properties.lastValuationAmount".
    expect(adapted.filter(union).map(({ path }) => path)).toEqual([
      // [L53] Require only the loanAmount, salePrice, and lastValuationAmount paths to retain nullable-number unions.
      '$.properties.loanAmount', '$.properties.salePrice', '$.properties.lastValuationAmount',
    // [L54] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L55] Declare `nullableText` as the result of `original.filter` using a callback that returns `Array.isArray(node.type)` and `node.type.includes('string')` and the result of `node.type.includes` using `'null'`.
    const nullableText = original.filter(({ node }) => Array.isArray(node.type) && node.type.includes('string') && node.type.includes('null'));
    // [L56] Assert that `nullableText` has length 37.
    expect(nullableText).toHaveLength(37);
    // [L57] For each canonical nullable-text path, assert that the matching adapted Anthropic schema node has the plain string type.
    for (const { path } of nullableText) expect(adapted.find(item => item.path === path)?.node.type).toBe('string');
  // [L58] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L59] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L60] Register a test that "decodes missing text without merging contacts, changing evidence/warnings, or mutating provider output".
  it('decodes missing text without merging contacts, changing evidence/warnings, or mutating provider output', () => {
    // [L61] Declare `original` as the result of `structuredClone` using `wire`.
    const original = structuredClone(wire);
    // [L62] Declare `normalized` as the result of `normalizeAnthropicExtraction` using `wire`.
    const normalized = normalizeAnthropicExtraction(wire);
    // [L63] Assert that the result of `extractionSchema.parse` using `normalized` deeply equals `canonical`.
    expect(extractionSchema.parse(normalized)).toEqual(canonical);
    // [L64] Assert that `wire` deeply equals `original`.
    expect(wire).toEqual(original);
    // [L65] Assert that the result of `normalizeAnthropicExtraction` using `canonical` deeply equals `canonical`.
    expect(normalizeAnthropicExtraction(canonical)).toEqual(canonical);
  // [L66] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L67] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L68] Register a test that "keeps all three absent amounts null without filling them with zero".
  it('keeps all three absent amounts null without filling them with zero', () => {
    // [L69] Declare `result` as the result of `extractionSchema.parse` using the result of `normalizeAnthropicExtraction` using an object containing values copied from `wire`, loanAmount: null (unknown or absent), salePrice: null (unknown or absent), lastValuationAmount: null (unknown or absent).
    const result = extractionSchema.parse(normalizeAnthropicExtraction({ ...wire, loanAmount: null, salePrice: null, lastValuationAmount: null }));
    // [L70] Assert that an array containing `result.loanAmount`, `result.salePrice`, `result.lastValuationAmount` deeply equals an array containing null (unknown or absent), null (unknown or absent), null (unknown or absent).
    expect([result.loanAmount, result.salePrice, result.lastValuationAmount]).toEqual([null, null, null]);
  // [L71] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L72] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L73] Register a test that "preserves invalid or missing fields so unchanged canonical validation rejects them".
  it('preserves invalid or missing fields so unchanged canonical validation rejects them', () => {
    // [L74] Declare `missingName` as the result of `structuredClone` using `wire`.
    const missingName = structuredClone(wire) as Record<string, unknown>;
    // [L75] Delete property `(missingName.borrower as Record<string, unknown>).lastName` from the fixture object.
    delete (missingName.borrower as Record<string, unknown>).lastName;
    // [L76] Begin malformed extraction cases covering missing required fields, zero/mistyped amounts, invalid classifications or booleans, invalid contacts, and malformed evidence/warnings.
    const malformed = [
      // [L77] Copy the entries of `wire` into this fixture. Set fixture property `salePrice` to 0. Copy the entries of `wire` into this fixture. Set fixture property `loanAmount` to "388000". Copy the entries of `wire` into this fixture. Set fixture property `lastValuationAmount` to "".
      missingName, { ...wire, salePrice: 0 }, { ...wire, loanAmount: '388000' }, { ...wire, lastValuationAmount: '' },
      // [L78] Copy the entries of `wire` into this fixture. Set fixture property `loanProgram` to "". Copy the entries of `wire` into this fixture. Set fixture property `loanPurpose` to "purchase". Copy the entries of `wire` into this fixture. Set fixture property `complexProperty` to "".
      { ...wire, loanProgram: '' }, { ...wire, loanPurpose: 'purchase' }, { ...wire, complexProperty: '' },
      // [L79] Copy the entries of `wire` into this fixture. Set fixture property `borrower` to an object containing values copied from `wire.borrower`, firstName: 123.
      { ...wire, borrower: { ...wire.borrower, firstName: 123 } },
      // [L80] Copy the entries of `wire` into this fixture. Set fixture property `evidence` to an array containing an object containing values copied from `wire.evidence[0]`, document: "".
      { ...wire, evidence: [{ ...wire.evidence[0], document: '' }] },
      // [L81] Copy the entries of `wire` into this fixture. Set fixture property `evidence` to an array containing an object containing values copied from `wire.evidence[0]`, page: 0.
      { ...wire, evidence: [{ ...wire.evidence[0], page: 0 }] },
      // [L82] Add malformed cases with an overlong evidence quote and a null warning entry; warnings must contain strings, so null is invalid here.
      { ...wire, evidence: [{ ...wire.evidence[0], quote: 'x'.repeat(301) }] }, { ...wire, warnings: [null] },
    // [L83] Close the array of fixture values for `malformed` and finish the surrounding syntax.
    ];
    // [L84] Normalize each malformed response and assert that canonical schema validation still fails rather than repairing invalid data.
    for (const value of malformed) expect(extractionSchema.safeParse(normalizeAnthropicExtraction(value)).success).toBe(false);
    // [L85] Assert normalization preserves the missing borrower.lastName property instead of inventing it.
    expect((normalizeAnthropicExtraction(missingName) as typeof wire).borrower).not.toHaveProperty('lastName');
  // [L86] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L87] Close the callback or control-flow body and finish the surrounding syntax.
});
