# {{TOOL_NAME_PASCAL}} Tool

{{TOOL_DESCRIPTION}}

## Category

`{{TOOL_CATEGORY}}`

## Installation

This tool is part of your AgentForge project. No additional installation required.

## Usage

```typescript
import { {{TOOL_NAME_CAMEL}}Tool } from './tools/{{TOOL_NAME}}/index.js';

// Use in an agent
const agent = createReActAgent({
  model,
  tools: [{{TOOL_NAME_CAMEL}}Tool],
  // ...
});

// Or invoke directly
const result = await {{TOOL_NAME_CAMEL}}Tool.invoke({
  input: 'example input',
});

console.log(result);
```

## Input Schema

```typescript
{
  input: string; // Input parameter (required, non-empty)
}
```

## Output Schema

```typescript
{
  success: boolean;        // Whether the operation was successful
  data?: any;             // Result data (when successful)
  error?: string;         // Error message (when failed)
  metadata?: {            // Additional metadata
    responseTime?: number;
    [key: string]: any;
  };
}
```

## File Structure

```
{{TOOL_NAME}}/
├── index.ts              # Main tool definition
├── types.ts              # TypeScript type definitions
├── schemas.ts            # Zod validation schemas
├── utils.ts              # Utility functions
├── providers/            # External service integrations
│   └── example.ts        # Example provider
├── __tests__/            # Test files
│   └── index.test.ts     # Main test suite
└── README.md             # This file
```

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for this tool only
pnpm test {{TOOL_NAME}}

# Watch mode
pnpm test:watch {{TOOL_NAME}}
```

### Adding Providers

To add a new provider (e.g., for integrating with an external API):

1. Create a new file in `providers/` directory:
   ```typescript
   // providers/myProvider.ts
   export async function myProvider(input: string): Promise<{{TOOL_NAME_PASCAL}}Output> {
     // Implementation
   }
   ```

2. Import and use in `index.ts`:
   ```typescript
   import { myProvider } from './providers/myProvider.js';
   ```

### Extending Types

Add new types in `types.ts`:

```typescript
export interface MyCustomType {
  // Your properties
}
```

### Adding Validation

Add new schemas in `schemas.ts`:

```typescript
export const MyCustomSchema = z.object({
  // Your schema
});
```

## Examples

### Basic Usage

```typescript
const result = await {{TOOL_NAME_CAMEL}}Tool.invoke({
  input: 'test input',
});

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Error Handling

```typescript
try {
  const result = await {{TOOL_NAME_CAMEL}}Tool.invoke({
    input: 'test',
  });
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  // Process result.data
} catch (error) {
  console.error('Tool execution failed:', error);
}
```

## TODO

- [ ] Implement core functionality in `index.ts`
- [ ] Add provider implementations in `providers/`
- [ ] Define proper input/output types in `types.ts`
- [ ] Add comprehensive validation in `schemas.ts`
- [ ] Write tests in `__tests__/index.test.ts`
- [ ] Add utility functions in `utils.ts`
- [ ] Update this README with actual usage examples

## License

MIT

