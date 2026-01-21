/**
 * Tool system exports
 */

// Type definitions
export {
  ToolCategory,
  type ToolExample,
  type ToolRelations,
  type ToolMetadata,
  type Tool,
} from './types.js';

// Validation schemas
export {
  ToolCategorySchema,
  ToolExampleSchema,
  ToolRelationsSchema,
  ToolNameSchema,
  ToolMetadataSchema,
  validateToolMetadata,
  validateToolName,
} from './schemas.js';

// Schema validation utilities
export {
  MissingDescriptionError,
  validateSchemaDescriptions,
  safeValidateSchemaDescriptions,
  getMissingDescriptions,
} from './validation.js';

// Tool creation helpers
export {
  createTool,
  createToolUnsafe,
  validateTool,
} from './helpers.js';

// Tool builder API
export {
  ToolBuilder,
  toolBuilder,
} from './builder.js';

// Tool registry
export {
  ToolRegistry,
  RegistryEvent,
  type EventHandler,
  type PromptOptions,
} from './registry.js';

// Tool executor (async execution)
export {
  createToolExecutor,
  type Priority,
  type BackoffStrategy as ToolBackoffStrategy,
  type RetryPolicy,
  type ToolExecutorConfig,
  type ToolExecution,
  type ExecutionMetrics,
} from './executor.js';

// Tool lifecycle management
export {
  ManagedTool,
  createManagedTool,
  type HealthCheckResult,
  type ManagedToolConfig,
  type ManagedToolStats,
} from './lifecycle.js';

// Tool composition
export {
  sequential,
  parallel,
  conditional,
  composeTool,
  retry,
  timeout,
  cache,
  type ComposedTool,
  type ConditionalConfig,
  type ComposeToolConfig,
} from './composition.js';

// Tool testing utilities
export {
  createMockTool,
  createToolSimulator,
  type MockToolResponse,
  type MockToolConfig,
  type ToolInvocation,
  type ToolSimulatorConfig,
} from './testing.js';
