import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';

/**
 * Main entry point for {{PROJECT_NAME}}
 */
async function main() {
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

  // Compile the agent
  const compiledAgent = agent.compile();

  // Run the agent
  const result = await compiledAgent.invoke({
    messages: [{ role: 'user', content: 'Hello! What can you help me with?' }],
  });

  console.log('\n✅ Agent response:');
  console.log(result.messages[result.messages.length - 1].content);
}

// Run the main function
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

