import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { PlanExecuteStateType } from './state.js';
import type { ReplannerConfig } from './types.js';
import type { ReplanDecision } from './schemas.js';
import {
  DEFAULT_REPLANNER_SYSTEM_PROMPT,
  REPLANNING_PROMPT_TEMPLATE,
  COMPLETED_STEP_TEMPLATE,
  REMAINING_STEP_TEMPLATE,
} from './prompts.js';
import { replannerLogger } from './node-loggers.js';
import { normalizeModelContent, serializePlanExecuteResult } from './serialization.js';

export function createReplannerNode(config: ReplannerConfig) {
  const {
    model,
    replanThreshold,
    systemPrompt = DEFAULT_REPLANNER_SYSTEM_PROMPT,
  } = config;

  if (typeof replanThreshold !== 'undefined') {
    replannerLogger.warn('ReplannerConfig.replanThreshold is currently unsupported and will be ignored', {
      replanThreshold,
    });
  }

  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const startTime = Date.now();

    try {
      const { plan, pastSteps = [], currentStepIndex = 0 } = state;

      if (!plan) {
        return { status: 'failed', error: 'No plan available for replanning' };
      }

      replannerLogger.debug('Evaluating replanning', {
        completedSteps: pastSteps.length,
        remainingSteps: plan.steps.length - currentStepIndex,
        successfulSteps: pastSteps.filter((ps) => ps.success).length,
        failedSteps: pastSteps.filter((ps) => !ps.success).length,
      });

      const completedStepsText = pastSteps
        .map((ps, idx) =>
          COMPLETED_STEP_TEMPLATE
            .replace('{stepNumber}', String(idx + 1))
            .replace('{description}', ps.step.description)
            .replace('{result}', serializePlanExecuteResult(ps.result))
            .replace('{status}', ps.success ? 'Success' : `Failed: ${ps.error}`)
        )
        .join('\n\n');

      const remainingSteps = plan.steps.slice(currentStepIndex);
      const remainingStepsText = remainingSteps
        .map((step, idx) =>
          REMAINING_STEP_TEMPLATE
            .replace('{stepNumber}', String(currentStepIndex + idx + 1))
            .replace('{description}', step.description)
            .replace('{dependencies}', step.dependencies ? `Dependencies: ${step.dependencies.join(', ')}` : '')
        )
        .join('\n\n');

      const userPrompt = REPLANNING_PROMPT_TEMPLATE
        .replace('{goal}', plan.goal)
        .replace('{completedSteps}', completedStepsText || 'None')
        .replace('{remainingSteps}', remainingStepsText || 'None');

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = normalizeModelContent(response.content);

      let decision: ReplanDecision;
      try {
        decision = JSON.parse(content) as ReplanDecision;
      } catch (parseError) {
        throw new Error(`Failed to parse replan decision from LLM response: ${parseError}`);
      }

      if (decision.shouldReplan) {
        replannerLogger.info('Replanning triggered', {
          reason: decision.reason,
          ...(decision.newGoal ? { newGoal: decision.newGoal.substring(0, 100) } : {}),
          duration: Date.now() - startTime,
        });

        return {
          status: 'planning',
          input: decision.newGoal || plan.goal,
          iteration: 1,
        };
      }

      replannerLogger.info('Continuing with current plan', {
        reason: decision.reason,
        duration: Date.now() - startTime,
      });

      return {
        status: 'executing',
      };
    } catch (error) {
      replannerLogger.error('Replanning evaluation failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in replanner',
      };
    }
  };
}
