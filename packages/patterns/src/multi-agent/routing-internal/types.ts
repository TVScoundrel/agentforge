import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { SupervisorConfig } from '../types.js';
import { RoutingDecisionSchema } from '../schemas.js';

export type RoutingModelLike = NonNullable<SupervisorConfig['model']>;

export type RoutingDecisionInvoker = {
  invoke: (input: BaseLanguageModelInput) => Promise<unknown>;
};

export type StructuredOutputCapableRoutingModel = RoutingDecisionInvoker & {
  withStructuredOutput?: (schema: typeof RoutingDecisionSchema) => RoutingDecisionInvoker;
};
