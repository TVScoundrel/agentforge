import { Tool, ToolCategory } from './types.js';

export type RegistryTool = Tool<unknown, unknown>;

export function getAllRegistryTools(tools: ReadonlyMap<string, RegistryTool>): RegistryTool[] {
  return Array.from(tools.values());
}

export function getRegistryToolNames(tools: ReadonlyMap<string, RegistryTool>): string[] {
  return Array.from(tools.keys());
}

export function getRegistryToolsByCategory(
  tools: ReadonlyMap<string, RegistryTool>,
  category: ToolCategory
): RegistryTool[] {
  return getAllRegistryTools(tools).filter((tool) => tool.metadata.category === category);
}

export function getRegistryToolsByTag(
  tools: ReadonlyMap<string, RegistryTool>,
  tag: string
): RegistryTool[] {
  return getAllRegistryTools(tools).filter((tool) => tool.metadata.tags?.includes(tag));
}

export function searchRegistryTools(
  tools: ReadonlyMap<string, RegistryTool>,
  query: string
): RegistryTool[] {
  const lowerQuery = query.toLowerCase();

  return getAllRegistryTools(tools).filter((tool) => {
    const name = tool.metadata.name.toLowerCase();
    const displayName = tool.metadata.displayName?.toLowerCase() ?? '';
    const description = tool.metadata.description.toLowerCase();

    return (
      name.includes(lowerQuery) ||
      displayName.includes(lowerQuery) ||
      description.includes(lowerQuery)
    );
  });
}
