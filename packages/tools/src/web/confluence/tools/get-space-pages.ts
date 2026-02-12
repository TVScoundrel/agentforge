/**
 * Get pages from a specific Confluence space
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "../types.js";

/**
 * Create the getSpacePages tool with the provided auth and logger
 */
export function createGetSpacePagesTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
) {
  return toolBuilder()
    .name("get-space-pages")
    .description("Get all pages from a specific Confluence space by space key. Useful for browsing content in a particular area.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("space")
    .tag("pages")
    .usageNotes("Use this to explore all pages in a specific space. Get the space key from list-confluence-spaces first.")
    .requires(["list-confluence-spaces"])
    .schema(z.object({
      space_key: z.string().describe("The space key (e.g., 'AI', 'BL3', 'FIN')"),
      limit: z.number().optional().describe("Maximum number of pages to return (default: 25)"),
    }))
    .implement(async ({ space_key, limit = 25 }) => {
      logger.info('get-space-pages called', { space_key, limit });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();
        const response = await axios.get(`${ATLASSIAN_SITE_URL}/wiki/rest/api/content`, {
          headers: {
            Authorization: getAuthHeader(),
            Accept: "application/json",
          },
          params: {
            spaceKey: space_key,
            type: "page",
            limit,
            expand: "version",
          },
        });

        const pages = response.data.results.map((page: any) => ({
          id: page.id,
          title: page.title,
          url: `${ATLASSIAN_SITE_URL}/wiki${page._links.webui}`,
          lastModified: page.version?.when || "",
        }));

        // Log when no pages found - this is a valid outcome!
        if (pages.length === 0) {
          logger.warn('get-space-pages returned NO PAGES - this is a valid outcome, agent should not retry', {
            space_key,
            limit
          });
        } else {
          logger.info('get-space-pages result', {
            space_key,
            pageCount: pages.length,
            titles: pages.map((p: any) => p.title).slice(0, 3) // Log first 3 titles
          });
        }

        return JSON.stringify({
          success: true,
          space: space_key,
          count: pages.length,
          pages,
        });
      } catch (error: any) {
        logger.error('get-space-pages error', {
          space_key,
          error: error.response?.data?.message || error.message,
          status: error.response?.status
        });

        return JSON.stringify({
          success: false,
          error: error.response?.data?.message || error.message,
        });
      }
    })
    .build();
}

