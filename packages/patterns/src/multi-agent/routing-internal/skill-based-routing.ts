import type { RoutingDecision } from '../schemas.js';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingStrategyImpl, SupervisorConfig } from '../types.js';
import { getTaskContent } from './worker-selection.js';

type WorkerScore = {
  id: string;
  score: number;
  skills: string[];
};

function scoreWorkers(state: MultiAgentStateType, taskContent: string): WorkerScore[] {
  return Object.entries(state.workers)
    .filter(([_, caps]) => caps.available)
    .map(([id, caps]) => {
      const skillMatches = caps.skills.filter(skill =>
        taskContent.includes(skill.toLowerCase())
      ).length;
      const toolMatches = caps.tools.filter(tool =>
        taskContent.includes(tool.toLowerCase())
      ).length;

      return {
        id,
        score: skillMatches * 2 + toolMatches,
        skills: caps.skills,
      };
    })
    .filter(worker => worker.score > 0)
    .sort((a, b) => b.score - a.score);
}

function createFallbackDecision(state: MultiAgentStateType): RoutingDecision {
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

export const skillBasedRouting: RoutingStrategyImpl = {
  name: 'skill-based',

  async route(state: MultiAgentStateType, _config: SupervisorConfig): Promise<RoutingDecision> {
    const taskContent = getTaskContent(state).toLowerCase();
    const workerScores = scoreWorkers(state, taskContent);

    if (workerScores.length === 0) {
      return createFallbackDecision(state);
    }

    const best = workerScores[0];
    const confidence = Math.min(best.score / 5, 1.0);

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
