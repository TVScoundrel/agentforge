/**
 * Confluence Tools Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that will be accessible in vi.mock factory
const { mockAxiosGet, mockAxiosPost, mockAxiosPut, mockAxiosDelete, mockAxios } = vi.hoisted(() => {
  const mockAxiosGet = vi.fn();
  const mockAxiosPost = vi.fn();
  const mockAxiosPut = vi.fn();
  const mockAxiosDelete = vi.fn();
  const mockAxios = {
    get: mockAxiosGet,
    post: mockAxiosPost,
    put: mockAxiosPut,
    delete: mockAxiosDelete,
  };

  return {
    mockAxiosGet,
    mockAxiosPost,
    mockAxiosPut,
    mockAxiosDelete,
    mockAxios,
  };
});

// Mock axios BEFORE importing the tools
vi.mock('axios', () => ({
  default: mockAxios,
}));

// Import tools AFTER mocking
import {
  searchConfluence,
  getConfluencePage,
  listConfluenceSpaces,
  getSpacePages,
  createConfluencePage,
  updateConfluencePage,
  archiveConfluencePage,
  createConfluenceTools,
} from '../../src/web/confluence/index.js';

describe('Confluence Tools', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ATLASSIAN_API_KEY = 'test-api-key';
    process.env.ATLASSIAN_EMAIL = 'test@example.com';
    process.env.ATLASSIAN_SITE_URL = 'https://test.atlassian.net';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Tool Metadata', () => {
    it('searchConfluence should have correct metadata', () => {
      expect(searchConfluence.metadata.name).toBe('search-confluence');
      expect(searchConfluence.metadata.description).toContain('Search');
      expect(searchConfluence.metadata.category).toBe('web');
      expect(searchConfluence.metadata.tags).toContain('confluence');
      expect(searchConfluence.metadata.tags).toContain('search');
    });

    it('getConfluencePage should have correct metadata', () => {
      expect(getConfluencePage.metadata.name).toBe('get-confluence-page');
      expect(getConfluencePage.metadata.description).toContain('page');
      expect(getConfluencePage.metadata.category).toBe('web');
      expect(getConfluencePage.metadata.tags).toContain('confluence');
    });

    it('listConfluenceSpaces should have correct metadata', () => {
      expect(listConfluenceSpaces.metadata.name).toBe('list-confluence-spaces');
      expect(listConfluenceSpaces.metadata.description).toContain('spaces');
      expect(listConfluenceSpaces.metadata.category).toBe('web');
      expect(listConfluenceSpaces.metadata.tags).toContain('confluence');
    });

    it('getSpacePages should have correct metadata', () => {
      expect(getSpacePages.metadata.name).toBe('get-space-pages');
      expect(getSpacePages.metadata.description).toContain('pages');
      expect(getSpacePages.metadata.category).toBe('web');
      expect(getSpacePages.metadata.tags).toContain('confluence');
    });

    it('createConfluencePage should have correct metadata', () => {
      expect(createConfluencePage.metadata.name).toBe('create-confluence-page');
      expect(createConfluencePage.metadata.description).toContain('Create');
      expect(createConfluencePage.metadata.category).toBe('web');
      expect(createConfluencePage.metadata.tags).toContain('confluence');
    });

    it('updateConfluencePage should have correct metadata', () => {
      expect(updateConfluencePage.metadata.name).toBe('update-confluence-page');
      expect(updateConfluencePage.metadata.description).toContain('Update');
      expect(updateConfluencePage.metadata.category).toBe('web');
      expect(updateConfluencePage.metadata.tags).toContain('confluence');
    });

    it('archiveConfluencePage should have correct metadata', () => {
      expect(archiveConfluencePage.metadata.name).toBe('archive-confluence-page');
      expect(archiveConfluencePage.metadata.description).toContain('Archive');
      expect(archiveConfluencePage.metadata.category).toBe('web');
      expect(archiveConfluencePage.metadata.tags).toContain('confluence');
    });
  });

  describe('searchConfluence', () => {
    it('should search for pages successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: '123',
              type: 'page',
              title: 'Test Page',
              space: { key: 'TEST', name: 'Test Space' },
              version: { number: 1 },
              _links: { webui: '/wiki/spaces/TEST/pages/123' },
            },
          ],
          size: 1,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await searchConfluence.invoke({
        query: 'test query',
        limit: 10,
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('results');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Test Page');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/search',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            Accept: 'application/json',
          }),
          params: expect.objectContaining({
            cql: 'test query',
            limit: 10,
          }),
        })
      );
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          results: [],
          size: 0,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await searchConfluence.invoke({
        query: 'nonexistent',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

      const resultString = await searchConfluence.invoke({
        query: 'test',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });

    it('should limit results to maximum of 25', async () => {
      const mockResponse = {
        data: { results: [], size: 0 },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      await searchConfluence.invoke({
        query: 'test',
        limit: 100,
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 25,
          }),
        })
      );
    });
  });

  describe('getConfluencePage', () => {
    it('should get a page successfully', async () => {
      const mockResponse = {
        data: {
          id: '123',
          type: 'page',
          title: 'Test Page',
          body: {
            storage: {
              value: '<p>Test content</p>',
            },
          },
          space: { key: 'TEST', name: 'Test Space' },
          version: { number: 1 },
          _links: { webui: '/wiki/spaces/TEST/pages/123' },
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await getConfluencePage.invoke({
        page_id: '123',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.page.title).toBe('Test Page');
      expect(result.page.content).toContain('Test content');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
          params: expect.objectContaining({
            expand: 'body.storage,space,version,history',
          }),
        })
      );
    });

    it('should handle page not found', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Not found',
      });

      const resultString = await getConfluencePage.invoke({
        page_id: 'nonexistent',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });

  describe('listConfluenceSpaces', () => {
    it('should list spaces successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: '1',
              key: 'TEST',
              name: 'Test Space',
              type: 'global',
              _links: { webui: '/wiki/spaces/TEST' },
            },
          ],
          size: 1,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await listConfluenceSpaces.invoke({
        limit: 10,
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.spaces).toHaveLength(1);
      expect(result.spaces[0].name).toBe('Test Space');
    });

    it('should handle empty spaces list', async () => {
      const mockResponse = {
        data: {
          results: [],
          size: 0,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await listConfluenceSpaces.invoke({});
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.spaces).toHaveLength(0);
    });
  });

  describe('getSpacePages', () => {
    it('should get pages from a space successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: '123',
              type: 'page',
              title: 'Page 1',
              space: { key: 'TEST' },
              version: { number: 1 },
              _links: { webui: '/wiki/spaces/TEST/pages/123' },
            },
          ],
          size: 1,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const resultString = await getSpacePages.invoke({
        space_key: 'TEST',
        limit: 10,
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].title).toBe('Page 1');
    });

    it('should handle space not found', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Space not found',
      });

      const resultString = await getSpacePages.invoke({
        space_key: 'NONEXISTENT',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Space not found');
    });
  });

  describe('createConfluencePage', () => {
    it('should create a page successfully', async () => {
      const mockResponse = {
        data: {
          id: '456',
          type: 'page',
          title: 'New Page',
          space: { key: 'TEST' },
          version: { number: 1 },
          _links: { webui: '/wiki/spaces/TEST/pages/456' },
        },
      };

      mockAxiosPost.mockResolvedValueOnce(mockResponse);

      const resultString = await createConfluencePage.invoke({
        space_key: 'TEST',
        title: 'New Page',
        content: '<p>New content</p>',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.page.id).toBe('456');
      expect(result.page.title).toBe('New Page');
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content',
        expect.objectContaining({
          type: 'page',
          title: 'New Page',
          space: { key: 'TEST' },
          body: {
            storage: {
              value: '<p>New content</p>',
              representation: 'storage',
            },
          },
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should create a page with parent', async () => {
      const mockResponse = {
        data: {
          id: '456',
          type: 'page',
          title: 'Child Page',
          space: { key: 'TEST' },
          version: { number: 1 },
          _links: { webui: '/wiki/spaces/TEST/pages/456' },
        },
      };

      mockAxiosPost.mockResolvedValueOnce(mockResponse);

      const resultString = await createConfluencePage.invoke({
        space_key: 'TEST',
        title: 'Child Page',
        content: '<p>Content</p>',
        parent_page_id: '123',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ancestors: [{ id: '123' }],
        }),
        expect.any(Object)
      );
    });

    it('should handle creation errors', async () => {
      mockAxiosPost.mockRejectedValueOnce({
        response: { status: 400 },
        message: 'Invalid request',
      });

      const resultString = await createConfluencePage.invoke({
        space_key: 'TEST',
        title: 'New Page',
        content: '<p>Content</p>',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('updateConfluencePage', () => {
    it('should update a page successfully', async () => {
      const mockGetResponse = {
        data: {
          id: '123',
          version: { number: 5 },
        },
      };

      const mockUpdateResponse = {
        data: {
          id: '123',
          type: 'page',
          title: 'Updated Page',
          space: { key: 'TEST' },
          version: { number: 6 },
          _links: { webui: '/wiki/spaces/TEST/pages/123' },
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockGetResponse);
      mockAxiosPut.mockResolvedValueOnce(mockUpdateResponse);

      const resultString = await updateConfluencePage.invoke({
        page_id: '123',
        title: 'Updated Page',
        content: '<p>Updated content</p>',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.page.title).toBe('Updated Page');
      expect(result.page.version).toBe(6);
      expect(mockAxiosPut).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123',
        expect.objectContaining({
          version: { number: 6 },
          title: 'Updated Page',
          type: 'page',
          body: {
            storage: {
              value: '<p>Updated content</p>',
              representation: 'storage',
            },
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle update errors', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Page not found',
      });

      const resultString = await updateConfluencePage.invoke({
        page_id: 'nonexistent',
        title: 'Updated',
        content: '<p>Content</p>',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Page not found');
    });
  });

  describe('archiveConfluencePage', () => {
    it('should archive a page successfully', async () => {
      const mockGetResponse = {
        data: {
          id: '123',
          title: 'Test Page',
          type: 'page',
          space: { key: 'TEST' },
          version: { number: 5 },
          body: { storage: { value: '<p>Content</p>', representation: 'storage' } },
        },
      };

      const mockPutResponse = {
        data: {
          id: '123',
          title: 'Test Page',
          version: { number: 6 },
          status: 'trashed',
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockGetResponse);
      mockAxiosPut.mockResolvedValueOnce(mockPutResponse);

      const resultString = await archiveConfluencePage.invoke({
        page_id: '123',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(true);
      expect(result.archived.note).toContain('trash');
      expect(mockAxiosGet).toHaveBeenCalled();
      expect(mockAxiosPut).toHaveBeenCalled();
    });

    it('should handle archive errors', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Page not found' } },
        message: 'Page not found',
      });

      const resultString = await archiveConfluencePage.invoke({
        page_id: 'nonexistent',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Page not found');
    });
  });

  describe('Configuration and Error Handling', () => {
    it('should throw error when credentials are missing', async () => {
      delete process.env.ATLASSIAN_API_KEY;
      delete process.env.ATLASSIAN_EMAIL;
      delete process.env.ATLASSIAN_SITE_URL;

      const resultString = await searchConfluence.invoke({
        query: 'test',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });

    it('should handle network errors', async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error('Network error'));

      const resultString = await searchConfluence.invoke({
        query: 'test',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle 401 unauthorized errors', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Unauthorized',
      });

      const resultString = await searchConfluence.invoke({
        query: 'test',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should handle 403 forbidden errors', async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: { status: 403 },
        message: 'Forbidden',
      });

      const resultString = await getConfluencePage.invoke({
        page_id: '123',
      });
      const result = JSON.parse(resultString);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden');
    });
  });

  describe('createConfluenceTools Factory', () => {
    it('should create tools with custom credentials', async () => {
      const mockResponse = {
        data: {
          results: [],
          size: 0,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const tools = createConfluenceTools({
        apiKey: 'custom-api-key',
        email: 'custom@example.com',
        siteUrl: 'https://custom.atlassian.net',
      });

      await tools.searchConfluence.invoke({
        query: 'test',
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://custom.atlassian.net/wiki/rest/api/content/search',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should fall back to env vars when no config provided', async () => {
      process.env.ATLASSIAN_API_KEY = 'env-api-key';
      process.env.ATLASSIAN_EMAIL = 'env@example.com';
      process.env.ATLASSIAN_SITE_URL = 'https://env.atlassian.net';

      const mockResponse = {
        data: {
          results: [],
          size: 0,
        },
      };

      mockAxiosGet.mockResolvedValueOnce(mockResponse);

      const tools = createConfluenceTools({});

      await tools.searchConfluence.invoke({
        query: 'test',
      });

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://env.atlassian.net/wiki/rest/api/content/search',
        expect.any(Object)
      );
    });

    it('should create isolated tool instances', () => {
      const tools1 = createConfluenceTools({
        apiKey: 'key1',
        email: 'user1@example.com',
        siteUrl: 'https://site1.atlassian.net',
      });

      const tools2 = createConfluenceTools({
        apiKey: 'key2',
        email: 'user2@example.com',
        siteUrl: 'https://site2.atlassian.net',
      });

      expect(tools1.searchConfluence).toBeDefined();
      expect(tools2.searchConfluence).toBeDefined();
      expect(tools1.getConfluencePage).toBeDefined();
      expect(tools2.getConfluencePage).toBeDefined();
      expect(tools1.listConfluenceSpaces).toBeDefined();
      expect(tools2.listConfluenceSpaces).toBeDefined();
      expect(tools1.getSpacePages).toBeDefined();
      expect(tools2.getSpacePages).toBeDefined();
      expect(tools1.createConfluencePage).toBeDefined();
      expect(tools2.createConfluencePage).toBeDefined();
      expect(tools1.updateConfluencePage).toBeDefined();
      expect(tools2.updateConfluencePage).toBeDefined();
      expect(tools1.archiveConfluencePage).toBeDefined();
      expect(tools2.archiveConfluencePage).toBeDefined();
    });

    it('should support all 7 tools in factory output', () => {
      const tools = createConfluenceTools({
        apiKey: 'test-key',
        email: 'test@example.com',
        siteUrl: 'https://test.atlassian.net',
      });

      expect(tools.searchConfluence.metadata.name).toBe('search-confluence');
      expect(tools.getConfluencePage.metadata.name).toBe('get-confluence-page');
      expect(tools.listConfluenceSpaces.metadata.name).toBe('list-confluence-spaces');
      expect(tools.getSpacePages.metadata.name).toBe('get-space-pages');
      expect(tools.createConfluencePage.metadata.name).toBe('create-confluence-page');
      expect(tools.updateConfluencePage.metadata.name).toBe('update-confluence-page');
      expect(tools.archiveConfluencePage.metadata.name).toBe('archive-confluence-page');
    });
  });
});
