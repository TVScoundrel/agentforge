import type { ManagedToolStats } from './lifecycle-types.js';

export interface ManagedToolState<TContext = undefined> {
  initialized: boolean;
  context: TContext | undefined;
  stats: ManagedToolStats;
  healthCheckTimer?: NodeJS.Timeout;
  beforeExitHandler?: () => void;
  healthCheckInFlight: boolean;
  cleaningUp: boolean;
  cleanupPromise?: Promise<void>;
  initializePromise?: Promise<void>;
  lifecycleGeneration: number;
}
