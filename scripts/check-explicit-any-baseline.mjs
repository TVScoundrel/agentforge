#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const RULE_ID = '@typescript-eslint/no-explicit-any';
const TARGET_GLOB = 'packages/**/src/**/*.ts';

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/');
}

function getPackageName(filePath) {
  const match = normalizePath(filePath).match(/\/packages\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}

function collectCounts(eslintResults) {
  const byPackage = new Map();
  const byFile = new Map();
  let total = 0;

  for (const file of eslintResults) {
    const filePath = normalizePath(file.filePath);
    const packageName = getPackageName(filePath);

    for (const message of file.messages) {
      if (message.ruleId !== RULE_ID) {
        continue;
      }

      total += 1;
      byPackage.set(packageName, (byPackage.get(packageName) ?? 0) + 1);
      byFile.set(filePath, (byFile.get(filePath) ?? 0) + 1);
    }
  }

  return { total, byPackage, byFile };
}

function readEslintResults() {
  const eslintRun = spawnSync(
    'pnpm',
    ['exec', 'eslint', TARGET_GLOB, '--max-warnings=-1', '-f', 'json'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 }
  );

  const stdout = eslintRun.stdout ?? '';
  const stderr = eslintRun.stderr ?? '';

  // ESLint exits non-zero when lint errors exist, but JSON output can still be valid.
  if (!stdout.trim().startsWith('[')) {
    if (stderr.trim()) {
      console.error(stderr.trim());
    }
    console.error('Failed to read ESLint JSON output for explicit-any baseline check.');
    process.exit(eslintRun.status || 1);
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Unable to parse ESLint JSON output:', error);
    process.exit(1);
  }
}

const baseline = JSON.parse(await readFile(new URL('./no-explicit-any-baseline.json', import.meta.url), 'utf8'));
const eslintResults = readEslintResults();
const { total, byPackage, byFile } = collectCounts(eslintResults);

const packageRows = Object.entries(baseline.byPackage ?? {}).map(([name, max]) => {
  const current = byPackage.get(name) ?? 0;
  return { name, current, max };
});

const regressions = packageRows.filter((row) => row.current > row.max);
const totalRegression = total > baseline.maxWarnings;

console.log(
  `no-explicit-any baseline (${TARGET_GLOB}): ${total}/${baseline.maxWarnings} warnings`
);

for (const row of packageRows) {
  console.log(`  ${row.name}: ${row.current}/${row.max}`);
}

if (regressions.length > 0 || totalRegression) {
  console.error('\nExplicit any warning regression detected.');
  if (totalRegression) {
    console.error(`- Total warnings increased: ${total} > ${baseline.maxWarnings}`);
  }

  for (const regression of regressions) {
    console.error(`- Package ${regression.name} increased: ${regression.current} > ${regression.max}`);
  }

  const topFiles = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (topFiles.length > 0) {
    console.error('\nTop files by current explicit-any warnings:');
    for (const [filePath, count] of topFiles) {
      console.error(`- ${filePath}: ${count}`);
    }
  }

  process.exit(1);
}

if (total < baseline.maxWarnings) {
  console.log('Baseline improved. Update scripts/no-explicit-any-baseline.json in a follow-up PR.');
}

console.log('Baseline check passed.');
