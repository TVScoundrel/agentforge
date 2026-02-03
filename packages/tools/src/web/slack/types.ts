/**
 * Type definitions for Slack tools
 */

import { LogLevel } from "@agentforge/core";

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

/**
 * Slack client configuration
 */
export interface SlackClientConfig {
  token: string;
  botName: string;
  botIcon: string;
}

