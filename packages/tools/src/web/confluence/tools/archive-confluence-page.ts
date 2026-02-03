/**
 * Archive a Confluence page (move to trash)
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "./types";

/**
 * Create the archiveConfluencePage tool with the provided auth and logger
 */
export function createArchiveConfluencePageTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
): Tool {
  return toolBuilder()
    .name("archive-confluence-page")
    .description("Archive a Confluence page by moving it to trash. The page can be restored by space admins. Note: UI may require a note explaining why the page was archived.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("archive")
    .tag("delete")
    .usageNotes("Use this to archive outdated or obsolete documentation. The page is moved to trash, not permanently deleted. Space admins can restore it if needed. Be very careful - only archive pages that are truly obsolete.")
    .conflicts(["create-confluence-page"])
    .schema(z.object({
      page_id: z.string().describe("The ID of the page to archive"),
      reason: z.string().optional().describe("Optional reason for archiving (for audit trail)"),
    }))
    .implement(async ({ page_id, reason }) => {
      logger.info('archive-confluence-page called', { page_id, reason });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();

        // Get current page data
        const getResponse = await axios.get(
          `${ATLASSIAN_SITE_URL}/wiki/rest/api/content/${page_id}`,
          {
            headers: {
              Authorization: getAuthHeader(),
            },
            params: { expand: "version,body.storage,space" },
          }
        );

        const currentVersion = getResponse.data.version.number;
        const pageData = getResponse.data;

        // Archive by updating status to 'trashed'
        await axios.put(
          `${ATLASSIAN_SITE_URL}/wiki/rest/api/content/${page_id}`,
          {
            version: { number: currentVersion + 1 },
            title: pageData.title,
            type: "page",
            status: "trashed",
            body: pageData.body,
            space: { key: pageData.space.key },
          },
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        logger.info('archive-confluence-page result', {
          page_id,
          title: pageData.title,
          previousVersion: currentVersion,
          newVersion: currentVersion + 1
        });

        return JSON.stringify({
          success: true,
          archived: {
            id: page_id,
            title: pageData.title,
            previousVersion: currentVersion,
            newVersion: currentVersion + 1,
            reason: reason || "Archived via API",
            note: "Page moved to trash. Space admins can restore it from the Confluence UI.",
          },
        });
      } catch (error: any) {
        logger.error('archive-confluence-page error', {
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

