// [L1] Imports ChatGoogle from @langchain/google for the Google Gemini chat model adapter.
import { ChatGoogle } from '@langchain/google';
// [L2] Imports AppError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError } from './errors.js';
// [L3] Blank line separating the surrounding declarations, statements, or document blocks.

// [L4] Defines the single approved Google Generative Language API origin.
const GOOGLE_ORIGIN = 'https://generativelanguage.googleapis.com';
// [L5] Blank line separating the surrounding declarations, statements, or document blocks.

// [L6] Existing explanatory comment: Use only the selected Gemini API key; never discover Cloud credentials or a gateway.
/** Use only the selected Gemini API key; never discover Cloud credentials or a gateway. */
// [L7] Exports construction of a Google model using only the job's selected API key and model ID.
export function createGoogleModel(apiKey: string, model: string): ChatGoogle {
  // [L8] Creates the LangChain Google chat model with an explicitly configured transport.
  return new ChatGoogle({
    // [L9] Selects the Google AI API-key platform, official origin, chosen model, and v1beta API version.
    apiKey, model, platformType: 'gai', endpoint: GOOGLE_ORIGIN, apiVersion: 'v1beta',
    // [L10] Limits SDK retries to one and disables streaming model invocation.
    maxRetries: 1, disableStreaming: true,
    // [L11] Existing explanatory comment: The default SDK client also reads service-account credentials even with an API
    // The default SDK client also reads service-account credentials even with an API
    // [L12] Existing explanatory comment: key. This API-key-only transport preserves this application's per-job isolation.
    // key. This API-key-only transport preserves this application's per-job isolation.
    // [L13] Supplies a custom API client to avoid unrelated ambient Google credential discovery.
    apiClient: {
      // [L14] Reports that the custom transport uses an API key.
      hasApiKey: () => true,
      // [L15] Rejects project-ID lookup with a fixed configuration error because this path requires a Google AI Studio key.
      getProjectId: async () => { throw new AppError('GOOGLE_CONFIGURATION', 'Use a Gemini API key from Google AI Studio.'); },
      // [L16] Defines the custom transport's asynchronous request handler.
      async fetch(request: Request): Promise<Response> {
        // [L17] Parses the SDK-generated request URL for validation.
        const url = new URL(request.url);
        // [L18] Recognizes the nonstreaming generateContent operation by its URL path suffix.
        const method = url.pathname.endsWith(':generateContent') ? 'generateContent'
          // [L19] Recognizes streamGenerateContent or marks any other operation invalid.
          : url.pathname.endsWith(':streamGenerateContent') ? 'streamGenerateContent' : null;
        // [L20] Requires the approved Google origin, POST method, recognized operation, and no URL fragment.
        if (url.origin !== GOOGLE_ORIGIN || request.method !== 'POST' || !method || url.hash
          // [L21] Allows only an empty query string or the known SSE query string.
          || (url.search !== '' && url.search !== '?alt=sse')) {
          // [L22] Rejects any request outside those approved endpoint constraints with a fixed configuration error.
          throw new AppError('GOOGLE_CONFIGURATION', 'The Google request could not be sent to the approved Gemini endpoint.');
        // [L23] Ends the rejection block for requests outside the approved Google endpoint constraints.
        }
        // [L24] Existing explanatory comment: Model IDs are data, including custom IDs with punctuation, not URL routing.
        // Model IDs are data, including custom IDs with punctuation, not URL routing.
        // [L25] Reconstructs the approved v1beta model URL, percent-encoding the selected model ID as data.
        const target = new URL(`/v1beta/models/${encodeURIComponent(model)}:${method}`, GOOGLE_ORIGIN);
        // [L26] Sets the SSE query only when calling the streaming operation.
        if (method === 'streamGenerateContent') target.search = 'alt=sse';
        // [L27] Combines the caller's abort signal with a 120-second transport timeout.
        const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]);
        // [L28] Rejects an already-cancelled or timed-out request before reading its body.
        signal.throwIfAborted();
        // [L29] Copies the SDK request body into an ArrayBuffer for forwarding.
        const body = await request.arrayBuffer();
        // [L30] Rechecks cancellation after the asynchronous body read.
        signal.throwIfAborted();
        // [L31] Starts the fetch to the reconstructed approved Google endpoint.
        return fetch(target, {
          // [L32] Sends JSON via POST with only the selected job's Google API key authentication header.
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          // [L33] Forwards the body and combined cancellation signal and rejects HTTP redirects.
          body, signal, redirect: 'error',
        // [L34] Closes the scope or expression introduced here: Starts the fetch to the reconstructed approved Google endpoint.
        });
      // [L35] Closes the scope or expression introduced here: Defines the custom transport's asynchronous request handler.
      },
    // [L36] Closes the scope or expression introduced here: Supplies a custom API client to avoid unrelated ambient Google credential discovery.
    },
  // [L37] Closes the scope or expression introduced here: Creates the LangChain Google chat model with an explicitly configured transport.
  });
// [L38] Closes the scope or expression introduced here: Exports construction of a Google model using only the job's selected API key and model ID.
}
