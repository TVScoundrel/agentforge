import { END, StateGraph } from '@langchain/langgraph';
import { createPatternLogger } from '../shared/deduplication.js';
import { createAggregatorNode, createSupervisorNode, createWorkerNode } from './nodes.js';
import type { WorkerCapabilities } from './schemas.js';
import { MultiAgentState } from './state.js';
import type { MultiAgentStateType } from './state.js';
import type { MultiAgentSystemWithRegistry } from './agent-types.js';
import type { MultiAgentRouter, MultiAgentSystemConfig } from './types.js';
import { wrapCompiledSystem } from './agent-runtime.js';

const logger = createPatternLogger('agentforge:patterns:multi-agent:system');

function createSupervisorRouter(): MultiAgentRouter {
  return (state: MultiAgentStateType) => {
    logger.debug('Supervisor router executing', {
      status: state.status,
      ...(state.currentAgent ? { currentAgent: state.currentAgent } : {}),
      iteration: state.iteration,
    });

    if (state.status === 'completed' || state.status === 'failed') {
      logger.info('Supervisor router: ending workflow', { status: state.status });
      return END;
    }

    if (state.status === 'aggregating') {
      logger.info('Supervisor router: routing to aggregator');
      return 'aggregator';
    }

    if (state.currentAgent && state.currentAgent !== 'supervisor') {
      if (state.currentAgent.includes(',')) {
        const agents = state.currentAgent.split(',').map(agent => agent.trim());
        logger.info('Supervisor router: parallel routing', {
          agents,
          count: agents.length,
        });
        return agents;
      }

      logger.info('Supervisor router: single agent routing', {
        targetAgent: state.currentAgent,
      });
      return state.currentAgent;
    }

    logger.debug('Supervisor router: staying at supervisor');
    return 'supervisor';
  };
}

function createWorkerRouter(): MultiAgentRouter {
  return (state: MultiAgentStateType) => {
    logger.debug('Worker router executing', {
      iteration: state.iteration,
      completedTasks: state.completedTasks.length,
    });
    logger.debug('Worker router: returning to supervisor');
    return 'supervisor';
  };
}

function createAggregatorRouter(): MultiAgentRouter {
  return (state: MultiAgentStateType) => {
    logger.info('Aggregator router: ending workflow', {
      completedTasks: state.completedTasks.length,
      status: state.status,
    });
    return END;
  };
}

export function createCompiledMultiAgentSystem(
  config: MultiAgentSystemConfig,
): MultiAgentSystemWithRegistry {
  const {
    supervisor,
    workers,
    aggregator,
    maxIterations = 10,
    verbose = false,
    checkpointer,
  } = config;

  const workflow = new StateGraph(MultiAgentState);
  const workerIds: string[] = [];
  const workerCapabilities: Record<string, WorkerCapabilities> = {};

  workflow.addNode(
    'supervisor',
    createSupervisorNode({ ...supervisor, maxIterations, verbose }),
  );

  for (const workerConfig of workers) {
    workflow.addNode(
      workerConfig.id,
      createWorkerNode({
        ...workerConfig,
        verbose,
      }),
    );
    workerIds.push(workerConfig.id);
    workerCapabilities[workerConfig.id] = workerConfig.capabilities;
  }

  workflow.addNode(
    'aggregator',
    createAggregatorNode({
      ...aggregator,
      verbose,
    }),
  );

  const supervisorRouter = createSupervisorRouter();
  const workerRouter = createWorkerRouter();
  const aggregatorRouter = createAggregatorRouter();

  // @ts-expect-error - LangGraph StateGraph generic mismatch with string node names
  workflow.setEntryPoint('supervisor');
  // @ts-expect-error - LangGraph StateGraph generic mismatch with string node names
  workflow.addConditionalEdges('supervisor', supervisorRouter, ['aggregator', END, ...workerIds]);

  for (const workerId of workerIds) {
    // @ts-expect-error - LangGraph StateGraph generic mismatch with dynamic node names
    workflow.addConditionalEdges(workerId, workerRouter, ['supervisor']);
  }

  // @ts-expect-error - LangGraph StateGraph generic mismatch with string node names
  workflow.addConditionalEdges('aggregator', aggregatorRouter, [END]);

  const compiled = workflow.compile(
    checkpointer ? { checkpointer } : undefined,
  ) as unknown as MultiAgentSystemWithRegistry;

  return wrapCompiledSystem(compiled, workerCapabilities);
}
