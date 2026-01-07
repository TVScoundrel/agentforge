# Research Assistant Example

An AI-powered research assistant that can search for information, analyze sources, and generate comprehensive research reports.

## Features

- 🔍 **Web Search**: Search for information across the web
- 📄 **Web Scraping**: Extract content from web pages
- 📊 **Analysis**: Analyze and synthesize information from multiple sources
- 📝 **Summarization**: Generate concise summaries of findings
- 📚 **Comprehensive Reports**: Create well-structured research reports

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

## Installation

```bash
# From the repository root
pnpm install
```

## Configuration

1. Create a `.env` file in the repository root (if not already present):

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

## Usage

Run the research assistant with a topic:

```bash
# From the repository root
pnpm tsx examples/applications/research-assistant/src/index.ts "your research topic"
```

### Examples

```bash
# Research AI in healthcare
pnpm tsx examples/applications/research-assistant/src/index.ts "artificial intelligence in healthcare"

# Research climate change
pnpm tsx examples/applications/research-assistant/src/index.ts "climate change mitigation strategies"

# Research quantum computing
pnpm tsx examples/applications/research-assistant/src/index.ts "quantum computing applications"
```

## How It Works

1. **Search Phase**: The agent uses the `web_search` tool to find relevant sources
2. **Extraction Phase**: Uses `webScraper` and `httpGet` to extract content from sources
3. **Analysis Phase**: Analyzes and synthesizes information using the LLM
4. **Summarization Phase**: Uses `summarize_text` to create concise summaries
5. **Report Generation**: Compiles findings into a comprehensive research report

## Tools Used

- `web_search` - Custom tool for web searching (simulated in this example)
- `webScraper` - Scrapes content from web pages
- `httpGet` - Makes HTTP requests to fetch data
- `jsonParser` - Parses JSON responses
- `summarize_text` - Custom tool for text summarization

## Customization

### Add Real Search API

Replace the simulated `web_search` tool with a real search API:

```typescript
import { google } from 'googleapis';

const customsearch = google.customsearch('v1');

const webSearchTool = createTool()
  .name('web_search')
  .description('Search the web using Google Custom Search')
  .schema(z.object({
    query: z.string(),
    numResults: z.number().default(5),
  }))
  .implement(async ({ query, numResults }) => {
    const res = await customsearch.cse.list({
      auth: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q: query,
      num: numResults,
    });
    return JSON.stringify(res.data.items);
  })
  .build();
```

### Adjust Research Depth

Modify the `maxIterations` parameter to control research depth:

```typescript
const agent = createReActAgent({
  model,
  tools: [...],
  maxIterations: 20, // More iterations = deeper research
});
```

### Customize System Prompt

Modify the `systemPrompt` to change the agent's behavior:

```typescript
systemPrompt: `You are a specialized research assistant focused on scientific papers.
Always cite peer-reviewed sources and provide DOI links when available.`,
```

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for web requests
2. **Caching**: Cache search results to avoid redundant API calls
3. **Error Handling**: Add robust error handling for network failures
4. **Source Validation**: Validate and verify source credibility
5. **Citation Management**: Implement proper citation formatting
6. **Cost Management**: Monitor LLM API usage and costs

## Learn More

- [AgentForge Documentation](../../../docs-site/)
- [ReAct Pattern Guide](../../../docs-site/api/patterns.md#react-agent)
- [Tools Reference](../../../docs-site/api/tools.md)

## License

MIT

