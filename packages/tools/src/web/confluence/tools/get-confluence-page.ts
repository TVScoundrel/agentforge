/**
 * Get full content of a Confluence page by ID
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "../types.js";

/**
 * Create the getConfluencePage tool with the provided auth and logger
 */
export function createGetConfluencePageTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
) {
  return toolBuilder()
    .name("get-confluence-page")
    .description("Get the full content of a specific Confluence page by its ID. Returns the page title, content (in storage format), space, and metadata.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("page")
    .tag("content")
    .usageNotes("Use this after search-confluence to retrieve the full content of a specific page. The page ID can be found in search results.")
    .requires(["search-confluence"])
    .schema(z.object({
      page_id: z.string().describe("The Confluence page ID (from search results)"),
    }))
    .implement(async ({ page_id }) => {
      logger.info('get-confluence-page called', { page_id });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();
        const response = await axios.get(`${ATLASSIAN_SITE_URL}/wiki/rest/api/content/${page_id}`, {
          headers: {
            Authorization: getAuthHeader(),
            Accept: "application/json",
          },
          params: {
            expand: "body.storage,space,version,history",
          },
        });

        const page = response.data;

        logger.info('get-confluence-page result', {
          page_id,
          title: page.title,
          space: page.space?.name,
          contentLength: page.body?.storage?.value?.length || 0
        });

        return JSON.stringify({
          success: true,
          page: {
            id: page.id,
            title: page.title,
            type: page.type,
            space: page.space?.name || "Unknown",
            spaceKey: page.space?.key || "",
            content: page.body?.storage?.value || "",
            url: `${ATLASSIAN_SITE_URL}/wiki${page._links.webui}`,
            created: page.history?.createdDate || "",
            lastModified: page.version?.when || "",
            version: page.version?.number || 1,
          },
        });
      } catch (error: any) {
        logger.error('get-confluence-page error', {
          page_id,
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

