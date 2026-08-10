import type {
  AggregatorConfig,
  MultiAgentSystemConfig,
} from '../../../src/multi-agent/index.js';

const aggregatorConfig: AggregatorConfig = {};
const systemConfig: MultiAgentSystemConfig = {
  supervisor: { strategy: 'round-robin' },
  workers: [],
};

export type AggregatorSystemContract = {
  aggregator: typeof aggregatorConfig;
  system: typeof systemConfig;
};
