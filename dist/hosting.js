const ORIGIN_ERROR = 'APPRAISAL_PUBLIC_ORIGIN must be a canonical HTTPS origin with a DNS hostname, no trailing slash, path, query, fragment, credentials, or wildcard.';
const PORT_ERROR = 'PORT must be an integer from 1024 to 65535, or a local Windows named pipe in hosted mode.';
const PIPE_PATTERN = /^\\\\\.\\pipe\\[A-Za-z0-9_.-]{1,200}$/;
function parsePublicOrigin(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new Error(ORIGIN_ERROR);
    }
    const labels = url.hostname.split('.');
    if (value !== url.origin || url.protocol !== 'https:' || url.username || url.password
        || url.hostname.length > 253 || labels.length < 2
        || !labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
        || labels.every(label => /^\d+$/.test(label)) || url.hostname.endsWith('.localhost')) {
        throw new Error(ORIGIN_ERROR);
    }
    return url;
}
function parsePort(value) {
    if (value === undefined)
        return 3000;
    if (value.trim() !== value || !/^[0-9]{4,5}$/.test(value))
        throw new Error(PORT_ERROR);
    const port = Number(value);
    if (port < 1024 || port > 65535)
        throw new Error(PORT_ERROR);
    return port;
}
/** Resolve only deployment-owned environment values, never request headers. */
export function resolveHosting(env = process.env) {
    const requestedMode = env.APPRAISAL_HOSTING_MODE;
    if (requestedMode !== undefined && requestedMode !== 'local' && requestedMode !== 'hosted') {
        throw new Error('APPRAISAL_HOSTING_MODE must be local or hosted.');
    }
    const azure = ['WEBSITE_HOSTNAME', 'WEBSITE_INSTANCE_ID', 'WEBSITE_SITE_NAME'].some(name => env[name] !== undefined);
    const originValue = env.APPRAISAL_PUBLIC_ORIGIN;
    const hosted = azure || requestedMode === 'hosted' || originValue !== undefined;
    if (requestedMode === 'local' && hosted) {
        throw new Error('Local hosting cannot be selected inside Azure App Service or with APPRAISAL_PUBLIC_ORIGIN configured.');
    }
    if (!hosted) {
        const port = parsePort(env.PORT);
        return {
            mode: 'local', listen: { port, host: '127.0.0.1' }, secureCookies: false,
            publicOrigin: `http://127.0.0.1:${port}`,
            allowedOrigins: [`http://localhost:${port}`, `http://127.0.0.1:${port}`],
            allowedHosts: [`localhost:${port}`, `127.0.0.1:${port}`],
        };
    }
    if (originValue === undefined)
        throw new Error('Hosted mode requires APPRAISAL_PUBLIC_ORIGIN to identify the exact public HTTPS address.');
    const origin = parsePublicOrigin(originValue);
    const listen = env.PORT !== undefined && env.PORT.trim() === env.PORT && PIPE_PATTERN.test(env.PORT)
        ? { path: env.PORT }
        : { port: parsePort(env.PORT), host: '0.0.0.0' };
    return {
        mode: 'hosted', listen, secureCookies: true, publicOrigin: origin.origin,
        allowedOrigins: [origin.origin], allowedHosts: [origin.host],
    };
}
//# sourceMappingURL=hosting.js.map