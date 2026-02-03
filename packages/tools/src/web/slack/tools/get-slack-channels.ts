/**
 * Get list of available Slack channels
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from '@agentforge/core';
import { z } from 'zod';
import type { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from '../types.js';

/**
 * Create the getSlackChannels tool with the provided client and logger
 */
export function createGetSlackChannelsTool(
  getSlackClient: () => { client: WebClient; config: SlackClientConfig },
  logger: Logger
): Tool {
  return toolBuilder()
    .name('get-slack-channels')
    .description('Get a list of available Slack channels to find the right channel for messaging')
    .category(ToolCategory.WEB)
    .tags(['slack', 'channels', 'list'])
    .usageNotes(
      'Use this first to discover available channels before sending messages. ' +
      'Helps ensure you are sending to the correct channel.'
    )
    .follows(['send-slack-message', 'notify-slack'])
    .schema(
      z.object({
        include_private: z.boolean().optional().describe('Include private channels (default: false)'),
      })
    )
    .implementSafe(async ({ include_private = false }) => {
      logger.info('get-slack-channels called', { include_private });

      const { client: slack } = getSlackClient();

      // Get public channels
      const publicChannels = await slack.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
      });

      let allChannels = publicChannels.channels || [];

      // Get private channels if requested
      if (include_private) {
        const privateChannels = await slack.conversations.list({
          types: 'private_channel',
          exclude_archived: true,
        });
        allChannels = [...allChannels, ...(privateChannels.channels || [])];
      }

      logger.info('get-slack-channels result', {
        channelCount: allChannels.length,
        includePrivate: include_private,
      });

      return {
        count: allChannels.length,
        channels: allChannels.map((c) => ({
          id: c.id,
          name: c.name,
          is_private: c.is_private || false,
          num_members: c.num_members || 0,
        })),
      };
    })
    .build();
}

