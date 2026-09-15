// [L1] Import { describe, expect, it } from "vitest" for these regression tests.
import { describe, expect, it } from 'vitest';
// [L2] Import { expectedR3FieldId, matchesR3Field, phoneInputDigits, textValuesMatch } from "../src/browser/r3-fields.js" for these regression tests.
import { expectedR3FieldId, matchesR3Field, phoneInputDigits, textValuesMatch } from '../src/browser/r3-fields.js';
// [L3] Blank line separating the surrounding declarations, statements, or document blocks.

// [L4] Declare `listing` as an object containing id: "OrderItemEdit_FixtureSellerRepresentativeFirstName", section: "Is there a listing agent?", label: "First Name", tag: "input", type: "text".
const listing = { id: 'OrderItemEdit_FixtureSellerRepresentativeFirstName', section: 'Is there a listing agent?', label: 'First Name', tag: 'input', type: 'text' };
// [L5] Declare `buyer` as an object containing values copied from `listing`, id: "OrderItemEdit_FixturePurchaserRepresentativeFirstName", section: "Is there a buyer's agent?".
const buyer = { ...listing, id: 'OrderItemEdit_FixturePurchaserRepresentativeFirstName', section: "Is there a buyer's agent?" };
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.

// [L7] Group regression tests for "separate R3 agent contact field resolution".
describe('separate R3 agent contact field resolution', () => {
  // [L8] Register a test that "resolves each role from its exact observed section and field label without guessing new IDs".
  it('resolves each role from its exact observed section and field label without guessing new IDs', () => {
    // [L9] Assert that the result of `expectedR3FieldId` using "listingAgent.firstName" is undefined.
    expect(expectedR3FieldId('listingAgent.firstName')).toBeUndefined();
    // [L10] Assert that the result of `expectedR3FieldId` using "buyerAgent.firstName" is undefined.
    expect(expectedR3FieldId('buyerAgent.firstName')).toBeUndefined();
    // [L11] Assert that the result of `matchesR3Field` using "listingAgent.firstName", `listing` strictly equals true.
    expect(matchesR3Field('listingAgent.firstName', listing)).toBe(true);
    // [L12] Assert that the result of `matchesR3Field` using "buyerAgent.firstName", `buyer` strictly equals true.
    expect(matchesR3Field('buyerAgent.firstName', buyer)).toBe(true);
    // [L13] Assert that the result of `matchesR3Field` using "listingAgent.firstName", `buyer` strictly equals false.
    expect(matchesR3Field('listingAgent.firstName', buyer)).toBe(false);
    // [L14] Assert that the result of `matchesR3Field` using "buyerAgent.firstName", `listing` strictly equals false.
    expect(matchesR3Field('buyerAgent.firstName', listing)).toBe(false);
    // [L15] Assert that the result of `matchesR3Field` using "buyerAgent.firstName", an object containing values copied from `buyer`, section: " Order > Is there a buyer’s agent? ", label: " FIRST   NAME " strictly equals true.
    expect(matchesR3Field('buyerAgent.firstName', { ...buyer, section: ' Order > Is there a buyer’s agent? ', label: ' FIRST   NAME ' })).toBe(true);
  // [L16] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L17] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L18] Register a parameterized test that "rejects a different section, known other contact, or unsafe control: %j".
  it.each([
    // [L19] Set fixture property `section` to "Who should be contacted to obtain access to the property?".
    { section: 'Who should be contacted to obtain access to the property?' },
    // [L20] Set fixture property `section` to "Is there a listing agent? > Listing Agent Contact Address".
    { section: 'Is there a listing agent? > Listing Agent Contact Address' },
    // [L21] Set fixture property `section` to "Is there a listing agent? > Is there a buyer's agent?".
    { section: 'Is there a listing agent? > Is there a buyer\'s agent?' },
    // [L22] Set fixture property `label` to "Last Name". Set fixture property `label` to "First Name or Company".
    { label: 'Last Name' }, { label: 'First Name or Company' },
    // [L23] Set fixture property `id` to "OtherForm_FirstName". Set fixture property `id` to "OrderItemEdit_". Set fixture property `id` to "OrderItemEdit_BorrowerFirstName". Set fixture property `visible` to false.
    { id: 'OtherForm_FirstName' }, { id: 'OrderItemEdit_' }, { id: 'OrderItemEdit_BorrowerFirstName' }, { visible: false },
    // [L24] Set fixture property `id` to "OrderItemEdit_AccessFirstName". Set fixture property `id` to "OrderItemEdit_CustomerFirstName".
    { id: 'OrderItemEdit_AccessFirstName' }, { id: 'OrderItemEdit_CustomerFirstName' },
    // [L25] Set fixture property `type` to "password". Set fixture property `type` to "submit". Set fixture property `type` to "file". Set fixture property `tag` to "button".
    { type: 'password' }, { type: 'submit' }, { type: 'file' }, { tag: 'button' },
  // [L26] Apply the preceding scenario rows to the parameterized test "rejects a different section, known other contact, or unsafe control: %j" and begin its callback.
  ])('rejects a different section, known other contact, or unsafe control: %j', change => {
    // [L27] Assert that the result of `matchesR3Field` using "listingAgent.firstName", an object containing values copied from `listing`, values copied from `change` strictly equals false.
    expect(matchesR3Field('listingAgent.firstName', { ...listing, ...change })).toBe(false);
  // [L28] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L29] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L30] Register a test that "does not broaden exact-ID matching for the existing borrower and access fields".
  it('does not broaden exact-ID matching for the existing borrower and access fields', () => {
    // [L31] Assert that the result of `matchesR3Field` using "borrower.firstName", an object containing values copied from `listing`, section: "Borrower Information" strictly equals false.
    expect(matchesR3Field('borrower.firstName', { ...listing, section: 'Borrower Information' })).toBe(false);
    // [L32] Assert that the result of `matchesR3Field` using "contact.firstName", an object containing values copied from `listing`, section: "Who should be contacted to obtain access to the property?" strictly equals false.
    expect(matchesR3Field('contact.firstName', { ...listing, section: 'Who should be contacted to obtain access to the property?' })).toBe(false);
    // [L33] Assert that the result of `matchesR3Field` using "contact.firstName", an object containing values copied from `listing`, id: "OrderItemEdit_AccessFirstName" strictly equals true.
    expect(matchesR3Field('contact.firstName', { ...listing, id: 'OrderItemEdit_AccessFirstName' })).toBe(true);
    // [L34] Iterate const key over an array containing "listingAgent.submit", "listingAgent.firstName.extra", "unknown.firstName", "constructor.firstName", "listingAgent.constructor".
    for (const key of ['listingAgent.submit', 'listingAgent.firstName.extra', 'unknown.firstName', 'constructor.firstName', 'listingAgent.constructor']) {
      // [L35] Assert that the result of `matchesR3Field` using `key`, `listing` strictly equals false.
      expect(matchesR3Field(key, listing)).toBe(false);
    // [L36] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L37] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L38] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L39] Blank line separating the surrounding declarations, statements, or document blocks.

// [L40] Group regression tests for "approved phone input recovery".
describe('approved phone input recovery', () => {
  // [L41] Register a test that "recovers each of the 19 mapped phone keys using its own number".
  it('recovers each of the 19 mapped phone keys using its own number', () => {
    // [L42] Declare `keys` as the result of `['borrower', 'coBorrower', 'contact', 'listingAgent', 'buyerAgent', 'statusContact'] .flatMap` using a callback that returns the result of `['workPhone', 'homePhone', 'mobilePhone'].map` using a callback that returns ``${section}.${field}``.
    const keys = ['borrower', 'coBorrower', 'contact', 'listingAgent', 'buyerAgent', 'statusContact']
      // [L43] Build all work/home/mobile phone field keys for each approved contact section.
      .flatMap(section => ['workPhone', 'homePhone', 'mobilePhone'].map(field => `${section}.${field}`));
    // [L44] Append "loanOfficer.workPhone" to `keys` for later inspection.
    keys.push('loanOfficer.workPhone');
    // [L45] Iterate const [index, key] over the result of `keys.entries` with no arguments.
    for (const [index, key] of keys.entries()) {
      // [L46] Declare `number` as text interpolating the result of `String(index).padStart` using 2, "0".
      const number = `70255501${String(index).padStart(2, '0')}`;
      // [L47] Declare `approved` as text interpolating the result of `number.slice` using 0, 3, the result of `number.slice` using 3, 6, the result of `number.slice` using 6.
      const approved = `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
      // [L48] Assert that the result of `phoneInputDigits` using `key`, `approved` strictly equals `number`.
      expect(phoneInputDigits(key, approved)).toBe(number);
      // [L49] Assert that the result of `textValuesMatch` using `key`, `number`, `approved` strictly equals true.
      expect(textValuesMatch(key, number, approved)).toBe(true);
    // [L50] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L51] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L52] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L53] Register a test that "accepts ordinary US phone punctuation and optional country code without changing the number".
  it('accepts ordinary US phone punctuation and optional country code without changing the number', () => {
    // [L54] Iterate const value over an array containing "7025550100", "702-555-0100", "(702)555-0100", "(702) 555-0100", "702.555.0100", "1-702-555-0100", "+1 (702) 555-0100".
    for (const value of ['7025550100', '702-555-0100', '(702)555-0100', '(702) 555-0100', '702.555.0100', '1-702-555-0100', '+1 (702) 555-0100']) {
      // [L55] Assert that the result of `phoneInputDigits` using "borrower.mobilePhone", `value` strictly equals "7025550100".
      expect(phoneInputDigits('borrower.mobilePhone', value)).toBe('7025550100');
    // [L56] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L57] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L58] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L59] Register a test that "never enables phone keystrokes for unrelated or unmapped plan keys".
  it('never enables phone keystrokes for unrelated or unmapped plan keys', () => {
    // [L60] Iterate const key over an array containing "loanNumber", "loanAmount", "borrower.firstName", "borrower.email", "borrower.workPhone.extra", "unknown.workPhone", "loanOfficer.homePhone", "loanOfficer.mobilePhone", "__proto__.workPhone", "constructor.workPhone".
    for (const key of ['loanNumber', 'loanAmount', 'borrower.firstName', 'borrower.email', 'borrower.workPhone.extra', 'unknown.workPhone', 'loanOfficer.homePhone', 'loanOfficer.mobilePhone', '__proto__.workPhone', 'constructor.workPhone']) {
      // [L61] Assert that the result of `phoneInputDigits` using `key`, "7025550100" is undefined.
      expect(phoneInputDigits(key, '7025550100')).toBeUndefined();
    // [L62] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L63] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L64] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L65] Register a test that "does not guess missing digits or discard extensions, international prefixes, or unrelated text".
  it('does not guess missing digits or discard extensions, international prefixes, or unrelated text', () => {
    // [L66] Iterate const value over an array containing "", "  ", "(___) ___-____", "702555010", "70255501000", "7025550100 x12", "(702) 555-0100 ext. 12", "7025550100#12", "+44 20 7946 0018", "0044 20 7946 0018", "+33 1234567890", "Office 7025550100", "7025550100\nEnter".
    for (const value of ['', '  ', '(___) ___-____', '702555010', '70255501000', '7025550100 x12', '(702) 555-0100 ext. 12', '7025550100#12', '+44 20 7946 0018', '0044 20 7946 0018', '+33 1234567890', 'Office 7025550100', '7025550100\nEnter']) {
      // [L67] Assert that the result of `phoneInputDigits` using "buyerAgent.workPhone", `value` is undefined.
      expect(phoneInputDigits('buyerAgent.workPhone', value)).toBeUndefined();
    // [L68] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L69] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L70] Close the callback or control-flow body and finish the surrounding syntax.
});
