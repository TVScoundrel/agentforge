/**
 * Authentication helpers for Confluence tools
 */

import type { ConfluenceAuth } from './types.js';

/**
 * Create a function to get configured auth credentials
 * This is used by the factory function to create closures
 */
export function createGetConfiguredAuth(
  apiKey?: string,
  email?: string,
  siteUrl?: string
): () => ConfluenceAuth {
  return function getConfiguredAuth(): ConfluenceAuth {
    const ATLASSIAN_API_KEY = apiKey || process.env.ATLASSIAN_API_KEY || '';
    const ATLASSIAN_EMAIL = email || process.env.ATLASSIAN_EMAIL || '';
    const ATLASSIAN_SITE_URL = (siteUrl || process.env.ATLASSIAN_SITE_URL || '').replace(/\/$/, '');

    if (!ATLASSIAN_API_KEY || !ATLASSIAN_EMAIL || !ATLASSIAN_SITE_URL) {
      throw new Error(
        'Confluence credentials not configured. Set ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, and ATLASSIAN_SITE_URL in config or environment variables.'
      );
    }

    return { ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, ATLASSIAN_SITE_URL };
  };
}

/**
 * Helper function to get configuration from environment (for default tools)
 */
export function getConfig(): ConfluenceAuth {
  const ATLASSIAN_API_KEY = process.env.ATLASSIAN_API_KEY || '';
  const ATLASSIAN_EMAIL = process.env.ATLASSIAN_EMAIL || '';
  const ATLASSIAN_SITE_URL = (process.env.ATLASSIAN_SITE_URL || '').replace(/\/$/, '');

  if (!ATLASSIAN_API_KEY || !ATLASSIAN_EMAIL || !ATLASSIAN_SITE_URL) {
    throw new Error(
      'Confluence credentials not configured. Set ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, and ATLASSIAN_SITE_URL in .env'
    );
  }

  return { ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, ATLASSIAN_SITE_URL };
}
