import type { MultiAgentSystemWithRegistry, RegisterWorkerInput } from './agent-types.js';
import { resolveWorkerLifecycle } from './worker-lifecycle.js';

export function registerWorkerCapabilities(
  system: MultiAgentSystemWithRegistry,
  workers: RegisterWorkerInput[]
): void {
  resolveWorkerLifecycle(system).publishRoutingSkills(
    workers.map((worker) => ({
      id: worker.name,
      skills: worker.capabilities,
      ...(worker.tools === undefined ? {} : { assertedTools: worker.tools }),
    }))
  );
}
