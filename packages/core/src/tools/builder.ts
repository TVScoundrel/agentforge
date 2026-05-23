import { z } from 'zod';
import { Tool, ToolCategory, ToolExample, ToolMetadata } from './types.js';
import { buildTool } from './builder-finalize.js';
import { SafeToolResult, ToolInvoke, wrapInvoke, wrapSafeInvoke } from './builder-implementation.js';
import { appendExample, appendMetadataList, cloneMetadata, setRelation } from './builder-metadata.js';

export class ToolBuilder<TInput = unknown, TOutput = unknown> {
  constructor(
    private metadata: Partial<ToolMetadata> = {},
    private _schema?: z.ZodSchema<TInput>,
    private _invoke?: ToolInvoke<TOutput>
  ) {}

  name(name: string): this {
    this.metadata.name = name;
    return this;
  }

  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  category(category: ToolCategory): this {
    this.metadata.category = category;
    return this;
  }

  displayName(displayName: string): this {
    this.metadata.displayName = displayName;
    return this;
  }

  tags(tags: string[]): this {
    this.metadata.tags = tags;
    return this;
  }

  tag(tag: string): this {
    appendMetadataList(this.metadata, 'tags', tag);
    return this;
  }

  example(example: ToolExample): this {
    appendExample(this.metadata, example);
    return this;
  }

  usageNotes(notes: string): this {
    this.metadata.usageNotes = notes;
    return this;
  }

  limitations(limitations: string[]): this {
    this.metadata.limitations = limitations;
    return this;
  }

  limitation(limitation: string): this {
    appendMetadataList(this.metadata, 'limitations', limitation);
    return this;
  }

  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  author(author: string): this {
    this.metadata.author = author;
    return this;
  }

  requires(tools: string[]): this {
    setRelation(this.metadata, 'requires', tools);
    return this;
  }

  suggests(tools: string[]): this {
    setRelation(this.metadata, 'suggests', tools);
    return this;
  }

  conflicts(tools: string[]): this {
    setRelation(this.metadata, 'conflicts', tools);
    return this;
  }

  follows(tools: string[]): this {
    setRelation(this.metadata, 'follows', tools);
    return this;
  }

  precedes(tools: string[]): this {
    setRelation(this.metadata, 'precedes', tools);
    return this;
  }

  schema<T>(schema: z.ZodSchema<T>): ToolBuilder<T, TOutput> {
    return new ToolBuilder<T, TOutput>(cloneMetadata(this.metadata), schema, this._invoke);
  }

  implement<T>(invoke: (input: TInput) => Promise<T>): ToolBuilder<TInput, T> {
    return new ToolBuilder<TInput, T>(cloneMetadata(this.metadata), this._schema, wrapInvoke(invoke));
  }

  implementSafe<T>(
    invoke: (input: TInput) => Promise<T>
  ): ToolBuilder<TInput, SafeToolResult<T>> {
    return new ToolBuilder<TInput, SafeToolResult<T>>(
      cloneMetadata(this.metadata),
      this._schema,
      wrapSafeInvoke(invoke)
    );
  }

  build(): Tool<TInput, TOutput> {
    return buildTool(this.metadata, this._schema, this._invoke);
  }
}

export function toolBuilder(): ToolBuilder {
  return new ToolBuilder();
}
