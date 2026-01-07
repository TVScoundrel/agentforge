import { Router } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { calculator, currentDateTime } from '@agentforge/tools';
import { z } from 'zod';

const router = Router();

// Initialize the agent (singleton pattern for efficiency)
const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7,
});

const agent = createReActAgent({
  model,
  tools: [calculator, currentDateTime],
  systemPrompt: 'You are a helpful AI assistant API. Provide concise, accurate responses.',
  maxIterations: 10,
});

const compiledAgent = agent.compile();

// Request validation schema
const invokeSchema = z.object({
  message: z.string().min(1).max(5000),
  threadId: z.string().optional(),
  config: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
  }).optional(),
});

/**
 * Invoke agent with a message
 * POST /api/agent/invoke
 * 
 * Body:
 * {
 *   "message": "What is 25 * 4?",
 *   "threadId": "optional-thread-id",
 *   "config": {
 *     "temperature": 0.7,
 *     "maxTokens": 1000
 *   }
 * }
 */
router.post('/invoke', async (req, res) => {
  try {
    // Validate request
    const validation = invokeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
    }

    const { message, threadId, config } = validation.data;

    // Invoke the agent
    const startTime = Date.now();
    const result = await compiledAgent.invoke(
      {
        messages: [{ role: 'user', content: message }],
      },
      {
        configurable: {
          thread_id: threadId || `thread-${Date.now()}`,
        },
      }
    );

    const duration = Date.now() - startTime;
    const response = result.messages[result.messages.length - 1].content;

    res.json({
      success: true,
      response,
      threadId: threadId || `thread-${Date.now()}`,
      metadata: {
        duration,
        messageCount: result.messages.length,
        model: process.env.OPENAI_MODEL || 'gpt-4',
      },
    });
  } catch (error: any) {
    console.error('Agent invocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent Error',
      message: error.message,
    });
  }
});

/**
 * Stream agent response
 * POST /api/agent/stream
 * 
 * Returns Server-Sent Events (SSE) stream
 */
router.post('/stream', async (req, res) => {
  try {
    const validation = invokeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
      });
    }

    const { message, threadId } = validation.data;

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    const stream = await compiledAgent.stream(
      {
        messages: [{ role: 'user', content: message }],
      },
      {
        configurable: {
          thread_id: threadId || `thread-${Date.now()}`,
        },
      }
    );

    for await (const chunk of stream) {
      const lastMessage = chunk.messages[chunk.messages.length - 1];
      res.write(`data: ${JSON.stringify({ content: lastMessage.content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * Get agent information
 * GET /api/agent/info
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'ReAct Agent',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    tools: ['calculator', 'currentDateTime'],
    maxIterations: 10,
    capabilities: [
      'Mathematical calculations',
      'Date and time queries',
      'General question answering',
    ],
  });
});

export { router as agentRouter };

