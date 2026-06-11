# mcp-quickstart

[![CI](https://github.com/G12789/mcp-quickstart/actions/workflows/ci.yml/badge.svg)](https://github.com/G12789/mcp-quickstart/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/create-mcp-quickstart?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-mcp-quickstart)
[![node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-ready-7c3aed)](https://modelcontextprotocol.io)

> **Forge a working, testable, publishable MCP server in 30 seconds.**
> One command. TypeScript **or** Python. Example tools, the Inspector, and tests — all wired up.
> Or point it at an OpenAPI spec and get **one MCP tool per API endpoint, automatically.**

```bash
npm create mcp-quickstart@latest my-server
```

![mcp-quickstart demo](assets/demo.svg)

Most "create an MCP server" guides leave you with an empty skeleton and a 20-step setup. `mcp-quickstart` hands you a server that **runs, tests, and connects to Claude / Cursor on the first try** — then gets out of your way.

---

## Turn any REST API into an MCP server

Every other scaffolder hands you an *empty* template and says "now go write your tools." `mcp-quickstart` is the only one that can **read an existing API and write the tools for you** — from an OpenAPI spec **or** a single curl command:

```bash
# whole API, from an OpenAPI spec:
npx mcp-quickstart petstore-mcp --from-openapi https://petstore3.swagger.io/api/v3/openapi.json

# one endpoint, straight from a curl you already have:
npx mcp-quickstart my-tool --from-curl "curl https://api.example.com/v1/search?q=hi -H 'Authorization: Bearer X'"
```

Point it at any OpenAPI 3.x document (a URL or a local `.json` / `.yaml`) and it generates a real, typed MCP server — **one tool per operation**, with path/query params and request bodies wired up to a small HTTP client. Request bodies are **expanded into per-field zod types** (`$ref`, nested objects, arrays and enums resolved), not an opaque blob — so the AI gets a real schema for each tool. Set `API_BASE_URL` (and an optional auth header) in `.env`, run `npm run dev`, and your AI agent can call the API immediately.

**`--from-curl`** does the same for a single request: paste a curl command (or a file with one) and get one MCP tool. Query params and the JSON body become overridable tool inputs, and **auth headers are moved to `.env` instead of being hard-coded** into the generated source.

```
my-api-mcp/
├── src/
│   ├── index.ts   # one registerTool(...) per API operation — plain, editable TS
│   └── http.ts    # generic caller: URL building, auth header, body
└── .env.example   # API_BASE_URL, API_AUTH_HEADER, API_AUTH_VALUE
```

No magic, no runtime spec parsing — just generated TypeScript you own and can edit.

---

## Why mcp-quickstart

The official scaffolder gives you a bare bones starting point. `mcp-quickstart` is the *"…but without the part you hate"* version:

| | Bare skeleton | **mcp-quickstart** |
|---|:---:|:---:|
| Runs immediately | partly | ✅ |
| Example **tool + resource + prompt** | – | ✅ |
| Unit tests included & passing | – | ✅ |
| One-command **Inspector** (`npm run inspect`) | – | ✅ |
| Claude Desktop + Cursor config in README | – | ✅ |
| TypeScript **and** Python | one | ✅ both |
| **Generate tools from an OpenAPI spec** | – | ✅ |
| **Generate a tool from a curl command** | – | ✅ |
| `.env.example`, `.gitignore`, sane `tsconfig` | partly | ✅ |

## Quick start

```bash
# interactive
npm create mcp-quickstart@latest

# non-interactive
npm create mcp-quickstart@latest weather-server -- --lang ts -y
npx mcp-quickstart weather-server --lang python -y
```

> **Before it lands on npm**, you can run it straight from GitHub:
>
> ```bash
> npx github:G12789/mcp-quickstart weather-server --lang ts -y
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
npm create mcp-quickstart@latest [name] [options]

  --from-openapi <path|url>  generate one MCP tool per API operation from an OpenAPI spec
  --from-curl <cmd|file>     turn a single curl command into an MCP tool
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
| TypeScript | **from OpenAPI** (`--from-openapi`) | ✅ stable |
| TypeScript | **from curl** (`--from-curl`) | ✅ stable |
| Python | stdio | ✅ stable |
| Python | streamable HTTP | ✅ stable |

Pick the transport at scaffold time:

```bash
npm create mcp-quickstart@latest my-server -- --lang ts --transport http -y
```

## Roadmap

- `--from-postman` importer (Postman collections → MCP tools)
- Python output for the generated (OpenAPI / curl) servers
- `--with auth` (OAuth) preset for HTTP transport
- GitHub Action template to publish your server to npm / PyPI

Done: `--from-openapi` (v0.2.0) · `--from-curl` (v0.3.0) · per-field typed request bodies / `$ref` resolution (v0.4.0).

Issues and PRs welcome — every issue gets a reply within 24h.

## Contributing

```bash
git clone https://github.com/G12789/mcp-quickstart.git
cd mcp-quickstart
npm install
node src/index.js test-out --lang ts -y   # try the scaffolder locally
```

Templates live in `templates/<language>-<transport>/`. Files prefixed with `_` (e.g. `_gitignore`) are renamed on generation.

## More projects

Part of a set of open tools — see [github.com/G12789](https://github.com/G12789):
**mall-ai-digital-twin** · **merchant-membership-miniprogram** · **cyber-stage-widgets**

## License

[MIT](LICENSE)
