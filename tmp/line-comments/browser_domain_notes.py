from pathlib import Path
import json

ROOT = Path(__file__).parent
def save(path, block):
    notes = {}
    for row in block.strip().splitlines():
        if not row.strip(): continue
        number, note = row.strip().split(' ', 1)
        for part in number.split(','):
            if '-' in part:
                lo, hi = map(int, part.split('-'))
                for n in range(lo, hi+1): notes[str(n)] = note
            else:
                notes[part] = note
    source = (ROOT / 'originals' / path).read_text(encoding='utf-8-sig').splitlines()
    missing = [i for i, line in enumerate(source, 1) if line.strip() and str(i) not in notes]
    if missing: raise ValueError(f'{path}: missing {missing}')
    extra = [key for key in notes if not source[int(key)-1].strip()]
    if extra: raise ValueError(f'{path}: notes on blank lines {extra}')
    target = ROOT / 'notes' / (path + '.json')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(notes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{path}: {len(notes)}/{sum(bool(line.strip()) for line in source)} nonblank lines covered')

save('src/browser/index.ts', '''
1 Exposes the browser-session factory and its public session, configuration, field-plan, verification, and form-element types through the browser module entry point.
2 Re-exports the approved order-page URL and its validation helper for browser-module consumers.
''')

save('src/browser/guard.ts', '''
1 Documents that the URL list was inspected and that authenticated form inspection needs an account.
2 Exports the public R3 homepage address.
3 Exports the R3 sign-in URL with a return destination of the portal root.
4 Exports the exact R3 page used to prepare a new order.
5 Exports the authenticated order-search landing-page address.
7 Defines the four browser lifecycle phases used by the request guard.
9 Starts the set of normalized portal paths allowed for guarded navigation.
10 Allows the portal root, both login paths, and the order creation and order-root paths.
11 Adds known order index/search and home/default landing paths to the navigation allowlist.
12 Completes construction of the allowed-navigation-path set.
14 Defines the exported predicate for identifying the approved order creation URL.
15 Starts protected URL parsing so malformed input returns false rather than throwing.
16 Parses the supplied order-page address into its URL components.
17 Requires the HTTPS R3 client-portal origin for an order-page match.
18 Removes one trailing slash and compares the case-normalized path with the order creation path.
19 Also requires the URL to contain no embedded username, password, or query string.
20 Handles errors thrown while parsing or checking the order URL.
21 Rejects malformed order URLs.
22 Ends the order-URL parsing error handler.
23 Ends the order-URL predicate.
25 Defines the exported predicate for known R3 sign-in endpoints.
26 Starts protected parsing of the potential login URL.
27 Parses the supplied login address into URL components.
28 Requires login URLs to belong to the HTTPS R3 client portal.
29 Accepts either known login pathname after lowercasing it.
30 Handles malformed login URL input.
31 Returns false when the login address cannot be parsed.
32 Ends the login-URL error handler.
33 Ends the login-URL predicate.
35 Defines the predicate for the authenticated order-search landing page.
36 Starts protected parsing of the landing-page address.
37 Parses the supplied landing-page URL.
38 Requires the client-portal origin and exact case-normalized order-search path.
39 Rejects landing URLs with embedded credentials or any query string.
40 Converts a URL parsing failure into a false result.
41 Ends the authenticated landing-page predicate.
43 Defines a private allowlist check for CAPTCHA requests, using their URL, method, and main-frame-navigation status.
44 Rejects main-frame navigation and requests outside the reCAPTCHA path prefix.
45 Allows only GET and HEAD for reCAPTCHA assets on Google's static-content origin.
46 Restricts other challenge traffic to the three enumerated reCAPTCHA origins.
47 Permits only the four listed HTTP methods for those challenge endpoints.
48 Ends the CAPTCHA request predicate.
50 Describes the request guard's intent to block unverified write endpoints.
51 Starts the exported request-authorization function and its structured input type.
52 Requires the candidate request URL as a string.
53 Requires the request's HTTP method.
54 Records whether the request performs a document navigation.
55 Optionally identifies navigation of the main browser frame.
56 Optionally carries the request resource category.
57 Requires the current browser phase for phase-dependent decisions.
58 Completes the input type and begins the boolean authorization implementation.
59 Rejects all requests after the session closes.
60 Allows requests during human review before applying the automated-phase URL restrictions.
61 Declares storage for the parsed request URL.
62 Starts URL parsing with a failure handler.
63 Parses the candidate request address.
64 Handles invalid URL syntax.
65 Denies requests whose URL cannot be parsed.
66 Ends the URL parsing error handler.
67 Requires HTTPS and rejects URLs containing embedded credentials outside the review phase.
68 Normalizes the HTTP method to uppercase for comparisons.
69 Begins additional rules for the human sign-in phase.
70 Explains why the observed post-login navigation step is specially allowed.
71 Identifies the R3 account post-login path after removing a trailing slash and normalizing case.
72 Allows that post-login step only as a GET/HEAD navigation without a query string.
73 Ends the special post-login endpoint check.
74 Allows recognized CAPTCHA requests, falling back to the general navigation flag when main-frame status is absent.
75 Prevents the order creation page from opening while sign-in is still being confirmed.
76 Ends authentication-specific preliminary checks.
77 Handles methods other than read-only GET and HEAD.
78 Permits such a request only when it is a login POST during authentication.
79 Ends the non-read-method branch.
80 Begins restrictions for requests that do not navigate a document.
81 Stores the resource pathname for allowlist checks.
82 Starts the client-portal subresource allowlist.
83 Allows known portal asset directories and ICO/PNG favicon paths.
84 Begins recognizing read-only client ordering-information lookup paths.
85 Also recognizes numeric client/branch/product rush-information lookup paths, including signed trailing numeric parameters.
86 Also recognizes numeric client/product requirements lookup paths.
87 Also recognizes county lookup paths keyed by a two-letter state abbreviation.
88 Also recognizes ordering-information lookups for five-digit postal codes.
89 Allows recognized lookups only when every query parameter is a numeric underscore cache-buster; an empty query is also accepted.
90 Ends the client-portal subresource branch.
91 Allows only WordPress content and include assets on the public R3 site.
92 Rejects all remaining non-navigation requests.
93 Ends subresource authorization.
94 Allows public-site navigation only to its root path without a query string.
95 Rejects navigation to any remaining origin outside the client portal.
96 Normalizes a trailing slash and path case, then rejects paths outside the known navigation set.
97 Explains that login return destinations are constrained to prevent submission redirects.
98 Starts validation of query parameters on a recognized login URL.
99 Collects all login query-parameter names.
100 Rejects any login query key other than ReturnUrl, compared without case sensitivity.
101 Requires every login query-parameter value to match an approved return destination.
102 Accepts only the portal root or the case-normalized order creation path as a return destination.
103 Ends login-specific query validation.
104 Rejects any query string on other otherwise-approved navigation URLs.
105 Ends the request-authorization function.
107 Defines a predicate for recognizing post-submission order pages.
108 Starts protected parsing of a possible confirmation URL.
109 Parses the candidate confirmation address.
110 Requires the R3 client-portal origin.
111 Accepts order details, view, or confirmation path families without case sensitivity.
112 Also accepts numeric order/item dashboard paths with an optional trailing slash.
113 Handles malformed confirmation URLs.
114 Returns false when the confirmation URL cannot be parsed.
115 Ends the confirmation parsing error handler.
116 Ends the order-confirmation predicate.
''')

save('src/browser/r3-fields.ts', '''
1 Begins documentation identifying the authenticated R3 page and observation date for known field IDs.
2 Explains that previously inspected fields use exact IDs while agent/officer fields use a different resolver.
3 Points to the constrained section-and-label matching logic for screenshot-supported contact roles.
4 Ends the field-observation documentation block.
5 Starts the mapping from application plan keys to observed R3 field-ID suffixes.
6 Maps branch, product, property type, and occupancy plan entries to their dropdown ID suffixes.
7 Maps the street address and unit plan entries to the two subject-property address fields.
8 Maps postal code, city, and state entries to the corresponding subject-property fields.
9 Maps parcel number, county, primary loan number, and secondary loan number to their inspected fields.
10 Maps loan purpose/type, FHA case number, and lien position to the corresponding R3 suffixes.
11 Maps monetary and agency case-file identifiers to their inspected R3 fields.
12 Maps prior valuation amount/date and the borrower-as-access-contact checkbox.
13 Maps lockbox code, vendor access notes, and the preferred inspection start field.
14 Maps preferred inspection end and alternate inspection start/end fields.
15 Maps rush, complex-property, prominent-customer, and side-by-side order flags to checkboxes.
16 Maps management notes and the billing-method dropdown.
17 Ends the simple-field suffix mapping.
18 Maps borrower, co-borrower, access-contact, and status-contact roles to their observed ID prefixes.
19 Starts the shared mapping of contact attributes to field suffixes.
20 Maps contact names, three phone categories, and email to their corresponding R3 suffixes.
21 Ends the contact-attribute suffix mapping.
23 Documents that the contact section captions and labels were obtained from the user's screenshots.
24 Explains why these roles require fresh, unique observations instead of unobserved DOM IDs.
25 Starts the permitted section-title mapping for screenshot-supported roles.
26 Stores the exact listing-agent and buyer-agent section captions.
27 Stores the exact loan-officer section caption.
28 Ends the contact-section mapping.
29 Limits writable loan-officer attributes to first name, last name, work phone, and email.
30 Starts the mapping from contact attribute names to observed field captions.
31 Provides exact first-name, last-name, and work-phone captions.
32 Provides exact home-phone, mobile-phone, and email captions.
33 Ends the contact-caption mapping.
34 Normalizes caption whitespace, curly apostrophes, and case for exact normalized comparisons.
35 Begins building the set of field IDs already assigned by the exact-ID mappings.
36 Adds every simple field with the common OrderItemEdit ID prefix.
37 Adds every combination of known contact role prefix and contact attribute suffix.
38 Completes the known-field-ID set.
40 Documents that callers must reject ambiguous matches rather than write repeated sections.
41 Explains that inspected fields retain ID-based matching and only designated contact sections use captions.
42 Documents that caption-based resolution must not reuse known borrower or access-contact fields.
43 Ends the resolver contract documentation.
44 Defines the exported field-match predicate and the observed field metadata it accepts.
45 Looks up any known exact DOM ID for the requested application key.
46 Immediately resolves known keys by equality with their inspected ID.
47 Splits an unrecognized key into role, attribute, and any invalid extra path segments.
48 Begins rejecting extra segments and roles or attributes outside the screenshot-supported mappings.
49 Also rejects unsupported loan-officer attributes, returning false for any invalid key shape.
50 Begins excluding malformed IDs, IDs already reserved by exact mappings, and explicitly hidden fields.
51 Also requires a supported input tag/type, rejecting any candidate that violates these conditions.
52 Extracts the nearest section title from the observed section hierarchy.
53 Requires the normalized nearest section to equal the approved caption for this contact role.
54 Also requires the normalized field label to equal the approved caption for this contact attribute.
55 Ends the field-matching predicate.
57 Documents that baseline product labels were observed and still require document-specific suitability checks.
58 Starts the exported immutable baseline appraisal-product table.
59 Defines the observed conventional, FHA, and USDA single-family product labels.
60 Defines the observed conventional, FHA, and USDA condominium product labels.
61 Defines the observed conventional, FHA, and USDA manufactured-home product labels.
62 Defines the observed conventional, FHA, and USDA two-to-four-family product labels.
63 Ends the product table and preserves its literal types with a const assertion.
65 Documents the intentionally narrow FHA product-label alias rule.
66 Defines the helper that returns approved alternate labels for a requested product.
67 Reads each property category's baseline products.
68 Builds each FHA label's unique original and optional-hyphen-free variants.
69 Normalizes the requested label for comparison.
70 Finds the FHA variant group containing the normalized request.
71 Returns only different variants in that group, or an empty list when none matches.
72 Ends the product-label alias helper.
74 Defines the resolver from application field keys to inspected R3 DOM IDs.
75 Returns a prefixed exact ID for keys present in the simple-field mapping.
76 Splits other keys into contact role, attribute, and extra segments.
77 Requires exactly two segments and a known contact role/attribute combination.
78 Constructs the contact DOM ID from the shared prefix, role prefix, and attribute suffix.
79 Ends known-contact ID construction.
80 Returns undefined for keys without an inspected exact-ID mapping.
81 Ends the exact field-ID resolver.
83 Documents that masked-phone recovery is limited to established phone keys.
84 Defines the helper that extracts recoverable US phone digits from an approved field value.
85 Rejects keys outside the specified contact phone attributes and loan-officer work phone.
86 Documents that ordinary formatting and an optional US country code may be removed.
87 Explains that unsupported extensions or international forms remain on the original fill/review path.
88 Removes allowed punctuation/whitespace and returns ten digits only when the whole value matches an optional US country code plus ten digits.
89 Ends the phone-digit recovery helper.
91 Defines the comparison between a page's text value and its approved plan value.
92 Accepts exactly identical strings immediately.
93 Rejects a mismatch when either value is empty.
94 Begins special comparison for the three supported monetary fields.
95 Defines a parser accepting digits/commas and an optional one- or two-digit decimal part, removing commas before numeric conversion and rejecting other formats with NaN.
96 Accepts monetary values only if the page value is finite and both parsed numbers are equal.
97 Ends monetary-value comparison.
98 Begins tolerant formatting comparison for phone-suffixed keys.
99 Defines digit-only normalization and removes a leading US country code only from an eleven-digit value.
100 Requires at least ten normalized actual digits and exact equality with the expected normalized digits.
101 Ends phone-value comparison.
102 Rejects all remaining non-identical text values.
103 Ends approved-text comparison.
105 Defines the environment-variable filter used when launching Chromium.
106 Starts the case-insensitive allowlist of executable paths, Windows roots, shell, temporary directories, and user profile variables.
107 Adds home paths, application-data locations, program installation directories, and shared program data.
108 Completes the allowlist with processor architecture and processor-count variables.
109 Keeps only defined environment entries whose uppercased keys are allowed and returns them as a string-valued object.
110 Ends the browser environment filter.
''')

save('src/domain.ts', '''
1 Imports Zod for runtime validation and inferred TypeScript types.
2 Imports the application's coded error class for input and business-rule failures.
3 Imports observed R3 appraisal-product labels and their constrained alternate-label resolver.
5 Exports the default OpenAI model identifier.
6 Defines the immutable list of supported AI provider identifiers.
7 Derives the provider union type from the supported provider list.
8 Exports OpenAI as the default provider.
9 Maps each supported provider to its configured default model identifier.
10 Defines the per-PDF upload size limit as fifteen mebibytes.
11 Defines the three supported payment-method labels as literal values.
12 Begins runtime validation of order-submission inputs.
13 Restricts provider selection to the supported list and defaults missing selection to OpenAI.
14 Trims the API key and requires a length between 20 and 512 characters.
15 Requires the loan-number pattern 685-20 followed by exactly five digits and supplies a validation message.
16 Trims the optional FHA case number, limits it to 40 characters, and defaults it to blank.
17 Restricts payment method to the three defined labels.
18 Accepts optional boolean/form-string rush flags and converts only true, 'true', and 'on' into true.
19 Trims and limits the model ID, rejects whitespace/control characters, and defaults missing input to blank.
20 Completes validation and replaces an empty model ID with the selected provider's default.
21 Derives the validated order-input TypeScript type from the schema.
22 Defines an uploaded PDF as a readonly filename and in-memory byte buffer.
23 Defines a readonly job payload containing validated input, a required URLA, and an optional sales contract.
24 Defines the job lifecycle status values exposed by the application.
25 Defines status updates with a message and optional warning list.
26 Adds the fixed status-message discriminator to worker updates.
27 Adds a job identifier to the public status view.
29 Defines a reusable schema for a string value or null when unknown.
30 Defines nullable name, phone, and email attributes shared by extracted contacts.
31 Starts the structured document-extraction result schema.
32 Restricts extracted loan program to the listed supported/unknown classifications.
33 Defines nullable source program wording and a bounded loan-purpose classification.
34 Defines a nullable appraisal product and directs extraction to distinguish explicit requests from evidence-backed recommendations.
35 Defines nullable property classification and occupancy values.
36 Defines nullable subject-property address, unit, postal code, city, and state fields.
37 Defines nullable loan identifiers/type/lien information and a positive nullable loan amount.
38 Requires a positive sale price or null and describes extracting the contract's stated total without confusing it with loan amount or cash to close.
39 Defines a positive nullable prior valuation amount and a nullable valuation date.
40 Applies the contact schema to borrower, co-borrower, listing-agent, and buyer-agent records.
41 Requires boolean complex-property and prominent-customer flags.
42 Requires evidence entries with a field name, supported document identifier, positive integer page number, and quotation of at most 300 characters.
43 Requires an array of extraction warnings.
44 Ends the extraction-result schema.
45 Derives the extracted-order TypeScript type from runtime validation.
46 Defines readonly approved field-plan entries with a value, control kind, optional required flag, and approved label aliases.
48 Starts the explicit property-description alias table for inspected R3 options.
49 Maps common single-family descriptions to the Single Family option.
50 Maps explicit single-family detached descriptions to the Single Family option.
51 Maps detached-single-family word orders and the SFR abbreviation to Single Family.
52 Maps condo/condominium descriptions to Condominium.
53 Maps manufactured-housing descriptions to Manufactured Home.
54 Maps numeric two-to-four-unit descriptions to Two To Four Family.
55 Maps spelled-out two-to-four-family/unit descriptions to Two To Four Family.
56 Maps townhouse, townhome, and rowhouse descriptions to Townhouse or Rowhouse.
57 Ends the property alias table.
58 Starts the occupancy-label alias table.
59 Maps primary-residence and owner-occupied wording to the primary owner-occupancy option.
60 Maps second-home wording to the secondary owner-residence option.
61 Maps tenant-occupied and vacant descriptions to their respective occupancy options.
62 Ends the occupancy alias table.
63 Defines nullable label normalization using a caller-supplied alias map.
64 Preserves null; otherwise looks up trimmed lowercase wording and falls back to the original value.
65 Ends the general label-normalization helper.
67 Documents that property classification requires an explicit description, not isolated unit count or project status.
68 Defines the property-type normalizer for nullable extracted wording.
69 Trims and lowercases the description, replaces supported hyphen/dash characters with spaces, and collapses whitespace.
70 Returns a known property option only for an explicit alias match, otherwise null.
71 Ends property-type normalization.
73 Documents that baseline product inference is limited to inspected property/program combinations.
74 Defines baseline appraisal-product selection from normalized property type and loan classification.
75 Starts the mapping from R3 property labels to baseline-product table categories.
76 Maps the four supported property options to their baseline category keys.
77 Ends the property-to-product-category mapping.
78 Looks up a baseline category only when a property type is available.
79 Supports conventional programs and FHA-prefixed programs for automatic baseline selection.
80 Returns the corresponding observed product when both keys are supported, otherwise null.
81 Ends baseline product selection.
83 Documents that appraisal recommendations need bounded approval separate from extracted facts.
84 Defines product selection using extracted data, normalized property type, contract availability, and an accumulating warning list.
85 Trims the extracted/requested product and converts an empty result to null.
86 Collects evidence entries explicitly marked as product recommendations.
87 Collects evidence entries explicitly marked as requested appraisal products.
88 Starts a predicate requiring at least one supporting evidence entry.
89 Requires every evidence quote to be nonblank and to cite URLA or an actually supplied sales contract.
90 Explains why the presence of recommendation markers must force the stricter recommendation branch.
91 Begins validation when recommendation evidence exists.
92 Defines case/whitespace normalization for appraisal-product label comparison.
93 Normalizes the requested label and its approved aliases, or uses an empty candidate list.
94 Limits recommendation matching to conventional or FHA program categories.
95 Starts searching observed baseline products when a supported program exists.
96 Chooses the first program-specific observed label matching the normalized request or its aliases.
97 Computes the baseline implied by the normalized property type and loan program.
98 Accepts missing property wording, but otherwise requires a known property baseline equal to the candidate product.
99 Rejects recommendations missing a request, valid evidence, unique recommendation status, a known candidate, or property consistency.
100 Adds a review warning explaining unsupported or conflicting product recommendations.
101 Leaves the product unresolved when recommendation checks fail.
102 Ends rejection of unsupported recommendations.
103 Warns that the accepted product is an agent recommendation requiring property/lender review.
104 Returns the supported requested recommendation label.
105 Ends the recommendation-evidence branch.
106 Begins handling a stated product without recommendation markers.
107 Accepts the stated product when explicit-request evidence passes the support check.
108 Adds a warning when the stated product lacks a usable document citation.
109 Leaves an unsupported stated product unresolved.
110 Ends explicit-product handling.
111 Computes a baseline product when no product was stated.
112 Adds a lender-requirements review warning when automatic baseline selection succeeds.
113 Returns the selected baseline or null.
114 Ends appraisal-product selection.
116 Documents that loan business rules run before opening the R3 sign-in browser.
117 Defines validation of extracted loan facts against user inputs.
118 Detects VA classification from either the structured program or the source program wording.
119 Rejects VA work with a coded error directing the user to the VA portal.
120 Ends the VA rejection branch.
121 Detects unknown loan-program or loan-purpose classifications.
122 Rejects unresolved classification and requests a legible complete URLA.
123 Ends the unknown-classification branch.
124 Checks URLA evidence for loan program and loan purpose in turn.
125 Requires a matching field citation from the URLA with a nonblank quote.
126 Rejects classifications that lack supporting URLA evidence.
127 Ends rejection of a missing classification citation.
128 Ends the required-classification evidence loop.
129 Detects FHA classification or source wording when the user supplied no FHA case number.
130 Rejects FHA and FHA Zero Down preparation without a case number.
131 Ends the FHA case-number requirement branch.
132 Ends loan business-rule validation.
134 Documents that this builder defines all browser-writable values and leaves unknown facts blank.
135 Defines approved field-plan construction and its plan, warnings, and missing-required-field result.
136 Applies loan validation before producing any browser field values.
137 Creates the ordered list of approved field entries.
138 Creates the list of unresolved required field keys.
139 Starts warnings with mandatory source-document review and up to twelve extracted warnings truncated to 500 characters each.
140 Normalizes the extracted property description to a known R3 option.
141 Warns when a nonblank property description cannot map to an inspected option.
142 Selects the appraisal product while accumulating any recommendation/evidence warnings.
143 Defines the entry-adding helper with text/default optional settings and optional approved dropdown aliases.
144 Begins handling unknown or empty values.
145 Begins required-value handling for an absent value.
146 Records the missing required field key.
147 Adds a warning instructing the user to complete that missing fact during review.
148 Ends missing-required-value reporting.
149 Adds an explicit blank only for an optional text field, so stale defaults can be cleared.
150 Stops adding the current value after absent-value handling.
151 Ends the absent-value branch.
152 Appends a populated entry, converting numbers to strings and carrying its kind/required flag.
153 Includes approved aliases only when the alias list is nonempty, then completes the entry insertion.
154 Ends the entry-adding helper.
155 Requires the configured Guild Summerlin branch dropdown value.
156 Adds the required selected appraisal product with its constrained alternate labels when available.
157 Adds the required normalized property-type selection.
158 Normalizes extracted occupancy through the known label aliases.
159 Adds required occupancy, mapping investment-property wording to Unknown rather than inferring tenant/vacant status.
160 Warns that investment classification alone does not determine tenant versus vacant occupancy.
161 Adds each property-address component, making state a dropdown and every component except unit required.
162 Sets the optional county dropdown to Unknown.
163 Adds the user's loan number as a required text value.
164 Adds the extracted secondary loan number as optional text.
165 Adds the extracted loan purpose as a required dropdown selection.
166 Explains that evidence-backed program classification controls loan type instead of free-form loan text.
167 Converts conventional or FHA-prefixed program classification into a supported R3 loan-type label, otherwise null.
168 Adds the resulting loan type as a required dropdown entry.
169 Adds the user-supplied FHA case number and marks it required for FHA-prefixed programs.
170 Maps first/second lien aliases into an optional dropdown entry and adds the extracted loan amount as required text.
171 Adds a required sale price only for purchases with a supplied contract.
172 Adds optional prior valuation amount and converts an ISO-formatted prior valuation date to month/day/year while preserving other supplied formats.
173 Defines a helper for adding a contact section with optional overall requiredness.
174 Lists the six contact attributes that will be processed in a fixed order.
175 Starts with no known phone/email reachability for the contact.
176 Iterates through the supported contact attributes.
177 Trims the contact attribute and treats absent or blank values as unknown.
178 Identifies first and last names separately from communication details.
179 Marks the contact reachable when any non-name field contains a value.
180 Documents that any supported phone or email is sufficient and missing phone categories are not fabricated.
181 Adds the contact attribute, requiring names and supplied communication fields only when the contact is required.
182 Explains that missing required names still require review while stale copied/account names must be cleared.
183 Adds an optional explicit blank to clear a missing required name after recording its absence.
184 Ends the contact-attribute loop.
185 Checks whether a required contact lacks every supported phone/email value.
186 Records a synthetic phoneOrEmail missing-field key for the contact section.
187 Warns the user to supply contact reachability during review.
188 Ends missing-reachability reporting.
189 Ends the contact-section helper.
190 Adds the borrower as a required contact.
191 Adds optional co-borrower details.
192 Requires the borrower-as-access-contact checkbox to reflect whether the loan is a refinance.
193 Adds a required access contact using the borrower for refinance, listing agent for purchase, or unresolved values for other purposes.
194 Iterates through listing-agent and buyer-agent sections.
195 Adds an optional agent section only when at least one of its extracted values is nonblank.
196 Ends optional agent-section processing.
197 Documents that the user-configured loan officer applies independently of document extraction.
198 Requires Amber as the loan officer's first name.
199 Requires Coleman as the loan officer's last name.
200 Requires the configured loan-officer work phone.
201 Requires the configured loan-officer email address.
202 Adds the user's rush-order setting as a required checkbox value.
203 Adds the extracted complex-property and prominent-customer flags as optional checkbox entries.
204 Explicitly disables side-by-side ordering and requires the user's payment-method selection.
205 Requires the configured team name in the status-contact first-name field.
206 Requires the configured team email in the status-contact email field.
207 Explains that explicit empty entries clear account defaults from the new order.
208 Iterates through unsupported/unprovided identifiers, access and scheduling fields, management notes, and selected status-contact fields to clear them.
209 Adds an optional empty text entry for the current field to remove any existing default.
210 Ends the explicit-blank field loop.
211 Explicitly clears sale price whenever the job is not a purchase with a supplied contract.
212 Returns the assembled approved plan, accumulated warnings, and unresolved required field keys.
213 Ends field-plan construction.
215 Defines validation of an uploaded PDF's size and signature.
216 Rejects buffers over fifteen mebibytes, under ten bytes, or without a PDF signature in their first 1024 bytes.
217 Throws the coded invalid-PDF error with the upload-size requirement.
218 Ends invalid-PDF rejection.
219 Ends uploaded-PDF validation.
''')

SESSION_A = '''
1 Imports cryptographic UUID generation for a session-specific DOM marker.
2 Imports the LangChain helper that exposes approved browser operations as tools.
3 Imports the message-content type used by the screenshot tool's multimodal result.
4 Imports Chromium launching plus Playwright browser, context, locator, page, request, and route types.
5 Imports Zod to validate browser-tool inputs.
6 Imports the application's coded error base class.
7 Imports environment filtering, inspected-field matching, phone recovery normalization, and approved-value comparison helpers.
8 Begins the grouped import of browser request guards and approved URLs.
9 Imports predicates for authenticated landing, order confirmation, order creation, and request authorization.
10 Imports approved login/order addresses and the browser lifecycle phase type.
11 Completes the import from the request-guard module.
13 Defines the public shape of an application-approved field assignment.
14 Identifies the application field-plan key.
15 Allows an approved string value or boolean checkbox value.
16 Restricts field actions to text entry, dropdown selection, or checkbox/radio setting.
17 Optionally marks the field as required for a completed handoff.
18 Documents that alternate labels must be explicitly approved by application code.
19 Allows a list of application-approved alternate dropdown labels.
20 Ends the approved field-entry interface.
22 Defines the inspected form-element data returned to browser tools.
23 Stores the opaque session-generated element reference.
24 Stores the observed human-readable field label.
25 Stores the observed containing-section hierarchy.
26 Stores the element's form name.
27 Stores the DOM element ID for inspected identity matching.
28 Stores the lowercased HTML tag name.
29 Stores the input type, ARIA role, or fallback tag classification.
30 Stores the observed field value as text.
31 Stores checkbox/radio state, using null for other control types.
32 Indicates whether HTML or ARIA metadata marks the field required.
33 Indicates whether HTML or ARIA metadata disables the control.
34 Indicates whether HTML or ARIA metadata marks the control read-only.
35 Records the element's measured visibility.
36 Stores native dropdown options with their labels, raw values, and disabled flags.
37 Ends the inspected form-element interface.
39 Defines the result of checking one planned field against the page.
40 Identifies which approved plan key was checked.
41 Identifies the inspected DOM reference associated with the check.
42 Carries the observed field label into the report.
43 Carries the observed section hierarchy into the report.
44 Stores the approved string or boolean expected value.
45 Stores the actual string or boolean read back from the page.
46 Uses the same control-kind type as an approved field entry.
47 Records whether the current page value matches the approved plan.
48 Optionally explains a failed verification or other field issue.
49 Ends the field-verification result interface.
51 Defines browser-session configuration supplied by the application.
52 Requires a callback receiving the four browser/user lifecycle statuses and a descriptive message.
53 Ends the browser-session options interface.
55 Defines the status, optional headers, and string/buffer body returned by guarded network transport.
56 Defines an injectable async route transport, allowing deterministic network fixtures.
57 Defines the redirect-related metadata read from Chromium's native response events.
58 Stores Chromium's identifier for the paused request.
59 Optionally stores the response HTTP status code.
60 Optionally stores response headers as name/value pairs.
61 Stores the request URL and HTTP method needed for redirect validation.
62 Stores Chromium's resource classification for navigation checks.
63 Stores the frame identifier used to distinguish main-frame navigation.
64 Ends the native-response metadata interface.
66 Defines a browser-action-specific subclass of the application's coded errors.
67 Begins construction of a browser action error from a user-facing message.
68 Initializes the base error with the BROWSER_ACTION code and supplied message.
69 Sets the error's name to the browser-specific class name.
70 Ends the browser error constructor.
71 Ends the browser action error class.
73 Normalizes surrounding/internal whitespace and case for dropdown-label comparisons.
75 Documents the visible, isolated, nonpersistent authentication design of production sessions.
76 Defines the production browser-session factory.
77 Launches visible Chromium with only the filtered environment variables.
78 Starts setup inside a cleanup-protected block after browser launch.
79 Creates a new isolated browser context with explicit restrictions.
80 Uses a 1440-by-1000 viewport, blocks service workers, and disables accepted downloads.
81 Completes creation of the isolated context.
82 Creates a page and installs the guarded session around the browser, context, and callbacks.
83 Returns the ready guarded-session API.
84 Handles an error during context/page/session initialization.
85 Closes the launched browser when initialization fails.
86 Rethrows the original initialization error after cleanup.
87 Ends the initialization failure handler.
88 Ends the production session factory.
90 Documents the dependency-injection entry point used by fixture tests.
91 Starts the exported guarded-session factory.
92 Accepts existing Playwright browser/context/page objects and status callbacks.
93 Optionally accepts a deterministic transport override for tests.
94 Completes the parameters and begins guarded-session initialization.
95 Starts the network/action lifecycle in the preparation phase.
96 Tracks whether human authentication has been positively confirmed.
97 Stores the single shared login-wait promise to prevent duplicate sign-in flows.
98 Tracks whether an order confirmation has already been reported during review.
99 Tracks whether closure cleanup and notification have already run.
100 Declares the resolver that will complete the session-closed promise.
101 Creates the closed promise and captures its resolver for later lifecycle events.
102 Creates the current map of opaque DOM references to inspected form elements.
103 Creates the map of attempted field keys to their latest verification result.
104 Creates the immutable-after-installation approved field-plan map.
105 Generates a unique data-attribute name for marking inspected elements within this session.
106 Initializes the inspection generation counter used in new field references.
107 Starts the serialized browser-tool action queue as an already-resolved promise.
108 Tracks immediate revocation of further automated actions.
109 Stores the shared incomplete-handoff operation so repeated requests reuse it.
110 Tracks preparation-phase intercepted routes that may need cancellation before human handoff.
111 Tracks in-flight R3 GET lookups used by dynamic form controls.
112 Tracks callbacks waiting for all observed lookups to finish.
114 Defines status notification using the callback's accepted status type.
115 Invokes the UI callback while swallowing its failures so notifications cannot disrupt browser safeguards.
116 Ends the protected status notifier.
117 Defines idempotent cleanup when the session's browser surfaces close.
118 Skips repeated closure events after cleanup has already run.
119 Marks closure as resolved to prevent duplicate cleanup and messages.
120 Sets the session phase to closed, blocking subsequent guarded work.
121 Immediately disables further automation.
122 Releases pending lookup waiters so queued work can observe closure.
123 Removes all inspected element references from session memory.
124 Removes the approved field plan from session memory.
125 Removes retained verification results from session memory.
126 Resolves the public promise used to wait for browser closure.
127 Reports that the appraisal browser was closed.
128 Ends closure cleanup.
129 Runs closure cleanup when the browser disconnects.
130 Runs closure cleanup when the browser context closes.
131 Registers a page-close handler for the managed page.
132 Treats closing the page as session closure only when no context pages remain.
133 Ends registration of the page-close handler.
134 Sets the default Playwright action timeout to ten seconds.
135 Sets the default navigation timeout to thirty seconds.
137 Registers observation of requests within the isolated context.
138 Begins selecting GET requests made through XHR or fetch for lookup tracking.
139 Tracks those requests only when their origin is the HTTPS R3 client portal.
140 Ends request-tracking listener registration.
141 Defines cleanup when a tracked or untracked request completes or fails.
142 Removes the request from the set of pending lookups.
143 Releases all lookup waiters when the pending set becomes empty.
144 Ends the lookup-completion callback.
145 Applies lookup cleanup to successfully completed requests.
146 Applies lookup cleanup to failed requests as well.
148 Installs an async interceptor for every HTTP request in the browser context.
149 Retrieves the Playwright request associated with the intercepted route.
150 Captures whether this route began during automated preparation.
151 Detects a request arriving after automation was revoked but before preparation routing ended.
152 Aborts that request with Chromium's client-blocked reason.
153 Stops handling the revoked preparation request.
154 Ends the immediate-revocation branch.
155 Begins evaluating the request against the centralized phase-aware authorization guard.
156 Supplies the request URL, method, and document-navigation status to the guard.
157 Supplies main-frame navigation status, resource type, and the current session phase.
158 Opens the rejection branch when authorization returns false.
159 Aborts the unauthorized request as blocked by the client.
160 Returns without contacting the blocked endpoint.
161 Ends request-authorization rejection.
162 Selects native network handling for human review or authentication when no fixture transport is installed.
163 Documents that human authentication uses Chromium's own cookie/CAPTCHA network behavior.
164 Documents that the agent must not inspect credentials or proxy login bodies through route.fetch.
165 Falls through to normal browser routing for the allowed human-phase request.
166 Stops custom response handling after native routing takes over.
167 Ends the native-human-network branch.
168 Tracks this route for possible cancellation if it started in preparation.
169 Starts guarded fetching with failure cleanup.
170 Uses the injected fixture transport when provided; otherwise starts a local async network adapter.
171 Fetches the intercepted request without automatically following redirects.
172 Returns the fetched HTTP status, headers, and buffered body in the guarded-response shape.
173 Completes and immediately invokes the production network adapter.
174 Explains that late lookup results must be discarded once a timed-out action has yielded control.
175 Rechecks revocation after awaiting the response of a preparation request.
176 Aborts a late response after revocation, ignoring cancellation failures.
177 Stops before fulfilling the late response into the page.
178 Ends the late-response revocation check.
179 Reads an optional redirect destination from the response headers.
180 Begins redirect handling for a 3xx status with a Location header.
181 Resolves relative redirect locations against the original request URL.
182 Begins rejecting subresource redirects and 307/308 redirects that would preserve a non-GET method.
183 Also rejects redirect destinations that fail the guarded GET-navigation check.
184 Aborts an unsafe redirect rather than following it.
185 Returns after redirect rejection.
186 Ends the redirect rejection branch.
187 Documents that Chromium does not rerun route interception on ordinary HTTP redirect hops.
188 Explains why a validated script navigation forces the destination through request guarding again.
189 Serializes the approved target as a JavaScript string and escapes less-than characters for safe embedding in script HTML.
190 Fulfills the request with a small HTML response whose location.replace starts a fresh guarded navigation to the approved target.
191 Returns after supplying the redirect-navigation page.
192 Ends redirect-specific response handling.
193 Delivers the guarded non-redirect response to the browser page.
194 Handles failures during fetching, redirect validation, or response fulfillment.
195 Aborts the failed route while suppressing secondary abort failures.
196 Begins cleanup that runs regardless of request success or failure.
197 Removes the route from the set of preparation requests awaiting settlement.
198 Ends guaranteed route-tracking cleanup.
199 Completes installation of the all-request HTTP route handler.
200 Documents why WebSockets need separate write protection from HTTP routing.
201 Installs interception for every WebSocket connection.
202 Connects a WebSocket to its server only during human review.
203 Otherwise closes it with policy-violation code 1008 and a human-review requirement.
204 Completes WebSocket guard registration.
205 Registers a handler for new pages or popups in the context.
206 Closes newly opened pages outside review and ignores close failures.
207 Completes new-page handler registration.
208 Registers a handler for dialogs shown by the managed page.
209 Dismisses dialogs outside review/authentication and ignores dismissal failures.
210 Completes dialog-handler registration.
211 Registers observation of page responses to recognize human submission outcomes.
212 Ignores responses outside review, after a prior submission observation, or with error HTTP statuses.
213 Retrieves the request associated with the candidate response.
214 Ignores responses that are not navigations to recognized order confirmation/detail destinations.
215 Marks the first qualifying post-review confirmation as observed.
216 Notifies the user of the observed confirmation/details page while instructing them to check portal confirmation and leaving the browser open.
217 Completes human-submission response observation.
219 Defines the guard for a browser session still available to automation.
220 Rejects use after the phase or actual page has closed.
221 Rejects use after automation revocation or transfer to human review.
222 Ends the availability guard.
223 Defines the stronger guard requiring confirmed login in addition to availability.
224 First checks closure and human-handoff restrictions.
225 Rejects browser automation until login is confirmed and the authentication phase has ended.
226 Ends the active-session guard.
227 Defines the guard requiring active automation on the exact order creation page.
228 Checks availability and completed authentication.
229 Rejects the operation unless the current URL is the approved new-order page.
230 Ends the order-page guard.
231 Defines conversion of an inspected opaque reference into a Playwright locator.
232 Requires an active authenticated order page before resolving a field.
233 Rejects references not present in the latest inspected element map.
234 Locates elements bearing this session's unique data attribute and the supplied reference value.
235 Ends the reference-to-locator helper.
237 Defines a wait for dynamic R3 lookup requests and their page callbacks to settle.
238 Requires an active order page before waiting for lookups.
239 Starts an asynchronous wait only if tracked lookups are still pending.
240 Creates a promise that lookup completion can resolve or a timeout can reject.
241 Defines completion cleanup that cancels the timer, unregisters the waiter, and resolves the wait.
242 Sets a fifteen-second deadline that unregisters the waiter and rejects with a lookup-specific action error.
243 Registers the completion callback with the session's lookup waiters.
244 Completes awaiting the pending-lookup promise.
245 Ends the branch waiting for outstanding network lookups.
246 Rechecks order-page authorization after the lookup wait.
247 Documents the need to let completed lookup callbacks update fields and visibility.
248 Explains the bounded fallback because minimized pages can suspend animation frames.
249 Runs a short promise-based settling delay inside the page.
250 Schedules a 100-millisecond fallback to resolve that page-side delay.
251 Resolves on the next animation frame when available and cancels the fallback timer.
252 Completes the bounded page-side settling wait.
253 Rechecks order-page authorization after page callbacks have had time to run.
254 Ends dynamic lookup settling.
256 Defines fresh inspection and referencing of permitted order-form controls.
257 Requires an active authenticated order page before inspecting form fields.
258 Waits for lookup responses and their dependent page updates before reading fields.
259 Advances the inspection generation used for references on newly encountered elements.
260 Executes DOM inspection inside the page with the session attribute and generation identifier.
261 Defines page-side text cleanup that converts missing values to blank and normalizes whitespace.
262 Collects native input/select/textarea controls plus ARIA combobox, checkbox, and radio elements.
263 Excludes credential, hidden, submission/action, upload, and image-input types from inspection.
264 Caps each inspection at the first 350 eligible elements.
265 Begins conversion of each eligible element into a serializable field record.
266 Treats the element as input-shaped for access to shared form properties at compile time.
267 Reads and lowercases the element's HTML tag name.
268 Joins cleaned native associated-label text when the element exposes a labels collection.
269 Splits the aria-labelledby attribute into referenced element IDs.
270 Resolves those ID references to cleaned nonempty text and joins them as an accessible label.
271 Prefers native labels, then aria-label, then resolved aria-labelledby text for the field caption.
272 Falls back to the immediate parent input-group addon's text when stronger labels are absent.
273 Finally falls back through placeholder, form name, and element ID.
274 Creates an empty collection for the element's enclosing section titles.
275 Starts section discovery from the element's parent.
276 Walks at most eight ancestors, stopping before FORM or BODY and moving upward after each iteration.
277 Looks for direct-child legends, headings, or known panel/card/group title elements in the current ancestor.
278 Uses cleaned heading text or the ancestor's ARIA label as its section title.
279 Prepends a distinct nonempty title different from the field label, truncating each added title to 160 characters.
280 Ends the ancestor-section discovery loop.
281 Reads any reference previously stamped on this element for the current session.
282 Begins assigning a reference only when the element lacks one.
283 Builds a reference from the inspection generation and element index.
284 Stamps the element with the session-specific reference attribute.
285 Ends new-reference assignment.
286 Reads the element's bounding rectangle for a visibility check.
287 Marks the element visible when it has nonzero dimensions and computed visibility is not hidden.
288 Classifies the element by its type attribute, otherwise ARIA role, otherwise HTML tag.
289 Starts the serializable inspected-element result.
290 Includes the opaque reference, label capped at 300 characters, and joined section hierarchy capped at 500 characters.
291 Includes the form name (or blank), DOM ID, lowercased tag, and control classification.
292 Reads a stringified value property when present, otherwise cleaned text content.
293 Reads native or ARIA checked state for checkboxes/radios and records null for other control types.
294 Combines native required state with aria-required metadata.
295 Combines native disabled state with aria-disabled metadata.
296 Combines native readOnly state with aria-readonly metadata.
297 Includes the visibility result computed from geometry and CSS.
298 Begins mapping native select options into serializable option records.
299 Records each option's cleaned label, raw selection value, and disabled flag.
300 Completes option mapping, using an empty list for non-select controls.
301 Ends the inspected-element result object.
302 Ends mapping of all eligible DOM controls.
303 Passes the session attribute and generation into the page and completes DOM inspection.
304 Clears the old reference map before installing the fresh snapshot.
305 Indexes every newly inspected element by its opaque reference.
306 Returns the fresh form-element list to the caller.
307 Ends form-element inspection.
309 Defines validation and retrieval of the approved plan entry for a specific field action.
310 Requires an active authenticated order page before authorizing a field write.
311 Retrieves the application-approved entry by its field key.
312 Rejects missing entries or an action kind differing from the approved control kind.
313 Retrieves the current inspected metadata for the requested element reference.
314 Rejects a reference absent from the latest field snapshot.
315 Collects inspected elements that match the approved field key's constrained R3 identity rules.
316 Requires exactly one matching element and requires it to be the caller's supplied reference.
317 Searches earlier field attempts for another plan key assigned to the same DOM reference.
318 Rejects cross-key reference reuse to avoid filling the wrong repeated contact section.
319 Returns the approved plan entry after all identity checks pass.
320 Ends plan-entry authorization.
322 Defines rereading and comparison of a previously attempted field.
323 Requires an active order page before verification.
324 Retrieves the current immutable plan entry for the reported field key.
325 Finds inspected elements matching that key's constrained R3 identity.
326 Detects missing, duplicate, or different references for the field's expected identity.
327 Returns a failed verification explaining that section/identity matching changed.
328 Ends the field-identity mismatch branch.
329 Resolves the verified opaque reference into its guarded locator.
330 Returns a failed result if the plan disappeared or the locator no longer identifies exactly one DOM element.
331 Declares the value that will be read back from the page.
332 Begins reading a checkbox/radio-style control.
333 Reads the actual DOM tag to distinguish native inputs from ARIA widgets.
334 Reads native checked state for inputs or compares aria-checked with true for custom widgets.
335 Begins reading a dropdown-style control.
336 Runs dropdown-value extraction in the page context.
337 For a native select, joins labels of the selected options as the human-readable actual value.
338 For a custom dropdown, uses its value property, then text content, then an empty string.
339 Completes dropdown-value extraction.
340 Begins the ordinary text-field readback branch.
341 Reads the input's current value through Playwright.
342 Ends control-specific actual-value reading.
343 Normalizes the approved value and all application-approved alternate labels.
344 Checks whether this entry is a dropdown backed by a native HTML select.
345 Reads that select's raw submitted value when applicable, otherwise uses blank.
346 Compares a boolean actual value directly with the approved plan value.
347 For dropdown text, accepts a normalized selected label or raw value matching an approved label/value.
348 For other text fields, applies field-specific approved-value comparison such as money or phone formatting equivalence.
349 Returns the updated actual value and verification result, adding a mismatch message only on failure.
350 Ends field-value verification.
352 Documents that phone recovery may vary formatting only within the field's own approved number.
353 Defines recovery of a phone field that failed ordinary fill-and-blur verification.
354 Converts the expected approved value into a string.
355 Extracts recoverable digits only for supported phone keys and number formats.
356 Leaves the existing failed result unchanged when phone recovery is not permitted.
358 Defines a helper that freshly verifies a phone field remains safely editable.
359 Refreshes observed form controls and waits for dependent page updates.
360 Reauthorizes the existing reference against its immutable text plan entry.
361 Retrieves the newly inspected phone field metadata.
362 Begins rejecting a changed approved value, invisible field, disabled field, or read-only field.
363 Also requires a native input with an allowed ordinary/text/tel classification.
364 Throws an action error directing manual review when the phone field is no longer eligible.
365 Ends phone-edit eligibility rejection.
366 Rechecks order-page authorization before returning the editable target.
367 Returns the guarded locator for the approved phone reference.
368 Ends the fresh editable-phone locator helper.
369 Defines phone readback after triggering blur-dependent formatting.
370 Revalidates and locates the editable phone field.
371 Rechecks order-page authorization immediately before blur.
372 Removes focus so page-side phone formatting/validation can run.
373 Refreshes inspected controls after the blur and dependent lookups.
374 Verifies the original phone assignment against the resulting page value.
375 Ends phone readback after blur.
377 Documents that candidate phone formats preserve the immutable approved number.
378 Starts equivalent candidates with a three-three-four digit hyphenated phone format.
379 Adds a parenthesized area code directly followed by the remaining hyphenated digits.
380 Adds a parenthesized area code with an intervening space and completes the candidate list.
381 Tries equivalent format candidates other than the exact originally approved string.
382 Stops recovery if a candidate unexpectedly fails the existing phone-equivalence comparison.
383 Freshly revalidates the phone field before trying the current format.
384 Rechecks order-page authorization before the fill.
385 Fills the current equivalent phone format.
386 Blurs and verifies the phone after page-side formatting.
387 Returns immediately when the formatted phone verifies successfully.
388 Ends the equivalent-format retry loop.
390 Freshly revalidates the phone target before a keyboard-driven recovery attempt.
391 Rechecks order-page authorization before clearing the field.
392 Clears the phone input to reset its current text.
393 Explains that some input masks require digit-by-digit keyboard events and fresh authorization for each digit.
394 Documents that this private recovery exposes no arbitrary keyboard capability to the agent.
395 Iterates through only the approved normalized phone digits.
396 Refreshes and reauthorizes the phone locator before typing the current digit.
397 Rechecks order-page authorization immediately before the keyboard event.
398 Types the single approved digit with sequential key events for mask compatibility.
399 Ends the approved-digit typing loop.
400 Blurs and returns the final verification result after keyboard-driven recovery.
401 Ends constrained phone recovery.
403 Defines application of one approved field value to an inspected reference with subsequent verification.
404 Waits for dynamic lookups to settle before attempting a write.
405 Refreshes inspected fields and their reference map before authorization.
406 Retrieves the plan after checking the field key, reference identity, control kind, and collisions.
407 Retrieves current inspected metadata for the authorized reference.
408 Builds a guarded locator for the field.
409 Rejects the write if the locator does not currently identify exactly one DOM element.
410 Starts the initial verification record for this field attempt.
411 Records field identity, observed label/section, and the immutable approved expected value.
412 Records the initial observed value and control kind, marking the attempt unverified until readback.
413 Completes the initial verification record.
414 Stores the attempt before any further asynchronous operation.
415 Checks whether the existing page value already satisfies the approved plan.
416 Rechecks order-page authorization after the initial readback.
417 Begins handling a field whose current value already matches the plan.
418 Special-cases an already-checked approved borrower-as-access-contact checkbox.
419 Starts with no need to refresh copied access-contact fields.
420 Iterates through all approved entries to inspect the associated access-contact plan.
421 Skips plan keys outside the access-contact section.
422 Finds current inspected fields matching the access-contact plan key.
423 Retrieves the first candidate access-contact field, if present.
424 Starts detecting a missing/ambiguous contact field or verification failure for its approved value.
425 Supplies the contact field's key, reference, label, and section to verification.
426 Supplies its expected value, observed value, and control kind for readback comparison.
427 Enters the refresh branch if the contact field did not verify.
428 Records that copied contact values need to be refreshed.
429 Stops checking further contact fields after finding the first mismatch.
430 Ends access-contact mismatch handling.
431 Ends inspection of access-contact plan entries.
432 Begins refreshing copied contact values when a mismatch was found.
433 Requires all approved borrower fields to have been filled and freshly verified first.
434 Requires an editable native checkbox for the borrower-copy refresh mechanism.
435 Rejects refresh and requests manual access-contact review if the checkbox is unsuitable.
436 Ends native-checkbox eligibility rejection.
437 Rechecks order-page authorization before triggering the copy behavior.
438 Explains that an already-checked control may have copied borrower values before they were filled.
439 Documents that refresh fires the approved native checkbox's change handler without changing its checked value.
440 Dispatches a change event to rerun the borrower's access-contact copy handler.
441 Refreshes inspected fields after the change event and dependent updates.
442 Re-verifies the borrower-as-access-contact checkbox entry.
443 Stores the refreshed verification result for that plan key.
444 Returns the refreshed checkbox verification result.
445 Ends the copied-contact refresh branch.
446 Ends special handling of an already-checked borrower-copy checkbox.
447 Stores the successful initial verification when no special refresh returns earlier.
448 Returns without rewriting an already-correct field.
449 Ends handling of an existing approved page value.
450 Rejects changing a disabled/read-only field whose current value differs from the plan.
451 Begins ordinary text-field entry.
452 Rejects unsupported tags and checkbox/radio types for text filling.
453 Throws the text-control mismatch error.
454 Ends text-control eligibility rejection.
455 Fills the exact string representation of the application-approved value.
456 Rechecks order-page authorization after filling and before blur.
457 Blurs the text field to trigger page-side change/formatting behavior.
458 Begins checkbox/radio assignment instead of text filling.
459 Rejects elements whose inspected type is neither checkbox nor radio.
460 Detects enabling the borrower-as-access-contact checkbox.
461 Verifies all approved borrower fields before allowing page-side contact copying.
462 Ends the borrower-copy prerequisite check.
463 Sets the approved checked state directly for native input controls.
464 For a custom control, checks whether its ARIA checked state differs from the approved boolean.
465 Rechecks order-page authorization before interacting with the custom checkbox/radio.
466 Clicks the custom control only when its current checked state differs from the plan.
467 Ends custom checkbox/radio toggling.
468 Begins dropdown selection for the remaining supported control kind.
469 Normalizes the approved value and its application-supplied alternate labels.
470 Begins native select handling.
471 Filters out disabled options and retains options whose normalized label or raw value matches an approved value.
472 Rejects a native dropdown without exactly one approved matching option.
473 Selects the unique approved raw option value, forcing the operation only when the inspected native select is hidden.
474 Begins custom combobox handling when the field is not a native select.
475 Clicks the custom dropdown to reveal its options.
476 Locates page elements with the option role.
477 Reads the option text labels available after opening the combobox.
478 Rechecks order-page authorization after reading the options.
479 Keeps option labels that exactly match an approved normalized label while retaining their indices.
480 Rejects the custom dropdown if the approved label is absent or ambiguous.
481 Clicks the unique matching role-option by its inspected index.
482 Begins rejection of an element that is neither native select nor custom combobox.
483 Throws the dropdown-control mismatch error.
484 Ends dropdown-type rejection.
485 Ends control-specific writing.
486 Refreshes inspected fields and waits for dependent page updates after the write.
487 Reads back the attempted value and compares it with the approved plan.
488 Begins constrained recovery only when a text field failed verification.
489 Attempts approved phone-format/mask recovery, which leaves unsupported non-phone fields unchanged.
490 Ends text-field recovery.
491 Stores the latest verification result for the attempted plan key.
492 Returns the actual value and verification status to the caller.
493 Ends application and verification of one field.
495 Defines the prerequisite check before copying borrower data into the access-contact section.
496 Iterates over the immutable approved plan entries.
497 Skips entries outside the borrower section.
498 Retrieves the recorded attempt for the current borrower field.
499 Detects a borrower field that has never been attempted or no longer verifies on the page.
500 Rejects borrower copying until all approved borrower fields have been filled and verified.
501 Ends the borrower-field verification failure branch.
502 Ends inspection of borrower prerequisites.
503 Rechecks the order-page guard after all borrower verifications settle.
504 Ends borrower readiness validation.
506 Defines a generic queue that serializes asynchronous browser actions.
507 Appends the supplied action after the previous queued work settles.
508 Checks active-session authorization when the queued action actually begins.
509 Runs and returns the supplied asynchronous operation.
510 Completes creation of the queued operation's result promise.
511 Advances the shared queue with a promise that resolves on either success or failure, so one failed action does not permanently block later actions.
512 Returns the original result promise so the caller still receives its value or error.
513 Ends serialized action scheduling.
515 Defines the tool-facing wrapper that serializes work and returns bounded error text instead of rejecting.
516 Queues the action and converts any rejection into an error object.
517 Preserves known browser-action messages but substitutes generic recovery guidance for unknown errors.
518 Completes the catch handler's error object and returned promise.
519 Ends the safe browser-tool action wrapper.
521 Defines navigation to the fixed approved new-order page.
522 Requires available automation and confirmed authentication before navigation.
523 Explicitly rejects navigation if login has not been confirmed.
524 Opens the exact R3 order URL and waits for the document's DOMContentLoaded event.
525 Rechecks active-session authorization after navigation.
'''

SESSION_B = '''
526 Rejects navigation results outside the exact order page, pointing to possible sign-in, MFA, or account-access issues.
527 Waits for the first native input/select/textarea to attach so the order form has begun rendering.
528 Ends guarded new-order navigation.
530 Defines generation of a fresh verification report for all attempted fields.
531 Requires an active order page before reading the report.
532 Refreshes the inspected form snapshot and settles dependent lookups.
533 Creates the report's result list.
534 Iterates over every recorded field attempt.
535 Re-verifies the current field and appends its updated result when successful.
536 Converts verification exceptions into failed results while retaining the attempted field's identity and expected value.
537 Ends report collection for all attempts.
538 Replaces retained attempt records with their newest verification results.
539 Returns the fresh list of field verifications.
540 Ends field-report generation.
542 Defines deterministic filling of the entire approved plan with a final report and field-specific errors.
543 Requires an active authenticated order page before plan filling.
544 Creates a field-keyed error map so retries can replace or clear earlier failures.
545 Assigns explicit dependency priorities to branch/program/property/product, address lookup fields, county, and borrower-copy activation.
546 Gives borrower fields priority eight, access-contact fields ten, and other fields twenty unless an explicit priority exists.
547 Copies approved entries into an array sorted by dependency priority.
548 Defines filling and error tracking for a single approved entry.
549 Rechecks order-page authorization before each entry attempt.
550 Starts per-entry handling that can record recoverable field failures.
551 Refreshes the inspected field list before resolving the entry's target.
552 Finds current fields matching the plan key through constrained R3 identity rules.
553 Rejects a missing or ambiguous inspected target.
554 Applies the approved value to the single matched reference and awaits readback verification.
555 Records the field's verification failure message or a fallback mismatch message.
556 Removes an earlier error for this key when the field now verifies.
557 Handles exceptions from inspection, field application, or verification.
558 Rechecks the session/order guard so closure or handoff escapes instead of being treated as an ordinary field error.
559 Records a known browser-action message or a bounded generic field-fill error.
560 Ends per-entry exception handling.
561 Ends the single-entry fill helper.
562 Performs the first sequential fill pass in dependency order.
563 Explains that dependent page callbacks may reset fields that initially verified.
564 Documents the bounded single repair pass using only approved values and labels.
565 Begins one repair pass through the ordered plan.
566 Refreshes inspected controls before checking whether this field needs repair.
567 Retrieves the latest attempt record for the current entry.
568 Starts the recheck in an unverified state.
569 Begins fresh verification when an attempt record exists.
570 Re-verifies the current page value and retains its success flag.
571 On a verification exception, rechecks order authorization while leaving the entry eligible for a fresh-reference repair.
572 Ends rechecking an existing attempt.
573 Refills the entry once when it was absent, mismatched, or could not be re-verified.
574 Ends the bounded repair pass.
575 Builds a final fresh verification report after both passes.
576 Reconciles every approved entry against the final report.
577 Clears the entry's error if a matching final report result verifies successfully.
578 Adds a reset/unverified error when no successful final result or prior detailed error exists.
579 Ends final error reconciliation.
580 Returns the report and converts the error map into fieldKey/message records.
581 Ends deterministic approved-plan filling.
583 Defines tool arguments requiring a nonempty field key of at most 160 characters and a generated f<number>_<number> reference shape.
584 Starts the list of LangChain tools exposed to the browser agent.
585 Begins the queued, error-wrapped implementation of the page-observation tool.
586 Restricts observation to the active authenticated order page.
587 Starts the page observation result object.
588 Includes the actual URL, approved expected URL, and asynchronously read page title.
589 Includes at most the first 20,000 characters of visible body text.
590 Ends the page observation result.
591 Registers observe_page with an empty input schema and instructions to treat page content as untrusted data.
592 Registers a queued form-inspection tool returning references, section/identity metadata, values, and options, with no input parameters.
593 Begins the queued screenshot tool with a multimodal message-content return type.
594 Restricts screenshots to an active authenticated order page.
595 Captures a viewport PNG with animations disabled.
596 Starts the multimodal result with a warning that screenshot/page content is untrusted.
597 Adds the captured PNG as a base64 data URL with automatic image detail and completes the result array.
598 Registers screenshot_page with no arguments and a description limiting screenshots to the order page rather than credentials.
599 Registers a queued no-argument tool that navigates to the fixed order URL and reports success after navigation completes.
600 Registers a queued no-argument tool comparing the current URL with the approved order URL and returning the expected address.
601 Registers a text-fill tool accepting only a validated plan key/reference and supplying the immutable approved text value through applyField.
602 Registers a dropdown tool accepting a validated plan key/reference and selecting/verifying the unique approved option.
603 Registers a checkbox/radio tool accepting a validated plan key/reference and setting/verifying the approved boolean.
604 Registers a queued no-argument field-report tool that rereads attempted values without submission or handoff capabilities.
605 Registers a queued no-argument complete-plan filling tool, describing dependency order, observed identities, verification, and the no-submission boundary.
606 Ends construction of the agent's available browser-tool list.
608 Starts the public API returned for this guarded browser session.
609 Exposes the configured list of restricted LangChain browser tools.
610 Defines one-time installation of the application-approved field plan.
611 Checks that the browser remains available for automation before installing values.
612 Rejects plan replacement after entries are installed or any fields have been attempted.
613 Requires at least one entry and unique plan keys.
614 Iterates through supplied entries for validation and internal copying.
615 Rejects empty keys and values that are not boolean for checkboxes or string for other kinds.
616 Throws the invalid-plan-value error for a rejected entry.
617 Ends entry-type validation.
618 Copies the entry and its alias array into the internal map so later caller mutations do not alter those stored fields.
619 Ends installation of all approved entries.
620 Ends the public field-plan installation method.
621 Defines human sign-in waiting with an optional cancellation signal and empty default options.
622 Checks browser availability before entering or reusing authentication.
623 Returns immediately when login has already been confirmed.
624 Reuses the existing login-wait promise instead of launching duplicate authentication flows.
625 Rejects immediately if the supplied abort signal was already cancelled.
626 Switches the session into the authentication phase for human login networking.
627 Starts and stores the shared asynchronous login-confirmation operation.
628 Attaches a Chromium DevTools Protocol session to guard native authentication redirects.
629 Tracks whether redirect interception is being deliberately shut down.
630 Reads the page's frame tree to identify main-frame redirects.
631 Defines processing of native paused-response metadata.
632 Ignores new paused-response events once redirect-guard shutdown begins.
633 Starts asynchronous response continuation without returning its promise to the event emitter.
634 Documents the restriction to redirect metadata rather than credentials, request bodies, or cookies.
635 Reads the response status, using zero when no status is present.
636 Finds the Location header without case sensitivity to identify a possible redirect.
637 Begins validation only for a 3xx response with a redirect location.
638 Resolves relative redirect destinations against the paused request URL.
639 Models redirects as GET for status 303 and for POST requests receiving 301/302; otherwise preserves the original request method.
640 Begins checking the redirected request through the same phase-aware request guard.
641 Supplies the target URL, redirect-adjusted method, and whether the resource is a document.
642 Identifies a main-frame document navigation by comparing event and initial frame-tree IDs.
643 Supplies a lowercase resource type and the current browser phase.
644 Begins rejection when the native redirect fails request authorization.
645 Tells Chromium to fail the paused request with BlockedByClient.
646 Stops handling that rejected redirect without continuing its response.
647 Ends native-redirect rejection.
648 Ends special handling of a redirect response.
649 Resumes the native response when no unsafe redirect was found.
650 Handles errors in asynchronous native response validation or continuation.
651 Closes the context on unexpected active-authentication guard errors, while ignoring errors expected during shutdown and suppressing close failures.
652 Ends native-response failure handling.
653 Ends the paused-native-response callback.
654 Registers the callback for DevTools Fetch.requestPaused events.
655 Enables response-stage interception for all URL patterns during authentication.
656 Starts waiting until authenticated landing is confirmed or sign-in is cancelled.
657 Tracks whether this authentication wait has already settled.
658 Tracks whether a landing-page confirmation check is currently running.
659 Records that another navigation event requested a check while one was in progress.
660 Defines removal of temporary login-completion and cancellation listeners.
661 Removes the DOMContentLoaded landing-check listener.
662 Removes the load-event landing-check listener.
663 Removes the frame-navigation landing-check listener.
664 Removes the managed-page closure cancellation listener.
665 Removes the context closure cancellation listener.
666 Removes the abort-signal cancellation listener when a signal exists.
667 Ends login-listener cleanup.
668 Defines idempotent rejection of the pending login wait.
669 Ignores failure notifications after login waiting has already settled.
670 Marks the login wait finished before cleanup and rejection.
671 Removes temporary authentication listeners.
672 Rejects the wait with a LOGIN_CANCELLED application error and the supplied message.
673 Ends login failure handling.
674 Defines cancellation caused by browser/page closure before sign-in completion.
675 Defines cancellation caused by the external abort signal.
676 Rejects the login wait with the sign-in cancellation message.
677 Closes the context asynchronously after cancellation and suppresses secondary close failures.
678 Ends abort-signal cancellation handling.
679 Defines the event-driven authenticated landing-page check.
680 Ignores checks after login success or failure has settled the wait.
681 Coalesces overlapping checks by scheduling a later recheck and returning while a check is active.
682 Ignores pages that do not match the exact authenticated landing URL.
683 Marks a landing confirmation check as in progress.
684 Starts asynchronous authenticated-page-marker verification.
685 Documents that confirmation reads only an authenticated-page marker and never the login form.
686 Locates the exact Log Out link as the authenticated-page marker.
687 Waits without a Playwright timeout until that logout link becomes visible.
688 Stops if waiting finished meanwhile or the page left the approved landing URL.
689 Explains that disabling Fetch resumes pending responses and may produce expected late continuation errors.
690 Marks redirect interception as stopping so expected late events/errors are ignored.
691 Switches network policy back to preparation after the authenticated marker is observed.
692 Disables native Fetch response interception and resumes pending native responses.
693 Removes the paused-response redirect callback.
694 Detaches the DevTools session after redirect guarding has stopped.
695 Stops if cancellation settled login waiting during guard shutdown.
696 Rejects confirmation if the page left its authenticated landing URL during shutdown.
697 Records confirmed human authentication.
698 Marks the login wait successfully finished.
699 Removes temporary login/cancellation event listeners.
700 Resolves the login wait so preparation may continue.
701 Converts an asynchronous landing-check failure into bounded instructions to close the browser and try again.
702 Begins cleanup that runs after the landing-check task completes or fails.
703 Clears the flag indicating a check is in progress.
704 Consumes a queued recheck request and invokes the landing check again when needed.
705 Ends landing-check final cleanup.
706 Ends the event-driven landing-check function.
707 Triggers authenticated-page checking when DOMContentLoaded fires.
708 Triggers authenticated-page checking after full page load.
709 Triggers authenticated-page checking on frame-navigation events.
710 Cancels the login wait if the managed page closes.
711 Cancels the login wait if the context closes.
712 Registers the optional abort handler once so external cancellation stops authentication.
713 Handles an already-aborted signal or already-closed page immediately and skips login navigation.
714 Starts the async navigation that presents the human sign-in page.
715 Opens the fixed login URL and waits for DOMContentLoaded.
716 Stops if the authentication wait settled while navigation was running.
717 Brings the login page to the front for the user.
718 Reports that the user must enter credentials, complete CAPTCHA, and click Login, with preparation resuming only after confirmed sign-in.
719 Checks whether the resulting page already qualifies as the authenticated landing.
720 Converts login-page navigation/display failures into a bounded login-cancellation message.
721 Completes awaiting the human-login confirmation/cancellation promise.
722 Completes and immediately invokes the shared login-operation function.
723 Returns the shared login-wait promise to the caller.
724 Ends the public human-login wait method.
725 Exposes fixed order-page navigation through the serialized action queue.
726 Exposes a synchronous order-page predicate requiring confirmed login, a non-authenticating phase, and the approved URL.
727 Exposes fresh field-report generation through the serialized action queue.
728 Exposes complete approved-plan filling through the serialized action queue.
729 Defines transfer of a fully verified order to human review.
730 Enqueues handoff after all earlier browser actions.
731 Requires an active authenticated order page before complete handoff checks.
732 Rejects marking a session ready when no approved field plan exists.
733 Refreshes the verification report for all attempted fields.
734 Rechecks order-page authorization after the asynchronous report.
735 Begins detecting approved entries marked required that lack a successful final verification.
736 Completes the missing-required check by matching field keys against verified report entries.
737 Rejects ready-for-review handoff if any required entry is missing or any attempted field fails verification.
738 Documents that queue ordering lets earlier actions settle and causes later actions to fail after revocation.
739 Revokes all subsequent automated browser actions.
740 Switches network/browser ownership to human review.
741 Attempts to bring the prepared order page forward and ignores focus failures.
742 If the browser remains open, reports successful preparation and instructs the user to review every field and submit personally.
743 Completes the queued successful-handoff operation.
744 Ends the public complete-handoff method.
745 Defines transfer/preservation of an incomplete browser session, returning whether authenticated review was reached.
746 Returns false immediately when the session or page has already closed.
747 Reuses a previous incomplete-handoff promise and ensures a later closure changes its returned success to false.
748 Documents immediate automation revocation while pending network activity still remains guarded.
749 Explains that already-dispatched Playwright operations must settle before human network writes are enabled.
750 Immediately revokes additional automated actions without waiting for the queue.
751 Releases lookup waiters so in-flight operations can notice revocation and finish.
752 Starts and stores the single asynchronous incomplete-handoff operation.
753 Concurrently aborts every tracked preparation route and suppresses individual abort failures.
754 Waits for the serialized browser action queue to settle before changing ownership policy.
755 Returns false if the page/session closed while pending work was settling.
756 Begins authenticated review transfer only after login was confirmed and authentication has ended.
757 Enables human-review networking and disables preparation behavior through the phase change.
758 Attempts to bring the incomplete order page forward, ignoring focus failures.
759 Returns false if the browser closed while being brought forward.
760 Reports incomplete preparation, instructs the user to finish/review fields and submit personally, and leaves the browser open.
761 Returns true to indicate an open authenticated session was released for review.
762 Begins preserving the browser when sign-in was never confirmed.
763 Attempts to foreground the preserved pre-confirmation browser and ignores focus failures.
764 If still open, reports that automation stopped before confirmed login and that no prepared/verified order is claimed.
765 Returns false because authenticated order review was not established.
766 Ends authenticated-versus-unconfirmed incomplete-handoff handling.
767 Completes and immediately invokes the shared incomplete-handoff operation.
768 Returns the shared incomplete-handoff result promise.
769 Ends the public incomplete-handoff method.
770 Exposes the promise that resolves when browser closure cleanup runs.
771 Exposes explicit browser closure, awaiting Playwright shutdown and then running idempotent session cleanup.
772 Ends the returned guarded-session API object.
773 Ends creation and initialization of the guarded browser session.
775 Derives the exported BrowserSession type from the resolved return value of the guarded-session factory.
'''
save('src/browser/session.ts', SESSION_A + SESSION_B)
