/**
 * OpenAPI -> MCP tools.
 *
 * Loads an OpenAPI 3.x document (JSON or YAML, from a local path or a URL),
 * turns every operation into an MCP tool definition, and generates the
 * TypeScript source that registers those tools against a generic HTTP helper.
 * Parameters and request bodies are expanded into per-field zod schemas via
 * ./schema.js (with $ref resolution), not opaque records.
 *
 * This is the piece that makes mcp-quickstart different from every other
 * scaffolder: you point it at an existing API and get a working MCP server,
 * instead of an empty template you have to fill in by hand.
 */
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { resolveRef, schemaToZod } from "./schema.js";

export async function loadSpec(source) {
  let raw;
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch spec: HTTP ${res.status}`);
    raw = await res.text();
  } else {
    raw = readFileSync(source, "utf8");
  }
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{")) return JSON.parse(raw);
  return yaml.load(raw);
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

export function toIdentifier(str) {
  const cleaned = String(str)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!cleaned) return "op";
  return /^[0-9]/.test(cleaned) ? `op_${cleaned}` : cleaned;
}

function uniqueName(base, used) {
  let name = base;
  let i = 2;
  while (used.has(name)) {
    name = `${base}_${i++}`;
  }
  used.add(name);
  return name;
}

function getRequestBodySchema(op, spec) {
  let rb = op.requestBody;
  if (!rb) return undefined;
  if (rb.$ref) rb = resolveRef(spec, rb.$ref) || {};
  const content = rb.content || {};
  const json =
    content["application/json"] ||
    content["application/*+json"] ||
    Object.values(content)[0];
  return json && json.schema;
}

export function escapeForJs(str) {
  return String(str || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim();
}

/**
 * Parse an OpenAPI document into a flat list of tool descriptors.
 */
export function specToTools(spec) {
  const tools = [];
  const used = new Set();
  const paths = spec.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;
    const sharedParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];

    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== "object") continue;

      const rawParams = [...sharedParams, ...(Array.isArray(op.parameters) ? op.parameters : [])];
      const pathParams = [];
      const queryParams = [];
      const fields = [];

      for (let p of rawParams) {
        if (p && p.$ref) p = resolveRef(spec, p.$ref) || {};
        if (!p || !p.name) continue;
        const zod = schemaToZod(p.schema || { type: "string" }, spec);
        const desc = escapeForJs(p.description || `${p.in} parameter`);
        const required = p.required || p.in === "path";
        const field = `${JSON.stringify(p.name)}: ${zod}${required ? "" : ".optional()"}.describe("${desc}")`;
        fields.push(field);
        if (p.in === "path") pathParams.push(p.name);
        else if (p.in === "query") queryParams.push(p.name);
      }

      const hasBody = Boolean(op.requestBody);
      if (hasBody) {
        const bodySchema = getRequestBodySchema(op, spec);
        const bodyZod = bodySchema ? schemaToZod(bodySchema, spec) : "z.record(z.any())";
        fields.push(`"body": ${bodyZod}.optional().describe("JSON request body")`);
      }

      const baseName = toIdentifier(op.operationId || `${method}_${path}`);
      const name = uniqueName(baseName, used);
      const description = escapeForJs(op.summary || op.description || `${method.toUpperCase()} ${path}`);

      tools.push({
        name,
        description,
        method: method.toUpperCase(),
        path,
        pathParams,
        queryParams,
        hasBody,
        fields,
      });
    }
  }

  return tools;
}

function resolveBaseUrl(spec) {
  if (Array.isArray(spec.servers) && spec.servers[0] && spec.servers[0].url) {
    return spec.servers[0].url;
  }
  return "https://api.example.com";
}

/**
 * Generate the TypeScript that registers every tool. Returned as a string that
 * gets injected into the template via the {{TOOLS}} placeholder.
 */
export function generateToolsCode(tools) {
  return tools
    .map((t) => {
      const schema = t.fields.length
        ? `{\n      ${t.fields.join(",\n      ")}\n    }`
        : "{}";
      return `server.registerTool(
  ${JSON.stringify(t.name)},
  {
    title: ${JSON.stringify(t.name)},
    description: ${JSON.stringify(t.description)},
    inputSchema: ${schema},
  },
  async (args) => {
    const r = await callEndpoint(
      {
        method: ${JSON.stringify(t.method)},
        pathTemplate: ${JSON.stringify(t.path)},
        pathParams: ${JSON.stringify(t.pathParams)},
        queryParams: ${JSON.stringify(t.queryParams)},
        hasBody: ${t.hasBody},
      },
      args as Record<string, unknown>
    );
    return { content: [{ type: "text", text: r.text }] };
  }
);`;
    })
    .join("\n\n");
}

/**
 * Build the full set of template variables for the openapi template.
 */
export async function buildOpenApiVars(source) {
  const spec = await loadSpec(source);
  if (!spec || !spec.paths) {
    throw new Error("Not a valid OpenAPI document (no `paths` found).");
  }
  const tools = specToTools(spec);
  if (tools.length === 0) {
    throw new Error("No operations found in the OpenAPI document.");
  }
  return {
    TOOLS: generateToolsCode(tools),
    BASE_URL: resolveBaseUrl(spec),
    API_TITLE: (spec.info && spec.info.title) || "API",
    AUTH_HEADER: "",
    TOOL_COUNT: String(tools.length),
    toolCount: tools.length,
  };
}
