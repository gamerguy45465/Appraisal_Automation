import { ChatXAI } from '@langchain/xai';
import { AppError } from './errors.js';

const XAI_BASE = 'https://api.x.ai/v1';
const XAI_COMPLETIONS = `${XAI_BASE}/chat/completions`;

/** Keep Grok credentials, model calls, and cancellation inside the selected job. */
export function createXaiModel(apiKey: string, model: string): ChatXAI {
  const chat = new ChatXAI({ apiKey, model, baseURL: XAI_BASE,
    maxRetries: 1, streaming: false });
  chat.timeout = 120_000;
  chat.modelKwargs = { parallel_tool_calls: false };
  // ChatXAI replaces the constructor's configuration object. Configure its public
  // lazy client settings afterwards so the selected key cannot follow a redirect
  // or acquire unrelated OpenAI organization/project headers from the environment.
  chat.clientConfig = {
    ...chat.clientConfig, apiKey, baseURL: XAI_BASE, organization: null, project: null,
    async fetch(input, init) {
      const request = new Request(input, init);
      if (request.url !== XAI_COMPLETIONS || request.method !== 'POST') {
        throw new AppError('XAI_CONFIGURATION', 'The Grok request could not be sent to the approved xAI endpoint.');
      }
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]);
      signal.throwIfAborted();
      const body = await request.arrayBuffer();
      signal.throwIfAborted();
      return fetch(XAI_COMPLETIONS, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body, signal, redirect: 'error',
      });
    },
  };
  return chat;
}
