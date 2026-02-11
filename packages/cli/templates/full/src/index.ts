import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { createLogger } from '@agentforge/core';
import { exampleTool } from './tools/example.js';

const logger = createLogger('{{PROJECT_NAME}}');

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

/**
 * Main entry point for {{PROJECT_NAME}}
 */
async function main() {
  // Validate environment before starting
  validateEnvironment();

  logger.info('🚀 Starting {{PROJECT_NAME}}...');

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0,
  });

  // Create a ReAct agent with tools
  const agent = createReActAgent({
    model,
    tools: [exampleTool],
    systemPrompt: 'You are a helpful AI assistant with access to various tools.',
    maxIterations: 10,
  });

  // Run the agent
  logger.info('Running agent...');
  const result = await agent.invoke({
    messages: [
      {
        role: 'user',
        content: 'Use the example tool to greet me!',
      },
    ],
  });

  logger.info('✅ Agent completed');
  console.log('\nFinal response:');
  const messages = result.messages as Array<{ content: string }>;
  const lastMessage = messages[messages.length - 1];
  console.log(lastMessage?.content || 'No response');
}

// Run the main function
main().catch((error) => {
  logger.error('❌ Error:', error);
  process.exit(1);
});

