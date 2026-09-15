import { describe, expect, it } from 'vitest';
import { expectedR3FieldId, matchesR3Field, phoneInputDigits, textValuesMatch } from '../src/browser/r3-fields.js';

const listing = { id: 'OrderItemEdit_FixtureSellerRepresentativeFirstName', section: 'Is there a listing agent?', label: 'First Name', tag: 'input', type: 'text' };
const buyer = { ...listing, id: 'OrderItemEdit_FixturePurchaserRepresentativeFirstName', section: "Is there a buyer's agent?" };

describe('separate R3 agent contact field resolution', () => {
  it('resolves each role from its exact observed section and field label without guessing new IDs', () => {
    expect(expectedR3FieldId('listingAgent.firstName')).toBeUndefined();
    expect(expectedR3FieldId('buyerAgent.firstName')).toBeUndefined();
    expect(matchesR3Field('listingAgent.firstName', listing)).toBe(true);
    expect(matchesR3Field('buyerAgent.firstName', buyer)).toBe(true);
    expect(matchesR3Field('listingAgent.firstName', buyer)).toBe(false);
    expect(matchesR3Field('buyerAgent.firstName', listing)).toBe(false);
    expect(matchesR3Field('buyerAgent.firstName', { ...buyer, section: ' Order > Is there a buyer’s agent? ', label: ' FIRST   NAME ' })).toBe(true);
  });

  it.each([
    { section: 'Who should be contacted to obtain access to the property?' },
    { section: 'Is there a listing agent? > Listing Agent Contact Address' },
    { section: 'Is there a listing agent? > Is there a buyer\'s agent?' },
    { label: 'Last Name' }, { label: 'First Name or Company' },
    { id: 'OtherForm_FirstName' }, { id: 'OrderItemEdit_' }, { id: 'OrderItemEdit_BorrowerFirstName' }, { visible: false },
    { id: 'OrderItemEdit_AccessFirstName' }, { id: 'OrderItemEdit_CustomerFirstName' },
    { type: 'password' }, { type: 'submit' }, { type: 'file' }, { tag: 'button' },
  ])('rejects a different section, known other contact, or unsafe control: %j', change => {
    expect(matchesR3Field('listingAgent.firstName', { ...listing, ...change })).toBe(false);
  });

  it('does not broaden exact-ID matching for the existing borrower and access fields', () => {
    expect(matchesR3Field('borrower.firstName', { ...listing, section: 'Borrower Information' })).toBe(false);
    expect(matchesR3Field('contact.firstName', { ...listing, section: 'Who should be contacted to obtain access to the property?' })).toBe(false);
    expect(matchesR3Field('contact.firstName', { ...listing, id: 'OrderItemEdit_AccessFirstName' })).toBe(true);
    for (const key of ['listingAgent.submit', 'listingAgent.firstName.extra', 'unknown.firstName', 'constructor.firstName', 'listingAgent.constructor']) {
      expect(matchesR3Field(key, listing)).toBe(false);
    }
  });
});

describe('approved phone input recovery', () => {
  it('recovers each of the 19 mapped phone keys using its own number', () => {
    const keys = ['borrower', 'coBorrower', 'contact', 'listingAgent', 'buyerAgent', 'statusContact']
      .flatMap(section => ['workPhone', 'homePhone', 'mobilePhone'].map(field => `${section}.${field}`));
    keys.push('loanOfficer.workPhone');
    for (const [index, key] of keys.entries()) {
      const number = `70255501${String(index).padStart(2, '0')}`;
      const approved = `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
      expect(phoneInputDigits(key, approved)).toBe(number);
      expect(textValuesMatch(key, number, approved)).toBe(true);
    }
  });

  it('accepts ordinary US phone punctuation and optional country code without changing the number', () => {
    for (const value of ['7025550100', '702-555-0100', '(702)555-0100', '(702) 555-0100', '702.555.0100', '1-702-555-0100', '+1 (702) 555-0100']) {
      expect(phoneInputDigits('borrower.mobilePhone', value)).toBe('7025550100');
    }
  });

  it('never enables phone keystrokes for unrelated or unmapped plan keys', () => {
    for (const key of ['loanNumber', 'loanAmount', 'borrower.firstName', 'borrower.email', 'borrower.workPhone.extra', 'unknown.workPhone', 'loanOfficer.homePhone', 'loanOfficer.mobilePhone', '__proto__.workPhone', 'constructor.workPhone']) {
      expect(phoneInputDigits(key, '7025550100')).toBeUndefined();
    }
  });

  it('does not guess missing digits or discard extensions, international prefixes, or unrelated text', () => {
    for (const value of ['', '  ', '(___) ___-____', '702555010', '70255501000', '7025550100 x12', '(702) 555-0100 ext. 12', '7025550100#12', '+44 20 7946 0018', '0044 20 7946 0018', '+33 1234567890', 'Office 7025550100', '7025550100\nEnter']) {
      expect(phoneInputDigits('buyerAgent.workPhone', value)).toBeUndefined();
    }
  });
});
