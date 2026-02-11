import { z } from 'zod';
import { toolBuilder, ToolCategory } from '@agentforge/core';

/**
 * Example tool that demonstrates the tool creation API
 */
export const exampleTool = toolBuilder()
  .name('example_tool')
  .description('An example tool that greets a user by name')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      name: z.string().describe('The name of the person to greet'),
    })
  )
  .implement(async ({ name }) => {
    return `Hello, ${name}! This is an example tool response.`;
  })
  .build();

