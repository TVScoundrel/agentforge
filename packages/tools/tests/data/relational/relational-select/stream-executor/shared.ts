import type { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { SelectQueryInput } from '../../../../../src/data/relational/query/query-builder.js';

export class MockConnectionManager {
  private callIndex = 0;

  constructor(private readonly responses: unknown[]) {}

  async execute(): Promise<unknown> {
    const response = this.responses[this.callIndex] ?? [];
    this.callIndex += 1;
    return response;
  }
}

export const baseInput: SelectQueryInput = {
  table: 'users',
  vendor: 'postgresql',
};

export function asConnectionManager(manager: MockConnectionManager): ConnectionManager {
  return manager as unknown as ConnectionManager;
}
