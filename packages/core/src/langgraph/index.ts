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

