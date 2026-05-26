/**
 * Multi-Agent System Factory
 *
 * This module provides the public facade for creating multi-agent systems.
 *
 * @module patterns/multi-agent/agent
 */

import { createPatternLogger } from '../shared/deduplication.js';
import { createCompiledMultiAgentSystem } from './agent-graph.js';
import { registerWorkerCapabilities } from './agent-runtime.js';
import type { MultiAgentSystemWithRegistry, RegisterWorkerInput } from './agent-types.js';
import type { WorkerCapabilities } from './schemas.js';
import type { MultiAgentSystemConfig } from './types.js';

export { MultiAgentSystemBuilder } from './agent-builder.js';
export type { MultiAgentSystemWithRegistry, RegisterWorkerInput } from './agent-types.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:system');

/**
 * Create a multi-agent coordination system
 *
 * This factory function creates a complete multi-agent system with:
 * - A supervisor agent that routes tasks to workers
 * - Multiple specialized worker agents
 * - An aggregator that combines worker results
 *
 * @param config - Configuration for the multi-agent system
 * @returns Compiled LangGraph workflow
 *
 * @example
 * Basic usage:
 * ```typescript
 * const system = createMultiAgentSystem({
 *   supervisor: {
 *     strategy: 'skill-based',
 *     model: chatModel,
 *   },
 *   workers: [
 *     {
 *       id: 'researcher',
 *       capabilities: {
 *         skills: ['research', 'analysis'],
 *         tools: ['search', 'scrape'],
 *         available: true,
 *         currentWorkload: 0,
 *       },
 *       model: chatModel,
 *     },
 *     {
 *       id: 'writer',
 *       capabilities: {
 *         skills: ['writing', 'editing'],
 *         tools: ['format', 'spell_check'],
 *         available: true,
 *         currentWorkload: 0,
 *       },
 *       model: chatModel,
 *     },
 *   ],
 *   aggregator: {
 *     model: chatModel,
 *   },
 * });
 *
 * const result = await system.invoke({
 *   input: 'Research AI trends and write a summary',
 * });
 * ```
 *
 * @example
 * With checkpointer for human-in-the-loop workflows:
 * ```typescript
 * import { createMultiAgentSystem } from '@agentforge/patterns';
 * import { createAskHumanTool } from '@agentforge/tools';
 * import { MemorySaver } from '@langchain/langgraph';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const checkpointer = new MemorySaver();
 * const askHuman = createAskHumanTool();
 * const model = new ChatOpenAI({ model: 'gpt-4' });
 *
 * const system = createMultiAgentSystem({
 *   supervisor: { strategy: 'skill-based', model },
 *   workers: [
 *     {
 *       id: 'hr',
 *       capabilities: { skills: ['hr'], tools: ['askHuman'], available: true, currentWorkload: 0 },
 *       tools: [askHuman],
 *       model,
 *     },
 *   ],
 *   aggregator: { model },
 *   checkpointer  // Required for askHuman tool
 * });
 *
 * // Invoke with thread_id for conversation continuity
 * const result = await system.invoke(
 *   { input: 'Help me with HR policy question' },
 *   { configurable: { thread_id: 'conversation-123' } }
 * );
 * ```
 */
export function createMultiAgentSystem(config: MultiAgentSystemConfig): MultiAgentSystemWithRegistry {
  return createCompiledMultiAgentSystem(config);
}

/**
 * Register workers with a compiled multi-agent system
 *
 * **Important**: This function only registers worker *capabilities* in the state.
 * It does NOT add worker nodes to the graph (which is impossible after compilation).
 *
 * This means:
 * - Workers must already exist as nodes in the compiled graph
 * - This function only updates their capabilities in the state
 * - For true dynamic worker registration, use `MultiAgentSystemBuilder` instead
 *
 * **Recommended**: Use `MultiAgentSystemBuilder` for a cleaner approach:
 * ```typescript
 * const builder = new MultiAgentSystemBuilder({
 *   supervisor: { llm, strategy: 'skill-based' },
 *   aggregator: { llm },
 * });
 *
 * builder.registerWorkers([...]);
 * const system = builder.build();
 * ```
 *
 * @param system - The compiled multi-agent system
 * @param workers - Array of worker configurations
 *
 * @deprecated Use `MultiAgentSystemBuilder` instead for proper worker registration
 */
export function registerWorkers(
  system: MultiAgentSystemWithRegistry,
  workers: RegisterWorkerInput[],
): void {
  logger.warn(
    '[AgentForge] registerWorkers() on a compiled system only updates worker capabilities in state.\n' +
    'It does NOT add worker nodes to the graph. Use MultiAgentSystemBuilder for proper worker registration.\n' +
    'See: https://github.com/TVScoundrel/agentforge/blob/main/packages/patterns/docs/multi-agent-pattern.md'
  );
  registerWorkerCapabilities(system, workers);
}

/**
 * Helper function to create workers registry for initial state
 *
 * @deprecated Use registerWorkers(system, workers) instead
 * @param workers - Worker configurations with id and capabilities
 * @returns Workers registry for initial state
 */
export function createWorkersRegistry(workers: Array<{ id: string; capabilities: WorkerCapabilities }>) {
  const registry: Record<string, WorkerCapabilities> = {};
  for (const worker of workers) {
    registry[worker.id] = worker.capabilities;
  }
  return registry;
}
