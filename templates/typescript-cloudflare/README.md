# {{projectName}}

A **remote** [MCP](https://modelcontextprotocol.io) server that deploys to [Cloudflare Workers](https://workers.cloudflare.com), scaffolded with [mcp-quickstart](https://github.com/G12789/mcp-quickstart).

It uses Cloudflare's `createMcpHandler` (stateless, no Durable Objects) over the Streamable HTTP transport — so it runs on the **free Workers plan**, cold-starts in milliseconds, and is reachable globally by Claude, Cursor, ChatGPT or your own agent.

Ships with two example tools:

- **Tool** `ping` — health check
- **Tool** `text_stats` — count characters / words / lines / sentences

## Run locally

```bash
npm install
npm run dev          # wrangler dev — serves the MCP endpoint at http://localhost:8787/mcp
```

## Deploy to the edge

```bash
npx wrangler login   # one-time, opens the browser
npm run deploy       # prints your public URL, e.g. https://{{projectName}}.<you>.workers.dev
```

Your MCP endpoint is then `https://{{projectName}}.<you>.workers.dev/mcp`.

## Connect it

### Cursor

Add to `.cursor/mcp.json`:

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

## Add your own tool

Edit `src/index.ts` and register another tool inside `createServer()`:

```ts
server.registerTool(
  "my_tool",
  { title: "My tool", description: "What it does", inputSchema: { query: z.string() } },
  async ({ query }) => ({ content: [{ type: "text", text: `You said: ${query}` }] })
);
```

Keep heavy logic in `src/tools.ts` (pure functions) so it stays easy to test, and read config/secrets from the `env` argument (set them with `npx wrangler secret put NAME`).

## License

MIT
