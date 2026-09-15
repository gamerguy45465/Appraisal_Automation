/** URLs inspected with Playwright MCP. Authenticated form markup requires a real account. */
export const R3_HOME_URL = 'https://r3amc.com/';
export const R3_LOGIN_URL = 'https://clients.r3amc.com/Login.aspx?ReturnUrl=%2F';
export const R3_ORDER_URL = 'https://clients.r3amc.com/Orders/Create';
export const R3_AUTHENTICATED_URL = 'https://clients.r3amc.com/Orders/Search';
const allowedNavigationPaths = new Set([
    '/', '/login.aspx', '/account/logon', '/orders/create', '/orders',
    '/orders/index', '/orders/search', '/home/index', '/default.aspx',
]);
export function isOrderUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.origin === 'https://clients.r3amc.com'
            && url.pathname.replace(/\/$/, '').toLowerCase() === '/orders/create'
            && !url.username && !url.password && !url.search;
    }
    catch {
        return false;
    }
}
export function isLoginUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.origin === 'https://clients.r3amc.com'
            && ['/login.aspx', '/account/logon'].includes(url.pathname.toLowerCase());
    }
    catch {
        return false;
    }
}
export function isAuthenticatedLandingUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.origin === 'https://clients.r3amc.com' && url.pathname.toLowerCase() === '/orders/search'
            && !url.username && !url.password && !url.search;
    }
    catch {
        return false;
    }
}
function isChallengeRequest(url, method, isMainFrameNavigation) {
    if (isMainFrameNavigation || !url.pathname.startsWith('/recaptcha/'))
        return false;
    if (url.origin === 'https://www.gstatic.com')
        return method === 'GET' || method === 'HEAD';
    return ['https://www.google.com', 'https://www.recaptcha.net', 'https://recaptcha.google.com'].includes(url.origin)
        && ['GET', 'HEAD', 'POST', 'OPTIONS'].includes(method);
}
/** Deny every unverified write endpoint, including autosave, payment and beacon requests. */
export function maySendRequest(input) {
    if (input.phase === 'closed')
        return false;
    if (input.phase === 'review')
        return true;
    let url;
    try {
        url = new URL(input.url);
    }
    catch {
        return false;
    }
    if (url.protocol !== 'https:' || url.username || url.password)
        return false;
    const method = input.method.toUpperCase();
    if (input.phase === 'authenticating') {
        // R3's observed successful login redirects through this read-only account step.
        if (url.origin === 'https://clients.r3amc.com' && url.pathname.replace(/\/$/, '').toLowerCase() === '/account/postlogin') {
            return input.isNavigation && (method === 'GET' || method === 'HEAD') && !url.search;
        }
        if (isChallengeRequest(url, method, input.isMainFrameNavigation ?? input.isNavigation))
            return true;
        if (isOrderUrl(url.href))
            return false;
    }
    if (method !== 'GET' && method !== 'HEAD') {
        return input.phase === 'authenticating' && method === 'POST' && isLoginUrl(url.href);
    }
    if (!input.isNavigation) {
        const path = url.pathname;
        if (url.origin === 'https://clients.r3amc.com') {
            if (/^\/(bundles|Content|Scripts|fonts)\//i.test(path) || /^\/favicon\.(ico|png)$/i.test(path))
                return true;
            const lookup = /^\/Clients\/\d+\/OrderingInfo$/i.test(path)
                || /^\/Clients\/\d+\/Branches\/\d+\/Products\/\d+\/RushInfo\/-?\d+\/-?\d+$/i.test(path)
                || /^\/Clients\/\d+\/Products\/\d+\/Requirements$/i.test(path)
                || /^\/Orders\/States\/[A-Z]{2}\/Counties$/i.test(path)
                || /^\/Orders\/PostalCodes\/\d{5}\/OrderingInfo$/i.test(path);
            return lookup && [...url.searchParams.entries()].every(([key, value]) => key === '_' && /^\d+$/.test(value));
        }
        if (url.origin === 'https://r3amc.com')
            return /^\/(wp-content|wp-includes)\//i.test(path);
        return false;
    }
    if (url.origin === 'https://r3amc.com')
        return url.pathname === '/' && !url.search;
    if (url.origin !== 'https://clients.r3amc.com')
        return false;
    if (!allowedNavigationPaths.has(url.pathname.replace(/\/$/, '').toLowerCase() || '/'))
        return false;
    // Login return URLs are checked to avoid allowing a redirect to a submission endpoint.
    if (isLoginUrl(url.href)) {
        const keys = [...url.searchParams.keys()];
        if (keys.some((key) => key.toLowerCase() !== 'returnurl'))
            return false;
        return [...url.searchParams.values()].every((value) => value === '/' || value.toLowerCase() === '/orders/create');
    }
    return !url.search;
}
export function isOrderConfirmationUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.origin === 'https://clients.r3amc.com'
            && (/^\/orders\/(details|view|confirmation)(\/|$)/i.test(url.pathname)
                || /^\/orders\/\d+\/items\/\d+\/dashboard\/?$/i.test(url.pathname));
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=guard.js.map