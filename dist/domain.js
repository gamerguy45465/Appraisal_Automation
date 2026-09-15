// [L1] Imports Zod for runtime validation and inferred TypeScript types.
import { z } from 'zod';
// [L2] Imports the application's coded error class for input and business-rule failures.
import { AppError } from './errors.js';
// [L3] Imports observed R3 appraisal-product labels and their constrained alternate-label resolver.
import { OBSERVED_BASELINE_PRODUCTS, productLabelAliases } from './browser/r3-fields.js';
// [L4] Blank line separating the surrounding declarations, statements, or document blocks.
// [L5] Exports the default OpenAI model identifier.
export const DEFAULT_MODEL = 'gpt-5.6-sol';
// [L6] Defines the immutable list of supported AI provider identifiers.
export const aiProviders = ['openai', 'anthropic', 'google', 'xai'];
// [L8] Exports OpenAI as the default provider.
export const DEFAULT_PROVIDER = 'openai';
// [L9] Maps each supported provider to its configured default model identifier.
export const DEFAULT_MODELS = { openai: DEFAULT_MODEL, anthropic: 'claude-opus-5', google: 'gemini-3.8-flash', xai: 'grok-4.6' };
// [L10] Defines the per-PDF upload size limit as fifteen mebibytes.
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
// [L11] Defines the three supported payment-method labels as literal values.
export const paymentMethods = ['Invoice', 'Pay by Credit Card', 'Request Payment From The Borrower'];
// [L12] Begins runtime validation of order-submission inputs.
export const inputSchema = z.object({
    // [L13] Restricts provider selection to the supported list and defaults missing selection to OpenAI.
    provider: z.enum(aiProviders).default(DEFAULT_PROVIDER),
    // [L14] Trims the API key and requires a length between 20 and 512 characters.
    apiKey: z.string().trim().min(20).max(512),
    // [L15] Requires the loan-number pattern 685-20 followed by exactly five digits and supplies a validation message.
    loanNumber: z.string().regex(/^685-20\d{5}$/, 'Use 685-20 followed by five digits.'),
    // [L16] Trims the optional FHA case number, limits it to 40 characters, and defaults it to blank.
    fhaCaseNumber: z.string().trim().max(40).default(''),
    // [L17] Restricts payment method to the three defined labels.
    paymentMethod: z.enum(paymentMethods),
    // [L18] Accepts optional boolean/form-string rush flags and converts only true, 'true', and 'on' into true.
    rushOrder: z.union([z.boolean(), z.enum(['true', 'false', 'on'])]).optional().transform(v => v === true || v === 'true' || v === 'on'),
    // [L19] Trims and limits the model ID, rejects whitespace/control characters, and defaults missing input to blank.
    model: z.string().trim().max(200).regex(/^[^\s\u0000-\u001f\u007f-\u009f]*$/, 'Enter a model ID without spaces or control characters.').default(''),
    // [L20] Completes validation and replaces an empty model ID with the selected provider's default.
}).transform(input => ({ ...input, model: input.model || DEFAULT_MODELS[input.provider] }));
// [L28] Blank line separating the surrounding declarations, statements, or document blocks.
// [L29] Defines a reusable schema for a string value or null when unknown.
const text = () => z.string().nullable();
// [L30] Defines nullable name, phone, and email attributes shared by extracted contacts.
const contactSchema = z.object({ firstName: text(), lastName: text(), workPhone: text(), homePhone: text(), mobilePhone: text(), email: text() });
// [L31] Starts the structured document-extraction result schema.
export const extractionSchema = z.object({
    // [L32] Restricts extracted loan program to the listed supported/unknown classifications.
    loanProgram: z.enum(['Conventional', 'FHA', 'FHA Zero Down', 'VA', 'Other', 'Unknown']),
    // [L33] Defines nullable source program wording and a bounded loan-purpose classification.
    loanProgramText: text(), loanPurpose: z.enum(['Purchase', 'Refinance', 'Other', 'Unknown']),
    // [L34] Defines a nullable appraisal product and directs extraction to distinguish explicit requests from evidence-backed recommendations.
    product: text().describe('Appraisal service/form, never the mortgage financing product. Cite an explicit request as product evidence. Otherwise a supported standard appraisal recommendation must cite its underlying document facts as productRecommendation evidence and flag uncertainty for review.'),
    // [L35] Defines nullable property classification and occupancy values.
    propertyType: text(), occupancy: text(),
    // [L36] Defines nullable subject-property address, unit, postal code, city, and state fields.
    property: z.object({ address: text(), unit: text(), postalCode: text(), city: text(), state: text() }),
    // [L37] Defines nullable loan identifiers/type/lien information and a positive nullable loan amount.
    secondaryLoanNumber: text(), loanType: text(), lienPosition: text(), loanAmount: z.number().positive().nullable(),
    // [L38] Requires a positive sale price or null and describes extracting the contract's stated total without confusing it with loan amount or cash to close.
    salePrice: z.number().positive().nullable().describe('Total stated purchase/sale price from the supplied sales contract, including filled form fields and addenda, even if unsigned or a sample. Distinct from loan amount and cash to close. Null when unavailable or unresolved; never zero.'),
    // [L39] Defines a positive nullable prior valuation amount and a nullable valuation date.
    lastValuationAmount: z.number().positive().nullable(), lastValuationDate: text(),
    // [L40] Applies the contact schema to borrower, co-borrower, listing-agent, and buyer-agent records.
    borrower: contactSchema, coBorrower: contactSchema, listingAgent: contactSchema, buyerAgent: contactSchema,
    // [L41] Requires boolean complex-property and prominent-customer flags.
    complexProperty: z.boolean(), highProfileCustomer: z.boolean(),
    // [L42] Requires evidence entries with a field name, supported document identifier, positive integer page number, and quotation of at most 300 characters.
    evidence: z.array(z.object({ field: z.string(), document: z.enum(['urla', 'salesContract']), page: z.number().int().positive(), quote: z.string().max(300) })),
    // [L43] Requires an array of extraction warnings.
    warnings: z.array(z.string()),
    // [L44] Ends the extraction-result schema.
});
// [L47] Blank line separating the surrounding declarations, statements, or document blocks.
// [L48] Starts the explicit property-description alias table for inspected R3 options.
const propertyAliases = {
    // [L49] Maps common single-family descriptions to the Single Family option.
    'single family': 'Single Family', 'single family home': 'Single Family', 'single family residence': 'Single Family',
    // [L50] Maps explicit single-family detached descriptions to the Single Family option.
    'single family detached': 'Single Family', 'single family detached home': 'Single Family', 'single family detached residence': 'Single Family',
    // [L51] Maps detached-single-family word orders and the SFR abbreviation to Single Family.
    'detached single family': 'Single Family', 'detached single family home': 'Single Family', 'detached single family residence': 'Single Family', 'sfr': 'Single Family',
    // [L52] Maps condo/condominium descriptions to Condominium.
    'condo': 'Condominium', 'condominium': 'Condominium', 'condominium unit': 'Condominium',
    // [L53] Maps manufactured-housing descriptions to Manufactured Home.
    'manufactured': 'Manufactured Home', 'manufactured home': 'Manufactured Home', 'manufactured housing': 'Manufactured Home',
    // [L54] Maps numeric two-to-four-unit descriptions to Two To Four Family.
    '2 4 unit': 'Two To Four Family', '2 4 units': 'Two To Four Family', '2 to 4 unit': 'Two To Four Family', '2 to 4 units': 'Two To Four Family',
    // [L55] Maps spelled-out two-to-four-family/unit descriptions to Two To Four Family.
    'two to four family': 'Two To Four Family', 'two to four unit': 'Two To Four Family', 'two to four units': 'Two To Four Family',
    // [L56] Maps townhouse, townhome, and rowhouse descriptions to Townhouse or Rowhouse.
    'townhouse': 'Townhouse or Rowhouse', 'townhome': 'Townhouse or Rowhouse', 'rowhouse': 'Townhouse or Rowhouse', 'townhouse or rowhouse': 'Townhouse or Rowhouse',
    // [L57] Ends the property alias table.
};
// [L58] Starts the occupancy-label alias table.
const occupancyAliases = {
    // [L59] Maps primary-residence and owner-occupied wording to the primary owner-occupancy option.
    'primary residence': 'Owner (Primary Residence)', 'owner occupied': 'Owner (Primary Residence)',
    // [L60] Maps second-home wording to the secondary owner-residence option.
    'second home': 'Owner (Secondary Residence)', 'secondary residence': 'Owner (Secondary Residence)',
    // [L61] Maps tenant-occupied and vacant descriptions to their respective occupancy options.
    'tenant occupied': 'Tenant', 'vacant': 'Vacant',
    // [L62] Ends the occupancy alias table.
};
// [L63] Defines nullable label normalization using a caller-supplied alias map.
function normalizeLabel(value, aliases) {
    // [L64] Preserves null; otherwise looks up trimmed lowercase wording and falls back to the original value.
    return value === null ? null : aliases[value.trim().toLowerCase()] ?? value;
    // [L65] Ends the general label-normalization helper.
}
// [L66] Blank line separating the surrounding declarations, statements, or document blocks.
// [L67] Documents that property classification requires an explicit description, not isolated unit count or project status.
/** Match explicit property descriptions only; unit count or project status alone is insufficient. */
// [L68] Defines the property-type normalizer for nullable extracted wording.
function normalizePropertyType(value) {
    // [L69] Trims and lowercases the description, replaces supported hyphen/dash characters with spaces, and collapses whitespace.
    const key = value?.trim().toLowerCase().replace(/[-\u2010-\u2015]/g, ' ').replace(/\s+/g, ' ');
    // [L70] Returns a known property option only for an explicit alias match, otherwise null.
    return key && Object.hasOwn(propertyAliases, key) ? propertyAliases[key] : null;
    // [L71] Ends property-type normalization.
}
// [L72] Blank line separating the surrounding declarations, statements, or document blocks.
// [L73] Documents that baseline product inference is limited to inspected property/program combinations.
/** Only infer a baseline product for the inspected, unambiguous property/program pairs. */
// [L74] Defines baseline appraisal-product selection from normalized property type and loan classification.
function baselineProduct(propertyType, program) {
    // [L75] Starts the mapping from R3 property labels to baseline-product table categories.
    const propertyKeys = {
        // [L76] Maps the four supported property options to their baseline category keys.
        'Single Family': 'singleFamily', 'Condominium': 'condominium', 'Manufactured Home': 'manufacturedHome', 'Two To Four Family': 'twoToFourFamily',
        // [L77] Ends the property-to-product-category mapping.
    };
    // [L78] Looks up a baseline category only when a property type is available.
    const key = propertyType ? propertyKeys[propertyType] : undefined;
    // [L79] Supports conventional programs and FHA-prefixed programs for automatic baseline selection.
    const programKey = program === 'Conventional' ? 'Conventional' : program.startsWith('FHA') ? 'FHA' : undefined;
    // [L80] Returns the corresponding observed product when both keys are supported, otherwise null.
    return key && programKey ? OBSERVED_BASELINE_PRODUCTS[key][programKey] : null;
    // [L81] Ends baseline product selection.
}
// [L82] Blank line separating the surrounding declarations, statements, or document blocks.
// [L83] Documents that appraisal recommendations need bounded approval separate from extracted facts.
/** Recommendations are separate from extracted property facts and need bounded approval. */
// [L84] Defines product selection using extracted data, normalized property type, contract availability, and an accumulating warning list.
function selectProduct(data, propertyType, hasContract, warnings) {
    // [L85] Trims the extracted/requested product and converts an empty result to null.
    const requested = data.product?.trim() || null;
    // [L86] Collects evidence entries explicitly marked as product recommendations.
    const recommendation = data.evidence.filter(item => item.field === 'productRecommendation');
    // [L87] Collects evidence entries explicitly marked as requested appraisal products.
    const explicit = data.evidence.filter(item => item.field === 'product');
    // [L88] Starts a predicate requiring at least one supporting evidence entry.
    const supported = (evidence) => evidence.length > 0
        // [L89] Requires every evidence quote to be nonblank and to cite URLA or an actually supplied sales contract.
        && evidence.every(item => item.quote.trim() && (item.document === 'urla' || hasContract && item.document === 'salesContract'));
    // [L90] Explains why the presence of recommendation markers must force the stricter recommendation branch.
    // A malformed marker must never fall through to the more permissive explicit-request path.
    // [L91] Begins validation when recommendation evidence exists.
    if (recommendation.length) {
        // [L92] Defines case/whitespace normalization for appraisal-product label comparison.
        const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
        // [L93] Normalizes the requested label and its approved aliases, or uses an empty candidate list.
        const labels = requested ? [requested, ...productLabelAliases(requested)].map(normalize) : [];
        // [L94] Limits recommendation matching to conventional or FHA program categories.
        const program = data.loanProgram === 'Conventional' ? 'Conventional' : data.loanProgram.startsWith('FHA') ? 'FHA' : null;
        // [L95] Starts searching observed baseline products when a supported program exists.
        const candidate = program ? Object.values(OBSERVED_BASELINE_PRODUCTS)
            // [L96] Chooses the first program-specific observed label matching the normalized request or its aliases.
            .map(products => products[program]).find(value => labels.includes(normalize(value))) : undefined;
        // [L97] Computes the baseline implied by the normalized property type and loan program.
        const propertyBaseline = baselineProduct(propertyType, data.loanProgram);
        // [L98] Accepts missing property wording, but otherwise requires a known property baseline equal to the candidate product.
        const propertyConsistent = !data.propertyType?.trim() || Boolean(propertyBaseline && candidate === propertyBaseline);
        // [L99] Rejects recommendations missing a request, valid evidence, unique recommendation status, a known candidate, or property consistency.
        if (!requested || !supported(recommendation) || explicit.length || !candidate || !propertyConsistent) {
            // [L100] Adds a review warning explaining unsupported or conflicting product recommendations.
            warnings.push('The appraisal product recommendation lacks supporting document evidence or conflicts with the loan program or property information. Select the product during review.');
            // [L101] Leaves the product unresolved when recommendation checks fail.
            return null;
            // [L102] Ends rejection of unsupported recommendations.
        }
        // [L103] Warns that the accepted product is an agent recommendation requiring property/lender review.
        warnings.push(`Product ${requested} is an agent recommendation. Confirm the property classification and lender's appraisal requirements before submitting.`);
        // [L104] Returns the supported requested recommendation label.
        return requested;
        // [L105] Ends the recommendation-evidence branch.
    }
    // [L106] Begins handling a stated product without recommendation markers.
    if (requested) {
        // [L107] Accepts the stated product when explicit-request evidence passes the support check.
        if (supported(explicit))
            return requested;
        // [L108] Adds a warning when the stated product lacks a usable document citation.
        warnings.push('The stated appraisal product has no supporting document citation. Select the product during review.');
        // [L109] Leaves an unsupported stated product unresolved.
        return null;
        // [L110] Ends explicit-product handling.
    }
    // [L111] Computes a baseline product when no product was stated.
    const baseline = baselineProduct(propertyType, data.loanProgram);
    // [L112] Adds a lender-requirements review warning when automatic baseline selection succeeds.
    if (baseline)
        warnings.push(`Product ${baseline} was selected from the loan program and property type. Confirm that it matches the lender's appraisal requirements.`);
    // [L113] Returns the selected baseline or null.
    return baseline;
    // [L114] Ends appraisal-product selection.
}
// [L115] Blank line separating the surrounding declarations, statements, or document blocks.
// [L116] Documents that loan business rules run before opening the R3 sign-in browser.
/** Business rules run before R3 is opened for the user to sign in. */
// [L117] Defines validation of extracted loan facts against user inputs.
export function validateLoan(data, input) {
    // [L118] Detects VA classification from either the structured program or the source program wording.
    if (data.loanProgram === 'VA' || /\bVA\b|veterans? affairs/i.test(data.loanProgramText ?? '')) {
        // [L119] Rejects VA work with a coded error directing the user to the VA portal.
        throw new AppError('VA_NOT_SUPPORTED', 'Use the VA portal to order this appraisal. This application cannot assist with VA appraisals.');
        // [L120] Ends the VA rejection branch.
    }
    // [L121] Detects unknown loan-program or loan-purpose classifications.
    if (data.loanProgram === 'Unknown' || data.loanPurpose === 'Unknown') {
        // [L122] Rejects unresolved classification and requests a legible complete URLA.
        throw new AppError('LOAN_CLASSIFICATION_REQUIRED', 'The URLA loan program or purpose could not be established. Provide a legible, complete URLA.');
        // [L123] Ends the unknown-classification branch.
    }
    // [L124] Checks URLA evidence for loan program and loan purpose in turn.
    for (const field of ['loanProgram', 'loanPurpose']) {
        // [L125] Requires a matching field citation from the URLA with a nonblank quote.
        if (!data.evidence.some(item => item.field === field && item.document === 'urla' && item.quote.trim())) {
            // [L126] Rejects classifications that lack supporting URLA evidence.
            throw new AppError('URLA_EVIDENCE_REQUIRED', 'The loan program and purpose must be supported by the URLA. Provide a legible, complete document.');
            // [L127] Ends rejection of a missing classification citation.
        }
        // [L128] Ends the required-classification evidence loop.
    }
    // [L129] Detects FHA classification or source wording when the user supplied no FHA case number.
    if ((data.loanProgram.startsWith('FHA') || /\bFHA\b/i.test(data.loanProgramText ?? '')) && !input.fhaCaseNumber) {
        // [L130] Rejects FHA and FHA Zero Down preparation without a case number.
        throw new AppError('FHA_CASE_REQUIRED', 'An FHA Case Number is required for FHA and FHA Zero Down loans.');
        // [L131] Ends the FHA case-number requirement branch.
    }
    // [L132] Ends loan business-rule validation.
}
// [L133] Blank line separating the surrounding declarations, statements, or document blocks.
// [L134] Documents that this builder defines all browser-writable values and leaves unknown facts blank.
/** Create the only values browser tools are allowed to write. Unknown values stay blank. */
// [L135] Defines approved field-plan construction and its plan, warnings, and missing-required-field result.
export function buildFieldPlan(data, input, hasContract) {
    // [L136] Applies loan validation before producing any browser field values.
    validateLoan(data, input);
    // [L137] Creates the ordered list of approved field entries.
    const entries = [];
    // [L138] Creates the list of unresolved required field keys.
    const missingRequiredFields = [];
    // [L139] Starts warnings with mandatory source-document review and up to twelve extracted warnings truncated to 500 characters each.
    const warnings = ['Review every field against the source documents before submitting.', ...data.warnings.slice(0, 12).map(warning => warning.slice(0, 500))];
    // [L140] Normalizes the extracted property description to a known R3 option.
    const propertyType = normalizePropertyType(data.propertyType);
    // [L141] Warns when a nonblank property description cannot map to an inspected option.
    if (data.propertyType?.trim() && !propertyType)
        warnings.push('The document property type could not be mapped to an inspected R3 option. Select it during review.');
    // [L142] Selects the appraisal product while accumulating any recommendation/evidence warnings.
    const product = selectProduct(data, propertyType, hasContract, warnings);
    // [L143] Defines the entry-adding helper with text/default optional settings and optional approved dropdown aliases.
    const add = (key, value, kind = 'text', required = false, allowedLabels) => {
        // [L144] Begins handling unknown or empty values.
        if (value === null || value === '') {
            // [L145] Begins required-value handling for an absent value.
            if (required) {
                // [L146] Records the missing required field key.
                missingRequiredFields.push(key);
                // [L147] Adds a warning instructing the user to complete that missing fact during review.
                warnings.push(`Missing document information: ${key}. Complete this during review.`);
                // [L148] Ends missing-required-value reporting.
            }
            // [L149] Adds an explicit blank only for an optional text field, so stale defaults can be cleared.
            if (!required && kind === 'text')
                entries.push({ key, value: '', kind, required: false });
            // [L150] Stops adding the current value after absent-value handling.
            return;
            // [L151] Ends the absent-value branch.
        }
        // [L152] Appends a populated entry, converting numbers to strings and carrying its kind/required flag.
        entries.push({ key, value: typeof value === 'number' ? String(value) : value, kind, required,
            // [L153] Includes approved aliases only when the alias list is nonempty, then completes the entry insertion.
            ...(allowedLabels?.length ? { allowedLabels } : {}) });
        // [L154] Ends the entry-adding helper.
    };
    // [L155] Requires the configured Guild Summerlin branch dropdown value.
    add('branch', 'GUILD 685 SUMMERLIN ONE', 'select', true);
    // [L156] Adds the required selected appraisal product with its constrained alternate labels when available.
    add('product', product, 'select', true, product ? productLabelAliases(product) : undefined);
    // [L157] Adds the required normalized property-type selection.
    add('propertyType', propertyType, 'select', true);
    // [L158] Normalizes extracted occupancy through the known label aliases.
    const occupancy = normalizeLabel(data.occupancy, occupancyAliases);
    // [L159] Adds required occupancy, mapping investment-property wording to Unknown rather than inferring tenant/vacant status.
    add('occupancy', occupancy === 'Investment Property' || occupancy?.toLowerCase() === 'investment property' ? 'Unknown' : occupancy, 'select', true);
    // [L160] Warns that investment classification alone does not determine tenant versus vacant occupancy.
    if (occupancy?.toLowerCase() === 'investment property')
        warnings.push('Investment-property occupancy does not establish whether the property is tenant occupied or vacant. Confirm occupancy in R3.');
    // [L161] Adds each property-address component, making state a dropdown and every component except unit required.
    for (const [key, value] of Object.entries(data.property))
        add(`property.${key}`, value, key === 'state' ? 'select' : 'text', key !== 'unit');
    // [L162] Sets the optional county dropdown to Unknown.
    add('county', 'Unknown', 'select');
    // [L163] Adds the user's loan number as a required text value.
    add('loanNumber', input.loanNumber, 'text', true);
    // [L164] Adds the extracted secondary loan number as optional text.
    add('secondaryLoanNumber', data.secondaryLoanNumber);
    // [L165] Adds the extracted loan purpose as a required dropdown selection.
    add('loanPurpose', data.loanPurpose, 'select', true);
    // [L166] Explains that evidence-backed program classification controls loan type instead of free-form loan text.
    // The evidence-backed URLA classification controls R3 Loan Type, never free-form rate/type text.
    // [L167] Converts conventional or FHA-prefixed program classification into a supported R3 loan-type label, otherwise null.
    const loanType = data.loanProgram === 'Conventional' ? 'Conventional' : data.loanProgram.startsWith('FHA') ? 'FHA' : null;
    // [L168] Adds the resulting loan type as a required dropdown entry.
    add('loanType', loanType, 'select', true);
    // [L169] Adds the user-supplied FHA case number and marks it required for FHA-prefixed programs.
    add('fhaCaseNumber', input.fhaCaseNumber, 'text', data.loanProgram.startsWith('FHA'));
    // [L170] Maps first/second lien aliases into an optional dropdown entry and adds the extracted loan amount as required text.
    add('lienPosition', normalizeLabel(data.lienPosition, { '1': 'First', '1st': 'First', 'first lien': 'First', '2': 'Second', '2nd': 'Second', 'second lien': 'Second' }), 'select');
    add('loanAmount', data.loanAmount, 'text', true);
    // [L171] Adds a required sale price only for purchases with a supplied contract.
    if (hasContract && data.loanPurpose === 'Purchase')
        add('salePrice', data.salePrice, 'text', true);
    // [L172] Adds optional prior valuation amount and converts an ISO-formatted prior valuation date to month/day/year while preserving other supplied formats.
    add('lastValuationAmount', data.lastValuationAmount);
    add('lastValuationDate', data.lastValuationDate?.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') ?? null);
    // [L173] Defines a helper for adding a contact section with optional overall requiredness.
    const addContact = (section, contact, required = false) => {
        // [L174] Lists the six contact attributes that will be processed in a fixed order.
        const fields = ['firstName', 'lastName', 'workPhone', 'homePhone', 'mobilePhone', 'email'];
        // [L175] Starts with no known phone/email reachability for the contact.
        let reachable = false;
        // [L176] Iterates through the supported contact attributes.
        for (const key of fields) {
            // [L177] Trims the contact attribute and treats absent or blank values as unknown.
            const value = contact?.[key]?.trim() || null;
            // [L178] Identifies first and last names separately from communication details.
            const isName = key === 'firstName' || key === 'lastName';
            // [L179] Marks the contact reachable when any non-name field contains a value.
            if (!isName && value)
                reachable = true;
            // [L180] Documents that any supported phone or email is sufficient and missing phone categories are not fabricated.
            // Any supported phone/email can establish reachability; an absent phone type is not invented.
            // [L181] Adds the contact attribute, requiring names and supplied communication fields only when the contact is required.
            add(`${section}.${key}`, value, 'text', required && (isName || Boolean(value)));
            // [L182] Explains that missing required names still require review while stale copied/account names must be cleared.
            // Missing required names still need review, but must clear any stale account/copied identity.
            // [L183] Adds an optional explicit blank to clear a missing required name after recording its absence.
            if (required && isName && !value)
                add(`${section}.${key}`, '', 'text');
            // [L184] Ends the contact-attribute loop.
        }
        // [L185] Checks whether a required contact lacks every supported phone/email value.
        if (required && !reachable) {
            // [L186] Records a synthetic phoneOrEmail missing-field key for the contact section.
            missingRequiredFields.push(`${section}.phoneOrEmail`);
            // [L187] Warns the user to supply contact reachability during review.
            warnings.push(`Missing document information: ${section} phone or email. Complete this during review.`);
            // [L188] Ends missing-reachability reporting.
        }
        // [L189] Ends the contact-section helper.
    };
    // [L190] Adds the borrower as a required contact.
    addContact('borrower', data.borrower, true);
    // [L191] Adds optional co-borrower details.
    addContact('coBorrower', data.coBorrower);
    // [L192] Requires the borrower-as-access-contact checkbox to reflect whether the loan is a refinance.
    add('borrowerIsAccessContact', data.loanPurpose === 'Refinance', 'checkbox', true);
    // [L193] Adds a required access contact using the borrower for refinance, listing agent for purchase, or unresolved values for other purposes.
    addContact('contact', data.loanPurpose === 'Refinance' ? data.borrower : data.loanPurpose === 'Purchase' ? data.listingAgent : null, true);
    // [L194] Iterates through listing-agent and buyer-agent sections.
    for (const section of ['listingAgent', 'buyerAgent']) {
        // [L195] Adds an optional agent section only when at least one of its extracted values is nonblank.
        if (Object.values(data[section]).some(value => value?.trim()))
            addContact(section, data[section]);
        // [L196] Ends optional agent-section processing.
    }
    // [L197] Documents that the user-configured loan officer applies independently of document extraction.
    // User-configured loan officer values apply to every order, independently of the PDFs.
    // [L198] Requires Amber as the loan officer's first name.
    add('loanOfficer.firstName', 'Amber', 'text', true);
    // [L199] Requires Coleman as the loan officer's last name.
    add('loanOfficer.lastName', 'Coleman', 'text', true);
    // [L200] Requires the configured loan-officer work phone.
    add('loanOfficer.workPhone', '702-604-7027', 'text', true);
    // [L201] Requires the configured loan-officer email address.
    add('loanOfficer.email', 'acoleman@guildmortgage.net', 'text', true);
    // [L202] Adds the user's rush-order setting as a required checkbox value.
    add('rushOrder', input.rushOrder, 'checkbox', true);
    // [L203] Adds the extracted complex-property and prominent-customer flags as optional checkbox entries.
    add('complexProperty', data.complexProperty, 'checkbox');
    add('highProfileCustomer', data.highProfileCustomer, 'checkbox');
    // [L204] Explicitly disables side-by-side ordering and requires the user's payment-method selection.
    add('sideBySideOrder', false, 'checkbox');
    add('paymentMethod', input.paymentMethod, 'select', true);
    // [L205] Requires the configured team name in the status-contact first-name field.
    add('statusContact.firstName', 'Amber Coleman Team', 'text', true);
    // [L206] Requires the configured team email in the status-contact email field.
    add('statusContact.email', 'ambercolemanteam@guildmortgage.net', 'text', true);
    // [L207] Explains that explicit empty entries clear account defaults from the new order.
    // Explicit blanks prevent account defaults from leaking into a new order.
    // [L208] Iterates through unsupported/unprovided identifiers, access and scheduling fields, management notes, and selected status-contact fields to clear them.
    for (const key of ['apn', 'fannieMaeCaseFileId', 'freddieMacLpaId', 'lockBoxCode', 'accessInstructions', 'preferredInspectionDate', 'preferredInspectionTime', 'alternateInspectionDate', 'alternateInspectionTime', 'specialHandling', 'statusContact.lastName', 'statusContact.workPhone']) {
        // [L209] Adds an optional empty text entry for the current field to remove any existing default.
        entries.push({ key, value: '', kind: 'text', required: false });
        // [L210] Ends the explicit-blank field loop.
    }
    // [L211] Explicitly clears sale price whenever the job is not a purchase with a supplied contract.
    if (!(hasContract && data.loanPurpose === 'Purchase'))
        entries.push({ key: 'salePrice', value: '', kind: 'text', required: false });
    // [L212] Returns the assembled approved plan, accumulated warnings, and unresolved required field keys.
    return { plan: entries, warnings, missingRequiredFields };
    // [L213] Ends field-plan construction.
}
// [L214] Blank line separating the surrounding declarations, statements, or document blocks.
// [L215] Defines validation of an uploaded PDF's size and signature.
export function validatePdf(file) {
    // [L216] Rejects buffers over fifteen mebibytes, under ten bytes, or without a PDF signature in their first 1024 bytes.
    if (file.buffer.length > MAX_PDF_BYTES || file.buffer.length < 10 || !file.buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) {
        // [L217] Throws the coded invalid-PDF error with the upload-size requirement.
        throw new AppError('INVALID_PDF', 'Upload a valid PDF document no larger than 15 MiB.');
        // [L218] Ends invalid-PDF rejection.
    }
    // [L219] Ends uploaded-PDF validation.
}
//# sourceMappingURL=domain.js.map