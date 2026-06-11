#!/usr/bin/env node
/**
 * End-to-end self-check.
 *
 * Scaffolds every template into a temp dir and proves it actually works:
 *   - TypeScript templates:  npm install -> build -> test
 *   - Python templates:      py_compile + pure-logic check (no extra deps)
 *
 * Run locally before committing:   npm run test:e2e
 * Also runs in CI on every push.
 *
 * Exits non-zero on the first failure, so humans and AI agents get a clear
 * "this is broken" signal instead of shipping a template that doesn't run.
 */
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "src", "index.js");

const TS_TEMPLATES = [
  { lang: "ts", transport: "stdio" },
  { lang: "ts", transport: "http" },
];
const PY_TEMPLATES = [
  { lang: "python", transport: "stdio" },
  { lang: "python", transport: "http" },
];

const root = mkdtempSync(join(tmpdir(), "mcp-forge-e2e-"));
let failures = 0;

function log(msg) {
  console.log(msg);
}

function run(cmd, args, cwd) {
  // On Windows npm resolves to npm.cmd and must go through the shell; run it
  // as a single command string to avoid the shell+args deprecation warning.
  // node/python are real executables execFile can launch directly, which also
  // avoids breaking on spaced paths like "C:\Program Files\...".
  if (process.platform === "win32" && cmd === "npm") {
    execSync(`npm ${args.join(" ")}`, { cwd, stdio: "pipe" });
    return;
  }
  execFileSync(cmd, args, { cwd, stdio: "pipe" });
}

function scaffold(name, lang, transport) {
  run(process.execPath, [CLI, name, "--lang", lang, "--transport", transport, "-y"], root);
  const dir = join(root, name);
  if (!existsSync(dir)) throw new Error(`scaffold produced no directory for ${name}`);
  return dir;
}

function checkTs({ lang, transport }) {
  const name = `ts-${transport}`;
  log(`\n[TS ${transport}] scaffolding...`);
  const dir = scaffold(name, lang, transport);
  log(`[TS ${transport}] npm install...`);
  run("npm", ["install", "--no-audit", "--no-fund"], dir);
  log(`[TS ${transport}] npm test...`);
  run("npm", ["test"], dir);
  log(`[TS ${transport}] npm run build...`);
  run("npm", ["run", "build"], dir);
  if (!existsSync(join(dir, "dist"))) throw new Error("build produced no dist/");
  log(`[TS ${transport}] OK`);
}

function checkPy({ lang, transport }) {
  const name = `py-${transport}`;
  log(`\n[PY ${transport}] scaffolding...`);
  const dir = scaffold(name, lang, transport);
  const py = process.env.PYTHON || "python";
  log(`[PY ${transport}] py_compile...`);
  run(py, ["-m", "py_compile", "server.py", "tools.py"], dir);
  log(`[PY ${transport}] tool logic...`);
  run(
    py,
    [
      "-c",
      "import tools; s=tools.text_stats('One. Two!'); assert s['sentences']==2 and s['words']==2, s; assert tools.ping()['message']=='pong'; assert 'Hello, Ada!' in tools.greeting('Ada')",
    ],
    dir
  );
  log(`[PY ${transport}] OK`);
}

try {
  for (const t of TS_TEMPLATES) {
    try {
      checkTs(t);
    } catch (e) {
      failures++;
      console.error(`[TS ${t.transport}] FAILED: ${e.message}`);
    }
  }

  // Python is optional locally; skip cleanly if it is not installed.
  let pythonAvailable = true;
  try {
    execSync(`${process.env.PYTHON || "python"} --version`, { stdio: "ignore" });
  } catch {
    pythonAvailable = false;
    log("\n[PY] python not found on PATH — skipping Python templates.");
  }
  if (pythonAvailable) {
    for (const t of PY_TEMPLATES) {
      try {
        checkPy(t);
      } catch (e) {
        failures++;
        console.error(`[PY ${t.transport}] FAILED: ${e.message}`);
      }
    }
  }
} finally {
  try {
    rmSync(root, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

if (failures > 0) {
  console.error(`\n✗ e2e: ${failures} template(s) failed`);
  process.exit(1);
}
console.log("\n✓ e2e: all templates scaffold, build and pass tests");
