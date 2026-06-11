# mcp-forge

[![CI](https://github.com/G12789/mcp-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/G12789/mcp-forge/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/create-mcp-forge?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-mcp-forge)
[![node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-ready-7c3aed)](https://modelcontextprotocol.io)

> **Forge a working, testable, publishable MCP server in 30 seconds.**
> One command. TypeScript **or** Python. Example tools, the Inspector, and tests — all wired up.

```bash
npm create mcp-forge@latest my-server
```

![mcp-forge demo](assets/demo.svg)

Most "create an MCP server" guides leave you with an empty skeleton and a 20-step setup. `mcp-forge` hands you a server that **runs, tests, and connects to Claude / Cursor on the first try** — then gets out of your way.

---

## Why mcp-forge

The official scaffolder gives you a bare bones starting point. `mcp-forge` is the *"…but without the part you hate"* version:

| | Bare skeleton | **mcp-forge** |
|---|:---:|:---:|
| Runs immediately | partly | ✅ |
| Example **tool + resource + prompt** | – | ✅ |
| Unit tests included & passing | – | ✅ |
| One-command **Inspector** (`npm run inspect`) | – | ✅ |
| Claude Desktop + Cursor config in README | – | ✅ |
| TypeScript **and** Python | one | ✅ both |
| `.env.example`, `.gitignore`, sane `tsconfig` | partly | ✅ |

## Quick start

```bash
# interactive
npm create mcp-forge@latest

# non-interactive
npm create mcp-forge@latest weather-server -- --lang ts -y
npx mcp-forge weather-server --lang python -y
```

> **Before it lands on npm**, you can run it straight from GitHub:
>
> ```bash
> npx github:G12789/mcp-forge weather-server --lang ts -y
> ```

Then:

```bash
cd weather-server
npm install        # or: uv sync   (Python)
npm run dev        # start the server on stdio
npm run inspect    # open the MCP Inspector and click your tools
npm test           # green out of the box
```

## What you get

Every generated server ships with one of each MCP primitive, so you have a real reference to copy from:

- **Tool** `ping` — proof of life
- **Tool** `text_stats` — count chars / words / lines / sentences (fully offline)
- **Resource** `greeting://{name}` — dynamic read-only data
- **Prompt** `summarize` — a reusable prompt template

Heavy logic lives in a separate, pure `tools.ts` / `tools.py` so it stays trivially testable.

## Options

```
npm create mcp-forge@latest [name] [options]

  --lang <ts|python>         language (default: prompt)
  --transport <stdio|http>   transport (default: prompt)
  --examples <bool>          include the example primitives (default: true)
  --yes, -y                  accept defaults, skip prompts
  --help, -h                 show help
```

## Templates

| Language | Transport | Status |
|---|---|:---:|
| TypeScript | stdio | ✅ stable |
| TypeScript | streamable HTTP | ✅ stable |
| Python | stdio | ✅ stable |
| Python | streamable HTTP | ✅ stable |

Pick the transport at scaffold time:

```bash
npm create mcp-forge@latest my-server -- --lang ts --transport http -y
```

## Roadmap

- `--with auth` (OAuth) preset for HTTP transport
- Extra example tool packs (HTTP fetch, SQLite, filesystem)
- GitHub Action template to publish your server to npm / PyPI

Issues and PRs welcome — every issue gets a reply within 24h.

## Contributing

```bash
git clone https://github.com/G12789/mcp-forge.git
cd mcp-forge
npm install
node src/index.js test-out --lang ts -y   # try the scaffolder locally
```

Templates live in `templates/<language>-<transport>/`. Files prefixed with `_` (e.g. `_gitignore`) are renamed on generation.

## More projects

Part of a set of open tools — see [github.com/G12789](https://github.com/G12789):
**mall-ai-digital-twin** · **merchant-membership-miniprogram** · **cyber-stage-widgets**

## License

[MIT](LICENSE)
