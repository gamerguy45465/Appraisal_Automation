# Line explanations: src/browser/guard.ts

Source: [src/browser/guard.ts](../../../../src/browser/guard.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

Later repair: the separately commented `/Account/PostLogon` branch permits only authentication-phase GET/HEAD navigation to the exact HTTPS portal origin with one case-insensitive `returnUrl` decoded to `/`. It rejects missing, duplicate or unknown query parameters, other destinations and writes. This new code follows the historical PostLogin branch and has no original annotation-snapshot line number.

Later asset repair: exact stylesheet/script/font sets and the non-navigation resource branch permit only the observed current bundles and icon fonts with matching resource types. Version queries allow at most one bounded `v` token, plus a bare hexadecimal fingerprint for fonts only. Inline comments explain each added line; historical directory and redirect rules remain unchanged.

September 14 alert repair: the exact case-normalized `/Artifacts/Grid/License` path permits only a non-navigation GET XHR on the HTTPS client origin, during authentication/preparation, with no query or one lowercase `_` of 1-20 ASCII digits. This read is required by the inspected synchronous grid initializer; blocking it triggered R3's `undefined` alert. No license response/key is inspected, no broader artifact directory is enabled, and redirects/order writes remain guarded. New tests are in `tests/browser-grid.spec.ts` outside the historical line counts.

| Original line | Explanation |
| ---: | --- |
| 1 | Documents that the URL list was inspected and that authenticated form inspection needs an account. |
| 2 | Exports the public R3 homepage address. |
| 3 | Enters through the fixed portal root so R3 selects its current sign-in route; the retired Login.aspx entry returned HTTP 404 in the September 10, 2026 check. |
| 4 | Exports the exact R3 page used to prepare a new order. |
| 5 | Exports the authenticated order-search landing-page address. |
| 6 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 7 | Defines the four browser lifecycle phases used by the request guard. |
| 8 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 9 | Starts the set of normalized portal paths allowed for guarded navigation. |
| 10 | Allows the portal root, both login paths, and the order creation and order-root paths. |
| 11 | Adds known order index/search and home/default landing paths to the navigation allowlist. |
| 12 | Completes construction of the allowed-navigation-path set. |
| 13 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 14 | Defines the exported predicate for identifying the approved order creation URL. |
| 15 | Starts protected URL parsing so malformed input returns false rather than throwing. |
| 16 | Parses the supplied order-page address into its URL components. |
| 17 | Requires the HTTPS R3 client-portal origin for an order-page match. |
| 18 | Removes one trailing slash and compares the case-normalized path with the order creation path. |
| 19 | Also requires the URL to contain no embedded username, password, or query string. |
| 20 | Handles errors thrown while parsing or checking the order URL. |
| 21 | Rejects malformed order URLs. |
| 22 | Ends the order-URL parsing error handler. |
| 23 | Ends the order-URL predicate. |
| 24 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 25 | Defines the exported predicate for known R3 sign-in endpoints. |
| 26 | Starts protected parsing of the potential login URL. |
| 27 | Parses the supplied login address into URL components. |
| 28 | Requires login URLs to belong to the HTTPS R3 client portal. |
| 29 | Accepts either known login pathname after lowercasing it. |
| 30 | Handles malformed login URL input. |
| 31 | Returns false when the login address cannot be parsed. |
| 32 | Ends the login-URL error handler. |
| 33 | Ends the login-URL predicate. |
| 34 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 35 | Defines the predicate for the authenticated order-search landing page. |
| 36 | Starts protected parsing of the landing-page address. |
| 37 | Parses the supplied landing-page URL. |
| 38 | Requires the client-portal origin and exact case-normalized order-search path. |
| 39 | Rejects landing URLs with embedded credentials or any query string. |
| 40 | Converts a URL parsing failure into a false result. |
| 41 | Ends the authenticated landing-page predicate. |
| 42 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 43 | Defines a private allowlist check for CAPTCHA requests, using their URL, method, and main-frame-navigation status. |
| 44 | Rejects main-frame navigation and requests outside the reCAPTCHA path prefix. |
| 45 | Allows only GET and HEAD for reCAPTCHA assets on Google's static-content origin. |
| 46 | Restricts other challenge traffic to the three enumerated reCAPTCHA origins. |
| 47 | Permits only the four listed HTTP methods for those challenge endpoints. |
| 48 | Ends the CAPTCHA request predicate. |
| 49 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 50 | Describes the request guard's intent to block unverified write endpoints. |
| 51 | Starts the exported request-authorization function and its structured input type. |
| 52 | Requires the candidate request URL as a string. |
| 53 | Requires the request's HTTP method. |
| 54 | Records whether the request performs a document navigation. |
| 55 | Optionally identifies navigation of the main browser frame. |
| 56 | Optionally carries the request resource category. |
| 57 | Requires the current browser phase for phase-dependent decisions. |
| 58 | Completes the input type and begins the boolean authorization implementation. |
| 59 | Rejects all requests after the session closes. |
| 60 | Allows requests during human review before applying the automated-phase URL restrictions. |
| 61 | Declares storage for the parsed request URL. |
| 62 | Starts URL parsing with a failure handler. |
| 63 | Parses the candidate request address. |
| 64 | Handles invalid URL syntax. |
| 65 | Denies requests whose URL cannot be parsed. |
| 66 | Ends the URL parsing error handler. |
| 67 | Requires HTTPS and rejects URLs containing embedded credentials outside the review phase. |
| 68 | Normalizes the HTTP method to uppercase for comparisons. |
| 69 | Begins additional rules for the human sign-in phase. |
| 70 | Explains why the observed post-login navigation step is specially allowed. |
| 71 | Identifies the R3 account post-login path after removing a trailing slash and normalizing case. |
| 72 | Allows that post-login step only as a GET/HEAD navigation without a query string. |
| 73 | Ends the special post-login endpoint check. |
| 74 | Allows recognized CAPTCHA requests, falling back to the general navigation flag when main-frame status is absent. |
| 75 | Prevents the order creation page from opening while sign-in is still being confirmed. |
| 76 | Ends authentication-specific preliminary checks. |
| 77 | Handles methods other than read-only GET and HEAD. |
| 78 | Permits such a request only when it is a login POST during authentication. |
| 79 | Ends the non-read-method branch. |
| 80 | Begins restrictions for requests that do not navigate a document. |
| 81 | Stores the resource pathname for allowlist checks. |
| 82 | Starts the client-portal subresource allowlist. |
| 83 | Allows known portal asset directories and ICO/PNG favicon paths. |
| 84 | Begins recognizing read-only client ordering-information lookup paths. |
| 85 | Also recognizes numeric client/branch/product rush-information lookup paths, including signed trailing numeric parameters. |
| 86 | Also recognizes numeric client/product requirements lookup paths. |
| 87 | Also recognizes county lookup paths keyed by a two-letter state abbreviation. |
| 88 | Also recognizes ordering-information lookups for five-digit postal codes. |
| 89 | Allows recognized lookups only when every query parameter is a numeric underscore cache-buster; an empty query is also accepted. |
| 90 | Ends the client-portal subresource branch. |
| 91 | Allows only WordPress content and include assets on the public R3 site. |
| 92 | Rejects all remaining non-navigation requests. |
| 93 | Ends subresource authorization. |
| 94 | Allows public-site navigation only to its root path without a query string. |
| 95 | Rejects navigation to any remaining origin outside the client portal. |
| 96 | Normalizes a trailing slash and path case, then rejects paths outside the known navigation set. |
| 97 | Explains that login return destinations are constrained to prevent submission redirects. |
| 98 | Starts validation of query parameters on a recognized login URL. |
| 99 | Collects all login query-parameter names. |
| 100 | Rejects any login query key other than ReturnUrl, compared without case sensitivity. |
| 101 | Requires every login query-parameter value to match an approved return destination. |
| 102 | Accepts only the portal root or the case-normalized order creation path as a return destination. |
| 103 | Ends login-specific query validation. |
| 104 | Rejects any query string on other otherwise-approved navigation URLs. |
| 105 | Ends the request-authorization function. |
| 106 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 107 | Defines a predicate for recognizing post-submission order pages. |
| 108 | Starts protected parsing of a possible confirmation URL. |
| 109 | Parses the candidate confirmation address. |
| 110 | Requires the R3 client-portal origin. |
| 111 | Accepts order details, view, or confirmation path families without case sensitivity. |
| 112 | Also accepts numeric order/item dashboard paths with an optional trailing slash. |
| 113 | Handles malformed confirmation URLs. |
| 114 | Returns false when the confirmation URL cannot be parsed. |
| 115 | Ends the confirmation parsing error handler. |
| 116 | Ends the order-confirmation predicate. |
