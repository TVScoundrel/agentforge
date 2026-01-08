/**
 * Node Implementations for Reflection Pattern
 *
 * This module implements the core nodes for the Reflection agent pattern.
 *
 * @module patterns/reflection/nodes
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ReflectionStateType } from './state.js';
import type { GeneratorConfig, ReflectorConfig, ReviserConfig } from './types.js';
import type { Reflection } from './schemas.js';
import {
  DEFAULT_GENERATOR_SYSTEM_PROMPT,
  DEFAULT_REFLECTOR_SYSTEM_PROMPT,
  DEFAULT_REVISER_SYSTEM_PROMPT,
  GENERATION_PROMPT_TEMPLATE,
  REFLECTION_PROMPT_TEMPLATE,
  REVISION_PROMPT_TEMPLATE,
  QUALITY_CRITERIA_TEMPLATE,
  REFLECTION_HISTORY_TEMPLATE,
  REFLECTION_ENTRY_TEMPLATE,
  REVISION_ENTRY_TEMPLATE,
} from './prompts.js';

/**
 * Create a generator node that creates initial responses
 */
export function createGeneratorNode(config: GeneratorConfig) {
  const {
    model,
    systemPrompt = DEFAULT_GENERATOR_SYSTEM_PROMPT,
    verbose = false,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    try {
      if (verbose) {
        console.log('[Generator] Generating initial response...');
      }

      // Build context from previous iterations if any
      let context = '';
      if (state.iteration > 0 && state.reflections.length > 0) {
        const lastReflection = state.reflections[state.reflections.length - 1];
        context = `\nPrevious feedback to consider:\n${lastReflection.critique}`;
      }

      const userPrompt = GENERATION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{context}', context);

      // Call LLM to generate response
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);

      if (verbose) {
        console.log('[Generator] Generated response:', content.substring(0, 100) + '...');
      }

      return {
        currentResponse: content,
        status: 'reflecting' as const,
        iteration: 1,
      };
    } catch (error) {
      console.error('[Generator] Error:', error);
      return {
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error in generator',
      };
    }
  };
}

/**
 * Create a reflector node that critiques responses
 */
export function createReflectorNode(config: ReflectorConfig) {
  const {
    model,
    systemPrompt = DEFAULT_REFLECTOR_SYSTEM_PROMPT,
    qualityCriteria,
    verbose = false,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    try {
      if (verbose) {
        console.log('[Reflector] Reflecting on response...');
      }

      if (!state.currentResponse) {
        throw new Error('No current response to reflect on');
      }

      // Build quality criteria section
      let criteriaSection = '';
      const criteria = qualityCriteria || state.qualityCriteria;
      if (criteria) {
        const criteriaList = criteria.criteria?.join('\n- ') || '';
        criteriaSection = QUALITY_CRITERIA_TEMPLATE
          .replace('{criteria}', criteriaList ? `- ${criteriaList}` : 'General quality standards')
          .replace('{minScore}', criteria.minScore?.toString() || '7')
          .replace('{requireAll}', criteria.requireAll ? 'All criteria must be met.' : 'Meet as many criteria as possible.');
      }

      // Build history section
      let historySection = '';
      if (state.reflections.length > 0 || state.revisions.length > 0) {
        const reflectionsText = state.reflections
          .map((r, idx) => REFLECTION_ENTRY_TEMPLATE
            .replace('{iteration}', (idx + 1).toString())
            .replace('{critique}', r.critique)
            .replace('{score}', r.score?.toString() || 'N/A')
            .replace('{issues}', r.issues.join(', '))
            .replace('{suggestions}', r.suggestions.join(', '))
          )
          .join('\n\n');

        const revisionsText = state.revisions
          .map((r) => REVISION_ENTRY_TEMPLATE
            .replace('{iteration}', r.iteration.toString())
            .replace('{content}', r.content.substring(0, 200) + '...')
          )
          .join('\n\n');

        historySection = REFLECTION_HISTORY_TEMPLATE
          .replace('{reflections}', reflectionsText || 'None')
          .replace('{revisions}', revisionsText || 'None');
      }

      const userPrompt = REFLECTION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{currentResponse}', state.currentResponse)
        .replace('{criteria}', criteriaSection)
        .replace('{history}', historySection);

      // Call LLM to generate reflection
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      // Parse the reflection from JSON
      let reflection: Reflection;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reflection = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: create a basic reflection
          reflection = {
            critique: content,
            issues: [],
            suggestions: [],
            score: 5,
            meetsStandards: false,
          };
        }
      } catch (parseError) {
        // Fallback: create a basic reflection
        reflection = {
          critique: content,
          issues: [],
          suggestions: [],
          score: 5,
          meetsStandards: false,
        };
      }

      if (verbose) {
        console.log('[Reflector] Reflection score:', reflection.score);
        console.log('[Reflector] Meets standards:', reflection.meetsStandards);
      }

      return {
        reflections: [reflection],
        status: reflection.meetsStandards ? 'completed' as const : 'revising' as const,
      };
    } catch (error) {
      console.error('[Reflector] Error:', error);
      return {
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error in reflector',
      };
    }
  };
}

/**
 * Create a reviser node that improves responses based on critiques
 */
export function createReviserNode(config: ReviserConfig) {
  const {
    model,
    systemPrompt = DEFAULT_REVISER_SYSTEM_PROMPT,
    verbose = false,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    try {
      if (verbose) {
        console.log('[Reviser] Revising response...');
      }

      if (!state.currentResponse) {
        throw new Error('No current response to revise');
      }

      if (state.reflections.length === 0) {
        throw new Error('No reflections to base revision on');
      }

      const lastReflection = state.reflections[state.reflections.length - 1];

      // Build history section
      let historySection = '';
      if (state.revisions.length > 0) {
        const revisionsText = state.revisions
          .map((r) => REVISION_ENTRY_TEMPLATE
            .replace('{iteration}', r.iteration.toString())
            .replace('{content}', r.content.substring(0, 200) + '...')
          )
          .join('\n\n');

        historySection = `\nPrevious Revisions:\n${revisionsText}`;
      }

      const userPrompt = REVISION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{currentResponse}', state.currentResponse)
        .replace('{critique}', lastReflection.critique)
        .replace('{issues}', lastReflection.issues.join('\n- '))
        .replace('{suggestions}', lastReflection.suggestions.join('\n- '))
        .replace('{history}', historySection);

      // Call LLM to generate revision
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      if (verbose) {
        console.log('[Reviser] Created revision:', content.substring(0, 100) + '...');
      }

      // Create revision entry
      const revision = {
        content,
        iteration: state.iteration,
        basedOn: lastReflection,
      };

      return {
        currentResponse: content,
        revisions: [revision],
        status: 'reflecting' as const,
        iteration: 1,
      };
    } catch (error) {
      console.error('[Reviser] Error:', error);
      return {
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error in reviser',
      };
    }
  };
}

/**
 * Create a finisher node that marks the reflection as complete
 */
export function createFinisherNode() {
  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    return {
      status: 'completed' as const,
      response: state.currentResponse,
    };
  };
}

