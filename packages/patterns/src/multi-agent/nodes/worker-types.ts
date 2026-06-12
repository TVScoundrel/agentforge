import type { MultiAgentStateType } from '../state.js';

export interface InvokableWorkerModel {
  invoke(messages: unknown): Promise<{ content: unknown }>;
}

export type TaskResultAndMessage = Pick<
  MultiAgentStateType,
  'completedTasks' | 'messages'
>;
