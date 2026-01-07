# Data Analyst Example

An AI-powered data analyst that can load, analyze, and generate insights from CSV and JSON datasets using the Plan-Execute pattern for structured analysis.

## Features

- 📊 **Data Profiling**: Analyze dataset structure, types, and quality
- 📈 **Statistical Analysis**: Calculate mean, median, min, max, and distributions
- 🔍 **Pattern Detection**: Identify trends, correlations, and anomalies
- 💡 **Insight Generation**: Generate actionable insights from data
- 📋 **Data Transformation**: Filter, sort, and group data
- ❓ **Question Answering**: Answer specific questions about datasets

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

Create a `.env` file in the repository root:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

## Usage

Analyze any CSV or JSON file:

```bash
# From the repository root
pnpm tsx examples/applications/data-analyst/src/index.ts <file-path> [question]
```

### Examples

```bash
# General analysis
pnpm tsx examples/applications/data-analyst/src/index.ts data/sales.csv

# Specific question
pnpm tsx examples/applications/data-analyst/src/index.ts data/sales.csv "What are the top 5 selling products?"

# Trend analysis
pnpm tsx examples/applications/data-analyst/src/index.ts data/revenue.json "What is the revenue trend over time?"

# Comparative analysis
pnpm tsx examples/applications/data-analyst/src/index.ts data/customers.csv "Compare customer segments by revenue"
```

## Sample Data

Create a sample CSV file to test:

```csv
product,category,price,quantity,revenue,date
Laptop,Electronics,999.99,45,44999.55,2024-01-15
Mouse,Electronics,29.99,120,3598.80,2024-01-15
Keyboard,Electronics,79.99,85,6799.15,2024-01-15
Monitor,Electronics,299.99,60,17999.40,2024-01-16
Headphones,Electronics,149.99,95,14249.05,2024-01-16
```

Save as `data/sales.csv` and analyze:

```bash
pnpm tsx examples/applications/data-analyst/src/index.ts data/sales.csv "Which product generated the most revenue?"
```

## How It Works

This example uses the **Plan-Execute Pattern** for structured analysis:

1. **Planning Phase**: Creates a step-by-step analysis plan
2. **Data Loading**: Parses CSV or JSON data
3. **Profiling**: Analyzes dataset structure and quality
4. **Analysis**: Performs statistical calculations
5. **Insight Generation**: Identifies patterns and trends
6. **Reporting**: Compiles findings into a comprehensive report

## Tools Used

- `csvParser` - Parse CSV files
- `jsonParser` - Parse JSON data
- `statistics` - Calculate statistical metrics
- `arrayFilter` - Filter data based on conditions
- `arraySort` - Sort data by columns
- `arrayGroupBy` - Group data for aggregation
- `profile_data` - Custom tool for data profiling
- `generate_insights` - Custom tool for insight generation

## Analysis Capabilities

### Data Profiling
- Row and column counts
- Data types
- Missing value analysis
- Unique value counts
- Distribution analysis

### Statistical Analysis
- Mean, median, mode
- Min, max, range
- Standard deviation
- Percentiles
- Correlation analysis

### Pattern Detection
- Trends over time
- Outlier detection
- Category distributions
- Relationship identification

### Data Quality
- Missing value detection
- Data type consistency
- Value range validation
- Duplicate detection

## Customization

### Add Custom Analysis Tools

```typescript
const correlationTool = createTool()
  .name('calculate_correlation')
  .description('Calculate correlation between two numeric columns')
  .schema(z.object({
    data: z.string(),
    column1: z.string(),
    column2: z.string(),
  }))
  .implement(async ({ data, column1, column2 }) => {
    const dataset = JSON.parse(data);
    // Calculate Pearson correlation
    // ... implementation
    return correlation.toFixed(4);
  })
  .build();
```

### Adjust Analysis Depth

```typescript
const agent = createPlanExecuteAgent({
  model,
  tools: [...],
  maxIterations: 20, // More iterations = deeper analysis
});
```

### Focus on Specific Analysis

```typescript
systemPrompt: `You are a financial data analyst specializing in revenue analysis.
Focus on revenue trends, profitability, and financial metrics.`,
```

## Production Considerations

1. **Large Datasets**: For files > 10MB, consider streaming or sampling
2. **Data Privacy**: Sanitize sensitive data before analysis
3. **Caching**: Cache analysis results for repeated queries
4. **Validation**: Validate data quality before analysis
5. **Visualization**: Integrate with charting libraries for visual output

## Integration with BI Tools

Export analysis results to popular BI tools:

```typescript
// Export to CSV
import { jsonToCsv } from '@agentforge/tools';
const csvResult = await jsonToCsv.invoke({ data: analysisResults });

// Save for Tableau, Power BI, etc.
await fs.writeFile('analysis-results.csv', csvResult);
```

## Learn More

- [AgentForge Documentation](../../../docs-site/)
- [Plan-Execute Pattern Guide](../../../docs-site/api/patterns.md#plan-execute-agent)
- [Data Tools Reference](../../../docs-site/api/tools.md#data-tools)

## License

MIT

