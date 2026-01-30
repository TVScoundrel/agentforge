/**
 * Slack Integration Tools
 * 
 * Tools for interacting with Slack workspaces - send messages, notifications,
 * list channels, and read message history.
 * 
 * @example
 * ```ts
 * // Send a message to a channel
 * const result = await sendSlackMessage.execute({
 *   channel: 'general',
 *   message: 'Hello from AgentForge!'
 * });
 * 
 * // Send a notification with mentions
 * const notification = await notifySlack.execute({
 *   channel: 'alerts',
 *   message: 'Deployment complete!',
 *   mentions: ['john', 'jane']
 * });
 * 
 * // List available channels
 * const channels = await getSlackChannels.execute({
 *   include_private: false
 * });
 * 
 * // Read message history
 * const messages = await getSlackMessages.execute({
 *   channel: 'general',
 *   limit: 10
 * });
 * ```
 */

import { WebClient } from '@slack/web-api';
import { toolBuilder, ToolCategory, createLogger, LogLevel } from '@agentforge/core';
import { z } from 'zod';

// Create logger for Slack tools
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('tools:slack', { level: logLevel });

// Lazy initialization of Slack client to ensure env vars are loaded
let slackClient: WebClient | null = null;

function getSlackClient(): WebClient {
  if (!slackClient) {
    const token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error(
        'Slack token not configured. Please set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
      );
    }
    slackClient = new WebClient(token);
  }
  return slackClient;
}

/**
 * Send a message to a Slack channel
 */
export const sendSlackMessage = toolBuilder()
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
      const slack = getSlackClient();

      // Send message using Slack API
      const result = await slack.chat.postMessage({
        channel,
        text: message,
        username: 'AgentForge Bot',
        icon_emoji: ':robot_face:',
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

/**
 * Send a notification to a Slack channel (with @mention support)
 */
export const notifySlack = toolBuilder()
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

    const slack = getSlackClient();

    // Build message with mentions
    const mentionText = mentions.length > 0 ? mentions.map((m) => `<@${m}>`).join(' ') + ' ' : '';

    const fullMessage = `${mentionText}${message}`;

    // Send notification using Slack API
    const result = await slack.chat.postMessage({
      channel,
      text: fullMessage,
      username: 'AgentForge Bot',
      icon_emoji: ':robot_face:',
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

/**
 * Get list of available Slack channels
 */
export const getSlackChannels = toolBuilder()
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

    const slack = getSlackClient();

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

/**
 * Get message history from a Slack channel
 */
export const getSlackMessages = toolBuilder()
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
      const slack = getSlackClient();

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

/**
 * Export all Slack tools as an array for convenience
 */
export const slackTools = [sendSlackMessage, notifySlack, getSlackChannels, getSlackMessages];


