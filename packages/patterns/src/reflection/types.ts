/**
 * Type Definitions for Reflection Pattern
 *
 * This module defines TypeScript types for the Reflection pattern.
 *
 * @module patterns/reflection/types
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { ReflectionStateType } from './state.js';
import type { QualityCriteria } from './schemas.js';

/**
 * Configuration for the generator node
 */
export interface GeneratorConfig {
  /**
   * Language model for generation
   */
  model: BaseChatModel;

  /**
   * System prompt for the generator
   */
  systemPrompt?: string;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;
}

/**
 * Configuration for the reflector node
 */
export interface ReflectorConfig {
  /**
   * Language model for reflection
   */
  model: BaseChatModel;

  /**
   * System prompt for the reflector
   */
  systemPrompt?: string;

  /**
   * Quality criteria to evaluate against
   */
  qualityCriteria?: QualityCriteria;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;
}

/**
 * Configuration for the reviser node
 */
export interface ReviserConfig {
  /**
   * Language model for revision
   */
  model: BaseChatModel;

  /**
   * System prompt for the reviser
   */
  systemPrompt?: string;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;
}

/**
 * Configuration for the reflection agent
 */
export interface ReflectionAgentConfig {
  /**
   * Generator configuration
   */
  generator: GeneratorConfig;

  /**
   * Reflector configuration
   */
  reflector: ReflectorConfig;

  /**
   * Reviser configuration
   */
  reviser: ReviserConfig;

  /**
   * Maximum number of reflection iterations
   */
  maxIterations?: number;

  /**
   * Quality criteria for completion
   */
  qualityCriteria?: QualityCriteria;

  /**
   * Whether to include verbose logging
   */
  verbose?: boolean;

  /**
   * Optional checkpointer for state persistence
   * Required for human-in-the-loop workflows (askHuman tool), interrupts, and conversation continuity
   *
   * @example
   * ```typescript
   * import { MemorySaver } from '@langchain/langgraph';
   *
   * const checkpointer = new MemorySaver();
   * const agent = createReflectionAgent({
   *   generator: { model },
   *   reflector: { model },
   *   reviser: { model },
   *   checkpointer
   * });
   * ```
   */
  checkpointer?: BaseCheckpointSaver;
}

/**
 * Node function type for reflection pattern
 */
export type ReflectionNode = (
  state: ReflectionStateType
) => Promise<Partial<ReflectionStateType>>;

/**
 * Routing decision for reflection pattern
 */
export type ReflectionRoute = 'generate' | 'reflect' | 'revise' | 'finish' | 'error';

/**
 * Router function type for reflection pattern
 */
export type ReflectionRouter = (state: ReflectionStateType) => ReflectionRoute;

