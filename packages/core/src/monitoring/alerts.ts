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

type BuiltInAlertChannelType = 'email' | 'slack' | 'webhook';

type EmailAlertChannelConfig = JsonObject & {
  to: string | string[];
};

type SlackAlertChannelConfig = JsonObject & {
  webhookUrl: string;
};

type WebhookAlertChannelConfig = JsonObject & {
  url: string;
};

export interface EmailAlertChannel {
  type: 'email';
  config: EmailAlertChannelConfig;
}

export interface SlackAlertChannel {
  type: 'slack';
  config: SlackAlertChannelConfig;
}

export interface WebhookAlertChannel {
  type: 'webhook';
  config: WebhookAlertChannelConfig;
}

export interface GenericAlertChannel<TType extends string = string, TConfig extends JsonObject = JsonObject> {
  type: TType;
  config: TConfig;
}

export type CustomAlertChannel<TType extends string = string, TConfig extends JsonObject = JsonObject> =
  GenericAlertChannel<Exclude<TType, BuiltInAlertChannelType>, TConfig>;

export type AlertChannel<TType extends string = string, TConfig extends JsonObject = JsonObject> =
  TType extends 'email'
    ? EmailAlertChannel
    : TType extends 'slack'
      ? SlackAlertChannel
      : TType extends 'webhook'
        ? WebhookAlertChannel
        : GenericAlertChannel<TType, TConfig>;

type AlertChannelMap = Record<string, GenericAlertChannel>;

type ValidatedAlertChannels<TChannels extends AlertChannelMap> = {
  [TName in keyof TChannels]: TChannels[TName] extends GenericAlertChannel<infer TType, infer TConfig>
    ? AlertChannel<TType, TConfig>
    : never;
};

export interface AlertRule<TMetrics extends JsonObject = JsonObject> {
  name: string;
  condition: (metrics: TMetrics) => boolean;
  severity: AlertSeverity;
  channels: string[];
  throttle?: number;
  message?: string;
}

type AlertCallbackData<TMetrics extends JsonObject> = JsonObject & {
  metrics?: TMetrics;
};

export interface AlertManagerOptions<
  TMetrics extends JsonObject = JsonObject,
  TChannels extends AlertChannelMap = Record<string, GenericAlertChannel>
> {
  channels: ValidatedAlertChannels<TChannels>;
  rules?: AlertRule<TMetrics>[];
  onAlert?: (alert: Alert<AlertCallbackData<TMetrics>>) => void | Promise<void>;
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
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  };
}

function toAlertDispatchErrorPayload(ruleName: string, error: unknown): JsonObject {
  return {
    stage: 'alert-dispatch',
    ...toRuleErrorPayload(ruleName, error),
  };
}

function toMetricsProviderErrorPayload(error: unknown): JsonObject {
  return {
    stage: 'metrics-provider',
    error: error instanceof Error ? error.message : String(error),
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  };
}

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
        const currentMetrics = metrics();
        this.checkRules(currentMetrics);
      } catch (error) {
        logger.error('Metrics collection failed', toMetricsProviderErrorPayload(error));
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
    const fullAlert: Alert<AlertCallbackData<TMetrics>> = {
      ...alert,
      timestamp: alert.timestamp ?? Date.now(),
    };

    if (this.isThrottled(alert.name)) {
      return;
    }

    this.lastAlertTime.set(alert.name, Date.now());

    await this.options.onAlert?.(fullAlert);

    logger.warn('Alert triggered', {
      name: alert.name,
      severity: alert.severity,
      message: alert.message,
      ...(alert.data ? { data: alert.data } : {}),
    });
  }

  private checkRules(metrics: TMetrics): void {
    if (!this.options.rules) {
      return;
    }

    for (const rule of this.options.rules) {
      try {
        if (rule.condition(metrics)) {
          void this.alert({
            name: rule.name,
            severity: rule.severity,
            message: rule.message || `Alert triggered: ${rule.name}`,
            data: { metrics },
          }).catch((error) => {
            logger.error('Alert dispatch failed', toAlertDispatchErrorPayload(rule.name, error));
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

  async sendToChannel(channelName: keyof TChannels & string, alert: Alert<AlertCallbackData<TMetrics>>): Promise<void> {
    const channel = this.options.channels[channelName];
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    switch (channel.type) {
      case 'email':
        logger.info('Alert sent to email', {
          channel: channelName,
          to: channel.config.to,
          alert: toAlertSummary(alert),
        });
        break;
      case 'slack':
        logger.info('Alert sent to Slack', {
          channel: channelName,
          webhookUrl: channel.config.webhookUrl,
          alert: toAlertSummary(alert),
        });
        break;
      case 'webhook':
        logger.info('Alert sent to webhook', {
          channel: channelName,
          url: channel.config.url,
          alert: toAlertSummary(alert),
        });
        break;
      default:
        logger.info('Alert sent', {
          channel: channelName,
          channelType: channel.type,
          alert: toAlertSummary(alert),
        });
    }
  }

  getAlertHistory(_name?: string, _limit = 100): Alert<AlertCallbackData<TMetrics>>[] {
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

export function createAlertManager<
  TMetrics extends JsonObject = JsonObject,
  TChannels extends AlertChannelMap = Record<string, GenericAlertChannel>
>(
  options: AlertManagerOptions<TMetrics, TChannels>
): AlertManager<TMetrics, TChannels> {
  return new AlertManager(options);
}
