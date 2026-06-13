/**
 * LangGraph State Utilities
 *
 * Type-safe helpers for working with LangGraph state management.
 * These utilities wrap LangGraph's Annotation API to provide better TypeScript ergonomics.
 *
 * @module langgraph/state
 */

export { createStateAnnotation } from './state-annotation.js';
export { validateState } from './state-validation.js';
export { mergeState } from './state-merge.js';
export type { StateChannelConfig } from './state-types.js';
