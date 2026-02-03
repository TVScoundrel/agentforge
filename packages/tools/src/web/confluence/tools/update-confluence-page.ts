/**
 * Update an existing Confluence page
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "./types";

/**
 * Create the updateConfluencePage tool with the provided auth and logger
 */
export function createUpdateConfluencePageTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
): Tool {
  return toolBuilder()
    .name("update-confluence-page")
    .description("Update an existing Confluence page's content. Requires page ID, new title, and new content.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("update")
    .tag("write")
    .usageNotes("Use this to update existing documentation. You must provide the page ID (from search results). The tool will automatically handle version incrementing. Always get the current page content first to avoid overwriting important information.")
    .requires(["get-confluence-page"])
    .schema(z.object({
      page_id: z.string().describe("The ID of the page to update"),
      title: z.string().describe("The new title for the page"),
      content: z.string().describe("The new content in HTML format (Confluence storage format)"),
    }))
    .implement(async ({ page_id, title, content }) => {
      logger.info('update-confluence-page called', { page_id, title });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();

        // First, get the current version
        const getResponse = await axios.get(
          `${ATLASSIAN_SITE_URL}/wiki/rest/api/content/${page_id}`,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
            params: { expand: "version" },
          }
        );

        const currentVersion = getResponse.data.version.number;

        // Update the page
        const updateResponse = await axios.put(
          `${ATLASSIAN_SITE_URL}/wiki/rest/api/content/${page_id}`,
          {
            type: "page",
            title: title,
            version: { number: currentVersion + 1 },
            body: {
              storage: {
                value: content,
                representation: "storage",
              },
            },
          },
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        logger.info('update-confluence-page result', {
          page_id,
          title: updateResponse.data.title,
          previousVersion: currentVersion,
          newVersion: updateResponse.data.version.number
        });

        return JSON.stringify({
          success: true,
          page: {
            id: updateResponse.data.id,
            title: updateResponse.data.title,
            url: `${ATLASSIAN_SITE_URL}/wiki${updateResponse.data._links.webui}`,
            version: updateResponse.data.version.number,
            previousVersion: currentVersion,
          },
        });
      } catch (error: any) {
        logger.error('update-confluence-page error', {
          page_id,
          title,
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

