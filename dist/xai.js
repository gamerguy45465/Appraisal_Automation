// [L1] Imports ChatXAI from @langchain/xai for the xAI Grok chat model adapter.
import { ChatXAI } from '@langchain/xai';
// [L2] Imports AppError from ./errors.js for fixed public application errors and private provider-error classification.
import { AppError } from './errors.js';
// [L3] Blank line separating the surrounding declarations, statements, or document blocks.
// [L4] Defines the official xAI API base URL.
const XAI_BASE = 'https://api.x.ai/v1';
// [L5] Defines the exact chat-completions endpoint allowed by the custom transport.
const XAI_COMPLETIONS = `${XAI_BASE}/chat/completions`;
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.
// [L7] Existing explanatory comment: Keep Grok credentials, model calls, and cancellation inside the selected job.
/** Keep Grok credentials, model calls, and cancellation inside the selected job. */
// [L8] Exports creation of an xAI chat model isolated to the selected job credentials and model ID.
export function createXaiModel(apiKey, model) {
    // [L9] Constructs ChatXAI with the explicit job API key/model and official API base.
    const chat = new ChatXAI({ apiKey, model, baseURL: XAI_BASE,
        // [L10] Limits SDK retries to one and disables streaming responses.
        maxRetries: 1, streaming: false });
    // [L11] Sets the model's request timeout to 120 seconds.
    chat.timeout = 120_000;
    // [L12] Disables parallel tool calls in the model's extra request parameters.
    chat.modelKwargs = { parallel_tool_calls: false };
    // [L13] Existing explanatory comment: ChatXAI replaces the constructor's configuration object. Configure its public
    // ChatXAI replaces the constructor's configuration object. Configure its public
    // [L14] Existing explanatory comment: lazy client settings afterwards so the selected key cannot follow a redirect
    // lazy client settings afterwards so the selected key cannot follow a redirect
    // [L15] Existing explanatory comment: or acquire unrelated OpenAI organization/project headers from the environment.
    // or acquire unrelated OpenAI organization/project headers from the environment.
    // [L16] Replaces the lazy SDK client's configuration after ChatXAI construction.
    chat.clientConfig = {
        // [L17] Preserves other client settings while explicitly pinning the key/base URL and clearing inherited OpenAI organization/project values.
        ...chat.clientConfig, apiKey, baseURL: XAI_BASE, organization: null, project: null,
        // [L18] Supplies a custom transport handler for SDK fetch calls.
        async fetch(input, init) {
            // [L19] Normalizes SDK fetch arguments into a Request for validation and body access.
            const request = new Request(input, init);
            // [L20] Rejects any URL other than the exact approved chat-completions endpoint or any method other than POST.
            if (request.url !== XAI_COMPLETIONS || request.method !== 'POST') {
                // [L21] Throws a fixed configuration error when the Grok request would use an unapproved endpoint.
                throw new AppError('XAI_CONFIGURATION', 'The Grok request could not be sent to the approved xAI endpoint.');
                // [L22] Closes the scope or expression introduced here: Rejects any URL other than the exact approved chat-completions endpoint or any method other than POST.
            }
            // [L23] Combines the request's cancellation signal with a 120-second timeout.
            const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]);
            // [L24] Rejects an already-aborted request before reading the body.
            signal.throwIfAborted();
            // [L25] Reads the SDK request body into an ArrayBuffer for forwarding.
            const body = await request.arrayBuffer();
            // [L26] Rechecks cancellation after asynchronous body reading.
            signal.throwIfAborted();
            // [L27] Sends the validated request to the fixed xAI completions endpoint.
            return fetch(XAI_COMPLETIONS, {
                // [L28] Uses POST with JSON content type and only the selected job's bearer API-key authentication.
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                // [L29] Forwards body and combined signal and rejects redirects so credentials cannot be forwarded to another location.
                body, signal, redirect: 'error',
                // [L30] Closes the scope or expression introduced here: Sends the validated request to the fixed xAI completions endpoint.
            });
            // [L31] Closes the scope or expression introduced here: Supplies a custom transport handler for SDK fetch calls.
        },
        // [L32] Closes the scope or expression introduced here: Replaces the lazy SDK client's configuration after ChatXAI construction.
    };
    // [L33] Returns the configured xAI model instance.
    return chat;
    // [L34] Closes the scope or expression introduced here: Exports creation of an xAI chat model isolated to the selected job credentials and model ID.
}
//# sourceMappingURL=xai.js.map