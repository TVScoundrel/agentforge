/**
 * Send a message to a Slack channel
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from '@agentforge/core';
import { z } from 'zod';
import type { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from '../types.js';

/**
 * Create the sendSlackMessage tool with the provided client and logger
 */
export function createSendSlackMessageTool(
  getSlackClient: () => { client: WebClient; config: SlackClientConfig },
  logger: Logger
) {
  return toolBuilder()
    .name('send-slack-message')
    .description('Send a message to a Slack channel for team communication and notifications')
    .category(ToolCategory.WEB)
    .tags(['slack', 'messaging', 'communication'])
    .usageNotes(
      'Use this for general team communication. For notifications with @mentions, consider using notify-slack instead. ' +
      'Use get-slack-channels first if you need to find the right channel.'
    )
    .suggests(['get-slack-channels'])
    .schema(
      z.object({
        channel: z.string().describe("Channel name (e.g., 'general') or ID (e.g., 'C123456')"),
        message: z.string().describe('Message content to send'),
      })
    )
    .implementSafe(async ({ channel, message }) => {
      logger.info('send-slack-message called', { channel, messageLength: message.length });

      try {
        const { client: slack, config } = getSlackClient();

        // Send message using Slack API
        const result = await slack.chat.postMessage({
          channel,
          text: message,
          username: config.botName,
          icon_emoji: config.botIcon,
        });

        logger.info('send-slack-message result', {
          channel: result.channel,
          timestamp: result.ts,
          messageLength: message.length,
          success: true,
        });

        return {
          channel: result.channel,
          message,
          timestamp: result.ts,
          message_id: result.ts,
        };
      } catch (error: any) {
        logger.error('send-slack-message failed', {
          channel,
          error: error.message,
          data: error.data,
        });
        throw error;
      }
    })
    .build();
}

