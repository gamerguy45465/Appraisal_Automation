// [L1] Documents that the URL list was inspected and that authenticated form inspection needs an account.
/** URLs inspected with Playwright MCP. Authenticated form markup requires a real account. */
// [L2] Exports the public R3 homepage address.
export const R3_HOME_URL = 'https://r3amc.com/';
// [L3] Enters through the portal root so R3 selects its current login route; the retired Login.aspx path returns 404.
export const R3_LOGIN_URL = 'https://clients.r3amc.com/';
// [L4] Exports the exact R3 page used to prepare a new order.
export const R3_ORDER_URL = 'https://clients.r3amc.com/Orders/Create';
// [L5] Exports the authenticated order-search landing-page address.
export const R3_AUTHENTICATED_URL = 'https://clients.r3amc.com/Orders/Search';
// [L8] Blank line separating the surrounding declarations, statements, or document blocks.
// [L9] Starts the set of normalized portal paths allowed for guarded navigation.
const allowedNavigationPaths = new Set([
    // [L10] Allows the portal root, both login paths, and the order creation and order-root paths.
    '/', '/login.aspx', '/account/logon', '/orders/create', '/orders',
    // [L11] Adds known order index/search and home/default landing paths to the navigation allowlist.
    '/orders/index', '/orders/search', '/home/index', '/default.aspx',
    // [L12] Completes construction of the allowed-navigation-path set.
]);
// Current stylesheet bundles observed as stylesheet requests on R3's public sign-in page.
const portalStylesheets = new Set(['/css/bootstrapbundle.css', '/css/clearvaluebundle.css']);
// Current script bundles observed as script requests on that same portal origin.
const portalScripts = new Set([
    // Include the inspected jQuery, third-party and Bootstrap runtime bundles.
    '/js/jquerybundle.js', '/js/thirdpartybundle.js', '/js/bootstrap.bundle.min.js',
    // Include the inspected Bootstrap additions, grid and portal application bundles.
    '/js/bootstrapextrabundle.js', '/js/aggridbundle.js', '/js/clearvaluebundle.js',
    // Finish the exact script-file allowlist without granting the whole JavaScript directory.
]);
// The loaded Bootstrap stylesheet requests these exact icon-font files.
const portalFonts = new Set(['/css/bootstrap-icons/font/fonts/bootstrap-icons.woff2', '/css/bootstrap-icons/font/fonts/bootstrap-icons.woff']);
// [L13] Blank line separating the surrounding declarations, statements, or document blocks.
// [L14] Defines the exported predicate for identifying the approved order creation URL.
export function isOrderUrl(rawUrl) {
    // [L15] Starts protected URL parsing so malformed input returns false rather than throwing.
    try {
        // [L16] Parses the supplied order-page address into its URL components.
        const url = new URL(rawUrl);
        // [L17] Requires the HTTPS R3 client-portal origin for an order-page match.
        return url.origin === 'https://clients.r3amc.com'
            // [L18] Removes one trailing slash and compares the case-normalized path with the order creation path.
            && url.pathname.replace(/\/$/, '').toLowerCase() === '/orders/create'
            // [L19] Also requires the URL to contain no embedded username, password, or query string.
            && !url.username && !url.password && !url.search;
        // [L20] Handles errors thrown while parsing or checking the order URL.
    }
    catch {
        // [L21] Rejects malformed order URLs.
        return false;
        // [L22] Ends the order-URL parsing error handler.
    }
    // [L23] Ends the order-URL predicate.
}
// [L24] Blank line separating the surrounding declarations, statements, or document blocks.
// [L25] Defines the exported predicate for known R3 sign-in endpoints.
export function isLoginUrl(rawUrl) {
    // [L26] Starts protected parsing of the potential login URL.
    try {
        // [L27] Parses the supplied login address into URL components.
        const url = new URL(rawUrl);
        // [L28] Requires login URLs to belong to the HTTPS R3 client portal.
        return url.origin === 'https://clients.r3amc.com'
            // [L29] Accepts either known login pathname after lowercasing it.
            && ['/login.aspx', '/account/logon'].includes(url.pathname.toLowerCase());
        // [L30] Handles malformed login URL input.
    }
    catch {
        // [L31] Returns false when the login address cannot be parsed.
        return false;
        // [L32] Ends the login-URL error handler.
    }
    // [L33] Ends the login-URL predicate.
}
// [L34] Blank line separating the surrounding declarations, statements, or document blocks.
// [L35] Defines the predicate for the authenticated order-search landing page.
export function isAuthenticatedLandingUrl(rawUrl) {
    // [L36] Starts protected parsing of the landing-page address.
    try {
        // [L37] Parses the supplied landing-page URL.
        const url = new URL(rawUrl);
        // [L38] Requires the client-portal origin and exact case-normalized order-search path.
        return url.origin === 'https://clients.r3amc.com' && url.pathname.toLowerCase() === '/orders/search'
            // [L39] Rejects landing URLs with embedded credentials or any query string.
            && !url.username && !url.password && !url.search;
        // [L40] Converts a URL parsing failure into a false result.
    }
    catch {
        return false;
    }
    // [L41] Ends the authenticated landing-page predicate.
}
// [L42] Blank line separating the surrounding declarations, statements, or document blocks.
// [L43] Defines a private allowlist check for CAPTCHA requests, using their URL, method, and main-frame-navigation status.
function isChallengeRequest(url, method, isMainFrameNavigation) {
    // [L44] Rejects main-frame navigation and requests outside the reCAPTCHA path prefix.
    if (isMainFrameNavigation || !url.pathname.startsWith('/recaptcha/'))
        return false;
    // [L45] Allows only GET and HEAD for reCAPTCHA assets on Google's static-content origin.
    if (url.origin === 'https://www.gstatic.com')
        return method === 'GET' || method === 'HEAD';
    // [L46] Restricts other challenge traffic to the three enumerated reCAPTCHA origins.
    return ['https://www.google.com', 'https://www.recaptcha.net', 'https://recaptcha.google.com'].includes(url.origin)
        // [L47] Permits only the four listed HTTP methods for those challenge endpoints.
        && ['GET', 'HEAD', 'POST', 'OPTIONS'].includes(method);
    // [L48] Ends the CAPTCHA request predicate.
}
// [L49] Blank line separating the surrounding declarations, statements, or document blocks.
// [L50] Describes the request guard's intent to block unverified write endpoints.
/** Deny every unverified write endpoint, including autosave, payment and beacon requests. */
// [L51] Starts the exported request-authorization function and its structured input type.
export function maySendRequest(input) {
    // [L59] Rejects all requests after the session closes.
    if (input.phase === 'closed')
        return false;
    // [L60] Allows requests during human review before applying the automated-phase URL restrictions.
    if (input.phase === 'review')
        return true;
    // [L61] Declares storage for the parsed request URL.
    let url;
    // [L62] Starts URL parsing with a failure handler.
    try {
        // [L63] Parses the candidate request address.
        url = new URL(input.url);
        // [L64] Handles invalid URL syntax.
    }
    catch {
        // [L65] Denies requests whose URL cannot be parsed.
        return false;
        // [L66] Ends the URL parsing error handler.
    }
    // [L67] Requires HTTPS and rejects URLs containing embedded credentials outside the review phase.
    if (url.protocol !== 'https:' || url.username || url.password)
        return false;
    // [L68] Normalizes the HTTP method to uppercase for comparisons.
    const method = input.method.toUpperCase();
    // [L69] Begins additional rules for the human sign-in phase.
    if (input.phase === 'authenticating') {
        // [L70] Explains why the observed post-login navigation step is specially allowed.
        // R3's observed successful login redirects through this read-only account step.
        // [L71] Identifies the R3 account post-login path after removing a trailing slash and normalizing case.
        if (url.origin === 'https://clients.r3amc.com' && url.pathname.replace(/\/$/, '').toLowerCase() === '/account/postlogin') {
            // [L72] Allows that post-login step only as a GET/HEAD navigation without a query string.
            return input.isNavigation && (method === 'GET' || method === 'HEAD') && !url.search;
            // [L73] Ends the special post-login endpoint check.
        }
        // The current login POST redirects through PostLogon with a return destination.
        if (url.origin === 'https://clients.r3amc.com' && url.pathname.replace(/\/$/, '').toLowerCase() === '/account/postlogon') {
            // Parse query entries so duplicate or extra parameters cannot hide another destination.
            const destinations = [...url.searchParams.entries()];
            // Permit only a read-only navigation while authenticating.
            return input.isNavigation && (method === 'GET' || method === 'HEAD')
                // Require exactly one ReturnUrl parameter, compared without case sensitivity.
                && destinations.length === 1 && destinations[0]?.[0].toLowerCase() === 'returnurl'
                // Its decoded value must return to the fixed portal-root entry, never an arbitrary URL.
                && destinations[0]?.[1] === '/';
            // End the current post-login handoff exception.
        }
        // [L74] Allows recognized CAPTCHA requests, falling back to the general navigation flag when main-frame status is absent.
        if (isChallengeRequest(url, method, input.isMainFrameNavigation ?? input.isNavigation))
            return true;
        // [L75] Prevents the order creation page from opening while sign-in is still being confirmed.
        if (isOrderUrl(url.href))
            return false;
        // [L76] Ends authentication-specific preliminary checks.
    }
    // [L77] Handles methods other than read-only GET and HEAD.
    if (method !== 'GET' && method !== 'HEAD') {
        // [L78] Permits such a request only when it is a login POST during authentication.
        return input.phase === 'authenticating' && method === 'POST' && isLoginUrl(url.href);
        // [L79] Ends the non-read-method branch.
    }
    // [L80] Begins restrictions for requests that do not navigate a document.
    if (!input.isNavigation) {
        // [L81] Stores the resource pathname for allowlist checks.
        const path = url.pathname;
        // [L82] Starts the client-portal subresource allowlist.
        if (url.origin === 'https://clients.r3amc.com') {
            // R3 initializes AG Grid with this synchronous read before the landing page finishes loading.
            // Accept only the observed XHR and optional jQuery cache-buster; do not inspect the license response.
            if (path.toLowerCase() === '/artifacts/grid/license') {
                const parameters = [...url.searchParams.entries()];
                return method === 'GET' && input.resourceType === 'xhr' && parameters.length <= 1
                    && parameters.every(([key, value]) => key === '_' && /^[0-9]{1,20}$/.test(value));
            }
            // Require the browser's resource type to match an exact inspected current asset filename.
            const currentAsset = input.resourceType === 'stylesheet' && portalStylesheets.has(path.toLowerCase())
                // Scripts may load only from the separate list of verified script bundles.
                || input.resourceType === 'script' && portalScripts.has(path.toLowerCase());
            // Font permissions apply only to the two files observed after loading the Bootstrap stylesheet.
            const currentFont = input.resourceType === 'font' && portalFonts.has(path.toLowerCase());
            // Apply the current asset exception only after the origin, read method and non-navigation checks above.
            if (currentAsset || currentFont) {
                // Preserve every query entry so duplicate cache-version parameters are rejected.
                const versions = [...url.searchParams.entries()];
                // Collect the optional explicit cache-version token without storing its value anywhere.
                const tokens = versions.filter(([key]) => key === 'v');
                // The observed font URLs also carry a bare hexadecimal cache fingerprint, permitted only for fonts.
                const fingerprints = versions.filter(([key]) => currentFont && /^[a-f0-9]{16,64}$/.test(key));
                // Reject duplicate token/fingerprint entries and every query key outside these two bounded forms.
                return tokens.length <= 1 && fingerprints.length <= 1 && tokens.length + fingerprints.length === versions.length
                    // Validate the optional decoded version token without exposing it in diagnostics or status messages.
                    && tokens.every(([, value]) => /^[A-Za-z0-9_-]{1,128}$/.test(value))
                    // Fingerprints are bare query keys and cannot carry a separate value or destination.
                    && fingerprints.every(([, value]) => value === '');
                // End validation of current portal assets; older inspected paths keep their existing policy.
            }
            // [L83] Allows known portal asset directories and ICO/PNG favicon paths.
            if (/^\/(bundles|Content|Scripts|fonts)\//i.test(path) || /^\/favicon\.(ico|png)$/i.test(path))
                return true;
            // [L84] Begins recognizing read-only client ordering-information lookup paths.
            const lookup = /^\/Clients\/\d+\/OrderingInfo$/i.test(path)
                // [L85] Also recognizes numeric client/branch/product rush-information lookup paths, including signed trailing numeric parameters.
                || /^\/Clients\/\d+\/Branches\/\d+\/Products\/\d+\/RushInfo\/-?\d+\/-?\d+$/i.test(path)
                // [L86] Also recognizes numeric client/product requirements lookup paths.
                || /^\/Clients\/\d+\/Products\/\d+\/Requirements$/i.test(path)
                // [L87] Also recognizes county lookup paths keyed by a two-letter state abbreviation.
                || /^\/Orders\/States\/[A-Z]{2}\/Counties$/i.test(path)
                // [L88] Also recognizes ordering-information lookups for five-digit postal codes.
                || /^\/Orders\/PostalCodes\/\d{5}\/OrderingInfo$/i.test(path);
            // [L89] Allows recognized lookups only when every query parameter is a numeric underscore cache-buster; an empty query is also accepted.
            return lookup && [...url.searchParams.entries()].every(([key, value]) => key === '_' && /^\d+$/.test(value));
            // [L90] Ends the client-portal subresource branch.
        }
        // [L91] Allows only WordPress content and include assets on the public R3 site.
        if (url.origin === 'https://r3amc.com')
            return /^\/(wp-content|wp-includes)\//i.test(path);
        // [L92] Rejects all remaining non-navigation requests.
        return false;
        // [L93] Ends subresource authorization.
    }
    // [L94] Allows public-site navigation only to its root path without a query string.
    if (url.origin === 'https://r3amc.com')
        return url.pathname === '/' && !url.search;
    // [L95] Rejects navigation to any remaining origin outside the client portal.
    if (url.origin !== 'https://clients.r3amc.com')
        return false;
    // [L96] Normalizes a trailing slash and path case, then rejects paths outside the known navigation set.
    if (!allowedNavigationPaths.has(url.pathname.replace(/\/$/, '').toLowerCase() || '/'))
        return false;
    // [L97] Explains that login return destinations are constrained to prevent submission redirects.
    // Login return URLs are checked to avoid allowing a redirect to a submission endpoint.
    // [L98] Starts validation of query parameters on a recognized login URL.
    if (isLoginUrl(url.href)) {
        // [L99] Collects all login query-parameter names.
        const keys = [...url.searchParams.keys()];
        // [L100] Rejects any login query key other than ReturnUrl, compared without case sensitivity.
        if (keys.some((key) => key.toLowerCase() !== 'returnurl'))
            return false;
        // [L101] Requires every login query-parameter value to match an approved return destination.
        return [...url.searchParams.values()].every((value) => 
        // [L102] Accepts only the portal root or the case-normalized order creation path as a return destination.
        value === '/' || value.toLowerCase() === '/orders/create');
        // [L103] Ends login-specific query validation.
    }
    // [L104] Rejects any query string on other otherwise-approved navigation URLs.
    return !url.search;
    // [L105] Ends the request-authorization function.
}
// [L106] Blank line separating the surrounding declarations, statements, or document blocks.
// [L107] Defines a predicate for recognizing post-submission order pages.
export function isOrderConfirmationUrl(rawUrl) {
    // [L108] Starts protected parsing of a possible confirmation URL.
    try {
        // [L109] Parses the candidate confirmation address.
        const url = new URL(rawUrl);
        // [L110] Requires the R3 client-portal origin.
        return url.origin === 'https://clients.r3amc.com'
            // [L111] Accepts order details, view, or confirmation path families without case sensitivity.
            && (/^\/orders\/(details|view|confirmation)(\/|$)/i.test(url.pathname)
                // [L112] Also accepts numeric order/item dashboard paths with an optional trailing slash.
                || /^\/orders\/\d+\/items\/\d+\/dashboard\/?$/i.test(url.pathname));
        // [L113] Handles malformed confirmation URLs.
    }
    catch {
        // [L114] Returns false when the confirmation URL cannot be parsed.
        return false;
        // [L115] Ends the confirmation parsing error handler.
    }
    // [L116] Ends the order-confirmation predicate.
}
//# sourceMappingURL=guard.js.map