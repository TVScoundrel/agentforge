import { createLogger, LogLevel } from '../langgraph/observability/logger.js';
import type { Alert, AlertSummary } from './alerts-types.js';

export const alertLogger = createLogger('agentforge:core:monitoring:alerts', { level: LogLevel.INFO });

export function toAlertSummary(alert: Alert): AlertSummary {
  return {
    name: alert.name,
    severity: alert.severity,
    message: alert.message,
  };
}
