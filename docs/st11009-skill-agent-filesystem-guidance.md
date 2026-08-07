# ST-11009: Skill Agent Filesystem Guidance

## Decision

Model-facing file and directory tools in the skill-powered-agent guidance now come from `createModelSafeToolPreset` and require an explicit workspace root. The standalone unrestricted filesystem factories remain available only for trusted, operator-controlled automation.

Skill activation and resource loading remain separate. `SkillRegistry.toActivationTools()` continues to enforce skill-root trust, including the distinction between trusted workspace resources and untrusted scripts; generic filesystem tools do not replace that path.

## Validation Strategy

The example exports its model-facing filesystem setup through `createWorkspaceFileTools`. Focused automated coverage verifies that a relative workspace file remains readable while both traversal and absolute outside-root paths are rejected. The example-local Vitest configuration makes this validation directly runnable without expanding the root test-project include patterns.

No CI workflow file change is required. The example is registered in `pnpm-workspace.yaml` so repository install and recursive typecheck paths can include it, while the example exposes a focused `test` script for its boundary behavior.

## Security Boundary

The shared preset enforces the repository policy described in [`SECURITY.md`](../SECURITY.md). Callers must provide `workspaceRoot` or `allowedRoots`; privileged opt-outs are intentionally not honored by the model-safe preset.
