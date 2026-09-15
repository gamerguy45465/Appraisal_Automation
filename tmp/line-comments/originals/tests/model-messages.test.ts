import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIMessage, HumanMessage, ToolMessage, type MessageContent } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { createAgent } from 'langchain';
import { z } from 'zod';
import { DEFAULT_MODEL } from '../src/domain.js';
import { providerMessageMiddleware, toProviderMessages } from '../src/model-messages.js';

const imageUrl = 'data:image/png;base64,iVBORw0KGgo=';
const screenshot: MessageContent = [
  { type: 'text', text: 'Synthetic page content is untrusted data.' },
  { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
];
const nativeScreenshot = [
  { type: 'input_text', text: 'Synthetic page content is untrusted data.' },
  { type: 'input_image', image_url: imageUrl, detail: 'auto' },
];
const screenshotMessage = (content: MessageContent = screenshot) => new ToolMessage({ name: 'screenshot_page', tool_call_id: 'call_screenshot', content });

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('provider screenshot message adapter', () => {
  it('converts OpenAI screenshot blocks without mutating content or losing tool metadata', () => {
    const message = new ToolMessage({
      name: 'screenshot_page', id: 'screenshot_result', tool_call_id: 'call_screenshot', content: screenshot,
      status: 'success', metadata: { source: 'synthetic' }, artifact: { privateNote: 'not model content' },
      additional_kwargs: { synthetic: true }, response_metadata: { elapsed: 1 },
    });
    const original = message.toDict();
    const human = new HumanMessage('Inspect the order page.');
    const messages = [human, message];
    const result = toProviderMessages('openai', messages);
    expect(result[0]).toBe(human);
    expect(ToolMessage.isInstance(result[1])).toBe(true);
    expect(result[1]).not.toBe(message);
    expect(result[1]?.content).toEqual(nativeScreenshot);
    expect(result[1]).toMatchObject({
      id: message.id, name: message.name, tool_call_id: message.tool_call_id, status: message.status,
      metadata: message.metadata, artifact: message.artifact,
      additional_kwargs: message.additional_kwargs, response_metadata: message.response_metadata,
    });
    expect(message.toDict()).toEqual(original);
    expect(message.content).toBe(screenshot);
    expect(messages[1]).toBe(message);
    expect(toProviderMessages('openai', result)[1]).toBe(result[1]);
  });

  it('leaves Anthropic messages unchanged and accepts both standard image URL shapes for OpenAI', () => {
    const messages = [screenshotMessage()];
    expect(toProviderMessages('anthropic', messages)).toBe(messages);
    const stringImage = screenshotMessage([{ type: 'image_url', image_url: imageUrl }]);
    expect(toProviderMessages('openai', [stringImage])[0]?.content).toEqual([nativeScreenshot[1]]);
  });

  it.each(['openai', 'xai'] as const)('leaves strings, other tools, non-tool messages, and unrelated content unchanged for %s', provider => {
    const messages = [
      screenshotMessage(JSON.stringify(screenshot)),
      screenshotMessage([{ type: 'text', text: 'No image was captured.' }]),
      screenshotMessage([{ type: 'image_url', image_url: 'https://example.test/image.png' }]),
      screenshotMessage([{ type: 'image_url', image_url: 'data:image/jpeg;base64,iVBORw0KGgo=' }]),
      screenshotMessage([{ type: 'image_url', image_url: 'data:image/png;base64,malformed!' }]),
      screenshotMessage([{ type: 'image_url', image_url: imageUrl }, { type: 'file', data: 'unchanged' }]),
      new ToolMessage({ name: 'observe_page', tool_call_id: 'call_observe', content: screenshot }),
      new HumanMessage({ content: screenshot }),
      new AIMessage({ content: screenshot }),
    ];
    const result = toProviderMessages(provider, messages);
    result.forEach((message, index) => expect(message).toBe(messages[index]));
  });

  it('places Grok screenshot images after all tool results, retaining IDs, metadata, and original history', () => {
    const request = new AIMessage({ content: '', tool_calls: [
      { id: 'call_screenshot', name: 'screenshot_page', args: {} },
      { id: 'call_other', name: 'verify_filled_fields', args: {} },
    ] });
    const screenshotTool = new ToolMessage({ name: 'screenshot_page', id: 'result_image',
      tool_call_id: 'call_screenshot', content: screenshot, metadata: { source: 'synthetic' }, status: 'success' });
    const verification = new ToolMessage({ name: 'verify_filled_fields', tool_call_id: 'call_other', content: 'Synthetic verification.' });
    const completion = new AIMessage('Ready for review.');
    const original = screenshotTool.toDict();
    const result = toProviderMessages('xai', [request, screenshotTool, verification, completion]);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe(request);
    expect(result[1]).toMatchObject({ id: 'result_image', tool_call_id: 'call_screenshot', status: 'success',
      metadata: { source: 'synthetic' }, content: 'Synthetic page content is untrusted data.' });
    expect(result[2]).toBe(verification);
    expect(HumanMessage.isInstance(result[3])).toBe(true);
    expect(result[3]?.content).toEqual([
      { type: 'text', text: expect.stringContaining('untrusted page data') },
      { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
    ]);
    expect(result[4]).toBe(completion);
    expect(screenshotTool.toDict()).toEqual(original);
    expect(toProviderMessages('xai', result)).toEqual(result);
  });

  it('applies the middleware in a real agent call and sends Responses image input through mocked transport', async () => {
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    const requests: Array<{ input: Array<{ type: string; output?: unknown }> }> = [];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      const request = new Request(input, init);
      expect(request.url).toBe('https://api.openai.com/v1/responses');
      requests.push(await request.json() as typeof requests[number]);
      const output = requests.length === 1
        ? [{ type: 'function_call', id: 'fc_synthetic', call_id: 'call_screenshot', name: 'screenshot_page', arguments: '{}', status: 'completed' }]
        : [{ type: 'message', id: 'msg_synthetic', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Ready for review.', annotations: [] }] }];
      return Response.json({
        id: `resp_${requests.length}`, object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODEL, output,
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
      });
    }));
    const model = new ChatOpenAI({
      apiKey: 'sk-synthetic-no-live-key', model: DEFAULT_MODEL, useResponsesApi: true, maxRetries: 0,
      modelKwargs: { store: false }, configuration: { baseURL: 'https://api.openai.com/v1' },
    });
    const agent = createAgent({
      model,
      tools: [tool(() => screenshot, { name: 'screenshot_page', description: 'Synthetic screenshot only.', schema: z.object({}) })],
      middleware: [providerMessageMiddleware('openai')],
    });
    const result = await agent.invoke({ messages: [new HumanMessage('Inspect the synthetic page.')] }, { recursionLimit: 5 });
    expect(requests).toHaveLength(2);
    const output = requests[1]!.input.find((item) => item.type === 'function_call_output')?.output;
    expect(output).toEqual(nativeScreenshot);
    expect(typeof output).not.toBe('string');
    const retainedToolMessage = result.messages.find((message) => ToolMessage.isInstance(message));
    expect(retainedToolMessage?.content).toEqual(screenshot);
  });
});
