import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { callEndpoint } from "./http.js";

const server = new McpServer({
  name: "{{projectName}}",
  version: "0.1.0",
});

// --- Tools generated from {{API_TITLE}} ({{TOOL_COUNT}} operations) ---
// Edit freely: each tool is a normal registerTool call. Re-run mcp-quickstart
// to regenerate from an updated spec.

{{TOOLS}}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("{{projectName}} MCP server running on stdio — {{TOOL_COUNT}} tools from {{API_TITLE}}");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
