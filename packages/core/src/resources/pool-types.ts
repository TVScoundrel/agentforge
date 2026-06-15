export interface PoolConfig {
  min?: number;
  max?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  evictionInterval?: number;
}

export interface HealthCheckConfig {
  enabled?: boolean;
  interval?: number;
  timeout?: number;
  retries?: number;
}

export interface ConnectionPoolOptions<T> {
  factory: () => Promise<T>;
  destroyer?: (connection: T) => Promise<void>;
  validator?: (connection: T) => Promise<boolean>;
  pool?: PoolConfig;
  healthCheck?: HealthCheckConfig;
  onAcquire?: (connection: T) => void;
  onRelease?: (connection: T) => void;
  onDestroy?: (connection: T) => void;
  onHealthCheckFail?: (error: Error) => void;
}

export interface PoolStats {
  size: number;
  available: number;
  pending: number;
  acquired: number;
  created: number;
  destroyed: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
}

export interface PooledConnection<T> {
  connection: T;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
}

export interface PendingAcquisition<T> {
  resolve: (connection: T) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export interface ConnectionPoolRuntime<T> {
  connections: PooledConnection<T>[];
  pending: PendingAcquisition<T>[];
  stats: PoolStats;
  options: ConnectionPoolOptions<T>;
  draining: boolean;
  creating: number;
  evictionTimer?: NodeJS.Timeout;
  healthCheckTimer?: NodeJS.Timeout;
}
