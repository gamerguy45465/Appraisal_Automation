# Line explanations: src/extraction-schema.ts

Source: [src/extraction-schema.ts](../../../src/extraction-schema.ts). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Imports toJsonSchema, type JSONSchema from @langchain/core/utils/json_schema for Zod-to-JSON-Schema conversion and its schema type. |
| 2 | Imports extractionSchema from ./domain.js for shared validated application data, business rules, defaults, and domain types. |
| 3 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 4 | Defines the generic object representation used while traversing JSON Schema values. |
| 5 | Returns non-null, nonarray objects as schema records and rejects other values as undefined. |
| 6 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 7 | Existing explanatory comment: Inline reuse keeps schema traversal and response normalization on identical paths. |
| 8 | Converts the canonical Zod extraction schema into JSON Schema with repeated definitions inlined. |
| 9 | Defines the extra instruction telling Anthropic to use an empty-string sentinel for missing nullable text. |
| 10 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 11 | Defines detection of schema nodes representing unconstrained nullable text. |
| 12 | Requires the schema type to be an array containing exactly two alternatives. |
| 13 | Requires those two alternatives to be string and null. |
| 14 | Excludes enum and constant constraints so only ordinary nullable text receives sentinel adaptation. |
| 15 | Closes the scope or expression introduced here: Defines detection of schema nodes representing unconstrained nullable text. |
| 16 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 17 | Defines recursive conversion of canonical schema values to Anthropic's wire schema. |
| 18 | Recursively adapts each array item when traversing schema arrays. |
| 19 | Attempts to interpret the current value as a schema object. |
| 20 | Leaves primitive and unsupported nonobject schema values unchanged. |
| 21 | Recursively adapts every property of this schema object into a new object. |
| 22 | Applies the text-sentinel change only to canonical nullable-text schema nodes. |
| 23 | Changes nullable text's wire type to string, removing that string/null union. |
| 24 | Combines any existing textual description with the missing-text sentinel instruction. |
| 25 | Closes the scope or expression introduced here: Applies the text-sentinel change only to canonical nullable-text schema nodes. |
| 26 | Returns the recursively adapted schema object. |
| 27 | Closes the scope or expression introduced here: Defines recursive conversion of canonical schema values to Anthropic's wire schema. |
| 28 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 29 | Existing explanatory comment: Anthropic permits at most 16 union parameters; missing text uses a wire-only sentinel. |
| 30 | Exports the Anthropic-specific JSON schema produced from the canonical extraction schema. |
| 31 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 32 | Defines schema-guided normalization of provider output back to canonical values. |
| 33 | Interprets the corresponding canonical schema node as an object when possible. |
| 34 | Leaves output unchanged where no usable schema object exists. |
| 35 | Converts only whitespace-only strings at canonical nullable-text fields back to null. |
| 36 | Recursively normalizes array elements using the canonical item schema when available. |
| 37 | Interprets the current output value as an object for property-level traversal. |
| 38 | Reads the canonical schema's property definitions as an object. |
| 39 | Traverses output properties only when both output and schema properties are objects. |
| 40 | Rebuilds the output object by preserving each property name and choosing its normalized value. |
| 41 | Recurses through known own schema properties while leaving unknown output properties unchanged for later validation. |
| 42 | Closes the scope or expression introduced here: Traverses output properties only when both output and schema properties are objects. |
| 43 | Leaves values unchanged when no array, nullable-text, or object normalization applies. |
| 44 | Closes the scope or expression introduced here: Defines schema-guided normalization of provider output back to canonical values. |
| 45 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 46 | Existing explanatory comment: Only canonical nullable text fields are decoded; missing fields and invalid types stay invalid. |
| 47 | Exports normalization of Anthropic's extraction response without validating or inventing missing fields. |
| 48 | Runs the normalization traversal against the unchanged canonical schema. |
| 49 | Closes the scope or expression introduced here: Exports normalization of Anthropic's extraction response without validating or inventing missing fields. |
