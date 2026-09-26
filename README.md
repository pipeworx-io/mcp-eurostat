# @pipeworx/eurostat

Eurostat MCP — official EU statistics (economy, prices, labour, population, migration, trade, energy, environment, tourism). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

## Tools

- `get_dataset(dataset_code, geo?, time?)` — fetch observations from a dataset, e.g. `get_dataset({ dataset_code: "une_rt_m", geo: "DE", time: "2025-06" })` (time formats: `2023`, `2023-01`, `2023-Q1` — the compact `2023M01`/`2023Q1` styles are normalized automatically)
- `search_datasets(query)` — keyword search across the full Eurostat table of contents (~10,000 datasets and tables); returns codes to pass to `get_dataset`
- `list_datasets()` — curated list of ~19 popular dataset codes grouped by theme

## Data sources

- Data: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<dataset_code>?format=JSON&lang=en` (filters as query params, e.g. `&geo=DE&time=2023`)
- Catalogue: `https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc/txt?lang=en` — the full table-of-contents TSV, fetched edge-cached (6h) and filtered in the pack. The old `catalogue/toc?searchText=` search endpoint was retired by Eurostat (404s unconditionally as of 2026-08); the TSV download is the supported discovery path.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "eurostat": {
      "url": "https://gateway.pipeworx.io/eurostat/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/eurostat/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/eurostat_get_dataset \
  -H 'Content-Type: application/json' \
  -d '{"dataset_code":"nama_10_gdp","geo":"DE","time":"2023"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/eurostat_get_dataset`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "eurostat": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-eurostat"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-eurostat
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Eurostat data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
