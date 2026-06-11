/**
 * JSON Schema / OpenAPI schema -> zod source string.
 *
 * Used to expand request bodies and parameters into per-field typed inputs
 * instead of an opaque z.record(z.any()). Handles $ref resolution, nested
 * objects, arrays, enums and allOf, with cycle and depth guards so a recursive
 * schema can never blow up the generator.
 *
 * Output is a single-line zod expression (no newlines) so it can be injected
 * anywhere without worrying about indentation.
 */

const DEFAULT_MAX_DEPTH = 6;

export function resolveRef(spec, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let cur = spec;
  for (const p of parts) {
    const key = p.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function jsonKey(k) {
  return JSON.stringify(String(k));
}

function mergeAllOf(list, spec, seen, depth) {
  const merged = { type: "object", properties: {}, required: [] };
  for (let sub of list) {
    if (sub && sub.$ref) sub = resolveRef(spec, sub.$ref) || {};
    if (sub && sub.properties) Object.assign(merged.properties, sub.properties);
    if (sub && Array.isArray(sub.required)) merged.required.push(...sub.required);
  }
  return merged;
}

/**
 * Convert an OpenAPI/JSON schema into a zod expression string.
 * @param {object} schema  the schema node
 * @param {object} spec    the full document (for $ref resolution)
 */
export function schemaToZod(schema, spec, opts = {}) {
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const seen = new Set();

  function build(s, depth) {
    if (!s || typeof s !== "object") return "z.any()";

    if (s.$ref) {
      if (seen.has(s.$ref) || depth >= maxDepth) return "z.any()";
      seen.add(s.$ref);
      const resolved = resolveRef(spec, s.$ref) || {};
      const out = build(resolved, depth + 1);
      seen.delete(s.$ref);
      return out;
    }

    if (Array.isArray(s.allOf) && s.allOf.length) {
      return build(mergeAllOf(s.allOf, spec, seen, depth), depth);
    }
    if (Array.isArray(s.oneOf) && s.oneOf.length) {
      return build(s.oneOf[0], depth);
    }
    if (Array.isArray(s.anyOf) && s.anyOf.length) {
      return build(s.anyOf[0], depth);
    }

    if (Array.isArray(s.enum) && s.enum.length && s.enum.every((e) => typeof e === "string")) {
      return `z.enum([${s.enum.map((e) => JSON.stringify(e)).join(", ")}])`;
    }

    const type = s.type || (s.properties ? "object" : undefined);
    let zod;
    switch (type) {
      case "object": {
        const props = s.properties || {};
        const required = new Set(Array.isArray(s.required) ? s.required : []);
        const entries = Object.entries(props);
        if (entries.length === 0 || depth >= maxDepth) {
          zod = "z.record(z.any())";
          break;
        }
        const fields = entries.map(([k, v]) => {
          let f = build(v, depth + 1);
          if (!required.has(k)) f += ".optional()";
          return `${jsonKey(k)}: ${f}`;
        });
        zod = `z.object({ ${fields.join(", ")} })`;
        break;
      }
      case "array": {
        const items = depth >= maxDepth ? "z.any()" : build(s.items || {}, depth + 1);
        zod = `z.array(${items})`;
        break;
      }
      case "integer":
      case "number":
        zod = "z.number()";
        break;
      case "boolean":
        zod = "z.boolean()";
        break;
      case "string":
        zod = "z.string()";
        break;
      default:
        zod = "z.any()";
    }

    if (s.nullable) zod += ".nullable()";
    return zod;
  }

  return build(schema, 0);
}

/**
 * Infer a zod expression from a concrete JSON value (used by --from-curl, where
 * there is no schema — only the example body from the curl command).
 */
export function inferZodFromValue(value, depth = 0) {
  if (depth >= DEFAULT_MAX_DEPTH) return "z.any()";
  if (value === null || value === undefined) return "z.any()";
  if (Array.isArray(value)) {
    const inner = value.length ? inferZodFromValue(value[0], depth + 1) : "z.any()";
    return `z.array(${inner})`;
  }
  switch (typeof value) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "object": {
      const entries = Object.entries(value);
      if (!entries.length) return "z.record(z.any())";
      const fields = entries.map(
        ([k, v]) => `${jsonKey(k)}: ${inferZodFromValue(v, depth + 1)}.optional()`
      );
      return `z.object({ ${fields.join(", ")} })`;
    }
    default:
      return "z.any()";
  }
}
