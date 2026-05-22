import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { ToolCategory } from './types.js';
import {
  getAllRegistryTools,
  getRegistryToolNames,
  getRegistryToolsByCategory,
  getRegistryToolsByTag,
  searchRegistryTools,
  type RegistryTool,
} from './registry-collection.js';
import { convertRegistryToolsToLangChain, generateRegistryPrompt } from './registry-prompt.js';
import type { PromptOptions } from './registry-types.js';

export interface RegistryQueryApi {
  get(name: string): RegistryTool | undefined;
  has(name: string): boolean;
  getAll(): RegistryTool[];
  getByCategory(category: ToolCategory): RegistryTool[];
  getByTag(tag: string): RegistryTool[];
  search(query: string): RegistryTool[];
  size(): number;
  getNames(): string[];
  toLangChainTools(): DynamicStructuredTool[];
  generatePrompt(options?: PromptOptions): string;
}

export function createRegistryQueryApi(
  tools: ReadonlyMap<string, RegistryTool>
): RegistryQueryApi {
  return {
    get: (name) => tools.get(name),
    has: (name) => tools.has(name),
    getAll: () => getAllRegistryTools(tools),
    getByCategory: (category) => getRegistryToolsByCategory(tools, category),
    getByTag: (tag) => getRegistryToolsByTag(tools, tag),
    search: (query) => searchRegistryTools(tools, query),
    size: () => tools.size,
    getNames: () => getRegistryToolNames(tools),
    toLangChainTools: () => convertRegistryToolsToLangChain(getAllRegistryTools(tools)),
    generatePrompt: (options = {}) => generateRegistryPrompt(getAllRegistryTools(tools), options),
  };
}
