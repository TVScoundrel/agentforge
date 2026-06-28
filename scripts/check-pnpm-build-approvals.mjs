import { readFileSync } from 'node:fs';

import {
  formatValidationError,
  validateAllowBuilds,
} from './lib/pnpm-build-approvals.mjs';

const workspaceText = readFileSync(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8');
const result = validateAllowBuilds(workspaceText);

if (!result.ok) {
  console.error(formatValidationError(result));
  process.exit(1);
}

console.log('pnpm build approvals are committed in pnpm-workspace.yaml.');
