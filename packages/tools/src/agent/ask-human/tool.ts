/**
 * askHuman tool implementation
 * @module tools/agent/ask-human/tool
 */

import { toolBuilder, ToolCategory, createLogger, LogLevel } from '@agentforge/core';
import { AskHumanInputSchema, type AskHumanInput, type AskHumanOutput } from './types.js';
import { randomUUID } from 'crypto';

// Create logger for askHuman tool
// Log level can be controlled via LOG_LEVEL environment variable
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('askHuman', { level: logLevel });

/**
 * Create the askHuman tool
 * 
 * This tool enables human-in-the-loop workflows by pausing agent execution
 * and waiting for human input. It uses LangGraph's interrupt mechanism.
 * 
 * @example
 * ```typescript
 * import { createAskHumanTool } from '@agentforge/tools';
 *
 * const askHuman = createAskHumanTool();
 *
 * // In your agent
 * const tools = [askHuman, ...otherTools];
 *
 * // The agent can call this tool to ask for human input
 * // When called, it will pause execution and wait for a response
 * ```
 * 
 * @returns The askHuman tool
 */
export function createAskHumanTool() {
  return toolBuilder()
    .name('ask-human')
    .description(
      'Ask a human for input or approval. Use this when you need human guidance, ' +
      'approval for a critical action, or clarification on ambiguous requirements. ' +
      'The agent execution will pause until the human responds.'
    )
    .category(ToolCategory.UTILITY)
    .schema(AskHumanInputSchema)
    .implement(async (input): Promise<AskHumanOutput> => {
      // Type assertion after Zod validation
      const validatedInput = input as AskHumanInput;
      const requestId = randomUUID();
      const requestedAt = Date.now();

      // Import interrupt dynamically to avoid circular dependencies
      // and to allow this tool to work even if LangGraph is not installed
      let interrupt: ((value: any) => any) | undefined;
      
      try {
        const langgraph = await import('@langchain/langgraph');
        interrupt = (langgraph as any).interrupt;
      } catch (error) {
        throw new Error(
          'askHuman tool requires @langchain/langgraph to be installed. ' +
          'Install it with: npm install @langchain/langgraph'
        );
      }

      if (!interrupt) {
        throw new Error(
          'interrupt function not found in @langchain/langgraph. ' +
          'Make sure you are using a compatible version of LangGraph.'
        );
      }

      // Create the human request object
      const humanRequest = {
        id: requestId,
        question: validatedInput.question,
        context: validatedInput.context,
        priority: validatedInput.priority,
        createdAt: requestedAt,
        timeout: validatedInput.timeout,
        defaultResponse: validatedInput.defaultResponse,
        suggestions: validatedInput.suggestions,
        status: 'pending' as const,
      };

      // Use LangGraph's interrupt to pause execution
      // This will save the request to the checkpoint and pause the graph
      // The application can then resume with the human's response
      logger.debug('About to call interrupt()', { humanRequest });

      let response;
      try {
        response = interrupt(humanRequest);
        logger.debug('interrupt() returned successfully', { response, responseType: typeof response });
      } catch (error) {
        logger.debug('interrupt() threw error (expected for GraphInterrupt)', {
          errorType: error?.constructor?.name,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error; // Re-throw to let the node handle it
      }

      const respondedAt = Date.now();
      const duration = respondedAt - requestedAt;

      // Check if we got a timeout response
      const timedOut = validatedInput.timeout > 0 && duration >= validatedInput.timeout;

      // If timeout occurred and we have a default response, use it
      const finalResponse = timedOut && validatedInput.defaultResponse
        ? validatedInput.defaultResponse
        : (response || '');

      return {
        response: finalResponse,
        metadata: {
          requestId,
          requestedAt,
          respondedAt,
          duration,
          timedOut,
          priority: validatedInput.priority,
        },
      };
    })
    .build();
}

/**
 * Default instance of the askHuman tool
 * 
 * @example
 * ```typescript
 * import { askHumanTool } from '@agentforge/core';
 * 
 * const agent = createReActAgent({
 *   llm,
 *   tools: [askHumanTool, ...otherTools],
 * });
 * ```
 */
export const askHumanTool = createAskHumanTool();

