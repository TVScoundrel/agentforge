/**
 * @agentforge/patterns
 *
 * Agent patterns for AgentForge - production-ready agent implementations
 */

// ReAct pattern
export {
  // State and schemas
  ReActState,
  MessageSchema,
  ThoughtSchema,
  ToolCallSchema,
  ToolResultSchema,
  ScratchpadEntrySchema,
  type ReActStateType,
  type Message,
  type Thought,
  type ToolCall,
  type ToolResult,
  type ScratchpadEntry,
  
  // Types
  type ReActAgentConfig,
  type ReActAgentOptions,
  type ReActBuilderOptions,
  type StopConditionFn,
  
  // Prompts
  DEFAULT_REACT_SYSTEM_PROMPT,
  
  // Agent creation
  createReActAgent,
  ReActAgentBuilder,
  createReActAgentBuilder,
} from './react/index.js';

// Plan-and-Execute pattern
export {
  // State and schemas
  PlanExecuteState,
  PlanExecuteStateConfig,
  PlanStepSchema,
  CompletedStepSchema,
  PlanSchema,
  ReplanDecisionSchema,
  ExecutionStatusSchema,
  type PlanExecuteStateType,
  type PlanStep,
  type CompletedStep,
  type Plan,
  type ReplanDecision,
  type ExecutionStatus,

  // Types
  type PlannerConfig,
  type ExecutorConfig,
  type ReplannerConfig,
  type PlanExecuteAgentConfig,
  type PlanExecuteNode,
  type PlanExecuteRoute,
  type PlanExecuteRouter,

  // Prompts
  DEFAULT_PLANNER_SYSTEM_PROMPT,
  DEFAULT_REPLANNER_SYSTEM_PROMPT,
  PLANNING_PROMPT_TEMPLATE,
  REPLANNING_PROMPT_TEMPLATE,

  // Node creators
  createPlannerNode,
  createExecutorNode,
  createReplannerNode,
  createFinisherNode,

  // Agent creation
  createPlanExecuteAgent,
} from './plan-execute/index.js';

// Reflection pattern
export {
  // State and schemas
  ReflectionState,
  ReflectionStateConfig,
  ReflectionSchema,
  RevisionSchema,
  ReflectionStatusSchema,
  QualityCriteriaSchema,
  ReflectionConfigSchema,
  type ReflectionStateType,
  type Reflection,
  type Revision,
  type ReflectionStatus,
  type QualityCriteria,
  type ReflectionConfig,

  // Types
  type GeneratorConfig,
  type ReflectorConfig,
  type ReviserConfig,
  type ReflectionAgentConfig,
  type ReflectionNode,
  type ReflectionRoute,
  type ReflectionRouter,

  // Prompts
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

  // Node creators
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
  createFinisherNode as createReflectionFinisherNode,

  // Agent creation
  createReflectionAgent,
} from './reflection/index.js';
