# {{projectName}}

An [MCP](https://modelcontextprotocol.io) server (Python, stdio transport), scaffolded with [mcp-forge](https://github.com/G12789/mcp-forge).

It ships with one of each MCP primitive so you have a working reference:

- **Tool** `ping` — health check
- **Tool** `text_stats` — count characters / words / lines / sentences (offline)
- **Resource** `greeting://{name}` — dynamic read-only data
- **Prompt** `summarize` — a reusable prompt template

## Quick start

```bash
# with uv (recommended)
uv sync
uv run mcp dev server.py     # open the MCP Inspector
uv run pytest                # run tests

# or with pip
pip install -e ".[dev]"
mcp dev server.py
pytest
```

Run the server directly on stdio:

```bash
python server.py
```

## Test it in the Inspector

`mcp dev server.py` launches the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) wired to this server. Open the URL it prints, go to the **Tools** tab, and call `ping` — you should get `pong` back.

## Use it in Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "python",
      "args": ["/absolute/path/to/{{projectName}}/server.py"]
    }
  }
}
```

## Use it in Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "{{projectName}}": {
      "command": "python",
      "args": ["/absolute/path/to/{{projectName}}/server.py"]
    }
  }
}
```

## Add your own tool

Open `server.py` and decorate a function:

```python
@mcp.tool()
def my_tool(query: str) -> str:
    """What it does."""
    return f"You said: {query}"
```

Keep heavy logic in `tools.py` (pure functions) so it stays easy to test.

## License

MIT
