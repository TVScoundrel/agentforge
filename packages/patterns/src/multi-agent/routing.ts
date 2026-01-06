/**
 * Routing Strategy Implementations for Multi-Agent Pattern
 *
 * This module implements various routing strategies for distributing tasks
 * among worker agents.
 *
 * @module patterns/multi-agent/routing
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { MultiAgentStateType } from './state.js';
import type { SupervisorConfig, RoutingStrategyImpl } from './types.js';
import type { RoutingDecision, WorkerCapabilities } from './schemas.js';

/**
 * Default system prompt for LLM-based routing
 */
export const DEFAULT_SUPERVISOR_SYSTEM_PROMPT = `You are a supervisor agent responsible for routing tasks to specialized worker agents.

Your job is to:
1. Analyze the current task and context
2. Review available worker capabilities
3. Select the most appropriate worker for the task
4. Provide clear reasoning for your decision

Respond with a JSON object containing:
{
  "targetAgent": "worker_id",
  "reasoning": "explanation of why this worker is best suited",
  "confidence": 0.0-1.0,
  "strategy": "llm-based"
}`;

/**
 * LLM-based routing strategy
 * Uses an LLM to intelligently route tasks based on worker capabilities
 */
export const llmBasedRouting: RoutingStrategyImpl = {
  name: 'llm-based',
  
  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
    if (!config.llm) {
      throw new Error('LLM-based routing requires an LLM to be configured');
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

Select the best worker for this task and explain your reasoning.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ];

    const response = await config.llm.invoke(messages);
    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);

    // Parse the routing decision
    try {
      const decision = JSON.parse(content);
      return {
        targetAgent: decision.targetAgent,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        strategy: 'llm-based',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to parse routing decision from LLM: ${error}`);
    }
  },
};

/**
 * Round-robin routing strategy
 * Distributes tasks evenly across all available workers
 */
export const roundRobinRouting: RoutingStrategyImpl = {
  name: 'round-robin',
  
  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
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
  
  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
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

  async route(state: MultiAgentStateType, config: SupervisorConfig): Promise<RoutingDecision> {
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

