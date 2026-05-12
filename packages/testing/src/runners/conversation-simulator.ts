import { createLogger, type Logger } from '@agentforge/core';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { AgentTestAgent } from './agent-test-runner.js';
import { extractMessages } from './agent-test-runner.js';

const conversationSimulatorLogger = createLogger('agentforge:testing:conversation-simulator');

/**
 * Configuration for conversation simulator
 */
export interface ConversationSimulatorConfig {
  /**
   * Maximum number of turns
   */
  maxTurns?: number;
  
  /**
   * Delay between turns (ms)
   */
  turnDelay?: number;
  
  /**
   * Whether to log conversation
   */
  verbose?: boolean;

  /**
   * Structured logger used for verbose conversation output
   */
  logger?: Logger;
  
  /**
   * Stop condition
   */
  stopCondition?: (messages: BaseMessage[]) => boolean;
}

/**
 * Result from conversation simulation
 */
export interface ConversationResult {
  /**
   * All messages in the conversation
   */
  messages: BaseMessage[];
  
  /**
   * Number of turns
   */
  turns: number;
  
  /**
   * Total execution time (ms)
   */
  totalTime: number;
  
  /**
   * Whether conversation completed successfully
   */
  completed: boolean;
  
  /**
   * Reason for stopping
   */
  stopReason: 'max_turns' | 'stop_condition' | 'error';
  
  /**
   * Error if any
   */
  error?: Error;
}

export interface ConversationSimulatorInput {
  messages: BaseMessage[];
}

/**
 * Conversation simulator for testing multi-turn interactions
 * 
 * @example
 * ```typescript
 * const simulator = new ConversationSimulator(agent, {
 *   maxTurns: 5,
 *   verbose: true
 * });
 * 
 * const result = await simulator.simulate([
 *   'Hello',
 *   'What can you do?',
 *   'Help me calculate 2 + 2'
 * ]);
 * 
 * expect(result.turns).toBe(3);
 * expect(result.completed).toBe(true);
 * ```
 */
export class ConversationSimulator<TState = unknown> {
  constructor(
    private agent: AgentTestAgent<ConversationSimulatorInput, TState>,
    private config: ConversationSimulatorConfig = {}
  ) {}
  
  /**
   * Simulate a conversation with predefined user inputs
   */
  async simulate(userInputs: string[]): Promise<ConversationResult> {
    const startTime = Date.now();
    const messages: BaseMessage[] = [];
    let turns = 0;
    let completed = true;
    let stopReason: ConversationResult['stopReason'] = 'max_turns';
    let error: Error | undefined;
    
    const maxTurns = this.config.maxTurns || userInputs.length;
    
    try {
      for (const input of userInputs) {
        if (turns >= maxTurns) {
          stopReason = 'max_turns';
          break;
        }
        
        // Add user message
        const userMessage = new HumanMessage(input);
        messages.push(userMessage);
        
        this.logVerboseTurn('User', input);
        
        // Get agent response
        const result = await this.agent.invoke({ messages });
        const aiMessage = extractLatestMessage(result);
        messages.push(aiMessage);
        
        this.logVerboseTurn('AI', aiMessage.content);
        
        turns++;
        
        // Check stop condition
        if (this.config.stopCondition && this.config.stopCondition(messages)) {
          stopReason = 'stop_condition';
          break;
        }
        
        // Delay between turns
        if (this.config.turnDelay) {
          await new Promise((resolve) => setTimeout(resolve, this.config.turnDelay));
        }
      }
    } catch (err) {
      completed = false;
      stopReason = 'error';
      error = err as Error;
    }
    
    const totalTime = Date.now() - startTime;
    
    return {
      messages,
      turns,
      totalTime,
      completed,
      stopReason,
      error,
    };
  }
  
  /**
   * Simulate a conversation with dynamic user input generation
   */
  async simulateDynamic(
    inputGenerator: (messages: BaseMessage[]) => string | null,
    maxTurns = 10
  ): Promise<ConversationResult> {
    const startTime = Date.now();
    const messages: BaseMessage[] = [];
    let turns = 0;
    let completed = true;
    let stopReason: ConversationResult['stopReason'] = 'max_turns';
    let error: Error | undefined;
    
    try {
      while (turns < maxTurns) {
        const input = inputGenerator(messages);
        
        if (!input) {
          stopReason = 'stop_condition';
          break;
        }
        
        const userMessage = new HumanMessage(input);
        messages.push(userMessage);
        
        const result = await this.agent.invoke({ messages });
        const aiMessage = extractLatestMessage(result);
        messages.push(aiMessage);
        
        turns++;
      }
    } catch (err) {
      completed = false;
      stopReason = 'error';
      error = err as Error;
    }
    
    const totalTime = Date.now() - startTime;
    
    return {
      messages,
      turns,
      totalTime,
      completed,
      stopReason,
      error,
    };
  }

  private logVerboseTurn(role: 'User' | 'AI', content: unknown): void {
    if (!this.config.verbose) {
      return;
    }

    const logger = this.config.logger ?? conversationSimulatorLogger;
    logger.info(`${role}: ${String(content)}`);
  }
}

/**
 * Create a conversation simulator
 */
export function createConversationSimulator<TState = unknown>(
  agent: AgentTestAgent<ConversationSimulatorInput, TState>,
  config?: ConversationSimulatorConfig
): ConversationSimulator<TState> {
  return new ConversationSimulator(agent, config);
}

function extractLatestMessage(state: unknown): BaseMessage {
  const messages = extractMessages(state);
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) {
    throw new Error('Agent response did not include any messages');
  }

  return latestMessage;
}
