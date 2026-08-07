import { createModelSafeToolPreset } from '@agentforge/tools';

/**
 * Creates only the model-facing filesystem tools for this example.
 * Skill activation/resource tools remain governed by SkillRegistry trust policy.
 */
export function createWorkspaceFileTools(workspaceRoot: string) {
  const preset = createModelSafeToolPreset({ fileSystem: { workspaceRoot } });
  return {
    fileTools: preset.fileTools,
    directoryTools: preset.directoryTools,
    tools: [...preset.fileTools, ...preset.directoryTools],
  };
}
