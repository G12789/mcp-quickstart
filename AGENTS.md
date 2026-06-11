# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

`mcp-forge` is a CLI that scaffolds Model Context Protocol (MCP) servers. It is
published to npm as **`create-mcp-forge`** and invoked via
`npm create mcp-forge@latest` or `npx mcp-forge`.

## Layout

```
src/
  index.js      CLI entry: arg parsing, prompts, orchestration
  scaffold.js   recursive template copy + placeholder replacement
templates/
  typescript-stdio/   working TS MCP server template
  python-stdio/       working Python MCP server template
```

## Conventions

- Pure ESM, Node >= 18, no build step for the CLI itself.
- Template files use `{{projectName}}` / `{{projectNameSnake}}` placeholders,
  replaced in `scaffold.js`.
- Dotfiles are stored with a leading underscore (`_gitignore`, `_env.example`)
  and renamed on generation, so npm does not mangle them when publishing.
- Inside generated templates, keep pure logic in `tools.ts` / `tools.py` and
  the MCP wiring in `index.ts` / `server.py`. This keeps tests dependency-free.
- On stdio servers, logs go to **stderr** only — stdout is the protocol channel.

## How to test changes

```bash
npm install
node src/index.js tmp-out --lang ts -y      # generate a TS project
node src/index.js tmp-out-py --lang python -y
```

Then inside a generated TS project: `npm install && npm test && npm run build`.
The generated server must start and print `... running on stdio` to stderr.

## Adding a template

Create `templates/<language>-<transport>/`, mirror the existing structure, and
the CLI will pick it up automatically (template name is `<language>-<transport>`).
