import { z } from 'zod';
import { ToolCategory } from './types.js';
import { toolBuilder } from './builder.js';

const schemaFirstTool = toolBuilder()
  .name('schema-first-tool')
  .description('Builder typecheck fixture')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      count: z.number().describe('Count'),
      label: z.string().describe('Label'),
    })
  )
  .implement(async ({ count, label }) => ({
    doubled: count * 2,
    upper: label.toUpperCase(),
  }))
  .build();

void schemaFirstTool.invoke({ count: 2, label: 'demo' }).then((result) => {
  const doubled: number = result.doubled;
  const upper: string = result.upper;
  void doubled;
  void upper;
});

const invokeFirstBuilder = toolBuilder()
  .name('invoke-first-tool')
  .description('Invoke-first builder typecheck fixture')
  .category(ToolCategory.UTILITY)
  .implement(async (input: unknown) => ({ seen: input }));

const invokeFirstTool = invokeFirstBuilder
  .schema(
    z.object({
      id: z.string().describe('Identifier'),
    })
  )
  .build();

void invokeFirstTool.invoke({ id: 'abc' }).then((result) => {
  const seen: unknown = result.seen;
  void seen;
});

const safeTool = toolBuilder()
  .name('safe-builder-tool')
  .description('Safe builder typecheck fixture')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      flag: z.boolean().describe('Flag'),
    })
  )
  .implementSafe(async ({ flag }) => (flag ? 'enabled' : 'disabled'))
  .build();

void safeTool.invoke({ flag: true }).then((result) => {
  const success: boolean = result.success;
  void success;

  if (result.success) {
    const data: string | undefined = result.data;
    void data;
  } else {
    const error: string | undefined = result.error;
    void error;
  }
});
