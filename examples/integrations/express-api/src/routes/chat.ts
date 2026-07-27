import { Router } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { z } from 'zod';
import { createConversationStore, normalizeOwnerId, type ChatMessage } from './conversation-store.js';

const router = Router();

// In-memory conversation storage (use Redis/DB in production).
// The demo owner header must be replaced with verified application identity.
const conversations = createConversationStore();

// Initialize model
const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7,
});

const agent = createReActAgent({
  model,
  tools: [],
  systemPrompt: 'You are a helpful conversational AI assistant.',
});

const compiledAgent = agent.compile();

// Validation schema
const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(5000),
});

/**
 * Send a chat message
 * POST /api/chat/message
 * 
 * Body:
 * {
 *   "conversationId": "optional-id",
 *   "message": "Hello!"
 * }
 *
 * Header:
 * X-Demo-User-Id: user-123
 */
router.post('/message', async (req, res) => {
  try {
    const ownerId = normalizeOwnerId(req.get('x-demo-user-id'));
    if (!ownerId) {
      return res.status(401).json({
        error: 'Missing conversation owner',
        message: 'Provide X-Demo-User-Id for this demo; replace it with verified application identity in production.',
      });
    }

    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
    }

    const { conversationId = `conv-${Date.now()}`, message } = validation.data;

    // Get or create conversation history
    const conversation = conversations.get(ownerId, conversationId) || { conversationId, messages: [] as ChatMessage[] };
    const history = conversation.messages;
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Invoke agent with full history
    const result = await compiledAgent.invoke({
      messages: history,
    });

    const response = String(result.messages[result.messages.length - 1].content);
    
    // Add assistant response to history
    history.push({ role: 'assistant', content: response });
    conversations.set(ownerId, conversation);

    res.json({
      success: true,
      conversationId,
      message: response,
      messageCount: history.length,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown chat error',
    });
  }
});

/**
 * Get conversation history
 * GET /api/chat/history/:conversationId
 */
router.get('/history/:conversationId', (req, res) => {
  const ownerId = normalizeOwnerId(req.get('x-demo-user-id'));
  if (!ownerId) {
    return res.status(401).json({
      error: 'Missing conversation owner',
      message: 'Provide X-Demo-User-Id for this demo; replace it with verified application identity in production.',
    });
  }

  const { conversationId } = req.params;
  const conversation = conversations.get(ownerId, conversationId);

  if (!conversation) {
    return res.status(404).json({
      error: 'Conversation not found',
    });
  }

  res.json({
    conversationId,
    messages: conversation.messages,
    messageCount: conversation.messages.length,
  });
});

/**
 * Clear conversation history
 * DELETE /api/chat/history/:conversationId
 */
router.delete('/history/:conversationId', (req, res) => {
  const ownerId = normalizeOwnerId(req.get('x-demo-user-id'));
  if (!ownerId) {
    return res.status(401).json({
      error: 'Missing conversation owner',
      message: 'Provide X-Demo-User-Id for this demo; replace it with verified application identity in production.',
    });
  }

  const { conversationId } = req.params;
  const existed = conversations.delete(ownerId, conversationId);

  res.json({
    success: true,
    deleted: existed,
  });
});

/**
 * List all conversations
 * GET /api/chat/conversations
 */
router.get('/conversations', (req, res) => {
  const ownerId = normalizeOwnerId(req.get('x-demo-user-id'));
  if (!ownerId) {
    return res.status(401).json({
      error: 'Missing conversation owner',
      message: 'Provide X-Demo-User-Id for this demo; replace it with verified application identity in production.',
    });
  }

  const conversationList = conversations.list(ownerId).map(({ conversationId, messages }) => ({
    conversationId,
    messageCount: messages.length,
  }));

  res.json({
    conversations: conversationList,
    total: conversationList.length,
  });
});

export { router as chatRouter };
