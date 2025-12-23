# Schema Descriptions - Enforcing LLM-Friendly Tool Definitions

## Overview

AgentForge **enforces** that all tool schema fields have descriptions. This is critical for LLM tool selection and usage.

## Why Enforce Descriptions?

### The Problem
Without descriptions, LLMs have no context about what parameters do:

```typescript
// ❌ BAD - LLM has no idea what these parameters mean
const schema = z.object({
  path: z.string(),
  limit: z.number(),
  recursive: z.boolean(),
});
```

### The Solution
With descriptions, LLMs understand exactly how to use the tool:

```typescript
// ✅ GOOD - LLM knows what each parameter does
const schema = z.object({
  path: z
    .string()
    .describe('Path to the directory to search, relative to the current working directory'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .describe('Maximum number of results to return (1-100)'),
  recursive: z
    .boolean()
    .describe('Whether to search subdirectories recursively'),
});
```

## How It Works

### Automatic Validation

When you use `createTool()`, descriptions are automatically validated:

```typescript
import { createTool, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// ✅ This works - all fields have descriptions
const goodTool = createTool(
  {
    name: 'search-files',
    description: 'Search for files in a directory',
    category: ToolCategory.FILE_SYSTEM,
  },
  z.object({
    path: z.string().describe('Directory path to search'),
    pattern: z.string().describe('File name pattern (supports wildcards)'),
  }),
  async ({ path, pattern }) => {
    // Implementation
  }
);

// ❌ This throws MissingDescriptionError
const badTool = createTool(
  {
    name: 'bad-tool',
    description: 'This will fail',
    category: ToolCategory.UTILITY,
  },
  z.object({
    input: z.string(), // Missing .describe()!
  }),
  async ({ input }) => input
);
// Error: Schema field "input" (ZodString) is missing a description.
```

## Supported Schema Types

### Primitive Types

```typescript
z.object({
  name: z.string().describe('User name'),
  age: z.number().describe('User age in years'),
  active: z.boolean().describe('Whether the user is active'),
});
```

### Optional Fields

Description can be on the wrapper OR the inner type:

```typescript
z.object({
  // Option 1: Description on wrapper
  email: z.string().optional().describe('User email address (optional)'),
  
  // Option 2: Description on inner type
  phone: z.string().describe('User phone number').optional(),
});
```

### Default Values

```typescript
z.object({
  role: z
    .string()
    .default('user')
    .describe('User role. Defaults to "user" if not specified.'),
});
```

### Arrays

Both the array AND elements need descriptions:

```typescript
z.object({
  tags: z
    .array(z.string().describe('Tag name'))
    .describe('List of tags to apply'),
});
```

### Nested Objects

All nested fields need descriptions:

```typescript
z.object({
  user: z
    .object({
      name: z.string().describe('User full name'),
      email: z.string().describe('User email address'),
    })
    .describe('User information'),
});
```

## Best Practices

### 1. Be Specific

```typescript
// ❌ Too vague
path: z.string().describe('A path')

// ✅ Specific and helpful
path: z.string().describe('Path to the file to read, relative to the current working directory')
```

### 2. Include Constraints

```typescript
// ✅ Mention constraints in the description
limit: z
  .number()
  .min(1)
  .max(100)
  .describe('Maximum number of results to return. Must be between 1 and 100.')
```

### 3. Explain Defaults

```typescript
// ✅ Mention default values
encoding: z
  .enum(['utf-8', 'ascii', 'base64'])
  .default('utf-8')
  .describe('Character encoding to use. Defaults to utf-8 for text files.')
```

### 4. Provide Examples

```typescript
// ✅ Include examples in the description
pattern: z
  .string()
  .describe('File name pattern. Supports wildcards, e.g., "*.ts" or "test-*.js"')
```

## Validation Functions

### validateSchemaDescriptions()

Throws an error if any field is missing a description:

```typescript
import { validateSchemaDescriptions } from '@agentforge/core';

const schema = z.object({
  name: z.string().describe('User name'),
});

validateSchemaDescriptions(schema); // OK

const badSchema = z.object({
  name: z.string(), // No description
});

validateSchemaDescriptions(badSchema); // Throws MissingDescriptionError
```

### safeValidateSchemaDescriptions()

Returns a result object instead of throwing:

```typescript
import { safeValidateSchemaDescriptions } from '@agentforge/core';

const result = safeValidateSchemaDescriptions(schema);

if (!result.success) {
  console.error('Missing descriptions:', result.error.message);
}
```

### getMissingDescriptions()

Returns an array of field paths missing descriptions:

```typescript
import { getMissingDescriptions } from '@agentforge/core';

const missing = getMissingDescriptions(schema);

if (missing.length > 0) {
  console.log('Fields missing descriptions:', missing);
  // Output: ['name', 'user.email']
}
```

## Migration Guide

If you have existing tools without descriptions, use `createToolUnsafe()` temporarily:

```typescript
import { createToolUnsafe } from '@agentforge/core';

// ⚠️ Only use this during migration!
const legacyTool = createToolUnsafe(
  metadata,
  z.object({
    input: z.string(), // No description - but allowed with unsafe
  }),
  execute
);
```

Then gradually add descriptions and switch to `createTool()`.

## See Also

- [Tool Metadata Interface](./TOOL_METADATA.md)
- [Tool Builder API](./TOOL_BUILDER.md)
- [Examples](../packages/core/examples/schema-descriptions.ts)

