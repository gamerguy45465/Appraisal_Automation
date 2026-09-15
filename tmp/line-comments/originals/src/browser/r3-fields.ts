/** Existing field IDs and prefixes observed in the authenticated R3 Create page, 2026-09-08.
 * Those fields retain exact-ID matching. Agent and loan-officer roles use the separately
 * constrained screenshot-supported section/label resolver below.
 */
const simpleFields: Record<string, string> = {
  branch: 'ClientBranchID', product: 'ProductID', propertyType: 'PropertyTypeID', occupancy: 'OwnerOccupancyID',
  'property.address': 'SubjectPropertyAddress1', 'property.unit': 'SubjectPropertyAddress2',
  'property.postalCode': 'SubjectPropertyZip', 'property.city': 'SubjectPropertyCity', 'property.state': 'SubjectPropertyState',
  apn: 'SubjectPropertyAPN', county: 'SubjectPropertyFIPS', loanNumber: 'LoanNumber', secondaryLoanNumber: 'SecondaryLoanNumber',
  loanPurpose: 'LoanPurposeID', loanType: 'LoanTypeID', fhaCaseNumber: 'FHACaseNumber', lienPosition: 'LienPositionID',
  loanAmount: 'LoanAmount', salePrice: 'SalePrice', fannieMaeCaseFileId: 'FannieMaeCaseFileID', freddieMacLpaId: 'FreddieMacLPAID',
  lastValuationAmount: 'LastValuationAmount', lastValuationDate: 'LastValuationDate', borrowerIsAccessContact: 'UseBorrowerForAccess',
  lockBoxCode: 'LockBoxCode', accessInstructions: 'NotesToVendor', preferredInspectionDate: 'SuppliedApptTime1',
  preferredInspectionTime: 'SuppliedApptEndTime1', alternateInspectionDate: 'SuppliedApptTime2', alternateInspectionTime: 'SuppliedApptEndTime2',
  rushOrder: 'RushOrder', complexProperty: 'ComplexProperty', highProfileCustomer: 'FamousBorrower', sideBySideOrder: 'SidebySideOrder',
  specialHandling: 'NotesToManagement', paymentMethod: 'BillingTypeID',
};
const contactPrefixes: Record<string, string> = { borrower: 'Borrower', coBorrower: 'Coborrower', contact: 'Access', statusContact: 'Customer' };
const contactSuffixes: Record<string, string> = {
  firstName: 'FirstName', lastName: 'LastName', workPhone: 'WorkPhone', homePhone: 'HomePhone', mobilePhone: 'MobilePhone', email: 'Email',
};

// These section titles and labels come from the user's R3 screenshots. Their DOM IDs
// were not captured, so resolve only these roles from fresh, unique observations.
const contactSections: Record<string, string> = {
  listingAgent: 'Is there a listing agent?', buyerAgent: "Is there a buyer's agent?",
  loanOfficer: 'Is there a loan officer?',
};
const loanOfficerFields = new Set(['firstName', 'lastName', 'workPhone', 'email']);
const contactLabels: Record<string, string> = {
  firstName: 'First Name', lastName: 'Last Name', workPhone: 'Work Phone',
  homePhone: 'Home Phone', mobilePhone: 'Mobile Phone', email: 'Email',
};
const normalizeCaption = (value: string): string => value.trim().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').toLowerCase();
const knownFieldIds = new Set([
  ...Object.values(simpleFields).map(suffix => `OrderItemEdit_${suffix}`),
  ...Object.values(contactPrefixes).flatMap(prefix => Object.values(contactSuffixes).map(suffix => `OrderItemEdit_${prefix}${suffix}`)),
]);

/** The caller must require one match; ambiguous repeated sections are never writable.
 * Existing fields always use their inspected ID. Only the specified contact sections use
 * exact section/label matching, and cannot capture an existing borrower's/access field.
 */
export function matchesR3Field(fieldKey: string, field: { id: string; section: string; label: string; tag: string; type: string; visible?: boolean }): boolean {
  const expectedId = expectedR3FieldId(fieldKey);
  if (expectedId) return field.id === expectedId;
  const [section = '', name = '', ...rest] = fieldKey.split('.');
  if (rest.length || !Object.hasOwn(contactSections, section) || !Object.hasOwn(contactLabels, name)
    || (section === 'loanOfficer' && !loanOfficerFields.has(name))) return false;
  if (!/^OrderItemEdit_[A-Za-z][A-Za-z0-9_]*$/.test(field.id) || knownFieldIds.has(field.id) || field.visible === false
    || field.tag !== 'input' || !['input', 'text', 'email', 'tel'].includes(field.type)) return false;
  const nearestSection = field.section.split(' > ').at(-1) ?? '';
  return normalizeCaption(nearestSection) === normalizeCaption(contactSections[section]!)
    && normalizeCaption(field.label) === normalizeCaption(contactLabels[name]!);
}

/** Observed baseline products. Document-specific requirements still control which is suitable. */
export const OBSERVED_BASELINE_PRODUCTS = {
  singleFamily: { Conventional: '1004 SFR CONV', FHA: '1004 SFR - FHA', USDA: '1004 SFR USDA' },
  condominium: { Conventional: '1073 CONDO CONV', FHA: '1073 CONDO FHA', USDA: '1073 CONDO USDA' },
  manufacturedHome: { Conventional: '1004C MANU CONV', FHA: '1004C Manuf - FHA', USDA: '1004C MANU USDA' },
  twoToFourFamily: { Conventional: '1025 Multi-Family CONV', FHA: '1025 Multi - FHA', USDA: '1025 Multi-Family USDA' },
} as const;

/** Only the optional separator in known FHA appraisal labels is interchangeable. */
export function productLabelAliases(value: string): string[] {
  const labels = Object.values(OBSERVED_BASELINE_PRODUCTS)
    .map(({ FHA }) => [...new Set([FHA, FHA.replace(' - ', ' ')])]);
  const requested = normalizeCaption(value);
  return labels.find(group => group.some(label => normalizeCaption(label) === requested))
    ?.filter(label => normalizeCaption(label) !== requested) ?? [];
}

export function expectedR3FieldId(fieldKey: string): string | undefined {
  if (Object.hasOwn(simpleFields, fieldKey)) return `OrderItemEdit_${simpleFields[fieldKey]}`;
  const [section = '', field = '', ...rest] = fieldKey.split('.');
  if (!rest.length && Object.hasOwn(contactPrefixes, section) && Object.hasOwn(contactSuffixes, field)) {
    return `OrderItemEdit_${contactPrefixes[section]}${contactSuffixes[field]}`;
  }
  return undefined;
}

/** Only existing phone plan keys may use private masked-input recovery. */
export function phoneInputDigits(fieldKey: string, value: string): string | undefined {
  if (!/^(?:(?:borrower|coBorrower|contact|listingAgent|buyerAgent|statusContact)\.(?:workPhone|homePhone|mobilePhone)|loanOfficer\.workPhone)$/.test(fieldKey)) return undefined;
  // Strip ordinary formatting and an optional US country code, never extensions or
  // international prefixes. Unrecognized values retain their original fill/review path.
  return /^(?:\+?1)?(\d{10})$/.exec(value.replace(/[().\s-]/g, ''))?.[1];
}

export function textValuesMatch(fieldKey: string, actual: string, expected: string): boolean {
  if (actual === expected) return true;
  if (expected === '' || actual === '') return false;
  if (['loanAmount', 'salePrice', 'lastValuationAmount'].includes(fieldKey)) {
    const parse = (value: string): number => /^[\d,]+(?:\.\d{1,2})?$/.test(value) ? Number(value.replaceAll(',', '')) : Number.NaN;
    return Number.isFinite(parse(actual)) && parse(actual) === parse(expected);
  }
  if (/\.(workPhone|homePhone|mobilePhone)$/.test(fieldKey)) {
    const digits = (value: string): string => value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    return digits(actual).length >= 10 && digits(actual) === digits(expected);
  }
  return false;
}

export function browserEnvironment(source: NodeJS.ProcessEnv): Record<string, string> {
  const allowed = new Set(['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE',
    'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'APPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA',
    'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']);
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => value !== undefined && allowed.has(key.toUpperCase())) as Array<[string, string]>);
}
