import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Sample conversation: Simple greeting
 */
export const simpleGreeting: BaseMessage[] = [
  new HumanMessage('Hello!'),
  new AIMessage('Hi! How can I help you today?'),
];

/**
 * Sample conversation: Multi-turn conversation
 */
export const multiTurnConversation: BaseMessage[] = [
  new HumanMessage('What is the weather like?'),
  new AIMessage('I don\'t have access to real-time weather data. Could you tell me your location?'),
  new HumanMessage('I\'m in San Francisco'),
  new AIMessage('San Francisco typically has mild weather. For current conditions, I recommend checking a weather service.'),
];

/**
 * Sample conversation: Tool usage
 */
export const toolUsageConversation: BaseMessage[] = [
  new HumanMessage('What is 25 + 37?'),
  new AIMessage('Let me calculate that for you.'),
  new AIMessage('25 + 37 = 62'),
];

/**
 * Sample conversation: Error handling
 */
export const errorHandlingConversation: BaseMessage[] = [
  new HumanMessage('Can you divide 10 by 0?'),
  new AIMessage('I cannot divide by zero as it\'s mathematically undefined.'),
];

/**
 * Sample conversation: Complex reasoning
 */
export const complexReasoningConversation: BaseMessage[] = [
  new SystemMessage('You are a helpful assistant that can reason through problems step by step.'),
  new HumanMessage('If I have 3 apples and buy 2 more, then give away 1, how many do I have?'),
  new AIMessage('Let me think through this step by step:\n1. Start with 3 apples\n2. Buy 2 more: 3 + 2 = 5 apples\n3. Give away 1: 5 - 1 = 4 apples\n\nYou have 4 apples.'),
];

/**
 * Sample conversation: Long context
 */
export const longContextConversation: BaseMessage[] = [
  new HumanMessage('Tell me about artificial intelligence'),
  new AIMessage('Artificial Intelligence (AI) is a branch of computer science focused on creating systems that can perform tasks that typically require human intelligence...'),
  new HumanMessage('What are the main types of AI?'),
  new AIMessage('The main types of AI include:\n1. Narrow AI (Weak AI)\n2. General AI (Strong AI)\n3. Superintelligent AI'),
  new HumanMessage('Can you explain Narrow AI?'),
  new AIMessage('Narrow AI, also called Weak AI, is designed to perform specific tasks...'),
];

/**
 * Create a custom conversation
 */
export function createConversation(exchanges: Array<{ human: string; ai: string }>): BaseMessage[] {
  const messages: BaseMessage[] = [];
  
  exchanges.forEach(({ human, ai }) => {
    messages.push(new HumanMessage(human));
    messages.push(new AIMessage(ai));
  });
  
  return messages;
}

/**
 * Create a conversation with system message
 */
export function createConversationWithSystem(
  systemPrompt: string,
  exchanges: Array<{ human: string; ai: string }>
): BaseMessage[] {
  return [
    new SystemMessage(systemPrompt),
    ...createConversation(exchanges),
  ];
}

/**
 * Sample data for testing
 */
export const sampleData = {
  /**
   * Sample user inputs
   */
  userInputs: [
    'Hello',
    'What can you do?',
    'Help me with a task',
    'Calculate 2 + 2',
    'What is the weather?',
  ],
  
  /**
   * Sample AI responses
   */
  aiResponses: [
    'Hello! How can I assist you today?',
    'I can help you with various tasks including calculations, information lookup, and more.',
    'I\'d be happy to help! What task do you need assistance with?',
    '2 + 2 = 4',
    'I don\'t have access to real-time weather data.',
  ],
  
  /**
   * Sample tool calls
   */
  toolCalls: [
    { name: 'calculator', args: { operation: 'add', a: 2, b: 2 } },
    { name: 'search', args: { query: 'weather forecast' } },
    { name: 'get-time', args: {} },
  ],

  /**
   * Sample tool results
   */
  toolResults: [
    { name: 'calculator', result: '4' },
    { name: 'search', result: 'Weather forecast: Sunny, 72°F' },
    { name: 'get-time', result: '2026-01-06T12:00:00Z' },
  ],
};

