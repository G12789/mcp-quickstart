import { readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".json",
  ".md",
  ".txt",
  ".toml",
  ".cfg",
  ".py",
  ".yml",
  ".yaml",
  ".env",
  ".example",
  ".gitignore",
  ".npmignore",
]);

// Files stored with a leading underscore so npm does not treat them specially
// when this scaffolder is published. They are renamed on write.
const RENAME_MAP = {
  _gitignore: ".gitignore",
  _npmignore: ".npmignore",
  "_env.example": ".env.example",
};

const TEXT_FILENAMES = new Set(["license", "readme", "dockerfile", "makefile"]);

function isTextFile(filename) {
  const lower = filename.toLowerCase();
  if (TEXT_FILENAMES.has(lower)) return true;
  for (const ext of TEXT_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function applyVars(content, vars) {
  return content
    .replaceAll("{{projectName}}", vars.projectName)
    .replaceAll("{{projectNameSnake}}", vars.projectName.replaceAll("-", "_"))
    .replaceAll("{{transport}}", vars.transport)
    .replaceAll("{{language}}", vars.language);
}

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      entries.push(...walk(full));
    } else {
      entries.push(full);
    }
  }
  return entries;
}

export async function scaffold({ templateDir, targetDir, vars }) {
  const files = walk(templateDir);
  let written = 0;

  for (const sourceFile of files) {
    const rel = relative(templateDir, sourceFile);
    const parts = rel.split(/[\\/]/);
    const baseName = parts[parts.length - 1];
    const renamed = RENAME_MAP[baseName] || baseName;
    parts[parts.length - 1] = renamed;
    const destFile = join(targetDir, ...parts);

    mkdirSync(join(destFile, ".."), { recursive: true });

    if (isTextFile(renamed) || RENAME_MAP[baseName]) {
      const raw = readFileSync(sourceFile, "utf8");
      writeFileSync(destFile, applyVars(raw, vars));
    } else {
      writeFileSync(destFile, readFileSync(sourceFile));
    }
    written++;
  }

  return { written };
}
