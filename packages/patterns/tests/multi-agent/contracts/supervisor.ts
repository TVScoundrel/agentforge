import type { SupervisorConfig } from '../../../src/multi-agent/index.js';

const supervisorConfig: SupervisorConfig = { strategy: 'round-robin' };
const supervisorStrategy: SupervisorConfig['strategy'] = supervisorConfig.strategy;

export type SupervisorContract = {
  config: SupervisorConfig;
  strategy: typeof supervisorStrategy;
};
