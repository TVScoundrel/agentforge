import type { ToolExample, ToolMetadata } from './types.js';

type RelationKey = keyof NonNullable<ToolMetadata['relations']>;
type MetadataListKey = 'tags' | 'limitations';

function cloneRelations(relations?: ToolMetadata['relations']): ToolMetadata['relations'] {
  if (!relations) {
    return undefined;
  }

  return {
    requires: relations.requires ? [...relations.requires] : undefined,
    suggests: relations.suggests ? [...relations.suggests] : undefined,
    conflicts: relations.conflicts ? [...relations.conflicts] : undefined,
    follows: relations.follows ? [...relations.follows] : undefined,
    precedes: relations.precedes ? [...relations.precedes] : undefined,
  };
}

function cloneExampleValue<T>(value: T, exampleIndex: number, field: 'input' | 'output'): T {
  try {
    return structuredClone(value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new TypeError(
      `Invalid tool example at index ${exampleIndex}: "${field}" must be a structured-cloneable value. ` +
        `Received a non-cloneable value while building the tool metadata. Original error: ${reason}`
    );
  }
}

function cloneExamples(examples?: ToolExample[]): ToolExample[] | undefined {
  return examples?.map((example, index) => ({
    ...example,
    input: cloneExampleValue(example.input, index, 'input'),
    output: example.output === undefined ? undefined : cloneExampleValue(example.output, index, 'output'),
  }));
}

export function cloneMetadata(metadata: Partial<ToolMetadata>): Partial<ToolMetadata> {
  return {
    ...metadata,
    tags: metadata.tags ? [...metadata.tags] : undefined,
    examples: cloneExamples(metadata.examples),
    limitations: metadata.limitations ? [...metadata.limitations] : undefined,
    relations: cloneRelations(metadata.relations),
  };
}

export function appendMetadataList(metadata: Partial<ToolMetadata>, key: MetadataListKey, value: string): void {
  const items = metadata[key] ?? [];
  metadata[key] = [...items, value];
}

export function appendExample(metadata: Partial<ToolMetadata>, example: ToolExample): void {
  metadata.examples = [...(metadata.examples ?? []), example];
}

export function setRelation(
  metadata: Partial<ToolMetadata>,
  relation: RelationKey,
  tools: string[],
): void {
  metadata.relations = {
    ...(metadata.relations ?? {}),
    [relation]: tools,
  };
}
