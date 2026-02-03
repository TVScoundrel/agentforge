/**
 * Authentication helpers for Slack tools
 */

import { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from './types.js';

/**
 * Create a function to get configured Slack client
 * This is used by the factory function to create closures
 */
export function createGetConfiguredSlackClient(
  token?: string,
  botName: string = 'AgentForge Bot',
  botIcon: string = ':robot_face:'
): () => { client: WebClient; config: SlackClientConfig } {
  let configuredClient: WebClient | null = null;

  return function getConfiguredSlackClient(): { client: WebClient; config: SlackClientConfig } {
    if (!configuredClient) {
      const slackToken = token || process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
      if (!slackToken) {
        throw new Error(
          'Slack token not configured. Please provide a token in config or set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
        );
      }
      configuredClient = new WebClient(slackToken);
    }

    return {
      client: configuredClient,
      config: {
        token: token || process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN || '',
        botName,
        botIcon,
      },
    };
  };
}

/**
 * Helper function to get default Slack client (for default tools)
 */
let defaultSlackClient: WebClient | null = null;

export function getDefaultSlackClient(): { client: WebClient; config: SlackClientConfig } {
  if (!defaultSlackClient) {
    const token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error(
        'Slack token not configured. Please set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
      );
    }
    defaultSlackClient = new WebClient(token);
  }

  return {
    client: defaultSlackClient,
    config: {
      token: process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN || '',
      botName: 'AgentForge Bot',
      botIcon: ':robot_face:',
    },
  };
}

