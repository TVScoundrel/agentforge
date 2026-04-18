import type { PlanExecuteStateType } from './state.js';
import type { ExecutorConfig, PlanExecuteTool } from './types.js';
import type { CompletedStep, PlanStepArguments, PlanStepResult } from './schemas.js';
import { generateToolCallCacheKey } from '../shared/deduplication.js';
import { handleNodeError } from '../shared/error-handling.js';
import { executorLogger } from './node-loggers.js';

function invokePlanExecuteTool(tool: PlanExecuteTool, args: PlanStepArguments): Promise<PlanStepResult> {
  return tool.invoke.call(tool, args);
}

export function createExecutorNode(config: ExecutorConfig) {
  const {
    tools,
    model,
    parallel,
    stepTimeout = 30000,
    enableDeduplication = true,
  } = config;

  if (typeof model !== 'undefined') {
    executorLogger.warn('ExecutorConfig.model is currently unsupported and will be ignored');
  }

  if (typeof parallel !== 'undefined') {
    executorLogger.warn('ExecutorConfig.parallel is currently unsupported and will be ignored', {
      parallel,
    });
  }

  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const { plan, currentStepIndex = 0, pastSteps = [], iteration = 0 } = state;

    try {
      executorLogger.debug('Executor node executing', {
        currentStepIndex,
        totalSteps: plan?.steps?.length || 0,
        iteration,
        deduplicationEnabled: enableDeduplication,
      });

      if (!plan || !plan.steps || plan.steps.length === 0) {
        return { status: 'completed' };
      }

      if (currentStepIndex >= plan.steps.length) {
        return { status: 'completed' };
      }

      const currentStep = plan.steps[currentStepIndex];

      if (currentStep.dependencies && currentStep.dependencies.length > 0) {
        const completedStepIds = new Set(pastSteps.map((ps) => ps.step.id));
        const unmetDependencies = currentStep.dependencies.filter((dep) => !completedStepIds.has(dep));

        if (unmetDependencies.length > 0) {
          throw new Error(`Unmet dependencies for step ${currentStep.id}: ${unmetDependencies.join(', ')}`);
        }
      }

      const executionCache = new Map<string, CompletedStep>();
      let cacheSize = 0;

      if (enableDeduplication && currentStep.tool) {
        for (const pastStep of pastSteps) {
          if (pastStep.step.tool) {
            const cacheKey = generateToolCallCacheKey(pastStep.step.tool, pastStep.step.args || {});
            executionCache.set(cacheKey, pastStep);
            cacheSize++;
          }
        }

        if (cacheSize > 0) {
          executorLogger.debug('Deduplication cache built', {
            cacheSize,
            pastStepsCount: pastSteps.length,
          });
        }
      }

      let result: PlanStepResult;
      let success = true;
      let error: string | undefined;
      let isDuplicate = false;

      try {
        if (currentStep.tool) {
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
                ...(currentStep.args
                  ? {
                      argumentKeys: Object.keys(currentStep.args),
                      argumentCount: Object.keys(currentStep.args).length,
                    }
                  : {}),
                iteration,
                cacheHit: true,
              });
            }
          }

          if (!isDuplicate) {
            const tool = tools.find((candidate) => candidate.metadata.name === currentStep.tool);
            if (!tool) {
              throw new Error(`Tool not found: ${currentStep.tool}`);
            }

            const startTime = Date.now();
            let timeoutId: ReturnType<typeof setTimeout> | undefined;

            try {
              const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Step execution timeout')), stepTimeout);
              });

              result = await Promise.race([
                invokePlanExecuteTool(tool, currentStep.args || {}),
                timeoutPromise,
              ]);
            } finally {
              if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
              }
            }

            const executionTime = Date.now() - startTime;

            executorLogger.debug('Step executed successfully', {
              stepId: currentStep.id,
              toolName: currentStep.tool,
              executionTime,
              iteration,
            });
          }
        } else {
          result = { message: 'Step completed without tool execution' };
        }
      } catch (execError) {
        error = handleNodeError(execError, `executor:${currentStep.description}`, false);
        success = false;
        result = null;

        executorLogger.warn('Step execution failed', {
          stepId: currentStep.id,
          ...(currentStep.tool ? { toolName: currentStep.tool } : {}),
          error,
          iteration,
        });
      }

      const completedStep: CompletedStep = {
        step: currentStep,
        result,
        success,
        error,
        timestamp: new Date().toISOString(),
      };

      executorLogger.info('Executor node complete', {
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        totalSteps: plan.steps.length,
        success,
        isDuplicate,
        iteration,
      });

      return {
        pastSteps: [completedStep],
        currentStepIndex: currentStepIndex + 1,
      };
    } catch (error) {
      executorLogger.error('Executor node failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        iteration,
      });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error in executor',
      };
    }
  };
}
