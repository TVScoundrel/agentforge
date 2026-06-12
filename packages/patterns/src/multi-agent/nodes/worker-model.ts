import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { WorkerConfig } from '../types.js';
import type { AgentMessage, TaskAssignment, TaskResult } from '../schemas.js';
import {
  convertWorkerToolsForLangChain,
  createGeneratedId,
  createPromptMessages,
  logger,
  serializeModelContent,
} from './shared.js';
import type { InvokableWorkerModel, TaskResultAndMessage } from './worker-types.js';

function buildDefaultSystemPrompt(config: WorkerConfig): string {
  return `You are a specialized worker agent with the following capabilities:
Skills: ${config.capabilities.skills.join(', ')}
Tools: ${config.capabilities.tools.join(', ')}

Execute the assigned task using your skills and tools. Provide a clear, actionable result.`;
}

export async function invokeWorkerModel(
  model: BaseChatModel,
  config: WorkerConfig,
  assignment: TaskAssignment
): Promise<TaskResultAndMessage> {
  const messages = createPromptMessages(
    config.systemPrompt || buildDefaultSystemPrompt(config),
    assignment.task
  );

  let modelToUse: InvokableWorkerModel = model;
  if (config.tools && config.tools.length > 0 && model.bindTools) {
    logger.debug('Binding tools to model', {
      workerId: config.id,
      toolCount: config.tools.length,
      toolNames: config.tools.map((tool) => tool.metadata.name),
    });
    modelToUse = model.bindTools(
      convertWorkerToolsForLangChain(config.tools)
    ) as unknown as InvokableWorkerModel;
  }

  logger.debug('Invoking LLM', { workerId: config.id });
  const response = await modelToUse.invoke(messages);
  const result = serializeModelContent(response.content);

  logger.info('Worker task completed', {
    workerId: config.id,
    assignmentId: assignment.id,
    resultLength: result.length,
  });
  logger.debug('Worker result details', {
    workerId: config.id,
    assignmentId: assignment.id,
    resultLength: result.length,
  });

  const taskResult: TaskResult = {
    assignmentId: assignment.id,
    workerId: config.id,
    success: true,
    result,
    completedAt: Date.now(),
    metadata: {
      skills_used: config.capabilities.skills,
    },
  };

  const message: AgentMessage = {
    id: createGeneratedId('msg'),
    from: config.id,
    to: ['supervisor'],
    type: 'task_result',
    content: result,
    timestamp: Date.now(),
    metadata: {
      assignmentId: assignment.id,
      success: true,
    },
  };

  return {
    completedTasks: [taskResult],
    messages: [message],
  };
}
