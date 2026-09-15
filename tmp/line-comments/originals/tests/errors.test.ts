import { describe, expect, it } from 'vitest';
import { APIError } from '@anthropic-ai/sdk';
import { APIError as OpenAIAPIError } from 'openai';
import { AppError, publicError } from '../src/errors.js';

// These SDK classes are not public exports; resolve beside the installed public entry point.
const googleErrors = await import(new URL('./utils/errors.js', import.meta.resolve('@langchain/google')).href);
const googleKey = 'synthetic-google-key-not-real';
const googlePrivateUrl = `https://generativelanguage.googleapis.com/v1beta/models/synthetic:generateContent?key=${googleKey}`;
function googleSdkError(message: string, statusCode = 400, reason?: string) {
  return new googleErrors.RequestError({
    message: `${message} ${privateDetail}`, statusCode, statusText: 'Synthetic rejection', url: googlePrivateUrl,
    headers: { 'x-goog-api-key': googleKey },
    data: { error: { code: statusCode, message: `${message} ${privateDetail}`, status: 'INVALID_ARGUMENT', details: reason ? [{ reason }] : [] } },
  });
}

function expectSanitizedGoogle(error: unknown, code: string, action: string): void {
  const result = publicError(error, 'google');
  expect(result).toMatchObject({ code, statusCode: code === 'TIMEOUT' ? 504 : 502 });
  expect(result.message).toContain(action);
  expect(result.message).toContain('Google Gemini');
  for (const output of [result.message, result.stack, JSON.stringify(result)]) {
    expect(output).not.toContain(privateDetail);
    expect(output).not.toContain(googleKey);
    expect(output).not.toContain(googlePrivateUrl);
    expect(output).not.toContain('generativelanguage.googleapis.com');
  }
}

const privateDetail = 'PRIVATE_PDF_TEXT_sk-synthetic-secret';
function sdkError(message: string, status = 400) {
  return APIError.generate(status, { type: 'error', error: { type: 'invalid_request_error', message: `${message} ${privateDetail}` } }, undefined, new Headers());
}

describe('actionable Anthropic rejection messages', () => {
  it.each([
    ['Your credit balance is too low to access the Anthropic API.', 'API_QUOTA', 'billing'],
    ['Insufficient credits.', 'API_QUOTA', 'credit balance'],
    ['Schema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],
    ['Too many parameters with union types; maximum is 16.', 'MODEL_SCHEMA', 'schema'],
    ['Maximum optional parameters exceeded.', 'MODEL_SCHEMA', 'schema'],
    ['prompt is too long: 250000 tokens > 200000 maximum', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    ['PDF has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    ['Request exceeds size limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    ['PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],
    ['Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],
    ['output_config.format is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],
    ['This model does not support PDF input.', 'MODEL_CAPABILITY', 'compatible model'],
  ])('classifies %s from an actual SDK error without exposing its body', (message, code, action) => {
    const result = publicError(sdkError(message!), 'anthropic');
    expect(result).toMatchObject({ code, statusCode: 502 });
    expect(result.message).toContain(action);
    expect(result.message).toContain('Anthropic');
    expect(result.message).not.toContain(privateDetail);
    expect(JSON.stringify(result)).not.toContain(privateDetail);
    expect(result.stack).not.toContain(privateDetail);
  });

  it.each([
    { status: 400, message: 'Schema is too complex for compilation.' },
    { status: 422, error: { message: 'Schema is too complex for compilation.' } },
    { status: 400, error: { error: { message: 'Schema is too complex for compilation.' } } },
  ])('recognizes plain, direct and nested SDK shapes', error => {
    expect(publicError(error, 'anthropic').code).toBe('MODEL_SCHEMA');
  });

  it('retains authentication/access/rate-limit precedence and OpenAI behavior', () => {
    for (const [status, code] of [[401, 'API_AUTH'], [403, 'MODEL_ACCESS'], [404, 'MODEL_ACCESS'], [429, 'API_RATE_LIMIT']] as const) {
      expect(publicError(sdkError('Schema is too complex for compilation.', status), 'anthropic').code).toBe(code);
    }
    expect(publicError(sdkError('Schema is too complex for compilation.'), 'openai').code).toBe('MODEL_REQUEST');
    expect(publicError(new Error('Schema is too complex for compilation.'), 'anthropic').code).toBe('PREPARATION_FAILED');
  });

  it('preserves safe application errors and sanitizes unrecognized or malformed responses', () => {
    const safe = new AppError('SYNTHETIC', 'A known safe message.');
    expect(publicError(safe, 'anthropic')).toBe(safe);
    for (const error of [sdkError(privateDetail), { status: 400, error: { message: { privateDetail } } }]) {
      const result = publicError(error, 'anthropic');
      expect(result.code).toBe('MODEL_REQUEST');
      expect(result.message).not.toContain(privateDetail);
    }
  });
});

describe('sanitized Google Gemini errors', () => {
  it.each([
    [400, 'API key not valid. Please pass a valid API key.', 'API_AUTH', 'Google AI Studio'],
    [400, 'API key expired. Please renew the API key.', 'API_AUTH', 'Google AI Studio'],
    [403, 'Your API key was reported as leaked. Please use another API key.', 'API_AUTH', 'restrictions'],
    [400, 'Please enable billing on your Google Cloud project.', 'API_QUOTA', 'billing'],
    [403, 'Billing is not enabled.', 'API_QUOTA', 'billing'],
    [429, 'You exceeded your current quota.', 'API_QUOTA', 'usage limits'],
    [400, 'PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],
    [400, 'Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],
    [400, 'Request payload size exceeds the limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    [400, 'The input token count exceeds the maximum allowed number.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    [400, 'The document has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    [400, 'responseSchema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],
    [400, 'responseJsonSchema has invalid nesting depth.', 'MODEL_SCHEMA', 'schema'],
    [400, 'responseMimeType application/json is not supported for this model.', 'MODEL_CAPABILITY', 'compatible model'],
    [422, 'This model does not support response_json_schema.', 'MODEL_CAPABILITY', 'compatible model'],
    [400, 'PDF input is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],
    [400, 'This model does not support function calling.', 'MODEL_CAPABILITY', 'compatible model'],
    [401, 'Synthetic rejection.', 'API_AUTH', 'API key'],
    [403, 'Permission denied for this resource.', 'MODEL_ACCESS', 'account access'],
    [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],
    [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],
    [413, 'Synthetic rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],
    [503, 'Synthetic backend outage.', 'API_UNAVAILABLE', 'Try again'],
    [500, 'Synthetic internal error.', 'API_UNAVAILABLE', 'Try again'],
    [504, 'Synthetic deadline exceeded.', 'TIMEOUT', 'connection'],
  ] as const)('classifies SDK HTTP %s: %s without forwarding private details', (status, message, code, action) => {
    expectSanitizedGoogle(googleSdkError(message, status), code, action);
  });

  it('uses recognized structured reasons without depending on private message text', () => {
    expectSanitizedGoogle(googleSdkError(privateDetail, 400, 'API_KEY_INVALID'), 'API_AUTH', 'Google AI Studio');
    expectSanitizedGoogle(googleSdkError(privateDetail, 403, 'API_KEY_HTTP_REFERRER_BLOCKED'), 'API_AUTH', 'restrictions');
    expectSanitizedGoogle(googleSdkError(privateDetail, 403, 'BILLING_DISABLED'), 'API_QUOTA', 'billing');
    expectSanitizedGoogle(new googleErrors.AuthError({ message: privateDetail, statusCode: 403, data: { secret: googleKey } }), 'API_AUTH', 'API key');
  });

  it('keeps unknown rejections neutral and retains access/rate-limit precedence', () => {
    for (const status of [400, 422]) {
      const error = googleSdkError(privateDetail, status);
      expectSanitizedGoogle(error, 'MODEL_REQUEST', 'rejected the request');
      expect(publicError(error, 'google').message).not.toContain('does not support');
    }
    expectSanitizedGoogle(googleSdkError('responseSchema is not supported.', 403), 'MODEL_ACCESS', 'account access');
    expectSanitizedGoogle(googleSdkError('responseSchema is not supported.', 429), 'API_RATE_LIMIT', 'usage limits');
    expect(publicError(googleSdkError('API key not valid.'), 'openai').code).toBe('PREPARATION_FAILED');
    expect(publicError({ status: 400, message: 'API key not valid.' }, 'anthropic').code).toBe('MODEL_REQUEST');
    expect(publicError({ statusCode: 400, data: { error: { message: { secret: googleKey }, details: 'not an array' } } }, 'google').code).toBe('MODEL_REQUEST');
  });

  it('sanitizes SDK blocked, empty, malformed and configuration outcomes', () => {
    expectSanitizedGoogle(new googleErrors.PromptBlockedError({ blockReason: 'SAFETY', message: privateDetail }), 'MODEL_OUTPUT_BLOCKED', 'blocked');
    expectSanitizedGoogle(new googleErrors.NoCandidatesError(), 'MODEL_OUTPUT_INVALID', 'usable extraction');
    expectSanitizedGoogle(new googleErrors.MalformedOutputError({ message: privateDetail, cause: { key: googleKey } }), 'MODEL_OUTPUT_INVALID', 'usable extraction');
    expectSanitizedGoogle(new googleErrors.InvalidInputError(privateDetail), 'MODEL_REQUEST', 'Restart');
    expectSanitizedGoogle(new googleErrors.ConfigurationError(privateDetail), 'MODEL_REQUEST', 'Restart');
    const safe = new AppError('SYNTHETIC', 'Known safe application message.');
    expect(publicError(safe, 'google')).toBe(safe);
  });
});

describe('sanitized SpaceXAI Grok errors', () => {
  const xaiKey = 'xai-synthetic-key-not-real';
  const privateUrl = `https://api.x.ai/v1/chat/completions?private=${xaiKey}`;
  function xaiSdkError(message: string, status: number, code?: string) {
    return OpenAIAPIError.generate(status, { error: {
      message: `${message} ${privateDetail} ${privateUrl}`, code, type: 'invalid_request_error',
    } }, undefined, new Headers({ 'authorization': `Bearer ${xaiKey}` }));
  }
  function expectSanitized(error: unknown, code: string, action: string): void {
    const result = publicError(error, 'xai');
    expect(result).toMatchObject({ code, statusCode: code === 'TIMEOUT' ? 504 : 502 });
    expect(result.message).toContain('SpaceXAI (Grok)');
    expect(result.message).toContain(action);
    for (const output of [result.message, result.stack, JSON.stringify(result)]) {
      expect(output).not.toContain(privateDetail);
      expect(output).not.toContain(xaiKey);
      expect(output).not.toContain(privateUrl);
      expect(output).not.toContain('api.x.ai');
    }
  }

  it.each([
    [400, 'Incorrect API key provided.', 'API_AUTH', 'Grok API key'],
    [400, 'API key is invalid.', 'API_AUTH', 'Grok API key'],
    [401, 'Synthetic rejection.', 'API_AUTH', 'selected provider'],
    [402, 'Synthetic payment rejection.', 'API_QUOTA', 'billing'],
    [403, "Your team doesn't have any credits yet.", 'API_QUOTA', 'credit balance'],
    [429, 'Monthly spending limit reached.', 'API_QUOTA', 'spending limits'],
    [403, 'Your team is blocked.', 'MODEL_ACCESS', 'account access'],
    [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],
    [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],
    [400, 'Invalid argument.', 'MODEL_REQUEST', 'rejected the request'],
    [422, 'Invalid field format.', 'MODEL_REQUEST', 'rejected the request'],
    [400, 'json_schema is invalid.', 'MODEL_SCHEMA', 'schema'],
    [400, 'response_format json_schema is not supported.', 'MODEL_CAPABILITY', 'compatible model'],
    [400, 'This model does not support image input.', 'MODEL_CAPABILITY', 'compatible model'],
    [422, 'Function calling is not supported by this model.', 'MODEL_CAPABILITY', 'compatible model'],
    [400, 'The maximum context length was exceeded.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    [400, 'The request payload is too large.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    [413, 'Synthetic size rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],
    [408, 'Synthetic request timeout.', 'TIMEOUT', 'connection'],
    [504, 'Synthetic gateway timeout.', 'TIMEOUT', 'connection'],
    [500, 'Synthetic internal failure.', 'API_UNAVAILABLE', 'Try again'],
    [502, 'Synthetic upstream failure.', 'API_UNAVAILABLE', 'Try again'],
    [503, 'Synthetic unavailable.', 'API_UNAVAILABLE', 'Try again'],
  ] as const)('classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details', (status, message, code, action) => {
    expectSanitized(xaiSdkError(message, status), code, action);
  });

  it('recognizes direct and nested structured error codes and string messages privately', () => {
    expectSanitized(xaiSdkError(privateDetail, 429, 'insufficient_quota'), 'API_QUOTA', 'billing');
    expectSanitized({ status: 400, error: { code: 'invalid_api_key', message: privateDetail } }, 'API_AUTH', 'Grok API key');
    expectSanitized({ status: 400, error: { error: { code: 'model_not_found', message: privateDetail } } }, 'MODEL_ACCESS', 'model ID');
    expectSanitized({ status: 403, error: { error: { code: 'billing_hard_limit_reached', message: privateDetail } } }, 'API_QUOTA', 'billing');
    expectSanitized({ status: 400, error: `Incorrect API key provided. ${privateDetail}` }, 'API_AUTH', 'Grok API key');
    expectSanitized({ status: 400, error: { error: `Incorrect API key provided. ${privateDetail}` } }, 'API_AUTH', 'Grok API key');
  });

  it('keeps unknown errors neutral, preserves HTTP precedence and does not change other providers', () => {
    expectSanitized(xaiSdkError('json_schema is not supported.', 401), 'API_AUTH', 'selected provider');
    expectSanitized(xaiSdkError('json_schema is not supported.', 403), 'MODEL_ACCESS', 'account access');
    expectSanitized(xaiSdkError('json_schema is not supported.', 429), 'API_RATE_LIMIT', 'usage limits');
    for (const status of [400, 422]) {
      expectSanitized({ status, error: { error: { message: { secret: xaiKey } } } }, 'MODEL_REQUEST', 'rejected the request');
      expect(publicError(xaiSdkError(privateDetail, status), 'xai').message).not.toContain('does not support');
    }
    for (const provider of ['openai', 'anthropic', 'google'] as const) {
      expect(publicError(xaiSdkError('Incorrect API key provided.', 400), provider).code).toBe('MODEL_REQUEST');
      expect(publicError(xaiSdkError('Your team has no credits.', 403), provider).code).toBe('MODEL_ACCESS');
    }
    const safe = new AppError('SYNTHETIC', 'Known safe application message.');
    expect(publicError(safe, 'xai')).toBe(safe);
    const unknown = publicError(new Error(`${privateDetail} ${privateUrl}`), 'xai');
    expect(unknown.code).toBe('PREPARATION_FAILED');
    expect(unknown.message).not.toContain(privateDetail);
    expect(unknown.stack).not.toContain(xaiKey);
  });
});
