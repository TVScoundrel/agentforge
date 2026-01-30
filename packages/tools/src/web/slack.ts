/**
 * Slack Integration Tools
 *
 * Tools for interacting with Slack workspaces - send messages, notifications,
 * list channels, and read message history.
 *
 * @example
 * ```ts
 * // Using default tools (reads from env vars)
 * import { sendSlackMessage } from '@agentforge/tools';
 *
 * const result = await sendSlackMessage.execute({
 *   channel: 'general',
 *   message: 'Hello from AgentForge!'
 * });
 *
 * // Using factory function with custom config
 * import { createSlackTools } from '@agentforge/tools';
 *
 * const slackTools = createSlackTools({
 *   token: 'xoxb-your-bot-token',
 *   botName: 'My Custom Bot'
 * });
 *
 * const result = await slackTools.sendMessage.execute({
 *   channel: 'general',
 *   message: 'Hello!'
 * });
 * ```
 */

import { WebClient } from '@slack/web-api';
import { toolBuilder, ToolCategory, createLogger, LogLevel, type Tool } from '@agentforge/core';
import { z } from 'zod';

/**
 * Configuration options for Slack tools
 */
export interface SlackToolsConfig {
  /**
   * Slack API token (bot or user token)
   * If not provided, will fall back to SLACK_USER_TOKEN or SLACK_BOT_TOKEN env vars
   */
  token?: string;

  /**
   * Custom bot name to display in Slack
   * @default 'AgentForge Bot'
   */
  botName?: string;

  /**
   * Custom bot icon emoji
   * @default ':robot_face:'
   */
  botIcon?: string;

  /**
   * Log level for Slack tools
   * @default LogLevel.INFO
   */
  logLevel?: LogLevel;
}

// Create logger for Slack tools
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('tools:slack', { level: logLevel });

// Default Slack client (lazy initialization for backward compatibility)
let defaultSlackClient: WebClient | null = null;

function getDefaultSlackClient(): WebClient {
  if (!defaultSlackClient) {
    const token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error(
        'Slack token not configured. Please set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
      );
    }
    defaultSlackClient = new WebClient(token);
  }
  return defaultSlackClient;
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
      const slack = getDefaultSlackClient();

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

    const slack = getDefaultSlackClient();

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

    const slack = getDefaultSlackClient();

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
      const slack = getDefaultSlackClient();

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
 * Create Slack tools with custom configuration
 *
 * This factory function allows you to create Slack tools with custom configuration,
 * such as providing a token programmatically instead of using environment variables.
 *
 * @param config - Configuration options for Slack tools
 * @returns Object containing all 4 Slack tools configured with the provided options
 *
 * @example
 * ```ts
 * // Create tools with custom token
 * const slackTools = createSlackTools({
 *   token: 'xoxb-your-bot-token',
 *   botName: 'My Custom Bot',
 *   botIcon: ':rocket:'
 * });
 *
 * // Use the tools
 * await slackTools.sendMessage.execute({
 *   channel: 'general',
 *   message: 'Hello!'
 * });
 *
 * // Or use with an agent
 * const agent = createReActAgent({
 *   llm,
 *   tools: [
 *     slackTools.sendMessage,
 *     slackTools.notify,
 *     slackTools.getChannels,
 *     slackTools.getMessages
 *   ]
 * });
 * ```
 */
export function createSlackTools(config: SlackToolsConfig = {}) {
  const {
    token,
    botName = 'AgentForge Bot',
    botIcon = ':robot_face:',
    logLevel: customLogLevel,
  } = config;

  // Create a dedicated Slack client for this configuration
  let configuredClient: WebClient | null = null;

  function getConfiguredSlackClient(): WebClient {
    if (!configuredClient) {
      const slackToken = token || process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
      if (!slackToken) {
        throw new Error(
          'Slack token not configured. Please provide a token in config or set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
        );
      }
      configuredClient = new WebClient(slackToken);
    }
    return configuredClient;
  }

  // Create logger with custom log level if provided
  const toolLogger = customLogLevel
    ? createLogger('tools:slack', { level: customLogLevel })
    : logger;

  // Create send message tool
  const sendMessage = toolBuilder()
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
      toolLogger.info('send-slack-message called', { channel, messageLength: message.length });

      try {
        const slack = getConfiguredSlackClient();

        const result = await slack.chat.postMessage({
          channel,
          text: message,
          username: botName,
          icon_emoji: botIcon,
        });

        toolLogger.info('send-slack-message result', {
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
        toolLogger.error('send-slack-message failed', {
          channel,
          error: error.message,
          data: error.data,
        });
        throw error;
      }
    })
    .build();

  // Create notify tool
  const notify = toolBuilder()
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
      toolLogger.info('notify-slack called', {
        channel,
        messageLength: message.length,
        mentionCount: mentions.length,
      });

      const slack = getConfiguredSlackClient();

      const mentionText = mentions.length > 0 ? mentions.map((m) => `<@${m}>`).join(' ') + ' ' : '';
      const fullMessage = `${mentionText}${message}`;

      const result = await slack.chat.postMessage({
        channel,
        text: fullMessage,
        username: botName,
        icon_emoji: botIcon,
      });

      toolLogger.info('notify-slack result', {
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

  // Create get channels tool
  const getChannels = toolBuilder()
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
      toolLogger.info('get-slack-channels called', { include_private });

      const slack = getConfiguredSlackClient();

      const publicChannels = await slack.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
      });

      let allChannels = publicChannels.channels || [];

      if (include_private) {
        const privateChannels = await slack.conversations.list({
          types: 'private_channel',
          exclude_archived: true,
        });
        allChannels = [...allChannels, ...(privateChannels.channels || [])];
      }

      toolLogger.info('get-slack-channels result', {
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

  // Create get messages tool
  const getMessages = toolBuilder()
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
      toolLogger.info('get-slack-messages called', { channel, limit });

      try {
        const slack = getConfiguredSlackClient();

        let channelId = channel;
        if (!channel.startsWith('C') && !channel.startsWith('D')) {
          const channels = await slack.conversations.list({
            types: 'public_channel,private_channel',
            exclude_archived: true,
          });
          const found = channels.channels?.find((c) => c.name === channel);
          if (!found) {
            toolLogger.error('get-slack-messages: channel not found', { channel });
            throw new Error(
              `Channel '${channel}' not found. Use get-slack-channels to see available channels.`
            );
          }
          channelId = found.id!;
        }

        const result = await slack.conversations.history({
          channel: channelId,
          limit: Math.min(limit, 100),
        });

        toolLogger.info('get-slack-messages result', {
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
        toolLogger.error('get-slack-messages failed', {
          channel,
          error: error.message,
          data: error.data,
        });
        throw error;
      }
    })
    .build();

  return {
    sendMessage,
    notify,
    getChannels,
    getMessages,
  };
}

/**
 * Export all Slack tools as an array for convenience
 * These use environment variables for configuration (SLACK_USER_TOKEN or SLACK_BOT_TOKEN)
 */
export const slackTools = [sendSlackMessage, notifySlack, getSlackChannels, getSlackMessages];


