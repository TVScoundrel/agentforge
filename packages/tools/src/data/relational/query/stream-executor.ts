/**
 * Streaming SELECT executor facade.
 * @module query/stream-executor
 */

export { DEFAULT_CHUNK_SIZE } from './stream-executor-types.js';
export {
  createSelectReadableStream,
  streamSelectChunks,
} from './stream-executor-chunks.js';
export { executeStreamingSelect } from './stream-executor-execution.js';
export { benchmarkStreamingSelectMemory } from './stream-executor-benchmark.js';
export type {
  StreamingBenchmarkResult,
  StreamingMemoryUsage,
  StreamingSelectChunk,
  StreamingSelectOptions,
  StreamingSelectResult,
} from './stream-executor-types.js';
