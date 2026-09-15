// [L1] Imports toJsonSchema, type JSONSchema from @langchain/core/utils/json_schema for Zod-to-JSON-Schema conversion and its schema type.
import { toJsonSchema } from '@langchain/core/utils/json_schema';
// [L2] Imports extractionSchema from ./domain.js for shared validated application data, business rules, defaults, and domain types.
import { extractionSchema } from './domain.js';
// [L5] Returns non-null, nonarray objects as schema records and rejects other values as undefined.
const asObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
// [L6] Blank line separating the surrounding declarations, statements, or document blocks.
// [L7] Existing explanatory comment: Inline reuse keeps schema traversal and response normalization on identical paths.
// Inline reuse keeps schema traversal and response normalization on identical paths.
// [L8] Converts the canonical Zod extraction schema into JSON Schema with repeated definitions inlined.
const canonicalSchema = toJsonSchema(extractionSchema, { reused: 'inline' });
// [L9] Defines the extra instruction telling Anthropic to use an empty-string sentinel for missing nullable text.
const missingTextDescription = 'Return an empty string when this text is unavailable or uncertain; never invent it.';
// [L10] Blank line separating the surrounding declarations, statements, or document blocks.
// [L11] Defines detection of schema nodes representing unconstrained nullable text.
function isNullableText(schema) {
    // [L12] Requires the schema type to be an array containing exactly two alternatives.
    return Array.isArray(schema.type) && schema.type.length === 2
        // [L13] Requires those two alternatives to be string and null.
        && schema.type.includes('string') && schema.type.includes('null')
        // [L14] Excludes enum and constant constraints so only ordinary nullable text receives sentinel adaptation.
        && !('enum' in schema) && !('const' in schema);
    // [L15] Closes the scope or expression introduced here: Defines detection of schema nodes representing unconstrained nullable text.
}
// [L16] Blank line separating the surrounding declarations, statements, or document blocks.
// [L17] Defines recursive conversion of canonical schema values to Anthropic's wire schema.
function adaptSchema(value) {
    // [L18] Recursively adapts each array item when traversing schema arrays.
    if (Array.isArray(value))
        return value.map(adaptSchema);
    // [L19] Attempts to interpret the current value as a schema object.
    const schema = asObject(value);
    // [L20] Leaves primitive and unsupported nonobject schema values unchanged.
    if (!schema)
        return value;
    // [L21] Recursively adapts every property of this schema object into a new object.
    const adapted = Object.fromEntries(Object.entries(schema).map(([key, child]) => [key, adaptSchema(child)]));
    // [L22] Applies the text-sentinel change only to canonical nullable-text schema nodes.
    if (isNullableText(schema)) {
        // [L23] Changes nullable text's wire type to string, removing that string/null union.
        adapted.type = 'string';
        // [L24] Combines any existing textual description with the missing-text sentinel instruction.
        adapted.description = [schema.description, missingTextDescription].filter(value => typeof value === 'string').join(' ');
        // [L25] Closes the scope or expression introduced here: Applies the text-sentinel change only to canonical nullable-text schema nodes.
    }
    // [L26] Returns the recursively adapted schema object.
    return adapted;
    // [L27] Closes the scope or expression introduced here: Defines recursive conversion of canonical schema values to Anthropic's wire schema.
}
// [L28] Blank line separating the surrounding declarations, statements, or document blocks.
// [L29] Existing explanatory comment: Anthropic permits at most 16 union parameters; missing text uses a wire-only sentinel.
/** Anthropic permits at most 16 union parameters; missing text uses a wire-only sentinel. */
// [L30] Exports the Anthropic-specific JSON schema produced from the canonical extraction schema.
export const anthropicExtractionSchema = adaptSchema(canonicalSchema);
// [L31] Blank line separating the surrounding declarations, statements, or document blocks.
// [L32] Defines schema-guided normalization of provider output back to canonical values.
function normalize(value, schemaValue) {
    // [L33] Interprets the corresponding canonical schema node as an object when possible.
    const schema = asObject(schemaValue);
    // [L34] Leaves output unchanged where no usable schema object exists.
    if (!schema)
        return value;
    // [L35] Converts only whitespace-only strings at canonical nullable-text fields back to null.
    if (isNullableText(schema) && typeof value === 'string' && value.trim() === '')
        return null;
    // [L36] Recursively normalizes array elements using the canonical item schema when available.
    if (Array.isArray(value) && schema.items)
        return value.map(item => normalize(item, schema.items));
    // [L37] Interprets the current output value as an object for property-level traversal.
    const record = asObject(value);
    // [L38] Reads the canonical schema's property definitions as an object.
    const properties = asObject(schema.properties);
    // [L39] Traverses output properties only when both output and schema properties are objects.
    if (record && properties) {
        // [L40] Rebuilds the output object by preserving each property name and choosing its normalized value.
        return Object.fromEntries(Object.entries(record).map(([key, child]) => [key,
            // [L41] Recurses through known own schema properties while leaving unknown output properties unchanged for later validation.
            Object.hasOwn(properties, key) ? normalize(child, properties[key]) : child]));
        // [L42] Closes the scope or expression introduced here: Traverses output properties only when both output and schema properties are objects.
    }
    // [L43] Leaves values unchanged when no array, nullable-text, or object normalization applies.
    return value;
    // [L44] Closes the scope or expression introduced here: Defines schema-guided normalization of provider output back to canonical values.
}
// [L45] Blank line separating the surrounding declarations, statements, or document blocks.
// [L46] Existing explanatory comment: Only canonical nullable text fields are decoded; missing fields and invalid types stay invalid.
/** Only canonical nullable text fields are decoded; missing fields and invalid types stay invalid. */
// [L47] Exports normalization of Anthropic's extraction response without validating or inventing missing fields.
export function normalizeAnthropicExtraction(value) {
    // [L48] Runs the normalization traversal against the unchanged canonical schema.
    return normalize(value, canonicalSchema);
    // [L49] Closes the scope or expression introduced here: Exports normalization of Anthropic's extraction response without validating or inventing missing fields.
}
//# sourceMappingURL=extraction-schema.js.map