import { createPatternLogger } from '../shared/deduplication.js';

export const plannerLogger = createPatternLogger('agentforge:patterns:plan-execute:planner');
export const executorLogger = createPatternLogger('agentforge:patterns:plan-execute:executor');
export const replannerLogger = createPatternLogger('agentforge:patterns:plan-execute:replanner');
