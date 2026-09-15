import { toJsonSchema, type JSONSchema } from '@langchain/core/utils/json_schema';
import { extractionSchema } from './domain.js';

type SchemaObject = Record<string, unknown>;
const asObject = (value: unknown): SchemaObject | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as SchemaObject : undefined;

// Inline reuse keeps schema traversal and response normalization on identical paths.
const canonicalSchema = toJsonSchema(extractionSchema, { reused: 'inline' });
const missingTextDescription = 'Return an empty string when this text is unavailable or uncertain; never invent it.';

function isNullableText(schema: SchemaObject): boolean {
  return Array.isArray(schema.type) && schema.type.length === 2
    && schema.type.includes('string') && schema.type.includes('null')
    && !('enum' in schema) && !('const' in schema);
}

function adaptSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(adaptSchema);
  const schema = asObject(value);
  if (!schema) return value;
  const adapted = Object.fromEntries(Object.entries(schema).map(([key, child]) => [key, adaptSchema(child)]));
  if (isNullableText(schema)) {
    adapted.type = 'string';
    adapted.description = [schema.description, missingTextDescription].filter(value => typeof value === 'string').join(' ');
  }
  return adapted;
}

/** Anthropic permits at most 16 union parameters; missing text uses a wire-only sentinel. */
export const anthropicExtractionSchema = adaptSchema(canonicalSchema) as JSONSchema;

function normalize(value: unknown, schemaValue: unknown): unknown {
  const schema = asObject(schemaValue);
  if (!schema) return value;
  if (isNullableText(schema) && typeof value === 'string' && value.trim() === '') return null;
  if (Array.isArray(value) && schema.items) return value.map(item => normalize(item, schema.items));
  const record = asObject(value);
  const properties = asObject(schema.properties);
  if (record && properties) {
    return Object.fromEntries(Object.entries(record).map(([key, child]) => [key,
      Object.hasOwn(properties, key) ? normalize(child, properties[key]) : child]));
  }
  return value;
}

/** Only canonical nullable text fields are decoded; missing fields and invalid types stay invalid. */
export function normalizeAnthropicExtraction(value: unknown): unknown {
  return normalize(value, canonicalSchema);
}
