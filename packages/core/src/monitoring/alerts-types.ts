import type { JsonObject } from '../langgraph/observability/payload.js';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Alert<TData extends JsonObject = JsonObject> {
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp?: number;
  data?: TData;
}

export type BuiltInAlertChannelType = 'email' | 'slack' | 'webhook';

export type EmailAlertChannelConfig = JsonObject & {
  to: string | string[];
};

export type SlackAlertChannelConfig = JsonObject & {
  webhookUrl: string;
};

export type WebhookAlertChannelConfig = JsonObject & {
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

export type AlertChannelMap = Record<string, GenericAlertChannel>;

export type ValidatedAlertChannels<TChannels extends AlertChannelMap> = {
  [TName in keyof TChannels]: TChannels[TName] extends GenericAlertChannel<infer TType, infer TConfig>
    ? AlertChannel<TType, TConfig>
    : never;
};

export type AlertChannelName<TChannels extends AlertChannelMap> = keyof ValidatedAlertChannels<TChannels> & string;

export interface AlertRule<
  TMetrics extends JsonObject = JsonObject,
  TChannelName extends string = string
> {
  name: string;
  condition: (metrics: TMetrics) => boolean;
  severity: AlertSeverity;
  channels: TChannelName[];
  throttle?: number;
  message?: string;
}

export type AlertCallbackData<TMetrics extends JsonObject> = JsonObject & {
  metrics?: TMetrics;
};

export interface AlertManagerOptions<
  TMetrics extends JsonObject = JsonObject,
  TChannels extends AlertChannelMap = Record<string, GenericAlertChannel>
> {
  channels: ValidatedAlertChannels<TChannels>;
  rules?: AlertRule<TMetrics, AlertChannelName<TChannels>>[];
  onAlert?: (alert: Alert<AlertCallbackData<TMetrics>>) => void | Promise<void>;
}

export type AlertSummary = Pick<Alert, 'name' | 'severity' | 'message'>;
