// [L1] Import * as childProcess from "node:child_process" for these regression tests.
import * as childProcess from 'node:child_process';
// [L2] Import { EventEmitter } from "node:events" for these regression tests.
import { EventEmitter } from 'node:events';
// [L3] Import { PassThrough } from "node:stream" for these regression tests.
import { PassThrough } from 'node:stream';
// [L4] Import { afterEach, beforeEach, describe, expect, it, vi } from "vitest" for these regression tests.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// [L5] Import { createEnvironmentTools, environmentNames, runEnvironmentOperation } from "../src/environment.js" for these regression tests.
import { createEnvironmentTools, environmentNames, runEnvironmentOperation } from '../src/environment.js';
// [L6] Import { aiProviders, DEFAULT_MODEL, DEFAULT_MODELS, type OrderInput } from "../src/domain.js" for these regression tests.
import { aiProviders, DEFAULT_MODEL, DEFAULT_MODELS, type OrderInput } from '../src/domain.js';
// [L7] Import { browserEnvironment } from "../src/browser/r3-fields.js" for these regression tests.
import { browserEnvironment } from '../src/browser/r3-fields.js';
// [L8] Blank line separating the surrounding declarations, statements, or document blocks.

// [L9] Replace imports from "node:child_process" with the synthetic exports supplied by this mock factory.
vi.mock('node:child_process', async (original) => {
  // [L10] Declare `actual` as the resolved value from `original` with no arguments.
  const actual = await original<typeof childProcess>();
  // [L11] Return an object containing values copied from `actual`, spawn: the result of `vi.fn` using `actual.spawn` to the caller.
  return { ...actual, spawn: vi.fn(actual.spawn) };
// [L12] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L13] Blank line separating the surrounding declarations, statements, or document blocks.

// [L14] Declare `input` as an object whose fields are defined below.
const input: OrderInput = {
  // [L15] Set fixture property `provider` to "openai". Set fixture property `apiKey` to "sk-synthetic-key-do-not-use".
  provider: 'openai', apiKey: 'sk-synthetic-key-do-not-use',
  // [L16] Set fixture property `loanNumber` to "685-2012345". Set fixture property `fhaCaseNumber` to "". Set fixture property `paymentMethod` to "Invoice". Set fixture property `rushOrder` to false. Set fixture property `model` to `DEFAULT_MODEL`.
  loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL,
// [L17] Close the fixture object for `input` and finish the surrounding syntax.
};
// [L18] Blank line separating the surrounding declarations, statements, or document blocks.

// [L19] Group regression tests for "PowerShell process environment".
describe.skipIf(process.platform !== 'win32')('PowerShell process environment', () => {
  // [L20] Declare `previous` for assignment later.
  let previous: Map<string, string | undefined>;
  // [L21] Run this setup before every test in the group. Use a callback that performs: Assign a new `Map` instance initialized with the result of `Object.values(environmentNames).map` using a callback that returns an array containing `name`, `process.env[name]` to `previous`..
  beforeEach(() => { previous = new Map(Object.values(environmentNames).map(name => [name, process.env[name]])); });
  // [L22] Run this cleanup after every test in the group.
  afterEach(() => {
    // [L23] Configure mock `vi.mocked(childProcess.spawn)` to clear its implementation and call history.
    vi.mocked(childProcess.spawn).mockReset();
    // [L24] Restore all temporarily replaced environment variables.
    vi.unstubAllEnvs();
    // [L25] Iterate const [name, value] over `previous`.
    for (const [name, value] of previous) {
      // [L26] Run the following branch when `value` strictly equals `undefined`. Delete property `process.env[name]` from the fixture object.
      if (value === undefined) delete process.env[name];
      // [L27] Assign `value` to `process.env[name]`.
      else process.env[name] = value;
    // [L28] Close the callback or control-flow body and finish the surrounding syntax.
    }
  // [L29] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L30] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L31] Register a test that "round-trips Unicode and shell metacharacters as literal values without running them".
  it('round-trips Unicode and shell metacharacters as literal values without running them', async () => {
    // [L32] Declare `literal` as "Synthetique é漢字 🔑 \"quoted\" 'single' $([Environment]::Exit(13)); & | `tick`\nline two".
    const literal = 'Synthetique é漢字 🔑 "quoted" \'single\' $([Environment]::Exit(13)); & | `tick`\nline two';
    // [L33] Assert that the resolved value from `runEnvironmentOperation` using "set", "api_key", `literal` strictly equals `literal`.
    expect(await runEnvironmentOperation('set', 'api_key', literal)).toBe(literal);
    // [L34] Assert that the resolved value from `runEnvironmentOperation` using "get", "api_key" strictly equals `literal`.
    expect(await runEnvironmentOperation('get', 'api_key')).toBe(literal);
    // [L35] Assert that `process.env.APPRAISAL_AI_API_KEY` strictly equals `literal`.
    expect(process.env.APPRAISAL_AI_API_KEY).toBe(literal);
  // [L36] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L37] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L38] Register a parameterized test that "keeps %s credentials private in the generic environment and clears them at handoff".
  it.each(aiProviders)('keeps %s credentials private in the generic environment and clears them at handoff', async (provider) => {
    // [L39] Temporarily set environment variable "OPENAI_API_KEY" to "synthetic-unrelated-openai-key" for this test.
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-unrelated-openai-key');
    // [L40] Temporarily set environment variable "ANTHROPIC_API_KEY" to "synthetic-unrelated-anthropic-key" for this test.
    vi.stubEnv('ANTHROPIC_API_KEY', 'synthetic-unrelated-anthropic-key');
    // [L41] Temporarily set environment variable "GOOGLE_API_KEY" to "synthetic-unrelated-google-key" for this test.
    vi.stubEnv('GOOGLE_API_KEY', 'synthetic-unrelated-google-key');
    // [L42] Temporarily set environment variable "GEMINI_API_KEY" to "synthetic-unrelated-gemini-key" for this test.
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-unrelated-gemini-key');
    // [L43] Temporarily set environment variable "XAI_API_KEY" to "synthetic-unrelated-xai-key" for this test.
    vi.stubEnv('XAI_API_KEY', 'synthetic-unrelated-xai-key');
    // [L44] Temporarily set environment variable "GROK_API_KEY" to "synthetic-unrelated-grok-key" for this test.
    vi.stubEnv('GROK_API_KEY', 'synthetic-unrelated-grok-key');
    // [L45] Declare `providerInput` as an object containing values copied from `input`, provider, model: `DEFAULT_MODELS[provider]`, apiKey: text interpolating `provider`.
    const providerInput = { ...input, provider, model: DEFAULT_MODELS[provider], apiKey: `synthetic-${provider}-key-not-real` };
    // [L46] Declare `environment` as the result of `createEnvironmentTools` using `providerInput`.
    const environment = createEnvironmentTools(providerInput);
    // [L47] Run the following fixture operation inside a try block so its cleanup/error branch can execute.
    try {
      // [L48] Call `environment.initialize` without arguments. Wait for completion before continuing.
      await environment.initialize();
      // [L49] Assert that `environmentNames.api_key` strictly equals "APPRAISAL_AI_API_KEY".
      expect(environmentNames.api_key).toBe('APPRAISAL_AI_API_KEY');
      // [L50] Assert that `process.env.APPRAISAL_AI_API_KEY` strictly equals `providerInput.apiKey`.
      expect(process.env.APPRAISAL_AI_API_KEY).toBe(providerInput.apiKey);
      // [L51] Assert that the resolved value from `environment.retrieve` using "api_key" strictly equals `providerInput.apiKey`.
      expect(await environment.retrieve('api_key')).toBe(providerInput.apiKey);
      // [L52] Assert that `process.env.OPENAI_API_KEY` strictly equals "synthetic-unrelated-openai-key".
      expect(process.env.OPENAI_API_KEY).toBe('synthetic-unrelated-openai-key');
      // [L53] Assert that `process.env.ANTHROPIC_API_KEY` strictly equals "synthetic-unrelated-anthropic-key".
      expect(process.env.ANTHROPIC_API_KEY).toBe('synthetic-unrelated-anthropic-key');
      // [L54] Assert that `process.env.GOOGLE_API_KEY` strictly equals "synthetic-unrelated-google-key".
      expect(process.env.GOOGLE_API_KEY).toBe('synthetic-unrelated-google-key');
      // [L55] Assert that `process.env.GEMINI_API_KEY` strictly equals "synthetic-unrelated-gemini-key".
      expect(process.env.GEMINI_API_KEY).toBe('synthetic-unrelated-gemini-key');
      // [L56] Assert that `process.env.XAI_API_KEY` strictly equals "synthetic-unrelated-xai-key".
      expect(process.env.XAI_API_KEY).toBe('synthetic-unrelated-xai-key');
      // [L57] Assert that `process.env.GROK_API_KEY` strictly equals "synthetic-unrelated-grok-key".
      expect(process.env.GROK_API_KEY).toBe('synthetic-unrelated-grok-key');
      // [L58] Declare `getApiKey` as the result of `environment.tools.find` using a callback that returns `candidate.name` strictly equals `'get_api_key'`.
      const getApiKey = environment.tools.find(candidate => candidate.name === 'get_api_key')!;
      // [L59] Declare `secretResult` as the resolved value from `getApiKey.invoke` using an empty object.
      const secretResult = await getApiKey.invoke({});
      // [L60] Assert that `secretResult` deeply equals an object containing configured: true, usage: "Consumed privately by the backend; never exposed to the model.".
      expect(secretResult).toEqual({ configured: true, usage: 'Consumed privately by the backend; never exposed to the model.' });
      // [L61] Assert that the result of `JSON.stringify` using `secretResult` does not satisfy: contains `providerInput.apiKey`.
      expect(JSON.stringify(secretResult)).not.toContain(providerInput.apiKey);
      // [L62] Assert that the result of `environment.tools.some` using a callback that returns the result of `/username|password|credentials/.test` using `candidate.name` strictly equals false.
      expect(environment.tools.some(candidate => /username|password|credentials/.test(candidate.name))).toBe(false);
      // [L63] Assert that the resolved value from `environment.retrieve` using "loan_number" strictly equals `input.loanNumber`.
      expect(await environment.retrieve('loan_number')).toBe(input.loanNumber);
      // [L64] Call `environment.clear` without arguments.
      environment.clear();
      // [L65] Assert that every approved environment variable has been removed from the worker process after clear().
      for (const name of Object.values(environmentNames)) expect(process.env[name]).toBeUndefined();
      // [L66] Assert that the result of `environment.retrieve` using "api_key" rejects and the rejection contains the expected object fields an object containing code: "ENVIRONMENT_CLOSED". Wait for the asynchronous assertion to settle.
      await expect(environment.retrieve('api_key')).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
      // [L67] Assert that the resolved value from `runEnvironmentOperation` using "get", "api_key" strictly equals "".
      expect(await runEnvironmentOperation('get', 'api_key')).toBe('');
    // [L68] Call `environment.clear` without arguments.
    } finally { environment.clear(); }
  // [L69] Finish the test body and allow 25,000 milliseconds for its PowerShell subprocess checks.
  }, 25000);
// [L70] Blank line separating the surrounding declarations, statements, or document blocks.

  // [L71] Register a parameterized test that "rejects an in-flight %s when its helper returns after cleanup".
  it.each(['store_api_key', 'get_loan_number'] as const)('rejects an in-flight %s when its helper returns after cleanup', async (toolName) => {
    // [L72] Declare `child` as the result of `Object.assign` using a new `EventEmitter` instance, an object whose fields are defined below.
    const child = Object.assign(new EventEmitter(), {
      // [L73] Set fixture property `stdin` to a new `PassThrough` instance. Set fixture property `stdout` to a new `PassThrough` instance. Set fixture property `stderr` to a new `PassThrough` instance.
      stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(),
    // [L74] Close the fixture object and finish the surrounding syntax.
    });
    // [L75] Declare `received` as a new `Promise` instance initialized with a callback that performs: Call `child.stdin.once` with "finish", `resolve`..
    const received = new Promise<void>(resolve => { child.stdin.once('finish', resolve); });
    // [L76] Declare `spawn` as the result of `vi.mocked(childProcess.spawn).mockReturnValueOnce` using `child`.
    const spawn = vi.mocked(childProcess.spawn).mockReturnValueOnce(child as unknown as childProcess.ChildProcess);
    // [L77] Declare `environment` as the result of `createEnvironmentTools` using `input`.
    const environment = createEnvironmentTools(input);
    // [L78] Declare `selected` as the result of `environment.tools.find` using a callback that returns `candidate.name` strictly equals `toolName`.
    const selected = environment.tools.find(candidate => candidate.name === toolName)!;
    // [L79] Declare `pending` as the result of `selected.invoke` using an empty object.
    const pending = selected.invoke({});
    // [L80] Declare `rejected` as the result of `expect(pending).rejects.toMatchObject` using an object containing code: "ENVIRONMENT_CLOSED".
    const rejected = expect(pending).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
    // [L81] Wait for `received` to settle before continuing.
    await received;
    // [L82] Call `environment.clear` without arguments.
    environment.clear();
    // [L83] Existing comment: The already-started helper still holds its original value after application cleanup.
    let drained = false;
    const draining = environment.drain().then(() => { drained = true; });
    await Promise.resolve();
    expect(drained).toBe(false);
    // The already-started helper still holds its original value after application cleanup.
    // [L84] Call `child.stdout.write` with the result of `JSON.stringify` using an object containing value: `input.apiKey` when `toolName` strictly equals `'store_api_key'`, otherwise `input.loanNumber`.
    child.stdout.write(JSON.stringify({ value: toolName === 'store_api_key' ? input.apiKey : input.loanNumber }));
    // [L85] Call `child.emit` with "close", 0.
    child.emit('close', 0);
    // [L86] Wait for `rejected` to settle before continuing.
    await rejected;
    await draining;
    expect(drained).toBe(true);
    // [L87] Assert that every approved environment variable remains absent after the in-flight tool operation races with cleanup.
    for (const name of Object.values(environmentNames)) expect(process.env[name]).toBeUndefined();
    // [L88] Assert that the result of `selected.invoke` using an empty object rejects and the rejection contains the expected object fields an object containing code: "ENVIRONMENT_CLOSED". Wait for the asynchronous assertion to settle.
    await expect(selected.invoke({})).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
    // [L89] Assert that `spawn` was called exactly once.
    expect(spawn).toHaveBeenCalledOnce();
  // [L90] Close the callback or control-flow body and finish the surrounding syntax.
  });
  it.each(['process', 'stdin'] as const)('drains a helper after a %s error and ignores its late successful response', async (errorSource) => {
    const child = Object.assign(new EventEmitter(), {
      stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(), kill: vi.fn(),
    });
    const received = new Promise<void>(resolve => { child.stdin.once('finish', resolve); });
    vi.mocked(childProcess.spawn).mockReturnValueOnce(child as unknown as childProcess.ChildProcess);
    const environment = createEnvironmentTools(input);
    const storing = environment.tools.find(candidate => candidate.name === 'store_api_key')!.invoke({});
    const rejected = expect(storing).rejects.toMatchObject({ code: 'ENVIRONMENT_FAILED' });
    await received;
    if (errorSource === 'process') child.emit('error', new Error('synthetic private helper failure'));
    else child.stdin.emit('error', new Error('synthetic private helper failure'));
    environment.clear();
    let drained = false;
    const draining = environment.drain().then(() => { drained = true; });
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(drained).toBe(false);
    child.stdout.write(JSON.stringify({ value: input.apiKey }));
    child.emit('close', 0);
    await rejected;
    await draining;
    expect(process.env.APPRAISAL_AI_API_KEY).toBeUndefined();
    expect(child.kill).toHaveBeenCalledTimes(errorSource === 'stdin' ? 1 : 0);
    process.env.APPRAISAL_AI_API_KEY = 'synthetic-next-order-key';
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(process.env.APPRAISAL_AI_API_KEY).toBe('synthetic-next-order-key');
  });
// [L91] Close the callback or control-flow body and finish the surrounding syntax.
});
// [L92] Blank line separating the surrounding declarations, statements, or document blocks.

// [L93] Group regression tests for "provider credential and routing isolation from Chromium".
describe('provider credential and routing isolation from Chromium', () => {
  // [L94] Register a test that "inherits Windows runtime values but excludes provider, ADC, Vertex, endpoint and proxy settings in any case".
  it('inherits Windows runtime values but excludes provider, ADC, Vertex, endpoint and proxy settings in any case', () => {
    // [L95] Declare `excluded` as an array containing "APPRAISAL_AI_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY", "GOOGLE_APPLICATION_CREDENTIALS", "GOOGLE_CLOUD_CREDENTIALS", "GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_CLOUD_PROJECT", "GCLOUD_PROJECT", "GOOGLE_CLOUD_LOCATION", "GOOGLE_BASE_URL", "GEMINI_BASE_URL", "GOOGLE_API_BASE_URL", "GOOGLE_GENAI_BASE_URL", "GOOGLE_GENAI_API_ENDPOINT", "GOOGLE_VERTEX_AI_ENDPOINT", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "LANGSMITH_API_KEY", "NODE_OPTIONS", "XAI_API_KEY", "GROK_API_KEY", "XAI_BASE_URL", "XAI_API_BASE", "XAI_API_BASE_URL", "GROK_BASE_URL", "XAI_API_HOST", "XAI_API_ENDPOINT", "XAI_TRACING", "XAI_TRACE_API_KEY", "GROK_API_ENDPOINT".
    const excluded = [
      // [L96] Include 'APPRAISAL_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS' in the names that the isolated process must not inherit.
      'APPRAISAL_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS',
      // [L97] Include 'GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION' in the names that the isolated process must not inherit.
      'GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION',
      // [L98] Include 'GOOGLE_BASE_URL', 'GEMINI_BASE_URL', 'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL' in the names that the isolated process must not inherit.
      'GOOGLE_BASE_URL', 'GEMINI_BASE_URL', 'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL',
      // [L99] Include 'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY' in the names that the isolated process must not inherit.
      'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY',
      // [L100] Include 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'LANGSMITH_API_KEY', 'NODE_OPTIONS' in the names that the isolated process must not inherit.
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'LANGSMITH_API_KEY', 'NODE_OPTIONS',
      // [L101] Include 'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL' in the names that the isolated process must not inherit.
      'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL',
      // [L102] Include 'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT' in the names that the isolated process must not inherit.
      'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT',
    // [L103] Close the array of fixture values for `excluded` and finish the surrounding syntax.
    ];
    // [L104] Declare `source` as an object whose fields are defined below.
    const source: NodeJS.ProcessEnv = { Path: 'synthetic-windows-path', TEMP: 'synthetic-temp',
      // [L105] Copy the entries of the result of `Object.fromEntries` using the result of `excluded.flatMap` using a callback that returns an array containing `[name, 'synthetic-private-setting']`, `[name.toLowerCase(), 'synthetic-private-setting']` into this fixture.
      ...Object.fromEntries(excluded.flatMap(name => [[name, 'synthetic-private-setting'], [name.toLowerCase(), 'synthetic-private-setting']])) };
    // [L106] Assert that the result of `browserEnvironment` using `source` deeply equals an object containing Path: "synthetic-windows-path", TEMP: "synthetic-temp".
    expect(browserEnvironment(source)).toEqual({ Path: 'synthetic-windows-path', TEMP: 'synthetic-temp' });
    // [L107] Assert that `source.GOOGLE_API_KEY` strictly equals "synthetic-private-setting".
    expect(source.GOOGLE_API_KEY).toBe('synthetic-private-setting');
    // [L108] Assert that `source.XAI_API_KEY` strictly equals "synthetic-private-setting".
    expect(source.XAI_API_KEY).toBe('synthetic-private-setting');
  // [L109] Close the callback or control-flow body and finish the surrounding syntax.
  });
// [L110] Close the callback or control-flow body and finish the surrounding syntax.
});
