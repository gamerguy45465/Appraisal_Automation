import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureParent = resolve(tmpdir());
const fixtures: string[] = [];
const privateValue = 'fixture-secret-never-log-this';

function runStartup(serverSource?: string, nodeVersion?: string) {
  const fixture = mkdtempSync(join(fixtureParent, 'appraisal-startup-test-'));
  fixtures.push(fixture);
  copyFileSync(join(projectRoot, 'startup.cjs'), join(fixture, 'startup.cjs'));
  writeFileSync(join(fixture, 'package.json'), '{"type":"module"}');
  if (serverSource !== undefined) {
    mkdirSync(join(fixture, 'dist'));
    writeFileSync(join(fixture, 'dist/server.js'), serverSource);
  }
  // Use an absolute executable path and only basic OS settings, never parent credentials.
  const env: NodeJS.ProcessEnv = {};
  for (const name of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  const preload = nodeVersion === undefined ? ''
    : `Object.defineProperty(process.versions, 'node', { value: ${JSON.stringify(nodeVersion)} });`;
  return spawnSync(process.execPath, ['-e', `${preload}require('./startup.cjs');`], {
    cwd: fixture, env, encoding: 'utf8', timeout: 5000, windowsHide: true,
  });
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    const relativePath = relative(fixtureParent, resolve(fixture));
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)
      || dirname(fixture) !== fixtureParent || !relativePath.startsWith('appraisal-startup-test-')) {
      throw new Error('Refusing to remove a path outside the owned startup test fixtures.');
    }
    rmSync(fixture, { recursive: true, force: true });
  }
});

describe('IIS startup adapter', () => {
  it('imports the compiled ESM server when loaded through CommonJS require', () => {
    const result = runStartup('console.log("synthetic-server-started");');
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('synthetic-server-started');
    expect(result.stderr).toBe('');
  });

  it('rejects an older Node runtime before executing the server', () => {
    const result = runStartup('console.log("must-not-start");', '22.12.0');
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Node.js 24 or newer is required');
  });

  it.each([
    ['APPRAISAL_HOSTING_MODE must be local or hosted.', 'APPRAISAL_HOSTING_MODE must be local or hosted.'],
    ['Local hosting cannot be selected inside Azure App Service or with APPRAISAL_PUBLIC_ORIGIN configured.', 'Set APPRAISAL_HOSTING_MODE to hosted'],
    ['Hosted mode requires APPRAISAL_PUBLIC_ORIGIN to identify the exact public HTTPS address.', 'Set APPRAISAL_PUBLIC_ORIGIN to the exact public HTTPS origin'],
    ['APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin with a DNS hostname, no trailing slash, path, query, fragment, credentials, or wildcard.', 'APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin'],
    ['PORT must be an integer from 1024 to 65535, or a local Windows named pipe in hosted mode.', 'Let iisnode supply PORT in Azure.'],
    ['Hosted mode requires APPRAISAL_ACCESS_KEY with 32 to 256 non-space ASCII characters.', 'Set APPRAISAL_ACCESS_KEY to a random workspace sign-in code'],
    ['APPRAISAL_BROWSER_MODE must be local, companion, or azure.', 'Set APPRAISAL_BROWSER_MODE to local, companion, or azure.'],
    ['Azure and companion browsers require hosted mode; local browsers require local mode.', 'Use APPRAISAL_HOSTING_MODE=hosted'],
  ])('reports safe guidance for %s without exposing the error stack', (message, expected) => {
    const result = runStartup(`const error = new Error(${JSON.stringify(message)}); error.stack = ${JSON.stringify(privateValue)}; throw error;`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected);
    expect(result.stderr).not.toContain(privateValue);
    expect(result.stderr).not.toContain('server.js:');
  });

  it('explains an actually missing compiled entry without logging its absolute path', () => {
    const result = runStartup();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A required application file or dependency is missing.');
    expect(result.stderr).not.toContain(fixtureParent);
    expect(result.stderr).not.toContain('appraisal-startup-test-');
  });

  it.each(['AZURE_BROWSER_CONFIG', 'AZURE_BROWSER_AUTH'])('gives fixed cloud advice for %s without printing endpoint or credential errors', code => {
    const result = runStartup(`throw Object.assign(new Error(${JSON.stringify(privateValue)}), { code: ${JSON.stringify(code)} });`);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/PLAYWRIGHT_SERVICE_URL|managed identity/);
    expect(result.stderr).not.toContain(privateValue);
  });

  it.each([
    ['ERR_MODULE_NOT_FOUND', 'A required application file or dependency is missing.'],
    ['MODULE_NOT_FOUND', 'A required application file or dependency is missing.'],
    ['ERR_DLOPEN_FAILED', 'A native dependency could not load.'],
    ['ERR_PACKAGE_PATH_NOT_EXPORTED', 'A dependency could not load.'],
    ['ERR_UNKNOWN_FILE_EXTENSION', 'An application module could not load.'],
  ])('reports only fixed guidance for %s', (code, expected) => {
    const result = runStartup(`throw Object.assign(new Error(${JSON.stringify(privateValue)}), { code: ${JSON.stringify(code)} });`);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected);
    expect(result.stderr).not.toContain(privateValue);
  });

  it.each([
    `throw Object.assign(new Error(${JSON.stringify(privateValue)}), { code: ${JSON.stringify(privateValue)} });`,
    `throw ${JSON.stringify(privateValue)};`,
    `throw { message: ${JSON.stringify(privateValue)}, code: ${JSON.stringify(privateValue)} };`,
    'throw null;',
    `throw new Error('Hosted mode requires APPRAISAL_ACCESS_KEY with 32 to 256 non-space ASCII characters. ' + ${JSON.stringify(privateValue)});`,
    `const error = new Error(); Object.defineProperty(error, 'message', { get() { throw new Error(${JSON.stringify(privateValue)}); } }); throw error;`,
    `throw new Proxy(new Error(), { getOwnPropertyDescriptor() { throw new Error(${JSON.stringify(privateValue)}); } });`,
  ])('keeps unknown failures private (%#)', source => {
    const result = runStartup(source);
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe('Appraisal Desk could not start. Check the build, Node.js runtime, PORT, APPRAISAL_PUBLIC_ORIGIN and APPRAISAL_ACCESS_KEY settings.');
    expect(result.stderr).not.toContain(privateValue);
    expect(result.stdout).toBe('');
  });
});
