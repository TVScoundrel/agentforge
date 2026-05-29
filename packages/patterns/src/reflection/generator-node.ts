import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ReflectionStateType } from './state.js';
import type { GeneratorConfig } from './types.js';
import { DEFAULT_GENERATOR_SYSTEM_PROMPT, GENERATION_PROMPT_TEMPLATE } from './prompts.js';
import { handleNodeError } from '../shared/error-handling.js';
import { generatorLogger, serializeModelContent } from './node-shared.js';

export function createGeneratorNode(config: GeneratorConfig) {
  const {
    model,
    systemPrompt = DEFAULT_GENERATOR_SYSTEM_PROMPT,
  } = config;

  return async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    const startTime = Date.now();

    try {
      generatorLogger.debug('Generating response', {
        attempt: state.iteration + 1,
        hasFeedback: state.reflections.length > 0,
        hasExistingResponse: !!state.currentResponse,
      });

      const lastReflection = state.reflections[state.reflections.length - 1];
      const context = state.iteration > 0 && lastReflection
        ? `\nPrevious feedback to consider:\n${lastReflection.critique}`
        : '';

      const userPrompt = GENERATION_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{context}', context);

      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);
      const content = serializeModelContent(response.content);

      generatorLogger.info('Response generated', {
        attempt: state.iteration + 1,
        responseLength: content.length,
        isRevision: state.iteration > 0,
        duration: Date.now() - startTime,
      });

      return {
        currentResponse: content,
        status: 'reflecting' as const,
        iteration: 1,
      };
    } catch (error) {
      const errorMessage = handleNodeError(error, 'generator', false);

      generatorLogger.error('Response generation failed', {
        attempt: state.iteration + 1,
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
