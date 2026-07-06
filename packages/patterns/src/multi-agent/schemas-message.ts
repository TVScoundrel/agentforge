import { z } from 'zod';
import { JsonObjectSchema } from '../shared/json-schemas.js';

export const AgentRoleSchema = z.enum(['supervisor', 'worker']);

export type AgentRole = z.infer<typeof AgentRoleSchema>;

export const MessageTypeSchema = z.enum([
  'user_input',
  'task_assignment',
  'task_result',
  'handoff',
  'error',
  'completion',
]);

export type MessageType = z.infer<typeof MessageTypeSchema>;

export const AgentMessageSchema = z.object({
  id: z.string().describe('Unique message identifier'),
  type: MessageTypeSchema.describe('Type of message'),
  from: z.string().describe('Agent identifier that sent the message'),
  to: z.union([z.string(), z.array(z.string())]).describe('Target agent(s)'),
  content: z.string().describe('Message content'),
  metadata: JsonObjectSchema.optional().describe('Additional message metadata'),
  timestamp: z.number().describe('Timestamp when message was created'),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;
