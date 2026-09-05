import type { BuilderWorkerInput } from './agent-types.js';
import type { WorkerConfig } from './types.js';

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
