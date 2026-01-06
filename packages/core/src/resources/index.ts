/**
 * Resource management and optimization utilities
 */

// Connection pooling
export {
  ConnectionPool,
  createConnectionPool,
  type PoolConfig,
  type HealthCheckConfig,
  type ConnectionPoolOptions,
  type PoolStats,
} from './pool.js';

export {
  DatabasePool,
  createDatabasePool,
  type DatabaseConfig,
  type DatabaseConnection,
  type DatabasePoolOptions,
} from './database-pool.js';

export {
  HttpPool,
  createHttpPool,
  type HttpConfig,
  type HttpPoolConfig,
  type HttpClient,
  type HttpPoolOptions,
  type RequestConfig,
  type HttpResponse,
} from './http-pool.js';

// Memory management
export {
  MemoryManager,
  createMemoryManager,
  type MemoryStats,
  type MemoryManagerOptions,
} from './memory.js';

// Batch processing
export {
  BatchProcessor,
  createBatchProcessor,
  type BatchProcessorOptions,
  type BatchStats,
} from './batch.js';

// Circuit breaker
export {
  CircuitBreaker,
  createCircuitBreaker,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './circuit-breaker.js';

