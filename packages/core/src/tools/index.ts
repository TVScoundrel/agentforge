/**
 * Tool system exports
 */

// Type definitions
export {
  ToolCategory,
  type ToolExample,
  type ToolMetadata,
  type Tool,
} from './types.js';

// Validation schemas
export {
  ToolCategorySchema,
  ToolExampleSchema,
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

