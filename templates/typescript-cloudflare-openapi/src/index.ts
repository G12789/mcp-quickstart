import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callEndpoint } from "./http.js";

// Tools generated from {{API_TITLE}} ({{TOOL_COUNT}} operations).
// A fresh server is created per request (required for stateless Workers MCP).
function createServer(): McpServer {
  const server = new McpServer({
    name: "{{projectName}}",
    version: "0.1.0",
  });

  {{TOOLS}}

  return server;
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const server = createServer();
    return createMcpHandler(server)(request, env, ctx);
  },
};
