/**
 * Generic HTTP caller shared by every generated tool.
 *
 * Configure at runtime with environment variables:
 *   API_BASE_URL      base URL (defaults to the spec's server URL)
 *   API_AUTH_HEADER   name of an auth header, e.g. "Authorization" or "X-API-Key"
 *   API_AUTH_VALUE    its value, e.g. "Bearer xxx" or your key
 */
export const BASE_URL = process.env.API_BASE_URL || "{{BASE_URL}}";

export interface EndpointOptions {
  method: string;
  pathTemplate: string;
  pathParams: string[];
  queryParams: string[];
  hasBody: boolean;
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
  for (const q of opts.queryParams) {
    const v = args[q];
    if (v !== undefined && v !== null) url.searchParams.set(q, String(v));
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  const authHeader = process.env.API_AUTH_HEADER;
  const authValue = process.env.API_AUTH_VALUE;
  if (authHeader && authValue) headers[authHeader] = authValue;

  const init: RequestInit = { method: opts.method, headers };
  if (opts.hasBody && args.body !== undefined) {
    init.body = JSON.stringify(args.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}
