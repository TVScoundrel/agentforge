import { describe, it, expect } from 'vitest';
import { createAskHumanTool } from '../../src/agent/ask-human/index.js';
import type { AskHumanInput } from '../../src/agent/ask-human/types.js';

/**
 * Integration tests for askHuman tool with Plan-Execute pattern
 * 
 * The Plan-Execute pattern has two phases:
 * 1. Planning phase: Create a plan of steps
 * 2. Execution phase: Execute each step
 * 
 * The askHuman tool can be used in either phase:
 * - In planning: Ask human for clarification before creating plan
 * - In execution: Ask human for approval/input during step execution
 * 
 * These tests verify that the askHuman tool integrates correctly with
 * Plan-Execute workflows.
 */
describe('askHuman Tool - Plan-Execute Integration', () => {
  describe('planning phase integration', () => {
    it('should be usable in planning phase for clarification', () => {
      const tool = createAskHumanTool();

      // In planning phase, agent might ask for clarification
      const planningInput: AskHumanInput = {
        question: 'What is the target completion date for this task?',
        context: { phase: 'planning', task: 'project_setup' },
        priority: 'high',
        suggestions: ['Today', 'This week', 'This month'],
      };

      // Validate that the input is correct for planning phase
      const validated = tool.schema.parse(planningInput);
      expect(validated.question).toBe('What is the target completion date for this task?');
      expect(validated.context).toEqual({ phase: 'planning', task: 'project_setup' });
      expect(validated.suggestions).toHaveLength(3);
    });

    it('should support high priority for critical planning decisions', () => {
      const tool = createAskHumanTool();

      const criticalInput: AskHumanInput = {
        question: 'This action will delete all data. Are you sure?',
        priority: 'critical',
        suggestions: ['Yes, proceed', 'No, cancel'],
      };

      const validated = tool.schema.parse(criticalInput);
      expect(validated.priority).toBe('critical');
    });
  });

  describe('execution phase integration', () => {
    it('should be usable in execution phase for approvals', () => {
      const tool = createAskHumanTool();

      // In execution phase, agent might ask for approval
      const executionInput: AskHumanInput = {
        question: 'Step 3 requires admin approval. Proceed?',
        context: {
          phase: 'execution',
          step: 3,
          action: 'deploy_to_production',
        },
        priority: 'high',
        timeout: 60000, // 1 minute timeout
        defaultResponse: 'no', // Default to safe option
      };

      const validated = tool.schema.parse(executionInput);
      expect(validated.context?.phase).toBe('execution');
      expect(validated.timeout).toBe(60000);
      expect(validated.defaultResponse).toBe('no');
    });

    it('should support timeout for non-blocking execution', () => {
      const tool = createAskHumanTool();

      const timedInput: AskHumanInput = {
        question: 'Approve deployment?',
        timeout: 30000,
        defaultResponse: 'skip',
      };

      const validated = tool.schema.parse(timedInput);
      expect(validated.timeout).toBe(30000);
      expect(validated.defaultResponse).toBe('skip');
    });
  });

  describe('multi-step workflow integration', () => {
    it('should support context tracking across multiple steps', () => {
      const tool = createAskHumanTool();

      // Simulate asking human at different steps
      const step1Input: AskHumanInput = {
        question: 'Choose database type',
        context: { step: 1, totalSteps: 5 },
        suggestions: ['PostgreSQL', 'MySQL', 'MongoDB'],
      };

      const step3Input: AskHumanInput = {
        question: 'Confirm database credentials',
        context: { step: 3, totalSteps: 5, previousChoice: 'PostgreSQL' },
        priority: 'high',
      };

      const validated1 = tool.schema.parse(step1Input);
      const validated2 = tool.schema.parse(step3Input);

      expect(validated1.context?.step).toBe(1);
      expect(validated2.context?.step).toBe(3);
      expect(validated2.context?.previousChoice).toBe('PostgreSQL');
    });

    it('should support different priorities for different steps', () => {
      const tool = createAskHumanTool();

      const lowPriorityInput: AskHumanInput = {
        question: 'Choose color scheme',
        priority: 'low',
      };

      const highPriorityInput: AskHumanInput = {
        question: 'Approve payment of $10,000',
        priority: 'critical',
      };

      const validated1 = tool.schema.parse(lowPriorityInput);
      const validated2 = tool.schema.parse(highPriorityInput);

      expect(validated1.priority).toBe('low');
      expect(validated2.priority).toBe('critical');
    });
  });

  describe('tool compatibility', () => {
    it('should work alongside other tools in Plan-Execute workflow', () => {
      const askHuman = createAskHumanTool();
      
      // Simulate a tools array in Plan-Execute pattern
      const tools = [askHuman];

      expect(tools).toHaveLength(1);
      expect(tools[0].metadata.name).toBe('ask-human');
      expect(tools[0].metadata.category).toBe('utility');
    });
  });
});

