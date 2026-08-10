import type { WorkerConfig, WorkerExecutionConfig } from '../../../src/multi-agent/types.js';

const workerConfig: WorkerConfig = {
  id: 'worker',
  capabilities: { tools: [], skills: ['example'], available: true, currentWorkload: 0 },
};

const executionConfig: WorkerExecutionConfig = { configurable: { thread_id: 'contract' } };

export type WorkerContract = {
  config: typeof workerConfig;
  executionConfig: typeof executionConfig;
};
