import { describe, it, expect, vi } from 'vitest';
import { withConcurrency, createSharedConcurrencyController, type Priority } from '../concurrency.js';

interface TestState {
  input: string;
  output?: string;
  priority?: Priority;
}

describe('Concurrency Control Middleware', () => {
  describe('withConcurrency()', () => {
    it('should limit concurrent executions', async () => {
      let activeCount = 0;
      let maxActive = 0;

      const node = vi.fn(async (state: TestState) => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeCount--;
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 2,
      });

      // Start 5 concurrent executions
      const promises = Array.from({ length: 5 }, (_, i) =>
        concurrentNode({ input: `test${i}` })
      );

      await Promise.all(promises);

      // Should never have more than 2 active at once
      expect(maxActive).toBe(2);
      expect(node).toHaveBeenCalledTimes(5);
    });

    it('should queue tasks when at max concurrency', async () => {
      const onQueued = vi.fn();
      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 1,
        onQueued,
      });

      // Start 3 tasks - first executes, others queue
      const promises = [
        concurrentNode({ input: 'test1' }),
        concurrentNode({ input: 'test2' }),
        concurrentNode({ input: 'test3' }),
      ];

      // Wait a bit for tasks to queue
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have queued 2 tasks
      expect(onQueued).toHaveBeenCalledTimes(2);

      await Promise.all(promises);
    });

    it('should respect priority ordering', async () => {
      const executionOrder: string[] = [];
      const node = vi.fn(async (state: TestState) => {
        executionOrder.push(state.input);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 1,
        priorityFn: (state) => state.priority || 'normal',
      });

      // Start tasks with different priorities
      const promises = [
        concurrentNode({ input: 'low', priority: 'low' }),
        concurrentNode({ input: 'high', priority: 'high' }),
        concurrentNode({ input: 'normal', priority: 'normal' }),
      ];

      await Promise.all(promises);

      // First task executes immediately (low)
      // Then high priority should execute before normal
      expect(executionOrder).toEqual(['low', 'high', 'normal']);
    });

    it('should reject when queue is full', async () => {
      const onQueueFull = vi.fn();
      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 1,
        maxQueueSize: 2,
        onQueueFull,
      });

      // Start 4 tasks - 1 executes, 2 queue, 1 should be rejected
      const promises = [
        concurrentNode({ input: 'test1' }),
        concurrentNode({ input: 'test2' }),
        concurrentNode({ input: 'test3' }),
        concurrentNode({ input: 'test4' }),
      ];

      // The 4th task should be rejected
      await expect(promises[3]).rejects.toThrow('Queue is full');
      expect(onQueueFull).toHaveBeenCalled();

      // Wait for others to complete
      await Promise.all(promises.slice(0, 3));
    });

    it('should timeout queued tasks', async () => {
      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 1,
        queueTimeout: 50,
      });

      // Start 2 tasks - second will timeout in queue
      const promise1 = concurrentNode({ input: 'test1' });
      const promise2 = concurrentNode({ input: 'test2' });

      await expect(promise2).rejects.toThrow('timed out');
      await promise1; // First should complete
    });

    it('should call execution callbacks', async () => {
      const onExecutionStart = vi.fn();
      const onExecutionComplete = vi.fn();

      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ...state, output: 'result' };
      });

      const concurrentNode = withConcurrency(node, {
        maxConcurrent: 2,
        onExecutionStart,
        onExecutionComplete,
      });

      await concurrentNode({ input: 'test' });

      expect(onExecutionStart).toHaveBeenCalled();
      expect(onExecutionComplete).toHaveBeenCalled();
    });
  });

  describe('createSharedConcurrencyController()', () => {
    it('should create a shared controller', async () => {
      const controller = createSharedConcurrencyController<TestState>({
        maxConcurrent: 2,
      });

      let activeCount = 0;
      let maxActive = 0;

      const node1 = vi.fn(async (state: TestState) => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeCount--;
        return { ...state, output: 'node1' };
      });

      const node2 = vi.fn(async (state: TestState) => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeCount--;
        return { ...state, output: 'node2' };
      });

      const concurrentNode1 = controller.withConcurrency(node1);
      const concurrentNode2 = controller.withConcurrency(node2);

      // Both nodes share the same concurrency limit
      const promises = [
        concurrentNode1({ input: 'test1' }),
        concurrentNode1({ input: 'test2' }),
        concurrentNode2({ input: 'test3' }),
        concurrentNode2({ input: 'test4' }),
      ];

      await Promise.all(promises);

      // Should never exceed shared limit of 2
      expect(maxActive).toBe(2);
    });

    it('should provide stats', async () => {
      const controller = createSharedConcurrencyController<TestState>({
        maxConcurrent: 1,
      });

      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, output: 'result' };
      });

      const concurrentNode = controller.withConcurrency(node);

      // Start 2 tasks
      const promise1 = concurrentNode({ input: 'test1' });
      concurrentNode({ input: 'test2' });

      // Wait a bit for second to queue
      await new Promise((resolve) => setTimeout(resolve, 10));

      const stats = controller.getStats();
      expect(stats.activeCount).toBe(1);
      expect(stats.queueSize).toBe(1);

      await promise1;
    });

    it('should clear queue', async () => {
      const controller = createSharedConcurrencyController<TestState>({
        maxConcurrent: 1,
      });

      const node = vi.fn(async (state: TestState) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { ...state, output: 'result' };
      });

      const concurrentNode = controller.withConcurrency(node);

      // Start 3 tasks
      concurrentNode({ input: 'test1' });
      const promise2 = concurrentNode({ input: 'test2' });
      const promise3 = concurrentNode({ input: 'test3' });

      // Clear the queue
      controller.clear();

      // Queued tasks should be rejected
      await expect(promise2).rejects.toThrow('Queue cleared');
      await expect(promise3).rejects.toThrow('Queue cleared');
    });
  });
});

