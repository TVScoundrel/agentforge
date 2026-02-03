/**
 * Confluence Integration Tools
 * Real integration with Atlassian Confluence for knowledge base access
 * 
 * @packageDocumentation
 */

import { toolBuilder, ToolCategory, createLogger, LogLevel } from "@agentforge/core";
import { z } from "zod";
import axios from "axios";

// Create logger for Confluence tools
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('[tools:confluence]', { level: logLevel });

// Helper function to get configuration from environment (read at runtime)
function getConfig() {
  const ATLASSIAN_API_KEY = process.env.ATLASSIAN_API_KEY || "";
  const ATLASSIAN_EMAIL = process.env.ATLASSIAN_EMAIL || "";
  const ATLASSIAN_SITE_URL = (process.env.ATLASSIAN_SITE_URL || "").replace(/\/$/, "");

  if (!ATLASSIAN_API_KEY || !ATLASSIAN_EMAIL || !ATLASSIAN_SITE_URL) {
    throw new Error("Confluence credentials not configured. Set ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, and ATLASSIAN_SITE_URL in .env");
  }

  return { ATLASSIAN_API_KEY, ATLASSIAN_EMAIL, ATLASSIAN_SITE_URL };
}

// Helper function to create auth header
function getAuthHeader() {
  const { ATLASSIAN_API_KEY, ATLASSIAN_EMAIL } = getConfig();
  const auth = Buffer.from(`${ATLASSIAN_EMAIL}:${ATLASSIAN_API_KEY}`).toString("base64");
  return `Basic ${auth}`;
}

/**
 * Search Confluence pages using CQL (Confluence Query Language)
 */
export const searchConfluence = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();
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

      const { ATLASSIAN_SITE_URL: siteUrl } = getConfig();
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

/**
 * Get full content of a Confluence page by ID
 */
export const getConfluencePage = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();
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

/**
 * List all Confluence spaces
 */
export const listConfluenceSpaces = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();
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

/**
 * Get pages from a specific Confluence space
 */
export const getSpacePages = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();
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

/**
 * Create a new Confluence page
 */
export const createConfluencePage = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();

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

/**
 * Update an existing Confluence page
 */
export const updateConfluencePage = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();

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

/**
 * Archive a Confluence page (move to trash)
 */
export const archiveConfluencePage = toolBuilder()
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
      const { ATLASSIAN_SITE_URL } = getConfig();

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
      const archiveResponse = await axios.put(
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
        newVersion: archiveResponse.data.version?.number || currentVersion + 1
      });

      return JSON.stringify({
        success: true,
        archived: {
          id: page_id,
          title: pageData.title,
          previousVersion: currentVersion,
          newVersion: archiveResponse.data.version?.number || currentVersion + 1,
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

