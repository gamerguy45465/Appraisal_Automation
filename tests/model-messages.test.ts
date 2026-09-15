// [L1] Import { afterEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, describe, expect, it, vi } from 'vitest';
// [L2] Import { AIMessage, HumanMessage, ToolMessage, type MessageContent } from "@langchain/core/messages" for these regression tests.
import { AIMessage, HumanMessage, ToolMessage, type MessageContent } from '@langchain/core/messages';
// [L3] Import { ChatOpenAI } from "@langchain/openai" for these regression tests.
import { ChatOpenAI } from '@langchain/openai';
// [L4] Import { tool } from "@langchain/core/tools" for these regression tests.
import { tool } from '@langchain/core/tools';
// [L5] Import { createAgent } from "langchain" for these regression tests.
import { createAgent } from 'langchain';
// [L6] Import { z } from "zod" for these regression tests.
import { z } from 'zod';
// [L7] Import { DEFAULT_MODEL } from "../src/domain.js" for these regression tests.
import { DEFAULT_MODEL } from '../src/domain.js';
// [L8] Import { providerMessageMiddleware, toProviderMessages } from "../src/model-messages.js" for these regression tests.
import { providerMessageMiddleware, toProviderMessages } from '../src/model-messages.js';
// [L9] Blank line separating the surrounding declarations, statements, or document blocks.

// [L10] Declare `imageUrl` as "data:image/png;base64,iVBORw0KGgo=".
const imageUrl = 'data:image/png;base64,iVBORw0KGgo=';
// [L11] Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic page content is untrusted data.", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto".
const screenshot: MessageContent = [
  // [L12] Set fixture property `type` to "text". Set fixture property `text` to "Synthetic page content is untrusted data.".
  { type: 'text', text: 'Synthetic page content is untrusted data.' },
  // [L13] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "auto".
  { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
// [L14] Close the array of fixture values for `screenshot` and finish the surrounding syntax.
];
// [L15] Declare `nativeScreenshot` as an array containing an object containing type: "input_text", text: "Synthetic page content is untrusted data.", an object containing type: "input_image", image_url: `imageUrl`, detail: "auto".
const nativeScreenshot = [
  // [L16] Set fixture property `type` to "input_text". Set fixture property `text` to "Synthetic page content is untrusted data.".
  { type: 'input_text', text: 'Synthetic page content is untrusted data.' },
  // [L17] Set fixture property `type` to "input_image". Set fixture property `image_url` to `imageUrl`. Set fixture property `detail` to "auto".
  { type: 'input_image', image_url: imageUrl, detail: 'auto' },
// [L18] Close the array of fixture values for `nativeScreenshot` and finish the surrounding syntax.
];
// [L19] Declare `screenshotMessage` as a callback that returns a new `ToolMessage` instance initialized with an object containing name: "screenshot_page", tool_call_id: "call_screenshot", content.
const screenshotMessage = (content: MessageContent = screenshot) => new ToolMessage({ name: 'screenshot_page', tool_call_id: 'call_screenshot', content });
// [L20] Blank line separating the surrounding declarations, statements, or document blocks.

// [L21] Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables..
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
// [L22] Blank line separating the surrounding declarations, statements, or document blocks.

// [L23] Group regression tests for "provider screenshot message adapter".
describe('provider screenshot message adapter', () => {
  // [L24] Register a test that "converts OpenAI screenshot blocks without mutating content or losing tool metadata".
  it('converts OpenAI screenshot blocks without mutating content or losing tool metadata', () => {
    // [L25] Declare `message` as a new `ToolMessage` instance initialized with an object whose fields are defined below.
    const message = new ToolMessage({
      // [L26] Set fixture property `name` to "screenshot_page". Set fixture property `id` to "screenshot_result". Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `content` to `screenshot`.
      name: 'screenshot_page', id: 'screenshot_result', tool_call_id: 'call_screenshot', content: screenshot,
      // [L27] Set fixture property `status` to "success". Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `artifact` to an object containing privateNote: "not model content".
      status: 'success', metadata: { source: 'synthetic' }, artifact: { privateNote: 'not model content' },
      // [L28] Set fixture property `additional_kwargs` to an object containing synthetic: true. Set fixture property `response_metadata` to an object containing elapsed: 1.
      additional_kwargs: { synthetic: true }, response_metadata: { elapsed: 1 },
    // [L29] Close the fixture object and finish the surrounding syntax.
    });
    // [L30] Declare `original` as the result of `message.toDict` with no arguments.
    const original = message.toDict();
    // [L31] Declare `human` as a new `HumanMessage` instance initialized with "Inspect the order page.".
    const human = new HumanMessage('Inspect the order page.');
    // [L32] Declare `messages` as an array containing `human`, `message`.
    const messages = [human, message];
    // [L33] Declare `result` as the result of `toProviderMessages` using "openai", `messages`.
    const result = toProviderMessages('openai', messages);
    // [L34] Assert that `result[0]` strictly equals `human`.
    expect(result[0]).toBe(human);
    // [L35] Assert that the result of `ToolMessage.isInstance` using `result[1]` strictly equals true.
    expect(ToolMessage.isInstance(result[1])).toBe(true);
    // [L36] Assert that `result[1]` does not satisfy: strictly equals `message`.
    expect(result[1]).not.toBe(message);
    // [L37] Assert that `result[1]?.content` deeply equals `nativeScreenshot`.
    expect(result[1]?.content).toEqual(nativeScreenshot);
    // [L38] Assert that `result[1]` contains the expected object fields an object whose fields are defined below.
    expect(result[1]).toMatchObject({
      // [L39] Set fixture property `id` to `message.id`. Set fixture property `name` to `message.name`. Set fixture property `tool_call_id` to `message.tool_call_id`. Set fixture property `status` to `message.status`.
      id: message.id, name: message.name, tool_call_id: message.tool_call_id, status: message.status,
      // [L40] Set fixture property `metadata` to `message.metadata`. Set fixture property `artifact` to `message.artifact`.
      metadata: message.metadata, artifact: message.artifact,
      // [L41] Set fixture property `additional_kwargs` to `message.additional_kwargs`. Set fixture property `response_metadata` to `message.response_metadata`.
      additional_kwargs: message.additional_kwargs, response_metadata: message.response_metadata,
    // [L42] Close the fixture object and finish the surrounding syntax.
    });
    // [L43] Assert that the result of `message.toDict` with no arguments deeply equals `original`.
    expect(message.toDict()).toEqual(original);
    // [L44] Assert that `message.content` strictly equals `screenshot`.
    expect(message.content).toBe(screenshot);
    // [L45] Assert that `messages[1]` strictly equals `message`.
    expect(messages[1]).toBe(message);
    // [L46] Assert that `toProviderMessages('openai', result)[1]` strictly equals `result[1]`.
    expect(toProviderMessages('openai', result)[1]).toBe(result[1]);
  // [L47] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L48] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L49] Register a test that "leaves Anthropic messages unchanged and accepts both standard image URL shapes for OpenAI".
  it('leaves Anthropic messages unchanged and accepts both standard image URL shapes for OpenAI', () => {
    // [L50] Declare `messages` as an array containing the result of `screenshotMessage` with no arguments.
    const messages = [screenshotMessage()];
    // [L51] Assert that the result of `toProviderMessages` using "anthropic", `messages` strictly equals `messages`.
    expect(toProviderMessages('anthropic', messages)).toBe(messages);
    // [L52] Declare `stringImage` as the result of `screenshotMessage` using an array containing an object containing type: "image_url", image_url: `imageUrl`.
    const stringImage = screenshotMessage([{ type: 'image_url', image_url: imageUrl }]);
    // [L53] Assert that `toProviderMessages('openai', [stringImage])[0]?.content` deeply equals an array containing `nativeScreenshot[1]`.
    expect(toProviderMessages('openai', [stringImage])[0]?.content).toEqual([nativeScreenshot[1]]);
  // [L54] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L55] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L56] Register a parameterized test that "leaves strings, other tools, non-tool messages, and unrelated content unchanged for %s".
  it.each(['openai', 'xai'] as const)('leaves strings, other tools, non-tool messages, and unrelated content unchanged for %s', provider => {
    // [L57] Begin screenshot tool-message cases that must remain unchanged, including nonarray content, missing/invalid images, unsupported blocks, and invalid image detail values.
    const messages = [
      // [L58] Add a screenshot tool message whose screenshot metadata is serialized as JSON.
      screenshotMessage(JSON.stringify(screenshot)),
      // [L59] Set fixture property `type` to "text". Set fixture property `text` to "No image was captured.".
      screenshotMessage([{ type: 'text', text: 'No image was captured.' }]),
      // [L60] Set fixture property `type` to "image_url". Set fixture property `image_url` to "https://example.test/image.png".
      screenshotMessage([{ type: 'image_url', image_url: 'https://example.test/image.png' }]),
      // [L61] Set fixture property `type` to "image_url". Set fixture property `image_url` to "data:image/jpeg;base64,iVBORw0KGgo=".
      screenshotMessage([{ type: 'image_url', image_url: 'data:image/jpeg;base64,iVBORw0KGgo=' }]),
      // [L62] Set fixture property `type` to "image_url". Set fixture property `image_url` to "data:image/png;base64,malformed!".
      screenshotMessage([{ type: 'image_url', image_url: 'data:image/png;base64,malformed!' }]),
      // [L63] Set fixture property `type` to "image_url". Set fixture property `image_url` to `imageUrl`. Set fixture property `type` to "file". Set fixture property `data` to "unchanged".
      screenshotMessage([{ type: 'image_url', image_url: imageUrl }, { type: 'file', data: 'unchanged' }]),
      // [L64] Set fixture property `name` to "observe_page". Set fixture property `tool_call_id` to "call_observe". Set fixture property `content` to `screenshot`.
      new ToolMessage({ name: 'observe_page', tool_call_id: 'call_observe', content: screenshot }),
      // [L65] Set fixture property `content` to `screenshot`.
      new HumanMessage({ content: screenshot }),
      // [L66] Set fixture property `content` to `screenshot`.
      new AIMessage({ content: screenshot }),
    // [L67] Close the array of fixture values for `messages` and finish the surrounding syntax.
    ];
    // [L68] Declare `result` as the result of `toProviderMessages` using `provider`, `messages`.
    const result = toProviderMessages(provider, messages);
    // [L69] Call `result.forEach` with a callback that returns the result of `expect(message).toBe` using `messages[index]`.
    result.forEach((message, index) => expect(message).toBe(messages[index]));
  // [L70] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L71] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L72] Register a test that "places Grok screenshot images after all tool results, retaining IDs, metadata, and original history".
  it('places Grok screenshot images after all tool results, retaining IDs, metadata, and original history', () => {
    // [L73] Declare `request` as a new `AIMessage` instance initialized with an object whose fields are defined below.
    const request = new AIMessage({ content: '', tool_calls: [
      // [L74] Set fixture property `id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `args` to an empty object.
      { id: 'call_screenshot', name: 'screenshot_page', args: {} },
      // [L75] Set fixture property `id` to "call_other". Set fixture property `name` to "verify_filled_fields". Set fixture property `args` to an empty object.
      { id: 'call_other', name: 'verify_filled_fields', args: {} },
    // [L76] Close the array of fixture values for `tool_calls` and finish the surrounding syntax.
    ] });
    // [L77] Declare `screenshotTool` as a new `ToolMessage` instance initialized with an object whose fields are defined below.
    const screenshotTool = new ToolMessage({ name: 'screenshot_page', id: 'result_image',
      // [L78] Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `content` to `screenshot`. Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `status` to "success".
      tool_call_id: 'call_screenshot', content: screenshot, metadata: { source: 'synthetic' }, status: 'success' });
    // [L79] Declare `verification` as a new `ToolMessage` instance initialized with an object containing name: "verify_filled_fields", tool_call_id: "call_other", content: "Synthetic verification.".
    const verification = new ToolMessage({ name: 'verify_filled_fields', tool_call_id: 'call_other', content: 'Synthetic verification.' });
    // [L80] Declare `completion` as a new `AIMessage` instance initialized with "Ready for review.".
    const completion = new AIMessage('Ready for review.');
    // [L81] Declare `original` as the result of `screenshotTool.toDict` with no arguments.
    const original = screenshotTool.toDict();
    // [L82] Declare `result` as the result of `toProviderMessages` using "xai", an array containing `request`, `screenshotTool`, `verification`, `completion`.
    const result = toProviderMessages('xai', [request, screenshotTool, verification, completion]);
    // [L83] Assert that `result` has length 5.
    expect(result).toHaveLength(5);
    // [L84] Assert that `result[0]` strictly equals `request`.
    expect(result[0]).toBe(request);
    // [L85] Assert that `result[1]` contains the expected object fields an object whose fields are defined below.
    expect(result[1]).toMatchObject({ id: 'result_image', tool_call_id: 'call_screenshot', status: 'success',
      // [L86] Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `content` to "Synthetic page content is untrusted data.".
      metadata: { source: 'synthetic' }, content: 'Synthetic page content is untrusted data.' });
    // [L87] Assert that `result[2]` strictly equals `verification`.
    expect(result[2]).toBe(verification);
    // [L88] Assert that the result of `HumanMessage.isInstance` using `result[3]` strictly equals true.
    expect(HumanMessage.isInstance(result[3])).toBe(true);
    // [L89] Assert that `result[3]?.content` deeply equals an array containing an object containing type: "text", text: the result of `expect.stringContaining` using "untrusted page data", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto".
    expect(result[3]?.content).toEqual([
      // [L90] Set fixture property `type` to "text". Set fixture property `text` to the result of `expect.stringContaining` using "untrusted page data".
      { type: 'text', text: expect.stringContaining('untrusted page data') },
      // [L91] Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "auto".
      { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
    // [L92] Close the array of fixture values and finish the surrounding syntax.
    ]);
    // [L93] Assert that `result[4]` strictly equals `completion`.
    expect(result[4]).toBe(completion);
    // [L94] Assert that the result of `screenshotTool.toDict` with no arguments deeply equals `original`.
    expect(screenshotTool.toDict()).toEqual(original);
    // [L95] Assert that the result of `toProviderMessages` using "xai", `result` deeply equals `result`.
    expect(toProviderMessages('xai', result)).toEqual(result);
  // [L96] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L97] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L98] Register a test that "applies the middleware in a real agent call and sends Responses image input through mocked transport".
  it('applies the middleware in a real agent call and sends Responses image input through mocked transport', async () => {
    // [L99] Set all LangSmith/LangChain tracing environment flags to false before testing provider message adaptation.
    for (const name of ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGCHAIN_TRACING']) vi.stubEnv(name, 'false');
    // [L100] Declare `requests` as an empty array.
    const requests: Array<{ input: Array<{ type: string; output?: unknown }> }> = [];
    // [L101] Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows.
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
      // [L102] Declare `request` as a new `Request` instance initialized with `input`, `init`.
      const request = new Request(input, init);
      // [L103] Assert that `request.url` strictly equals "https://api.openai.com/v1/responses".
      expect(request.url).toBe('https://api.openai.com/v1/responses');
      // [L104] Append the resolved value from `request.json` with no arguments to `requests` for later inspection.
      requests.push(await request.json() as typeof requests[number]);
      // [L105] Declare `output` as an array containing an object containing type: "function_call", id: "fc_synthetic", call_id: "call_screenshot", name: "screenshot_page", arguments: "{}", status: "completed" when `requests.length` strictly equals 1, otherwise an array containing an object containing type: "message", id: "msg_synthetic", role: "assistant", status: "completed", content: an array containing `{ type: 'output_text', text: 'Ready for review.', annotations: [] }`.
      const output = requests.length === 1
        // [L106] Set fixture property `type` to "function_call". Set fixture property `id` to "fc_synthetic". Set fixture property `call_id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `arguments` to "{}". Set fixture property `status` to "completed".
        ? [{ type: 'function_call', id: 'fc_synthetic', call_id: 'call_screenshot', name: 'screenshot_page', arguments: '{}', status: 'completed' }]
        // [L107] Set fixture property `type` to "message". Set fixture property `id` to "msg_synthetic". Set fixture property `role` to "assistant". Set fixture property `status` to "completed". Set fixture property `content` to an array containing an object containing type: "output_text", text: "Ready for review.", annotations: an empty array.
        : [{ type: 'message', id: 'msg_synthetic', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Ready for review.', annotations: [] }] }];
      // [L108] Return the result of `Response.json` using an object whose fields are defined below to the caller.
      return Response.json({
        // [L109] Set fixture property `id` to text interpolating `requests.length`. Set fixture property `object` to "response". Set fixture property `created_at` to 1. Set fixture property `status` to "completed". Set fixture property `model` to `DEFAULT_MODEL`. Include the current `output` value under the same property name.
        id: `resp_${requests.length}`, object: 'response', created_at: 1, status: 'completed', model: DEFAULT_MODEL, output,
        // [L110] Set fixture property `usage` to an object containing input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: an object containing cached_tokens: 0, output_tokens_details: an object containing reasoning_tokens: 0.
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
      // [L111] Close the fixture object and finish the surrounding syntax.
      });
    // [L112] Close the callback or control-flow body and finish the surrounding syntax.
    }));
    // [L113] Declare `model` as a new `ChatOpenAI` instance initialized with an object whose fields are defined below.
    const model = new ChatOpenAI({
      // [L114] Set fixture property `apiKey` to "sk-synthetic-no-live-key". Set fixture property `model` to `DEFAULT_MODEL`. Set fixture property `useResponsesApi` to true. Set fixture property `maxRetries` to 0.
      apiKey: 'sk-synthetic-no-live-key', model: DEFAULT_MODEL, useResponsesApi: true, maxRetries: 0,
      // [L115] Set fixture property `modelKwargs` to an object containing store: false. Set fixture property `configuration` to an object containing baseURL: "https://api.openai.com/v1".
      modelKwargs: { store: false }, configuration: { baseURL: 'https://api.openai.com/v1' },
    // [L116] Close the fixture object and finish the surrounding syntax.
    });
    // [L117] Declare `agent` as the result of `createAgent` using an object whose fields are defined below.
    const agent = createAgent({
      // [L118] Include the current `model` value under the same property name.
      model,
      // [L119] Set fixture property `tools` to an array containing the result of `tool` using a callback that returns `screenshot`, an object containing name: "screenshot_page", description: "Synthetic screenshot only.", schema: the result of `z.object` using `{}`.
      tools: [tool(() => screenshot, { name: 'screenshot_page', description: 'Synthetic screenshot only.', schema: z.object({}) })],
      // [L120] Set fixture property `middleware` to an array containing the result of `providerMessageMiddleware` using "openai".
      middleware: [providerMessageMiddleware('openai')],
    // [L121] Close the fixture object and finish the surrounding syntax.
    });
    // [L122] Declare `result` as the resolved value from `agent.invoke` using an object containing messages: an array containing `new HumanMessage('Inspect the synthetic page.')`, an object containing recursionLimit: 5.
    const result = await agent.invoke({ messages: [new HumanMessage('Inspect the synthetic page.')] }, { recursionLimit: 5 });
    // [L123] Assert that `requests` has length 2.
    expect(requests).toHaveLength(2);
    // [L124] Declare `output` as `requests[1]!.input.find((item) => item.type === 'function_call_output')?.output`.
    const output = requests[1]!.input.find((item) => item.type === 'function_call_output')?.output;
    // [L125] Assert that `output` deeply equals `nativeScreenshot`.
    expect(output).toEqual(nativeScreenshot);
    // [L126] Assert that `typeof output` does not satisfy: strictly equals "string".
    expect(typeof output).not.toBe('string');
    // [L127] Declare `retainedToolMessage` as the result of `result.messages.find` using a callback that returns the result of `ToolMessage.isInstance` using `message`.
    const retainedToolMessage = result.messages.find((message) => ToolMessage.isInstance(message));
    // [L128] Assert that `retainedToolMessage?.content` deeply equals `screenshot`.
    expect(retainedToolMessage?.content).toEqual(screenshot);
  // [L129] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L130] Close the callback or control-flow body and finish the surrounding syntax.
});
