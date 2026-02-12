/**
 * Send a notification to a Slack channel (with @mention support)
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from '@agentforge/core';
import { z } from 'zod';
import type { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from '../types.js';

/**
 * Create the notifySlack tool with the provided client and logger
 */
export function createNotifySlackTool(
  getSlackClient: () => { client: WebClient; config: SlackClientConfig },
  logger: Logger
) {
  return toolBuilder()
    .name('notify-slack')
    .description('Send a notification to a Slack channel with optional @mentions for urgent alerts')
    .category(ToolCategory.WEB)
    .tags(['slack', 'notification', 'alert'])
    .usageNotes(
      'Use this for urgent notifications that require @mentions. For general messages without mentions, ' +
      'use send-slack-message instead.'
    )
    .suggests(['get-slack-channels'])
    .schema(
      z.object({
        channel: z.string().describe('Channel name or ID'),
        message: z.string().describe('Notification message'),
        mentions: z.array(z.string()).optional().describe('List of usernames to mention (without @)'),
      })
    )
    .implementSafe(async ({ channel, message, mentions = [] }) => {
      logger.info('notify-slack called', {
        channel,
        messageLength: message.length,
        mentionCount: mentions.length,
      });

      const { client: slack, config } = getSlackClient();

      // Build message with mentions
      const mentionText = mentions.length > 0 ? mentions.map((m) => `<@${m}>`).join(' ') + ' ' : '';
      const fullMessage = `${mentionText}${message}`;

      // Send notification using Slack API
      const result = await slack.chat.postMessage({
        channel,
        text: fullMessage,
        username: config.botName,
        icon_emoji: config.botIcon,
      });

      logger.info('notify-slack result', {
        channel: result.channel,
        timestamp: result.ts,
        mentions: mentions.length,
      });

      return {
        channel: result.channel,
        message: fullMessage,
        mentions,
        timestamp: result.ts,
        notification_id: result.ts,
      };
    })
    .build();
}

