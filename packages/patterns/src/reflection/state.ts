/**
 * State Management for Reflection Pattern
 *
 * This module defines the state structure for the Reflection agent pattern.
 * The pattern iteratively improves outputs through generation, reflection, and revision.
 *
 * @module patterns/reflection/state
 */

import { z } from 'zod';
import { createStateAnnotation, type StateChannelConfig } from '@agentforge/core';
import {
  ReflectionSchema,
  RevisionSchema,
  ReflectionStatusSchema,
  QualityCriteriaSchema,
  type Reflection,
  type Revision,
  type ReflectionStatus,
  type QualityCriteria,
} from './schemas.js';

/**
 * Reflection state configuration
 *
 * This configuration is used with createStateAnnotation() to create a
 * LangGraph Annotation.Root() with optional Zod validation.
 */
export const ReflectionStateConfig = {
  /**
   * Original user input/task
   */
  input: {
    schema: z.string(),
    default: () => '',
    description: 'Original user input or task',
  } satisfies StateChannelConfig<string, string>,

  /**
   * Current response/output
   */
  currentResponse: {
    schema: z.string().optional(),
    description: 'Current response or output',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,

  /**
   * History of all reflections/critiques
   * Accumulates all reflections
   */
  reflections: {
    schema: z.array(ReflectionSchema),
    reducer: (left: Reflection[], right: Reflection[]) => [...left, ...right],
    default: () => [],
    description: 'History of all reflections and critiques',
  } satisfies StateChannelConfig<Reflection[], Reflection[]>,

  /**
   * History of all revisions
   * Accumulates all revisions
   */
  revisions: {
    schema: z.array(RevisionSchema),
    reducer: (left: Revision[], right: Revision[]) => [...left, ...right],
    default: () => [],
    description: 'History of all revisions',
  } satisfies StateChannelConfig<Revision[], Revision[]>,

  /**
   * Current iteration number
   */
  iteration: {
    schema: z.number().int().nonnegative(),
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
    description: 'Current iteration number',
  } satisfies StateChannelConfig<number, number>,

  /**
   * Current status
   */
  status: {
    schema: ReflectionStatusSchema,
    default: () => 'generating' as ReflectionStatus,
    description: 'Current reflection status',
  } satisfies StateChannelConfig<ReflectionStatus, ReflectionStatus>,

  /**
   * Quality criteria for completion
   */
  qualityCriteria: {
    schema: QualityCriteriaSchema.optional(),
    description: 'Quality criteria for determining completion',
  } satisfies StateChannelConfig<QualityCriteria | undefined, QualityCriteria | undefined>,

  /**
   * Maximum iterations allowed
   */
  maxIterations: {
    schema: z.number().int().positive(),
    default: () => 3,
    description: 'Maximum number of reflection iterations allowed',
  } satisfies StateChannelConfig<number, number>,

  /**
   * Final response (when completed)
   */
  response: {
    schema: z.string().optional(),
    description: 'Final response after reflection process',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,

  /**
   * Error message if failed
   */
  error: {
    schema: z.string().optional(),
    description: 'Error message if reflection failed',
  } satisfies StateChannelConfig<string | undefined, string | undefined>,
};

/**
 * Create the Reflection state annotation
 *
 * This uses LangGraph's Annotation.Root() under the hood, with optional Zod validation.
 */
export const ReflectionState = createStateAnnotation(ReflectionStateConfig);

/**
 * TypeScript type for Reflection state
 * 
 * Manually defined to work around TypeScript's inability to infer the .State property
 */
export type ReflectionStateType = {
  input: string;
  currentResponse?: string;
  reflections: Reflection[];
  revisions: Revision[];
  iteration: number;
  status: ReflectionStatus;
  qualityCriteria?: QualityCriteria;
  maxIterations: number;
  response?: string;
  error?: string;
};

/**
 * Export schemas for external use
 */
export {
  ReflectionSchema,
  RevisionSchema,
  ReflectionStatusSchema,
  QualityCriteriaSchema,
  type Reflection,
  type Revision,
  type ReflectionStatus,
  type QualityCriteria,
};

