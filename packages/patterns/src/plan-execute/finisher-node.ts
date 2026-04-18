import type { PlanExecuteStateType } from './state.js';
import { serializePlanExecuteResult } from './serialization.js';

export function createFinisherNode() {
  return async (state: PlanExecuteStateType): Promise<Partial<PlanExecuteStateType>> => {
    const results = state.pastSteps?.map((ps) => ({
      step: ps.step.description,
      result: serializePlanExecuteResult(ps.result),
      success: ps.success,
    })) || [];

    const response = JSON.stringify({
      goal: state.plan?.goal || state.input,
      results,
      totalSteps: state.pastSteps?.length || 0,
      successfulSteps: state.pastSteps?.filter((ps) => ps.success).length || 0,
    }, null, 2);

    return {
      status: 'completed',
      response,
    };
  };
}
