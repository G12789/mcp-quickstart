# {{projectName}}

A **remote, API-backed** [MCP](https://modelcontextprotocol.io) server, generated from **{{API_TITLE}}** and deployable to [Cloudflare Workers](https://workers.cloudflare.com) — scaffolded with [mcp-quickstart](https://github.com/G12789/mcp-quickstart).

Every operation became an MCP tool (**{{TOOL_COUNT}} tools**), wired to a small HTTP client. It runs on Cloudflare's stateless `createMcpHandler` (no Durable Objects, **free Workers plan**), so once deployed it's reachable globally by Claude, Cursor or any agent over Streamable HTTP.

## Run locally

```bash
npm install
# point it at the API (defaults to the value baked in from the spec):
echo "API_BASE_URL=https://api.example.com" > .dev.vars
npm run dev          # MCP endpoint at http://localhost:8787/mcp
```

## Deploy to the edge

```bash
npx wrangler login        # one-time
npm run deploy            # → https://{{projectName}}.<you>.workers.dev/mcp
```

### Configure the API + auth

- **Base URL**: edit `vars.API_BASE_URL` in `wrangler.jsonc` (already set from the spec), or override per environment.
- **Auth header** (if the API needs one): set them as secrets so they never touch your code or git:

```bash
npx wrangler secret put API_AUTH_HEADER   # e.g. Authorization
npx wrangler secret put API_AUTH_VALUE    # e.g. Bearer YOUR_TOKEN
```

## Connect it

### Cursor — `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "url": "https://{{projectName}}.<you>.workers.dev/mcp"
    }
  }
}
```

### Claude / other clients

Point any remote-MCP-capable client at the same `/mcp` URL.

## How it works

- `src/index.ts` — one `registerTool(...)` per API operation, served via `createMcpHandler`.
- `src/http.ts` — generic caller: URL building (path + query), auth header, body. Reads config from `process.env` (populated by your wrangler vars/secrets).

It's plain TypeScript you own — edit a tool, add one, or post-process responses freely.

## License

MIT
