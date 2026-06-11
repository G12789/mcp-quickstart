#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import prompts from "prompts";
import pc from "picocolors";
import { scaffold } from "./scaffold.js";

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
  console.log(pc.cyan(pc.bold("  mcp-forge")) + pc.dim("  ·  forge a working MCP server in 30s"));
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

  const responses = await prompts(
    [
      {
        type: cliName ? null : "text",
        name: "projectName",
        message: "Project name",
        initial: "my-mcp-server",
        validate: (v) => validateProjectName(v),
      },
      {
        type: flags.lang || skipPrompts ? null : "select",
        name: "language",
        message: "Language",
        choices: LANGUAGES,
        initial: 0,
      },
      {
        type: flags.transport || skipPrompts ? null : "select",
        name: "transport",
        message: "Transport",
        choices: TRANSPORTS,
        initial: 0,
      },
      {
        type: flags.examples !== undefined || skipPrompts ? null : "toggle",
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
  const language = langAliases[String(rawLang).toLowerCase()] || rawLang;
  const transport = flags.transport || responses.transport || "stdio";
  const withExamples =
    flags.examples !== undefined
      ? flags.examples !== "false" && flags.examples !== false
      : responses.withExamples !== undefined
      ? responses.withExamples
      : true;

  const templateName = `${language}-${transport}`;
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
    },
  });

  printNextSteps({ projectName, language, transport });
}

function printNextSteps({ projectName, language, transport }) {
  const isPy = language === "python";
  const isHttp = transport === "http";
  const install = isPy ? "uv sync          (or: pip install -e \".[dev]\")" : "npm install";
  const dev = isPy ? (isHttp ? "uv run python server.py" : "python server.py") : "npm run dev";
  const inspect = isHttp ? "npm run inspect" : isPy ? "uv run mcp dev server.py" : "npm run inspect";

  console.log("");
  console.log(pc.green(pc.bold("  Done.")) + pc.dim("  Next steps:"));
  console.log("");
  console.log("    " + pc.cyan(`cd ${projectName}`));
  console.log("    " + pc.cyan(install));
  console.log("    " + pc.cyan(dev) + pc.dim("        # run the server"));
  console.log("    " + pc.cyan(inspect) + pc.dim("    # open the MCP Inspector to test tools"));
  console.log("");
  console.log(pc.dim("  Wire it into Claude Desktop / Cursor: see the generated README.md"));
  console.log("");
}

function printHelp() {
  console.log(`
  ${pc.cyan(pc.bold("mcp-forge"))} - scaffold a Model Context Protocol server

  ${pc.bold("Usage")}
    npm create mcp-forge@latest [name] [options]
    npx mcp-forge [name] [options]

  ${pc.bold("Options")}
    --lang <ts|python>          language (default: prompt)
    --transport <stdio|http>    transport (default: prompt)
    --examples <true|false>     include example tool/resource/prompt
    --yes, -y                   accept defaults, skip prompts
    --help, -h                  show this help
    --version, -v               show version

  ${pc.bold("Examples")}
    npm create mcp-forge@latest weather-server
    npx mcp-forge my-server --lang ts --transport http -y
    npx mcp-forge my-server --lang python --transport stdio -y
`);
}

run().catch((err) => {
  console.error(pc.red("\n  Error: ") + (err?.message || err));
  process.exit(1);
});
