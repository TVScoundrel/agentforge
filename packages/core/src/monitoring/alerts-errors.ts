import type { JsonObject } from '../langgraph/observability/payload.js';

function toErrorDetails(error: unknown): JsonObject {
  return {
    error: error instanceof Error ? error.message : String(error),
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  };
}

export function toRuleErrorPayload(ruleName: string, error: unknown): JsonObject {
  return {
    ruleName,
    ...toErrorDetails(error),
  };
}

export function toAlertDispatchErrorPayload(ruleName: string, error: unknown): JsonObject {
  return {
    stage: 'alert-dispatch',
    ...toRuleErrorPayload(ruleName, error),
  };
}

export function toAlertCallbackErrorPayload(error: unknown): JsonObject {
  return {
    stage: 'alert-callback',
    ...toErrorDetails(error),
  };
}

export function toMetricsProviderErrorPayload(error: unknown): JsonObject {
  return {
    stage: 'metrics-provider',
    ...toErrorDetails(error),
  };
}
