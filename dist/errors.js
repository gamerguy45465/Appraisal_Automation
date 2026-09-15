// [L2] Blank line separating the surrounding declarations, statements, or document blocks.
// [L3] Existing explanatory comment: An intentionally safe message that can cross the API/worker boundary.
/** An intentionally safe message that can cross the API/worker boundary. */
// [L4] Defines the application error class used to carry deliberately public messages and error metadata.
export class AppError extends Error {
    code;
    statusCode;
    // [L5] Creates an error with a read-only public code and HTTP status, defaulting the status to 400.
    constructor(code, message, statusCode = 400) {
        // [L6] Initializes the standard Error base class with the public message.
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        // [L7] Assigns the custom error name for identification.
        this.name = 'AppError';
        // [L8] Closes the scope or expression introduced here: Creates an error with a read-only public code and HTTP status, defaulting the status to 400.
    }
}
// [L10] Blank line separating the surrounding declarations, statements, or document blocks.
// [L11] Defines a helper for safely accessing properties of unknown error-like values.
function record(value) {
    // [L12] Treats truthy objects as records and substitutes an empty record for other values.
    return value && typeof value === 'object' ? value : {};
    // [L13] Closes the scope or expression introduced here: Defines a helper for safely accessing properties of unknown error-like values.
}
// [L14] Blank line separating the surrounding declarations, statements, or document blocks.
// [L15] Existing explanatory comment: Inspect known SDK error shapes privately; none of this text may leave this module.
/** Inspect known SDK error shapes privately; none of this text may leave this module. */
// [L16] Defines private extraction of a provider message from known nested SDK error shapes.
function providerMessage(info) {
    // [L17] Reads the first nested error object if present.
    const detail = record(info.error);
    // [L18] Reads a second nested error object if present.
    const nested = record(detail.error);
    // [L19] Chooses the deepest available message, falling back through outer error objects.
    const message = nested.message ?? detail.message ?? info.message;
    // [L20] Returns at most 8,000 characters of a string message, or an empty string for nontext values.
    return typeof message === 'string' ? message.slice(0, 8000) : '';
    // [L21] Closes the scope or expression introduced here: Defines private extraction of a provider message from known nested SDK error shapes.
}
// [L22] Blank line separating the surrounding declarations, statements, or document blocks.
// [L23] Defines Anthropic-specific message classification into fixed application errors.
function anthropicRequestError(message) {
    // [L24] Detects message patterns indicating insufficient Anthropic API credits.
    if (/credit balance.{0,40}(?:too low|insufficient)|insufficient.{0,20}credits?/i.test(message)) {
        // [L25] Returns a fixed HTTP 502 quota error directing the user to Anthropic billing and credits.
        return new AppError('API_QUOTA', 'Anthropic API credits are insufficient. Check the API account billing and credit balance, then try again.', 502);
        // [L26] Closes the scope or expression introduced here: Detects message patterns indicating insufficient Anthropic API credits.
    }
    // [L27] Detects Anthropic schema-complexity, compilation, union, or optional-parameter rejection wording.
    if (/schema.{0,100}(?:too complex|compilation|union|optional parameter)|(?:too many|maximum|limit).{0,80}(?:union types?|optional parameters?)/i.test(message)) {
        // [L28] Returns a fixed HTTP 502 structured-schema rejection error for Anthropic.
        return new AppError('MODEL_SCHEMA', 'Anthropic rejected the structured extraction schema. Restart the updated application and try again.', 502);
        // [L29] Closes the scope or expression introduced here: Detects Anthropic schema-complexity, compilation, union, or optional-parameter rejection wording.
    }
    // [L30] Detects oversized Anthropic prompts, context, requests, PDFs, or page counts.
    if (/prompt is too long|context.{0,40}(?:limit|exceed)|(?:request|pdf|document).{0,60}(?:too large|too many pages|exceeds?.{0,20}(?:size|page|limit))|maximum.{0,30}(?:pages|request size)/i.test(message)) {
        // [L31] Returns a fixed HTTP 502 request-size error advising smaller or shorter PDFs.
        return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed an Anthropic request or model context limit. Use smaller or shorter PDFs and try again.', 502);
        // [L32] Closes the scope or expression introduced here: Detects oversized Anthropic prompts, context, requests, PDFs, or page counts.
    }
    // [L33] Detects unreadable, invalid, encrypted, password-protected, or corrupt PDF wording from Anthropic.
    if (/(?:pdf|document).{0,60}(?:password|encrypted|invalid|not valid|corrupt)|(?:invalid|encrypted|corrupt).{0,30}(?:pdf|document)/i.test(message)) {
        // [L34] Returns a fixed HTTP 502 unreadable-PDF error without including the provider's raw response.
        return new AppError('DOCUMENT_PDF_INVALID', 'Anthropic could not read a PDF. Supply valid PDFs without password protection or encryption and try again.', 502);
        // [L35] Closes the scope or expression introduced here: Detects unreadable, invalid, encrypted, password-protected, or corrupt PDF wording from Anthropic.
    }
    // [L36] Detects unsupported structured-output, document, image, tool-choice, or thinking features reported by Anthropic.
    if (/(?:output_config|json_schema|structured outputs?|pdf|image|tool_choice|thinking).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:output_config|json_schema|structured outputs?|pdf|image|tool_choice|thinking)/i.test(message)) {
        // [L37] Returns a fixed HTTP 502 model-capability error for the selected Anthropic model.
        return new AppError('MODEL_CAPABILITY', 'The selected Anthropic model does not support a required document or extraction feature. Check the model capabilities and choose a compatible model.', 502);
        // [L38] Closes the scope or expression introduced here: Detects unsupported structured-output, document, image, tool-choice, or thinking features reported by Anthropic.
    }
    // [L39] Leaves an unrecognized Anthropic failure unclassified for the caller's generic fallback.
    return undefined;
    // [L40] Closes the scope or expression introduced here: Defines Anthropic-specific message classification into fixed application errors.
}
// [L41] Blank line separating the surrounding declarations, statements, or document blocks.
// [L42] Existing explanatory comment: Google RequestError keeps its response in data, and may retain a key-bearing URL.
/** Google RequestError keeps its response in data, and may retain a key-bearing URL. */
// [L43] Defines Google-specific error classification using nested response data and HTTP status.
function googleRequestError(info, status) {
    // [L44] Reads Google's nested error from the SDK's data property.
    const detail = record(record(info.data).error);
    // [L45] Uses Google's nested message when it is text, capped at 8,000 characters, otherwise applies the generic message extractor.
    const message = typeof detail.message === 'string' ? detail.message.slice(0, 8000) : providerMessage(info);
    // [L46] Reads reason codes from at most the first 32 structured detail records.
    const reasons = Array.isArray(detail.details) ? detail.details.slice(0, 32).map(value => record(value).reason) : [];
    // [L47] Tests structured reasons for invalid, expired, or restricted Google API keys.
    if (reasons.some(reason => typeof reason === 'string' && /^API_KEY_(?:INVALID|EXPIRED|SERVICE_BLOCKED|IP_ADDRESS_BLOCKED|HTTP_REFERRER_BLOCKED|ANDROID_APP_BLOCKED|IOS_APP_BLOCKED)$/.test(reason))
        // [L48] Also detects textual key-invalidity, expiration, restriction, or leaked-key reports.
        || /api[ _-]?key.{0,80}(?:not valid|invalid|expired|blocked|reported as leaked)|(?:invalid|expired).{0,30}api[ _-]?key/i.test(message)) {
        // [L49] Returns a fixed HTTP 502 Google authentication error with API-key restriction guidance.
        return new AppError('API_AUTH', 'Google Gemini could not authenticate the API key. Check the key and its API restrictions in Google AI Studio.', 502);
        // [L50] Closes the scope or expression introduced here: Detects unsupported structured-output, document, image, tool-choice, or thinking features reported by Anthropic.
    }
    // [L51] Tests structured reasons for disabled or inactive Google billing.
    if (reasons.some(reason => reason === 'BILLING_DISABLED' || reason === 'BILLING_NOT_ACTIVE')
        // [L52] Also recognizes textual billing configuration and exhausted-quota errors.
        || /billing.{0,80}(?:disabled|not enabled|not active|required)|(?:enable|set up).{0,30}billing|quota.{0,80}(?:exceed|exhaust)|(?:exceed|exhaust).{0,50}quota/i.test(message)) {
        // [L53] Returns a fixed HTTP 502 Google billing/quota error.
        return new AppError('API_QUOTA', 'Google Gemini API billing or quota prevents this request. Check the project billing and API usage limits, then try again.', 502);
        // [L54] Closes the scope or expression introduced here: Detects unsupported structured-output, document, image, tool-choice, or thinking features reported by Anthropic.
    }
    // [L55] Defers other HTTP 403 and 429 failures to the outer access/rate-limit classification.
    if (status === 403 || status === 429)
        return undefined;
    // [L56] Detects invalid or overly complex Google response schemas and nesting limits.
    if (/(?:response[_ ]?(?:json[_ ]?)?schema|schema).{0,100}(?:too complex|compilation|too many|nesting|depth|invalid)|(?:too many|maximum|limit).{0,60}(?:schema|nesting)/i.test(message)) {
        // [L57] Returns a fixed HTTP 502 Google structured-schema rejection error.
        return new AppError('MODEL_SCHEMA', 'Google Gemini rejected the structured extraction schema. Restart the updated application and try again.', 502);
        // [L58] Closes the scope or expression introduced here: Detects invalid or overly complex Google response schemas and nesting limits.
    }
    // [L59] Detects unreadable, invalid, encrypted, password-protected, or corrupt Google PDF input reports.
    if (/(?:pdf|document).{0,60}(?:password|encrypted|invalid|not valid|corrupt)|(?:invalid|encrypted|corrupt).{0,30}(?:pdf|document)/i.test(message)) {
        // [L60] Returns a fixed HTTP 502 Google unreadable-PDF error.
        return new AppError('DOCUMENT_PDF_INVALID', 'Google Gemini could not read a PDF. Supply valid PDFs without password protection or encryption and try again.', 502);
        // [L61] Closes the scope or expression introduced here: Detects unreadable, invalid, encrypted, password-protected, or corrupt Google PDF input reports.
    }
    // [L62] Detects Google request, PDF, payload, page-count, token-count, or context limits.
    if (/(?:request|payload|pdf|document|input token count|context).{0,100}(?:too large|too many pages|exceed|limit)|maximum.{0,40}(?:pages|request size|input tokens)/i.test(message)) {
        // [L63] Returns a fixed HTTP 502 Google document/request-size error.
        return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed a Google Gemini request or model context limit. Use smaller or shorter PDFs and try again.', 502);
        // [L64] Closes the scope or expression introduced here: Detects Google request, PDF, payload, page-count, token-count, or context limits.
    }
    // [L65] Detects unsupported Google schema, output MIME type, PDF, image, tool, or function-calling capabilities.
    if (/(?:response[_ ]?(?:json[_ ]?)?schema|response[_ ]?mime[_ ]?type|structured outputs?|pdf|image|tools?|function calling).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:response[_ ]?(?:json[_ ]?)?schema|response[_ ]?mime[_ ]?type|structured outputs?|pdf|image|tools?|function calling)/i.test(message)) {
        // [L66] Returns a fixed HTTP 502 capability error for the selected Google model.
        return new AppError('MODEL_CAPABILITY', 'The selected Google Gemini model does not support a required document or extraction feature. Check the model capabilities and choose a compatible model.', 502);
        // [L67] Closes the scope or expression introduced here: Detects unsupported Google schema, output MIME type, PDF, image, tool, or function-calling capabilities.
    }
    // [L68] Leaves an unrecognized Google failure for the outer generic classification.
    return undefined;
    // [L69] Closes the scope or expression introduced here: Defines Google-specific error classification using nested response data and HTTP status.
}
// [L70] Blank line separating the surrounding declarations, statements, or document blocks.
// [L71] Existing explanatory comment: xAI uses OpenAI-compatible errors; inspect their details only to choose fixed messages.
/** xAI uses OpenAI-compatible errors; inspect their details only to choose fixed messages. */
// [L72] Defines xAI-specific classification while keeping OpenAI-compatible raw error details private.
function xaiRequestError(info, status) {
    // [L73] Reads xAI's first nested error object if present.
    const detail = record(info.error);
    // [L74] Reads a second nested xAI error object if present.
    const nested = record(detail.error);
    // [L75] Selects the deepest available error code with fallbacks to outer records.
    const code = nested.code ?? detail.code ?? info.code;
    // [L76] Accepts string-valued nested or outer xAI errors before falling back to the generic message extractor.
    const rawMessage = typeof detail.error === 'string' ? detail.error : typeof info.error === 'string' ? info.error : providerMessage(info);
    // [L77] Limits privately inspected xAI message text to 8,000 characters.
    const message = rawMessage.slice(0, 8000);
    // [L78] Detects the invalid_api_key code or textual invalid, incorrect, or expired xAI key errors.
    if (code === 'invalid_api_key' || /api[ _-]?key.{0,60}(?:not valid|invalid|incorrect|expired)|(?:invalid|incorrect|expired).{0,30}api[ _-]?key/i.test(message)) {
        // [L79] Returns a fixed HTTP 502 Grok authentication error directing the user to the xAI Console.
        return new AppError('API_AUTH', 'SpaceXAI (Grok) could not authenticate the API key. Check the Grok API key in the xAI Console.', 502);
        // [L80] Closes the scope or expression introduced here: Detects the invalid_api_key code or textual invalid, incorrect, or expired xAI key errors.
    }
    // [L81] Recognizes HTTP 402 and explicit insufficient-quota or billing-limit codes.
    if (status === 402 || code === 'insufficient_quota' || code === 'billing_hard_limit_reached'
        // [L82] Also recognizes message patterns for missing/exhausted credits and reached spending or billing limits.
        || /(?:insufficient|not enough|no).{0,20}credits?|(?:does not|doesn't|do not|don't) have.{0,20}credits?|credit balance.{0,40}(?:too low|insufficient|exhausted)|(?:spending|billing).{0,30}limit.{0,30}(?:reached|exceeded)/i.test(message)) {
        // [L83] Returns a fixed HTTP 502 Grok credits/spending-limit error.
        return new AppError('API_QUOTA', 'SpaceXAI (Grok) API credits or spending limits prevent this request. Check team billing and credit balance in the xAI Console.', 502);
        // [L84] Closes the scope or expression introduced here: Detects the invalid_api_key code or textual invalid, incorrect, or expired xAI key errors.
    }
    // [L85] Detects xAI's explicit unavailable-model error code.
    if (code === 'model_not_found') {
        // [L86] Returns a fixed HTTP 502 Grok model-access error.
        return new AppError('MODEL_ACCESS', 'The selected SpaceXAI (Grok) model is unavailable to this key. Check the exact model ID and account access.', 502);
        // [L87] Closes the scope or expression introduced here: Detects xAI's explicit unavailable-model error code.
    }
    // [L88] Defers remaining HTTP 403 and 429 failures to generic model-access and rate-limit handling.
    if (status === 403 || status === 429)
        return undefined;
    // [L89] Detects xAI JSON schema invalidity, complexity, compilation, or nesting limits.
    if (/(?:json[_ ]?schema|schema).{0,100}(?:too complex|compilation|invalid|too many|nesting|depth)/i.test(message)) {
        // [L90] Returns a fixed HTTP 502 Grok structured-schema rejection error.
        return new AppError('MODEL_SCHEMA', 'SpaceXAI (Grok) rejected the structured extraction schema. Restart the updated application and try again.', 502);
        // [L91] Closes the scope or expression introduced here: Detects xAI JSON schema invalidity, complexity, compilation, or nesting limits.
    }
    // [L92] Detects xAI request, document-image, input-token, or context size limits.
    if (/(?:request|payload|document|image|input token count|context).{0,100}(?:too large|too many|exceed|limit)|maximum.{0,40}(?:request size|input tokens|context length)/i.test(message)) {
        // [L93] Returns a fixed HTTP 502 Grok request-size error.
        return new AppError('API_REQUEST_TOO_LARGE', 'The documents exceed a SpaceXAI (Grok) request or model context limit. Use smaller or shorter PDFs and try again.', 502);
        // [L94] Closes the scope or expression introduced here: Detects xAI request, document-image, input-token, or context size limits.
    }
    // [L95] Detects unsupported xAI structured-output, image/vision, tool, or function-calling capabilities.
    if (/(?:response_format|json_schema|structured outputs?|images?|vision|tools?|function calling).{0,100}(?:not supported|unsupported|not available)|(?:unsupported|not supported|does not support).{0,100}(?:response_format|json_schema|structured outputs?|images?|vision|tools?|function calling)/i.test(message)) {
        // [L96] Returns a fixed HTTP 502 capability error for the selected Grok model.
        return new AppError('MODEL_CAPABILITY', 'The selected SpaceXAI (Grok) model does not support a required image or extraction feature. Check the model capabilities and choose a compatible model.', 502);
        // [L97] Closes the scope or expression introduced here: Detects unsupported xAI structured-output, image/vision, tool, or function-calling capabilities.
    }
    // [L98] Leaves an unrecognized xAI failure for the outer generic classifier.
    return undefined;
    // [L99] Closes the scope or expression introduced here: Defines xAI-specific classification while keeping OpenAI-compatible raw error details private.
}
// [L100] Blank line separating the surrounding declarations, statements, or document blocks.
// [L101] Existing explanatory comment: Classify provider failures without logging keys, document content, or raw responses.
/** Classify provider failures without logging keys, document content, or raw responses. */
// [L102] Exports conversion of any failure to a public AppError, using OpenAI labels when no provider is supplied.
export function publicError(error, provider = 'openai') {
    // [L103] Preserves an existing application-safe error without reclassifying it.
    if (error instanceof AppError)
        return error;
    // [L104] Coerces the unknown failure into a property-accessible record or an empty record.
    const info = record(error);
    // [L105] Chooses the user-facing provider name from the selected provider identifier.
    const label = provider === 'xai' ? 'SpaceXAI (Grok)' : provider === 'google' ? 'Google Gemini' : provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
    // [L106] Reads Google's numeric statusCode when present; other cases use the common status property.
    const status = provider === 'google' && typeof info.statusCode === 'number' ? info.statusCode : info.status;
    // [L107] Starts provider-specific handling for xAI failures.
    if (provider === 'xai') {
        // [L108] Applies xAI detail classification only for the selected client, quota, and rate-limit status codes.
        if (status === 400 || status === 402 || status === 403 || status === 422 || status === 429) {
            // [L109] Attempts to classify xAI's private error details into a fixed message.
            const specific = xaiRequestError(info, status);
            // [L110] Returns the xAI-specific error when a pattern matched.
            if (specific)
                return specific;
            // [L111] Closes the scope or expression introduced here: Applies xAI detail classification only for the selected client, quota, and rate-limit status codes.
        }
        // [L112] Maps xAI HTTP 408 or 504 to an application timeout with HTTP 504.
        if (status === 408 || status === 504)
            return new AppError('TIMEOUT', 'SpaceXAI (Grok) did not complete the request in time. Check the connection and try again.', 504);
        // [L113] Maps xAI HTTP 500 or 502 to a fixed temporary-unavailability error.
        if (status === 500 || status === 502)
            return new AppError('API_UNAVAILABLE', 'SpaceXAI (Grok) is temporarily unavailable. Try again shortly.', 502);
        // [L114] Closes the scope or expression introduced here: Starts provider-specific handling for xAI failures.
    }
    // [L115] Starts provider-specific handling for Google failures.
    if (provider === 'google') {
        // [L116] Maps Google's named AuthError directly to a fixed authentication message.
        if (info.name === 'AuthError')
            return new AppError('API_AUTH', 'Google Gemini could not authenticate the API key. Check the key and its API restrictions in Google AI Studio.', 502);
        // [L117] Applies Google's detailed classifier to selected request, access, and rate-limit status codes.
        if (status === 400 || status === 403 || status === 422 || status === 429) {
            // [L118] Attempts to classify Google's structured private error details.
            const specific = googleRequestError(info, status);
            // [L119] Returns the Google-specific error when recognized.
            if (specific)
                return specific;
            // [L120] Closes the scope or expression introduced here: Applies Google's detailed classifier to selected request, access, and rate-limit status codes.
        }
        // [L121] Maps Google's blocked-prompt exception to a fixed model-output-blocked error.
        if (info.name === 'PromptBlockedError')
            return new AppError('MODEL_OUTPUT_BLOCKED', 'Google Gemini blocked this document request. Review the documents and provider requirements before trying again.', 502);
        // [L122] Maps missing candidates or malformed output to a fixed unusable-extraction-output error.
        if (info.name === 'NoCandidatesError' || info.name === 'MalformedOutputError')
            return new AppError('MODEL_OUTPUT_INVALID', 'Google Gemini did not return usable extraction output. Try again and check the selected model capabilities.', 502);
        // [L123] Recognizes Google input, configuration, invalid-tool, and missing-tool-call exceptions as request-preparation failures.
        if (info.name === 'InvalidInputError' || info.name === 'ConfigurationError' || info.name === 'InvalidToolError' || info.name === 'ToolCallNotFoundError') {
            // [L124] Returns a fixed HTTP 502 Google request-preparation error.
            return new AppError('MODEL_REQUEST', 'The Google Gemini request could not be prepared. Restart the updated application and verify the selected model.', 502);
            // [L125] Closes the scope or expression introduced here: Recognizes Google input, configuration, invalid-tool, and missing-tool-call exceptions as request-preparation failures.
        }
        // [L126] Maps Google HTTP 408 or 504 to a fixed HTTP 504 timeout.
        if (status === 408 || status === 504)
            return new AppError('TIMEOUT', 'Google Gemini did not complete the request in time. Check the connection and try again.', 504);
        // [L127] Maps Google HTTP 500 or 502 to a fixed temporary-unavailability error.
        if (status === 500 || status === 502)
            return new AppError('API_UNAVAILABLE', 'Google Gemini is temporarily unavailable. Try again shortly.', 502);
        // [L128] Closes the scope or expression introduced here: Starts provider-specific handling for Google failures.
    }
    // [L129] Maps the shared insufficient_quota code to a provider-labeled billing/quota error.
    if (info.code === 'insufficient_quota')
        return new AppError('API_QUOTA', `${label} API quota is exhausted. Check API billing and account limits.`, 502);
    // [L130] Maps HTTP 401 to a fixed authentication error for the selected provider.
    if (status === 401)
        return new AppError('API_AUTH', `${label} could not authenticate the API key. Use a key for the selected provider.`, 502);
    // [L131] Maps HTTP 403, HTTP 404, or model_not_found to a fixed model-access error.
    if (status === 403 || status === 404 || info.code === 'model_not_found')
        return new AppError('MODEL_ACCESS', `The selected ${label} model is unavailable to this key. Check the exact model ID and account access.`, 502);
    // [L132] Maps HTTP 429 to a provider-labeled rate-limit error.
    if (status === 429)
        return new AppError('API_RATE_LIMIT', `${label} rate limited this request. Check API usage limits and billing, then try again.`, 502);
    // [L133] Maps HTTP 413 to a provider-labeled document-request-size error.
    if (status === 413)
        return new AppError('API_REQUEST_TOO_LARGE', `${label} rejected the document request size. Use smaller PDFs and try again.`, 502);
    // [L134] Handles remaining HTTP 400 and 422 request rejections.
    if (status === 400 || status === 422) {
        // [L135] Attempts Anthropic-specific message classification only when Anthropic is the selected provider.
        const specific = provider === 'anthropic' ? anthropicRequestError(providerMessage(info)) : undefined;
        // [L136] Returns a recognized Anthropic error or a fixed provider-labeled generic request rejection.
        return specific ?? new AppError('MODEL_REQUEST', `${label} rejected the request. Verify the model ID and account access, and check that the PDFs meet the provider's document requirements.`, 502);
        // [L137] Closes the scope or expression introduced here: Handles remaining HTTP 400 and 422 request rejections.
    }
    // [L138] Maps HTTP 529 or 503 to a fixed temporary provider-unavailability error.
    if (status === 529 || status === 503)
        return new AppError('API_UNAVAILABLE', `${label} is temporarily unavailable. Try again shortly.`, 502);
    // [L139] Recognizes standard abort/timeout names and the OpenAI SDK connection-timeout class.
    if (info.name === 'AbortError' || info.name === 'TimeoutError' || (error instanceof Error && error.constructor.name === 'APIConnectionTimeoutError')) {
        // [L140] Returns the fixed preparation-timeout error with HTTP 504.
        return new AppError('TIMEOUT', 'Preparation timed out. Check the connection and try again.', 504);
        // [L141] Closes the scope or expression introduced here: Recognizes standard abort/timeout names and the OpenAI SDK connection-timeout class.
    }
    // [L142] Falls back to a fixed HTTP 500 preparation failure without exposing original exception details.
    return new AppError('PREPARATION_FAILED', 'Preparation could not be completed. Check your documents, R3 login, browser installation, and model access, then try again.', 500);
    // [L143] Closes the scope or expression introduced here: Exports conversion of any failure to a public AppError, using OpenAI labels when no provider is supplied.
}
//# sourceMappingURL=errors.js.map