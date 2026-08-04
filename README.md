# @pipeworx/eurostat

Eurostat MCP — EU statistics (demographics, economy, trade, environment, employment). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `get_data(dataset_code, filters?, time?, lang?)` — fetch observations from a dataset
- `get_dataset_metadata(dataset_code, lang?)` — dimensions + code lists
- `search_datasets(query, lang?)` — keyword search across the catalogue

## Data source

- Data: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<dataset_code>?<filters>&format=JSON`
- Metadata: `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/datastructure/ESTAT/<dataset_code>?format=JSON`
- Catalogue: `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/dataflow/ESTAT/all/latest?format=JSON`

Filter syntax: dimension values as query params. E.g. `?geo=DE&geo=FR&time=2023`. Multiple values repeat the param.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Eurostat data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
