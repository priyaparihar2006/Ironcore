// Validates the schema subset produced by our health routes. Unknown schema
// constructs fail closed; extend this validator when introducing new schemas.
export function matchesSchema(value: unknown, schema: any): boolean {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  if (Object.keys(schema).some((key) =>
    !['type', 'properties', 'required', 'additionalProperties', 'items'].includes(key))) return false;
  if (Array.isArray(schema.type))
    return schema.type.some((type: string) => matchesSchema(value, { ...schema, type }));
  switch (schema.type) {
    case 'null': return value === null;
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'array': return Array.isArray(value) && value.every((item) => matchesSchema(item, schema.items));
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      const object = value as Record<string, unknown>;
      const properties = schema.properties || {};
      return (schema.required || []).every((key: string) => Object.hasOwn(object, key)) &&
        Object.entries(object).every(([key, item]) => Object.hasOwn(properties, key)
          ? matchesSchema(item, properties[key]) : schema.additionalProperties !== false);
    }
    default: return false;
  }
}
