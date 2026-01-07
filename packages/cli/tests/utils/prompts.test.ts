import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  promptProjectSetup,
  promptAgentSetup,
  promptToolSetup,
  type ProjectPromptAnswers,
  type AgentPromptAnswers,
  type ToolPromptAnswers,
} from '../../src/utils/prompts.js';
import inquirer from 'inquirer';

vi.mock('inquirer');

describe('Prompt Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('promptProjectSetup', () => {
    it('should prompt for project setup with defaults', async () => {
      const mockAnswers: ProjectPromptAnswers = {
        projectName: 'my-agent',
        template: 'minimal',
        packageManager: 'pnpm',
        installDependencies: true,
        initGit: true,
        author: 'John Doe',
        description: 'My agent project',
      };

      vi.mocked(inquirer.prompt).mockResolvedValueOnce(mockAnswers);

      const result = await promptProjectSetup();
      expect(result).toEqual(mockAnswers);
      expect(inquirer.prompt).toHaveBeenCalled();
    });

    it('should use provided defaults', async () => {
      const defaults = {
        projectName: 'custom-agent',
        template: 'full' as const,
        packageManager: 'npm' as const,
      };

      const mockAnswers: ProjectPromptAnswers = {
        ...defaults,
        installDependencies: true,
        initGit: true,
      };

      vi.mocked(inquirer.prompt).mockResolvedValueOnce(mockAnswers);

      const result = await promptProjectSetup(defaults);
      expect(result.projectName).toBe('custom-agent');
      expect(result.template).toBe('full');
      expect(result.packageManager).toBe('npm');
    });

    it('should validate project name format', async () => {
      const promptCall = vi.mocked(inquirer.prompt).mock;
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({
        projectName: 'my-agent',
        template: 'minimal',
        packageManager: 'pnpm',
        installDependencies: true,
        initGit: true,
      });

      await promptProjectSetup();

      // Check that validation function exists
      const questions = promptCall.calls[0][0] as any[];
      const projectNameQuestion = questions.find((q) => q.name === 'projectName');
      expect(projectNameQuestion.validate).toBeDefined();

      // Test validation
      expect(projectNameQuestion.validate('')).toBe('Project name is required');
      expect(projectNameQuestion.validate('Invalid Name')).toContain('lowercase');
      expect(projectNameQuestion.validate('valid-name')).toBe(true);
    });
  });

  describe('promptAgentSetup', () => {
    it('should prompt for agent setup', async () => {
      const mockAnswers: AgentPromptAnswers = {
        name: 'MyAgent',
        pattern: 'react',
        description: 'A test agent',
        generateTests: true,
      };

      vi.mocked(inquirer.prompt).mockResolvedValueOnce(mockAnswers);

      const result = await promptAgentSetup();
      expect(result).toEqual(mockAnswers);
      expect(inquirer.prompt).toHaveBeenCalled();
    });

    it('should validate agent name format', async () => {
      const promptCall = vi.mocked(inquirer.prompt).mock;
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({
        name: 'MyAgent',
        pattern: 'react',
        generateTests: true,
      });

      await promptAgentSetup();

      const questions = promptCall.calls[0][0] as any[];
      const nameQuestion = questions.find((q) => q.name === 'name');
      expect(nameQuestion.validate).toBeDefined();

      // Test validation
      expect(nameQuestion.validate('')).toBe('Agent name is required');
      expect(nameQuestion.validate('123Invalid')).toContain('start with a letter');
      expect(nameQuestion.validate('ValidName')).toBe(true);
    });

    it('should support all agent patterns', async () => {
      const patterns: Array<'react' | 'plan-execute' | 'reflection' | 'multi-agent'> = [
        'react',
        'plan-execute',
        'reflection',
        'multi-agent',
      ];

      for (const pattern of patterns) {
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({
          name: 'TestAgent',
          pattern,
          generateTests: true,
        });

        const result = await promptAgentSetup({ pattern });
        expect(result.pattern).toBe(pattern);
      }
    });
  });

  describe('promptToolSetup', () => {
    it('should prompt for tool setup', async () => {
      const mockAnswers: ToolPromptAnswers = {
        name: 'myTool',
        category: 'utility',
        description: 'A test tool',
        generateTests: true,
      };

      vi.mocked(inquirer.prompt).mockResolvedValueOnce(mockAnswers);

      const result = await promptToolSetup();
      expect(result).toEqual(mockAnswers);
      expect(inquirer.prompt).toHaveBeenCalled();
    });

    it('should validate tool name and description', async () => {
      const promptCall = vi.mocked(inquirer.prompt).mock;
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({
        name: 'myTool',
        category: 'web',
        description: 'A web tool',
        generateTests: true,
      });

      await promptToolSetup();

      const questions = promptCall.calls[0][0] as any[];
      const nameQuestion = questions.find((q) => q.name === 'name');
      const descQuestion = questions.find((q) => q.name === 'description');

      expect(nameQuestion.validate('')).toBe('Tool name is required');
      expect(descQuestion.validate('')).toBe('Tool description is required');
      expect(descQuestion.validate('Valid description')).toBe(true);
    });

    it('should support all tool categories', async () => {
      const categories: Array<'web' | 'data' | 'file' | 'utility'> = ['web', 'data', 'file', 'utility'];

      for (const category of categories) {
        vi.mocked(inquirer.prompt).mockResolvedValueOnce({
          name: 'testTool',
          category,
          description: 'Test tool',
          generateTests: true,
        });

        const result = await promptToolSetup({ category });
        expect(result.category).toBe(category);
      }
    });
  });
});

