import type { JsonObject } from '../langgraph/observability/payload.js';
import { alertLogger, toAlertSummary } from './alerts-shared.js';
import type { Alert, AlertCallbackData, AlertChannelMap, AlertManagerOptions } from './alerts-types.js';

export async function sendAlertToChannel<
  TMetrics extends JsonObject,
  TChannels extends AlertChannelMap
>(
  channels: AlertManagerOptions<TMetrics, TChannels>['channels'],
  channelName: keyof TChannels & string,
  alert: Alert<AlertCallbackData<TMetrics>>
): Promise<void> {
  const channel = channels[channelName];
  if (!channel) {
    throw new Error(`Channel not found: ${channelName}`);
  }

  switch (channel.type) {
    case 'email':
      alertLogger.info('Alert sent to email', {
        channel: channelName,
        to: channel.config.to,
        alert: toAlertSummary(alert),
      });
      return;
    case 'slack':
      alertLogger.info('Alert sent to Slack', {
        channel: channelName,
        webhookUrl: channel.config.webhookUrl,
        alert: toAlertSummary(alert),
      });
      return;
    case 'webhook':
      alertLogger.info('Alert sent to webhook', {
        channel: channelName,
        url: channel.config.url,
        alert: toAlertSummary(alert),
      });
      return;
    default:
      alertLogger.info('Alert sent', {
        channel: channelName,
        channelType: channel.type,
        alert: toAlertSummary(alert),
      });
  }
}
