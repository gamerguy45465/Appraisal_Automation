// [L1] Import { describe, expect, it } from "vitest" for these regression tests.
import { describe, expect, it } from 'vitest';
// [L2] Import { APIError } from "@anthropic-ai/sdk" for these regression tests.
import { APIError } from '@anthropic-ai/sdk';
// [L3] Import { APIError as OpenAIAPIError } from "openai" for these regression tests.
import { APIError as OpenAIAPIError } from 'openai';
// [L4] Import { AppError, publicError } from "../src/errors.js" for these regression tests.
import { AppError, publicError } from '../src/errors.js';
// [L5] Blank line separating the surrounding declarations, statements, or document blocks.

// [L6] Existing comment: These SDK classes are not public exports; resolve beside the installed public entry point.
// These SDK classes are not public exports; resolve beside the installed public entry point.
// [L7] Declare `googleErrors` as the resolved value from `import` using `new URL('./utils/errors.js', import.meta.resolve('@langchain/google')).href`.
const googleErrors = await import(new URL('./utils/errors.js', import.meta.resolve('@langchain/google')).href);
// [L8] Declare `googleKey` as "synthetic-google-key-not-real".
const googleKey = 'synthetic-google-key-not-real';
// [L9] Declare `googlePrivateUrl` as text interpolating `googleKey`.
const googlePrivateUrl = `https://generativelanguage.googleapis.com/v1beta/models/synthetic:generateContent?key=${googleKey}`;
// [L10] Define helper `googleSdkError` with parameters message, statusCode, reason for the fixture operations below.
function googleSdkError(message: string, statusCode = 400, reason?: string) {
  // [L11] Return a new `googleErrors.RequestError` instance initialized with an object whose fields are defined below to the caller.
  return new googleErrors.RequestError({
    // [L12] Set fixture property `message` to text interpolating `message`, `privateDetail`. Include the current `statusCode` value under the same property name. Set fixture property `statusText` to "Synthetic rejection". Set fixture property `url` to `googlePrivateUrl`.
    message: `${message} ${privateDetail}`, statusCode, statusText: 'Synthetic rejection', url: googlePrivateUrl,
    // [L13] Set fixture property `headers` to an object containing 'x-goog-api-key': `googleKey`.
    headers: { 'x-goog-api-key': googleKey },
    // [L14] Set fixture property `data` to an object containing error: an object containing code: `statusCode`, message: text interpolating `message`, `privateDetail`, status: "INVALID_ARGUMENT", details: an array containing `{ reason }` when `reason`, otherwise an empty array.
    data: { error: { code: statusCode, message: `${message} ${privateDetail}`, status: 'INVALID_ARGUMENT', details: reason ? [{ reason }] : [] } },
  // [L15] Close the fixture object and finish the surrounding syntax.
  });
// [L16] Close the callback or control-flow body for `googleSdkError` and finish the surrounding syntax.
}
// [L17] Blank line separating the surrounding declarations, statements, or document blocks.

// [L18] Define helper `expectSanitizedGoogle` with parameters error, code, action for the fixture operations below.
function expectSanitizedGoogle(error: unknown, code: string, action: string): void {
  // [L19] Declare `result` as the result of `publicError` using `error`, "google".
  const result = publicError(error, 'google');
  // [L20] Assert that `result` contains the expected object fields an object containing code, statusCode: 504 when `code` strictly equals "TIMEOUT", otherwise 502.
  expect(result).toMatchObject({ code, statusCode: code === 'TIMEOUT' ? 504 : 502 });
  // [L21] Assert that `result.message` contains `action`.
  expect(result.message).toContain(action);
  // [L22] Assert that `result.message` contains "Google Gemini".
  expect(result.message).toContain('Google Gemini');
  // [L23] Iterate const output over an array containing `result.message`, `result.stack`, the result of `JSON.stringify` using `result`.
  for (const output of [result.message, result.stack, JSON.stringify(result)]) {
    // [L24] Assert that `output` does not satisfy: contains `privateDetail`.
    expect(output).not.toContain(privateDetail);
    // [L25] Assert that `output` does not satisfy: contains `googleKey`.
    expect(output).not.toContain(googleKey);
    // [L26] Assert that `output` does not satisfy: contains `googlePrivateUrl`.
    expect(output).not.toContain(googlePrivateUrl);
    // [L27] Assert that `output` does not satisfy: contains "generativelanguage.googleapis.com".
    expect(output).not.toContain('generativelanguage.googleapis.com');
  // [L28] Close the callback or control-flow body and finish the surrounding syntax.
  }
// [L29] Close the callback or control-flow body for `expectSanitizedGoogle` and finish the surrounding syntax.
}
// [L30] Blank line separating the surrounding declarations, statements, or document blocks.

// [L31] Declare `privateDetail` as "PRIVATE_PDF_TEXT_sk-synthetic-secret".
const privateDetail = 'PRIVATE_PDF_TEXT_sk-synthetic-secret';
// [L32] Define helper `sdkError` with parameters message, status for the fixture operations below.
function sdkError(message: string, status = 400) {
  // [L33] Return the result of `APIError.generate` using `status`, an object containing type: "error", error: an object containing type: "invalid_request_error", message: text interpolating `message`, `privateDetail`, `undefined`, a new `Headers` instance to the caller.
  return APIError.generate(status, { type: 'error', error: { type: 'invalid_request_error', message: `${message} ${privateDetail}` } }, undefined, new Headers());
// [L34] Close the callback or control-flow body for `sdkError` and finish the surrounding syntax.
}
// [L35] Blank line separating the surrounding declarations, statements, or document blocks.

// [L36] Group regression tests for "actionable Anthropic rejection messages".
describe('actionable Anthropic rejection messages', () => {
  // [L37] Register a parameterized test that "classifies %s from an actual SDK error without exposing its body".
  it.each([
    // [L38] Provide a parameterized test row with ['Your credit balance is too low to access the Anthropic API.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations.
    ['Your credit balance is too low to access the Anthropic API.', 'API_QUOTA', 'billing'],
    // [L39] Provide a parameterized test row with ['Insufficient credits.', 'API_QUOTA', 'credit balance'],; the test receives these values as its inputs and expectations.
    ['Insufficient credits.', 'API_QUOTA', 'credit balance'],
    // [L40] Provide a parameterized test row with ['Schema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    ['Schema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],
    // [L41] Provide a parameterized test row with ['Too many parameters with union types; maximum is 16.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    ['Too many parameters with union types; maximum is 16.', 'MODEL_SCHEMA', 'schema'],
    // [L42] Provide a parameterized test row with ['Maximum optional parameters exceeded.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    ['Maximum optional parameters exceeded.', 'MODEL_SCHEMA', 'schema'],
    // [L43] Provide a parameterized test row with ['prompt is too long: 250000 tokens > 200000 maximum', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations.
    ['prompt is too long: 250000 tokens > 200000 maximum', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    // [L44] Provide a parameterized test row with ['PDF has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations.
    ['PDF has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    // [L45] Provide a parameterized test row with ['Request exceeds size limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations.
    ['Request exceeds size limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    // [L46] Provide a parameterized test row with ['PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],; the test receives these values as its inputs and expectations.
    ['PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],
    // [L47] Provide a parameterized test row with ['Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],; the test receives these values as its inputs and expectations.
    ['Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],
    // [L48] Provide a parameterized test row with ['output_config.format is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    ['output_config.format is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L49] Provide a parameterized test row with ['This model does not support PDF input.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    ['This model does not support PDF input.', 'MODEL_CAPABILITY', 'compatible model'],
  // [L50] Apply the preceding scenario rows to the parameterized test "classifies %s from an actual SDK error without exposing its body" and begin its callback.
  ])('classifies %s from an actual SDK error without exposing its body', (message, code, action) => {
    // [L51] Declare `result` as the result of `publicError` using the result of `sdkError` using `message`, "anthropic".
    const result = publicError(sdkError(message!), 'anthropic');
    // [L52] Assert that `result` contains the expected object fields an object containing code, statusCode: 502.
    expect(result).toMatchObject({ code, statusCode: 502 });
    // [L53] Assert that `result.message` contains `action`.
    expect(result.message).toContain(action);
    // [L54] Assert that `result.message` contains "Anthropic".
    expect(result.message).toContain('Anthropic');
    // [L55] Assert that `result.message` does not satisfy: contains `privateDetail`.
    expect(result.message).not.toContain(privateDetail);
    // [L56] Assert that the result of `JSON.stringify` using `result` does not satisfy: contains `privateDetail`.
    expect(JSON.stringify(result)).not.toContain(privateDetail);
    // [L57] Assert that `result.stack` does not satisfy: contains `privateDetail`.
    expect(result.stack).not.toContain(privateDetail);
  // [L58] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L59] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L60] Register a parameterized test that "recognizes plain, direct and nested SDK shapes".
  it.each([
    // [L61] Set fixture property `status` to 400. Set fixture property `message` to "Schema is too complex for compilation.".
    { status: 400, message: 'Schema is too complex for compilation.' },
    // [L62] Set fixture property `status` to 422. Set fixture property `error` to an object containing message: "Schema is too complex for compilation.".
    { status: 422, error: { message: 'Schema is too complex for compilation.' } },
    // [L63] Set fixture property `status` to 400. Set fixture property `error` to an object containing error: an object containing message: "Schema is too complex for compilation.".
    { status: 400, error: { error: { message: 'Schema is too complex for compilation.' } } },
  // [L64] Apply the preceding scenario rows to the parameterized test "recognizes plain, direct and nested SDK shapes" and begin its callback.
  ])('recognizes plain, direct and nested SDK shapes', error => {
    // [L65] Assert that `publicError(error, 'anthropic').code` strictly equals "MODEL_SCHEMA".
    expect(publicError(error, 'anthropic').code).toBe('MODEL_SCHEMA');
  // [L66] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L67] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L68] Register a test that "retains authentication/access/rate-limit precedence and OpenAI behavior".
  it('retains authentication/access/rate-limit precedence and OpenAI behavior', () => {
    // [L69] Iterate const [status, code] over an array containing an array containing 401, "API_AUTH", an array containing 403, "MODEL_ACCESS", an array containing 404, "MODEL_ACCESS", an array containing 429, "API_RATE_LIMIT".
    for (const [status, code] of [[401, 'API_AUTH'], [403, 'MODEL_ACCESS'], [404, 'MODEL_ACCESS'], [429, 'API_RATE_LIMIT']] as const) {
      // [L70] Assert that `publicError(sdkError('Schema is too complex for compilation.', status), 'anthropic').code` strictly equals `code`.
      expect(publicError(sdkError('Schema is too complex for compilation.', status), 'anthropic').code).toBe(code);
    // [L71] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L72] Assert that `publicError(sdkError('Schema is too complex for compilation.'), 'openai').code` strictly equals "MODEL_REQUEST".
    expect(publicError(sdkError('Schema is too complex for compilation.'), 'openai').code).toBe('MODEL_REQUEST');
    // [L73] Assert that `publicError(new Error('Schema is too complex for compilation.'), 'anthropic').code` strictly equals "PREPARATION_FAILED".
    expect(publicError(new Error('Schema is too complex for compilation.'), 'anthropic').code).toBe('PREPARATION_FAILED');
  // [L74] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L75] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L76] Register a test that "preserves safe application errors and sanitizes unrecognized or malformed responses".
  it('preserves safe application errors and sanitizes unrecognized or malformed responses', () => {
    // [L77] Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "A known safe message.".
    const safe = new AppError('SYNTHETIC', 'A known safe message.');
    // [L78] Assert that the result of `publicError` using `safe`, "anthropic" strictly equals `safe`.
    expect(publicError(safe, 'anthropic')).toBe(safe);
    // [L79] Iterate const error over an array containing the result of `sdkError` using `privateDetail`, an object containing status: 400, error: an object containing message: an object containing privateDetail.
    for (const error of [sdkError(privateDetail), { status: 400, error: { message: { privateDetail } } }]) {
      // [L80] Declare `result` as the result of `publicError` using `error`, "anthropic".
      const result = publicError(error, 'anthropic');
      // [L81] Assert that `result.code` strictly equals "MODEL_REQUEST".
      expect(result.code).toBe('MODEL_REQUEST');
      // [L82] Assert that `result.message` does not satisfy: contains `privateDetail`.
      expect(result.message).not.toContain(privateDetail);
    // [L83] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L84] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L85] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L86] Blank line separating the surrounding declarations, statements, or document blocks.

// [L87] Group regression tests for "sanitized Google Gemini errors".
describe('sanitized Google Gemini errors', () => {
  // [L88] Register a parameterized test that "classifies SDK HTTP %s: %s without forwarding private details".
  it.each([
    // [L89] Provide a parameterized test row with [400, 'API key not valid. Please pass a valid API key.', 'API_AUTH', 'Google AI Studio'],; the test receives these values as its inputs and expectations.
    [400, 'API key not valid. Please pass a valid API key.', 'API_AUTH', 'Google AI Studio'],
    // [L90] Provide a parameterized test row with [400, 'API key expired. Please renew the API key.', 'API_AUTH', 'Google AI Studio'],; the test receives these values as its inputs and expectations.
    [400, 'API key expired. Please renew the API key.', 'API_AUTH', 'Google AI Studio'],
    // [L91] Provide a parameterized test row with [403, 'Your API key was reported as leaked. Please use another API key.', 'API_AUTH', 'restrictions'],; the test receives these values as its inputs and expectations.
    [403, 'Your API key was reported as leaked. Please use another API key.', 'API_AUTH', 'restrictions'],
    // [L92] Provide a parameterized test row with [400, 'Please enable billing on your Google Cloud project.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations.
    [400, 'Please enable billing on your Google Cloud project.', 'API_QUOTA', 'billing'],
    // [L93] Provide a parameterized test row with [403, 'Billing is not enabled.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations.
    [403, 'Billing is not enabled.', 'API_QUOTA', 'billing'],
    // [L94] Provide a parameterized test row with [429, 'You exceeded your current quota.', 'API_QUOTA', 'usage limits'],; the test receives these values as its inputs and expectations.
    [429, 'You exceeded your current quota.', 'API_QUOTA', 'usage limits'],
    // [L95] Provide a parameterized test row with [400, 'PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],; the test receives these values as its inputs and expectations.
    [400, 'PDF is password protected.', 'DOCUMENT_PDF_INVALID', 'password'],
    // [L96] Provide a parameterized test row with [400, 'Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],; the test receives these values as its inputs and expectations.
    [400, 'Invalid PDF document.', 'DOCUMENT_PDF_INVALID', 'valid PDFs'],
    // [L97] Provide a parameterized test row with [400, 'Request payload size exceeds the limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations.
    [400, 'Request payload size exceeds the limit.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    // [L98] Provide a parameterized test row with [400, 'The input token count exceeds the maximum allowed number.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations.
    [400, 'The input token count exceeds the maximum allowed number.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    // [L99] Provide a parameterized test row with [400, 'The document has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations.
    [400, 'The document has too many pages.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    // [L100] Provide a parameterized test row with [400, 'responseSchema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    [400, 'responseSchema is too complex for compilation.', 'MODEL_SCHEMA', 'schema'],
    // [L101] Provide a parameterized test row with [400, 'responseJsonSchema has invalid nesting depth.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    [400, 'responseJsonSchema has invalid nesting depth.', 'MODEL_SCHEMA', 'schema'],
    // [L102] Provide a parameterized test row with [400, 'responseMimeType application/json is not supported for this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [400, 'responseMimeType application/json is not supported for this model.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L103] Provide a parameterized test row with [422, 'This model does not support response_json_schema.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [422, 'This model does not support response_json_schema.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L104] Provide a parameterized test row with [400, 'PDF input is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [400, 'PDF input is not supported with this model.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L105] Provide a parameterized test row with [400, 'This model does not support function calling.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [400, 'This model does not support function calling.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L106] Provide a parameterized test row with [401, 'Synthetic rejection.', 'API_AUTH', 'API key'],; the test receives these values as its inputs and expectations.
    [401, 'Synthetic rejection.', 'API_AUTH', 'API key'],
    // [L107] Provide a parameterized test row with [403, 'Permission denied for this resource.', 'MODEL_ACCESS', 'account access'],; the test receives these values as its inputs and expectations.
    [403, 'Permission denied for this resource.', 'MODEL_ACCESS', 'account access'],
    // [L108] Provide a parameterized test row with [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],; the test receives these values as its inputs and expectations.
    [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],
    // [L109] Provide a parameterized test row with [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],; the test receives these values as its inputs and expectations.
    [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],
    // [L110] Provide a parameterized test row with [413, 'Synthetic rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],; the test receives these values as its inputs and expectations.
    [413, 'Synthetic rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],
    // [L111] Provide a parameterized test row with [503, 'Synthetic backend outage.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations.
    [503, 'Synthetic backend outage.', 'API_UNAVAILABLE', 'Try again'],
    // [L112] Provide a parameterized test row with [500, 'Synthetic internal error.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations.
    [500, 'Synthetic internal error.', 'API_UNAVAILABLE', 'Try again'],
    // [L113] Provide a parameterized test row with [504, 'Synthetic deadline exceeded.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations.
    [504, 'Synthetic deadline exceeded.', 'TIMEOUT', 'connection'],
  // [L114] Apply the preceding scenario rows to the parameterized test "classifies SDK HTTP %s: %s without forwarding private details" and begin its callback.
  ] as const)('classifies SDK HTTP %s: %s without forwarding private details', (status, message, code, action) => {
    // [L115] Call `expectSanitizedGoogle` with the result of `googleSdkError` using `message`, `status`, `code`, `action`.
    expectSanitizedGoogle(googleSdkError(message, status), code, action);
  // [L116] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L117] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L118] Register a test that "uses recognized structured reasons without depending on private message text".
  it('uses recognized structured reasons without depending on private message text', () => {
    // [L119] Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 400, "API_KEY_INVALID", "API_AUTH", "Google AI Studio".
    expectSanitizedGoogle(googleSdkError(privateDetail, 400, 'API_KEY_INVALID'), 'API_AUTH', 'Google AI Studio');
    // [L120] Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 403, "API_KEY_HTTP_REFERRER_BLOCKED", "API_AUTH", "restrictions".
    expectSanitizedGoogle(googleSdkError(privateDetail, 403, 'API_KEY_HTTP_REFERRER_BLOCKED'), 'API_AUTH', 'restrictions');
    // [L121] Call `expectSanitizedGoogle` with the result of `googleSdkError` using `privateDetail`, 403, "BILLING_DISABLED", "API_QUOTA", "billing".
    expectSanitizedGoogle(googleSdkError(privateDetail, 403, 'BILLING_DISABLED'), 'API_QUOTA', 'billing');
    // [L122] Call `expectSanitizedGoogle` with a new `googleErrors.AuthError` instance initialized with an object containing message: `privateDetail`, statusCode: 403, data: an object containing secret: `googleKey`, "API_AUTH", "API key".
    expectSanitizedGoogle(new googleErrors.AuthError({ message: privateDetail, statusCode: 403, data: { secret: googleKey } }), 'API_AUTH', 'API key');
  // [L123] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L124] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L125] Register a test that "keeps unknown rejections neutral and retains access/rate-limit precedence".
  it('keeps unknown rejections neutral and retains access/rate-limit precedence', () => {
    // [L126] Iterate const status over an array containing 400, 422.
    for (const status of [400, 422]) {
      // [L127] Declare `error` as the result of `googleSdkError` using `privateDetail`, `status`.
      const error = googleSdkError(privateDetail, status);
      // [L128] Call `expectSanitizedGoogle` with `error`, "MODEL_REQUEST", "rejected the request".
      expectSanitizedGoogle(error, 'MODEL_REQUEST', 'rejected the request');
      // [L129] Assert that `publicError(error, 'google').message` does not satisfy: contains "does not support".
      expect(publicError(error, 'google').message).not.toContain('does not support');
    // [L130] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L131] Call `expectSanitizedGoogle` with the result of `googleSdkError` using "responseSchema is not supported.", 403, "MODEL_ACCESS", "account access".
    expectSanitizedGoogle(googleSdkError('responseSchema is not supported.', 403), 'MODEL_ACCESS', 'account access');
    // [L132] Call `expectSanitizedGoogle` with the result of `googleSdkError` using "responseSchema is not supported.", 429, "API_RATE_LIMIT", "usage limits".
    expectSanitizedGoogle(googleSdkError('responseSchema is not supported.', 429), 'API_RATE_LIMIT', 'usage limits');
    // [L133] Assert that `publicError(googleSdkError('API key not valid.'), 'openai').code` strictly equals "PREPARATION_FAILED".
    expect(publicError(googleSdkError('API key not valid.'), 'openai').code).toBe('PREPARATION_FAILED');
    // [L134] Assert that `publicError({ status: 400, message: 'API key not valid.' }, 'anthropic').code` strictly equals "MODEL_REQUEST".
    expect(publicError({ status: 400, message: 'API key not valid.' }, 'anthropic').code).toBe('MODEL_REQUEST');
    // [L135] Assert that `publicError({ statusCode: 400, data: { error: { message: { secret: googleKey }, details: 'not an array' } } }, 'google').code` strictly equals "MODEL_REQUEST".
    expect(publicError({ statusCode: 400, data: { error: { message: { secret: googleKey }, details: 'not an array' } } }, 'google').code).toBe('MODEL_REQUEST');
  // [L136] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L137] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L138] Register a test that "sanitizes SDK blocked, empty, malformed and configuration outcomes".
  it('sanitizes SDK blocked, empty, malformed and configuration outcomes', () => {
    // [L139] Call `expectSanitizedGoogle` with a new `googleErrors.PromptBlockedError` instance initialized with an object containing blockReason: "SAFETY", message: `privateDetail`, "MODEL_OUTPUT_BLOCKED", "blocked".
    expectSanitizedGoogle(new googleErrors.PromptBlockedError({ blockReason: 'SAFETY', message: privateDetail }), 'MODEL_OUTPUT_BLOCKED', 'blocked');
    // [L140] Call `expectSanitizedGoogle` with a new `googleErrors.NoCandidatesError` instance, "MODEL_OUTPUT_INVALID", "usable extraction".
    expectSanitizedGoogle(new googleErrors.NoCandidatesError(), 'MODEL_OUTPUT_INVALID', 'usable extraction');
    // [L141] Call `expectSanitizedGoogle` with a new `googleErrors.MalformedOutputError` instance initialized with an object containing message: `privateDetail`, cause: an object containing key: `googleKey`, "MODEL_OUTPUT_INVALID", "usable extraction".
    expectSanitizedGoogle(new googleErrors.MalformedOutputError({ message: privateDetail, cause: { key: googleKey } }), 'MODEL_OUTPUT_INVALID', 'usable extraction');
    // [L142] Call `expectSanitizedGoogle` with a new `googleErrors.InvalidInputError` instance initialized with `privateDetail`, "MODEL_REQUEST", "Restart".
    expectSanitizedGoogle(new googleErrors.InvalidInputError(privateDetail), 'MODEL_REQUEST', 'Restart');
    // [L143] Call `expectSanitizedGoogle` with a new `googleErrors.ConfigurationError` instance initialized with `privateDetail`, "MODEL_REQUEST", "Restart".
    expectSanitizedGoogle(new googleErrors.ConfigurationError(privateDetail), 'MODEL_REQUEST', 'Restart');
    // [L144] Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "Known safe application message.".
    const safe = new AppError('SYNTHETIC', 'Known safe application message.');
    // [L145] Assert that the result of `publicError` using `safe`, "google" strictly equals `safe`.
    expect(publicError(safe, 'google')).toBe(safe);
  // [L146] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L147] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L148] Blank line separating the surrounding declarations, statements, or document blocks.

// [L149] Group regression tests for "sanitized SpaceXAI Grok errors".
describe('sanitized SpaceXAI Grok errors', () => {
  // [L150] Declare `xaiKey` as "xai-synthetic-key-not-real".
  const xaiKey = 'xai-synthetic-key-not-real';
  // [L151] Declare `privateUrl` as text interpolating `xaiKey`.
  const privateUrl = `https://api.x.ai/v1/chat/completions?private=${xaiKey}`;
  // [L152] Define helper `xaiSdkError` with parameters message, status, code for the fixture operations below.
  function xaiSdkError(message: string, status: number, code?: string) {
    // [L153] Return the result of `OpenAIAPIError.generate` using `status`, an object whose fields are defined below, `undefined`, a new `Headers` instance initialized with an object containing 'authorization': text interpolating `xaiKey` to the caller.
    return OpenAIAPIError.generate(status, { error: {
      // [L154] Set fixture property `message` to text interpolating `message`, `privateDetail`, `privateUrl`. Include the current `code` value under the same property name. Set fixture property `type` to "invalid_request_error".
      message: `${message} ${privateDetail} ${privateUrl}`, code, type: 'invalid_request_error',
    // [L155] Set fixture property `'authorization'` to text interpolating `xaiKey`.
    } }, undefined, new Headers({ 'authorization': `Bearer ${xaiKey}` }));
  // [L156] Close the callback or control-flow body for `xaiSdkError` and finish the surrounding syntax.
  }
  // [L157] Define helper `expectSanitized` with parameters error, code, action for the fixture operations below.
  function expectSanitized(error: unknown, code: string, action: string): void {
    // [L158] Declare `result` as the result of `publicError` using `error`, "xai".
    const result = publicError(error, 'xai');
    // [L159] Assert that `result` contains the expected object fields an object containing code, statusCode: 504 when `code` strictly equals "TIMEOUT", otherwise 502.
    expect(result).toMatchObject({ code, statusCode: code === 'TIMEOUT' ? 504 : 502 });
    // [L160] Assert that `result.message` contains "SpaceXAI (Grok)".
    expect(result.message).toContain('SpaceXAI (Grok)');
    // [L161] Assert that `result.message` contains `action`.
    expect(result.message).toContain(action);
    // [L162] Iterate const output over an array containing `result.message`, `result.stack`, the result of `JSON.stringify` using `result`.
    for (const output of [result.message, result.stack, JSON.stringify(result)]) {
      // [L163] Assert that `output` does not satisfy: contains `privateDetail`.
      expect(output).not.toContain(privateDetail);
      // [L164] Assert that `output` does not satisfy: contains `xaiKey`.
      expect(output).not.toContain(xaiKey);
      // [L165] Assert that `output` does not satisfy: contains `privateUrl`.
      expect(output).not.toContain(privateUrl);
      // [L166] Assert that `output` does not satisfy: contains "api.x.ai".
      expect(output).not.toContain('api.x.ai');
    // [L167] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L168] Close the callback or control-flow body for `expectSanitized` and finish the surrounding syntax.
  }
// [L169] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L170] Register a parameterized test that "classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details".
  it.each([
    // [L171] Provide a parameterized test row with [400, 'Incorrect API key provided.', 'API_AUTH', 'Grok API key'],; the test receives these values as its inputs and expectations.
    [400, 'Incorrect API key provided.', 'API_AUTH', 'Grok API key'],
    // [L172] Provide a parameterized test row with [400, 'API key is invalid.', 'API_AUTH', 'Grok API key'],; the test receives these values as its inputs and expectations.
    [400, 'API key is invalid.', 'API_AUTH', 'Grok API key'],
    // [L173] Provide a parameterized test row with [401, 'Synthetic rejection.', 'API_AUTH', 'selected provider'],; the test receives these values as its inputs and expectations.
    [401, 'Synthetic rejection.', 'API_AUTH', 'selected provider'],
    // [L174] Provide a parameterized test row with [402, 'Synthetic payment rejection.', 'API_QUOTA', 'billing'],; the test receives these values as its inputs and expectations.
    [402, 'Synthetic payment rejection.', 'API_QUOTA', 'billing'],
    // [L175] Provide a parameterized test row with [403, "Your team doesn't have any credits yet.", 'API_QUOTA', 'credit balance'],; the test receives these values as its inputs and expectations.
    [403, "Your team doesn't have any credits yet.", 'API_QUOTA', 'credit balance'],
    // [L176] Provide a parameterized test row with [429, 'Monthly spending limit reached.', 'API_QUOTA', 'spending limits'],; the test receives these values as its inputs and expectations.
    [429, 'Monthly spending limit reached.', 'API_QUOTA', 'spending limits'],
    // [L177] Provide a parameterized test row with [403, 'Your team is blocked.', 'MODEL_ACCESS', 'account access'],; the test receives these values as its inputs and expectations.
    [403, 'Your team is blocked.', 'MODEL_ACCESS', 'account access'],
    // [L178] Provide a parameterized test row with [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],; the test receives these values as its inputs and expectations.
    [404, 'Model was not found.', 'MODEL_ACCESS', 'model ID'],
    // [L179] Provide a parameterized test row with [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],; the test receives these values as its inputs and expectations.
    [429, 'Too many requests.', 'API_RATE_LIMIT', 'usage limits'],
    // [L180] Provide a parameterized test row with [400, 'Invalid argument.', 'MODEL_REQUEST', 'rejected the request'],; the test receives these values as its inputs and expectations.
    [400, 'Invalid argument.', 'MODEL_REQUEST', 'rejected the request'],
    // [L181] Provide a parameterized test row with [422, 'Invalid field format.', 'MODEL_REQUEST', 'rejected the request'],; the test receives these values as its inputs and expectations.
    [422, 'Invalid field format.', 'MODEL_REQUEST', 'rejected the request'],
    // [L182] Provide a parameterized test row with [400, 'json_schema is invalid.', 'MODEL_SCHEMA', 'schema'],; the test receives these values as its inputs and expectations.
    [400, 'json_schema is invalid.', 'MODEL_SCHEMA', 'schema'],
    // [L183] Provide a parameterized test row with [400, 'response_format json_schema is not supported.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [400, 'response_format json_schema is not supported.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L184] Provide a parameterized test row with [400, 'This model does not support image input.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [400, 'This model does not support image input.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L185] Provide a parameterized test row with [422, 'Function calling is not supported by this model.', 'MODEL_CAPABILITY', 'compatible model'],; the test receives these values as its inputs and expectations.
    [422, 'Function calling is not supported by this model.', 'MODEL_CAPABILITY', 'compatible model'],
    // [L186] Provide a parameterized test row with [400, 'The maximum context length was exceeded.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],; the test receives these values as its inputs and expectations.
    [400, 'The maximum context length was exceeded.', 'API_REQUEST_TOO_LARGE', 'shorter PDFs'],
    // [L187] Provide a parameterized test row with [400, 'The request payload is too large.', 'API_REQUEST_TOO_LARGE', 'smaller'],; the test receives these values as its inputs and expectations.
    [400, 'The request payload is too large.', 'API_REQUEST_TOO_LARGE', 'smaller'],
    // [L188] Provide a parameterized test row with [413, 'Synthetic size rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],; the test receives these values as its inputs and expectations.
    [413, 'Synthetic size rejection.', 'API_REQUEST_TOO_LARGE', 'smaller PDFs'],
    // [L189] Provide a parameterized test row with [408, 'Synthetic request timeout.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations.
    [408, 'Synthetic request timeout.', 'TIMEOUT', 'connection'],
    // [L190] Provide a parameterized test row with [504, 'Synthetic gateway timeout.', 'TIMEOUT', 'connection'],; the test receives these values as its inputs and expectations.
    [504, 'Synthetic gateway timeout.', 'TIMEOUT', 'connection'],
    // [L191] Provide a parameterized test row with [500, 'Synthetic internal failure.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations.
    [500, 'Synthetic internal failure.', 'API_UNAVAILABLE', 'Try again'],
    // [L192] Provide a parameterized test row with [502, 'Synthetic upstream failure.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations.
    [502, 'Synthetic upstream failure.', 'API_UNAVAILABLE', 'Try again'],
    // [L193] Provide a parameterized test row with [503, 'Synthetic unavailable.', 'API_UNAVAILABLE', 'Try again'],; the test receives these values as its inputs and expectations.
    [503, 'Synthetic unavailable.', 'API_UNAVAILABLE', 'Try again'],
  // [L194] Apply the preceding scenario rows to the parameterized test "classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details" and begin its callback.
  ] as const)('classifies OpenAI-compatible SDK HTTP %s: %s without exposing its details', (status, message, code, action) => {
    // [L195] Call `expectSanitized` with the result of `xaiSdkError` using `message`, `status`, `code`, `action`.
    expectSanitized(xaiSdkError(message, status), code, action);
  // [L196] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L197] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L198] Register a test that "recognizes direct and nested structured error codes and string messages privately".
  it('recognizes direct and nested structured error codes and string messages privately', () => {
    // [L199] Call `expectSanitized` with the result of `xaiSdkError` using `privateDetail`, 429, "insufficient_quota", "API_QUOTA", "billing".
    expectSanitized(xaiSdkError(privateDetail, 429, 'insufficient_quota'), 'API_QUOTA', 'billing');
    // [L200] Call `expectSanitized` with an object containing status: 400, error: an object containing code: "invalid_api_key", message: `privateDetail`, "API_AUTH", "Grok API key".
    expectSanitized({ status: 400, error: { code: 'invalid_api_key', message: privateDetail } }, 'API_AUTH', 'Grok API key');
    // [L201] Call `expectSanitized` with an object containing status: 400, error: an object containing error: an object containing code: "model_not_found", message: `privateDetail`, "MODEL_ACCESS", "model ID".
    expectSanitized({ status: 400, error: { error: { code: 'model_not_found', message: privateDetail } } }, 'MODEL_ACCESS', 'model ID');
    // [L202] Call `expectSanitized` with an object containing status: 403, error: an object containing error: an object containing code: "billing_hard_limit_reached", message: `privateDetail`, "API_QUOTA", "billing".
    expectSanitized({ status: 403, error: { error: { code: 'billing_hard_limit_reached', message: privateDetail } } }, 'API_QUOTA', 'billing');
    // [L203] Call `expectSanitized` with an object containing status: 400, error: text interpolating `privateDetail`, "API_AUTH", "Grok API key".
    expectSanitized({ status: 400, error: `Incorrect API key provided. ${privateDetail}` }, 'API_AUTH', 'Grok API key');
    // [L204] Call `expectSanitized` with an object containing status: 400, error: an object containing error: text interpolating `privateDetail`, "API_AUTH", "Grok API key".
    expectSanitized({ status: 400, error: { error: `Incorrect API key provided. ${privateDetail}` } }, 'API_AUTH', 'Grok API key');
  // [L205] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L206] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L207] Register a test that "keeps unknown errors neutral, preserves HTTP precedence and does not change other providers".
  it('keeps unknown errors neutral, preserves HTTP precedence and does not change other providers', () => {
    // [L208] Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 401, "API_AUTH", "selected provider".
    expectSanitized(xaiSdkError('json_schema is not supported.', 401), 'API_AUTH', 'selected provider');
    // [L209] Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 403, "MODEL_ACCESS", "account access".
    expectSanitized(xaiSdkError('json_schema is not supported.', 403), 'MODEL_ACCESS', 'account access');
    // [L210] Call `expectSanitized` with the result of `xaiSdkError` using "json_schema is not supported.", 429, "API_RATE_LIMIT", "usage limits".
    expectSanitized(xaiSdkError('json_schema is not supported.', 429), 'API_RATE_LIMIT', 'usage limits');
    // [L211] Iterate const status over an array containing 400, 422.
    for (const status of [400, 422]) {
      // [L212] Call `expectSanitized` with an object containing status, error: an object containing error: an object containing message: an object containing secret: `xaiKey`, "MODEL_REQUEST", "rejected the request".
      expectSanitized({ status, error: { error: { message: { secret: xaiKey } } } }, 'MODEL_REQUEST', 'rejected the request');
      // [L213] Assert that `publicError(xaiSdkError(privateDetail, status), 'xai').message` does not satisfy: contains "does not support".
      expect(publicError(xaiSdkError(privateDetail, status), 'xai').message).not.toContain('does not support');
    // [L214] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L215] Iterate const provider over an array containing "openai", "anthropic", "google".
    for (const provider of ['openai', 'anthropic', 'google'] as const) {
      // [L216] Assert that `publicError(xaiSdkError('Incorrect API key provided.', 400), provider).code` strictly equals "MODEL_REQUEST".
      expect(publicError(xaiSdkError('Incorrect API key provided.', 400), provider).code).toBe('MODEL_REQUEST');
      // [L217] Assert that `publicError(xaiSdkError('Your team has no credits.', 403), provider).code` strictly equals "MODEL_ACCESS".
      expect(publicError(xaiSdkError('Your team has no credits.', 403), provider).code).toBe('MODEL_ACCESS');
    // [L218] Close the callback or control-flow body and finish the surrounding syntax.
    }
    // [L219] Declare `safe` as a new `AppError` instance initialized with "SYNTHETIC", "Known safe application message.".
    const safe = new AppError('SYNTHETIC', 'Known safe application message.');
    // [L220] Assert that the result of `publicError` using `safe`, "xai" strictly equals `safe`.
    expect(publicError(safe, 'xai')).toBe(safe);
    // [L221] Declare `unknown` as the result of `publicError` using a new `Error` instance initialized with text interpolating `privateDetail`, `privateUrl`, "xai".
    const unknown = publicError(new Error(`${privateDetail} ${privateUrl}`), 'xai');
    // [L222] Assert that `unknown.code` strictly equals "PREPARATION_FAILED".
    expect(unknown.code).toBe('PREPARATION_FAILED');
    // [L223] Assert that `unknown.message` does not satisfy: contains `privateDetail`.
    expect(unknown.message).not.toContain(privateDetail);
    // [L224] Assert that `unknown.stack` does not satisfy: contains `xaiKey`.
    expect(unknown.stack).not.toContain(xaiKey);
  // [L225] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L226] Close the callback or control-flow body and finish the surrounding syntax.
});
