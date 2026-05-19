import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createPatternLogger } from '../../shared/deduplication.js';
import { RoutingDecisionSchema } from '../schemas.js';
import type { RoutingDecision } from '../schemas.js';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingStrategyImpl, SupervisorConfig } from '../types.js';
import type { RoutingModelLike, StructuredOutputCapableRoutingModel, RoutingDecisionInvoker } from './types.js';

type ContentCarrier = {
  content?: unknown;
};

export const logger = createPatternLogger('agentforge:patterns:multi-agent:routing');

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

async function invokeStructuredRoutingDecision(
  model: StructuredOutputCapableRoutingModel,
  messages: [SystemMessage, HumanMessage]
): Promise<RoutingDecision> {
  let structuredModel: RoutingDecisionInvoker;
  try {
    structuredModel = model.withStructuredOutput!(RoutingDecisionSchema);
  } catch (error) {
    logger.warn('Structured output unavailable, using direct routing fallback', {
      strategy: 'llm-based',
      fallback: 'direct-model-invoke',
      error: error instanceof Error ? error.message : String(error),
    });
    const decision = await model.invoke(messages);
    return finalizeLlmRoutingDecision(decision);
  }

  const decision = await structuredModel.invoke(messages);
  return finalizeLlmRoutingDecision(decision);
}

async function invokeRoutingDecision(
  model: RoutingModelLike,
  messages: [SystemMessage, HumanMessage]
): Promise<RoutingDecision> {
  if (hasStructuredOutput(model)) {
    return invokeStructuredRoutingDecision(model, messages);
  }

  const decision = await model.invoke(messages);
  return finalizeLlmRoutingDecision(decision);
}

export const llmBasedRouting: RoutingStrategyImpl = {
  name: 'llm-based',

  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
    if (!config.model) {
      throw new Error('LLM-based routing requires a model to be configured');
    }

    const systemPrompt = config.systemPrompt || DEFAULT_SUPERVISOR_SYSTEM_PROMPT;
    const workerInfo = Object.entries(state.workers)
      .map(([id, caps]) => {
        const skills = caps.skills.join(', ');
        const tools = caps.tools.join(', ');
        const available = caps.available ? 'available' : 'busy';
        return `- ${id}: Skills: [${skills}], Tools: [${tools}], Status: ${available}, Workload: ${caps.currentWorkload}`;
      })
      .join('\n');
    const lastMessage = state.messages[state.messages.length - 1];
    const taskContext = lastMessage?.content || state.input;

    const userPrompt = `Current task: ${taskContext}

Available workers:
${workerInfo}

Select the best worker(s) for this task and explain your reasoning.`;

    const messages: [SystemMessage, HumanMessage] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ];

    return invokeRoutingDecision(config.model, messages);
  },
};
