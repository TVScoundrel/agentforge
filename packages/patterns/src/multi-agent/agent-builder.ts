import { createCompiledMultiAgentSystem } from './agent-graph.js';
import type { BuilderWorkerInput } from './agent-types.js';
import { toWorkerConfig } from './agent-workers.js';
import type { MultiAgentSystemConfig, WorkerConfig } from './types.js';
import { admitWorkerTopology, type WorkerLifecycle } from './worker-lifecycle.js';

export class MultiAgentSystemBuilder {
  private config: MultiAgentSystemConfig;
  private lifecycle: WorkerLifecycle | undefined;
  private compiled = false;

  constructor(config: Omit<MultiAgentSystemConfig, 'workers'> & { workers?: WorkerConfig[] }) {
    this.config = {
      ...config,
      workers: [],
    };
    this.lifecycle = config.workers?.length ? admitWorkerTopology(config.workers) : undefined;
  }

  registerWorkers(workers: BuilderWorkerInput[]): this {
    if (this.compiled) {
      throw new Error('Cannot register workers after the system has been compiled');
    }

    if (workers.length === 0) {
      return this;
    }

    const existingWorkers = this.lifecycle?.topology ?? [];
    const pendingWorkers = workers.map((worker) =>
      toWorkerConfig(worker, this.config.supervisor.model)
    );
    const lifecycle = admitWorkerTopology([...existingWorkers, ...pendingWorkers]);

    this.lifecycle = lifecycle;

    return this;
  }

  build() {
    if (this.compiled) {
      throw new Error('System has already been compiled');
    }

    const lifecycle = this.lifecycle ?? admitWorkerTopology([]);

    const system = createCompiledMultiAgentSystem(
      {
        ...this.config,
        workers: [...lifecycle.topology],
      },
      lifecycle
    );
    this.compiled = true;

    return system;
  }
}
