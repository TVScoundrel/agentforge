/**
 * Routing Strategy Implementations for Multi-Agent Pattern
 *
 * This module is the thin public facade for multi-agent routing strategies.
 * Concrete strategy logic lives in focused internal modules so behavior can be
 * reviewed and extended without one oversized implementation file.
 *
 * @module patterns/multi-agent/routing
 */

import type { RoutingStrategyImpl } from './types.js';
import {
  DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
  llmBasedRouting,
  logger,
} from './routing-internal/llm-routing.js';
import { loadBalancedRouting } from './routing-internal/load-balanced-routing.js';
import { roundRobinRouting } from './routing-internal/round-robin-routing.js';
import { ruleBasedRouting } from './routing-internal/rule-based-routing.js';
import { skillBasedRouting } from './routing-internal/skill-based-routing.js';

const routingStrategies: Record<string, RoutingStrategyImpl> = {
  'llm-based': llmBasedRouting,
  'round-robin': roundRobinRouting,
  'skill-based': skillBasedRouting,
  'load-balanced': loadBalancedRouting,
  'rule-based': ruleBasedRouting,
};

export {
  DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
  llmBasedRouting,
  loadBalancedRouting,
  logger,
  roundRobinRouting,
  ruleBasedRouting,
  skillBasedRouting,
};

/**
 * Get routing strategy implementation by name.
 */
export function getRoutingStrategy(name: string): RoutingStrategyImpl {
  if (!Object.hasOwn(routingStrategies, name)) {
    throw new Error(`Unknown routing strategy: ${name}`);
  }

  return routingStrategies[name]!;
}
