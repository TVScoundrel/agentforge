/**
 * Zod Schemas for Reflection Pattern
 *
 * This module defines the data structures used in the Reflection pattern.
 * The pattern iteratively improves outputs through generation, reflection, and revision.
 *
 * @module patterns/reflection/schemas
 */

import { z } from 'zod';

/**
 * Schema for a reflection/critique
 */
export const ReflectionSchema = z.object({
  /**
   * The critique or feedback on the current response
   */
  critique: z.string().describe('Critique or feedback on the current response'),

  /**
   * Specific issues identified
   */
  issues: z.array(z.string()).describe('Specific issues or problems identified'),

  /**
   * Suggestions for improvement
   */
  suggestions: z.array(z.string()).describe('Suggestions for improving the response'),

  /**
   * Quality score (0-10)
   */
  score: z.number().min(0).max(10).optional().describe('Quality score from 0 to 10'),

  /**
   * Whether the response meets quality standards
   */
  meetsStandards: z.boolean().describe('Whether the response meets quality standards'),

  /**
   * Timestamp of the reflection
   */
  timestamp: z.date().optional().describe('When this reflection was created'),
});

export type Reflection = z.infer<typeof ReflectionSchema>;

/**
 * Schema for a revision entry
 */
export const RevisionSchema = z.object({
  /**
   * The revised content
   */
  content: z.string().describe('The revised content'),

  /**
   * Which iteration this revision is from
   */
  iteration: z.number().int().nonnegative().describe('Iteration number'),

  /**
   * The reflection that prompted this revision
   */
  basedOn: ReflectionSchema.optional().describe('The reflection that prompted this revision'),

  /**
   * Timestamp of the revision
   */
  timestamp: z.date().optional().describe('When this revision was created'),
});

export type Revision = z.infer<typeof RevisionSchema>;

/**
 * Schema for reflection status
 */
export const ReflectionStatusSchema = z.enum([
  'generating',    // Initial generation
  'reflecting',    // Critiquing current response
  'revising',      // Improving based on critique
  'completed',     // Quality threshold met
  'failed',        // Max iterations reached without meeting standards
]);

export type ReflectionStatus = z.infer<typeof ReflectionStatusSchema>;

/**
 * Schema for quality criteria
 */
export const QualityCriteriaSchema = z.object({
  /**
   * Minimum quality score required (0-10)
   */
  minScore: z.number().min(0).max(10).default(7).describe('Minimum quality score required'),

  /**
   * Specific criteria to evaluate
   */
  criteria: z.array(z.string()).optional().describe('Specific criteria to evaluate'),

  /**
   * Whether all criteria must be met
   */
  requireAll: z.boolean().default(true).describe('Whether all criteria must be met'),
});

export type QualityCriteria = z.infer<typeof QualityCriteriaSchema>;

/**
 * Schema for reflection configuration
 */
export const ReflectionConfigSchema = z.object({
  /**
   * Maximum number of reflection iterations
   */
  maxIterations: z.number().int().positive().default(3).describe('Maximum reflection iterations'),

  /**
   * Quality criteria for completion
   */
  qualityCriteria: QualityCriteriaSchema.optional().describe('Quality criteria for completion'),

  /**
   * Whether to include previous reflections in context
   */
  includeHistory: z.boolean().default(true).describe('Include previous reflections in context'),
});

export type ReflectionConfig = z.infer<typeof ReflectionConfigSchema>;

