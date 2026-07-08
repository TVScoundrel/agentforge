import type { JsonObject } from '../langgraph/observability/payload.js';
import { toAlertDispatchErrorPayload, toRuleErrorPayload } from './alerts-errors.js';
import { alertLogger } from './alerts-shared.js';
import type { Alert, AlertCallbackData, AlertChannelMap, AlertManagerOptions, AlertRule } from './alerts-types.js';

export function checkAlertRules<
  TMetrics extends JsonObject,
  TChannels extends AlertChannelMap
>(
  rules: AlertManagerOptions<TMetrics, TChannels>['rules'] | undefined,
  metrics: TMetrics,
  alert: (alert: Alert<AlertCallbackData<TMetrics>>) => Promise<void>
): void {
  if (!rules) {
    return;
  }

  for (const rule of rules) {
    try {
      if (!rule.condition(metrics)) {
        continue;
      }

      void alert({
        name: rule.name,
        severity: rule.severity,
        message: rule.message || `Alert triggered: ${rule.name}`,
        data: { metrics },
      }).catch((error) => {
        alertLogger.error('Alert dispatch failed', toAlertDispatchErrorPayload(rule.name, error));
      });
    } catch (error) {
      alertLogger.error('Rule check failed', toRuleErrorPayload(rule.name, error));
    }
  }
}

export function isAlertThrottled<TMetrics extends JsonObject>(
  rules: AlertRule<TMetrics, string>[] | undefined,
  name: string,
  lastAlertTime: ReadonlyMap<string, number>,
  now: number
): boolean {
  const rule = rules?.find((candidate) => candidate.name === name);
  if (!rule?.throttle) {
    return false;
  }

  const lastTime = lastAlertTime.get(name);
  if (!lastTime) {
    return false;
  }

  return now - lastTime < rule.throttle;
}
