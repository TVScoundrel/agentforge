# Data Analyst Agent

A configurable, reusable data analyst agent built with AgentForge. This agent demonstrates best practices for creating flexible, production-ready AI agents that can be customized for different data analysis scenarios.

## Features

- ✅ **Configurable**: Customize model, tools, prompts, and analysis criteria
- 🔧 **Tool Injection**: Add custom tools for data sources, calculations, and visualizations
- 🎯 **Feature Flags**: Enable/disable statistical analysis, data validation, visualization, confidential data mode
- 📝 **Type-Safe**: Full TypeScript support with Zod validation
- 🧪 **Testable**: Easy to test with dependency injection
- 📦 **Reusable**: Use as-is or customize for your needs
- 📄 **External Prompts**: Prompts stored in `.md` files with `{{variable}}` placeholders

## Installation

```bash
npm install @agentforge/core @agentforge/patterns @agentforge/tools @langchain/openai zod
```

## Quick Start

```typescript
import { createDataAnalystAgent } from './index.js';

// Basic usage with defaults
const agent = createDataAnalystAgent();

// Run a data analysis
const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'Analyze this sales data: [100, 150, 200, 175, 225]'
  }]
});
```

## Configuration

### Basic Configuration

```typescript
const agent = createDataAnalystAgent({
  organizationName: 'Acme Corp',
  dataTypes: 'Sales, Marketing, Customer Behavior',
  enableStatisticalAnalysis: true,
  enableVisualization: true,
});
```

### Statistical Analysis Focus

```typescript
const statisticalAgent = createDataAnalystAgent({
  organizationName: 'Research Lab',
  dataTypes: 'Experimental Data, Survey Results',
  enableStatisticalAnalysis: true,
  analysisDepth: 'deep',
});
```

### Data Quality Focus

```typescript
const qualityAgent = createDataAnalystAgent({
  organizationName: 'Data Governance',
  enableDataValidation: true,
  enableStatisticalAnalysis: false,
  enableVisualization: false,
});
```

### Confidential Data Handling

```typescript
const confidentialAgent = createDataAnalystAgent({
  organizationName: 'Finance Department',
  confidentialData: true,
  enableHumanEscalation: true,
  dataTypes: 'Financial Records, PII',
});
```

### With Custom Tools

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';

const sqlTool = toolBuilder()
  .name('query-sql')
  .description('Execute SQL queries against the data warehouse')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    query: z.string().describe('SQL query to execute'),
  }))
  .implement(async ({ query }) => {
    // Execute query and return results
    return { rows: [], rowCount: 0 };
  })
  .build();

const agent = createDataAnalystAgent({
  customTools: [sqlTool],
  dataTypes: 'Relational Database',
});
```

### With ToolRegistry

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();
registry.registerMany([sqlTool, csvTool, apiTool]);

const agent = createDataAnalystAgent({
  toolRegistry: registry,
  enabledCategories: [ToolCategory.UTILITY],
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `BaseLanguageModel` | `ChatOpenAI(gpt-4)` | Language model to use |
| `temperature` | `number` | `0.2` | Model temperature (0-2, lower for consistency) |
| `customTools` | `Tool[]` | `[]` | Additional tools to provide |
| `toolRegistry` | `ToolRegistry` | `undefined` | Tool registry for advanced composition |
| `enabledCategories` | `ToolCategory[]` | `undefined` | Filter tools by category |
| `enableStatisticalAnalysis` | `boolean` | `true` | Enable statistical calculations |
| `enableDataValidation` | `boolean` | `true` | Enable data quality checks |
| `enableVisualization` | `boolean` | `true` | Enable chart/graph creation |
| `enableHumanEscalation` | `boolean` | `false` | Enable human-in-the-loop for complex decisions |
| `confidentialData` | `boolean` | `false` | Enable confidential data handling mode |
| `maxIterations` | `number` | `15` | Maximum agent iterations |
| `systemPrompt` | `string` | `undefined` | Custom system prompt override |
| `organizationName` | `string` | `undefined` | Organization name for context |
| `dataTypes` | `string` | `undefined` | Types of data analyzed (e.g., \"Sales, Marketing\") |
| `analysisDepth` | `'quick' \\| 'standard' \\| 'deep'` | `'standard'` | Analysis thoroughness level |

## Built-in Tools

The agent includes these built-in tools:

### `analyze-data`
Analyze a dataset to identify patterns, trends, and insights.

**Parameters:**
- `data` (string): The dataset to analyze (JSON, CSV, or description)
- `question` (string): The specific question or analysis goal
- `context` (string, optional): Additional context about the data

### `calculate-statistics` (when `enableStatisticalAnalysis: true`)
Calculate statistical measures for a dataset.

**Parameters:**
- `data` (number[]): Numerical data to analyze
- `metrics` (string[]): Statistical metrics to calculate (mean, median, mode, stddev, percentiles)

### `create-visualization` (when `enableVisualization: true`)
Create a chart or graph to visualize data.

**Parameters:**
- `chartType` (string): Type of chart (bar, line, scatter, pie, histogram)
- `data` (string): Data to visualize (JSON format)
- `title` (string): Chart title
- `xLabel` (string, optional): X-axis label
- `yLabel` (string, optional): Y-axis label

### `validate-data` (when `enableDataValidation: true`)
Check data quality and identify issues.

**Parameters:**
- `data` (string): Dataset to validate (JSON or CSV format)
- `checks` (string[]): Validation checks to perform (missing, outliers, duplicates, types, consistency)

### `ask-human` (when `enableHumanEscalation: true`)
Escalate complex business decisions or ambiguous data questions to a human analyst.

**Parameters:**
- `question` (string): The question or decision that needs human input
- `context` (string): Context and analysis performed so far
- `urgency` (string, optional): Urgency level (low, medium, high)

## Prompt Management

This agent demonstrates the **external prompt pattern** - a best practice for managing agent prompts:

### Why External Prompts?

- **Separation of Concerns**: Keep prompts separate from code logic
- **Easier to Read**: Prompts are in markdown, not embedded in strings
- **Version Control**: Track prompt changes independently
- **Team Collaboration**: Non-developers can edit prompts
- **Reusability**: Share prompts across agents

### Prompt Structure

Prompts are stored in `prompts/system.md` with variable placeholders:

```markdown
# Data Analyst Agent

You are an expert data analyst{{#if organizationName}} working for {{organizationName}}{{/if}}.

## Your Responsibilities

1. **Analyze data** - Examine datasets to identify patterns, trends, and insights
...

{{#if enableStatisticalAnalysis}}
### Statistical Methods

You can perform:
- **Descriptive statistics**: Mean, median, mode, standard deviation, percentiles
...
{{/if}}
```

### Variable Substitution

The prompt loader supports:
- **Simple variables**: `{{organizationName}}` → replaced with value
- **Conditional blocks**: `{{#if variable}}...{{/if}}` → included if truthy

### Custom Prompts

You can either:
1. **Modify the template**: Edit `prompts/system.md` directly
2. **Override completely**: Pass `systemPrompt` in config
3. **Add new templates**: Create new `.md` files and load them

```typescript
import { loadPrompt } from './prompt-loader';

// Load custom prompt
const customPrompt = loadPrompt('my-custom-prompt', {
  organizationName: 'Acme Corp',
  confidentialData: true,
});
```

## Analysis Depth Levels

### Quick Analysis
- Focus on high-level trends and key metrics
- Provide rapid insights for quick decisions
- Minimal statistical analysis

### Standard Analysis (Default)
- Perform thorough analysis with standard statistical methods
- Include visualizations and detailed explanations
- Balance between speed and depth

### Deep Analysis
- Conduct comprehensive analysis with advanced techniques
- Explore multiple hypotheses and scenarios
- Provide detailed recommendations with supporting evidence

## Examples

See the test file for more usage examples:
- Basic data analyst
- Statistical analyst (research focus)
- Visualization specialist (marketing focus)
- Data quality analyst (governance focus)
- Confidential data analyst (finance focus)
- Custom database tools integration

## Testing

```bash
npm test
```

All 28 tests passing, demonstrating:
- Configuration validation
- Tool injection patterns
- Feature flag combinations
- Reusability scenarios
- Analysis depth configurations

## License

MIT

