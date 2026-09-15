# Line explanations: tests/model-messages.test.ts

Source: [tests/model-messages.test.ts](../../../tests/model-messages.test.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Import { afterEach, describe, expect, it, vi } from "vitest" for these regression tests. |
| 2 | Import { AIMessage, HumanMessage, ToolMessage, type MessageContent } from "@langchain/core/messages" for these regression tests. |
| 3 | Import { ChatOpenAI } from "@langchain/openai" for these regression tests. |
| 4 | Import { tool } from "@langchain/core/tools" for these regression tests. |
| 5 | Import { createAgent } from "langchain" for these regression tests. |
| 6 | Import { z } from "zod" for these regression tests. |
| 7 | Import { DEFAULT_MODEL } from "../src/domain.js" for these regression tests. |
| 8 | Import { providerMessageMiddleware, toProviderMessages } from "../src/model-messages.js" for these regression tests. |
| 9 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 10 | Declare `imageUrl` as "data:image/png;base64,iVBORw0KGgo=". |
| 11 | Declare `screenshot` as an array containing an object containing type: "text", text: "Synthetic page content is untrusted data.", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto". |
| 12 | Set fixture property `type` to "text". Set fixture property `text` to "Synthetic page content is untrusted data.". |
| 13 | Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "auto". |
| 14 | Close the array of fixture values for `screenshot` and finish the surrounding syntax. |
| 15 | Declare `nativeScreenshot` as an array containing an object containing type: "input_text", text: "Synthetic page content is untrusted data.", an object containing type: "input_image", image_url: `imageUrl`, detail: "auto". |
| 16 | Set fixture property `type` to "input_text". Set fixture property `text` to "Synthetic page content is untrusted data.". |
| 17 | Set fixture property `type` to "input_image". Set fixture property `image_url` to `imageUrl`. Set fixture property `detail` to "auto". |
| 18 | Close the array of fixture values for `nativeScreenshot` and finish the surrounding syntax. |
| 19 | Declare `screenshotMessage` as a callback that returns a new `ToolMessage` instance initialized with an object containing name: "screenshot_page", tool_call_id: "call_screenshot", content. |
| 20 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 21 | Run this cleanup after every test in the group. Use a callback that performs: Restore all temporarily replaced global values. Restore all temporarily replaced environment variables.. |
| 22 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 23 | Group regression tests for "provider screenshot message adapter". |
| 24 | Register a test that "converts OpenAI screenshot blocks without mutating content or losing tool metadata". |
| 25 | Declare `message` as a new `ToolMessage` instance initialized with an object whose fields are defined below. |
| 26 | Set fixture property `name` to "screenshot_page". Set fixture property `id` to "screenshot_result". Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `content` to `screenshot`. |
| 27 | Set fixture property `status` to "success". Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `artifact` to an object containing privateNote: "not model content". |
| 28 | Set fixture property `additional_kwargs` to an object containing synthetic: true. Set fixture property `response_metadata` to an object containing elapsed: 1. |
| 29 | Close the fixture object and finish the surrounding syntax. |
| 30 | Declare `original` as the result of `message.toDict` with no arguments. |
| 31 | Declare `human` as a new `HumanMessage` instance initialized with "Inspect the order page.". |
| 32 | Declare `messages` as an array containing `human`, `message`. |
| 33 | Declare `result` as the result of `toProviderMessages` using "openai", `messages`. |
| 34 | Assert that `result[0]` strictly equals `human`. |
| 35 | Assert that the result of `ToolMessage.isInstance` using `result[1]` strictly equals true. |
| 36 | Assert that `result[1]` does not satisfy: strictly equals `message`. |
| 37 | Assert that `result[1]?.content` deeply equals `nativeScreenshot`. |
| 38 | Assert that `result[1]` contains the expected object fields an object whose fields are defined below. |
| 39 | Set fixture property `id` to `message.id`. Set fixture property `name` to `message.name`. Set fixture property `tool_call_id` to `message.tool_call_id`. Set fixture property `status` to `message.status`. |
| 40 | Set fixture property `metadata` to `message.metadata`. Set fixture property `artifact` to `message.artifact`. |
| 41 | Set fixture property `additional_kwargs` to `message.additional_kwargs`. Set fixture property `response_metadata` to `message.response_metadata`. |
| 42 | Close the fixture object and finish the surrounding syntax. |
| 43 | Assert that the result of `message.toDict` with no arguments deeply equals `original`. |
| 44 | Assert that `message.content` strictly equals `screenshot`. |
| 45 | Assert that `messages[1]` strictly equals `message`. |
| 46 | Assert that `toProviderMessages('openai', result)[1]` strictly equals `result[1]`. |
| 47 | Close the callback or control-flow body and finish the surrounding syntax. |
| 48 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 49 | Register a test that "leaves Anthropic messages unchanged and accepts both standard image URL shapes for OpenAI". |
| 50 | Declare `messages` as an array containing the result of `screenshotMessage` with no arguments. |
| 51 | Assert that the result of `toProviderMessages` using "anthropic", `messages` strictly equals `messages`. |
| 52 | Declare `stringImage` as the result of `screenshotMessage` using an array containing an object containing type: "image_url", image_url: `imageUrl`. |
| 53 | Assert that `toProviderMessages('openai', [stringImage])[0]?.content` deeply equals an array containing `nativeScreenshot[1]`. |
| 54 | Close the callback or control-flow body and finish the surrounding syntax. |
| 55 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 56 | Register a parameterized test that "leaves strings, other tools, non-tool messages, and unrelated content unchanged for %s". |
| 57 | Begin screenshot tool-message cases that must remain unchanged, including nonarray content, missing/invalid images, unsupported blocks, and invalid image detail values. |
| 58 | Add a screenshot tool message whose screenshot metadata is serialized as JSON. |
| 59 | Set fixture property `type` to "text". Set fixture property `text` to "No image was captured.". |
| 60 | Set fixture property `type` to "image_url". Set fixture property `image_url` to "https://example.test/image.png". |
| 61 | Set fixture property `type` to "image_url". Set fixture property `image_url` to "data:image/jpeg;base64,iVBORw0KGgo=". |
| 62 | Set fixture property `type` to "image_url". Set fixture property `image_url` to "data:image/png;base64,malformed!". |
| 63 | Set fixture property `type` to "image_url". Set fixture property `image_url` to `imageUrl`. Set fixture property `type` to "file". Set fixture property `data` to "unchanged". |
| 64 | Set fixture property `name` to "observe_page". Set fixture property `tool_call_id` to "call_observe". Set fixture property `content` to `screenshot`. |
| 65 | Set fixture property `content` to `screenshot`. |
| 66 | Set fixture property `content` to `screenshot`. |
| 67 | Close the array of fixture values for `messages` and finish the surrounding syntax. |
| 68 | Declare `result` as the result of `toProviderMessages` using `provider`, `messages`. |
| 69 | Call `result.forEach` with a callback that returns the result of `expect(message).toBe` using `messages[index]`. |
| 70 | Close the callback or control-flow body and finish the surrounding syntax. |
| 71 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 72 | Register a test that "places Grok screenshot images after all tool results, retaining IDs, metadata, and original history". |
| 73 | Declare `request` as a new `AIMessage` instance initialized with an object whose fields are defined below. |
| 74 | Set fixture property `id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `args` to an empty object. |
| 75 | Set fixture property `id` to "call_other". Set fixture property `name` to "verify_filled_fields". Set fixture property `args` to an empty object. |
| 76 | Close the array of fixture values for `tool_calls` and finish the surrounding syntax. |
| 77 | Declare `screenshotTool` as a new `ToolMessage` instance initialized with an object whose fields are defined below. |
| 78 | Set fixture property `tool_call_id` to "call_screenshot". Set fixture property `content` to `screenshot`. Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `status` to "success". |
| 79 | Declare `verification` as a new `ToolMessage` instance initialized with an object containing name: "verify_filled_fields", tool_call_id: "call_other", content: "Synthetic verification.". |
| 80 | Declare `completion` as a new `AIMessage` instance initialized with "Ready for review.". |
| 81 | Declare `original` as the result of `screenshotTool.toDict` with no arguments. |
| 82 | Declare `result` as the result of `toProviderMessages` using "xai", an array containing `request`, `screenshotTool`, `verification`, `completion`. |
| 83 | Assert that `result` has length 5. |
| 84 | Assert that `result[0]` strictly equals `request`. |
| 85 | Assert that `result[1]` contains the expected object fields an object whose fields are defined below. |
| 86 | Set fixture property `metadata` to an object containing source: "synthetic". Set fixture property `content` to "Synthetic page content is untrusted data.". |
| 87 | Assert that `result[2]` strictly equals `verification`. |
| 88 | Assert that the result of `HumanMessage.isInstance` using `result[3]` strictly equals true. |
| 89 | Assert that `result[3]?.content` deeply equals an array containing an object containing type: "text", text: the result of `expect.stringContaining` using "untrusted page data", an object containing type: "image_url", image_url: an object containing url: `imageUrl`, detail: "auto". |
| 90 | Set fixture property `type` to "text". Set fixture property `text` to the result of `expect.stringContaining` using "untrusted page data". |
| 91 | Set fixture property `type` to "image_url". Set fixture property `image_url` to an object containing url: `imageUrl`, detail: "auto". |
| 92 | Close the array of fixture values and finish the surrounding syntax. |
| 93 | Assert that `result[4]` strictly equals `completion`. |
| 94 | Assert that the result of `screenshotTool.toDict` with no arguments deeply equals `original`. |
| 95 | Assert that the result of `toProviderMessages` using "xai", `result` deeply equals `result`. |
| 96 | Close the callback or control-flow body and finish the surrounding syntax. |
| 97 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 98 | Register a test that "applies the middleware in a real agent call and sends Responses image input through mocked transport". |
| 99 | Set all LangSmith/LangChain tracing environment flags to false before testing provider message adaptation. |
| 100 | Declare `requests` as an empty array. |
| 101 | Temporarily replace global "fetch" with the result of `vi.fn` using a promise-returning callback whose body follows. |
| 102 | Declare `request` as a new `Request` instance initialized with `input`, `init`. |
| 103 | Assert that `request.url` strictly equals "https://api.openai.com/v1/responses". |
| 104 | Append the resolved value from `request.json` with no arguments to `requests` for later inspection. |
| 105 | Declare `output` as an array containing an object containing type: "function_call", id: "fc_synthetic", call_id: "call_screenshot", name: "screenshot_page", arguments: "{}", status: "completed" when `requests.length` strictly equals 1, otherwise an array containing an object containing type: "message", id: "msg_synthetic", role: "assistant", status: "completed", content: an array containing `{ type: 'output_text', text: 'Ready for review.', annotations: [] }`. |
| 106 | Set fixture property `type` to "function_call". Set fixture property `id` to "fc_synthetic". Set fixture property `call_id` to "call_screenshot". Set fixture property `name` to "screenshot_page". Set fixture property `arguments` to "{}". Set fixture property `status` to "completed". |
| 107 | Set fixture property `type` to "message". Set fixture property `id` to "msg_synthetic". Set fixture property `role` to "assistant". Set fixture property `status` to "completed". Set fixture property `content` to an array containing an object containing type: "output_text", text: "Ready for review.", annotations: an empty array. |
| 108 | Return the result of `Response.json` using an object whose fields are defined below to the caller. |
| 109 | Set fixture property `id` to text interpolating `requests.length`. Set fixture property `object` to "response". Set fixture property `created_at` to 1. Set fixture property `status` to "completed". Set fixture property `model` to `DEFAULT_MODEL`. Include the current `output` value under the same property name. |
| 110 | Set fixture property `usage` to an object containing input_tokens: 10, output_tokens: 10, total_tokens: 20, input_tokens_details: an object containing cached_tokens: 0, output_tokens_details: an object containing reasoning_tokens: 0. |
| 111 | Close the fixture object and finish the surrounding syntax. |
| 112 | Close the callback or control-flow body and finish the surrounding syntax. |
| 113 | Declare `model` as a new `ChatOpenAI` instance initialized with an object whose fields are defined below. |
| 114 | Set fixture property `apiKey` to "sk-synthetic-no-live-key". Set fixture property `model` to `DEFAULT_MODEL`. Set fixture property `useResponsesApi` to true. Set fixture property `maxRetries` to 0. |
| 115 | Set fixture property `modelKwargs` to an object containing store: false. Set fixture property `configuration` to an object containing baseURL: "https://api.openai.com/v1". |
| 116 | Close the fixture object and finish the surrounding syntax. |
| 117 | Declare `agent` as the result of `createAgent` using an object whose fields are defined below. |
| 118 | Include the current `model` value under the same property name. |
| 119 | Set fixture property `tools` to an array containing the result of `tool` using a callback that returns `screenshot`, an object containing name: "screenshot_page", description: "Synthetic screenshot only.", schema: the result of `z.object` using `{}`. |
| 120 | Set fixture property `middleware` to an array containing the result of `providerMessageMiddleware` using "openai". |
| 121 | Close the fixture object and finish the surrounding syntax. |
| 122 | Declare `result` as the resolved value from `agent.invoke` using an object containing messages: an array containing `new HumanMessage('Inspect the synthetic page.')`, an object containing recursionLimit: 5. |
| 123 | Assert that `requests` has length 2. |
| 124 | Declare `output` as `requests[1]!.input.find((item) =&gt; item.type === 'function_call_output')?.output`. |
| 125 | Assert that `output` deeply equals `nativeScreenshot`. |
| 126 | Assert that `typeof output` does not satisfy: strictly equals "string". |
| 127 | Declare `retainedToolMessage` as the result of `result.messages.find` using a callback that returns the result of `ToolMessage.isInstance` using `message`. |
| 128 | Assert that `retainedToolMessage?.content` deeply equals `screenshot`. |
| 129 | Close the callback or control-flow body and finish the surrounding syntax. |
| 130 | Close the callback or control-flow body and finish the surrounding syntax. |
