import type { AiProvider } from './domain.js';

/** An intentionally safe message that can cross the API/worker boundary. */
export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly statusCode = 400) {
    super(message);
    this.name = 'AppError';
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

/** Inspect known SDK error shapes privately; none of this text may leave this module. */
function providerMessage(info: Record<string, unknown>): string {
  const detail = record(info.error);
  const nested = record(detail.error);
  const message = nested.message ?? detail.message ?? info.message;
  return typeof message === 'string' ? message.slice(0, 8000) : '';
}

function anthropicRequestError(message: string): AppError | undefined {
  if (/credit balance.{0,40}(?:too low|insufficient)|insufficient.{0,20}credits?/i.test(message)) {
    return new AppError('API_QUOTA', 'Anthropic API credits are insufficient. Check the API account billing and credit balance, then try again.', 502);
  }
  if (/schema.{0,100}(?:too complex|compilation|union|optional parameter)|(?:too many|maximum|limit).{0,80}(?:union types?|optional parameters?)/i.test(message)) {
    return new AppError('MODEL_SCHEMA', 'Anthropic rejected the structured extraction schema. Restart the updated application and try again.', 502);
  }
  if (/prompt is too long|context.{0,40}(?:limit|exceed)|(?:request|pdf|document).{0,60}(?:too large|too many pages|exceeds?.{0,20}(?:size|page|limit))|maximum.{0,30}(?:pages|request size)/i.test(message)) {
    return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed an Anthropic request or model context limit. Use smaller or shorter PDFs and try again.', 502);
  }
  if (/(?:pdf|document).{0,60}(?:password|encrypted|invalid|not valid|corrupt)|(?:invalid|encrypted|corrupt).{0,30}(?:pdf|document)/i.test(message)) {
    return new AppError('DOCUMENT_PDF_INVALID', 'Anthropic could not read a PDF. Supply valid PDFs without password protection or encryption and try again.', 502);
  }
  if (/(?:output_config|json_schema|structured outputs?|pdf|image|tool_choice|thinking).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:output_config|json_schema|structured outputs?|pdf|image|tool_choice|thinking)/i.test(message)) {
    return new AppError('MODEL_CAPABILITY', 'The selected Anthropic model does not support a required document or extraction feature. Check the model capabilities and choose a compatible model.', 502);
  }
  return undefined;
}

/** Google RequestError keeps its response in data, and may retain a key-bearing URL. */
function googleRequestError(info: Record<string, unknown>, status: number): AppError | undefined {
  const detail = record(record(info.data).error);
  const message = typeof detail.message === 'string' ? detail.message.slice(0, 8000) : providerMessage(info);
  const reasons = Array.isArray(detail.details) ? detail.details.slice(0, 32).map(value => record(value).reason) : [];
  if (reasons.some(reason => typeof reason === 'string' && /^API_KEY_(?:INVALID|EXPIRED|SERVICE_BLOCKED|IP_ADDRESS_BLOCKED|HTTP_REFERRER_BLOCKED|ANDROID_APP_BLOCKED|IOS_APP_BLOCKED)$/.test(reason))
    || /api[ _-]?key.{0,80}(?:not valid|invalid|expired|blocked|reported as leaked)|(?:invalid|expired).{0,30}api[ _-]?key/i.test(message)) {
    return new AppError('API_AUTH', 'Google Gemini could not authenticate the API key. Check the key and its API restrictions in Google AI Studio.', 502);
  }
  if (reasons.some(reason => reason === 'BILLING_DISABLED' || reason === 'BILLING_NOT_ACTIVE')
    || /billing.{0,80}(?:disabled|not enabled|not active|required)|(?:enable|set up).{0,30}billing|quota.{0,80}(?:exceed|exhaust)|(?:exceed|exhaust).{0,50}quota/i.test(message)) {
    return new AppError('API_QUOTA', 'Google Gemini API billing or quota prevents this request. Check the project billing and API usage limits, then try again.', 502);
  }
  if (status === 403 || status === 429) return undefined;
  if (/(?:response[_ ]?(?:json[_ ]?)?schema|schema).{0,100}(?:too complex|compilation|too many|nesting|depth|invalid)|(?:too many|maximum|limit).{0,60}(?:schema|nesting)/i.test(message)) {
    return new AppError('MODEL_SCHEMA', 'Google Gemini rejected the structured extraction schema. Restart the updated application and try again.', 502);
  }
  if (/(?:pdf|document).{0,60}(?:password|encrypted|invalid|not valid|corrupt)|(?:invalid|encrypted|corrupt).{0,30}(?:pdf|document)/i.test(message)) {
    return new AppError('DOCUMENT_PDF_INVALID', 'Google Gemini could not read a PDF. Supply valid PDFs without password protection or encryption and try again.', 502);
  }
  if (/(?:request|payload|pdf|document|input token count|context).{0,100}(?:too large|too many pages|exceed|limit)|maximum.{0,40}(?:pages|request size|input tokens)/i.test(message)) {
    return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed a Google Gemini request or model context limit. Use smaller or shorter PDFs and try again.', 502);
  }
  if (/(?:response[_ ]?(?:json[_ ]?)?schema|response[_ ]?mime[_ ]?type|structured outputs?|pdf|image|tools?|function calling).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:response[_ ]?(?:json[_ ]?)?schema|response[_ ]?mime[_ ]?type|structured outputs?|pdf|image|tools?|function calling)/i.test(message)) {
    return new AppError('MODEL_CAPABILITY', 'The selected Google Gemini model does not support a required document or extraction feature. Check the model capabilities and choose a compatible model.', 502);
  }
  return undefined;
}

/** xAI uses OpenAI-compatible errors; inspect their details only to choose fixed messages. */
function xaiRequestError(info: Record<string, unknown>, status: number): AppError | undefined {
  const detail = record(info.error);
  const nested = record(detail.error);
  const code = nested.code ?? detail.code ?? info.code;
  const rawMessage = typeof detail.error === 'string' ? detail.error : typeof info.error === 'string' ? info.error : providerMessage(info);
  const message = rawMessage.slice(0, 8000);
  if (code === 'invalid_api_key' || /api[ _-]?key.{0,60}(?:not valid|invalid|incorrect|expired)|(?:invalid|incorrect|expired).{0,30}api[ _-]?key/i.test(message)) {
    return new AppError('API_AUTH', 'SpaceXAI (Grok) could not authenticate the API key. Check the Grok API key in the xAI Console.', 502);
  }
  if (status === 402 || code === 'insufficient_quota' || code === 'billing_hard_limit_reached'
    || /(?:insufficient|not enough|no).{0,20}credits?|(?:does not|doesn't|do not|don't) have.{0,20}credits?|credit balance.{0,40}(?:too low|insufficient|exhausted)|(?:spending|billing).{0,30}limit.{0,30}(?:reached|exceeded)/i.test(message)) {
    return new AppError('API_QUOTA', 'SpaceXAI (Grok) API credits or spending limits prevent this request. Check team billing and credit balance in the xAI Console.', 502);
  }
  if (code === 'model_not_found') {
    return new AppError('MODEL_ACCESS', 'The selected SpaceXAI (Grok) model is unavailable to this key. Check the exact model ID and account access.', 502);
  }
  if (status === 403 || status === 429) return undefined;
  if (/(?:json[_ ]?schema|schema).{0,100}(?:too complex|compilation|invalid|too many|nesting|depth)/i.test(message)) {
    return new AppError('MODEL_SCHEMA', 'SpaceXAI (Grok) rejected the structured extraction schema. Restart the updated application and try again.', 502);
  }
  if (/(?:request|payload|document|image|input token count|context).{0,100}(?:too large|too many|exceed|limit)|maximum.{0,40}(?:request size|input tokens|context length)/i.test(message)) {
    return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed a SpaceXAI (Grok) request or model context limit. Use smaller or shorter PDFs and try again.', 502);
  }
  if (/(?:response_format|json_schema|structured outputs?|images?|vision|tools?|function calling).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:response_format|json_schema|structured outputs?|images?|vision|tools?|function calling)/i.test(message)) {
    return new AppError('MODEL_CAPABILITY', 'The selected SpaceXAI (Grok) model does not support a required image or extraction feature. Check the model capabilities and choose a compatible model.', 502);
  }
  return undefined;
}

/** Classify provider failures without logging keys, document content, or raw responses. */
export function publicError(error: unknown, provider: AiProvider = 'openai'): AppError {
  if (error instanceof AppError) return error;
  const info = record(error);
  const label = provider === 'xai' ? 'SpaceXAI (Grok)' : provider === 'google' ? 'Google Gemini' : provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
  const status = provider === 'google' && typeof info.statusCode === 'number' ? info.statusCode : info.status;
  if (provider === 'xai') {
    if (status === 400 || status === 402 || status === 403 || status === 422 || status === 429) {
      const specific = xaiRequestError(info, status);
      if (specific) return specific;
    }
    if (status === 408 || status === 504) return new AppError('TIMEOUT', 'SpaceXAI (Grok) did not complete the request in time. Check the connection and try again.', 504);
    if (status === 500 || status === 502) return new AppError('API_UNAVAILABLE', 'SpaceXAI (Grok) is temporarily unavailable. Try again shortly.', 502);
  }
  if (provider === 'google') {
    if (info.name === 'AuthError') return new AppError('API_AUTH', 'Google Gemini could not authenticate the API key. Check the key and its API restrictions in Google AI Studio.', 502);
    if (status === 400 || status === 403 || status === 422 || status === 429) {
      const specific = googleRequestError(info, status);
      if (specific) return specific;
    }
    if (info.name === 'PromptBlockedError') return new AppError('MODEL_OUTPUT_BLOCKED', 'Google Gemini blocked this document request. Review the documents and provider requirements before trying again.', 502);
    if (info.name === 'NoCandidatesError' || info.name === 'MalformedOutputError') return new AppError('MODEL_OUTPUT_INVALID', 'Google Gemini did not return usable extraction output. Try again and check the selected model capabilities.', 502);
    if (info.name === 'InvalidInputError' || info.name === 'ConfigurationError' || info.name === 'InvalidToolError' || info.name === 'ToolCallNotFoundError') {
      return new AppError('MODEL_REQUEST', 'The Google Gemini request could not be prepared. Restart the updated application and verify the selected model.', 502);
    }
    if (status === 408 || status === 504) return new AppError('TIMEOUT', 'Google Gemini did not complete the request in time. Check the connection and try again.', 504);
    if (status === 500 || status === 502) return new AppError('API_UNAVAILABLE', 'Google Gemini is temporarily unavailable. Try again shortly.', 502);
  }
  if (info.code === 'insufficient_quota') return new AppError('API_QUOTA', `${label} API quota is exhausted. Check API billing and account limits.`, 502);
  if (status === 401) return new AppError('API_AUTH', `${label} could not authenticate the API key. Use a key for the selected provider.`, 502);
  if (status === 403 || status === 404 || info.code === 'model_not_found') return new AppError('MODEL_ACCESS', `The selected ${label} model is unavailable to this key. Check the exact model ID and account access.`, 502);
  if (status === 429) return new AppError('API_RATE_LIMIT', `${label} rate limited this request. Check API usage limits and billing, then try again.`, 502);
  if (status === 413) return new AppError('API_REQUEST_TOO_LARGE', `${label} rejected the document request size. Use smaller PDFs and try again.`, 502);
  if (status === 400 || status === 422) {
    const specific = provider === 'anthropic' ? anthropicRequestError(providerMessage(info)) : undefined;
    return specific ?? new AppError('MODEL_REQUEST', `${label} rejected the request. Verify the model ID and account access, and check that the PDFs meet the provider's document requirements.`, 502);
  }
  if (status === 529 || status === 503) return new AppError('API_UNAVAILABLE', `${label} is temporarily unavailable. Try again shortly.`, 502);
  if (info.name === 'AbortError' || info.name === 'TimeoutError' || (error instanceof Error && error.constructor.name === 'APIConnectionTimeoutError')) {
    return new AppError('TIMEOUT', 'Preparation timed out. Check the connection and try again.', 504);
  }
  return new AppError('PREPARATION_FAILED', 'Preparation could not be completed. Check your documents, R3 login, browser installation, and model access, then try again.', 500);
}
