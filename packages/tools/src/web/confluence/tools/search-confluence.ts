/**
 * Search Confluence pages using CQL (Confluence Query Language)
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "./types";

/**
 * Create the searchConfluence tool with the provided auth and logger
 */
export function createSearchConfluenceTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
): Tool {
  return toolBuilder()
    .name("search-confluence")
    .description("Search for pages in Confluence using keywords or CQL (Confluence Query Language). Returns matching pages with titles, IDs, and excerpts.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("search")
    .tag("knowledge-base")
    .usageNotes("Use this to find relevant documentation, policies, or information in Confluence. You can search by keywords or use CQL for advanced queries (e.g., 'space=AI AND type=page'). Use get-confluence-page to retrieve full content of specific pages.")
    .suggests(["get-confluence-page"])
    .schema(z.object({
      query: z.string().describe("Search query or CQL expression (e.g., 'payment processing' or 'space=BL3 AND title~payment')"),
      limit: z.number().optional().describe("Maximum number of results to return (default: 10, max: 25)"),
    }))
    .implement(async ({ query, limit = 10 }) => {
      logger.info('search-confluence called', { query, limit });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();
        const response = await axios.get(`${ATLASSIAN_SITE_URL}/wiki/rest/api/content/search`, {
          headers: {
            Authorization: getAuthHeader(),
            Accept: "application/json",
          },
          params: {
            cql: query,
            limit: Math.min(limit, 25),
            expand: "space,version",
          },
        });

        const { ATLASSIAN_SITE_URL: siteUrl } = getAuth();
        const results = response.data.results.map((page: any) => ({
          id: page.id,
          title: page.title,
          type: page.type,
          space: page.space?.name || "Unknown",
          spaceKey: page.space?.key || "",
          url: `${siteUrl}/wiki${page._links.webui}`,
          lastModified: page.version?.when || "",
        }));

        // IMPORTANT: Log when search returns no results - this is a valid outcome!
        if (results.length === 0) {
          logger.warn('search-confluence returned NO RESULTS - this is a valid outcome, agent should not retry', {
            query,
            limit,
            totalSize: response.data.totalSize
          });
        } else {
          logger.info('search-confluence result', {
            query,
            resultCount: results.length,
            totalSize: response.data.totalSize,
            titles: results.map((r: any) => r.title).slice(0, 3) // Log first 3 titles
          });
        }

        return JSON.stringify({
          success: true,
          count: results.length,
          total: response.data.totalSize,
          results,
        });
      } catch (error: any) {
        logger.error('search-confluence error', {
          query,
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

