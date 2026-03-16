/**
 * Alert system for production monitoring
 */

import { createLogger, LogLevel } from '../langgraph/observability/logger.js';
import type { JsonObject } from '../langgraph/observability/payload.js';

const logger = createLogger('agentforge:core:monitoring:alerts', { level: LogLevel.INFO });

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert<TData extends JsonObject = JsonObject> {
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp?: number;
  data?: TData;
}

export interface AlertChannel<TConfig extends JsonObject = JsonObject> {
  type: string;
  config: TConfig;
}

export interface AlertRule<TMetrics extends JsonObject = JsonObject> {
  name: string;
  condition: (metrics: TMetrics) => boolean;
  severity: AlertSeverity;
  channels: string[];
  throttle?: number;
  message?: string;
}

export interface AlertManagerOptions<TMetrics extends JsonObject = JsonObject> {
  channels: Record<string, AlertChannel>;
  rules?: AlertRule<TMetrics>[];
  onAlert?: (alert: Alert) => void;
}

type AlertSummary = Pick<Alert, 'name' | 'severity' | 'message'>;

function toAlertSummary(alert: Alert): AlertSummary {
  return {
    name: alert.name,
    severity: alert.severity,
    message: alert.message,
  };
}

function toRuleErrorPayload(ruleName: string, error: unknown): JsonObject {
  return {
    ruleName,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

export class AlertManager<TMetrics extends JsonObject = JsonObject> {
  private lastAlertTime = new Map<string, number>();
  private monitorTimer?: NodeJS.Timeout;
  private running = false;

  constructor(private options: AlertManagerOptions<TMetrics>) {}

  start(metrics?: () => TMetrics, interval = 60000): void {
    if (this.running || !metrics) {
      return;
    }

    this.running = true;

    this.monitorTimer = setInterval(() => {
      const currentMetrics = metrics();
      this.checkRules(currentMetrics);
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

  async alert(alert: Alert): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      timestamp: alert.timestamp || Date.now(),
    };

    // Check throttling
    if (this.isThrottled(alert.name)) {
      return;
    }

    // Update last alert time
    this.lastAlertTime.set(alert.name, Date.now());

    // Notify callback
    this.options.onAlert?.(fullAlert);

    // Log the alert
    logger.warn('Alert triggered', {
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      data: alert.data
    });
  }

  private checkRules(metrics: TMetrics): void {
    if (!this.options.rules) {
      return;
    }

    for (const rule of this.options.rules) {
      try {
        if (rule.condition(metrics)) {
          this.alert({
            name: rule.name,
            severity: rule.severity,
            message: rule.message || `Alert triggered: ${rule.name}`,
            data: { metrics },
          });
        }
      } catch (error) {
        logger.error('Rule check failed', toRuleErrorPayload(rule.name, error));
      }
    }
  }

  private isThrottled(name: string): boolean {
    const rule = this.options.rules?.find((r) => r.name === name);
    if (!rule?.throttle) {
      return false;
    }

    const lastTime = this.lastAlertTime.get(name);
    if (!lastTime) {
      return false;
    }

    return Date.now() - lastTime < rule.throttle;
  }

  async sendToChannel(channelName: string, alert: Alert): Promise<void> {
    const channel = this.options.channels[channelName];
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    // In a real implementation, send to the actual channel
    switch (channel.type) {
      case 'email':
        logger.info('Alert sent to email', {
          channel: channelName,
          to: channel.config.to,
          alert: toAlertSummary(alert)
        });
        break;
      case 'slack':
        logger.info('Alert sent to Slack', {
          channel: channelName,
          webhookUrl: channel.config.webhookUrl,
          alert: toAlertSummary(alert)
        });
        break;
      case 'webhook':
        logger.info('Alert sent to webhook', {
          channel: channelName,
          url: channel.config.url,
          alert: toAlertSummary(alert)
        });
        break;
      default:
        logger.info('Alert sent', {
          channel: channelName,
          channelType: channel.type,
          alert: toAlertSummary(alert)
        });
    }
  }

  getAlertHistory(name?: string, _limit = 100): Alert[] {
    // In a real implementation, return from storage
    void name;
    return [];
  }

  clearAlertHistory(name?: string): void {
    if (name) {
      this.lastAlertTime.delete(name);
    } else {
      this.lastAlertTime.clear();
    }
  }
}

export function createAlertManager<TMetrics extends JsonObject = JsonObject>(
  options: AlertManagerOptions<TMetrics>
): AlertManager<TMetrics> {
  return new AlertManager(options);
}
