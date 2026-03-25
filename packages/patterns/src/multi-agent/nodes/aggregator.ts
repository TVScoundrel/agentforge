import type { AggregatorConfig } from '../types.js';
import type { MultiAgentStateType } from '../state.js';
import { createWorkerMessages, logger, serializeModelContent } from './shared.js';

export const DEFAULT_AGGREGATOR_SYSTEM_PROMPT = `You are an aggregator agent responsible for combining results from multiple worker agents.

Your job is to:
1. Review all completed task results
2. Synthesize the information into a coherent response
3. Ensure all aspects of the original query are addressed
4. Provide a clear, comprehensive final answer

Be concise but thorough in your aggregation.`;

function createAggregationPrompt(state: MultiAgentStateType): string {
  const taskResults = state.completedTasks
    .map((task, idx) => {
      const status = task.success ? '✓' : '✗';
      const result = task.success ? task.result : `Error: ${task.error}`;
      return `${idx + 1}. [${status}] Worker ${task.workerId}:\n${result}`;
    })
    .join('\n\n');

  return `Original query: ${state.input}

Worker results:
${taskResults}

Please synthesize these results into a comprehensive response that addresses the original query.`;
}

export function createAggregatorNode(config: AggregatorConfig = {}) {
  const {
    model,
    systemPrompt = DEFAULT_AGGREGATOR_SYSTEM_PROMPT,
    aggregateFn,
  } = config;

  return async (
    state: MultiAgentStateType
  ): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.info('Aggregator node executing', {
        completedTasks: state.completedTasks.length,
        successfulTasks: state.completedTasks.filter((task) => task.success).length,
        failedTasks: state.completedTasks.filter((task) => !task.success).length,
      });

      logger.debug('Combining results from workers');

      if (aggregateFn) {
        logger.debug('Using custom aggregation function');
        const response = await aggregateFn(state);
        logger.info('Custom aggregation complete', {
          responseLength: response.length,
        });
        return {
          response,
          status: 'completed',
        };
      }

      if (state.completedTasks.length === 0) {
        logger.warn('No completed tasks to aggregate');
        return {
          response: 'No tasks were completed.',
          status: 'completed',
        };
      }

      if (!model) {
        logger.debug('No model provided, concatenating results');
        const combinedResults = state.completedTasks
          .filter((task) => task.success)
          .map((task) => task.result)
          .join('\n\n');

        logger.info('Simple concatenation complete', {
          resultLength: combinedResults.length,
        });

        return {
          response: combinedResults || 'No successful results to aggregate.',
          status: 'completed',
        };
      }

      logger.debug('Using LLM for intelligent aggregation', {
        taskCount: state.completedTasks.length,
      });

      const messages = createWorkerMessages(systemPrompt, createAggregationPrompt(state));

      logger.debug('Invoking aggregation LLM');
      const response = await model.invoke(messages);
      const aggregatedResponse = serializeModelContent(response.content, 'No response');

      logger.info('Aggregation complete', {
        responseLength: aggregatedResponse.length,
      });
      logger.debug('Aggregation response preview', {
        responseLength: aggregatedResponse.length,
        responsePreview: aggregatedResponse.substring(0, 100),
      });

      logger.debug('Aggregation complete');

      return {
        response: aggregatedResponse,
        status: 'completed',
      };
    } catch (error) {
      logger.error('Aggregator node error', {
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        completedTasks: state.completedTasks.length,
      });
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in aggregator',
      };
    }
  };
}
