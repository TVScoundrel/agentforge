/**
 * Multi-Agent System Factory
 *
 * This module provides the main factory function for creating multi-agent systems.
 *
 * @module patterns/multi-agent/agent
 */

import { StateGraph, END, CompiledStateGraph } from '@langchain/langgraph';
import { toLangChainTools } from '@agentforge/core';
import { MultiAgentState } from './state.js';
import type { MultiAgentStateType } from './state.js';
import type { MultiAgentSystemConfig, MultiAgentRouter, WorkerConfig } from './types.js';
import { createSupervisorNode, createWorkerNode, createAggregatorNode } from './nodes.js';
import type { WorkerCapabilities } from './schemas.js';
import { RoutingDecisionSchema } from './schemas.js';

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
export function createMultiAgentSystem(config: MultiAgentSystemConfig) {
  const {
    supervisor,
    workers,
    aggregator,
    maxIterations = 10,
    verbose = false,
    checkpointer,
  } = config;

  // Note: Empty workers array is allowed - workers can be registered later with registerWorkers()

  // Create the graph
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  const workflow = new StateGraph(MultiAgentState);

  // Configure supervisor model with structured output and tools
  let supervisorConfig = { ...supervisor, maxIterations, verbose };
  if (supervisor.model) {
    let configuredModel = supervisor.model;

    // Add structured output for routing decisions (forces JSON response)
    if (supervisor.strategy === 'llm-based') {
      configuredModel = configuredModel.withStructuredOutput!(RoutingDecisionSchema) as any;
    }

    // Bind tools if provided
    if (supervisor.tools && supervisor.tools.length > 0) {
      const langchainTools = toLangChainTools(supervisor.tools);
      // bindTools returns Runnable which is compatible but types don't match exactly
      configuredModel = configuredModel.bindTools!(langchainTools) as any;
    }

    supervisorConfig.model = configuredModel;
  }

  // Add supervisor node
  const supervisorNode = createSupervisorNode(supervisorConfig);
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

    // Route to the current agent(s)
    // Support parallel routing: currentAgent may contain comma-separated agent IDs
    if (state.currentAgent && state.currentAgent !== 'supervisor') {
      // Check if this is parallel routing (multiple agents)
      if (state.currentAgent.includes(',')) {
        // Return array of agent IDs for parallel execution
        const agents = state.currentAgent.split(',').map(a => a.trim());
        return agents as any; // LangGraph supports returning arrays for parallel execution
      }
      // Single agent routing
      return state.currentAgent;
    }

    // Default: stay at supervisor
    return 'supervisor';
  };

  const workerRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Workers always return to supervisor
    // The supervisor will check if all work is done and route to aggregator
    return 'supervisor';
  };

  const aggregatorRouter: MultiAgentRouter = (state: MultiAgentStateType) => {
    // Aggregator always ends
    return END;
  };

  // Set entry point
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.setEntryPoint('supervisor');

  // Add edges from supervisor
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('supervisor', supervisorRouter, [
    'aggregator',
    END,
    ...workerIds,
  ]);

  // Add edges from workers back to supervisor
  for (const workerId of workerIds) {
    // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
    workflow.addConditionalEdges(workerId, workerRouter, ['supervisor']);
  }

  // Add edge from aggregator to end
  // @ts-ignore - LangGraph's complex generic types don't infer well with createStateAnnotation
  workflow.addConditionalEdges('aggregator', aggregatorRouter, [END]);

  // Compile the graph with checkpointer if provided
  const compiled = workflow.compile(checkpointer ? { checkpointer } : undefined);

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

  // Wrap the stream method to inject worker capabilities into the initial state
  const originalStream = compiled.stream.bind(compiled);
  compiled.stream = async function(input: Partial<MultiAgentStateType>, config?: any) {
    // Merge worker capabilities with any workers in the input
    const mergedInput = {
      ...input,
      workers: {
        ...workerCapabilities,
        ...(input.workers || {}),
      },
    };

    return originalStream(mergedInput, config);
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
    model?: any;
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
        model: worker.model || this.config.supervisor.model,
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

