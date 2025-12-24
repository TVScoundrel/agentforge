/**
 * LangGraph Integration
 *
 * Type-safe utilities for working with LangGraph.
 * These are thin wrappers that enhance LangGraph's API with better TypeScript ergonomics.
 *
 * @module langgraph
 */

export {
  createStateAnnotation,
  validateState,
  mergeState,
  type StateChannelConfig,
} from './state.js';

export {
  createSequentialWorkflow,
  sequentialBuilder,
  createParallelWorkflow,
  createConditionalRouter,
  createBinaryRouter,
  createMultiRouter,
  createSubgraph,
  composeGraphs,
  type SequentialNode,
  type SequentialWorkflowOptions,
  type ParallelNode,
  type AggregateNode,
  type ParallelWorkflowOptions,
  type ParallelWorkflowConfig,
  type RouteName,
  type RouteMap,
  type RouteCondition,
  type ConditionalRouterConfig,
  type ConditionalRouter,
  type SubgraphBuilder,
  type ComposeGraphsOptions,
} from './builders/index.js';

export {
  withRetry,
  withErrorHandler,
  withTimeout,
  TimeoutError,
  type RetryOptions,
  type BackoffStrategy,
  type ErrorHandlerOptions,
  type TimeoutOptions,
} from './patterns/index.js';

