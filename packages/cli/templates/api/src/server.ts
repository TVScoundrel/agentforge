import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createLogger } from '@agentforge/core';
import { agentRouter } from './routes/agent.js';
import { healthRouter } from './routes/health.js';

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missingVars.push('OPENAI_API_KEY');
  }

  if (missingVars.length > 0) {
    console.error('❌ Error: Missing required environment variables\n');
    console.error('Missing variables:');
    missingVars.forEach((varName) => {
      console.error(`  - ${varName}`);
    });
    console.error('\n📝 To fix this:');
    console.error('  1. Copy .env.example to .env:');
    console.error('     cp .env.example .env');
    console.error('  2. Edit .env and add your API keys');
    console.error('  3. Run the application again\n');
    process.exit(1);
  }
}

// Validate environment before starting
validateEnvironment();

const logger = createLogger('{{PROJECT_NAME}}');
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

