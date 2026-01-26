/**
 * State Management for Plan-and-Execute Pattern
 *
 * This module defines the state structure for the Plan-and-Execute agent pattern.
 * The pattern separates planning from execution for better performance on complex tasks.
 *
 * @module patterns/plan-execute/state
 */

import { z } from 'zod';
import { createStateAnnotation, type StateChannelConfig } from '@agentforge/core';
import {
  PlanSchema,
  CompletedStepSchema,
  ExecutionStatusSchema,
  type Plan,
  type CompletedStep,
  type ExecutionStatus,
} from './schemas.js';
import {
  inputField,
  responseField,
  errorField,
  iterationField,
  maxIterationsField,
} from '../shared/state-fields.js';

/**
 * Plan-and-Execute state configuration
 *
 * This configuration is used with createStateAnnotation() to create a
 * LangGraph Annotation.Root() with optional Zod validation.
 */
export const PlanExecuteStateConfig = {
  /**
   * Original user input/query
   */
  input: inputField,

  /**
   * The current plan
   */
  plan: {
    schema: PlanSchema.optional(),
    description: 'The current execution plan',
  } satisfies StateChannelConfig<Plan | undefined, Plan | undefined>,

  /**
   * Completed steps with their results
   * Accumulates all completed steps
   */
  pastSteps: {
    schema: z.array(CompletedStepSchema),
    reducer: (left: CompletedStep[], right: CompletedStep[]) => [...left, ...right],
    default: () => [],
    description: 'Completed steps with their results',
  } satisfies StateChannelConfig<CompletedStep[], CompletedStep[]>,

  /**
   * Index of the current step being executed
   */
  currentStepIndex: {
    schema: z.number().int().nonnegative().optional(),
    description: 'Index of the current step being executed',
  } satisfies StateChannelConfig<number | undefined, number | undefined>,

  /**
   * Current execution status
   */
  status: {
    schema: ExecutionStatusSchema,
    default: () => 'planning' as ExecutionStatus,
    description: 'Current execution status',
  } satisfies StateChannelConfig<ExecutionStatus, ExecutionStatus>,

  /**
   * Final response
   */
  response: responseField,

  /**
   * Error message if execution failed
   */
  error: errorField,

  /**
   * Iteration counter for replanning
   */
  iteration: iterationField,

  /**
   * Maximum iterations allowed
   */
  maxIterations: maxIterationsField(5),
};

/**
 * Create the Plan-Execute state annotation
 *
 * This uses LangGraph's Annotation.Root() under the hood, with optional Zod validation.
 */
export const PlanExecuteState = createStateAnnotation(PlanExecuteStateConfig);

/**
 * TypeScript type for Plan-Execute state
 *
 * Manually defined to work around TypeScript's inability to infer the .State property
 */
export type PlanExecuteStateType = {
  input: string;
  plan?: Plan;
  pastSteps: CompletedStep[];
  currentStepIndex?: number;
  status: ExecutionStatus;
  response?: string;
  error?: string;
  iteration: number;
  maxIterations: number;
};

/**
 * Export schemas for external use
 */
export {
  PlanSchema,
  CompletedStepSchema,
  ExecutionStatusSchema,
  type Plan,
  type CompletedStep,
  type ExecutionStatus,
};

