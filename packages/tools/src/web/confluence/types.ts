/**
 * Type definitions for Confluence tools
 */

import { LogLevel } from "@agentforge/core";

/**
 * Configuration options for Confluence tools
 */
export interface ConfluenceToolsConfig {
  /**
   * Atlassian API key
   * If not provided, will fall back to ATLASSIAN_API_KEY env var
   */
  apiKey?: string;

  /**
   * Atlassian account email
   * If not provided, will fall back to ATLASSIAN_EMAIL env var
   */
  email?: string;

  /**
   * Atlassian site URL (e.g., 'https://your-domain.atlassian.net')
   * If not provided, will fall back to ATLASSIAN_SITE_URL env var
   */
  siteUrl?: string;

  /**
   * Custom log level for Confluence tools
   * @default LogLevel.INFO
   */
  logLevel?: LogLevel;
}

/**
 * Confluence authentication credentials
 */
export interface ConfluenceAuth {
  ATLASSIAN_API_KEY: string;
  ATLASSIAN_EMAIL: string;
  ATLASSIAN_SITE_URL: string;
}

