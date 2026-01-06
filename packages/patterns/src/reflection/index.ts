/**
 * Reflection Pattern
 *
 * The Reflection pattern iteratively improves outputs through generation,
 * reflection (critique), and revision cycles.
 *
 * @module patterns/reflection
 */

// State
export {
  ReflectionState,
  ReflectionStateConfig,
  type ReflectionStateType,
} from './state.js';

// Schemas
export {
  ReflectionSchema,
  RevisionSchema,
  ReflectionStatusSchema,
  QualityCriteriaSchema,
  ReflectionConfigSchema,
  type Reflection,
  type Revision,
  type ReflectionStatus,
  type QualityCriteria,
  type ReflectionConfig,
} from './schemas.js';

// Types
export {
  type GeneratorConfig,
  type ReflectorConfig,
  type ReviserConfig,
  type ReflectionAgentConfig,
  type ReflectionNode,
  type ReflectionRoute,
  type ReflectionRouter,
} from './types.js';

// Prompts
export {
  DEFAULT_GENERATOR_SYSTEM_PROMPT,
  DEFAULT_REFLECTOR_SYSTEM_PROMPT,
  DEFAULT_REVISER_SYSTEM_PROMPT,
  GENERATION_PROMPT_TEMPLATE,
  REFLECTION_PROMPT_TEMPLATE,
  REVISION_PROMPT_TEMPLATE,
  QUALITY_CRITERIA_TEMPLATE,
  REFLECTION_HISTORY_TEMPLATE,
  REFLECTION_ENTRY_TEMPLATE,
  REVISION_ENTRY_TEMPLATE,
} from './prompts.js';

// Node creators
export {
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
  createFinisherNode,
} from './nodes.js';

// Agent creation
export {
  createReflectionAgent,
} from './agent.js';

