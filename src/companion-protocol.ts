import { z } from 'zod';
import { inputSchema, MAX_PDF_BYTES, validatePdf, type JobPayload } from './domain.js';
import { AppError } from './errors.js';

export const COMPANION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const MAX_RELAY_RESPONSE_BYTES = 2 * Math.ceil(MAX_PDF_BYTES / 3) * 4 + 65536;

const inputKeys = new Set(['provider', 'apiKey', 'loanNumber', 'fhaCaseNumber', 'paymentMethod', 'rushOrder', 'model']);
const serializedInputSchema = z.preprocess(value => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !inputKeys.has(key))) return undefined;
  return value;
}, inputSchema);
const serializedPayloadSchema = z.object({
  input: serializedInputSchema,
  urla: z.string().min(1).max(Math.ceil(MAX_PDF_BYTES / 3) * 4),
  salesContract: z.string().min(1).max(Math.ceil(MAX_PDF_BYTES / 3) * 4).optional(),
}).strict();
export type SerializedJobPayload = z.infer<typeof serializedPayloadSchema>;

export const relayConnectResponseSchema = z.object({ token: z.string().regex(COMPANION_TOKEN_PATTERN) }).strict();
export const relayExchangeInputSchema = z.object({
  sequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  stopping: z.boolean().optional(),
  acceptedJobId: z.uuid().optional(),
  declinedJobId: z.uuid().optional(),
  update: z.object({
    id: z.uuid(),
    status: z.enum(['queued', 'extracting', 'awaiting_login', 'preparing', 'awaiting_review', 'user_submitted', 'browser_closed', 'failed']),
    message: z.string().max(2000),
    warnings: z.array(z.string().max(2000)).max(100).optional(),
    canStartAnother: z.boolean(),
    // A retained review browser and an in-flight local worker both keep ownership.
    browserOpen: z.boolean(),
  }).strict().optional(),
}).strict();
export type RelayExchangeInput = z.infer<typeof relayExchangeInputSchema>;
export const relayExchangeResponseSchema = z.object({
  job: z.object({ id: z.uuid(), payload: serializedPayloadSchema }).strict().optional(),
}).strict();
export type RelayExchangeResponse = z.infer<typeof relayExchangeResponseSchema>;

export function serializeJobPayload(payload: JobPayload): SerializedJobPayload {
  return {
    input: { ...payload.input },
    urla: payload.urla.buffer.toString('base64'),
    ...(payload.salesContract ? { salesContract: payload.salesContract.buffer.toString('base64') } : {}),
  };
}

/** Decode only canonical, bounded PDFs, and clear every allocated buffer on failure. */
export function deserializeJobPayload(value: unknown): JobPayload {
  const parsed = serializedPayloadSchema.safeParse(value);
  if (!parsed.success) throw new AppError('COMPANION_PAYLOAD_INVALID', 'The companion received an invalid preparation request.', 400);
  const buffers: Buffer[] = [];
  try {
    const decode = (base64: string, name: string) => {
      const buffer = Buffer.from(base64, 'base64');
      buffers.push(buffer);
      if (buffer.length > MAX_PDF_BYTES || buffer.toString('base64') !== base64) throw new Error('Invalid encoding');
      const pdf = { name, buffer };
      validatePdf(pdf);
      return pdf;
    };
    return {
      input: parsed.data.input,
      urla: decode(parsed.data.urla, 'urla.pdf'),
      ...(parsed.data.salesContract ? { salesContract: decode(parsed.data.salesContract, 'sales-contract.pdf') } : {}),
    };
  } catch {
    for (const buffer of buffers) buffer.fill(0);
    parsed.data.input.apiKey = '';
    throw new AppError('COMPANION_PAYLOAD_INVALID', 'The companion received an invalid preparation request.', 400);
  }
}
