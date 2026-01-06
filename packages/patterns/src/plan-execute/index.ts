/**
 * Plan-and-Execute Pattern
 *
 * This module exports the Plan-and-Execute agent pattern implementation.
 * The pattern separates planning from execution for better performance on complex tasks.
 *
 * @module patterns/plan-execute
 */

// Main agent factory
export { createPlanExecuteAgent } from './agent.js';

// Node creators
export {
  createPlannerNode,
  createExecutorNode,
  createReplannerNode,
  createFinisherNode,
} from './nodes.js';

// State and types
export {
  PlanExecuteState,
  PlanExecuteStateConfig,
  type PlanExecuteStateType,
} from './state.js';

export type {
  PlannerConfig,
  ExecutorConfig,
  ReplannerConfig,
  PlanExecuteAgentConfig,
  PlanExecuteNode,
  PlanExecuteRoute,
  PlanExecuteRouter,
} from './types.js';

// Schemas
export {
  PlanStepSchema,
  CompletedStepSchema,
  PlanSchema,
  ReplanDecisionSchema,
  ExecutionStatusSchema,
  type PlanStep,
  type CompletedStep,
  type Plan,
  type ReplanDecision,
  type ExecutionStatus,
} from './schemas.js';

// Prompts
export {
  DEFAULT_PLANNER_SYSTEM_PROMPT,
  DEFAULT_REPLANNER_SYSTEM_PROMPT,
  PLANNING_PROMPT_TEMPLATE,
  REPLANNING_PROMPT_TEMPLATE,
} from './prompts.js';

