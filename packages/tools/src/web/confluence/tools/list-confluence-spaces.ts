/**
 * List all Confluence spaces
 */

import { toolBuilder, ToolCategory, type Tool, type Logger } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";
import type { ConfluenceAuth } from "../types.js";

/**
 * Create the listConfluenceSpaces tool with the provided auth and logger
 */
export function createListConfluenceSpacesTool(
  getAuth: () => ConfluenceAuth,
  getAuthHeader: () => string,
  logger: Logger
) {
  return toolBuilder()
    .name("list-confluence-spaces")
    .description("List all available Confluence spaces. Returns space names, keys, types, and descriptions to help identify where to search for information.")
    .category(ToolCategory.WEB)
    .tag("confluence")
    .tag("spaces")
    .tag("list")
    .usageNotes("Use this first to discover available spaces before searching. Helps narrow down searches to specific areas (e.g., 'AI', 'BL3', 'Finance').")
    .follows(["search-confluence"])
    .schema(z.object({
      limit: z.number().optional().describe("Maximum number of spaces to return (default: 25)"),
    }))
    .implement(async ({ limit = 25 }) => {
      logger.info('list-confluence-spaces called', { limit });

      try {
        const { ATLASSIAN_SITE_URL } = getAuth();
        const response = await axios.get(`${ATLASSIAN_SITE_URL}/wiki/rest/api/space`, {
          headers: {
            Authorization: getAuthHeader(),
            Accept: "application/json",
          },
          params: {
            limit,
          },
        });

        const spaces = response.data.results.map((space: any) => ({
          key: space.key,
          name: space.name,
          type: space.type,
          description: space.description?.plain?.value || "",
          url: `${ATLASSIAN_SITE_URL}/wiki${space._links.webui}`,
        }));

        logger.info('list-confluence-spaces result', {
          spaceCount: spaces.length,
          spaceKeys: spaces.map((s: any) => s.key).slice(0, 5) // Log first 5 space keys
        });

        return JSON.stringify({
          success: true,
          count: spaces.length,
          spaces,
        });
      } catch (error: any) {
        logger.error('list-confluence-spaces error', {
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

