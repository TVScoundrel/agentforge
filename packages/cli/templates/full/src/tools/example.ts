import { z } from 'zod';
import { createTool } from '@agentforge/core';

/**
 * Example tool that demonstrates the tool creation API
 */
export const exampleTool = createTool()
  .name('example_tool')
  .description('An example tool that greets a user by name')
  .category('utility')
  .schema(
    z.object({
      name: z.string().describe('The name of the person to greet'),
    })
  )
  .implement(async ({ name }) => {
    return `Hello, ${name}! This is an example tool response.`;
  })
  .build();

