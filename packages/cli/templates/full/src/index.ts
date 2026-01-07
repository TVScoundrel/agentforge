import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { createLogger } from '@agentforge/core';
import { exampleTool } from './tools/example.js';

const logger = createLogger({ level: 'info' });

/**
 * Main entry point for {{PROJECT_NAME}}
 */
async function main() {
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

  // Compile the agent
  const compiledAgent = agent.compile();

  // Run the agent
  logger.info('Running agent...');
  const result = await compiledAgent.invoke({
    messages: [
      {
        role: 'user',
        content: 'Use the example tool to greet me!',
      },
    ],
  });

  logger.info('✅ Agent completed');
  console.log('\nFinal response:');
  console.log(result.messages[result.messages.length - 1].content);
}

// Run the main function
main().catch((error) => {
  logger.error('❌ Error:', error);
  process.exit(1);
});

