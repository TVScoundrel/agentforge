import type {
  MultiAgentNode,
  MultiAgentRoute,
  MultiAgentRouter,
  RoutingStrategyImpl,
} from '../../../src/multi-agent/index.js';

const node: MultiAgentNode = 'worker';
const route: MultiAgentRoute = ['worker'];
const router: MultiAgentRouter = () => route;

export type RoutingContract = {
  node: typeof node;
  route: typeof route;
  router: MultiAgentRouter;
  strategy: RoutingStrategyImpl;
};
