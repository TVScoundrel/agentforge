/**
 * @agentforge/testing
 * 
 * Testing utilities and helpers for AgentForge framework
 */

// Mocks
export {
  MockLLM,
  createMockLLM,
  createEchoLLM,
  createErrorLLM,
  type MockLLMConfig,
} from './mocks/mock-llm.js';

export {
  createMockTool,
  createEchoTool,
  createErrorTool,
  createDelayedTool,
  createCalculatorTool,
  type MockToolConfig,
} from './mocks/mock-tool.js';

// Helpers
export {
  StateBuilder,
  createStateBuilder,
  createConversationState,
  createReActState,
  createPlanningState,
} from './helpers/state-builder.js';

export {
  assertIsMessage,
  assertMessageContains,
  assertLastMessageContains,
  assertStateHasFields,
  assertToolCalled,
  assertCompletesWithin,
  assertThrowsWithMessage,
  assertStateSnapshot,
  assertAlternatingMessages,
  assertNotEmpty,
  assertInRange,
  assertIterationsWithinLimit,
  assertHasKeys,
} from './helpers/assertions.js';

// Fixtures
export {
  simpleGreeting,
  multiTurnConversation,
  toolUsageConversation,
  errorHandlingConversation,
  complexReasoningConversation,
  longContextConversation,
  createConversation,
  createConversationWithSystem,
  sampleData,
} from './fixtures/conversations.js';

export {
  calculatorTool,
  searchTool,
  timeTool,
  weatherTool,
  fileReaderTool,
  databaseQueryTool,
  sampleTools,
  getToolsByCategory,
  getToolByName,
} from './fixtures/tools.js';

// Runners
export {
  AgentTestRunner,
  createAgentTestRunner,
  type AgentTestConfig,
  type AgentTestResult,
} from './runners/agent-test-runner.js';

export {
  ConversationSimulator,
  createConversationSimulator,
  type ConversationSimulatorConfig,
  type ConversationResult,
} from './runners/conversation-simulator.js';

export {
  createSnapshot,
  assertMatchesSnapshot,
  createMessageSnapshot,
  assertMessagesMatchSnapshot,
  compareStates,
  createStateDiff,
  assertStateChanged,
  type SnapshotConfig,
} from './runners/snapshot-testing.js';

