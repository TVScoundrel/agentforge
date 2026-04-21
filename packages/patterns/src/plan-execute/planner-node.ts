import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { PlanExecuteStateType } from './state.js';
import type { PlannerConfig } from './types.js';
import type { Plan } from './schemas.js';
import {
  DEFAULT_PLANNER_SYSTEM_PROMPT,
  PLANNING_PROMPT_TEMPLATE,
} from './prompts.js';
import { plannerLogger } from './node-loggers.js';
import { normalizeModelContent } from './serialization.js';

export function createPlannerNode(config: PlannerConfig) {
  const {
    model,
    systemPrompt = DEFAULT_PLANNER_SYSTEM_PROMPT,
    maxSteps = 7,
    includeToolDescriptions = false,
  } = config;

  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const startTime = Date.now();

    try {
      plannerLogger.debug('Planning started', {
        input: state.input?.substring(0, 100),
        maxSteps,
        includeToolDescriptions,
      });

      let toolDescriptions = '';
      if (includeToolDescriptions) {
        // TODO: Format tool descriptions when executor tools are available
        toolDescriptions = '';
      }

      const userPrompt = PLANNING_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{toolDescriptions}', toolDescriptions);

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = normalizeModelContent(response.content);

      let plan: Plan;
      try {
        const parsed = JSON.parse(content);
        plan = {
          steps: parsed.steps.slice(0, maxSteps),
          goal: parsed.goal || state.input || '',
          createdAt: new Date().toISOString(),
          confidence: parsed.confidence,
        };
      } catch (parseError) {
        throw new Error(`Failed to parse plan from LLM response: ${parseError}`);
      }

      plannerLogger.info('Plan created', {
        stepCount: plan.steps.length,
        goal: plan.goal.substring(0, 100),
        ...(plan.confidence !== undefined ? { confidence: plan.confidence } : {}),
        duration: Date.now() - startTime,
      });

      return {
        plan,
        status: 'executing',
        currentStepIndex: 0,
        iteration: 1,
      };
    } catch (error) {
      plannerLogger.error('Planning failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in planner',
      };
    }
  };
}
