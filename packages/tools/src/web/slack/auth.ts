/**
 * Authentication helpers for Slack tools
 */

import { WebClient } from '@slack/web-api';
import type { SlackClientConfig } from './types.js';

type SlackClientGetter = () => { client: WebClient; config: SlackClientConfig };

function createLazySlackClient(
  resolveToken: () => string | undefined,
  config: Omit<SlackClientConfig, 'token'>,
  missingTokenError: string
): SlackClientGetter {
  let client: WebClient | null = null;

  return () => {
    const token = resolveToken();
    if (!client) {
      if (!token) {
        throw new Error(missingTokenError);
      }
      client = new WebClient(token);
    }

    return { client, config: { token: token || '', ...config } };
  };
}

/**
 * Create a function to get configured Slack client
 * This is used by the factory function to create closures
 */
export function createGetConfiguredSlackClient(
  token?: string,
  botName: string = 'AgentForge Bot',
  botIcon: string = ':robot_face:'
): SlackClientGetter {
  return createLazySlackClient(
    () => token || process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN,
    { botName, botIcon },
    'Slack token not configured. Please provide a token in config or set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
  );
}

/**
 * Helper function to get default Slack client (for default tools)
 */
const getLazyDefaultSlackClient = createLazySlackClient(
  () => process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN,
  { botName: 'AgentForge Bot', botIcon: ':robot_face:' },
  'Slack token not configured. Please set SLACK_USER_TOKEN or SLACK_BOT_TOKEN environment variable.'
);

export function getDefaultSlackClient(): { client: WebClient; config: SlackClientConfig } {
  return getLazyDefaultSlackClient();
}
