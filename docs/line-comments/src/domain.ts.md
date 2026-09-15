# Line explanations: src/domain.ts

Source: [src/domain.ts](../../../src/domain.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

September 14 sequential-order update: JobView exposes optional canStartAnother readiness. WorkerCommand and WorkerMessage correlate preparation, cancellation, status and cleanup readiness with a job ID; readiness also reports whether a browser remains open.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports Zod for runtime validation and inferred TypeScript types. |
| 2 | Imports the application's coded error class for input and business-rule failures. |
| 3 | Imports observed R3 appraisal-product labels and their constrained alternate-label resolver. |
| 4 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 5 | Exports the default OpenAI model identifier. |
| 6 | Defines the immutable list of supported AI provider identifiers. |
| 7 | Derives the provider union type from the supported provider list. |
| 8 | Exports OpenAI as the default provider. |
| 9 | Maps each supported provider to its configured default model identifier. |
| 10 | Defines the per-PDF upload size limit as fifteen mebibytes. |
| 11 | Defines the three supported payment-method labels as literal values. |
| 12 | Begins runtime validation of order-submission inputs. |
| 13 | Restricts provider selection to the supported list and defaults missing selection to OpenAI. |
| 14 | Trims the API key and requires a length between 20 and 512 characters. |
| 15 | Requires the loan-number pattern 685-20 followed by exactly five digits and supplies a validation message. |
| 16 | Trims the optional FHA case number, limits it to 40 characters, and defaults it to blank. |
| 17 | Restricts payment method to the three defined labels. |
| 18 | Accepts optional boolean/form-string rush flags and converts only true, 'true', and 'on' into true. |
| 19 | Trims and limits the model ID, rejects whitespace/control characters, and defaults missing input to blank. |
| 20 | Completes validation and replaces an empty model ID with the selected provider's default. |
| 21 | Derives the validated order-input TypeScript type from the schema. |
| 22 | Defines an uploaded PDF as a readonly filename and in-memory byte buffer. |
| 23 | Defines a readonly job payload containing validated input, a required URLA, and an optional sales contract. |
| 24 | Defines the job lifecycle status values exposed by the application. |
| 25 | Defines status updates with a message and optional warning list. |
| 26 | Adds the fixed status-message discriminator to worker updates. |
| 27 | Adds a job identifier to the public status view. |
| 28 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 29 | Defines a reusable schema for a string value or null when unknown. |
| 30 | Defines nullable name, phone, and email attributes shared by extracted contacts. |
| 31 | Starts the structured document-extraction result schema. |
| 32 | Restricts extracted loan program to the listed supported/unknown classifications. |
| 33 | Defines nullable source program wording and a bounded loan-purpose classification. |
| 34 | Defines a nullable appraisal product and directs extraction to distinguish explicit requests from evidence-backed recommendations. |
| 35 | Defines nullable property classification and occupancy values. |
| 36 | Defines nullable subject-property address, unit, postal code, city, and state fields. |
| 37 | Defines nullable loan identifiers/type/lien information and a positive nullable loan amount. |
| 38 | Requires a positive sale price or null and describes extracting the contract's stated total without confusing it with loan amount or cash to close. |
| 39 | Defines a positive nullable prior valuation amount and a nullable valuation date. |
| 40 | Applies the contact schema to borrower, co-borrower, listing-agent, and buyer-agent records. |
| 41 | Requires boolean complex-property and prominent-customer flags. |
| 42 | Requires evidence entries with a field name, supported document identifier, positive integer page number, and quotation of at most 300 characters. |
| 43 | Requires an array of extraction warnings. |
| 44 | Ends the extraction-result schema. |
| 45 | Derives the extracted-order TypeScript type from runtime validation. |
| 46 | Defines readonly approved field-plan entries with a value, control kind, optional required flag, and approved label aliases. |
| 47 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 48 | Starts the explicit property-description alias table for inspected R3 options. |
| 49 | Maps common single-family descriptions to the Single Family option. |
| 50 | Maps explicit single-family detached descriptions to the Single Family option. |
| 51 | Maps detached-single-family word orders and the SFR abbreviation to Single Family. |
| 52 | Maps condo/condominium descriptions to Condominium. |
| 53 | Maps manufactured-housing descriptions to Manufactured Home. |
| 54 | Maps numeric two-to-four-unit descriptions to Two To Four Family. |
| 55 | Maps spelled-out two-to-four-family/unit descriptions to Two To Four Family. |
| 56 | Maps townhouse, townhome, and rowhouse descriptions to Townhouse or Rowhouse. |
| 57 | Ends the property alias table. |
| 58 | Starts the occupancy-label alias table. |
| 59 | Maps primary-residence and owner-occupied wording to the primary owner-occupancy option. |
| 60 | Maps second-home wording to the secondary owner-residence option. |
| 61 | Maps tenant-occupied and vacant descriptions to their respective occupancy options. |
| 62 | Ends the occupancy alias table. |
| 63 | Defines nullable label normalization using a caller-supplied alias map. |
| 64 | Preserves null; otherwise looks up trimmed lowercase wording and falls back to the original value. |
| 65 | Ends the general label-normalization helper. |
| 66 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 67 | Documents that property classification requires an explicit description, not isolated unit count or project status. |
| 68 | Defines the property-type normalizer for nullable extracted wording. |
| 69 | Trims and lowercases the description, replaces supported hyphen/dash characters with spaces, and collapses whitespace. |
| 70 | Returns a known property option only for an explicit alias match, otherwise null. |
| 71 | Ends property-type normalization. |
| 72 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 73 | Documents that baseline product inference is limited to inspected property/program combinations. |
| 74 | Defines baseline appraisal-product selection from normalized property type and loan classification. |
| 75 | Starts the mapping from R3 property labels to baseline-product table categories. |
| 76 | Maps the four supported property options to their baseline category keys. |
| 77 | Ends the property-to-product-category mapping. |
| 78 | Looks up a baseline category only when a property type is available. |
| 79 | Supports conventional programs and FHA-prefixed programs for automatic baseline selection. |
| 80 | Returns the corresponding observed product when both keys are supported, otherwise null. |
| 81 | Ends baseline product selection. |
| 82 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 83 | Documents that appraisal recommendations need bounded approval separate from extracted facts. |
| 84 | Defines product selection using extracted data, normalized property type, contract availability, and an accumulating warning list. |
| 85 | Trims the extracted/requested product and converts an empty result to null. |
| 86 | Collects evidence entries explicitly marked as product recommendations. |
| 87 | Collects evidence entries explicitly marked as requested appraisal products. |
| 88 | Starts a predicate requiring at least one supporting evidence entry. |
| 89 | Requires every evidence quote to be nonblank and to cite URLA or an actually supplied sales contract. |
| 90 | Explains why the presence of recommendation markers must force the stricter recommendation branch. |
| 91 | Begins validation when recommendation evidence exists. |
| 92 | Defines case/whitespace normalization for appraisal-product label comparison. |
| 93 | Normalizes the requested label and its approved aliases, or uses an empty candidate list. |
| 94 | Limits recommendation matching to conventional or FHA program categories. |
| 95 | Starts searching observed baseline products when a supported program exists. |
| 96 | Chooses the first program-specific observed label matching the normalized request or its aliases. |
| 97 | Computes the baseline implied by the normalized property type and loan program. |
| 98 | Accepts missing property wording, but otherwise requires a known property baseline equal to the candidate product. |
| 99 | Rejects recommendations missing a request, valid evidence, unique recommendation status, a known candidate, or property consistency. |
| 100 | Adds a review warning explaining unsupported or conflicting product recommendations. |
| 101 | Leaves the product unresolved when recommendation checks fail. |
| 102 | Ends rejection of unsupported recommendations. |
| 103 | Warns that the accepted product is an agent recommendation requiring property/lender review. |
| 104 | Returns the supported requested recommendation label. |
| 105 | Ends the recommendation-evidence branch. |
| 106 | Begins handling a stated product without recommendation markers. |
| 107 | Accepts the stated product when explicit-request evidence passes the support check. |
| 108 | Adds a warning when the stated product lacks a usable document citation. |
| 109 | Leaves an unsupported stated product unresolved. |
| 110 | Ends explicit-product handling. |
| 111 | Computes a baseline product when no product was stated. |
| 112 | Adds a lender-requirements review warning when automatic baseline selection succeeds. |
| 113 | Returns the selected baseline or null. |
| 114 | Ends appraisal-product selection. |
| 115 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 116 | Documents that loan business rules run before opening the R3 sign-in browser. |
| 117 | Defines validation of extracted loan facts against user inputs. |
| 118 | Detects VA classification from either the structured program or the source program wording. |
| 119 | Rejects VA work with a coded error directing the user to the VA portal. |
| 120 | Ends the VA rejection branch. |
| 121 | Detects unknown loan-program or loan-purpose classifications. |
| 122 | Rejects unresolved classification and requests a legible complete URLA. |
| 123 | Ends the unknown-classification branch. |
| 124 | Checks URLA evidence for loan program and loan purpose in turn. |
| 125 | Requires a matching field citation from the URLA with a nonblank quote. |
| 126 | Rejects classifications that lack supporting URLA evidence. |
| 127 | Ends rejection of a missing classification citation. |
| 128 | Ends the required-classification evidence loop. |
| 129 | Detects FHA classification or source wording when the user supplied no FHA case number. |
| 130 | Rejects FHA and FHA Zero Down preparation without a case number. |
| 131 | Ends the FHA case-number requirement branch. |
| 132 | Ends loan business-rule validation. |
| 133 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 134 | Documents that this builder defines all browser-writable values and leaves unknown facts blank. |
| 135 | Defines approved field-plan construction and its plan, warnings, and missing-required-field result. |
| 136 | Applies loan validation before producing any browser field values. |
| 137 | Creates the ordered list of approved field entries. |
| 138 | Creates the list of unresolved required field keys. |
| 139 | Starts warnings with mandatory source-document review and up to twelve extracted warnings truncated to 500 characters each. |
| 140 | Normalizes the extracted property description to a known R3 option. |
| 141 | Warns when a nonblank property description cannot map to an inspected option. |
| 142 | Selects the appraisal product while accumulating any recommendation/evidence warnings. |
| 143 | Defines the entry-adding helper with text/default optional settings and optional approved dropdown aliases. |
| 144 | Begins handling unknown or empty values. |
| 145 | Begins required-value handling for an absent value. |
| 146 | Records the missing required field key. |
| 147 | Adds a warning instructing the user to complete that missing fact during review. |
| 148 | Ends missing-required-value reporting. |
| 149 | Adds an explicit blank only for an optional text field, so stale defaults can be cleared. |
| 150 | Stops adding the current value after absent-value handling. |
| 151 | Ends the absent-value branch. |
| 152 | Appends a populated entry, converting numbers to strings and carrying its kind/required flag. |
| 153 | Includes approved aliases only when the alias list is nonempty, then completes the entry insertion. |
| 154 | Ends the entry-adding helper. |
| 155 | Requires the configured Guild Summerlin branch dropdown value. |
| 156 | Adds the required selected appraisal product with its constrained alternate labels when available. |
| 157 | Adds the required normalized property-type selection. |
| 158 | Normalizes extracted occupancy through the known label aliases. |
| 159 | Adds required occupancy, mapping investment-property wording to Unknown rather than inferring tenant/vacant status. |
| 160 | Warns that investment classification alone does not determine tenant versus vacant occupancy. |
| 161 | Adds each property-address component, making state a dropdown and every component except unit required. |
| 162 | Sets the optional county dropdown to Unknown. |
| 163 | Adds the user's loan number as a required text value. |
| 164 | Adds the extracted secondary loan number as optional text. |
| 165 | Adds the extracted loan purpose as a required dropdown selection. |
| 166 | Explains that evidence-backed program classification controls loan type instead of free-form loan text. |
| 167 | Converts conventional or FHA-prefixed program classification into a supported R3 loan-type label, otherwise null. |
| 168 | Adds the resulting loan type as a required dropdown entry. |
| 169 | Adds the user-supplied FHA case number and marks it required for FHA-prefixed programs. |
| 170 | Maps first/second lien aliases into an optional dropdown entry and adds the extracted loan amount as required text. |
| 171 | Adds a required sale price only for purchases with a supplied contract. |
| 172 | Adds optional prior valuation amount and converts an ISO-formatted prior valuation date to month/day/year while preserving other supplied formats. |
| 173 | Defines a helper for adding a contact section with optional overall requiredness. |
| 174 | Lists the six contact attributes that will be processed in a fixed order. |
| 175 | Starts with no known phone/email reachability for the contact. |
| 176 | Iterates through the supported contact attributes. |
| 177 | Trims the contact attribute and treats absent or blank values as unknown. |
| 178 | Identifies first and last names separately from communication details. |
| 179 | Marks the contact reachable when any non-name field contains a value. |
| 180 | Documents that any supported phone or email is sufficient and missing phone categories are not fabricated. |
| 181 | Adds the contact attribute, requiring names and supplied communication fields only when the contact is required. |
| 182 | Explains that missing required names still require review while stale copied/account names must be cleared. |
| 183 | Adds an optional explicit blank to clear a missing required name after recording its absence. |
| 184 | Ends the contact-attribute loop. |
| 185 | Checks whether a required contact lacks every supported phone/email value. |
| 186 | Records a synthetic phoneOrEmail missing-field key for the contact section. |
| 187 | Warns the user to supply contact reachability during review. |
| 188 | Ends missing-reachability reporting. |
| 189 | Ends the contact-section helper. |
| 190 | Adds the borrower as a required contact. |
| 191 | Adds optional co-borrower details. |
| 192 | Requires the borrower-as-access-contact checkbox to reflect whether the loan is a refinance. |
| 193 | Adds a required access contact using the borrower for refinance, listing agent for purchase, or unresolved values for other purposes. |
| 194 | Iterates through listing-agent and buyer-agent sections. |
| 195 | Adds an optional agent section only when at least one of its extracted values is nonblank. |
| 196 | Ends optional agent-section processing. |
| 197 | Documents that the user-configured loan officer applies independently of document extraction. |
| 198 | Requires Amber as the loan officer's first name. |
| 199 | Requires Coleman as the loan officer's last name. |
| 200 | Requires the configured loan-officer work phone. |
| 201 | Requires the configured loan-officer email address. |
| 202 | Adds the user's rush-order setting as a required checkbox value. |
| 203 | Adds the extracted complex-property and prominent-customer flags as optional checkbox entries. |
| 204 | Explicitly disables side-by-side ordering and requires the user's payment-method selection. |
| 205 | Requires the configured team name in the status-contact first-name field. |
| 206 | Requires the configured team email in the status-contact email field. |
| 207 | Explains that explicit empty entries clear account defaults from the new order. |
| 208 | Iterates through unsupported/unprovided identifiers, access and scheduling fields, management notes, and selected status-contact fields to clear them. |
| 209 | Adds an optional empty text entry for the current field to remove any existing default. |
| 210 | Ends the explicit-blank field loop. |
| 211 | Explicitly clears sale price whenever the job is not a purchase with a supplied contract. |
| 212 | Returns the assembled approved plan, accumulated warnings, and unresolved required field keys. |
| 213 | Ends field-plan construction. |
| 214 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 215 | Defines validation of an uploaded PDF's size and signature. |
| 216 | Rejects buffers over fifteen mebibytes, under ten bytes, or without a PDF signature in their first 1024 bytes. |
| 217 | Throws the coded invalid-PDF error with the upload-size requirement. |
| 218 | Ends invalid-PDF rejection. |
| 219 | Ends uploaded-PDF validation. |
