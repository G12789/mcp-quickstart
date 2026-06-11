import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ping, textStats } from "./tools.js";

// A fresh server is created per request: stateless MCP servers must not share a
// global McpServer instance across requests on Workers.
function createServer(): McpServer {
  const server = new McpServer({
    name: "{{projectName}}",
    version: "0.1.0",
  });

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check — returns pong",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: ping().message }],
    })
  );

  server.registerTool(
    "text_stats",
    {
      title: "Text statistics",
      description: "Count characters, words, lines and sentences in some text",
      inputSchema: { text: z.string().describe("The text to analyze") },
    },
    async ({ text }) => ({
      content: [{ type: "text", text: JSON.stringify(textStats(text), null, 2) }],
    })
  );

  return server;
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    // New server instance per request (required for stateless Workers MCP).
    const server = createServer();
    return createMcpHandler(server)(request, env, ctx);
  },
};
