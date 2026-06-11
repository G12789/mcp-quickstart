# {{projectName}}

An [MCP](https://modelcontextprotocol.io) server **auto-generated from {{API_TITLE}}** with [mcp-quickstart](https://github.com/G12789/mcp-quickstart).

Every operation in the OpenAPI spec became an MCP tool — **{{TOOL_COUNT}} tools** in total. The generated code lives in `src/index.ts` and is yours to edit.

## Quick start

```bash
npm install
cp .env.example .env   # set API_BASE_URL and (optional) auth header
npm run dev            # run the server on stdio
npm run inspect        # open the MCP Inspector and click the tools
npm run build          # compile to dist/
```

## Configure the target API

Edit `.env` (or set environment variables):

```bash
API_BASE_URL=https://api.example.com   # overrides the default from the spec
# Optional auth header sent on every request:
API_AUTH_HEADER=Authorization
API_AUTH_VALUE=Bearer YOUR_TOKEN
```

## How it works

- `src/index.ts` — one `registerTool(...)` per API operation.
- `src/http.ts` — a small generic caller that builds the URL (path + query params), attaches the auth header, sends the body, and returns the response text.

To change behavior (rename a tool, hard-code a header, post-process responses), just edit `src/index.ts` — it's plain TypeScript, no magic.

## Use it in Cursor

Build first (`npm run build`), then add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{projectName}}/dist/index.js"],
      "env": {
        "API_BASE_URL": "https://api.example.com",
        "API_AUTH_HEADER": "Authorization",
        "API_AUTH_VALUE": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

## Use it in Claude Desktop

Same idea in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{projectName}}/dist/index.js"],
      "env": { "API_BASE_URL": "https://api.example.com" }
    }
  }
}
```

## License

MIT
