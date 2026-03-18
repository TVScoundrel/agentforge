import { type Tool } from '@agentforge/core';
import type { ReActStateType, ToolResult } from '../state.js';
import {
  buildDeduplicationMetrics,
  generateToolCallCacheKey,
} from '../../shared/deduplication.js';
import { handleNodeError } from '../../shared/error-handling.js';
import { actionLogger, debugIfVerbose } from './shared.js';

/**
 * Create an action node that executes tool calls
 *
 * @param tools - Available tools
 * @param verbose - Whether to log debug information
 * @param enableDeduplication - Whether to enable tool call deduplication
 */
export function createActionNode(
  tools: Tool[],
  verbose: boolean = false,
  enableDeduplication: boolean = true
) {
  const toolMap = new Map(tools.map((tool) => [tool.metadata.name, tool]));

  return async (state: ReActStateType) => {
    const actions = state.actions;
    const allObservations = state.observations;
    const iteration = state.iteration || 0;
    const startTime = Date.now();

    debugIfVerbose(actionLogger, verbose, 'Action node started', {
      actionCount: actions.length,
      iteration,
      cacheEnabled: enableDeduplication,
    });

    const recentActions = actions.slice(-10);
    const observations: ToolResult[] = [];
    const executionCache = new Map<string, ToolResult>();
    const actionsById = new Map(actions.map((action) => [action.id, action]));
    const observedToolCallIds = new Set(
      allObservations.map((observation) => observation.toolCallId)
    );
    let cacheSize = 0;

    if (enableDeduplication) {
      for (const observation of allObservations) {
        const correspondingAction = actionsById.get(observation.toolCallId);
        if (correspondingAction) {
          const cacheKey = generateToolCallCacheKey(
            correspondingAction.name,
            correspondingAction.arguments
          );
          executionCache.set(cacheKey, observation);
          cacheSize++;
        }
      }

      if (cacheSize > 0) {
        debugIfVerbose(actionLogger, verbose, 'Deduplication cache built', {
          cacheSize,
          totalObservations: allObservations.length,
        });
      }
    }

    let duplicatesSkipped = 0;
    let toolsExecuted = 0;

    for (const action of recentActions) {
      if (observedToolCallIds.has(action.id)) {
        debugIfVerbose(actionLogger, verbose, 'Skipping already-processed action', {
          toolName: action.name,
          toolCallId: action.id,
          iteration,
        });
        continue;
      }

      if (enableDeduplication) {
        const cacheKey = generateToolCallCacheKey(action.name, action.arguments);
        const cachedResult = executionCache.get(cacheKey);

        if (cachedResult) {
          duplicatesSkipped++;

          actionLogger.info('Duplicate tool call prevented', {
            toolName: action.name,
            arguments: action.arguments,
            iteration,
            cacheHit: true,
          });

          observations.push({
            toolCallId: action.id,
            result: cachedResult.result,
            error: cachedResult.error,
            timestamp: Date.now(),
            isDuplicate: true,
          });
          continue;
        }
      }

      const tool = toolMap.get(action.name);
      if (!tool) {
        observations.push({
          toolCallId: action.id,
          result: null,
          error: `Tool '${action.name}' not found`,
          timestamp: Date.now(),
        });
        continue;
      }

      try {
        const toolStartTime = Date.now();
        const result = await tool.invoke(action.arguments);
        const executionTime = Date.now() - toolStartTime;

        toolsExecuted++;

        debugIfVerbose(actionLogger, verbose, 'Tool executed successfully', {
          toolName: action.name,
          executionTime,
          iteration,
        });

        const observation: ToolResult = {
          toolCallId: action.id,
          result,
          timestamp: Date.now(),
        };

        observations.push(observation);

        if (enableDeduplication) {
          const cacheKey = generateToolCallCacheKey(action.name, action.arguments);
          executionCache.set(cacheKey, observation);
        }
      } catch (error) {
        const errorMessage = handleNodeError(error, `action:${action.name}`, verbose);

        actionLogger.error('Tool execution failed', {
          toolName: action.name,
          error: errorMessage,
          iteration,
        });

        observations.push({
          toolCallId: action.id,
          result: null,
          error: errorMessage,
          timestamp: Date.now(),
        });
      }
    }

    if (duplicatesSkipped > 0 || toolsExecuted > 0) {
      const metrics = buildDeduplicationMetrics(
        toolsExecuted,
        duplicatesSkipped,
        observations.length
      );
      actionLogger.info('Action node complete', {
        iteration,
        ...metrics,
        duration: Date.now() - startTime,
      });
    }

    return {
      observations,
    };
  };
}
