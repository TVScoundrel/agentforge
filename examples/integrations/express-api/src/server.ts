import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { agentRouter } from './routes/agent.js';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';

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

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 AgentForge Express API`);
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`💚 Health: http://localhost:${port}/health`);
  console.log(`🤖 Agent: http://localhost:${port}/api/agent`);
  console.log(`💬 Chat: http://localhost:${port}/api/chat`);
  console.log(`\n✨ Ready to handle requests!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

