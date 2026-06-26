interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Eurostat MCP — wraps Eurostat Statistical Data API (no auth required)
 *
 * Tools:
 * - get_dataset: fetch data from a specific Eurostat dataset
 * - search_datasets: search for datasets by keyword
 * - list_datasets: list available dataset categories
 */


const DATA_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const TOC_URL = 'https://ec.europa.eu/eurostat/api/dissemination/catalogue/toc';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_dataset',
    description:
      'Fetch statistical data from a Eurostat dataset by dataset code. Optionally filter by country (geo) and time period. Example: get_dataset({ dataset_code: "nama_10_gdp", geo: "DE", time: "2023" }). Common dataset codes: "nama_10_gdp" (GDP), "prc_hicp_manr" (inflation), "une_rt_m" (unemployment).',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_code: {
          type: 'string',
          description: 'Eurostat dataset code, e.g. "nama_10_gdp", "prc_hicp_manr", "une_rt_m"',
        },
        geo: {
          type: 'string',
          description: 'Country/region code filter, e.g. "DE" (Germany), "FR" (France), "EU27_2020" (EU aggregate)',
        },
        time: {
          type: 'string',
          description: 'Time period filter, e.g. "2023", "2023M01" (Jan 2023), "2023Q1" (Q1 2023)',
        },
      },
      required: ['dataset_code'],
    },
  },
  {
    name: 'search_datasets',
    description:
      'Search for Eurostat datasets by keyword. Returns dataset codes, titles, and update dates. Example: search_datasets({ query: "unemployment rate" })',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword, e.g. "gdp", "unemployment", "inflation", "population"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_datasets',
    description:
      'Return a curated list of ~14 popular Eurostat dataset codes grouped by theme (Economy, Prices, Labour, Population, Migration, Trade, Energy, Environment, Tourism). No parameters required; use the returned codes with get_dataset.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_dataset':
      return getDataset(
        args.dataset_code as string,
        args.geo as string | undefined,
        args.time as string | undefined,
      );
    case 'search_datasets':
      return searchDatasets(args.query as string);
    case 'list_datasets':
      return listDatasets();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getDataset(datasetCode: string, geo?: string, time?: string) {
  const params = new URLSearchParams({ format: 'JSON', lang: 'en' });
  if (geo) params.set('geo', geo);
  if (time) params.set('time', time);

  const res = await fetch(`${DATA_URL}/${encodeURIComponent(datasetCode)}?${params}`);
  if (!res.ok) throw new Error(`Eurostat error: ${res.status}`);

  const data = (await res.json()) as {
    label: string;
    updated: string;
    id: string[];
    size: number[];
    dimension: Record<string, {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
    }>;
    value: Record<string, number | null>;
  };

  return {
    dataset: datasetCode,
    label: data.label,
    updated: data.updated,
    dimensions: Object.fromEntries(
      data.id.map((dimId) => [
        dimId,
        {
          label: data.dimension[dimId]?.label,
          categories: data.dimension[dimId]?.category?.label ?? {},
        },
      ]),
    ),
    value_count: Object.keys(data.value).length,
    values: data.value,
  };
}

async function searchDatasets(query: string) {
  const params = new URLSearchParams({ searchText: query, lang: 'en', type: 'dataset' });
  const res = await fetch(`${TOC_URL}?${params}`);
  if (!res.ok) throw new Error(`Eurostat error: ${res.status}`);

  const data = (await res.json()) as {
    items?: Array<{
      code: string; title: string; lastUpdate?: string; shortDescription?: string;
    }>;
  };

  const items = data.items ?? [];
  return {
    count: items.length,
    datasets: items.slice(0, 30).map((d) => ({
      code: d.code,
      title: d.title,
      last_update: d.lastUpdate,
      description: d.shortDescription?.slice(0, 200),
    })),
  };
}

async function listDatasets() {
  return {
    note: 'Curated list of popular Eurostat datasets. Use get_dataset with these codes.',
    datasets: [
      { code: 'nama_10_gdp', theme: 'Economy', title: 'GDP and main components' },
      { code: 'nama_10_pc', theme: 'Economy', title: 'GDP per capita' },
      { code: 'prc_hicp_manr', theme: 'Prices', title: 'HICP — monthly inflation rate' },
      { code: 'prc_hicp_aind', theme: 'Prices', title: 'HICP — annual average index' },
      { code: 'une_rt_m', theme: 'Labour', title: 'Unemployment rate — monthly' },
      { code: 'une_rt_a', theme: 'Labour', title: 'Unemployment rate — annual' },
      { code: 'lfsi_emp_a', theme: 'Labour', title: 'Employment rate — annual' },
      { code: 'demo_pjan', theme: 'Population', title: 'Population on 1 January' },
      { code: 'demo_gind', theme: 'Population', title: 'Population change indicators' },
      { code: 'migr_asyappctza', theme: 'Migration', title: 'Asylum applicants by citizenship' },
      { code: 'ext_lt_maineu', theme: 'Trade', title: 'EU trade since 1999' },
      { code: 'nrg_bal_c', theme: 'Energy', title: 'Complete energy balances' },
      { code: 'env_air_gge', theme: 'Environment', title: 'Greenhouse gas emissions' },
      { code: 'tour_occ_nim', theme: 'Tourism', title: 'Nights spent at tourist accommodation' },
    ],
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
