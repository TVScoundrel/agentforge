/**
 * Routing Strategy Implementations for Multi-Agent Pattern
 *
 * This module implements various routing strategies for distributing tasks
 * among worker agents.
 *
 * @module patterns/multi-agent/routing
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createPatternLogger } from '../shared/deduplication.js';
import type { MultiAgentStateType } from './state.js';
import type { SupervisorConfig, RoutingStrategyImpl } from './types.js';
import { RoutingDecisionSchema } from './schemas.js';
import type { RoutingDecision } from './schemas.js';

type RoutingModelLike = NonNullable<SupervisorConfig['model']>;
type RoutingDecisionInvoker = {
  invoke: (input: unknown) => Promise<unknown>;
};

type StructuredOutputCapableRoutingModel = RoutingDecisionInvoker & {
  withStructuredOutput?: (schema: typeof RoutingDecisionSchema) => RoutingDecisionInvoker;
};

type ContentCarrier = {
  content?: unknown;
};

export const logger = createPatternLogger('agentforge:patterns:multi-agent:routing');

function hasStructuredOutput(
  model: RoutingModelLike
): model is RoutingModelLike & StructuredOutputCapableRoutingModel {
  return typeof (model as Partial<StructuredOutputCapableRoutingModel>).withStructuredOutput === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isContentCarrier(value: unknown): value is ContentCarrier {
  return isRecord(value) && 'content' in value;
}

function serializeRoutingContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts = content.flatMap((part) => {
      if (typeof part === 'string') {
        return [part];
      }

      if (isRecord(part) && typeof part.text === 'string') {
        return [part.text];
      }

      return [];
    });

    if (textParts.length > 0) {
      return textParts.join('\n');
    }

    return JSON.stringify(content);
  }

  return JSON.stringify(content);
}

function normalizeRoutingDecisionInput(decision: unknown): unknown {
  if (isContentCarrier(decision)) {
    return JSON.parse(serializeRoutingContent(decision.content));
  }

  return decision;
}

function parseRoutingDecision(decision: unknown): RoutingDecision {
  try {
    return RoutingDecisionSchema.parse(normalizeRoutingDecisionInput(decision));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid LLM routing decision: ${message}`);
  }
}

function finalizeLlmRoutingDecision(decision: unknown): RoutingDecision {
  const parsed = parseRoutingDecision(decision);
  return {
    targetAgent: parsed.targetAgent,
    targetAgents: parsed.targetAgents,
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    strategy: 'llm-based',
    timestamp: Date.now(),
  };
}

async function invokeRoutingDecision(
  model: RoutingModelLike,
  messages: [SystemMessage, HumanMessage]
): Promise<RoutingDecision> {
  if (hasStructuredOutput(model)) {
    const structuredModel = model.withStructuredOutput(RoutingDecisionSchema);
    let decision: unknown;
    try {
      decision = await structuredModel.invoke(messages);
    } catch (error) {
      // Some LangChain models expose withStructuredOutput without actually supporting it.
      // Fall back to direct invocation so routing still works for those models.
      logger.warn('Structured output unavailable, using direct routing fallback', {
        strategy: 'llm-based',
        fallback: 'direct-model-invoke',
        error: error instanceof Error ? error.message : String(error),
      });
      decision = undefined;
    }

    if (decision !== undefined) {
      return finalizeLlmRoutingDecision(decision);
    }
  }

  const decision = await model.invoke(messages);
  return finalizeLlmRoutingDecision(decision);
}

/**
 * Default system prompt for LLM-based routing
 */
export const DEFAULT_SUPERVISOR_SYSTEM_PROMPT = `You are a supervisor agent responsible for routing tasks to specialized worker agents.

Your job is to:
1. Analyze the current task and context
2. Review available worker capabilities
3. Select the most appropriate worker(s) for the task
4. Provide clear reasoning for your decision

**IMPORTANT: You can route to MULTIPLE workers for parallel execution when:**
- The task requires information from multiple domains (e.g., code + documentation)
- Multiple workers have complementary expertise
- Parallel execution would provide a more comprehensive answer

**Response Format:**

For SINGLE worker routing:
{
  "targetAgent": "worker_id",
  "reasoning": "explanation of why this worker is best suited",
  "confidence": 0.0-1.0,
  "strategy": "llm-based"
}

For PARALLEL multi-worker routing:
{
  "targetAgents": ["worker_id_1", "worker_id_2", ...],
  "reasoning": "explanation of why these workers should work in parallel",
  "confidence": 0.0-1.0,
  "strategy": "llm-based"
}

Choose parallel routing when the task benefits from multiple perspectives or data sources.`;

/**
 * LLM-based routing strategy
 * Uses an LLM to intelligently route tasks based on worker capabilities
 */
export const llmBasedRouting: RoutingStrategyImpl = {
  name: 'llm-based',

  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
    if (!config.model) {
      throw new Error('LLM-based routing requires a model to be configured');
    }

    const systemPrompt = config.systemPrompt || DEFAULT_SUPERVISOR_SYSTEM_PROMPT;

    // Build context about available workers
    const workerInfo = Object.entries(state.workers)
      .map(([id, caps]) => {
        const skills = caps.skills.join(', ');
        const tools = caps.tools.join(', ');
        const available = caps.available ? 'available' : 'busy';
        return `- ${id}: Skills: [${skills}], Tools: [${tools}], Status: ${available}, Workload: ${caps.currentWorkload}`;
      })
      .join('\n');

    // Build context about current task
    const lastMessage = state.messages[state.messages.length - 1];
    const taskContext = lastMessage?.content || state.input;

    const userPrompt = `Current task: ${taskContext}

Available workers:
${workerInfo}

Select the best worker(s) for this task and explain your reasoning.`;

    // Prefer schema-bound structured output when the model exposes it.
    const messages: [SystemMessage, HumanMessage] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ];

    return await invokeRoutingDecision(config.model, messages);
  },
};

/**
 * Round-robin routing strategy
 * Distributes tasks evenly across all available workers
 */
export const roundRobinRouting: RoutingStrategyImpl = {
  name: 'round-robin',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    const availableWorkers = Object.entries(state.workers)
      .filter(([_, caps]) => caps.available)
      .map(([id]) => id);

    if (availableWorkers.length === 0) {
      throw new Error('No available workers for round-robin routing');
    }

    // Use routing history to determine next worker
    const lastRoutingIndex = state.routingHistory.length % availableWorkers.length;
    const targetAgent = availableWorkers[lastRoutingIndex];

    return {
      targetAgent,
      targetAgents: null,
      reasoning: `Round-robin selection: worker ${lastRoutingIndex + 1} of ${availableWorkers.length}`,
      confidence: 1.0,
      strategy: 'round-robin',
      timestamp: Date.now(),
    };
  },
};

/**
 * Skill-based routing strategy
 * Routes tasks to workers based on matching skills
 */
export const skillBasedRouting: RoutingStrategyImpl = {
  name: 'skill-based',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    // Extract keywords from the current task
    const lastMessage = state.messages[state.messages.length - 1];
    const taskContent = (lastMessage?.content || state.input).toLowerCase();

    // Score each worker based on skill matches
    const workerScores = Object.entries(state.workers)
      .filter(([_, caps]) => caps.available)
      .map(([id, caps]) => {
        const skillMatches = caps.skills.filter(skill =>
          taskContent.includes(skill.toLowerCase())
        ).length;

        const toolMatches = caps.tools.filter(tool =>
          taskContent.includes(tool.toLowerCase())
        ).length;

        const score = skillMatches * 2 + toolMatches; // Skills weighted higher
        return { id, score, skills: caps.skills, tools: caps.tools };
      })
      .filter(w => w.score > 0)
      .sort((a, b) => b.score - a.score);

    if (workerScores.length === 0) {
      // Fallback to first available worker
      const firstAvailable = Object.entries(state.workers)
        .find(([_, caps]) => caps.available);

      if (!firstAvailable) {
        throw new Error('No available workers for skill-based routing');
      }

      return {
        targetAgent: firstAvailable[0],
        targetAgents: null,
        reasoning: 'No skill matches found, using first available worker',
        confidence: 0.5,
        strategy: 'skill-based',
        timestamp: Date.now(),
      };
    }

    const best = workerScores[0];
    const confidence = Math.min(best.score / 5, 1.0); // Normalize score to confidence

    return {
      targetAgent: best.id,
      targetAgents: null,
      reasoning: `Best skill match with score ${best.score} (skills: ${best.skills.join(', ')})`,
      confidence,
      strategy: 'skill-based',
      timestamp: Date.now(),
    };
  },
};

/**
 * Load-balanced routing strategy
 * Routes tasks to workers with the lowest current workload
 */
export const loadBalancedRouting: RoutingStrategyImpl = {
  name: 'load-balanced',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    const availableWorkers = Object.entries(state.workers)
      .filter(([_, caps]) => caps.available)
      .map(([id, caps]) => ({ id, workload: caps.currentWorkload }))
      .sort((a, b) => a.workload - b.workload);

    if (availableWorkers.length === 0) {
      throw new Error('No available workers for load-balanced routing');
    }

    const targetWorker = availableWorkers[0];
    const avgWorkload = availableWorkers.reduce((sum, w) => sum + w.workload, 0) / availableWorkers.length;
    const confidence = targetWorker.workload === 0 ? 1.0 : Math.max(0.5, 1.0 - (targetWorker.workload / (avgWorkload * 2)));

    return {
      targetAgent: targetWorker.id,
      targetAgents: null,
      reasoning: `Lowest workload: ${targetWorker.workload} tasks (avg: ${avgWorkload.toFixed(1)})`,
      confidence,
      strategy: 'load-balanced',
      timestamp: Date.now(),
    };
  },
};

/**
 * Rule-based routing strategy
 * Uses custom routing function provided in config
 */
export const ruleBasedRouting: RoutingStrategyImpl = {
  name: 'rule-based',

  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
    if (!config.routingFn) {
      throw new Error('Rule-based routing requires a custom routing function');
    }

    return await config.routingFn(state);
  },
};

/**
 * Get routing strategy implementation by name
 */
export function getRoutingStrategy(name: string): RoutingStrategyImpl {
  switch (name) {
    case 'llm-based':
      return llmBasedRouting;
    case 'round-robin':
      return roundRobinRouting;
    case 'skill-based':
      return skillBasedRouting;
    case 'load-balanced':
      return loadBalancedRouting;
    case 'rule-based':
      return ruleBasedRouting;
    default:
      throw new Error(`Unknown routing strategy: ${name}`);
  }
}
