import type { WorkerCapabilities } from './schemas.js';
import type { WorkerConfig } from './types.js';

export type WorkerLifecycleErrorReason =
  | 'empty-topology'
  | 'invalid-identity'
  | 'duplicate-identity'
  | 'unknown-worker'
  | 'invalid-tool'
  | 'unsupported-system';

export class WorkerLifecycleError extends Error {
  readonly reason: WorkerLifecycleErrorReason;

  constructor(reason: WorkerLifecycleErrorReason, message: string) {
    super(message);
    this.name = 'WorkerLifecycleError';
    this.reason = reason;
  }
}

export interface WorkerLifecycle {
  readonly topology: readonly WorkerConfig[];
  readonly workerCapabilities: Readonly<Record<string, WorkerCapabilities>>;
}

type ToolLike = {
  metadata?: { name?: unknown };
  name?: unknown;
};

function normalizeToolName(tool: unknown, workerId: string, index: number): string {
  const candidate = tool && typeof tool === 'object' ? (tool as ToolLike) : undefined;
  const rawName = candidate?.metadata?.name ?? candidate?.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) {
    throw new WorkerLifecycleError(
      'invalid-tool',
      `Worker "${workerId}" has a nameless tool at index ${index}.`
    );
  }

  return name;
}

export function normalizeWorkerToolNames(
  workerId: string,
  tools: readonly unknown[] | undefined
): readonly string[] {
  const toolNames = (tools ?? []).map((tool, index) => normalizeToolName(tool, workerId, index));
  const uniqueToolNames = new Set(toolNames);
  if (uniqueToolNames.size !== toolNames.length) {
    throw new WorkerLifecycleError(
      'invalid-tool',
      `Worker "${workerId}" has duplicate normalized tool names.`
    );
  }

  return Object.freeze(toolNames);
}

function validateIdentities(workers: readonly WorkerConfig[]): void {
  for (const worker of workers) {
    if (!worker.id || worker.id.trim() !== worker.id || worker.id.includes(',')) {
      throw new WorkerLifecycleError(
        'invalid-identity',
        `Worker identity "${worker.id}" must be non-empty, trimmed, and comma-free.`
      );
    }
  }

  const identities = new Set<string>();
  for (const worker of workers) {
    if (identities.has(worker.id)) {
      throw new WorkerLifecycleError(
        'duplicate-identity',
        `Worker identity "${worker.id}" appears more than once in the topology.`
      );
    }
    identities.add(worker.id);
  }
}

function admitWorker(worker: WorkerConfig): WorkerConfig {
  const toolNames = normalizeWorkerToolNames(worker.id, worker.tools);

  const capabilities = Object.freeze({
    skills: Object.freeze([...worker.capabilities.skills]),
    tools: toolNames,
    available: worker.capabilities.available,
    currentWorkload: worker.capabilities.currentWorkload,
  }) as WorkerCapabilities;
  const tools = worker.tools
    ? (Object.freeze([...worker.tools]) as WorkerConfig['tools'])
    : undefined;

  return Object.freeze({
    ...worker,
    capabilities,
    ...(tools ? { tools } : {}),
  });
}

export function admitWorkerTopology(workers: readonly WorkerConfig[]): WorkerLifecycle {
  if (workers.length === 0) {
    throw new WorkerLifecycleError(
      'empty-topology',
      'A Multi-Agent System requires at least one Worker.'
    );
  }

  validateIdentities(workers);
  const topology = Object.freeze(workers.map(admitWorker));
  const workerCapabilities = Object.freeze(
    Object.fromEntries(topology.map((worker) => [worker.id, worker.capabilities]))
  );

  return Object.freeze({ topology, workerCapabilities });
}
