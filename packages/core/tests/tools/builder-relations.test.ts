import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, toolBuilder } from '../../src/tools/index.js';

describe('ToolBuilder relations', () => {
  it('supports requires relation', () => {
    const tool = toolBuilder()
      .name('edit-file')
      .description('Edit a file')
      .category(ToolCategory.FILE_SYSTEM)
      .requires(['view-file'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Editing ${path}`)
      .build();

    expect(tool.metadata.relations?.requires).toEqual(['view-file']);
  });

  it('supports suggests relation', () => {
    const tool = toolBuilder()
      .name('edit-file')
      .description('Edit a file')
      .category(ToolCategory.FILE_SYSTEM)
      .suggests(['run-tests', 'format-code'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Editing ${path}`)
      .build();

    expect(tool.metadata.relations?.suggests).toEqual(['run-tests', 'format-code']);
  });

  it('supports conflicts relation', () => {
    const tool = toolBuilder()
      .name('create-file')
      .description('Create a file')
      .category(ToolCategory.FILE_SYSTEM)
      .conflicts(['delete-file'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Creating ${path}`)
      .build();

    expect(tool.metadata.relations?.conflicts).toEqual(['delete-file']);
  });

  it('supports follows relation', () => {
    const tool = toolBuilder()
      .name('edit-file')
      .description('Edit a file')
      .category(ToolCategory.FILE_SYSTEM)
      .follows(['search-codebase', 'view-file'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Editing ${path}`)
      .build();

    expect(tool.metadata.relations?.follows).toEqual(['search-codebase', 'view-file']);
  });

  it('supports precedes relation', () => {
    const tool = toolBuilder()
      .name('view-file')
      .description('View a file')
      .category(ToolCategory.FILE_SYSTEM)
      .precedes(['edit-file'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Viewing ${path}`)
      .build();

    expect(tool.metadata.relations?.precedes).toEqual(['edit-file']);
  });

  it('supports multiple relations', () => {
    const tool = toolBuilder()
      .name('edit-file')
      .description('Edit a file')
      .category(ToolCategory.FILE_SYSTEM)
      .requires(['view-file'])
      .suggests(['run-tests', 'format-code'])
      .follows(['search-codebase'])
      .precedes(['run-tests'])
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Editing ${path}`)
      .build();

    expect(tool.metadata.relations).toEqual({
      requires: ['view-file'],
      suggests: ['run-tests', 'format-code'],
      follows: ['search-codebase'],
      precedes: ['run-tests'],
    });
  });

  it('allows empty relations arrays', () => {
    const tool = toolBuilder()
      .name('test-tool')
      .description('Test tool with empty relations')
      .category(ToolCategory.UTILITY)
      .requires([])
      .suggests([])
      .schema(
        z.object({
          input: z.string().describe('Input'),
        }),
      )
      .implement(async ({ input }) => input)
      .build();

    expect(tool.metadata.relations?.requires).toEqual([]);
    expect(tool.metadata.relations?.suggests).toEqual([]);
  });
});
