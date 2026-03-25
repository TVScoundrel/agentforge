import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { toLangChainTools, type Tool } from '@agentforge/core';
import { createPatternLogger } from '../../shared/deduplication.js';
import type { MultiAgentStateType } from '../state.js';
import type { AgentMessage, TaskAssignment } from '../schemas.js';
import type { WorkerConfig } from '../types.js';

export const logger = createPatternLogger('agentforge:patterns:multi-agent:nodes');

export function createGeneratedId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createTaskAssignmentId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getLatestTaskContent(state: MultiAgentStateType): string {
  return state.messages[state.messages.length - 1]?.content || state.input;
}

export function createTaskAssignments(workerIds: string[], task: string): TaskAssignment[] {
  return workerIds.map((workerId) => ({
    id: createTaskAssignmentId(),
    workerId,
    task,
    priority: 5,
    assignedAt: Date.now(),
  }));
}

export function createAssignmentMessages(assignments: TaskAssignment[]): AgentMessage[] {
  return assignments.map((assignment) => ({
    id: createGeneratedId('msg'),
    from: 'supervisor',
    to: [assignment.workerId],
    type: 'task_assignment',
    content: assignment.task,
    timestamp: Date.now(),
    metadata: {
      assignmentId: assignment.id,
      priority: assignment.priority,
    },
  }));
}

export function findCurrentAssignment(
  state: MultiAgentStateType,
  workerId: string
): TaskAssignment | undefined {
  return state.activeAssignments.find(
    (assignment) =>
      assignment.workerId === workerId &&
      !state.completedTasks.some((task) => task.assignmentId === assignment.id)
  );
}

export function convertWorkerToolsForLangChain(tools: WorkerConfig['tools']) {
  const safeTools = tools ?? [];
  return toLangChainTools(safeTools);
}

export function serializeModelContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  try {
    const serialized = JSON.stringify(content);
    if (typeof serialized !== 'string') {
      const error = new Error(
        'Failed to serialize model content: JSON.stringify returned undefined'
      );
      logger.error('Model content serialization failed', {
        errorMessage: error.message,
        contentType: content === null ? 'null' : typeof content,
      });
      throw error;
    }

    return serialized;
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error('Unknown error during model content serialization');
    logger.error('Model content serialization threw an error', {
      errorMessage: normalizedError.message,
      contentType: content === null ? 'null' : typeof content,
    });
    throw normalizedError;
  }
}

export function createPromptMessages(systemPrompt: string, task: string) {
  return [new SystemMessage(systemPrompt), new HumanMessage(task)];
}

export const createWorkerMessages = createPromptMessages;

export type WorkerTool = Tool<never, unknown>;
