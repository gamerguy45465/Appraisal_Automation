import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEnvironmentTools, environmentNames, runEnvironmentOperation } from '../src/environment.js';
import { aiProviders, DEFAULT_MODEL, DEFAULT_MODELS, type OrderInput } from '../src/domain.js';
import { browserEnvironment } from '../src/browser/r3-fields.js';

vi.mock('node:child_process', async (original) => {
  const actual = await original<typeof childProcess>();
  return { ...actual, spawn: vi.fn(actual.spawn) };
});

const input: OrderInput = {
  provider: 'openai', apiKey: 'sk-synthetic-key-do-not-use',
  loanNumber: '685-2012345', fhaCaseNumber: '', paymentMethod: 'Invoice', rushOrder: false, model: DEFAULT_MODEL,
};

describe.skipIf(process.platform !== 'win32')('PowerShell process environment', () => {
  let previous: Map<string, string | undefined>;
  beforeEach(() => { previous = new Map(Object.values(environmentNames).map(name => [name, process.env[name]])); });
  afterEach(() => {
    vi.mocked(childProcess.spawn).mockReset();
    vi.unstubAllEnvs();
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('round-trips Unicode and shell metacharacters as literal values without running them', async () => {
    const literal = 'Synthetique é漢字 🔑 "quoted" \'single\' $([Environment]::Exit(13)); & | `tick`\nline two';
    expect(await runEnvironmentOperation('set', 'api_key', literal)).toBe(literal);
    expect(await runEnvironmentOperation('get', 'api_key')).toBe(literal);
    expect(process.env.APPRAISAL_AI_API_KEY).toBe(literal);
  });

  it.each(aiProviders)('keeps %s credentials private in the generic environment and clears them at handoff', async (provider) => {
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-unrelated-openai-key');
    vi.stubEnv('ANTHROPIC_API_KEY', 'synthetic-unrelated-anthropic-key');
    vi.stubEnv('GOOGLE_API_KEY', 'synthetic-unrelated-google-key');
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-unrelated-gemini-key');
    vi.stubEnv('XAI_API_KEY', 'synthetic-unrelated-xai-key');
    vi.stubEnv('GROK_API_KEY', 'synthetic-unrelated-grok-key');
    const providerInput = { ...input, provider, model: DEFAULT_MODELS[provider], apiKey: `synthetic-${provider}-key-not-real` };
    const environment = createEnvironmentTools(providerInput);
    try {
      await environment.initialize();
      expect(environmentNames.api_key).toBe('APPRAISAL_AI_API_KEY');
      expect(process.env.APPRAISAL_AI_API_KEY).toBe(providerInput.apiKey);
      expect(await environment.retrieve('api_key')).toBe(providerInput.apiKey);
      expect(process.env.OPENAI_API_KEY).toBe('synthetic-unrelated-openai-key');
      expect(process.env.ANTHROPIC_API_KEY).toBe('synthetic-unrelated-anthropic-key');
      expect(process.env.GOOGLE_API_KEY).toBe('synthetic-unrelated-google-key');
      expect(process.env.GEMINI_API_KEY).toBe('synthetic-unrelated-gemini-key');
      expect(process.env.XAI_API_KEY).toBe('synthetic-unrelated-xai-key');
      expect(process.env.GROK_API_KEY).toBe('synthetic-unrelated-grok-key');
      const getApiKey = environment.tools.find(candidate => candidate.name === 'get_api_key')!;
      const secretResult = await getApiKey.invoke({});
      expect(secretResult).toEqual({ configured: true, usage: 'Consumed privately by the backend; never exposed to the model.' });
      expect(JSON.stringify(secretResult)).not.toContain(providerInput.apiKey);
      expect(environment.tools.some(candidate => /username|password|credentials/.test(candidate.name))).toBe(false);
      expect(await environment.retrieve('loan_number')).toBe(input.loanNumber);
      environment.clear();
      for (const name of Object.values(environmentNames)) expect(process.env[name]).toBeUndefined();
      await expect(environment.retrieve('api_key')).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
      expect(await runEnvironmentOperation('get', 'api_key')).toBe('');
    } finally { environment.clear(); }
  }, 25000);

  it.each(['store_api_key', 'get_loan_number'] as const)('rejects an in-flight %s when its helper returns after cleanup', async (toolName) => {
    const child = Object.assign(new EventEmitter(), {
      stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(),
    });
    const received = new Promise<void>(resolve => { child.stdin.once('finish', resolve); });
    const spawn = vi.mocked(childProcess.spawn).mockReturnValueOnce(child as unknown as childProcess.ChildProcess);
    const environment = createEnvironmentTools(input);
    const selected = environment.tools.find(candidate => candidate.name === toolName)!;
    const pending = selected.invoke({});
    const rejected = expect(pending).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
    await received;
    environment.clear();
    // The already-started helper still holds its original value after application cleanup.
    child.stdout.write(JSON.stringify({ value: toolName === 'store_api_key' ? input.apiKey : input.loanNumber }));
    child.emit('close', 0);
    await rejected;
    for (const name of Object.values(environmentNames)) expect(process.env[name]).toBeUndefined();
    await expect(selected.invoke({})).rejects.toMatchObject({ code: 'ENVIRONMENT_CLOSED' });
    expect(spawn).toHaveBeenCalledOnce();
  });
});

describe('provider credential and routing isolation from Chromium', () => {
  it('inherits Windows runtime values but excludes provider, ADC, Vertex, endpoint and proxy settings in any case', () => {
    const excluded = [
      'APPRAISAL_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_CREDENTIALS',
      'GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION',
      'GOOGLE_BASE_URL', 'GEMINI_BASE_URL', 'GOOGLE_API_BASE_URL', 'GOOGLE_GENAI_BASE_URL',
      'GOOGLE_GENAI_API_ENDPOINT', 'GOOGLE_VERTEX_AI_ENDPOINT', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY',
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'LANGSMITH_API_KEY', 'NODE_OPTIONS',
      'XAI_API_KEY', 'GROK_API_KEY', 'XAI_BASE_URL', 'XAI_API_BASE', 'XAI_API_BASE_URL', 'GROK_BASE_URL',
      'XAI_API_HOST', 'XAI_API_ENDPOINT', 'XAI_TRACING', 'XAI_TRACE_API_KEY', 'GROK_API_ENDPOINT',
    ];
    const source: NodeJS.ProcessEnv = { Path: 'synthetic-windows-path', TEMP: 'synthetic-temp',
      ...Object.fromEntries(excluded.flatMap(name => [[name, 'synthetic-private-setting'], [name.toLowerCase(), 'synthetic-private-setting']])) };
    expect(browserEnvironment(source)).toEqual({ Path: 'synthetic-windows-path', TEMP: 'synthetic-temp' });
    expect(source.GOOGLE_API_KEY).toBe('synthetic-private-setting');
    expect(source.XAI_API_KEY).toBe('synthetic-private-setting');
  });
});
