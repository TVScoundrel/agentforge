import { z } from 'zod';
import { JsonObjectSchema } from '../shared/json-schemas.js';

export const WorkerCapabilitiesSchema = z.object({
  skills: z.array(z.string()).describe('List of agent skills'),
  tools: z.array(z.string()).describe('List of tool names available to agent'),
  available: z.boolean().default(true).describe('Whether agent is available'),
  currentWorkload: z.number().int().nonnegative().default(0).describe('Current number of active tasks'),
});

export type WorkerCapabilities = z.infer<typeof WorkerCapabilitiesSchema>;

export const TaskAssignmentSchema = z.object({
  id: z.string().describe('Unique assignment identifier'),
  workerId: z.string().describe('Worker identifier assigned to task'),
  task: z.string().describe('Description of the task'),
  priority: z.number().int().min(1).max(10).default(5).describe('Task priority'),
  assignedAt: z.number().describe('Timestamp when task was assigned'),
  deadline: z.number().optional().describe('Optional task deadline timestamp'),
});

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;

export const TaskResultSchema = z.object({
  assignmentId: z.string().describe('Assignment identifier'),
  workerId: z.string().describe('Worker that completed the task'),
  success: z.boolean().describe('Whether the task succeeded'),
  result: z.string().describe('Task result or output'),
  error: z.string().optional().describe('Error message if task failed'),
  completedAt: z.number().describe('Timestamp when task was completed'),
  metadata: JsonObjectSchema.optional().describe('Execution metadata'),
});

export type TaskResult = z.infer<typeof TaskResultSchema>;
