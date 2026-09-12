import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

const runtimeExports = [
  'createRelationalToolSet',
  'RelationalToolSetConfigurationError',
  'RelationalToolSetDisposedError',
  'RelationalTransactionError',
  'relationalQuery',
  'relationalSelect',
  'relationalInsert',
  'relationalUpdate',
  'relationalDelete',
  'relationalGetSchema',
];

const declarationExports = [
  ...runtimeExports,
  'RelationalToolSet',
  'RelationalToolSetGetSchemaInput',
  'RelationalToolSetOptions',
  'RelationalTransactionErrorCode',
  'RelationalTransactionToolSet',
  'TransactionOptions',
];

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const packCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const packResult = JSON.parse(
  execFileSync(packCommand, ['pack', '--dry-run', '--json'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  })
);
const packedFiles = new Set(packResult.files.map(({ path }) => path));

for (const target of Object.values(packageJson.exports['.'])) {
  const packedPath = target.replace(/^\.\//, '');
  assert.ok(packedFiles.has(packedPath), `Package export target is not published: ${target}`);
}

const esm = await import('../dist/index.js');
const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');

for (const name of runtimeExports) {
  assert.ok(name in esm, `ESM package surface is missing ${name}`);
  assert.ok(name in cjs, `CJS package surface is missing ${name}`);
}

const declarations = await readFile(new URL('../dist/index.d.ts', import.meta.url), 'utf8');
for (const name of declarationExports) {
  assert.match(
    declarations,
    new RegExp(`export \\{[^}]*\\b${name}\\b[^}]*\\};`, 's'),
    `Declaration surface is missing ${name}`
  );
}

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const relativeLinks = [
  ...readme.matchAll(/\[(?:[^\]]|\[[^\]]*\]\([^)]*\))*\]\((?!https?:|mailto:|#)([^)]+)\)/g),
];
for (const [, target] of relativeLinks) {
  const packedPath = target.split(/[?#]/, 1)[0].replace(/^\.\//, '');
  assert.ok(packedFiles.has(packedPath), `README link target is not published: ${target}`);
}
