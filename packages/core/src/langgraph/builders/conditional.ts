/**
 * Conditional Routing Utilities
 *
 * Provides type-safe utilities for adding conditional edges to LangGraph workflows.
 * This simplifies the common pattern of routing based on state conditions.
 *
 * @module langgraph/builders/conditional
 */

import { END } from '@langchain/langgraph';

/**
 * A route name that can be either a node name or END
 */
export type RouteName = string | typeof END;

/**
 * A mapping of route keys to node names
 */
export type RouteMap = Record<string, RouteName>;

/**
 * A condition function that determines which route to take
 */
export type RouteCondition<State> = (state: State) => string;

/**
 * Configuration for a conditional router
 */
export interface ConditionalRouterConfig<State, Routes extends RouteMap> {
  /**
   * Map of route keys to node names
   */
  routes: Routes;

  /**
   * Condition function that returns a route key
   */
  condition: RouteCondition<State>;

  /**
   * Optional description of the routing logic
   */
  description?: string;
}

/**
 * A conditional router that can be used with StateGraph.addConditionalEdges
 */
export interface ConditionalRouter<State, Routes extends RouteMap> {
  /**
   * The route map
   */
  routes: Routes;

  /**
   * The condition function
   */
  condition: RouteCondition<State>;

  /**
   * Optional description
   */
  description?: string;
}

/**
 * Creates a type-safe conditional router for LangGraph workflows.
 *
 * This provides a cleaner API for conditional routing with better type safety
 * and validation.
 *
 * @example
 * ```typescript
 * const router = createConditionalRouter<AgentState>({
 *   routes: {
 *     'continue': 'agent',
 *     'end': END,
 *     'tools': 'tools',
 *   },
 *   condition: (state) => {
 *     if (state.shouldEnd) return 'end';
 *     if (state.needsTools) return 'tools';
 *     return 'continue';
 *   },
 * });
 *
 * // Use with StateGraph
 * graph.addConditionalEdges('agent', router.condition, router.routes);
 * ```
 *
 * @param config - Configuration for the conditional router
 * @returns A conditional router object
 */
export function createConditionalRouter<State, Routes extends RouteMap = RouteMap>(
  config: ConditionalRouterConfig<State, Routes>
): ConditionalRouter<State, Routes> {
  const { routes, condition, description } = config;

  // Validate that routes is not empty
  if (Object.keys(routes).length === 0) {
    throw new Error('Conditional router must have at least one route');
  }

  // Validate that condition function is provided
  if (typeof condition !== 'function') {
    throw new Error('Conditional router must have a condition function');
  }

  return {
    routes,
    condition,
    description,
  };
}

/**
 * Creates a simple binary router (true/false condition).
 *
 * This is a convenience function for the common case of routing based on
 * a boolean condition.
 *
 * @example
 * ```typescript
 * const router = createBinaryRouter<AgentState>({
 *   condition: (state) => state.isComplete,
 *   ifTrue: END,
 *   ifFalse: 'continue',
 * });
 *
 * graph.addConditionalEdges('check', router.condition, router.routes);
 * ```
 *
 * @param config - Configuration for the binary router
 * @returns A conditional router object
 */
export function createBinaryRouter<State>(config: {
  condition: (state: State) => boolean;
  ifTrue: RouteName;
  ifFalse: RouteName;
  description?: string;
}): ConditionalRouter<State, { true: RouteName; false: RouteName }> {
  const { condition, ifTrue, ifFalse, description } = config;

  return {
    routes: {
      true: ifTrue,
      false: ifFalse,
    },
    condition: (state) => (condition(state) ? 'true' : 'false'),
    description,
  };
}

/**
 * Creates a multi-way router based on a discriminator function.
 *
 * This is useful when you have multiple possible routes based on a
 * state property or computed value.
 *
 * @example
 * ```typescript
 * const router = createMultiRouter<AgentState>({
 *   discriminator: (state) => state.status,
 *   routes: {
 *     'pending': 'process',
 *     'complete': END,
 *     'error': 'error_handler',
 *   },
 *   default: 'unknown',
 * });
 *
 * graph.addConditionalEdges('check', router.condition, router.routes);
 * ```
 *
 * @param config - Configuration for the multi-way router
 * @returns A conditional router object
 */
export function createMultiRouter<State, Routes extends RouteMap = RouteMap>(config: {
  discriminator: (state: State) => string;
  routes: Routes;
  default?: keyof Routes;
  description?: string;
}): ConditionalRouter<State, Routes> {
  const { discriminator, routes, default: defaultRoute, description } = config;

  return {
    routes,
    condition: (state) => {
      const key = discriminator(state);
      if (key in routes) {
        return key;
      }
      if (defaultRoute !== undefined) {
        return defaultRoute as string;
      }
      throw new Error(`No route found for discriminator value: ${key}`);
    },
    description,
  };
}

