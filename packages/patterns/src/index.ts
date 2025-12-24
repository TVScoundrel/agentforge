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

