import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { agentRouter } from './routes/agent.js';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import {
  addRequestErrorHandler,
  configureRequestBoundaries,
  type ExpressAppOptions,
} from './request-boundaries.js';

/**
 * Express.js Integration Example
 *
 * This example demonstrates how to integrate AgentForge with Express.js
 * to create a production-ready REST API for AI agents.
 *
 * Features:
 * - RESTful API endpoints
 * - Rate limiting
 * - CORS support
 * - Security headers (helmet)
 * - Error handling
 * - Request logging
 * - Health checks
 */

export function createApp(options: ExpressAppOptions = {}) {
  const app = express();

  // Security middleware
  configureRequestBoundaries(app, options);

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/agent', agentRouter);
  app.use('/api/chat', chatRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'AgentForge Express API',
      version: '0.1.0',
      endpoints: {
        health: '/health',
        agent: '/api/agent',
        chat: '/api/chat',
      },
      docs: '/api/docs',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Error handling middleware
  addRequestErrorHandler(app);

  return app;
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  const app = createApp();
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`\n🚀 AgentForge Express API`);
    console.log(`📍 Server: http://localhost:${port}`);
    console.log(`💚 Health: http://localhost:${port}/health`);
    console.log(`🤖 Agent: http://localhost:${port}/api/agent`);
    console.log(`💬 Chat: http://localhost:${port}/api/chat`);
    console.log(`\n✨ Ready to handle requests!\n`);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}
