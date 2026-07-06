import { z } from 'zod';

export const RoutingStrategySchema = z.enum([
  'llm-based',
  'rule-based',
  'round-robin',
  'skill-based',
  'load-balanced',
]);

export type RoutingStrategy = z.infer<typeof RoutingStrategySchema>;

export const RoutingDecisionSchema = z.object({
  targetAgent: z.string().nullable().default(null).describe('Agent to route the task to (single routing)'),
  targetAgents: z.array(z.string()).nullable().default(null).describe('Agents to route the task to (parallel routing)'),
  reasoning: z.string().default('').describe('Explanation for routing decision'),
  confidence: z.number().min(0).max(1).default(0.8).describe('Confidence score'),
  strategy: RoutingStrategySchema.default('llm-based').describe('Strategy used for this decision'),
  timestamp: z.number().default(() => Date.now()).describe('Timestamp of the decision'),
}).refine(
  (data) => data.targetAgent || (data.targetAgents && data.targetAgents.length > 0),
  { message: 'Either targetAgent or targetAgents must be provided' }
);

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;
