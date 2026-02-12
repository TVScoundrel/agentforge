/**
 * Get message history from a Slack channel
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from '@agentforge/core';
import { z } from 'zod';
import type { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from '../types.js';

/**
 * Create the getSlackMessages tool with the provided client and logger
 */
export function createGetSlackMessagesTool(
  getSlackClient: () => { client: WebClient; config: SlackClientConfig },
  logger: Logger
) {
  return toolBuilder()
    .name('get-slack-messages')
    .description('Retrieve message history from a Slack channel to read recent conversations')
    .category(ToolCategory.WEB)
    .tags(['slack', 'messages', 'history', 'read'])
    .usageNotes(
      'Use this to read recent messages from a channel. Use get-slack-channels first if you need to find the channel ID. ' +
      'Returns messages in reverse chronological order (newest first).'
    )
    .suggests(['get-slack-channels'])
    .schema(
      z.object({
        channel: z.string().describe("Channel name (e.g., 'general') or ID (e.g., 'C123456')"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Number of messages to retrieve (default: 20, max: 100)'),
      })
    )
    .implementSafe(async ({ channel, limit = 20 }) => {
      logger.info('get-slack-messages called', { channel, limit });

      try {
        const { client: slack } = getSlackClient();

        // Get channel ID if name was provided
        let channelId = channel;
        if (!channel.startsWith('C') && !channel.startsWith('D')) {
          const channels = await slack.conversations.list({
            types: 'public_channel,private_channel',
            exclude_archived: true,
          });
          const found = channels.channels?.find((c) => c.name === channel);
          if (!found) {
            logger.error('get-slack-messages: channel not found', { channel });
            throw new Error(
              `Channel '${channel}' not found. Use get-slack-channels to see available channels.`
            );
          }
          channelId = found.id!;
        }

        // Retrieve message history
        const result = await slack.conversations.history({
          channel: channelId,
          limit: Math.min(limit, 100), // Cap at 100 for performance
        });

        logger.info('get-slack-messages result', {
          channel: channelId,
          messageCount: result.messages?.length || 0,
          limit,
        });

        return {
          channel: channelId,
          count: result.messages?.length || 0,
          messages:
            result.messages?.map((m) => ({
              user: m.user || 'unknown',
              text: m.text || '',
              timestamp: m.ts,
              thread_ts: m.thread_ts,
              type: m.type,
              subtype: m.subtype,
            })) || [],
        };
      } catch (error: any) {
        logger.error('get-slack-messages failed', {
          channel,
          error: error.message,
          data: error.data,
        });
        throw error;
      }
    })
    .build();
}

