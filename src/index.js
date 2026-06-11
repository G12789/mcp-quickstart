#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import prompts from "prompts";
import pc from "picocolors";
import { scaffold } from "./scaffold.js";
import { buildOpenApiVars } from "./openapi.js";
import { buildCurlVars } from "./curl.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

function readVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const LANGUAGES = [
  { title: "TypeScript  (Node, recommended)", value: "typescript" },
  { title: "Python      (3.10+)", value: "python" },
];

const TRANSPORTS = [
  { title: "stdio       (local tools, Claude Desktop / Cursor)", value: "stdio" },
  { title: "http        (remote / hosted, streamable HTTP)", value: "http" },
  { title: "cloudflare  (remote MCP server on Cloudflare Workers)", value: "cloudflare" },
];

function parseArgs(argv) {
  const args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        args.flags[key] = next;
        i++;
      } else {
        args.flags[key] = true;
      }
    } else if (token.startsWith("-") && token.length > 1) {
      // Short boolean flags, e.g. -y -h -v (each letter is its own flag).
      for (const ch of token.slice(1)) {
        args.flags[ch] = true;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function validateProjectName(name) {
  if (!name) return "Project name is required";
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(name)) {
    return "Use lowercase letters, numbers, dashes or underscores (must start with letter/number)";
  }
  return true;
}

function dirIsEmpty(dir) {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).length === 0;
}

function printBanner() {
  console.log("");
  console.log(pc.cyan(pc.bold("  mcp-quickstart")) + pc.dim("  ·  forge a working MCP server in 30s"));
  console.log("");
}

function onCancel() {
  console.log(pc.yellow("\n  Cancelled. No files were written.\n"));
  process.exit(1);
}

async function run() {
  const { _, flags } = parseArgs(process.argv.slice(2));

  if (flags.help || flags.h) {
    printHelp();
    return;
  }
  if (flags.version || flags.v) {
    console.log(readVersion());
    return;
  }

  printBanner();

  const skipPrompts = flags.yes === true || flags.y === true;
  const cliName = _[0];

  // OpenAPI mode: generate one MCP tool per API operation from a spec.
  let openApiSource = flags["from-openapi"];
  if (openApiSource === true) {
    const { specPath } = await prompts(
      {
        type: "text",
        name: "specPath",
        message: "Path or URL to the OpenAPI spec (JSON or YAML)",
        validate: (v) => (v && v.trim() ? true : "A spec path or URL is required"),
      },
      { onCancel }
    );
    openApiSource = specPath;
  }

  // curl mode: turn a single curl command into one MCP tool.
  let curlSource = flags["from-curl"];
  if (curlSource === true) {
    const { curlText } = await prompts(
      {
        type: "text",
        name: "curlText",
        message: "Paste the curl command (or a path to a file containing it)",
        validate: (v) => (v && v.trim() ? true : "A curl command is required"),
      },
      { onCancel }
    );
    curlSource = curlText;
  }

  const isOpenApi = Boolean(openApiSource);
  const isCurl = !isOpenApi && Boolean(curlSource);
  const isGenerated = isOpenApi || isCurl;

  const responses = await prompts(
    [
      {
        type: cliName ? null : "text",
        name: "projectName",
        message: "Project name",
        initial: isGenerated ? "my-api-mcp" : "my-mcp-server",
        validate: (v) => validateProjectName(v),
      },
      {
        type: flags.lang || skipPrompts || isGenerated ? null : "select",
        name: "language",
        message: "Language",
        choices: LANGUAGES,
        initial: 0,
      },
      {
        type: flags.transport || skipPrompts || isGenerated ? null : "select",
        name: "transport",
        message: "Transport",
        choices: TRANSPORTS,
        initial: 0,
      },
      {
        type: flags.examples !== undefined || skipPrompts || isGenerated ? null : "toggle",
        name: "withExamples",
        message: "Include example tool / resource / prompt?",
        initial: true,
        active: "yes",
        inactive: "no",
      },
    ],
    { onCancel }
  );

  const projectName = cliName || responses.projectName;
  const nameCheck = validateProjectName(projectName);
  if (nameCheck !== true) {
    console.log(pc.red(`\n  ${nameCheck}\n`));
    process.exit(1);
  }

  const langAliases = { ts: "typescript", js: "typescript", typescript: "typescript", py: "python", python: "python" };
  const rawLang = flags.lang || responses.language || "typescript";
  // When generating from an API, the user can still target Cloudflare Workers.
  const wantsCloudflare = (flags.transport || responses.transport) === "cloudflare";
  const transport = isGenerated
    ? wantsCloudflare
      ? "cloudflare"
      : "openapi"
    : flags.transport || responses.transport || "stdio";
  // The Cloudflare Workers template is TypeScript-only.
  const language =
    isGenerated || transport === "cloudflare"
      ? "typescript"
      : langAliases[String(rawLang).toLowerCase()] || rawLang;
  const withExamples =
    flags.examples !== undefined
      ? flags.examples !== "false" && flags.examples !== false
      : responses.withExamples !== undefined
      ? responses.withExamples
      : true;

  // Build generated variables (tool code, base URL, ...) before scaffolding.
  let extraVars;
  if (isOpenApi) {
    console.log("");
    console.log(pc.dim(`  Reading OpenAPI spec from ${pc.reset(openApiSource)} ...`));
    try {
      extraVars = await buildOpenApiVars(openApiSource);
    } catch (err) {
      console.log(pc.red(`\n  Could not generate from spec: ${err?.message || err}\n`));
      process.exit(1);
    }
    console.log(pc.dim(`  Found ${pc.reset(pc.bold(extraVars.TOOL_COUNT))} operations → ${extraVars.TOOL_COUNT} MCP tools.`));
  } else if (isCurl) {
    console.log("");
    console.log(pc.dim(`  Parsing curl command ...`));
    try {
      extraVars = buildCurlVars(curlSource);
    } catch (err) {
      console.log(pc.red(`\n  Could not generate from curl: ${err?.message || err}\n`));
      process.exit(1);
    }
    console.log(pc.dim(`  Built 1 MCP tool calling ${pc.reset(pc.bold(extraVars.BASE_URL))}.`));
  }

  const templateName = isGenerated
    ? wantsCloudflare
      ? "typescript-cloudflare-openapi"
      : "typescript-openapi"
    : `${language}-${transport}`;
  const templateDir = join(TEMPLATES_DIR, templateName);
  if (!existsSync(templateDir)) {
    console.log(
      pc.red(`\n  Template "${templateName}" is not available yet.\n`) +
        pc.dim(`  Available: ${readdirSync(TEMPLATES_DIR).join(", ")}\n`)
    );
    process.exit(1);
  }

  const targetDir = resolve(process.cwd(), projectName);
  if (!dirIsEmpty(targetDir)) {
    const { overwrite } = await prompts(
      {
        type: "confirm",
        name: "overwrite",
        message: `Directory ${pc.cyan(basename(targetDir))} is not empty. Continue and overwrite files?`,
        initial: false,
      },
      { onCancel }
    );
    if (!overwrite) onCancel();
  }

  console.log("");
  console.log(pc.dim(`  Scaffolding ${pc.reset(pc.bold(projectName))}${pc.dim(` (${templateName})...`)}`));

  await scaffold({
    templateDir,
    targetDir,
    vars: {
      projectName,
      language,
      transport,
      withExamples,
      extra: extraVars,
    },
  });

  printNextSteps({ projectName, language, transport, isOpenApi: isGenerated });
}

function printNextSteps({ projectName, language, transport, isOpenApi }) {
  console.log("");
  console.log(pc.green(pc.bold("  Done.")) + pc.dim("  Next steps:"));
  console.log("");
  console.log("    " + pc.cyan(`cd ${projectName}`));

  if (transport === "cloudflare") {
    console.log("    " + pc.cyan("npm install"));
    console.log("    " + pc.cyan("npm run dev") + pc.dim("          # local MCP endpoint at http://localhost:8787/mcp"));
    console.log("    " + pc.cyan("npx wrangler login") + pc.dim("   # one-time"));
    console.log("    " + pc.cyan("npm run deploy") + pc.dim("       # deploy to the edge, prints your https URL"));
    console.log("");
    console.log(pc.dim("  Then add the /mcp URL to Cursor / Claude: see the generated README.md"));
    console.log("");
    return;
  }

  const isPy = language === "python";
  const isHttp = transport === "http";
  const install = isPy ? "uv sync          (or: pip install -e \".[dev]\")" : "npm install";
  const dev = isPy ? (isHttp ? "uv run python server.py" : "python server.py") : "npm run dev";
  const inspect = isHttp ? "npm run inspect" : isPy ? "uv run mcp dev server.py" : "npm run inspect";

  console.log("    " + pc.cyan(install));
  if (isOpenApi) {
    console.log("    " + pc.cyan("cp .env.example .env") + pc.dim("   # set API_BASE_URL + auth"));
  }
  console.log("    " + pc.cyan(dev) + pc.dim("        # run the server"));
  console.log("    " + pc.cyan(inspect) + pc.dim("    # open the MCP Inspector to test tools"));
  console.log("");
  console.log(pc.dim("  Wire it into Claude Desktop / Cursor: see the generated README.md"));
  console.log("");
}

function printHelp() {
  console.log(`
  ${pc.cyan(pc.bold("mcp-quickstart"))} - scaffold a Model Context Protocol server

  ${pc.bold("Usage")}
    npm create mcp-quickstart@latest [name] [options]
    npx mcp-quickstart [name] [options]

  ${pc.bold("Options")}
    --from-openapi <path|url>   generate one MCP tool per API operation from an OpenAPI spec
    --from-curl <cmd|file>      turn a single curl command into an MCP tool
    --lang <ts|python>          language (default: prompt)
    --transport <stdio|http|cloudflare>  transport / deploy target (default: prompt)
    --examples <true|false>     include example tool/resource/prompt
    --yes, -y                   accept defaults, skip prompts
    --help, -h                  show this help
    --version, -v               show version

  ${pc.bold("Examples")}
    npm create mcp-quickstart@latest weather-server
    npx mcp-quickstart my-server --lang ts --transport http -y
    npx mcp-quickstart my-server --lang python --transport stdio -y
    ${pc.dim("# remote MCP server on Cloudflare Workers (free plan):")}
    npx mcp-quickstart edge-server --transport cloudflare -y
    ${pc.dim("# turn any REST API into an MCP server:")}
    npx mcp-quickstart petstore-mcp --from-openapi https://petstore3.swagger.io/api/v3/openapi.json
    ${pc.dim("# or turn a single curl command into a tool:")}
    npx mcp-quickstart my-tool --from-curl "curl https://api.example.com/v1/search?q=hi -H 'Authorization: Bearer X'"
`);
}

run().catch((err) => {
  console.error(pc.red("\n  Error: ") + (err?.message || err));
  process.exit(1);
});
