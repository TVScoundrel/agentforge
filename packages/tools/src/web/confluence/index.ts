/**
 * Confluence Integration Tools
 * Real integration with Atlassian Confluence for knowledge base access
 *
 * @packageDocumentation
 *
 * @example
 * ```ts
 * // Using environment variables
 * import { confluenceTools } from '@agentforge/tools';
 *
 * // ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, ATLASSIAN_SITE_URL must be set
 * const result = await confluenceTools[0].execute({
 *   query: 'space=AI AND type=page'
 * });
 *
 * // Using factory function with custom config
 * import { createConfluenceTools } from '@agentforge/tools';
 *
 * const tools = createConfluenceTools({
 *   apiKey: 'your-api-key',
 *   email: 'your-email@example.com',
 *   siteUrl: 'https://your-domain.atlassian.net'
 * });
 *
 * const result = await tools.searchConfluence.execute({
 *   query: 'payment processing'
 * });
 * ```
 */

import { createLogger, LogLevel } from '@agentforge/core';
import { getConfig, createGetConfiguredAuth } from './auth.js';
import { createConfluenceRequest } from './request.js';
import { createSearchConfluenceTool } from './tools/search-confluence.js';
import { createGetConfluencePageTool } from './tools/get-confluence-page.js';
import { createListConfluenceSpacesTool } from './tools/list-confluence-spaces.js';
import { createGetSpacePagesTool } from './tools/get-space-pages.js';
import { createCreateConfluencePageTool } from './tools/create-confluence-page.js';
import { createUpdateConfluencePageTool } from './tools/update-confluence-page.js';
import { createArchiveConfluencePageTool } from './tools/archive-confluence-page.js';

// Export types
export type { ConfluenceToolsConfig, ConfluenceAuth } from './types.js';

// Create logger for default Confluence tools
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('[tools:confluence]', { level: logLevel });

/**
 * Default Confluence tools using environment variables
 */
const request = createConfluenceRequest(getConfig);
export const searchConfluence = createSearchConfluenceTool(request, logger);
export const getConfluencePage = createGetConfluencePageTool(request, logger);
export const listConfluenceSpaces = createListConfluenceSpacesTool(request, logger);
export const getSpacePages = createGetSpacePagesTool(request, logger);
export const createConfluencePage = createCreateConfluencePageTool(request, logger);
export const updateConfluencePage = createUpdateConfluencePageTool(request, logger);
export const archiveConfluencePage = createArchiveConfluencePageTool(request, logger);

/**
 * Export all Confluence tools
 *
 * Includes 7 tools for Confluence integration:
 * - 4 read tools: search, get-page, list-spaces, get-space-pages
 * - 3 write tools: create-page, update-page, archive-page
 */
export const confluenceTools = [
  // Read tools
  searchConfluence,
  getConfluencePage,
  listConfluenceSpaces,
  getSpacePages,
  // Write tools
  createConfluencePage,
  updateConfluencePage,
  archiveConfluencePage,
];

/**
 * Create Confluence tools with custom configuration
 *
 * This factory function allows you to create Confluence tools with programmatic configuration
 * instead of relying solely on environment variables.
 *
 * @param config - Optional configuration for Confluence tools
 * @returns Object containing all 7 Confluence tools configured with the provided settings
 *
 * @example
 * ```ts
 * // Create tools with custom credentials
 * const tools = createConfluenceTools({
 *   apiKey: 'your-api-key',
 *   email: 'your-email@example.com',
 *   siteUrl: 'https://your-domain.atlassian.net'
 * });
 *
 * // Use the tools
 * const result = await tools.searchConfluence.execute({
 *   query: 'payment processing'
 * });
 * ```
 *
 * @example
 * ```ts
 * // Create tools with custom log level
 * const tools = createConfluenceTools({
 *   logLevel: LogLevel.DEBUG
 * });
 * ```
 */
export function createConfluenceTools(config: import('./types.js').ConfluenceToolsConfig = {}) {
  const { apiKey, email, siteUrl, logLevel: customLogLevel } = config;

  // Create closures for getting configured auth credentials
  const getConfiguredAuth = createGetConfiguredAuth(apiKey, email, siteUrl);
  const request = createConfluenceRequest(getConfiguredAuth);

  // Create logger with custom log level if provided
  const toolLogger = customLogLevel
    ? createLogger('tools:confluence', { level: customLogLevel })
    : logger;

  // Build all 7 tools with configured auth/logger
  const searchConfluence = createSearchConfluenceTool(request, toolLogger);
  const getConfluencePage = createGetConfluencePageTool(request, toolLogger);
  const listConfluenceSpaces = createListConfluenceSpacesTool(request, toolLogger);
  const getSpacePages = createGetSpacePagesTool(request, toolLogger);
  const createConfluencePage = createCreateConfluencePageTool(request, toolLogger);
  const updateConfluencePage = createUpdateConfluencePageTool(request, toolLogger);
  const archiveConfluencePage = createArchiveConfluencePageTool(request, toolLogger);

  // Return all configured tools
  return {
    searchConfluence,
    getConfluencePage,
    listConfluenceSpaces,
    getSpacePages,
    createConfluencePage,
    updateConfluencePage,
    archiveConfluencePage,
  };
}
