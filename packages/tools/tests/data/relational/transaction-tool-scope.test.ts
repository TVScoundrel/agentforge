import { describe, expect, it } from 'vitest';

import { TransactionToolScope } from '../../../src/data/relational/tool-set.js';
import type { RelationalReadExecution } from '../../../src/data/relational/tools/read-execution.js';

describe('TransactionToolScope', () => {
  it('closes admission before draining work that was already accepted', async () => {
    let releaseWork!: () => void;
    const workGate = new Promise<void>((resolve) => {
      releaseWork = resolve;
    });
    const scope = new TransactionToolScope({} as RelationalReadExecution);
    const accepted = scope.run(async () => {
      await workGate;
      return 'accepted';
    }, String);

    const settling = scope.settle();
    const late = scope.run(async () => 'late', String);
    releaseWork();

    await expect(accepted).resolves.toBe('accepted');
    await expect(late).rejects.toMatchObject({ code: 'SCOPE_EXPIRED' });
    await expect(settling).resolves.toBeUndefined();
  });
});
