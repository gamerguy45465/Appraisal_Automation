import { z } from 'zod';
import { AppError } from './errors.js';
import { OBSERVED_BASELINE_PRODUCTS, productLabelAliases } from './browser/r3-fields.js';

export const DEFAULT_MODEL = 'gpt-5.6-sol';
export const aiProviders = ['openai', 'anthropic', 'google', 'xai'] as const;
export type AiProvider = typeof aiProviders[number];
export const DEFAULT_PROVIDER = 'openai';
export const DEFAULT_MODELS = { openai: DEFAULT_MODEL, anthropic: 'claude-opus-5', google: 'gemini-3.8-flash', xai: 'grok-4.6' } as const;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const paymentMethods = ['Invoice', 'Pay by Credit Card', 'Request Payment From The Borrower'] as const;
export const inputSchema = z.object({
  provider: z.enum(aiProviders).default(DEFAULT_PROVIDER),
  apiKey: z.string().trim().min(20).max(512),
  loanNumber: z.string().regex(/^685-20\d{5}$/, 'Use 685-20 followed by five digits.'),
  fhaCaseNumber: z.string().trim().max(40).default(''),
  paymentMethod: z.enum(paymentMethods),
  rushOrder: z.union([z.boolean(), z.enum(['true', 'false', 'on'])]).optional().transform(v => v === true || v === 'true' || v === 'on'),
  model: z.string().trim().max(200).regex(/^[^\s\u0000-\u001f\u007f-\u009f]*$/, 'Enter a model ID without spaces or control characters.').default(''),
}).transform(input => ({ ...input, model: input.model || DEFAULT_MODELS[input.provider] }));
export type OrderInput = z.infer<typeof inputSchema>;
export interface UploadedPdf { readonly name: string; readonly buffer: Buffer }
export interface JobPayload { readonly input: OrderInput; readonly urla: UploadedPdf; readonly salesContract?: UploadedPdf }
export type JobStatus = 'queued' | 'extracting' | 'awaiting_login' | 'preparing' | 'awaiting_review' | 'user_submitted' | 'browser_closed' | 'failed';
export interface JobUpdate { readonly status: JobStatus; readonly message: string; readonly warnings?: string[] }
export interface WorkerUpdate extends JobUpdate { readonly type: 'status' }
export interface JobView extends JobUpdate { readonly id: string }

const text = () => z.string().nullable();
const contactSchema = z.object({ firstName: text(), lastName: text(), workPhone: text(), homePhone: text(), mobilePhone: text(), email: text() });
export const extractionSchema = z.object({
  loanProgram: z.enum(['Conventional', 'FHA', 'FHA Zero Down', 'VA', 'Other', 'Unknown']),
  loanProgramText: text(), loanPurpose: z.enum(['Purchase', 'Refinance', 'Other', 'Unknown']),
  product: text().describe('Appraisal service/form, never the mortgage financing product. Cite an explicit request as product evidence. Otherwise a supported standard appraisal recommendation must cite its underlying document facts as productRecommendation evidence and flag uncertainty for review.'),
  propertyType: text(), occupancy: text(),
  property: z.object({ address: text(), unit: text(), postalCode: text(), city: text(), state: text() }),
  secondaryLoanNumber: text(), loanType: text(), lienPosition: text(), loanAmount: z.number().positive().nullable(),
  salePrice: z.number().positive().nullable().describe('Total stated purchase/sale price from the supplied sales contract, including filled form fields and addenda, even if unsigned or a sample. Distinct from loan amount and cash to close. Null when unavailable or unresolved; never zero.'),
  lastValuationAmount: z.number().positive().nullable(), lastValuationDate: text(),
  borrower: contactSchema, coBorrower: contactSchema, listingAgent: contactSchema, buyerAgent: contactSchema,
  complexProperty: z.boolean(), highProfileCustomer: z.boolean(),
  evidence: z.array(z.object({ field: z.string(), document: z.enum(['urla', 'salesContract']), page: z.number().int().positive(), quote: z.string().max(300) })),
  warnings: z.array(z.string()),
});
export type ExtractedOrder = z.infer<typeof extractionSchema>;
export interface FieldPlan { readonly key: string; readonly value: string | boolean; readonly kind: 'text' | 'select' | 'checkbox'; readonly required?: boolean; readonly allowedLabels?: string[] }

const propertyAliases: Record<string, string> = {
  'single family': 'Single Family', 'single family home': 'Single Family', 'single family residence': 'Single Family',
  'single family detached': 'Single Family', 'single family detached home': 'Single Family', 'single family detached residence': 'Single Family',
  'detached single family': 'Single Family', 'detached single family home': 'Single Family', 'detached single family residence': 'Single Family', 'sfr': 'Single Family',
  'condo': 'Condominium', 'condominium': 'Condominium', 'condominium unit': 'Condominium',
  'manufactured': 'Manufactured Home', 'manufactured home': 'Manufactured Home', 'manufactured housing': 'Manufactured Home',
  '2 4 unit': 'Two To Four Family', '2 4 units': 'Two To Four Family', '2 to 4 unit': 'Two To Four Family', '2 to 4 units': 'Two To Four Family',
  'two to four family': 'Two To Four Family', 'two to four unit': 'Two To Four Family', 'two to four units': 'Two To Four Family',
  'townhouse': 'Townhouse or Rowhouse', 'townhome': 'Townhouse or Rowhouse', 'rowhouse': 'Townhouse or Rowhouse', 'townhouse or rowhouse': 'Townhouse or Rowhouse',
};
const occupancyAliases: Record<string, string> = {
  'primary residence': 'Owner (Primary Residence)', 'owner occupied': 'Owner (Primary Residence)',
  'second home': 'Owner (Secondary Residence)', 'secondary residence': 'Owner (Secondary Residence)',
  'tenant occupied': 'Tenant', 'vacant': 'Vacant',
};
function normalizeLabel(value: string | null, aliases: Record<string, string>): string | null {
  return value === null ? null : aliases[value.trim().toLowerCase()] ?? value;
}

/** Match explicit property descriptions only; unit count or project status alone is insufficient. */
function normalizePropertyType(value: string | null): string | null {
  const key = value?.trim().toLowerCase().replace(/[-\u2010-\u2015]/g, ' ').replace(/\s+/g, ' ');
  return key && Object.hasOwn(propertyAliases, key) ? propertyAliases[key]! : null;
}

/** Only infer a baseline product for the inspected, unambiguous property/program pairs. */
function baselineProduct(propertyType: string | null, program: ExtractedOrder['loanProgram']): string | null {
  const propertyKeys: Record<string, keyof typeof OBSERVED_BASELINE_PRODUCTS> = {
    'Single Family': 'singleFamily', 'Condominium': 'condominium', 'Manufactured Home': 'manufacturedHome', 'Two To Four Family': 'twoToFourFamily',
  };
  const key = propertyType ? propertyKeys[propertyType] : undefined;
  const programKey = program === 'Conventional' ? 'Conventional' : program.startsWith('FHA') ? 'FHA' : undefined;
  return key && programKey ? OBSERVED_BASELINE_PRODUCTS[key][programKey] : null;
}

/** Recommendations are separate from extracted property facts and need bounded approval. */
function selectProduct(data: ExtractedOrder, propertyType: string | null, hasContract: boolean, warnings: string[]): string | null {
  const requested = data.product?.trim() || null;
  const recommendation = data.evidence.filter(item => item.field === 'productRecommendation');
  const explicit = data.evidence.filter(item => item.field === 'product');
  const supported = (evidence: ExtractedOrder['evidence']): boolean => evidence.length > 0
    && evidence.every(item => item.quote.trim() && (item.document === 'urla' || hasContract && item.document === 'salesContract'));
  // A malformed marker must never fall through to the more permissive explicit-request path.
  if (recommendation.length) {
    const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();
    const labels = requested ? [requested, ...productLabelAliases(requested)].map(normalize) : [];
    const program = data.loanProgram === 'Conventional' ? 'Conventional' : data.loanProgram.startsWith('FHA') ? 'FHA' : null;
    const candidate = program ? Object.values(OBSERVED_BASELINE_PRODUCTS)
      .map(products => products[program]).find(value => labels.includes(normalize(value))) : undefined;
    const propertyBaseline = baselineProduct(propertyType, data.loanProgram);
    const propertyConsistent = !data.propertyType?.trim() || Boolean(propertyBaseline && candidate === propertyBaseline);
    if (!requested || !supported(recommendation) || explicit.length || !candidate || !propertyConsistent) {
      warnings.push('The appraisal product recommendation lacks supporting document evidence or conflicts with the loan program or property information. Select the product during review.');
      return null;
    }
    warnings.push(`Product ${requested} is an agent recommendation. Confirm the property classification and lender's appraisal requirements before submitting.`);
    return requested;
  }
  if (requested) {
    if (supported(explicit)) return requested;
    warnings.push('The stated appraisal product has no supporting document citation. Select the product during review.');
    return null;
  }
  const baseline = baselineProduct(propertyType, data.loanProgram);
  if (baseline) warnings.push(`Product ${baseline} was selected from the loan program and property type. Confirm that it matches the lender's appraisal requirements.`);
  return baseline;
}

/** Business rules run before R3 is opened for the user to sign in. */
export function validateLoan(data: ExtractedOrder, input: OrderInput): void {
  if (data.loanProgram === 'VA' || /\bVA\b|veterans? affairs/i.test(data.loanProgramText ?? '')) {
    throw new AppError('VA_NOT_SUPPORTED', 'Use the VA portal to order this appraisal. This application cannot assist with VA appraisals.');
  }
  if (data.loanProgram === 'Unknown' || data.loanPurpose === 'Unknown') {
    throw new AppError('LOAN_CLASSIFICATION_REQUIRED', 'The URLA loan program or purpose could not be established. Provide a legible, complete URLA.');
  }
  for (const field of ['loanProgram', 'loanPurpose']) {
    if (!data.evidence.some(item => item.field === field && item.document === 'urla' && item.quote.trim())) {
      throw new AppError('URLA_EVIDENCE_REQUIRED', 'The loan program and purpose must be supported by the URLA. Provide a legible, complete document.');
    }
  }
  if ((data.loanProgram.startsWith('FHA') || /\bFHA\b/i.test(data.loanProgramText ?? '')) && !input.fhaCaseNumber) {
    throw new AppError('FHA_CASE_REQUIRED', 'An FHA Case Number is required for FHA and FHA Zero Down loans.');
  }
}

/** Create the only values browser tools are allowed to write. Unknown values stay blank. */
export function buildFieldPlan(data: ExtractedOrder, input: OrderInput, hasContract: boolean): { plan: FieldPlan[]; warnings: string[]; missingRequiredFields: string[] } {
  validateLoan(data, input);
  const entries: FieldPlan[] = [];
  const missingRequiredFields: string[] = [];
  const warnings = ['Review every field against the source documents before submitting.', ...data.warnings.slice(0, 12).map(warning => warning.slice(0, 500))];
  const propertyType = normalizePropertyType(data.propertyType);
  if (data.propertyType?.trim() && !propertyType) warnings.push('The document property type could not be mapped to an inspected R3 option. Select it during review.');
  const product = selectProduct(data, propertyType, hasContract, warnings);
  const add = (key: string, value: string | number | boolean | null, kind: FieldPlan['kind'] = 'text', required = false, allowedLabels?: string[]): void => {
    if (value === null || value === '') {
      if (required) {
        missingRequiredFields.push(key);
        warnings.push(`Missing document information: ${key}. Complete this during review.`);
      }
      if (!required && kind === 'text') entries.push({ key, value: '', kind, required: false });
      return;
    }
    entries.push({ key, value: typeof value === 'number' ? String(value) : value, kind, required,
      ...(allowedLabels?.length ? { allowedLabels } : {}) });
  };
  add('branch', 'GUILD 685 SUMMERLIN ONE', 'select', true);
  add('product', product, 'select', true, product ? productLabelAliases(product) : undefined);
  add('propertyType', propertyType, 'select', true);
  const occupancy = normalizeLabel(data.occupancy, occupancyAliases);
  add('occupancy', occupancy === 'Investment Property' || occupancy?.toLowerCase() === 'investment property' ? 'Unknown' : occupancy, 'select', true);
  if (occupancy?.toLowerCase() === 'investment property') warnings.push('Investment-property occupancy does not establish whether the property is tenant occupied or vacant. Confirm occupancy in R3.');
  for (const [key, value] of Object.entries(data.property)) add(`property.${key}`, value, key === 'state' ? 'select' : 'text', key !== 'unit');
  add('county', 'Unknown', 'select');
  add('loanNumber', input.loanNumber, 'text', true);
  add('secondaryLoanNumber', data.secondaryLoanNumber);
  add('loanPurpose', data.loanPurpose, 'select', true);
  // The evidence-backed URLA classification controls R3 Loan Type, never free-form rate/type text.
  const loanType = data.loanProgram === 'Conventional' ? 'Conventional' : data.loanProgram.startsWith('FHA') ? 'FHA' : null;
  add('loanType', loanType, 'select', true);
  add('fhaCaseNumber', input.fhaCaseNumber, 'text', data.loanProgram.startsWith('FHA'));
  add('lienPosition', normalizeLabel(data.lienPosition, { '1': 'First', '1st': 'First', 'first lien': 'First', '2': 'Second', '2nd': 'Second', 'second lien': 'Second' }), 'select'); add('loanAmount', data.loanAmount, 'text', true);
  if (hasContract && data.loanPurpose === 'Purchase') add('salePrice', data.salePrice, 'text', true);
  add('lastValuationAmount', data.lastValuationAmount); add('lastValuationDate', data.lastValuationDate?.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') ?? null);
  const addContact = (section: string, contact: ExtractedOrder['borrower'] | null, required = false): void => {
    const fields = ['firstName', 'lastName', 'workPhone', 'homePhone', 'mobilePhone', 'email'] as const;
    let reachable = false;
    for (const key of fields) {
      const value = contact?.[key]?.trim() || null;
      const isName = key === 'firstName' || key === 'lastName';
      if (!isName && value) reachable = true;
      // Any supported phone/email can establish reachability; an absent phone type is not invented.
      add(`${section}.${key}`, value, 'text', required && (isName || Boolean(value)));
      // Missing required names still need review, but must clear any stale account/copied identity.
      if (required && isName && !value) add(`${section}.${key}`, '', 'text');
    }
    if (required && !reachable) {
      missingRequiredFields.push(`${section}.phoneOrEmail`);
      warnings.push(`Missing document information: ${section} phone or email. Complete this during review.`);
    }
  };
  addContact('borrower', data.borrower, true);
  addContact('coBorrower', data.coBorrower);
  add('borrowerIsAccessContact', data.loanPurpose === 'Refinance', 'checkbox', true);
  addContact('contact', data.loanPurpose === 'Refinance' ? data.borrower : data.loanPurpose === 'Purchase' ? data.listingAgent : null, true);
  for (const section of ['listingAgent', 'buyerAgent'] as const) {
    if (Object.values(data[section]).some(value => value?.trim())) addContact(section, data[section]);
  }
  // User-configured loan officer values apply to every order, independently of the PDFs.
  add('loanOfficer.firstName', 'Amber', 'text', true);
  add('loanOfficer.lastName', 'Coleman', 'text', true);
  add('loanOfficer.workPhone', '702-604-7027', 'text', true);
  add('loanOfficer.email', 'acoleman@guildmortgage.net', 'text', true);
  add('rushOrder', input.rushOrder, 'checkbox', true);
  add('complexProperty', data.complexProperty, 'checkbox'); add('highProfileCustomer', data.highProfileCustomer, 'checkbox');
  add('sideBySideOrder', false, 'checkbox'); add('paymentMethod', input.paymentMethod, 'select', true);
  add('statusContact.firstName', 'Amber Coleman Team', 'text', true);
  add('statusContact.email', 'ambercolemanteam@guildmortgage.net', 'text', true);
  // Explicit blanks prevent account defaults from leaking into a new order.
  for (const key of ['apn', 'fannieMaeCaseFileId', 'freddieMacLpaId', 'lockBoxCode', 'accessInstructions', 'preferredInspectionDate', 'preferredInspectionTime', 'alternateInspectionDate', 'alternateInspectionTime', 'specialHandling', 'statusContact.lastName', 'statusContact.workPhone']) {
    entries.push({ key, value: '', kind: 'text', required: false });
  }
  if (!(hasContract && data.loanPurpose === 'Purchase')) entries.push({ key: 'salePrice', value: '', kind: 'text', required: false });
  return { plan: entries, warnings, missingRequiredFields };
}

export function validatePdf(file: UploadedPdf): void {
  if (file.buffer.length > MAX_PDF_BYTES || file.buffer.length < 10 || !file.buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) {
    throw new AppError('INVALID_PDF', 'Upload a valid PDF document no larger than 15 MiB.');
  }
}
