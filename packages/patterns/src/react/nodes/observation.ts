import type { ReActStateType } from '../state.js';
import {
  debugIfVerbose,
  formatActionSummary,
  formatObservationContent,
  formatObservationSummary,
  getLatestThought,
  observationLogger,
} from './shared.js';

/**
 * Create an observation node that processes tool results and updates scratchpad
 *
 * @param verbose - Whether to log debug information
 * @param returnIntermediateSteps - Whether to populate the scratchpad with intermediate steps
 */
export function createObservationNode(
  verbose: boolean = false,
  returnIntermediateSteps: boolean = false
) {
  return async (state: ReActStateType) => {
    const observations = state.observations;
    const thoughts = state.thoughts;
    const actions = state.actions;
    const iteration = state.iteration || 0;

    debugIfVerbose(observationLogger, verbose, 'Processing observations', {
      observationCount: observations.length,
      iteration,
    });

    const recentObservations = observations.slice(-10);
    const latestActions = actions.slice(-10);
    const actionNamesById = new Map(latestActions.map((action) => [action.id, action.name]));

    const observationMessages = recentObservations.map((observation) => ({
      role: 'tool' as const,
      content: formatObservationContent(observation),
      name: actionNamesById.get(observation.toolCallId),
      tool_call_id: observation.toolCallId,
    }));

    const scratchpadEntries = returnIntermediateSteps
      ? [
          {
            step: state.iteration,
            thought: getLatestThought(thoughts),
            action: formatActionSummary(latestActions),
            observation: formatObservationSummary(recentObservations),
            timestamp: Date.now(),
          },
        ]
      : [];

    debugIfVerbose(observationLogger, verbose, 'Observation node complete', {
      iteration,
      scratchpadUpdated: returnIntermediateSteps,
      messageCount: observationMessages.length,
    });

    return {
      scratchpad: scratchpadEntries,
      messages: observationMessages,
    };
  };
}
