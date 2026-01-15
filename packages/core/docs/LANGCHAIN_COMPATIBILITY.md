# LangChain Compatibility

## Overview

AgentForge tools are designed to be compatible with LangChain patterns to make migration easier for developers familiar with LangChain.

## The `invoke` Alias

All AgentForge tools support both `.execute()` and `.invoke()` methods:

- **`.execute()`** - The native AgentForge method
- **`.invoke()`** - An alias for `.execute()` for LangChain compatibility

Both methods do exactly the same thing and can be used interchangeably.

## Usage Examples

### Using `.execute()` (AgentForge style)

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const greetTool = toolBuilder()
  .name('greet-user')
  .description('Greet a user by name')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    name: z.string().describe('Name of the user to greet'),
  }))
  .implement(async ({ name }) => {
    return `Hello, ${name}!`;
  })
  .build();

// AgentForge style
const result = await greetTool.execute({ name: 'Alice' });
console.log(result); // "Hello, Alice!"
```

### Using `.invoke()` (LangChain style)

```typescript
// LangChain style - works exactly the same!
const result = await greetTool.invoke({ name: 'Bob' });
console.log(result); // "Hello, Bob!"
```

### Both methods are identical

```typescript
// These produce identical results
const result1 = await greetTool.execute({ name: 'Charlie' });
const result2 = await greetTool.invoke({ name: 'Charlie' });

console.log(result1 === result2); // true
```

## Why This Matters

### For LangChain Users

If you're migrating from LangChain to AgentForge, you can continue using `.invoke()` without changing your code:

```typescript
// Your existing LangChain code
const result = await myTool.invoke({ input: 'data' });

// Works the same in AgentForge!
const result = await myAgentForgeTool.invoke({ input: 'data' });
```

### For New Users

You can use whichever method feels more natural to you:

- **`.execute()`** - More explicit about what's happening
- **`.invoke()`** - Shorter and familiar to LangChain users

## Implementation Details

The `invoke` method is automatically added to all tools created with:
- `toolBuilder().build()`
- `createTool()`
- `createToolUnsafe()`

It's a simple alias that calls the same underlying `execute` function, so there's no performance difference between the two methods.

## Type Safety

Both methods are fully type-safe:

```typescript
const tool = toolBuilder()
  .name('add-numbers')
  .description('Add two numbers')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ a, b }) => a + b)
  .build();

// TypeScript knows the input type for both methods
const result1 = await tool.execute({ a: 1, b: 2 }); // ✅ Type-safe
const result2 = await tool.invoke({ a: 1, b: 2 });  // ✅ Type-safe

// TypeScript catches errors for both methods
await tool.execute({ a: 'wrong' }); // ❌ Type error
await tool.invoke({ a: 'wrong' });  // ❌ Type error
```

## Best Practices

1. **Choose one style and stick with it** - For consistency, pick either `.execute()` or `.invoke()` and use it throughout your codebase

2. **Document your choice** - If you're building a library or framework, document which method you use in your examples

3. **Both are equally valid** - There's no "right" or "wrong" choice - use whichever feels more natural to you and your team

## Migration Guide

### From LangChain to AgentForge

If you're migrating from LangChain, you can keep using `.invoke()`:

```typescript
// Before (LangChain)
import { DynamicTool } from '@langchain/core/tools';

const tool = new DynamicTool({
  name: 'my-tool',
  description: 'Does something',
  func: async (input) => {
    return `Result: ${input}`;
  },
});

const result = await tool.invoke({ input: 'data' });

// After (AgentForge) - invoke still works!
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const tool = toolBuilder()
  .name('my-tool')
  .description('Does something')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    input: z.string().describe('Input data'),
  }))
  .implement(async ({ input }) => {
    return `Result: ${input}`;
  })
  .build();

const result = await tool.invoke({ input: 'data' }); // ✅ Still works!
```

## See Also

- [Tool Builder API](./TOOL_BUILDER.md)
- [Tool System Overview](./TOOLS.md)
- [Migration Guide](./MIGRATION.md)

