import type { WorkerCapabilities } from './schemas.js';
import type { BuilderWorkerInput, RegisterWorkerInput } from './agent-types.js';
import type { WorkerConfig } from './types.js';

type ToolLike = {
  metadata?: { name?: string };
  name?: string;
};

export function getToolName(tool: unknown): string {
  if (!tool || typeof tool !== 'object') {
    return 'unknown';
  }

  const candidate = tool as ToolLike;

  if (typeof candidate.metadata?.name === 'string') {
    return candidate.metadata.name;
  }

  if (typeof candidate.name === 'string') {
    return candidate.name;
  }

  return 'unknown';
}

export function toWorkerCapabilities(worker: RegisterWorkerInput): WorkerCapabilities {
  return {
    skills: worker.capabilities,
    tools: worker.tools?.map(tool => getToolName(tool)) || [],
    available: true,
    currentWorkload: 0,
  };
}

export function toWorkerConfig(
  worker: BuilderWorkerInput,
  fallbackModel: WorkerConfig['model'],
): WorkerConfig {
  return {
    id: worker.name,
    capabilities: toWorkerCapabilities(worker),
    model: worker.model || fallbackModel,
    tools: worker.tools,
    systemPrompt: worker.systemPrompt,
  };
}
