# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

`mcp-quickstart` is a CLI that scaffolds Model Context Protocol (MCP) servers. It is
published to npm as **`create-mcp-quickstart`** and invoked via
`npm create mcp-quickstart@latest` or `npx mcp-quickstart`.

## Layout

```
src/
  index.js      CLI entry: arg parsing, prompts, orchestration
  scaffold.js   recursive template copy + placeholder replacement (incl. extra vars)
  openapi.js    OpenAPI loader + spec->tools codegen (the --from-openapi feature)
  curl.js       curl tokenizer/parser + curl->tool codegen (the --from-curl feature)
  schema.js     JSON/OpenAPI schema -> zod string (+ $ref resolve, infer from value)
templates/
  typescript-stdio/    working TS MCP server (stdio)
  typescript-http/     working TS MCP server (streamable HTTP, Express)
  typescript-openapi/  TS MCP server generated from an OpenAPI spec ({{TOOLS}} injection)
  python-stdio/        working Python MCP server (stdio)
  python-http/         working Python MCP server (streamable HTTP, FastMCP)
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
node src/index.js tmp-api --from-openapi scripts/fixtures/sample-openapi.json -y
node src/index.js tmp-curl --from-curl scripts/fixtures/sample-curl.txt -y
npm run test:e2e                            # scaffolds + builds + tests every variant
```

Then inside a generated TS project: `npm install && npm test && npm run build`.
The generated server must start and print `... running on stdio` to stderr.
For the OpenAPI variant, `npm run build` (tsc) is the test: generated tools must typecheck.

## Adding a template

Create `templates/<language>-<transport>/`, mirror the existing structure, and
the CLI will pick it up automatically (template name is `<language>-<transport>`).
