import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { textStats, ping, greeting } from "./tools.js";

const server = new McpServer({
  name: "{{projectName}}",
  version: "0.1.0",
});

/**
 * TOOL: ping
 * The simplest possible proof-of-life. Call it from the Inspector to confirm
 * your server is wired up correctly.
 */
server.registerTool(
  "ping",
  {
    title: "Ping",
    description: "Health check. Returns 'pong' and the server timestamp.",
    inputSchema: {},
  },
  async () => {
    const result = ping();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

/**
 * TOOL: text_stats
 * A genuinely useful, fully-offline example: count characters, words, lines
 * and sentences in a piece of text. Replace this with your own tool.
 */
server.registerTool(
  "text_stats",
  {
    title: "Text statistics",
    description: "Count characters, words, lines and sentences in a piece of text.",
    inputSchema: {
      text: z.string().describe("The text to analyze"),
    },
  },
  async ({ text }) => {
    const stats = textStats(text);
    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
    };
  }
);

/**
 * RESOURCE: greeting://{name}
 * Resources expose read-only data to the model. This dynamic resource builds
 * a greeting from whatever name is in the URI.
 */
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "Greeting",
    description: "A personalized greeting served as an MCP resource.",
  },
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: greeting(Array.isArray(name) ? name[0] : name),
      },
    ],
  })
);

/**
 * PROMPT: summarize
 * Prompts are reusable templates the client can surface to the user.
 */
server.registerPrompt(
  "summarize",
  {
    title: "Summarize text",
    description: "Build a prompt that asks the model to summarize some text.",
    argsSchema: {
      text: z.string().describe("The text to summarize"),
    },
  },
  ({ text }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Summarize the following text in 3 concise bullet points:\n\n${text}`,
        },
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Logs MUST go to stderr on stdio servers — stdout is reserved for protocol.
  console.error("{{projectName}} MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
