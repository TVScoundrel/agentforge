import { createCompiledMultiAgentSystem } from './agent-graph.js';
import type { BuilderWorkerInput } from './agent-types.js';
import { toWorkerConfig } from './agent-workers.js';
import type { MultiAgentSystemConfig, WorkerConfig } from './types.js';

export class MultiAgentSystemBuilder {
  private config: MultiAgentSystemConfig;
  private additionalWorkers: WorkerConfig[] = [];
  private compiled = false;

  constructor(config: Omit<MultiAgentSystemConfig, 'workers'> & { workers?: WorkerConfig[] }) {
    this.config = {
      ...config,
      workers: config.workers || [],
    };
  }

  registerWorkers(workers: BuilderWorkerInput[]): this {
    if (this.compiled) {
      throw new Error('Cannot register workers after the system has been compiled');
    }

    for (const worker of workers) {
      this.additionalWorkers.push(toWorkerConfig(worker, this.config.supervisor.model));
    }

    return this;
  }

  build() {
    if (this.compiled) {
      throw new Error('System has already been compiled');
    }

    const allWorkers = [...this.config.workers, ...this.additionalWorkers];

    if (allWorkers.length === 0) {
      throw new Error('At least one worker must be registered before building the system');
    }

    this.compiled = true;

    return createCompiledMultiAgentSystem({
      ...this.config,
      workers: allWorkers,
    });
  }
}
