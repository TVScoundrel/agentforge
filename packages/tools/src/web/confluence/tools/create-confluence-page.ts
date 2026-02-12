/**
 * Create a new Confluence page
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "../types.js";

/**
 * Create the createConfluencePage tool with the provided auth and logger
 */
export function createCreateConfluencePageTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
) {
  return toolBuilder()
    .name("create-confluence-page")
    .description("Create a new page in a Confluence space. Requires space key, page title, and content (in HTML storage format).")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("create")
    .tag("write")
    .usageNotes("Use this to create new documentation pages. Content should be in Confluence storage format (HTML). Get the space key from list-confluence-spaces first. Be mindful of creating duplicate pages.")
    .requires(["list-confluence-spaces"])
    .schema(z.object({
      space_key: z.string().describe("The space key where the page will be created (e.g., 'AI', 'BL3')"),
      title: z.string().describe("The title of the new page"),
      content: z.string().describe("The page content in HTML format (Confluence storage format)"),
      parent_page_id: z.string().optional().describe("Optional parent page ID to create this as a child page"),
    }))
    .implement(async ({ space_key, title, content, parent_page_id }) => {
      logger.info('create-confluence-page called', { space_key, title, hasParent: !!parent_page_id });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();

        const pageData: any = {
          type: "page",
          title: title,
          space: { key: space_key },
          body: {
            storage: {
              value: content,
              representation: "storage",
            },
          },
        };

        // Add parent if specified
        if (parent_page_id) {
          pageData.ancestors = [{ id: parent_page_id }];
        }

        const response = await axios.post(
          `${ATLASSIAN_SITE_URL}/wiki/rest/api/content`,
          pageData,
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        logger.info('create-confluence-page result', {
          page_id: response.data.id,
          title: response.data.title,
          space: space_key
        });

        return JSON.stringify({
          success: true,
          page: {
            id: response.data.id,
            title: response.data.title,
            space: space_key,
            url: `${ATLASSIAN_SITE_URL}/wiki${response.data._links.webui}`,
            version: response.data.version?.number || 1,
          },
        });
      } catch (error: any) {
        logger.error('create-confluence-page error', {
          space_key,
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

