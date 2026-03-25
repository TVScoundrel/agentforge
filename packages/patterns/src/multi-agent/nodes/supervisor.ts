import type { MultiAgentStateType } from '../state.js';
import type { SupervisorConfig } from '../types.js';
import type { TaskAssignment } from '../schemas.js';
import { getRoutingStrategy } from '../routing.js';
import { handleNodeError } from '../../shared/error-handling.js';
import {
  createAssignmentMessages,
  createTaskAssignments,
  getLatestTaskContent,
  logger,
} from './shared.js';

function allAssignmentsCompleted(state: MultiAgentStateType): boolean {
  return state.activeAssignments.every((assignment) =>
    state.completedTasks.some((task) => task.assignmentId === assignment.id)
  );
}

function incrementAssignedWorkerLoads(
  state: MultiAgentStateType,
  assignments: TaskAssignment[]
): MultiAgentStateType['workers'] {
  const updatedWorkers = { ...state.workers };

  for (const assignment of assignments) {
    const worker = updatedWorkers[assignment.workerId];
    if (!worker) {
      logger.error('Worker not found in state', {
        workerId: assignment.workerId,
        availableWorkers: Object.keys(updatedWorkers),
      });
      throw new Error(
        `Worker ${assignment.workerId} not found in state.workers. ` +
          `Available workers: ${Object.keys(updatedWorkers).join(', ')}`
      );
    }

    updatedWorkers[assignment.workerId] = {
      ...worker,
      currentWorkload: worker.currentWorkload + 1,
    };
  }

  return updatedWorkers;
}

/**
 * Creates the supervisor node for the multi-agent workflow.
 *
 * The supervisor owns orchestration concerns: it enforces `maxIterations`,
 * chooses the next worker or workers through the configured routing strategy,
 * increments framework-managed `currentWorkload` counters for each new
 * assignment, and routes to the aggregator once all active assignments have
 * completed. Routing strategies may return a single `targetAgent` or multiple
 * `targetAgents` for parallel fan-out.
 */
export function createSupervisorNode(config: SupervisorConfig) {
  const { strategy, maxIterations = 10 } = config;

  return async (
    state: MultiAgentStateType
  ): Promise<Partial<MultiAgentStateType>> => {
    try {
      logger.info('Supervisor node executing', {
        iteration: state.iteration,
        maxIterations,
        activeAssignments: state.activeAssignments.length,
        completedTasks: state.completedTasks.length,
      });

      logger.debug(`Routing iteration ${state.iteration}/${maxIterations}`);

      if (state.iteration >= maxIterations) {
        logger.warn('Max iterations reached', {
          iteration: state.iteration,
          maxIterations,
        });

        logger.debug('Max iterations reached, moving to aggregation');
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      const allCompleted = allAssignmentsCompleted(state);

      logger.debug('Checking task completion', {
        activeAssignments: state.activeAssignments.length,
        completedTasks: state.completedTasks.length,
        allCompleted,
      });

      if (allCompleted && state.activeAssignments.length > 0) {
        logger.info('All tasks completed, moving to aggregation', {
          completedCount: state.completedTasks.length,
        });

        logger.debug('All tasks completed, moving to aggregation');
        return {
          status: 'aggregating',
          currentAgent: 'aggregator',
        };
      }

      logger.debug('Getting routing strategy', { strategy });
      const routingImpl = getRoutingStrategy(strategy);
      const decision = await routingImpl.route(state, config);

      const targetAgents =
        decision.targetAgents && decision.targetAgents.length > 0
          ? decision.targetAgents
          : decision.targetAgent
            ? [decision.targetAgent]
            : [];

      logger.debug('Target agents determined', {
        targetAgents,
        isParallel: targetAgents.length > 1,
        decision: {
          reasoning: decision.reasoning,
          confidence: decision.confidence,
        },
      });

      if (targetAgents.length === 0) {
        logger.error('No target agents specified in routing decision');
        throw new Error('Routing decision must specify at least one target agent');
      }

      if (targetAgents.length === 1) {
        logger.info('Routing to single agent', {
          targetAgent: targetAgents[0],
          reasoning: decision.reasoning,
          confidence: decision.confidence,
        });
        logger.debug(`Routing to ${targetAgents[0]}: ${decision.reasoning}`);
      } else {
        logger.info('Routing to multiple agents in parallel', {
          targetAgents,
          count: targetAgents.length,
          reasoning: decision.reasoning,
          confidence: decision.confidence,
        });
        logger.debug(
          `Routing to ${targetAgents.length} agents in parallel [${targetAgents.join(', ')}]: ${decision.reasoning}`
        );
      }

      const task = getLatestTaskContent(state);
      const assignments = createTaskAssignments(targetAgents, task);

      logger.debug('Created task assignments', {
        assignmentCount: assignments.length,
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          workerId: assignment.workerId,
          taskLength: assignment.task.length,
        })),
      });

      const messages = createAssignmentMessages(assignments);
      const updatedWorkers = incrementAssignedWorkerLoads(state, assignments);

      logger.info('Supervisor routing complete', {
        currentAgent: targetAgents.join(','),
        status: 'executing',
        assignmentCount: assignments.length,
        nextIteration: state.iteration + 1,
        workloadUpdates: Object.entries(updatedWorkers)
          .filter(([id]) => targetAgents.includes(id))
          .map(([id, caps]) => ({ workerId: id, newWorkload: caps.currentWorkload })),
      });

      return {
        currentAgent: targetAgents.join(','),
        status: 'executing',
        routingHistory: [decision],
        activeAssignments: assignments,
        messages,
        workers: updatedWorkers,
        iteration: 1,
      };
    } catch (error) {
      const errorMessage = handleNodeError(error, 'supervisor', false);
      logger.error('Supervisor node error', {
        error: errorMessage,
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        iteration: state.iteration,
      });
      return {
        status: 'failed',
        error: errorMessage,
      };
    }
  };
}
