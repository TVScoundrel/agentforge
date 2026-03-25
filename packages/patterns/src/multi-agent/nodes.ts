/**
 * Node Implementations for Multi-Agent Coordination Pattern
 *
 * This module keeps the public multi-agent node entrypoint stable while the
 * responsibility-specific implementations live in smaller modules.
 *
 * @module patterns/multi-agent/nodes
 */

export {
  DEFAULT_AGGREGATOR_SYSTEM_PROMPT,
  createAggregatorNode,
} from './nodes/aggregator.js';
export { createSupervisorNode } from './nodes/supervisor.js';
export { createWorkerNode } from './nodes/worker.js';
