import type { ReActAgentGraph } from './utils-shared.js';

function isKnownCompiledGraphName(name: unknown): boolean {
  return name === 'CompiledGraph' || name === 'CompiledStateGraph';
}

function hasFunctionProperty(
  value: Record<string, unknown>,
  key: string
): boolean {
  return key in value && typeof value[key] === 'function';
}

function hasCompiledGraphBuilder(value: Record<string, unknown>): boolean {
  if (!('builder' in value) || typeof value.builder !== 'object' || value.builder === null) {
    return false;
  }

  const builder = value.builder as Record<string, unknown>;

  return (
    hasFunctionProperty(builder, 'addNode') &&
    hasFunctionProperty(builder, 'addEdge') &&
    hasFunctionProperty(builder, 'compile') &&
    hasFunctionProperty(builder, 'validate')
  );
}

function hasCompiledGraphRuntimeShape(value: Record<string, unknown>): boolean {
  return (
    hasFunctionProperty(value, 'invoke') &&
    hasFunctionProperty(value, 'stream') &&
    hasFunctionProperty(value, 'getGraph') &&
    hasFunctionProperty(value, 'getGraphAsync') &&
    hasCompiledGraphBuilder(value)
  );
}

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
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    hasCompiledGraphRuntimeShape(candidate) ||
    (hasFunctionProperty(candidate, 'invoke') &&
      hasFunctionProperty(candidate, 'stream') &&
      isKnownCompiledGraphName(candidate.constructor?.name))
  );
}
