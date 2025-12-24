# LangChain Integration

AgentForge tools can be seamlessly converted to LangChain's `DynamicStructuredTool` format, allowing you to use them with LangChain agents, chains, and LangGraph workflows.

## Quick Start

```typescript
import { toolBuilder, ToolCategory, toLangChainTool } from '@agentforge/core';
import { z } from 'zod';

// Create an AgentForge tool
const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Get the current weather for a city')
  .category(ToolCategory.WEB)
  .schema(z.object({
    city: z.string().describe('The city name'),
  }))
  .implement(async ({ city }) => {
    // Your implementation
    return { city, temperature: 72, condition: 'Sunny' };
  })
  .build();

// Convert to LangChain tool
const langchainTool = toLangChainTool(weatherTool);

// Use with LangChain agents
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

const agent = createReactAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [langchainTool],
});
```

## API Reference

### `toLangChainTool(tool)`

Converts a single AgentForge tool to a LangChain `DynamicStructuredTool`.

**Parameters:**
- `tool: Tool<TInput, TOutput>` - The AgentForge tool to convert

**Returns:**
- `DynamicStructuredTool` - A LangChain tool

**Features:**
- ✅ Preserves tool name and description
- ✅ Uses the same Zod schema for validation
- ✅ Automatically converts output to strings (LangChain requirement)
- ✅ Handles objects, arrays, and primitives

**Example:**
```typescript
const langchainTool = toLangChainTool(myTool);
const result = await langchainTool.invoke({ input: 'value' });
```

### `toLangChainTools(tools)`

Converts multiple AgentForge tools to LangChain format.

**Parameters:**
- `tools: Tool<any, any>[]` - Array of AgentForge tools

**Returns:**
- `DynamicStructuredTool[]` - Array of LangChain tools

**Example:**
```typescript
const langchainTools = toLangChainTools([tool1, tool2, tool3]);
```

### `getToolJsonSchema(tool)`

Gets the JSON Schema representation of a tool's input schema.

**Parameters:**
- `tool: Tool<any, any>` - The AgentForge tool

**Returns:**
- `Record<string, any>` - JSON Schema object

**Example:**
```typescript
const schema = getToolJsonSchema(myTool);
console.log(JSON.stringify(schema, null, 2));
```

### `getToolDescription(tool)`

Gets a human-readable description of the tool including all metadata.

**Parameters:**
- `tool: Tool<any, any>` - The AgentForge tool

**Returns:**
- `string` - Formatted tool description

**Example:**
```typescript
const description = getToolDescription(myTool);
// Output:
// my-tool: Does something useful
// Category: utility
// Tags: helper, example
// Usage Notes: Use this carefully
// ...
```

## Output Conversion

LangChain tools must return strings. AgentForge automatically converts outputs:

| AgentForge Output | LangChain Output |
|-------------------|------------------|
| `string` | Same string |
| `number`, `boolean` | Converted to string |
| `object`, `array` | JSON.stringify with formatting |
| `null`, `undefined` | String representation |

**Example:**
```typescript
// AgentForge tool returns object
const tool = toolBuilder()
  .implement(async () => ({ name: 'John', age: 30 }))
  .build();

// LangChain tool returns JSON string
const langchainTool = toLangChainTool(tool);
const result = await langchainTool.invoke({});
// result = '{\n  "name": "John",\n  "age": 30\n}'
```

## Schema Validation

Both AgentForge and LangChain use the same Zod schema for input validation:

```typescript
const tool = toolBuilder()
  .schema(z.object({
    email: z.string().email(),
    age: z.number().min(0).max(120),
  }))
  .implement(async (input) => input)
  .build();

const langchainTool = toLangChainTool(tool);

// Validation happens automatically
await langchainTool.invoke({ email: 'invalid' }); // Throws validation error
```

## Complete Example

See [examples/langchain-integration.ts](../examples/langchain-integration.ts) for a complete working example.

Run it with:
```bash
npx tsx packages/core/examples/langchain-integration.ts
```

## Testing

The LangChain integration includes comprehensive tests:
- ✅ Tool conversion
- ✅ Output type conversion
- ✅ Schema preservation
- ✅ Metadata handling
- ✅ JSON Schema generation
- ✅ Description formatting

Run tests:
```bash
pnpm test
```

