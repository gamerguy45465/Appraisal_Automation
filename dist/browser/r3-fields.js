// [L1] Begins documentation identifying the authenticated R3 page and observation date for known field IDs.
// [L2] Explains that previously inspected fields use exact IDs while agent/officer fields use a different resolver.
// [L3] Points to the constrained section-and-label matching logic for screenshot-supported contact roles.
// [L4] Ends the field-observation documentation block.
/** Historical exact IDs observed on 2026-09-08 remain supported.
 * The 2026-09-14 contact inspection found per-form UUID collection IDs and input-group captions.
 * Current contacts require matching ID/name/suffix plus their exact role heading and field caption.
 */
// [L5] Starts the mapping from application plan keys to observed R3 field-ID suffixes.
const simpleFields = {
    // [L6] Maps branch, product, property type, and occupancy plan entries to their dropdown ID suffixes.
    branch: 'ClientBranchID', product: 'ProductID', propertyType: 'PropertyTypeID', occupancy: 'OwnerOccupancyID',
    // [L7] Maps the street address and unit plan entries to the two subject-property address fields.
    'property.address': 'SubjectPropertyAddress1', 'property.unit': 'SubjectPropertyAddress2',
    // [L8] Maps postal code, city, and state entries to the corresponding subject-property fields.
    'property.postalCode': 'SubjectPropertyZip', 'property.city': 'SubjectPropertyCity', 'property.state': 'SubjectPropertyState',
    // [L9] Maps parcel number, county, primary loan number, and secondary loan number to their inspected fields.
    apn: 'SubjectPropertyAPN', county: 'SubjectPropertyFIPS', loanNumber: 'LoanNumber', secondaryLoanNumber: 'SecondaryLoanNumber',
    // [L10] Maps loan purpose/type, FHA case number, and lien position to the corresponding R3 suffixes.
    loanPurpose: 'LoanPurposeID', loanType: 'LoanTypeID', fhaCaseNumber: 'FHACaseNumber', lienPosition: 'LienPositionID',
    // [L11] Maps monetary and agency case-file identifiers to their inspected R3 fields.
    loanAmount: 'LoanAmount', salePrice: 'SalePrice', fannieMaeCaseFileId: 'FannieMaeCaseFileID', freddieMacLpaId: 'FreddieMacLPAID',
    // [L12] Maps prior valuation amount/date and the borrower-as-access-contact checkbox.
    lastValuationAmount: 'LastValuationAmount', lastValuationDate: 'LastValuationDate', borrowerIsAccessContact: 'UseBorrowerForAccess',
    // [L13] Maps lockbox code, vendor access notes, and the preferred inspection start field.
    lockBoxCode: 'LockBoxCode', accessInstructions: 'NotesToVendor', preferredInspectionDate: 'SuppliedApptTime1',
    // [L14] Maps preferred inspection end and alternate inspection start/end fields.
    preferredInspectionTime: 'SuppliedApptEndTime1', alternateInspectionDate: 'SuppliedApptTime2', alternateInspectionTime: 'SuppliedApptEndTime2',
    // [L15] Maps rush, complex-property, prominent-customer, and side-by-side order flags to checkboxes.
    rushOrder: 'RushOrder', complexProperty: 'ComplexProperty', highProfileCustomer: 'FamousBorrower', sideBySideOrder: 'SidebySideOrder',
    // [L16] Maps management notes and the billing-method dropdown.
    specialHandling: 'NotesToManagement', paymentMethod: 'BillingTypeID',
    // [L17] Ends the simple-field suffix mapping.
};
// [L18] Maps borrower, co-borrower, access-contact, and status-contact roles to their observed ID prefixes.
const contactPrefixes = { borrower: 'Borrower', coBorrower: 'Coborrower', contact: 'Access', statusContact: 'Customer' };
// [L19] Starts the shared mapping of contact attributes to field suffixes.
const contactSuffixes = {
    // [L20] Maps contact names, three phone categories, and email to their corresponding R3 suffixes.
    firstName: 'FirstName', lastName: 'LastName', workPhone: 'WorkPhone', homePhone: 'HomePhone', mobilePhone: 'MobilePhone', email: 'Email',
    // [L21] Ends the contact-attribute suffix mapping.
};
// [L22] Blank line separating the surrounding declarations, statements, or document blocks.
// [L23] Documents that the contact section captions and labels were obtained from the user's screenshots.
// These section titles and labels come from the user's R3 screenshots. Their DOM IDs
// [L24] Explains why these roles require fresh, unique observations instead of unobserved DOM IDs.
// were not captured, so resolve only these roles from fresh, unique observations.
// [L25] Starts the permitted section-title mapping for screenshot-supported roles.
const contactSections = {
    // [L26] Stores the exact listing-agent and buyer-agent section captions.
    listingAgent: 'Is there a listing agent?', buyerAgent: "Is there a buyer's agent?",
    // [L27] Stores the exact loan-officer section caption.
    loanOfficer: 'Is there a loan officer?',
    // [L28] Ends the contact-section mapping.
};
// Current R3 contact rows use generated collection IDs. Role identity still comes from exact inspected headings.
const currentContactSections = {
    borrower: 'Who is the borrower / mortgagee?', coBorrower: 'Is there a co-borrower / co-mortgagee?',
    contact: 'Who should be contacted to obtain access to the property?',
    statusContact: 'Who should be contacted if there are questions on this order?',
    ...contactSections,
};
// Match only the observed MVC collection shape, including its exact contact attribute suffix.
const currentContactId = /^OrderItemEdit_Contacts_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})__(FirstName|LastName|WorkPhone|HomePhone|MobilePhone|Email)$/i;
/** Identity of an inspected generated contact; ID and submitted name must agree exactly. */
export function r3ContactIdentity(field) {
    const match = currentContactId.exec(field.id);
    return match && field.name === `OrderItemEdit.Contacts[${match[1]}].${match[2]}` ? match[1] : undefined;
}
// [L29] Limits writable loan-officer attributes to first name, last name, work phone, and email.
const loanOfficerFields = new Set(['firstName', 'lastName', 'workPhone', 'email']);
// [L30] Starts the mapping from contact attribute names to observed field captions.
const contactLabels = {
    // [L31] Provides exact first-name, last-name, and work-phone captions.
    firstName: 'First Name', lastName: 'Last Name', workPhone: 'Work Phone',
    // [L32] Provides exact home-phone, mobile-phone, and email captions.
    homePhone: 'Home Phone', mobilePhone: 'Mobile Phone', email: 'Email',
    // [L33] Ends the contact-caption mapping.
};
// [L34] Normalizes caption whitespace, curly apostrophes, and case for exact normalized comparisons.
const normalizeCaption = (value) => value.trim().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').toLowerCase();
// [L35] Begins building the set of field IDs already assigned by the exact-ID mappings.
const knownFieldIds = new Set([
    // [L36] Adds every simple field with the common OrderItemEdit ID prefix.
    ...Object.values(simpleFields).map(suffix => `OrderItemEdit_${suffix}`),
    // [L37] Adds every combination of known contact role prefix and contact attribute suffix.
    ...Object.values(contactPrefixes).flatMap(prefix => Object.values(contactSuffixes).map(suffix => `OrderItemEdit_${prefix}${suffix}`)),
    // [L38] Completes the known-field-ID set.
]);
// [L39] Blank line separating the surrounding declarations, statements, or document blocks.
// [L40] Documents that callers must reject ambiguous matches rather than write repeated sections.
// [L41] Explains that inspected fields retain ID-based matching and only designated contact sections use captions.
// [L42] Documents that caption-based resolution must not reuse known borrower or access-contact fields.
// [L43] Ends the resolver contract documentation.
/** The caller must require one match and one contact identity per role throughout preparation.
 * Historical fields retain exact IDs. Current UUID contacts require both name/ID agreement
 * and exact section/caption matching; the legacy agent resolver cannot capture reserved fields.
 */
// [L44] Defines the exported field-match predicate and the observed field metadata it accepts.
export function matchesR3Field(fieldKey, field) {
    // [L45] Looks up any known exact DOM ID for the requested application key.
    const expectedId = expectedR3FieldId(fieldKey);
    // [L46] Immediately resolves known keys by equality with their inspected ID.
    if (expectedId && field.id === expectedId)
        return true;
    // [L47] Splits an unrecognized key into role, attribute, and any invalid extra path segments.
    const [section = '', name = '', ...rest] = fieldKey.split('.');
    const current = currentContactId.exec(field.id);
    if (current) {
        if (rest.length || !Object.hasOwn(currentContactSections, section) || !Object.hasOwn(contactSuffixes, name)
            || (section === 'loanOfficer' && !loanOfficerFields.has(name)) || field.tag !== 'input'
            || !['input', 'text', 'email', 'tel'].includes(field.type))
            return false;
        // Extra status contacts share a heading: only visible candidates may participate in unique matching.
        // Access copies alone may be hidden after the approved borrower-copy action; session guards still govern writes.
        if (field.visible === false && section !== 'contact')
            return false;
        const suffix = contactSuffixes[name];
        return current[2] === suffix && field.name === `OrderItemEdit.Contacts[${current[1]}].${suffix}`
            && normalizeCaption(field.section.split(' > ').at(-1) ?? '') === normalizeCaption(currentContactSections[section])
            && normalizeCaption(field.label) === normalizeCaption(contactLabels[name]);
    }
    // A malformed collection ID/name must never fall back to the older, more general agent-ID shape.
    if (/^OrderItemEdit_Contacts/i.test(field.id) || /^OrderItemEdit\.Contacts/i.test(field.name ?? ''))
        return false;
    // Preserve historical exact-ID roles: they cannot fall through to the legacy agent caption resolver.
    if (expectedId)
        return false;
    // [L48] Begins rejecting extra segments and roles or attributes outside the screenshot-supported mappings.
    if (rest.length || !Object.hasOwn(contactSections, section) || !Object.hasOwn(contactLabels, name)
        // [L49] Also rejects unsupported loan-officer attributes, returning false for any invalid key shape.
        || (section === 'loanOfficer' && !loanOfficerFields.has(name)))
        return false;
    // [L50] Begins excluding malformed IDs, IDs already reserved by exact mappings, and explicitly hidden fields.
    if (!/^OrderItemEdit_[A-Za-z][A-Za-z0-9_]*$/.test(field.id) || knownFieldIds.has(field.id) || field.visible === false
        // [L51] Also requires a supported input tag/type, rejecting any candidate that violates these conditions.
        || field.tag !== 'input' || !['input', 'text', 'email', 'tel'].includes(field.type))
        return false;
    // [L52] Extracts the nearest section title from the observed section hierarchy.
    const nearestSection = field.section.split(' > ').at(-1) ?? '';
    // [L53] Requires the normalized nearest section to equal the approved caption for this contact role.
    return normalizeCaption(nearestSection) === normalizeCaption(contactSections[section])
        // [L54] Also requires the normalized field label to equal the approved caption for this contact attribute.
        && normalizeCaption(field.label) === normalizeCaption(contactLabels[name]);
    // [L55] Ends the field-matching predicate.
}
// [L56] Blank line separating the surrounding declarations, statements, or document blocks.
// [L57] Documents that baseline product labels were observed and still require document-specific suitability checks.
/** Observed baseline products. Document-specific requirements still control which is suitable. */
// [L58] Starts the exported immutable baseline appraisal-product table.
export const OBSERVED_BASELINE_PRODUCTS = {
    // [L59] Defines the observed conventional, FHA, and USDA single-family product labels.
    singleFamily: { Conventional: '1004 SFR CONV', FHA: '1004 SFR - FHA', USDA: '1004 SFR USDA' },
    // [L60] Defines the observed conventional, FHA, and USDA condominium product labels.
    condominium: { Conventional: '1073 CONDO CONV', FHA: '1073 CONDO FHA', USDA: '1073 CONDO USDA' },
    // [L61] Defines the observed conventional, FHA, and USDA manufactured-home product labels.
    manufacturedHome: { Conventional: '1004C MANU CONV', FHA: '1004C Manuf - FHA', USDA: '1004C MANU USDA' },
    // [L62] Defines the observed conventional, FHA, and USDA two-to-four-family product labels.
    twoToFourFamily: { Conventional: '1025 Multi-Family CONV', FHA: '1025 Multi - FHA', USDA: '1025 Multi-Family USDA' },
    // [L63] Ends the product table and preserves its literal types with a const assertion.
};
// [L64] Blank line separating the surrounding declarations, statements, or document blocks.
// [L65] Documents the intentionally narrow FHA product-label alias rule.
/** Only the optional separator in known FHA appraisal labels is interchangeable. */
// [L66] Defines the helper that returns approved alternate labels for a requested product.
export function productLabelAliases(value) {
    // [L67] Reads each property category's baseline products.
    const labels = Object.values(OBSERVED_BASELINE_PRODUCTS)
        // [L68] Builds each FHA label's unique original and optional-hyphen-free variants.
        .map(({ FHA }) => [...new Set([FHA, FHA.replace(' - ', ' ')])]);
    // [L69] Normalizes the requested label for comparison.
    const requested = normalizeCaption(value);
    // [L70] Finds the FHA variant group containing the normalized request.
    return labels.find(group => group.some(label => normalizeCaption(label) === requested))
        // [L71] Returns only different variants in that group, or an empty list when none matches.
        ?.filter(label => normalizeCaption(label) !== requested) ?? [];
    // [L72] Ends the product-label alias helper.
}
// [L73] Blank line separating the surrounding declarations, statements, or document blocks.
// [L74] Defines the resolver from application field keys to inspected R3 DOM IDs.
export function expectedR3FieldId(fieldKey) {
    // [L75] Returns a prefixed exact ID for keys present in the simple-field mapping.
    if (Object.hasOwn(simpleFields, fieldKey))
        return `OrderItemEdit_${simpleFields[fieldKey]}`;
    // [L76] Splits other keys into contact role, attribute, and extra segments.
    const [section = '', field = '', ...rest] = fieldKey.split('.');
    // [L77] Requires exactly two segments and a known contact role/attribute combination.
    if (!rest.length && Object.hasOwn(contactPrefixes, section) && Object.hasOwn(contactSuffixes, field)) {
        // [L78] Constructs the contact DOM ID from the shared prefix, role prefix, and attribute suffix.
        return `OrderItemEdit_${contactPrefixes[section]}${contactSuffixes[field]}`;
        // [L79] Ends known-contact ID construction.
    }
    // [L80] Returns undefined for keys without an inspected exact-ID mapping.
    return undefined;
    // [L81] Ends the exact field-ID resolver.
}
// [L82] Blank line separating the surrounding declarations, statements, or document blocks.
// [L83] Documents that masked-phone recovery is limited to established phone keys.
/** Only existing phone plan keys may use private masked-input recovery. */
// [L84] Defines the helper that extracts recoverable US phone digits from an approved field value.
export function phoneInputDigits(fieldKey, value) {
    // [L85] Rejects keys outside the specified contact phone attributes and loan-officer work phone.
    if (!/^(?:(?:borrower|coBorrower|contact|listingAgent|buyerAgent|statusContact)\.(?:workPhone|homePhone|mobilePhone)|loanOfficer\.workPhone)$/.test(fieldKey))
        return undefined;
    // [L86] Documents that ordinary formatting and an optional US country code may be removed.
    // Strip ordinary formatting and an optional US country code, never extensions or
    // [L87] Explains that unsupported extensions or international forms remain on the original fill/review path.
    // international prefixes. Unrecognized values retain their original fill/review path.
    // [L88] Removes allowed punctuation/whitespace and returns ten digits only when the whole value matches an optional US country code plus ten digits.
    return /^(?:\+?1)?(\d{10})$/.exec(value.replace(/[().\s-]/g, ''))?.[1];
    // [L89] Ends the phone-digit recovery helper.
}
// [L90] Blank line separating the surrounding declarations, statements, or document blocks.
// [L91] Defines the comparison between a page's text value and its approved plan value.
export function textValuesMatch(fieldKey, actual, expected) {
    // [L92] Accepts exactly identical strings immediately.
    if (actual === expected)
        return true;
    // [L93] Rejects a mismatch when either value is empty.
    if (expected === '' || actual === '')
        return false;
    // [L94] Begins special comparison for the three supported monetary fields.
    if (['loanAmount', 'salePrice', 'lastValuationAmount'].includes(fieldKey)) {
        // [L95] Defines a parser accepting digits/commas and an optional one- or two-digit decimal part, removing commas before numeric conversion and rejecting other formats with NaN.
        const parse = (value) => /^[\d,]+(?:\.\d{1,2})?$/.test(value) ? Number(value.replaceAll(',', '')) : Number.NaN;
        // [L96] Accepts monetary values only if the page value is finite and both parsed numbers are equal.
        return Number.isFinite(parse(actual)) && parse(actual) === parse(expected);
        // [L97] Ends monetary-value comparison.
    }
    // [L98] Begins tolerant formatting comparison for phone-suffixed keys.
    if (/\.(workPhone|homePhone|mobilePhone)$/.test(fieldKey)) {
        // [L99] Defines digit-only normalization and removes a leading US country code only from an eleven-digit value.
        const digits = (value) => value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
        // [L100] Requires at least ten normalized actual digits and exact equality with the expected normalized digits.
        return digits(actual).length >= 10 && digits(actual) === digits(expected);
        // [L101] Ends phone-value comparison.
    }
    // [L102] Rejects all remaining non-identical text values.
    return false;
    // [L103] Ends approved-text comparison.
}
// [L104] Blank line separating the surrounding declarations, statements, or document blocks.
// [L105] Defines the environment-variable filter used when launching Chromium.
export function browserEnvironment(source) {
    // [L106] Starts the case-insensitive allowlist of executable paths, Windows roots, shell, temporary directories, and user profile variables.
    const allowed = new Set(['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'USERPROFILE',
        // [L107] Adds home paths, application-data locations, program installation directories, and shared program data.
        'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'APPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA',
        // [L108] Completes the allowlist with processor architecture and processor-count variables.
        'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']);
    // [L109] Keeps only defined environment entries whose uppercased keys are allowed and returns them as a string-valued object.
    return Object.fromEntries(Object.entries(source).filter(([key, value]) => value !== undefined && allowed.has(key.toUpperCase())));
    // [L110] Ends the browser environment filter.
}
//# sourceMappingURL=r3-fields.js.map