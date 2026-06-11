# Contributing to mcp-forge

Thanks for helping out. The bar is simple: **every generated template must run, build and pass tests out of the box.** CI enforces it.

## Development

```bash
git clone https://github.com/G12789/mcp-forge.git
cd mcp-forge
npm install

# generate a project locally to eyeball it
node src/index.js test-out --lang ts --transport stdio -y

# run the full self-check (scaffolds + builds + tests every template)
npm run test:e2e
```

`npm run test:e2e` is the same check CI runs. If it is green locally, your PR should pass.

## Adding a template

1. Create `templates/<language>-<transport>/`, mirroring an existing one.
2. Use `{{projectName}}` / `{{projectNameSnake}}` placeholders.
3. Store dotfiles with a leading underscore (`_gitignore`, `_env.example`).
4. Add the new `{ lang, transport }` combo to `scripts/e2e.mjs`.
5. Run `npm run test:e2e` until green.

## Conventions

- Keep pure logic in `tools.ts` / `tools.py`; keep MCP wiring separate.
- On stdio servers, logs go to **stderr** only.
- Small, focused PRs. Update the README templates table if you add one.

## Response time

Issues get a reply within 24 hours — even if it is just "looking into it". Open one any time.
