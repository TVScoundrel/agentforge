/**
 * Slack Tools Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that will be accessible in vi.mock factory
const { mockPostMessage, mockConversationsList, mockConversationsHistory, mockWebClient } = vi.hoisted(() => {
  const mockPostMessage = vi.fn();
  const mockConversationsList = vi.fn();
  const mockConversationsHistory = vi.fn();
  const mockWebClient = vi.fn().mockImplementation(() => ({
    chat: {
      postMessage: mockPostMessage,
    },
    conversations: {
      list: mockConversationsList,
      history: mockConversationsHistory,
    },
  }));

  return {
    mockPostMessage,
    mockConversationsList,
    mockConversationsHistory,
    mockWebClient,
  };
});

// Mock @slack/web-api BEFORE importing the tools
vi.mock('@slack/web-api', () => ({
  WebClient: mockWebClient,
}));

// Import tools AFTER mocking
import {
  sendSlackMessage,
  notifySlack,
  getSlackChannels,
  getSlackMessages,
  createSlackTools,
} from '../../src/web/slack.js';

describe('Slack Tools', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Tool Metadata', () => {
    it('sendSlackMessage should have correct metadata', () => {
      expect(sendSlackMessage.metadata.name).toBe('send-slack-message');
      expect(sendSlackMessage.metadata.description).toContain('Send a message');
      expect(sendSlackMessage.metadata.category).toBe('web');
      expect(sendSlackMessage.metadata.tags).toContain('slack');
      expect(sendSlackMessage.metadata.tags).toContain('messaging');
    });

    it('notifySlack should have correct metadata', () => {
      expect(notifySlack.metadata.name).toBe('notify-slack');
      expect(notifySlack.metadata.description).toContain('notification');
      expect(notifySlack.metadata.category).toBe('web');
      expect(notifySlack.metadata.tags).toContain('slack');
      expect(notifySlack.metadata.tags).toContain('notification');
    });

    it('getSlackChannels should have correct metadata', () => {
      expect(getSlackChannels.metadata.name).toBe('get-slack-channels');
      expect(getSlackChannels.metadata.description).toContain('list');
      expect(getSlackChannels.metadata.category).toBe('web');
      expect(getSlackChannels.metadata.tags).toContain('slack');
      expect(getSlackChannels.metadata.tags).toContain('channels');
    });

    it('getSlackMessages should have correct metadata', () => {
      expect(getSlackMessages.metadata.name).toBe('get-slack-messages');
      expect(getSlackMessages.metadata.description).toContain('message history');
      expect(getSlackMessages.metadata.category).toBe('web');
      expect(getSlackMessages.metadata.tags).toContain('slack');
      expect(getSlackMessages.metadata.tags).toContain('messages');
    });
  });

  describe('sendSlackMessage', () => {
    beforeEach(() => {
      process.env.SLACK_USER_TOKEN = 'xoxp-test-token';
    });

    it('should send a message successfully', async () => {
      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const result = await sendSlackMessage.execute({
        channel: 'general',
        message: 'Hello, world!',
      });

      expect(result).toEqual({
        success: true,
        data: {
          channel: 'C123456',
          message: 'Hello, world!',
          timestamp: '1234567890.123456',
          message_id: '1234567890.123456',
        },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'general',
        text: 'Hello, world!',
        username: 'AgentForge Bot',
        icon_emoji: ':robot_face:',
      });
    });

    it('should return error when token is not configured', async () => {
      delete process.env.SLACK_USER_TOKEN;
      delete process.env.SLACK_BOT_TOKEN;

      // Need to reset the module to clear the cached client
      vi.resetModules();

      const { sendSlackMessage: freshTool } = await import('../../src/web/slack.js');
      const result = await freshTool.execute({
        channel: 'general',
        message: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack token not configured');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('channel_not_found');
      (mockError as any).data = { error: 'channel_not_found' };

      mockPostMessage.mockRejectedValueOnce(mockError);

      const result = await sendSlackMessage.execute({
        channel: 'nonexistent',
        message: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('channel_not_found');
    });
  });

  describe('notifySlack', () => {
    beforeEach(() => {
      process.env.SLACK_USER_TOKEN = 'xoxp-test-token';
    });

    it('should send notification without mentions', async () => {
      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const result = await notifySlack.execute({
        channel: 'alerts',
        message: 'System alert!',
      });

      expect(result).toEqual({
        success: true,
        data: {
          channel: 'C123456',
          message: 'System alert!',
          mentions: [],
          timestamp: '1234567890.123456',
          notification_id: '1234567890.123456',
        },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'alerts',
        text: 'System alert!',
        username: 'AgentForge Bot',
        icon_emoji: ':robot_face:',
      });
    });

    it('should send notification with mentions', async () => {
      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const result = await notifySlack.execute({
        channel: 'alerts',
        message: 'Critical issue!',
        mentions: ['john', 'jane'],
      });

      expect(result).toEqual({
        success: true,
        data: {
          channel: 'C123456',
          message: '<@john> <@jane> Critical issue!',
          mentions: ['john', 'jane'],
          timestamp: '1234567890.123456',
          notification_id: '1234567890.123456',
        },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'alerts',
        text: '<@john> <@jane> Critical issue!',
        username: 'AgentForge Bot',
        icon_emoji: ':robot_face:',
      });
    });
  });

  describe('getSlackChannels', () => {
    beforeEach(() => {
      process.env.SLACK_USER_TOKEN = 'xoxp-test-token';
    });

    it('should list public channels only', async () => {
      const mockResponse = {
        ok: true,
        channels: [
          { id: 'C1', name: 'general', is_private: false, num_members: 10 },
          { id: 'C2', name: 'random', is_private: false, num_members: 5 },
        ],
      };

      mockConversationsList.mockResolvedValueOnce(mockResponse);

      const result = await getSlackChannels.execute({
        include_private: false,
      });

      expect(result).toEqual({
        success: true,
        data: {
          count: 2,
          channels: [
            { id: 'C1', name: 'general', is_private: false, num_members: 10 },
            { id: 'C2', name: 'random', is_private: false, num_members: 5 },
          ],
        },
      });

      expect(mockConversationsList).toHaveBeenCalledWith({
        types: 'public_channel',
        exclude_archived: true,
      });
      expect(mockConversationsList).toHaveBeenCalledTimes(1);
    });

    it('should list public and private channels', async () => {
      const mockPublicResponse = {
        ok: true,
        channels: [{ id: 'C1', name: 'general', is_private: false, num_members: 10 }],
      };

      const mockPrivateResponse = {
        ok: true,
        channels: [{ id: 'C2', name: 'private', is_private: true, num_members: 3 }],
      };

      mockConversationsList
        .mockResolvedValueOnce(mockPublicResponse)
        .mockResolvedValueOnce(mockPrivateResponse);

      const result = await getSlackChannels.execute({
        include_private: true,
      });

      expect(result).toEqual({
        success: true,
        data: {
          count: 2,
          channels: [
            { id: 'C1', name: 'general', is_private: false, num_members: 10 },
            { id: 'C2', name: 'private', is_private: true, num_members: 3 },
          ],
        },
      });

      expect(mockConversationsList).toHaveBeenCalledTimes(2);
      expect(mockConversationsList).toHaveBeenNthCalledWith(1, {
        types: 'public_channel',
        exclude_archived: true,
      });
      expect(mockConversationsList).toHaveBeenNthCalledWith(2, {
        types: 'private_channel',
        exclude_archived: true,
      });
    });
  });

  describe('getSlackMessages', () => {
    beforeEach(() => {
      process.env.SLACK_USER_TOKEN = 'xoxp-test-token';
    });

    it('should get messages by channel ID', async () => {
      const mockResponse = {
        ok: true,
        messages: [
          {
            user: 'U123',
            text: 'Hello!',
            ts: '1234567890.123456',
            type: 'message',
          },
          {
            user: 'U456',
            text: 'Hi there!',
            ts: '1234567891.123456',
            type: 'message',
          },
        ],
      };

      mockConversationsHistory.mockResolvedValueOnce(mockResponse);

      const result = await getSlackMessages.execute({
        channel: 'C123456',
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data?.channel).toBe('C123456');
      expect(result.data?.count).toBe(2);
      expect(result.data?.messages).toHaveLength(2);
      expect(result.data?.messages[0]).toMatchObject({
        user: 'U123',
        text: 'Hello!',
        timestamp: '1234567890.123456',
        type: 'message',
      });

      expect(mockConversationsHistory).toHaveBeenCalledWith({
        channel: 'C123456',
        limit: 20,
      });
    });

    it('should get messages by channel name', async () => {
      const mockChannelsResponse = {
        ok: true,
        channels: [
          { id: 'C123456', name: 'general', is_private: false },
        ],
      };

      const mockMessagesResponse = {
        ok: true,
        messages: [
          {
            user: 'U123',
            text: 'Test message',
            ts: '1234567890.123456',
            type: 'message',
          },
        ],
      };

      mockConversationsList.mockResolvedValueOnce(mockChannelsResponse);
      mockConversationsHistory.mockResolvedValueOnce(mockMessagesResponse);

      const result = await getSlackMessages.execute({
        channel: 'general',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.channel).toBe('C123456');
      expect(result.data?.count).toBe(1);
      expect(result.data?.messages).toHaveLength(1);

      expect(mockConversationsList).toHaveBeenCalled();
      expect(mockConversationsHistory).toHaveBeenCalledWith({
        channel: 'C123456',
        limit: 10,
      });
    });

    it('should return error when channel not found', async () => {
      const mockChannelsResponse = {
        ok: true,
        channels: [],
      };

      mockConversationsList.mockResolvedValueOnce(mockChannelsResponse);

      const result = await getSlackMessages.execute({
        channel: 'nonexistent',
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should respect limit parameter', async () => {
      const mockResponse = {
        ok: true,
        messages: Array(50)
          .fill(null)
          .map((_, i) => ({
            user: 'U123',
            text: `Message ${i}`,
            ts: `${1234567890 + i}.123456`,
            type: 'message',
          })),
      };

      mockConversationsHistory.mockResolvedValueOnce(mockResponse);

      const result = await getSlackMessages.execute({
        channel: 'C123456',
        limit: 50,
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(50);
      expect(mockConversationsHistory).toHaveBeenCalledWith({
        channel: 'C123456',
        limit: 50,
      });
    });

    it('should cap limit at 100', async () => {
      const mockResponse = {
        ok: true,
        messages: [],
      };

      mockConversationsHistory.mockResolvedValueOnce(mockResponse);

      const result = await getSlackMessages.execute({
        channel: 'C123456',
        limit: 200,
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(0);
      expect(mockConversationsHistory).toHaveBeenCalledWith({
        channel: 'C123456',
        limit: 100,
      });
    });

    it('should handle empty message history', async () => {
      const mockResponse = {
        ok: true,
        messages: [],
      };

      mockConversationsHistory.mockResolvedValueOnce(mockResponse);

      const result = await getSlackMessages.execute({
        channel: 'C123456',
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(0);
      expect(result.data?.messages).toEqual([]);
    });
  });

  describe('createSlackTools Factory Function', () => {
    it('should create tools with custom token', async () => {
      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const tools = createSlackTools({
        token: 'xoxb-custom-token',
      });

      const result = await tools.sendMessage.execute({
        channel: 'general',
        message: 'Test with custom token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        channel: 'C123456',
        message: 'Test with custom token',
      });
      expect(mockWebClient).toHaveBeenCalledWith('xoxb-custom-token');
    });

    it('should create tools with custom bot name and icon', async () => {
      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const tools = createSlackTools({
        token: 'xoxb-test',
        botName: 'Custom Bot',
        botIcon: ':rocket:',
      });

      await tools.sendMessage.execute({
        channel: 'general',
        message: 'Test message',
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'general',
        text: 'Test message',
        username: 'Custom Bot',
        icon_emoji: ':rocket:',
      });
    });

    it('should fall back to env vars when no token provided', async () => {
      process.env.SLACK_USER_TOKEN = 'xoxp-env-token';

      const mockResponse = {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };

      mockPostMessage.mockResolvedValueOnce(mockResponse);

      const tools = createSlackTools({});

      await tools.sendMessage.execute({
        channel: 'general',
        message: 'Test',
      });

      expect(mockWebClient).toHaveBeenCalledWith('xoxp-env-token');
    });

    it('should return error when no token available', async () => {
      delete process.env.SLACK_USER_TOKEN;
      delete process.env.SLACK_BOT_TOKEN;

      const tools = createSlackTools({});

      const result = await tools.sendMessage.execute({
        channel: 'general',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack token not configured');
    });

    it('should create isolated tool instances', async () => {
      const tools1 = createSlackTools({ token: 'token1' });
      const tools2 = createSlackTools({ token: 'token2' });

      expect(tools1.sendMessage).toBeDefined();
      expect(tools2.sendMessage).toBeDefined();
      expect(tools1.notify).toBeDefined();
      expect(tools2.notify).toBeDefined();
      expect(tools1.getChannels).toBeDefined();
      expect(tools2.getChannels).toBeDefined();
      expect(tools1.getMessages).toBeDefined();
      expect(tools2.getMessages).toBeDefined();
    });

    it('should support all 4 tools in factory output', () => {
      const tools = createSlackTools({ token: 'xoxb-test' });

      expect(tools.sendMessage.metadata.name).toBe('send-slack-message');
      expect(tools.notify.metadata.name).toBe('notify-slack');
      expect(tools.getChannels.metadata.name).toBe('get-slack-channels');
      expect(tools.getMessages.metadata.name).toBe('get-slack-messages');
    });
  });
});
