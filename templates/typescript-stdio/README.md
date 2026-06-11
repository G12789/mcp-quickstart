# {{projectName}}

An [MCP](https://modelcontextprotocol.io) server (TypeScript, stdio transport), scaffolded with [mcp-forge](https://github.com/G12789/mcp-forge).

It ships with one of each MCP primitive so you have a working reference:

- **Tool** `ping` — health check
- **Tool** `text_stats` — count characters / words / lines / sentences (offline)
- **Resource** `greeting://{name}` — dynamic read-only data
- **Prompt** `summarize` — a reusable prompt template

## Quick start

```bash
npm install
npm run dev          # run the server on stdio
npm run inspect      # open the MCP Inspector and click the tools
npm test             # run unit tests
npm run build        # compile to dist/
```

## Test it in the Inspector

`npm run inspect` launches the official [MCP Inspector](https://github.com/modelcontextprotocol/inspector) wired to this server. Open the URL it prints, go to the **Tools** tab, and call `ping` — you should get `pong` back.

## Use it in Claude Desktop

Build first (`npm run build`), then add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{projectName}}/dist/index.js"]
    }
  }
}
```

## Use it in Cursor

Add to `.cursor/mcp.json` in your project (or the global one):

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "node",
      "args": ["/absolute/path/to/{{projectName}}/dist/index.js"]
    }
  }
}
```

## Add your own tool

Open `src/index.ts` and register another tool:

```ts
server.registerTool(
  "my_tool",
  {
    title: "My tool",
    description: "What it does",
    inputSchema: { query: z.string() },
  },
  async ({ query }) => ({
    content: [{ type: "text", text: `You said: ${query}` }],
  })
);
```

Keep heavy logic in `src/tools.ts` (pure functions) so it stays easy to test.

## License

MIT
