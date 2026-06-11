/**
 * Generic HTTP caller shared by every generated tool.
 *
 * On Cloudflare Workers, `process.env` is populated from your wrangler vars and
 * secrets (the `nodejs_compat` flag is enabled in wrangler.jsonc):
 *   API_BASE_URL      base URL (defaults to the spec's server URL)
 *   API_AUTH_HEADER   name of an auth header, e.g. "Authorization" or "X-API-Key"
 *   API_AUTH_VALUE    its value, e.g. "Bearer xxx" (set with `wrangler secret put`)
 */
declare const process: { env: Record<string, string | undefined> };

export const BASE_URL = process.env.API_BASE_URL || "{{BASE_URL}}";

export interface EndpointOptions {
  method: string;
  pathTemplate: string;
  pathParams: string[];
  queryParams: string[];
  hasBody: boolean;
  headers?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  defaultBody?: unknown;
}

export async function callEndpoint(
  opts: EndpointOptions,
  args: Record<string, unknown>
): Promise<{ ok: boolean; status: number; text: string }> {
  let path = opts.pathTemplate;
  for (const p of opts.pathParams) {
    path = path.replace(`{${p}}`, encodeURIComponent(String(args[p] ?? "")));
  }

  const url = new URL(BASE_URL.replace(/\/$/, "") + path);
  const query: Record<string, string> = { ...(opts.defaultQuery ?? {}) };
  for (const q of opts.queryParams) {
    const v = args[q];
    if (v !== undefined && v !== null) query[q] = String(v);
  }
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(opts.headers ?? {}),
  };
  const authHeader = process.env.API_AUTH_HEADER;
  const authValue = process.env.API_AUTH_VALUE;
  if (authHeader && authValue) headers[authHeader] = authValue;

  const init: RequestInit = { method: opts.method, headers };
  if (opts.hasBody) {
    const body = args.body !== undefined ? args.body : opts.defaultBody;
    if (body !== undefined) {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}
