import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createLogger } from '@agentforge/core';
import { agentRouter } from './routes/agent.js';
import { healthRouter } from './routes/health.js';

const logger = createLogger({ level: 'info' });
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/api/agent', agentRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Server running on http://localhost:${port}`);
  logger.info(`📊 Health check: http://localhost:${port}/health`);
  logger.info(`🤖 Agent API: http://localhost:${port}/api/agent`);
});

