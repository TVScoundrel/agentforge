/**
 * LangGraph State Utilities
 *
 * Type-safe helpers for working with LangGraph state management.
 * These utilities wrap LangGraph's Annotation API to provide better TypeScript ergonomics.
 *
 * @module langgraph/state
 */

import { Annotation, type AnnotationRoot, type StateDefinition } from '@langchain/langgraph';
import { z, type ZodType, type ZodTypeDef } from 'zod';

/**
 * State channel configuration with optional Zod schema validation
 */
export interface StateChannelConfig<T = any, U = T> {
  /**
   * Optional Zod schema for runtime validation
   */
  schema?: ZodType<T, ZodTypeDef, any>;

  /**
   * Optional reducer function for aggregating updates
   */
  reducer?: (left: T, right: U) => T;

  /**
   * Optional default value factory
   */
  default?: () => T;

  /**
   * Description of this state channel (for documentation)
   */
  description?: string;
}

/**
 * Create a type-safe state annotation with optional Zod validation
 *
 * This is a thin wrapper around LangGraph's Annotation.Root that adds:
 * - Zod schema validation support
 * - Better TypeScript inference
 * - Documentation/description support
 *
 * @example
 * ```typescript
 * import { createStateAnnotation } from '@agentforge/core';
 * import { z } from 'zod';
 *
 * const AgentState = createStateAnnotation({
 *   messages: {
 *     schema: z.array(z.string()),
 *     reducer: (left, right) => [...left, ...right],
 *     default: () => [],
 *     description: 'Chat messages'
 *   },
 *   context: {
 *     schema: z.record(z.any()),
 *     default: () => ({}),
 *     description: 'Agent context'
 *   }
 * });
 *
 * type State = typeof AgentState.State;
 * ```
 */
export function createStateAnnotation<
  T extends Record<string, StateChannelConfig>
>(
  config: T
): AnnotationRoot<StateDefinition> {
  // Convert our config to LangGraph's StateDefinition format
  const stateDefinition: StateDefinition = {};

  for (const [key, channelConfig] of Object.entries(config)) {
    if (channelConfig.reducer) {
      // Use BinaryOperatorAggregate for channels with reducers
      stateDefinition[key] = Annotation<any>({
        reducer: channelConfig.reducer,
        default: channelConfig.default,
      });
    } else {
      // Use LastValue for simple channels
      // Note: LangGraph's Annotation doesn't support default for LastValue channels
      // Defaults must be handled at the application level
      stateDefinition[key] = Annotation<any>();
    }
  }

  return Annotation.Root(stateDefinition);
}

/**
 * Validate state against Zod schemas
 *
 * @param state - The state object to validate
 * @param config - The state channel configuration with schemas
 * @returns Validated state
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * const config = {
 *   messages: { schema: z.array(z.string()) },
 *   count: { schema: z.number() }
 * };
 *
 * const validatedState = validateState(
 *   { messages: ['hello'], count: 42 },
 *   config
 * );
 * ```
 */
export function validateState<T extends Record<string, StateChannelConfig>>(
  state: Record<string, any>,
  config: T
): Record<string, any> {
  const validated: Record<string, any> = {};

  for (const [key, channelConfig] of Object.entries(config)) {
    if (channelConfig.schema && key in state) {
      // Validate with Zod schema
      validated[key] = channelConfig.schema.parse(state[key]);
    } else if (key in state) {
      // No schema, pass through
      validated[key] = state[key];
    } else if (channelConfig.default) {
      // Use default if key missing
      validated[key] = channelConfig.default();
    }
  }

  return validated;
}

/**
 * Merge state updates using configured reducers
 *
 * @param currentState - Current state
 * @param update - State update
 * @param config - State channel configuration
 * @returns Merged state
 *
 * @example
 * ```typescript
 * const config = {
 *   messages: {
 *     reducer: (left, right) => [...left, ...right]
 *   }
 * };
 *
 * const merged = mergeState(
 *   { messages: ['a', 'b'] },
 *   { messages: ['c'] },
 *   config
 * );
 * // Result: { messages: ['a', 'b', 'c'] }
 * ```
 */
export function mergeState<T extends Record<string, StateChannelConfig>>(
  currentState: Record<string, any>,
  update: Record<string, any>,
  config: T
): Record<string, any> {
  const merged = { ...currentState };

  for (const [key, value] of Object.entries(update)) {
    const channelConfig = config[key];

    if (channelConfig?.reducer && key in merged) {
      // Apply reducer
      merged[key] = channelConfig.reducer(merged[key], value);
    } else {
      // Simple replacement
      merged[key] = value;
    }
  }

  return merged;
}

