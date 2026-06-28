export const EXPECTED_ALLOW_BUILDS = [
  'better-sqlite3',
  'cpu-features',
  'esbuild',
  'protobufjs',
  'ssh2',
];

export function parseAllowBuilds(workspaceText) {
  const entries = new Map();
  const lines = workspaceText.split(/\r?\n/);
  let allowBuildSections = 0;
  let currentSectionIndex = -1;

  for (const line of lines) {
    if (line.trim() === 'allowBuilds:') {
      allowBuildSections += 1;
      currentSectionIndex = allowBuildSections;
      continue;
    }

    if (currentSectionIndex === -1) {
      continue;
    }

    if (!line.startsWith('  ')) {
      currentSectionIndex = -1;
      continue;
    }

    const match = line.match(/^  ([^:]+):\s*(.+)$/);
    if (!match || currentSectionIndex !== 1) {
      continue;
    }

    entries.set(match[1].trim(), match[2].trim());
  }

  return {
    entries,
    allowBuildSections,
  };
}

export function validateAllowBuilds(workspaceText) {
  const { entries, allowBuildSections } = parseAllowBuilds(workspaceText);
  const missing = [];
  const invalid = [];

  for (const name of EXPECTED_ALLOW_BUILDS) {
    const value = entries.get(name);

    if (value === undefined) {
      missing.push(name);
      continue;
    }

    if (value !== 'true') {
      invalid.push({ name, value });
    }
  }

  return {
    ok: allowBuildSections === 1 && missing.length === 0 && invalid.length === 0,
    allowBuildSections,
    missing,
    invalid,
  };
}

export function formatValidationError(result) {
  const issues = [];

  if (result.missing.length > 0) {
    issues.push(`missing approvals: ${result.missing.join(', ')}`);
  }

  if (result.invalid.length > 0) {
    issues.push(
      `invalid approvals: ${result.invalid.map(({ name, value }) => `${name}=${value}`).join(', ')}`
    );
  }

  if (result.allowBuildSections !== 1) {
    issues.push(`expected exactly one allowBuilds section but found ${result.allowBuildSections}`);
  }

  return [
    'pnpm build approvals are not fully committed in pnpm-workspace.yaml.',
    `Detected ${issues.join('; ')}.`,
    'Run `pnpm approve-builds --all`, review the resulting pnpm-workspace.yaml, and commit the updated allowBuilds entries before relying on the release validation path.',
  ].join(' ');
}
