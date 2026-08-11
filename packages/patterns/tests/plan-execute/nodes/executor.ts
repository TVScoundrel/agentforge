  describe('createExecutorNode', () => {
    it('should create an executor node', () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });
      expect(executor).toBeDefined();
      expect(typeof executor).toBe('function');
    });

    it('should warn when unsupported executor options are provided', () => {
      return importNodesWithMockedPatternLoggers().then(({ createExecutorNode: createExecutorNodeWithMocks, executorWarn }) => {
        createExecutorNodeWithMocks({
          tools: [calculatorTool],
          model: createMockPlannerLLM() as any,
          parallel: true,
        });

        expect(executorWarn).toHaveBeenCalledWith(
          'ExecutorConfig.model is currently unsupported and will be ignored'
        );
        expect(executorWarn).toHaveBeenCalledWith(
          'ExecutorConfig.parallel is currently unsupported and will be ignored',
          { parallel: true }
        );
      });
    });

    it('should execute a step with a tool', async () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Add numbers', tool: 'calculator', args: { a: 5, b: 3 } },
          ],
          goal: 'Calculate',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(true);
      expect(result.pastSteps?.[0].result).toBe(8);
      expect(result.currentStepIndex).toBe(1);
    });

    it('should clear step timeout after successful execution', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      try {
        const executor = createExecutorNode({ tools: [calculatorTool], stepTimeout: 1000 });

        const state: Partial<PlanExecuteStateType> = {
          plan: {
            steps: [
              { id: 'step-1', description: 'Add numbers', tool: 'calculator', args: { a: 5, b: 3 } },
            ],
            goal: 'Calculate',
            createdAt: new Date().toISOString(),
          },
          currentStepIndex: 0,
          pastSteps: [],
          status: 'executing',
        };

        const result = await executor(state as PlanExecuteStateType);

        expect(result.pastSteps?.[0].success).toBe(true);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
      } finally {
        clearTimeoutSpy.mockRestore();
      }
    });

    it('should handle tool not found', async () => {
      const executor = createExecutorNode({ tools: [calculatorTool] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Use unknown tool', tool: 'unknown_tool' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(false);
      expect(result.pastSteps?.[0].error).toContain('Tool not found');
    });

    it('should rethrow GraphInterrupt from tool execution', async () => {
      const interruptingTool = toolBuilder()
        .name('ask-human')
        .description('Interrupt for human input')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ question: z.string().describe('Question requiring human input') }))
        .implement(async () => {
          throw new GraphInterrupt('Pause for human input');
        })
        .build();

      const executor = createExecutorNode({ tools: [interruptingTool] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Ask human', tool: 'ask-human', args: { question: 'Need approval?' } },
          ],
          goal: 'Get approval',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      await expect(executor(state as PlanExecuteStateType)).rejects.toBeInstanceOf(GraphInterrupt);
    });

    it('should execute step without tool', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Manual step' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 0,
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.pastSteps).toHaveLength(1);
      expect(result.pastSteps?.[0].success).toBe(true);
      expect(result.currentStepIndex).toBe(1);
    });

    it('should check dependencies before execution', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'First' },
            { id: 'step-2', description: 'Second', dependencies: ['step-1'] },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 1,
        pastSteps: [], // step-1 not completed
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Unmet dependencies');
    });

    it('should mark as completed when no more steps', async () => {
      const executor = createExecutorNode({ tools: [] });

      const state: Partial<PlanExecuteStateType> = {
        plan: {
          steps: [
            { id: 'step-1', description: 'Only step' },
          ],
          goal: 'Test',
          createdAt: new Date().toISOString(),
        },
        currentStepIndex: 1, // Past the last step
        pastSteps: [],
        status: 'executing',
      };

      const result = await executor(state as PlanExecuteStateType);

      expect(result.status).toBe('completed');
    });
  });
import { describe, it, expect, vi } from 'vitest';
import { createExecutorNode } from '../../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../../src/plan-execute/state.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { calculatorTool, createMockPlannerLLM, GraphInterrupt, importNodesWithMockedPatternLoggers } from './shared.js';
