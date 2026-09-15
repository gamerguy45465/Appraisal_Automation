import { ChatGoogle } from '@langchain/google';
import { AppError } from './errors.js';

const GOOGLE_ORIGIN = 'https://generativelanguage.googleapis.com';

/** Use only the selected Gemini API key; never discover Cloud credentials or a gateway. */
export function createGoogleModel(apiKey: string, model: string): ChatGoogle {
  return new ChatGoogle({
    apiKey, model, platformType: 'gai', endpoint: GOOGLE_ORIGIN, apiVersion: 'v1beta',
    maxRetries: 1, disableStreaming: true,
    // The default SDK client also reads service-account credentials even with an API
    // key. This API-key-only transport preserves this application's per-job isolation.
    apiClient: {
      hasApiKey: () => true,
      getProjectId: async () => { throw new AppError('GOOGLE_CONFIGURATION', 'Use a Gemini API key from Google AI Studio.'); },
      async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const method = url.pathname.endsWith(':generateContent') ? 'generateContent'
          : url.pathname.endsWith(':streamGenerateContent') ? 'streamGenerateContent' : null;
        if (url.origin !== GOOGLE_ORIGIN || request.method !== 'POST' || !method || url.hash
          || (url.search !== '' && url.search !== '?alt=sse')) {
          throw new AppError('GOOGLE_CONFIGURATION', 'The Google request could not be sent to the approved Gemini endpoint.');
        }
        // Model IDs are data, including custom IDs with punctuation, not URL routing.
        const target = new URL(`/v1beta/models/${encodeURIComponent(model)}:${method}`, GOOGLE_ORIGIN);
        if (method === 'streamGenerateContent') target.search = 'alt=sse';
        const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]);
        signal.throwIfAborted();
        const body = await request.arrayBuffer();
        signal.throwIfAborted();
        return fetch(target, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body, signal, redirect: 'error',
        });
      },
    },
  });
}
