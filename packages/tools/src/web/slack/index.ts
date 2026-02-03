/**
 * Slack Integration Tools
 *
 * Tools for interacting with Slack workspaces - send messages, notifications,
 * list channels, and read message history.
 *
 * @packageDocumentation
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

import { createLogger, LogLevel } from "@agentforge/core";
import { getDefaultSlackClient, createGetConfiguredSlackClient } from "./auth.js";
import { createSendSlackMessageTool } from "./tools/send-slack-message.js";
import { createNotifySlackTool } from "./tools/notify-slack.js";
import { createGetSlackChannelsTool } from "./tools/get-slack-channels.js";
import { createGetSlackMessagesTool } from "./tools/get-slack-messages.js";

// Export types
export type { SlackToolsConfig, SlackClientConfig } from "./types.js";

// Create logger for default Slack tools
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('[tools:slack]', { level: logLevel });

/**
 * Default Slack tools using environment variables
 */
export const sendSlackMessage = createSendSlackMessageTool(getDefaultSlackClient, logger);
export const notifySlack = createNotifySlackTool(getDefaultSlackClient, logger);
export const getSlackChannels = createGetSlackChannelsTool(getDefaultSlackClient, logger);
export const getSlackMessages = createGetSlackMessagesTool(getDefaultSlackClient, logger);

/**
 * Export all Slack tools
 *
 * Includes 4 tools for Slack integration:
 * - 2 write tools: send-slack-message, notify-slack
 * - 2 read tools: get-slack-channels, get-slack-messages
 */
export const slackTools = [
  // Write tools
  sendSlackMessage,
  notifySlack,
  // Read tools
  getSlackChannels,
  getSlackMessages,
];

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
export function createSlackTools(config: import("./types.js").SlackToolsConfig = {}) {
  const {
    token,
    botName = 'AgentForge Bot',
    botIcon = ':robot_face:',
    logLevel: customLogLevel,
  } = config;

  // Create closures for getting configured Slack client
  const getConfiguredSlackClient = createGetConfiguredSlackClient(token, botName, botIcon);

  // Create logger with custom log level if provided
  const toolLogger = customLogLevel
    ? createLogger('[tools:slack]', { level: customLogLevel })
    : logger;

  // Build all 4 tools with configured client/logger
  const sendMessage = createSendSlackMessageTool(getConfiguredSlackClient, toolLogger);
  const notify = createNotifySlackTool(getConfiguredSlackClient, toolLogger);
  const getChannels = createGetSlackChannelsTool(getConfiguredSlackClient, toolLogger);
  const getMessages = createGetSlackMessagesTool(getConfiguredSlackClient, toolLogger);

  // Return all configured tools
  return {
    sendMessage,
    notify,
    getChannels,
    getMessages,
  };
}

