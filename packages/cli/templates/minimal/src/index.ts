import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';

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

  console.log('🚀 Starting {{PROJECT_NAME}}...\n');

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a simple ReAct agent
  const agent = createReActAgent({
    model,
    tools: [],
    systemPrompt: 'You are a helpful AI assistant.',
  });

  // Run the agent
  const result = await agent.invoke({
    messages: [{ role: 'user', content: 'Hello! What can you help me with?' }],
  });

  console.log('\n✅ Agent response:');
  const messages = result.messages as Array<{ content: string }>;
  const lastMessage = messages[messages.length - 1];
  console.log(lastMessage?.content || 'No response');
}

// Run the main function
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

