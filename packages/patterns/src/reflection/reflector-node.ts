import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Reflection } from './schemas.js';
import type { ReflectionStateType } from './state.js';
import type { ReflectorConfig } from './types.js';
import {
  DEFAULT_REFLECTOR_SYSTEM_PROMPT,
  QUALITY_CRITERIA_TEMPLATE,
  REFLECTION_ENTRY_TEMPLATE,
  REFLECTION_HISTORY_TEMPLATE,
  REFLECTION_PROMPT_TEMPLATE,
} from './prompts.js';
import { handleNodeError } from '../shared/error-handling.js';
import {
  buildRevisionHistorySection,
  reflectorLogger,
  serializeModelContent,
} from './node-shared.js';

function buildCriteriaSection(config: ReflectorConfig, state: ReflectionStateType): string {
  const criteria = config.qualityCriteria || state.qualityCriteria;
  if (!criteria) {
    return '';
  }

  const criteriaList = criteria.criteria?.join('\n- ') || '';
  return QUALITY_CRITERIA_TEMPLATE
    .replace('{criteria}', criteriaList ? `- ${criteriaList}` : 'General quality standards')
    .replace('{minScore}', criteria.minScore?.toString() || '7')
    .replace('{requireAll}', criteria.requireAll ? 'All criteria must be met.' : 'Meet as many criteria as possible.');
}

function buildHistorySection(state: ReflectionStateType): string {
  if (state.reflections.length === 0 && state.revisions.length === 0) {
    return '';
  }

  const reflectionsText = state.reflections
    .map((reflection, idx) => REFLECTION_ENTRY_TEMPLATE
      .replace('{iteration}', (idx + 1).toString())
      .replace('{critique}', reflection.critique)
      .replace('{score}', reflection.score?.toString() || 'N/A')
      .replace('{issues}', reflection.issues.join(', '))
      .replace('{suggestions}', reflection.suggestions.join(', '))
    )
    .join('\n\n');

  const revisionsText = buildRevisionHistorySection(state.revisions, 'Previous Revisions')
    .replace('\nPrevious Revisions:\n', '');

  return REFLECTION_HISTORY_TEMPLATE
    .replace('{reflections}', reflectionsText || 'None')
    .replace('{revisions}', revisionsText || 'None');
}

function parseReflection(content: string): Reflection {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Reflection;
    }
  } catch {
    // Fall through to the text fallback below.
  }

  return {
    critique: content,
    issues: [],
    suggestions: [],
    score: 5,
    meetsStandards: false,
  };
}

export function createReflectorNode(config: ReflectorConfig) {
  const {
    model,
    systemPrompt = DEFAULT_REFLECTOR_SYSTEM_PROMPT,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    const startTime = Date.now();

    try {
      reflectorLogger.debug('Reflecting on response', {
        attempt: state.iteration,
        responseLength: state.currentResponse?.length || 0,
        hasCriteria: !!(config.qualityCriteria || state.qualityCriteria),
      });

      if (!state.currentResponse) {
        throw new Error('No current response to reflect on');
      }

      const userPrompt = REFLECTION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{currentResponse}', state.currentResponse)
        .replace('{criteria}', buildCriteriaSection(config, state))
        .replace('{history}', buildHistorySection(state));

      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);
      const reflection = parseReflection(serializeModelContent(response.content));

      reflectorLogger.info('Reflection complete', {
        attempt: state.iteration,
        ...(reflection.score !== undefined ? { score: reflection.score } : {}),
        meetsStandards: reflection.meetsStandards,
        issueCount: reflection.issues.length,
        suggestionCount: reflection.suggestions.length,
        duration: Date.now() - startTime,
      });

      return {
        reflections: [reflection],
        status: reflection.meetsStandards ? 'completed' as const : 'revising' as const,
      };
    } catch (error) {
      const errorMessage = handleNodeError(error, 'reflector', false);

      reflectorLogger.error('Reflection failed', {
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
