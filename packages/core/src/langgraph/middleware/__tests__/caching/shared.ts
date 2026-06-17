import { createSharedCache, withCache } from '../../caching.js';
import type { NodeFunction } from '../../types.js';

export interface TestState {
  input: string;
  output?: string;
  count?: number;
}

export { createSharedCache, withCache };
export type { NodeFunction };
