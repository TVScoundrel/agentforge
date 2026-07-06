import { z } from 'zod';

export const MultiAgentStatusSchema = z.enum([
  'initializing',
  'routing',
  'executing',
  'coordinating',
  'aggregating',
  'completed',
  'failed',
]);

export type MultiAgentStatus = z.infer<typeof MultiAgentStatusSchema>;

export const HandoffRequestSchema = z.object({
  from: z.string().describe('Agent requesting handoff'),
  to: z.string().describe('Target agent for handoff'),
  reason: z.string().describe('Reason for requesting handoff'),
  context: z.unknown().describe('Context to pass to next agent'),
  timestamp: z.string().datetime().describe('ISO timestamp of handoff request'),
});

export type HandoffRequest = z.infer<typeof HandoffRequestSchema>;
