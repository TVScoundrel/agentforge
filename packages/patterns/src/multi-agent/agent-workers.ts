import type { WorkerCapabilities } from './schemas.js';
import type { BuilderWorkerInput, RegisterWorkerInput } from './agent-types.js';
import type { WorkerConfig } from './types.js';
import { normalizeWorkerToolNames } from './worker-lifecycle.js';

export function toWorkerCapabilities(worker: RegisterWorkerInput): WorkerCapabilities {
  return {
    skills: worker.capabilities,
    tools: [...normalizeWorkerToolNames(worker.name, worker.tools)],
    available: true,
    currentWorkload: 0,
  };
}

export function toWorkerConfig(
  worker: BuilderWorkerInput,
  fallbackModel: WorkerConfig['model']
): WorkerConfig {
  return {
    id: worker.name,
    capabilities: {
      skills: worker.capabilities,
      tools: [],
      available: true,
      currentWorkload: 0,
    },
    model: worker.model || fallbackModel,
    tools: worker.tools,
    systemPrompt: worker.systemPrompt,
  };
}
