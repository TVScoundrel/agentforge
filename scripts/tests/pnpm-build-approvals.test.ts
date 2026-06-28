import { describe, expect, it } from 'vitest';

import {
  EXPECTED_ALLOW_BUILDS,
  validateAllowBuilds,
} from '../lib/pnpm-build-approvals.mjs';

describe('validateAllowBuilds', () => {
  it('accepts a workspace config with all expected approvals set to true', () => {
    const allowBuildLines = EXPECTED_ALLOW_BUILDS
      .map((entry) => `  ${entry}: true`)
      .join('\n');

    const result = validateAllowBuilds(`packages:\n  - 'packages/*'\nallowBuilds:\n${allowBuildLines}\n`);

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('flags missing and placeholder approvals with actionable details', () => {
    const result = validateAllowBuilds(`packages:\n  - 'packages/*'\nallowBuilds:\n  better-sqlite3: true\n  cpu-features: set this to true or false\n`);

    expect(result.ok).toBe(false);
    expect(result.allowBuildSections).toBe(1);
    expect(result.missing).toEqual(['esbuild', 'protobufjs', 'ssh2']);
    expect(result.invalid).toEqual([
      {
        name: 'cpu-features',
        value: 'set this to true or false',
      },
    ]);
  });

  it('rejects duplicate allowBuilds sections so approval drift cannot hide behind the first block', () => {
    const allowBuildLines = EXPECTED_ALLOW_BUILDS
      .map((entry) => `  ${entry}: true`)
      .join('\n');

    const result = validateAllowBuilds(
      `packages:\n  - 'packages/*'\nallowBuilds:\n${allowBuildLines}\nplayground:\n  enabled: true\nallowBuilds:\n  cpu-features: true\n`
    );

    expect(result.ok).toBe(false);
    expect(result.allowBuildSections).toBe(2);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });
});
