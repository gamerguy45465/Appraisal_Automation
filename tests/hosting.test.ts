import { describe, expect, it } from 'vitest';
import { resolveHosting } from '../src/hosting.js';

const publicOrigin = 'https://appraisal-example.azurewebsites.net';
const hosted = { APPRAISAL_HOSTING_MODE: 'hosted', APPRAISAL_PUBLIC_ORIGIN: publicOrigin };
const namedPipe = String.raw`\\.\pipe\12345678-abcd-4321-1234-123456789abc`;

describe('hosting configuration', () => {
  it('preserves local-only defaults and exact loopback origins', () => {
    expect(resolveHosting({})).toEqual({
      mode: 'local', listen: { port: 3000, host: '127.0.0.1' }, secureCookies: false,
      publicOrigin: 'http://127.0.0.1:3000',
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      allowedHosts: ['localhost:3000', '127.0.0.1:3000'],
    });
  });

  it.each(['1024', '8080', '65535'])('uses the numeric PORT %s on loopback in local mode', PORT => {
    const result = resolveHosting({ PORT, APPRAISAL_HOSTING_MODE: 'local' });
    expect(result.listen).toEqual({ port: Number(PORT), host: '127.0.0.1' });
    expect(result.allowedHosts).toContain(`localhost:${PORT}`);
  });

  it.each(['', '0', '80', '1023', '65536', '-3000', '3000.1', '3e3', '0xbb8', ' 3000', '3000 ', '3000\n', 'Infinity', 'server.js', '/tmp/app.sock'])('rejects unsafe or invalid PORT %j in both modes', PORT => {
    expect(() => resolveHosting({ PORT })).toThrow('PORT must');
    expect(() => resolveHosting({ ...hosted, PORT })).toThrow('PORT must');
  });

  it('binds hosted TCP to all interfaces while exposing only the configured HTTPS origin', () => {
    expect(resolveHosting({ ...hosted, PORT: '8080' })).toEqual({
      mode: 'hosted', listen: { port: 8080, host: '0.0.0.0' }, secureCookies: true,
      publicOrigin, allowedOrigins: [publicOrigin], allowedHosts: ['appraisal-example.azurewebsites.net'],
    });
  });

  it('uses an iisnode named pipe unchanged instead of converting it to a number', () => {
    expect(resolveHosting({ ...hosted, PORT: namedPipe }).listen).toEqual({ path: namedPipe });
    expect(() => resolveHosting({ PORT: namedPipe })).toThrow('PORT must');
  });

  it.each([String.raw`\\server\pipe\remote`, namedPipe.slice(0, 9), String.raw`\\.\pipe\name\other`, `${namedPipe}\n`, `${namedPipe}\0`])('rejects nonlocal or malformed pipe %j', PORT => {
    expect(() => resolveHosting({ ...hosted, PORT })).toThrow('PORT must');
  });

  it('recognizes an explicitly configured custom public origin without requiring a mode flag', () => {
    const result = resolveHosting({ APPRAISAL_PUBLIC_ORIGIN: 'https://orders.example.com:8443' });
    expect(result.mode).toBe('hosted');
    expect(result.secureCookies).toBe(true);
    expect(result.allowedHosts).toEqual(['orders.example.com:8443']);
    expect(result.allowedOrigins).toEqual(['https://orders.example.com:8443']);
  });

  it.each(['WEBSITE_HOSTNAME', 'WEBSITE_INSTANCE_ID', 'WEBSITE_SITE_NAME'])('fails closed when Azure %s is detected without an explicit public origin', name => {
    expect(() => resolveHosting({ [name]: 'azure-fixture' })).toThrow('Hosted mode requires APPRAISAL_PUBLIC_ORIGIN');
    expect(() => resolveHosting({ [name]: '', PORT: '8080' })).toThrow('Hosted mode requires APPRAISAL_PUBLIC_ORIGIN');
    expect(() => resolveHosting({ [name]: 'azure-fixture', APPRAISAL_HOSTING_MODE: 'local' })).toThrow('Local hosting cannot');
    expect(resolveHosting({ [name]: 'azure-fixture', APPRAISAL_PUBLIC_ORIGIN: publicOrigin }).mode).toBe('hosted');
  });

  it('does not derive the public origin from an Azure hostname', () => {
    const result = resolveHosting({ WEBSITE_HOSTNAME: 'other.azurewebsites.net', APPRAISAL_PUBLIC_ORIGIN: publicOrigin });
    expect(result.allowedOrigins).toEqual([publicOrigin]);
    expect(result.allowedHosts).not.toContain('other.azurewebsites.net');
  });

  it('rejects hosted mode without an origin and conflicting explicit local mode', () => {
    expect(() => resolveHosting({ APPRAISAL_HOSTING_MODE: 'hosted' })).toThrow('Hosted mode requires APPRAISAL_PUBLIC_ORIGIN');
    expect(() => resolveHosting({ APPRAISAL_HOSTING_MODE: 'local', APPRAISAL_PUBLIC_ORIGIN: publicOrigin })).toThrow('Local hosting cannot');
  });

  it.each(['', 'azure', 'Hosted', ' hosted', 'local\n'])('rejects unrecognized mode %j instead of falling back to local', APPRAISAL_HOSTING_MODE => {
    expect(() => resolveHosting({ APPRAISAL_HOSTING_MODE })).toThrow('APPRAISAL_HOSTING_MODE must');
  });

  it.each([
    '', 'http://orders.example.com', 'https://orders.example.com/', 'https://orders.example.com/path',
    'https://orders.example.com?secret=fixture', 'https://orders.example.com#fragment',
    'https://orders.example.com?', 'https://orders.example.com#',
    'https://user:secret@orders.example.com', 'https://*.example.com',
    'https://orders.example.com,https://other.example.com', 'https://orders.example.com\\anything',
    ' https://orders.example.com', 'https://orders.example.com\n', 'https://Orders.Example.com',
    'https://orders.example.com:443', 'https://orders.example.com.', 'https://orders..example.com',
    'https://-orders.example.com', 'https://orders_.example.com', `https://${'a'.repeat(64)}.example.com`,
    'https://localhost', 'https://app.localhost', 'https://127.0.0.1', 'https://[::1]',
  ])('rejects noncanonical or unsafe public origin %j without echoing its contents', APPRAISAL_PUBLIC_ORIGIN => {
    expect(() => resolveHosting({ APPRAISAL_PUBLIC_ORIGIN })).toThrow('APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin');
    try { resolveHosting({ APPRAISAL_PUBLIC_ORIGIN }); } catch (error) {
      expect((error as Error).message).not.toContain('secret');
    }
  });
});
