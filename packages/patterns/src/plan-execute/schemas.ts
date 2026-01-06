/**
 * Zod Schemas for Plan-and-Execute Pattern
 *
 * This module defines the validation schemas for the Plan-and-Execute agent pattern.
 * The pattern separates planning from execution for better performance on complex tasks.
 *
 * @module patterns/plan-execute/schemas
 */

import { z } from 'zod';

/**
 * Schema for a single step in the plan
 */
export const PlanStepSchema = z.object({
  /**
   * Unique identifier for the step
   */
  id: z.string().describe('Unique identifier for the step'),

  /**
   * Description of what this step should accomplish
   */
  description: z.string().describe('Description of what this step should accomplish'),

  /**
   * Optional dependencies on other steps (by ID)
   */
  dependencies: z.array(z.string()).optional().describe('IDs of steps that must complete before this one'),

  /**
   * Optional tool to use for this step
   */
  tool: z.string().optional().describe('Name of the tool to use for this step'),

  /**
   * Optional arguments for the tool
   */
  args: z.record(z.any()).optional().describe('Arguments to pass to the tool'),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

/**
 * Schema for a completed step with its result
 */
export const CompletedStepSchema = z.object({
  /**
   * The step that was executed
   */
  step: PlanStepSchema.describe('The step that was executed'),

  /**
   * The result of executing the step
   */
  result: z.any().describe('The result of executing the step'),

  /**
   * Whether the step succeeded
   */
  success: z.boolean().describe('Whether the step succeeded'),

  /**
   * Optional error message if the step failed
   */
  error: z.string().optional().describe('Error message if the step failed'),

  /**
   * Timestamp when the step was completed
   */
  timestamp: z.string().datetime().describe('ISO timestamp when the step was completed'),
});

export type CompletedStep = z.infer<typeof CompletedStepSchema>;

/**
 * Schema for the complete plan
 */
export const PlanSchema = z.object({
  /**
   * List of steps in the plan
   */
  steps: z.array(PlanStepSchema).describe('List of steps in the plan'),

  /**
   * Overall goal of the plan
   */
  goal: z.string().describe('Overall goal of the plan'),

  /**
   * Timestamp when the plan was created
   */
  createdAt: z.string().datetime().describe('ISO timestamp when the plan was created'),

  /**
   * Optional confidence score (0-1)
   */
  confidence: z.number().min(0).max(1).optional().describe('Confidence score for the plan (0-1)'),
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * Schema for re-planning decision
 */
export const ReplanDecisionSchema = z.object({
  /**
   * Whether to replan
   */
  shouldReplan: z.boolean().describe('Whether to replan based on current results'),

  /**
   * Reason for the decision
   */
  reason: z.string().describe('Reason for the replan decision'),

  /**
   * Optional new goal if replanning
   */
  newGoal: z.string().optional().describe('Updated goal if replanning'),
});

export type ReplanDecision = z.infer<typeof ReplanDecisionSchema>;

/**
 * Schema for execution status
 */
export const ExecutionStatusSchema = z.enum([
  'planning',
  'executing',
  'replanning',
  'completed',
  'failed',
]).describe('Current status of the plan execution');

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

/**
 * Export all schemas
 */
export {
  PlanStepSchema as default,
};

