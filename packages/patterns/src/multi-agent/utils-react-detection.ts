import type { ReActAgentGraph } from './utils-shared.js';

/**
 * Check if an object is a ReAct agent (CompiledStateGraph)
 *
 * This function detects whether an object is a compiled LangGraph StateGraph
 * (such as those created by `createReActAgent()`).
 *
 * @param obj - Object to check
 * @returns True if the object appears to be a ReAct agent
 */
export function isReActAgent(obj: unknown): obj is ReActAgentGraph {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      'invoke' in obj &&
      typeof obj.invoke === 'function' &&
      'stream' in obj &&
      typeof obj.stream === 'function' &&
      (obj.constructor?.name === 'CompiledGraph' ||
        obj.constructor?.name === 'CompiledStateGraph')
  );
}
