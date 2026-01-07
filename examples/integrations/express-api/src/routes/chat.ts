import { Router } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { z } from 'zod';

const router = Router();

// In-memory conversation storage (use Redis/DB in production)
const conversations = new Map<string, any[]>();

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
 */
router.post('/message', async (req, res) => {
  try {
    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
    }

    const { conversationId = `conv-${Date.now()}`, message } = validation.data;

    // Get or create conversation history
    const history = conversations.get(conversationId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });

    // Invoke agent with full history
    const result = await compiledAgent.invoke({
      messages: history,
    });

    const response = result.messages[result.messages.length - 1].content;
    
    // Add assistant response to history
    history.push({ role: 'assistant', content: response });
    conversations.set(conversationId, history);

    res.json({
      success: true,
      conversationId,
      message: response,
      messageCount: history.length,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get conversation history
 * GET /api/chat/history/:conversationId
 */
router.get('/history/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const history = conversations.get(conversationId);

  if (!history) {
    return res.status(404).json({
      error: 'Conversation not found',
    });
  }

  res.json({
    conversationId,
    messages: history,
    messageCount: history.length,
  });
});

/**
 * Clear conversation history
 * DELETE /api/chat/history/:conversationId
 */
router.delete('/history/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const existed = conversations.delete(conversationId);

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
  const conversationList = Array.from(conversations.keys()).map(id => ({
    conversationId: id,
    messageCount: conversations.get(id)?.length || 0,
  }));

  res.json({
    conversations: conversationList,
    total: conversationList.length,
  });
});

export { router as chatRouter };

