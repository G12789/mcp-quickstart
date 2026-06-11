/**
 * curl -> MCP tool.
 *
 * Paste a `curl ...` command (the kind you copy from browser devtools or API
 * docs) and get a working MCP server with a single tool that fires that
 * request. Query params and the request body become overridable tool inputs;
 * auth-looking headers are moved to environment variables instead of being
 * baked into the generated code.
 *
 * Reuses the typescript-openapi template (same {{TOOLS}}/{{BASE_URL}} injection).
 */
import { readFileSync, existsSync } from "node:fs";
import { toIdentifier, escapeForJs } from "./openapi.js";
import { inferZodFromValue } from "./schema.js";

const VALUE_FLAGS = new Set([
  "-X",
  "--request",
  "-H",
  "--header",
  "-d",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-ascii",
  "--data-urlencode",
  "-A",
  "--user-agent",
  "-e",
  "--referer",
  "-b",
  "--cookie",
  "-u",
  "--user",
  "--url",
]);

const AUTH_HEADER_NAMES = new Set([
  "authorization",
  "x-api-key",
  "api-key",
  "apikey",
  "x-auth-token",
  "x-access-token",
  "token",
]);

/** Tokenize a shell-ish command respecting quotes and line continuations. */
export function tokenize(input) {
  const s = String(input).replace(/\\\r?\n/g, " ");
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let tok = "";
    while (i < s.length && !/\s/.test(s[i])) {
      const c = s[i];
      if (c === "'") {
        i++;
        while (i < s.length && s[i] !== "'") tok += s[i++];
        i++;
      } else if (c === '"') {
        i++;
        while (i < s.length && s[i] !== '"') {
          if (s[i] === "\\" && i + 1 < s.length) {
            tok += s[i + 1];
            i += 2;
          } else {
            tok += s[i++];
          }
        }
        i++;
      } else {
        tok += c;
        i++;
      }
    }
    tokens.push(tok);
  }
  return tokens;
}

export function parseCurl(input) {
  let tokens = tokenize(input);
  if (tokens[0] === "curl") tokens = tokens.slice(1);

  let method = null;
  let url = null;
  const headers = {};
  let body;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const takesValue = VALUE_FLAGS.has(t);
    const value = takesValue ? tokens[++i] : undefined;

    if (t === "-X" || t === "--request") {
      method = (value || "").toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const idx = (value || "").indexOf(":");
      if (idx > -1) {
        const name = value.slice(0, idx).trim();
        const val = value.slice(idx + 1).trim();
        if (name) headers[name] = val;
      }
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-ascii" || t === "--data-urlencode") {
      body = body === undefined ? value : `${body}&${value}`;
    } else if (t === "--url") {
      url = value;
    } else if (t === "-A" || t === "--user-agent") {
      headers["User-Agent"] = value;
    } else if (t === "-e" || t === "--referer") {
      headers["Referer"] = value;
    } else if (t === "-b" || t === "--cookie") {
      headers["Cookie"] = value;
    } else if (t === "-u" || t === "--user") {
      // basic auth -> treat as auth header handled via env
      headers["Authorization"] = "Basic <from env>";
    } else if (!t.startsWith("-")) {
      if (!url) url = t;
    }
    // other boolean flags (-s, -L, -k, --compressed, -i, -v, ...) are ignored
  }

  if (!url) throw new Error("Could not find a URL in the curl command.");
  if (!method) method = body !== undefined ? "POST" : "GET";

  return { method, url, headers, body };
}

/** Build the template variables for a curl import. */
export function buildCurlVars(source) {
  const raw = existsSync(source) ? readFileSync(source, "utf8") : source;
  const { method, url, headers, body } = parseCurl(raw);

  const u = new URL(url);
  const baseUrl = `${u.protocol}//${u.host}`;
  const path = u.pathname || "/";

  const queryParams = [...u.searchParams.keys()];
  const defaultQuery = {};
  for (const [k, v] of u.searchParams.entries()) defaultQuery[k] = v;

  // Split headers: auth-looking ones go to env, the rest are baked in.
  let authHeaderName = "";
  const staticHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (AUTH_HEADER_NAMES.has(name.toLowerCase())) {
      authHeaderName = name; // value intentionally dropped — set it in .env
    } else if (name.toLowerCase() !== "content-type") {
      staticHeaders[name] = value;
    }
  }

  const hasBody = body !== undefined;
  let defaultBody;
  if (hasBody) {
    try {
      defaultBody = JSON.parse(body);
    } catch {
      defaultBody = body; // keep raw (e.g. form-encoded)
    }
  }

  const lastSeg = path.split("/").filter(Boolean).pop() || "endpoint";
  const toolName = toIdentifier(`${method}_${lastSeg}`.toLowerCase());
  const description = escapeForJs(`${method} ${path} (imported from curl)`);

  const fields = [];
  for (const q of queryParams) {
    fields.push(`${JSON.stringify(q)}: z.string().optional().describe("query param")`);
  }
  if (hasBody) {
    fields.push(`"body": ${inferZodFromValue(defaultBody)}.optional().describe("override the request body")`);
  }
  const schema = fields.length ? `{\n      ${fields.join(",\n      ")}\n    }` : "{}";

  const tools = `server.registerTool(
  ${JSON.stringify(toolName)},
  {
    title: ${JSON.stringify(toolName)},
    description: ${JSON.stringify(description)},
    inputSchema: ${schema},
  },
  async (args) => {
    const r = await callEndpoint(
      {
        method: ${JSON.stringify(method)},
        pathTemplate: ${JSON.stringify(path)},
        pathParams: [],
        queryParams: ${JSON.stringify(queryParams)},
        hasBody: ${hasBody},
        headers: ${JSON.stringify(staticHeaders)},
        defaultQuery: ${JSON.stringify(defaultQuery)},
        defaultBody: ${defaultBody === undefined ? "undefined" : JSON.stringify(defaultBody)},
      },
      args as Record<string, unknown>
    );
    return { content: [{ type: "text", text: r.text }] };
  }
);`;

  return {
    TOOLS: tools,
    BASE_URL: baseUrl,
    API_TITLE: u.host,
    AUTH_HEADER: authHeaderName,
    TOOL_COUNT: "1",
    toolCount: 1,
  };
}
