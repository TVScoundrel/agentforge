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
import { admitWorkerTopology, createWorkerRegistryData } from './worker-lifecycle.js';

export { MultiAgentSystemBuilder } from './agent-builder.js';
export type { MultiAgentSystemWithRegistry, RegisterWorkerInput } from './agent-types.js';
export { WorkerLifecycleError, type WorkerLifecycleErrorReason } from './worker-lifecycle.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:system');
const systemsWarnedAboutLegacyRegistration = new WeakSet<object>();

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
export function createMultiAgentSystem(
  config: MultiAgentSystemConfig
): MultiAgentSystemWithRegistry {
  const lifecycle = admitWorkerTopology(config.workers);
  return createCompiledMultiAgentSystem(config, lifecycle);
}

/**
 * Register workers with a compiled multi-agent system
 *
 * **Important**: This function only updates routing skills for known Workers.
 * It does NOT add Worker nodes or change executable tools after compilation.
 *
 * This means:
 * - Workers must already exist in the compiled Worker topology
 * - Supplied tools, when present, must match the compiled executable tool set
 * - Use `MultiAgentSystemBuilder` to admit Workers before compilation
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
  workers: RegisterWorkerInput[]
): void {
  if (!systemsWarnedAboutLegacyRegistration.has(system)) {
    systemsWarnedAboutLegacyRegistration.add(system);
    logger.warn(
      '[AgentForge] registerWorkers() on a compiled system only updates routing skills for known Workers.\n' +
        'It does NOT add Worker nodes or change compiled tools. Use MultiAgentSystemBuilder before compilation.\n' +
        'See: https://github.com/TVScoundrel/agentforge/blob/main/packages/patterns/docs/multi-agent-pattern.md'
    );
  }
  registerWorkerCapabilities(system, workers);
}

/**
 * Construct detached Worker registry records for initial state data.
 *
 * This helper applies Worker lifecycle normalization without admitting Workers,
 * creating graph topology, or associating the result with a compiled system.
 * Empty input is therefore valid. Use the factory or builder when Workers must
 * be admitted into an executable Multi-Agent System.
 *
 * @deprecated Prefer the factory or builder for Worker admission. This helper
 * remains available for callers that only need compatible registry data.
 * @param workers - Worker identities and combined capability/status records
 * @returns An immutable, detached Worker registry
 */
export function createWorkersRegistry(
  workers: readonly { id: string; capabilities: WorkerCapabilities }[]
) {
  return createWorkerRegistryData(workers);
}
