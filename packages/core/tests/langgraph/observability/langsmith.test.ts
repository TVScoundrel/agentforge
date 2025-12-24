import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  configureLangSmith,
  getLangSmithConfig,
  isTracingEnabled,
  withTracing,
  resetLangSmithConfig,
} from '../../../src/langgraph/observability/langsmith.js';

describe('LangSmith Integration', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.LANGSMITH_API_KEY;
    delete process.env.LANGSMITH_PROJECT;
    delete process.env.LANGSMITH_TRACING;
    delete process.env.LANGSMITH_ENDPOINT;
    // Reset global config
    resetLangSmithConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('configureLangSmith', () => {
    it('should set environment variables', () => {
      configureLangSmith({
        apiKey: 'test-key',
        projectName: 'test-project',
        tracingEnabled: true,
      });

      expect(process.env.LANGSMITH_API_KEY).toBe('test-key');
      expect(process.env.LANGSMITH_PROJECT).toBe('test-project');
      expect(process.env.LANGSMITH_TRACING).toBe('true');
    });

    it('should enable tracing by default when API key is provided', () => {
      configureLangSmith({
        apiKey: 'test-key',
        projectName: 'test-project',
      });

      expect(process.env.LANGSMITH_TRACING).toBe('true');
    });

    it('should respect explicit tracing disabled', () => {
      configureLangSmith({
        apiKey: 'test-key',
        projectName: 'test-project',
        tracingEnabled: false,
      });

      expect(process.env.LANGSMITH_TRACING).toBe('false');
    });

    it('should set custom endpoint', () => {
      configureLangSmith({
        apiKey: 'test-key',
        endpoint: 'https://custom.endpoint.com',
      });

      expect(process.env.LANGSMITH_ENDPOINT).toBe('https://custom.endpoint.com');
    });

    it('should handle partial configuration', () => {
      configureLangSmith({
        projectName: 'test-project',
      });

      expect(process.env.LANGSMITH_PROJECT).toBe('test-project');
      expect(process.env.LANGSMITH_API_KEY).toBeUndefined();
    });
  });

  describe('getLangSmithConfig', () => {
    it('should return null when not configured', () => {
      expect(getLangSmithConfig()).toBeNull();
    });

    it('should return configuration after setup', () => {
      const config = {
        apiKey: 'test-key',
        projectName: 'test-project',
        tracingEnabled: true,
      };

      configureLangSmith(config);

      expect(getLangSmithConfig()).toEqual(config);
    });
  });

  describe('isTracingEnabled', () => {
    it('should return false when not configured', () => {
      expect(isTracingEnabled()).toBe(false);
    });

    it('should return true when tracing is enabled', () => {
      configureLangSmith({
        apiKey: 'test-key',
        tracingEnabled: true,
      });

      expect(isTracingEnabled()).toBe(true);
    });

    it('should return false when tracing is disabled', () => {
      configureLangSmith({
        apiKey: 'test-key',
        tracingEnabled: false,
      });

      expect(isTracingEnabled()).toBe(false);
    });
  });

  describe('withTracing', () => {
    it('should wrap a node function', async () => {
      const node = (state: { count: number }) => ({ count: state.count + 1 });

      const tracedNode = withTracing(node, {
        name: 'test-node',
        metadata: { category: 'test' },
      });

      const result = await tracedNode({ count: 0 });
      expect(result.count).toBe(1);
    });

    it('should work with async nodes', async () => {
      const node = async (state: { count: number }) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { count: state.count + 1 };
      };

      const tracedNode = withTracing(node, {
        name: 'async-node',
      });

      const result = await tracedNode({ count: 0 });
      expect(result.count).toBe(1);
    });

    it('should work when tracing is disabled', async () => {
      configureLangSmith({ tracingEnabled: false });

      const node = (state: { count: number }) => ({ count: state.count + 1 });

      const tracedNode = withTracing(node, {
        name: 'test-node',
      });

      const result = await tracedNode({ count: 0 });
      expect(result.count).toBe(1);
    });

    it('should preserve errors', async () => {
      const node = () => {
        throw new Error('Test error');
      };

      const tracedNode = withTracing(node, {
        name: 'error-node',
      });

      await expect(tracedNode({ count: 0 })).rejects.toThrow('Test error');
    });
  });
});

