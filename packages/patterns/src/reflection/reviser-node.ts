import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ReflectionStateType } from './state.js';
import type { ReviserConfig } from './types.js';
import { DEFAULT_REVISER_SYSTEM_PROMPT, REVISION_PROMPT_TEMPLATE } from './prompts.js';
import { handleNodeError } from '../shared/error-handling.js';
import {
  buildRevisionHistorySection,
  reviserLogger,
  serializeModelContent,
} from './node-shared.js';

export function createReviserNode(config: ReviserConfig) {
  const {
    model,
    systemPrompt = DEFAULT_REVISER_SYSTEM_PROMPT,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    const startTime = Date.now();

    try {
      if (!state.currentResponse) {
        throw new Error('No current response to revise');
      }

      const lastReflection = state.reflections[state.reflections.length - 1];
      if (!lastReflection) {
        throw new Error('No reflections to base revision on');
      }

      reviserLogger.debug('Revising response', {
        attempt: state.iteration,
        ...(lastReflection.score !== undefined ? { previousScore: lastReflection.score } : {}),
        issueCount: lastReflection.issues.length,
        suggestionCount: lastReflection.suggestions.length,
      });

      const historySection = buildRevisionHistorySection(state.revisions, 'Previous Revisions');
      const userPrompt = REVISION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{currentResponse}', state.currentResponse)
        .replace('{critique}', lastReflection.critique)
        .replace('{issues}', lastReflection.issues.join('\n- '))
        .replace('{suggestions}', lastReflection.suggestions.join('\n- '))
        .replace('{history}', historySection);

      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);
      const content = serializeModelContent(response.content);

      reviserLogger.info('Revision complete', {
        attempt: state.iteration,
        revisionLength: content.length,
        ...(lastReflection.score !== undefined ? { basedOnScore: lastReflection.score } : {}),
        duration: Date.now() - startTime,
      });

      return {
        currentResponse: content,
        revisions: [{
          content,
          iteration: state.iteration,
          basedOn: lastReflection,
        }],
        status: 'reflecting' as const,
        iteration: 1,
      };
    } catch (error) {
      const errorMessage = handleNodeError(error, 'reviser', false);

      reviserLogger.error('Revision failed', {
        attempt: state.iteration,
        error: errorMessage,
        duration: Date.now() - startTime,
      });
      return {
        status: 'failed' as const,
        error: errorMessage,
      };
    }
  };
}
