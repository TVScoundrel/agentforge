import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  MissingDescriptionError,
  ToolCategory,
  toolBuilder,
} from '../../src/tools/index.js';

describe('ToolBuilder validation', () => {
  it('throws if name is missing', () => {
    expect(() =>
      toolBuilder()
        .description('Missing name')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build(),
    ).toThrow('Tool name is required');
  });

  it('throws if description is missing', () => {
    expect(() =>
      toolBuilder()
        .name('no-description')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build(),
    ).toThrow('Tool description is required');
  });

  it('throws if category is missing', () => {
    expect(() =>
      toolBuilder()
        .name('no-category')
        .description('Missing category')
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build(),
    ).toThrow('Tool category is required');
  });

  it('throws if schema is missing', () => {
    expect(() =>
      toolBuilder()
        .name('no-schema')
        .description('Missing schema')
        .category(ToolCategory.UTILITY)
        .implement(async ({ input }: { input: string }) => input)
        .build(),
    ).toThrow('Tool schema is required');
  });

  it('throws if implementation is missing', () => {
    expect(() =>
      toolBuilder()
        .name('no-impl')
        .description('Missing implementation')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .build(),
    ).toThrow('Tool implementation is required');
  });

  it('validates metadata name format', () => {
    expect(() =>
      toolBuilder()
        .name('InvalidName')
        .description('Testing invalid name')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build(),
    ).toThrow('Invalid tool metadata');
  });

  it('validates schema descriptions', () => {
    expect(() =>
      toolBuilder()
        .name('no-descriptions')
        .description('Testing missing descriptions')
        .category(ToolCategory.UTILITY)
        .schema(
          z.object({
            input: z.string(),
          }),
        )
        .implement(async ({ input }) => input)
        .build(),
    ).toThrow(MissingDescriptionError);
  });

  it('throws a clear error for non-cloneable tool example payloads', () => {
    expect(() =>
      toolBuilder()
        .name('non-cloneable-example')
        .description('Testing clone failure messaging')
        .category(ToolCategory.UTILITY)
        .example({
          description: 'Bad example',
          input: {
            handler: () => 'nope',
          },
        })
        .schema(z.object({ input: z.string().describe('Input') })),
    ).toThrow('structured-cloneable value');
  });
});
