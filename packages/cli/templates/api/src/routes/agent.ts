import { Router } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { createLogger } from '@agentforge/core';

const router = Router();
const logger = createLogger({ level: 'info' });

// Initialize the agent
const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0,
});

const agent = createReActAgent({
  model,
  tools: [],
  systemPrompt: 'You are a helpful AI assistant API.',
});

const compiledAgent = agent.compile();

// POST /api/agent/chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    logger.info('Processing chat request');

    const result = await compiledAgent.invoke({
      messages: [{ role: 'user', content: message }],
    });

    const response = result.messages[result.messages.length - 1].content;

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    logger.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as agentRouter };

