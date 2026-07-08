import type { JsonObject } from '../langgraph/observability/payload.js';
import { sendAlertToChannel } from './alerts-channels.js';
import { toAlertCallbackErrorPayload, toMetricsProviderErrorPayload } from './alerts-errors.js';
import { checkAlertRules, isAlertThrottled } from './alerts-rules.js';
import { alertLogger } from './alerts-shared.js';
import type { Alert, AlertCallbackData, AlertChannelMap, AlertManagerOptions, GenericAlertChannel } from './alerts-types.js';

export class AlertManager<
  TMetrics extends JsonObject = JsonObject,
  TChannels extends AlertChannelMap = Record<string, GenericAlertChannel>
> {
  private lastAlertTime = new Map<string, number>();
  private monitorTimer?: NodeJS.Timeout;
  private running = false;

  constructor(private options: AlertManagerOptions<TMetrics, TChannels>) {}

  start(metrics?: () => TMetrics, interval = 60000): void {
    if (this.running || !metrics) {
      return;
    }

    this.running = true;

    this.monitorTimer = setInterval(() => {
      try {
        checkAlertRules(this.options.rules, metrics(), (alert) => this.alert(alert));
      } catch (error) {
        alertLogger.error('Metrics collection failed', toMetricsProviderErrorPayload(error));
      }
    }, interval);
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }
  }

  async alert(alert: Alert<AlertCallbackData<TMetrics>>): Promise<void> {
    const now = Date.now();
    const fullAlert: Alert<AlertCallbackData<TMetrics>> = {
      ...alert,
      timestamp: alert.timestamp ?? now,
    };

    if (isAlertThrottled(this.options.rules, alert.name, this.lastAlertTime, now)) {
      return;
    }

    this.lastAlertTime.set(alert.name, now);

    try {
      await this.options.onAlert?.(fullAlert);
    } catch (error) {
      alertLogger.error('Alert callback failed', toAlertCallbackErrorPayload(error));
    }

    alertLogger.warn('Alert triggered', {
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      ...(alert.data ? { data: alert.data } : {}),
    });
  }

  async sendToChannel(channelName: keyof TChannels & string, alert: Alert<AlertCallbackData<TMetrics>>): Promise<void> {
    await sendAlertToChannel(this.options.channels, channelName, alert);
  }

  getAlertHistory(_name?: string, _limit = 100): Alert<AlertCallbackData<TMetrics>>[] {
    return [];
  }

  clearAlertHistory(name?: string): void {
    if (name) {
      this.lastAlertTime.delete(name);
      return;
    }

    this.lastAlertTime.clear();
  }
}

export function createAlertManager<
  TMetrics extends JsonObject = JsonObject,
  TChannels extends AlertChannelMap = Record<string, GenericAlertChannel>
>(
  options: AlertManagerOptions<TMetrics, TChannels>
): AlertManager<TMetrics, TChannels> {
  return new AlertManager(options);
}
