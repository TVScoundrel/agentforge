/**
 * Node Implementations for Plan-and-Execute Pattern
 *
 * This module implements the core nodes for the Plan-and-Execute agent pattern.
 *
 * @module patterns/plan-execute/nodes
 */

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { PlanExecuteStateType } from './state.js';
import type { PlannerConfig, ExecutorConfig, ReplannerConfig } from './types.js';
import type { Plan, CompletedStep, PlanStep } from './schemas.js';
import {
  DEFAULT_PLANNER_SYSTEM_PROMPT,
  DEFAULT_REPLANNER_SYSTEM_PROMPT,
  PLANNING_PROMPT_TEMPLATE,
  REPLANNING_PROMPT_TEMPLATE,
  TOOL_DESCRIPTIONS_TEMPLATE,
  COMPLETED_STEP_TEMPLATE,
  REMAINING_STEP_TEMPLATE,
} from './prompts.js';
import {
  generateToolCallCacheKey,
  createPatternLogger,
} from '../shared/deduplication.js';

// Create loggers for plan-execute pattern nodes
const plannerLogger = createPatternLogger('agentforge:patterns:plan-execute:planner');
const executorLogger = createPatternLogger('agentforge:patterns:plan-execute:executor');
const replannerLogger = createPatternLogger('agentforge:patterns:plan-execute:replanner');

/**
 * Create a planner node that generates a multi-step plan
 */
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
        includeToolDescriptions
      });

      // Build the planning prompt
      let toolDescriptions = '';
      if (includeToolDescriptions) {
        // TODO: Format tool descriptions when executor tools are available
        toolDescriptions = '';
      }

      const userPrompt = PLANNING_PROMPT_TEMPLATE
        .replace('{input}', state.input || '')
        .replace('{toolDescriptions}', toolDescriptions);

      // Call LLM to generate plan
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = response.content.toString();

      // Parse the plan from JSON
      let plan: Plan;
      try {
        const parsed = JSON.parse(content);
        plan = {
          steps: parsed.steps.slice(0, maxSteps), // Limit to maxSteps
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
        confidence: plan.confidence,
        duration: Date.now() - startTime
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
        duration: Date.now() - startTime
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in planner',
      };
    }
  };
}

/**
 * Create an executor node that executes plan steps
 */
export function createExecutorNode(config: ExecutorConfig) {
  const {
    tools,
    model,
    parallel = false,
    stepTimeout = 30000,
    enableDeduplication = true,
  } = config;

  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const { plan, currentStepIndex = 0, pastSteps = [], iteration = 0 } = state;

    try {
      executorLogger.debug('Executor node executing', {
        currentStepIndex,
        totalSteps: plan?.steps?.length || 0,
        iteration,
        deduplicationEnabled: enableDeduplication
      });

      if (!plan || !plan.steps || plan.steps.length === 0) {
        // No plan or empty plan
        return {
          status: 'completed',
        };
      }

      if (currentStepIndex >= plan.steps.length) {
        // All steps completed
        return {
          status: 'completed',
        };
      }

      const currentStep = plan.steps[currentStepIndex];

      // Check dependencies
      if (currentStep.dependencies && currentStep.dependencies.length > 0) {
        const completedStepIds = new Set(pastSteps.map(ps => ps.step.id));
        const unmetDependencies = currentStep.dependencies.filter(dep => !completedStepIds.has(dep));

        if (unmetDependencies.length > 0) {
          throw new Error(`Unmet dependencies for step ${currentStep.id}: ${unmetDependencies.join(', ')}`);
        }
      }

      // Build deduplication cache from past steps
      const executionCache = new Map<string, CompletedStep>();
      let cacheSize = 0;

      if (enableDeduplication && currentStep.tool) {
        for (const pastStep of pastSteps) {
          // Cache both successful AND failed steps to prevent re-execution of errors
          if (pastStep.step.tool) {
            const cacheKey = generateToolCallCacheKey(pastStep.step.tool, pastStep.step.args || {});
            executionCache.set(cacheKey, pastStep);
            cacheSize++;
          }
        }

        if (cacheSize > 0) {
          executorLogger.debug('Deduplication cache built', {
            cacheSize,
            pastStepsCount: pastSteps.length
          });
        }
      }

      // Execute the step
      let result: any;
      let success = true;
      let error: string | undefined;
      let isDuplicate = false;

      try {
        if (currentStep.tool) {
          // Check for duplicate execution
          if (enableDeduplication) {
            const cacheKey = generateToolCallCacheKey(currentStep.tool, currentStep.args || {});
            const cachedStep = executionCache.get(cacheKey);

            if (cachedStep) {
              isDuplicate = true;
              result = cachedStep.result;
              success = cachedStep.success;
              error = cachedStep.error;

              executorLogger.info('Duplicate step execution prevented', {
                stepId: currentStep.id,
                toolName: currentStep.tool,
                arguments: currentStep.args,
                iteration,
                cacheHit: true
              });
            }
          }

          if (!isDuplicate) {
            // Find and execute the tool
            const tool = tools.find(t => t.metadata.name === currentStep.tool);
            if (!tool) {
              throw new Error(`Tool not found: ${currentStep.tool}`);
            }

            // Execute with timeout
            const startTime = Date.now();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Step execution timeout')), stepTimeout)
            );

            result = await Promise.race([
              tool.execute(currentStep.args || {}),
              timeoutPromise,
            ]);

            const executionTime = Date.now() - startTime;

            executorLogger.debug('Step executed successfully', {
              stepId: currentStep.id,
              toolName: currentStep.tool,
              executionTime,
              iteration
            });
          }
        } else {
          // No tool specified, just mark as completed
          result = { message: 'Step completed without tool execution' };
        }
      } catch (execError) {
        // Check if this is a GraphInterrupt - if so, let it bubble up
        // GraphInterrupt is used by LangGraph's interrupt() function for human-in-the-loop
        if (execError && typeof execError === 'object' && 'constructor' in execError &&
            execError.constructor.name === 'GraphInterrupt') {
          // Re-throw GraphInterrupt so the graph can handle it
          throw execError;
        }

        // Handle other execution errors
        success = false;
        error = execError instanceof Error ? execError.message : 'Unknown execution error';
        result = null;

        executorLogger.warn('Step execution failed', {
          stepId: currentStep.id,
          toolName: currentStep.tool,
          error,
          iteration
        });
      }

      // Create completed step
      const completedStep: CompletedStep = {
        step: currentStep,
        result,
        success,
        error,
        timestamp: new Date().toISOString(),
      };

      // Log summary
      executorLogger.info('Executor node complete', {
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        totalSteps: plan.steps.length,
        success,
        isDuplicate,
        iteration
      });

      return {
        pastSteps: [completedStep],
        currentStepIndex: currentStepIndex + 1,
      };
    } catch (error) {
      executorLogger.error('Executor node failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        iteration
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in executor',
      };
    }
  };
}

/**
 * Create a replanner node that decides whether to replan
 */
export function createReplannerNode(config: ReplannerConfig) {
  const {
    model,
    replanThreshold = 0.7,
    systemPrompt = DEFAULT_REPLANNER_SYSTEM_PROMPT,
  } = config;

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
        successfulSteps: pastSteps.filter(ps => ps.success).length,
        failedSteps: pastSteps.filter(ps => !ps.success).length
      });

      // Format completed steps
      const completedStepsText = pastSteps
        .map((ps, idx) =>
          COMPLETED_STEP_TEMPLATE
            .replace('{stepNumber}', String(idx + 1))
            .replace('{description}', ps.step.description)
            .replace('{result}', JSON.stringify(ps.result))
            .replace('{status}', ps.success ? 'Success' : `Failed: ${ps.error}`)
        )
        .join('\n\n');

      // Format remaining steps
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

      // Call LLM to decide on replanning
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      const response = await model.invoke(messages);
      const content = response.content.toString();

      // Parse the decision
      let decision: { shouldReplan: boolean; reason: string; newGoal?: string };
      try {
        decision = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Failed to parse replan decision from LLM response: ${parseError}`);
      }

      if (decision.shouldReplan) {
        replannerLogger.info('Replanning triggered', {
          reason: decision.reason,
          newGoal: decision.newGoal?.substring(0, 100),
          duration: Date.now() - startTime
        });

        // Trigger replanning
        return {
          status: 'planning',
          input: decision.newGoal || plan.goal,
          iteration: 1,
        };
      } else {
        replannerLogger.info('Continuing with current plan', {
          reason: decision.reason,
          duration: Date.now() - startTime
        });

        // Continue with current plan
        return {
          status: 'executing',
        };
      }
    } catch (error) {
      replannerLogger.error('Replanning evaluation failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in replanner',
      };
    }
  };
}

/**
 * Create a finisher node that sets the final status and response
 */
export function createFinisherNode() {
  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    // Aggregate results from all completed steps
    const results = state.pastSteps?.map(ps => ({
      step: ps.step.description,
      result: ps.result,
      success: ps.success,
    })) || [];

    const response = JSON.stringify({
      goal: state.plan?.goal || state.input,
      results,
      totalSteps: state.pastSteps?.length || 0,
      successfulSteps: state.pastSteps?.filter(ps => ps.success).length || 0,
    }, null, 2);

    return {
      status: 'completed',
      response,
    };
  };
}

