/**
 * Multi-Agent System Factory
 *
 * This module provides the main factory function for creating multi-agent systems.
 *
 * @module patterns/multi-agent/agent
 */

import { StateGraph, END, CompiledStateGraph } from '@langchain/langgraph';
import { MultiAgentState } from './state.js';
import type { MultiAgentStateType } from './state.js';
import type { MultiAgentSystemConfig, MultiAgentRouter, WorkerConfig } from './types.js';
import { createSupervisorNode, createWorkerNode, createAggregatorNode } from './nodes.js';
import type { WorkerCapabilities } from './schemas.js';

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
 * ```typescript
 * const system = createMultiAgentSystem({
 *   supervisor: {
 *     strategy: 'skill-based',
 *     llm: chatModel,
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
 *       llm: chatModel,
 *     },
 *     {
 *       id: 'writer',
 *       capabilities: {
 *         skills: ['writing', 'editing'],
 *         tools: ['format', 'spell_check'],
 *         available: true,
 *         currentWorkload: 0,
 *       },
 *       llm: chatModel,
 *     },
 *   ],
 *   aggregator: {
 *     llm: chatModel,
 *   },
 * });
 *
 * const result = await system.invoke({
 *   input: 'Research AI trends and write a summary',
 * });
 * ```
 */
export function createMultiAgentSystem(config: MultiAgentSystemConfig) {
  const {
    supervisor,
    workers,
    aggregator,
    maxIterations = 10,
    verbose = false,
  } = config;

  // Note: Empty workers array is allowed - workers can be registered later with registerWorkers()

  // Create the graph
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow = new StateGraph(MultiAgentState);

  // Add supervisor node
  const supervisorNode = createSupervisorNode({
    ...supervisor,
    maxIterations,
    verbose,
  });
  workflow.addNode('supervisor', supervisorNode);

  // Add worker nodes and collect capabilities
  const workerIds: string[] = [];
  const workerCapabilities: Record<string, WorkerCapabilities> = {};

  for (const workerConfig of workers) {
    const workerNode = createWorkerNode({
      ...workerConfig,
      verbose,
    });
    workflow.addNode(workerConfig.id, workerNode);
    workerIds.push(workerConfig.id);

    // Store worker capabilities for state initialization
    workerCapabilities[workerConfig.id] = workerConfig.capabilities;
  }

  // Add aggregator node
  const aggregatorNode = createAggregatorNode({
    ...aggregator,
    verbose,
  });
  workflow.addNode('aggregator', aggregatorNode);

  // Define routing logic
  const supervisorRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Check for completion or failure
    if (state.status === 'completed' || state.status === 'failed') {
      return END;
    }

    // Check if we should aggregate
    if (state.status === 'aggregating') {
      return 'aggregator';
    }

    // Route to the current agent
    if (state.currentAgent && state.currentAgent !== 'supervisor') {
      return state.currentAgent;
    }

    // Default: stay at supervisor
    return 'supervisor';
  };

  const workerRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Workers always return to supervisor
    return 'supervisor';
  };

  const aggregatorRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Aggregator always ends
    return END;
  };

  // Set entry point
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.setEntryPoint('supervisor');

  // Add edges from supervisor
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('supervisor', supervisorRouter, [
    'aggregator',
    END,
    ...workerIds,
  ]);

  // Add edges from workers back to supervisor
  for (const workerId of workerIds) {
    // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
    workflow.addConditionalEdges(workerId, workerRouter, ['supervisor']);
  }

  // Add edge from aggregator to end
  // @ts-expect-error - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('aggregator', aggregatorRouter, [END]);

  // Compile the graph
  const compiled = workflow.compile();

  // Wrap the invoke method to inject worker capabilities into the initial state
  const originalInvoke = compiled.invoke.bind(compiled);
  compiled.invoke = async function(input: Partial<MultiAgentStateType>, config?: any) {
    // Merge worker capabilities with any workers in the input
    const mergedInput = {
      ...input,
      workers: {
        ...workerCapabilities,
        ...(input.workers || {}),
      },
    };

    return originalInvoke(mergedInput, config);
  } as any;

  return compiled;
}

/**
 * Multi-agent system builder for dynamic worker registration
 *
 * This builder allows you to register workers before compiling the graph.
 * Once compiled, the graph is immutable and workers cannot be added.
 */
export class MultiAgentSystemBuilder {
  private config: MultiAgentSystemConfig;
  private additionalWorkers: WorkerConfig[] = [];
  private compiled: boolean = false;

  constructor(config: Omit<MultiAgentSystemConfig, 'workers'> & { workers?: WorkerConfig[] }) {
    this.config = {
      ...config,
      workers: config.workers || [],
    };
  }

  /**
   * Register workers with the system builder
   *
   * @param workers - Array of worker configurations
   * @returns this builder for chaining
   *
   * @example
   * ```typescript
   * const builder = new MultiAgentSystemBuilder({
   *   supervisor: { llm, strategy: 'skill-based' },
   *   aggregator: { llm },
   * });
   *
   * builder.registerWorkers([
   *   {
   *     name: 'math_worker',
   *     capabilities: ['math', 'calculations'],
   *     tools: [calculatorTool],
   *   },
   * ]);
   *
   * const system = builder.build();
   * ```
   */
  registerWorkers(workers: Array<{
    name: string;
    description?: string;
    capabilities: string[];
    tools?: any[];
    systemPrompt?: string;
    llm?: any;
  }>): this {
    if (this.compiled) {
      throw new Error('Cannot register workers after the system has been compiled');
    }

    // Convert to WorkerConfig format
    for (const worker of workers) {
      this.additionalWorkers.push({
        id: worker.name,
        capabilities: {
          skills: worker.capabilities,
          tools: worker.tools?.map(t => t.name || 'unknown') || [],
          available: true,
          currentWorkload: 0,
        },
        llm: worker.llm || this.config.supervisor.llm,
        tools: worker.tools,
        systemPrompt: worker.systemPrompt,
      });
    }
    return this;
  }

  /**
   * Build and compile the multi-agent system
   *
   * @returns Compiled LangGraph workflow
   */
  build() {
    if (this.compiled) {
      throw new Error('System has already been compiled');
    }

    // Merge configured workers with registered workers
    const allWorkers = [...this.config.workers, ...this.additionalWorkers];

    if (allWorkers.length === 0) {
      throw new Error('At least one worker must be registered before building the system');
    }

    this.compiled = true;

    return createMultiAgentSystem({
      ...this.config,
      workers: allWorkers,
    });
  }
}

/**
 * Extended multi-agent system with worker registration support
 */
export interface MultiAgentSystemWithRegistry extends CompiledStateGraph<MultiAgentStateType, Partial<MultiAgentStateType>, '__start__' | 'supervisor' | 'aggregator' | string> {
  _workerRegistry?: Record<string, WorkerCapabilities>;
  _originalInvoke?: typeof CompiledStateGraph.prototype.invoke;
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
  workers: Array<{
    name: string;
    description?: string;
    capabilities: string[];
    tools?: any[];
    systemPrompt?: string;
  }>
): void {
  console.warn(
    '[AgentForge] registerWorkers() on a compiled system only updates worker capabilities in state.\n' +
    'It does NOT add worker nodes to the graph. Use MultiAgentSystemBuilder for proper worker registration.\n' +
    'See: https://github.com/agentforge/agentforge/blob/main/packages/patterns/docs/multi-agent-pattern.md'
  );

  // Initialize registry if it doesn't exist
  if (!system._workerRegistry) {
    system._workerRegistry = {};
  }

  // Convert worker configs to capabilities format
  for (const worker of workers) {
    system._workerRegistry[worker.name] = {
      skills: worker.capabilities,
      tools: worker.tools?.map(t => t.name || 'unknown') || [],
      available: true,
      currentWorkload: 0,
    };
  }

  // Wrap the invoke method to inject workers into state (only once)
  if (!system._originalInvoke) {
    system._originalInvoke = system.invoke.bind(system);

    system.invoke = async function(input: Partial<MultiAgentStateType>, config?: any) {
      // Merge registered workers with any workers in the input
      const mergedInput = {
        ...input,
        workers: {
          ...(system._workerRegistry || {}),
          ...(input.workers || {}),
        },
      };

      return system._originalInvoke!(mergedInput, config);
    } as any;
  }
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

