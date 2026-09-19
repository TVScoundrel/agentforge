/**
 * Update an existing Confluence page
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from '@agentforge/core';
import { z } from 'zod';
import type { ConfluenceRequest } from '../request.js';

/**
 * Create the updateConfluencePage tool with the provided auth and logger
 */
export function createUpdateConfluencePageTool(request: ConfluenceRequest, logger: Logger) {
  return toolBuilder()
    .name('update-confluence-page')
    .description(
      "Update an existing Confluence page's content. Requires page ID, new title, and new content."
    )
    .category(ToolCategory.WEB)
    .tag('confluence')
    .tag('update')
    .tag('write')
    .usageNotes(
      'Use this to update existing documentation. You must provide the page ID (from search results). The tool will automatically handle version incrementing. Always get the current page content first to avoid overwriting important information.'
    )
    .requires(['get-confluence-page'])
    .schema(
      z.object({
        page_id: z.string().describe('The ID of the page to update'),
        title: z.string().describe('The new title for the page'),
        content: z.string().describe('The new content in HTML format (Confluence storage format)'),
      })
    )
    .implement(async ({ page_id, title, content }) => {
      logger.info('update-confluence-page called', { page_id, title });

      try {
        // First, get the current version
        const getResponse = await request.get(`/wiki/rest/api/content/${page_id}`, {
          params: { expand: 'version' },
        });

        const currentVersion = getResponse.data.version.number;

        // Update the page
        const updateResponse = await request.put(
          `/wiki/rest/api/content/${page_id}`,
          {
            type: 'page',
            title: title,
            version: { number: currentVersion + 1 },
            body: {
              storage: {
                value: content,
                representation: 'storage',
              },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        logger.info('update-confluence-page result', {
          page_id,
          title: updateResponse.data.title,
          previousVersion: currentVersion,
          newVersion: updateResponse.data.version.number,
        });

        return JSON.stringify({
          success: true,
          page: {
            id: updateResponse.data.id,
            title: updateResponse.data.title,
            url: `${updateResponse.siteUrl}/wiki${updateResponse.data._links.webui}`,
            version: updateResponse.data.version.number,
            previousVersion: currentVersion,
          },
        });
      } catch (error: unknown) {
        const description = request.describeError(error);
        logger.error('update-confluence-page error', {
          page_id,
          title,
          ...(description.message !== undefined ? { error: description.message } : {}),
          ...(description.status !== undefined ? { status: description.status } : {}),
        });

        return JSON.stringify({
          success: false,
          error: description.message,
        });
      }
    })
    .build();
}
