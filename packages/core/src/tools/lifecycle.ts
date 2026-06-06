/**
 * Tool Lifecycle Management facade
 * @module tools/lifecycle
 */

export { ManagedTool, createManagedTool } from './lifecycle-managed-tool.js';
export type {
  ManagedToolConfig,
  ManagedToolStats,
  ToolHealthCheckResult,
} from './lifecycle-types.js';
