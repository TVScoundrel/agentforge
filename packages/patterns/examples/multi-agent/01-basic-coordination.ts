/**
 * Basic Multi-Agent Coordination Example
 *
 * This example demonstrates the basic usage of the Multi-Agent Coordination pattern
 * where a supervisor coordinates multiple specialized worker agents.
 *
 * The Multi-Agent pattern is useful when you need:
 * - Multiple specialized agents working together
 * - Task routing based on agent capabilities
 * - Parallel or sequential task execution
 * - Result aggregation from multiple agents
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/multi-agent/01-basic-coordination.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { MultiAgentSystemBuilder } from '../../src/multi-agent/index.js';
import { z } from 'zod';

// Define worker tools
const mathTool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  schema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
  }),
  metadata: {
    category: 'computation',
  },
  invoke: async ({ expression }: { expression: string }) => {
    console.log(`  [Math Worker] Calculating: ${expression}`);
    // Simple eval for demo (don't use in production!)
    const result = eval(expression);
    return { result, expression };
  },
};

const weatherTool = {
  name: 'get_weather',
  description: 'Get weather information for a location',
  schema: z.object({
    location: z.string().describe('City name'),
  }),
  metadata: {
    category: 'data',
  },
  invoke: async ({ location }: { location: string }) => {
    console.log(`  [Weather Worker] Fetching weather for: ${location}`);
    // Simulated weather data
    const conditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy'];
    const temp = Math.floor(Math.random() * 30) + 10;
    return {
      location,
      temperature: temp,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 40) + 40,
    };
  },
};

const translationTool = {
  name: 'translate',
  description: 'Translate text to another language',
  schema: z.object({
    text: z.string().describe('Text to translate'),
    targetLanguage: z.string().describe('Target language'),
  }),
  metadata: {
    category: 'language',
  },
  invoke: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
    console.log(`  [Translation Worker] Translating to ${targetLanguage}: ${text}`);
    // Simulated translation
    return {
      original: text,
      translated: `[${targetLanguage.toUpperCase()}] ${text}`,
      targetLanguage,
    };
  },
};

async function main() {
  console.log('🤝 Basic Multi-Agent Coordination Example\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a multi-agent system with round-robin routing
  const builder = new MultiAgentSystemBuilder({
    supervisor: {
      model: llm,
      strategy: 'round-robin',
      systemPrompt: 'You are a supervisor coordinating specialized workers.',
    },
    aggregator: {
      model: llm,
      systemPrompt: 'Combine results from multiple workers into a coherent response.',
    },
    maxIterations: 5,
    verbose: true,
  });

  // Register specialized workers
  builder.registerWorkers([
    {
      name: 'math_worker',
      description: 'Specialized in mathematical calculations and numerical analysis',
      capabilities: ['mathematics', 'calculations', 'numbers'],
      tools: [mathTool],
      systemPrompt: 'You are a mathematics expert. Solve mathematical problems accurately.',
    },
    {
      name: 'weather_worker',
      description: 'Specialized in weather information and forecasts',
      capabilities: ['weather', 'climate', 'temperature'],
      tools: [weatherTool],
      systemPrompt: 'You are a weather expert. Provide accurate weather information.',
    },
    {
      name: 'translation_worker',
      description: 'Specialized in language translation',
      capabilities: ['translation', 'languages', 'multilingual'],
      tools: [translationTool],
      systemPrompt: 'You are a translation expert. Translate text accurately.',
    },
  ]);

  // Build the system
  const system = builder.build();

  // Example 1: Simple task routing
  console.log('📝 Example 1: Simple Task Routing');
  console.log('Question: What is 25 multiplied by 4?\n');

  const result1 = await system.invoke({
    input: 'What is 25 multiplied by 4?',
  });

  console.log('\n✅ Final Response:');
  console.log(`  ${result1.response}\n`);

  // Example 2: Multiple workers
  console.log('='.repeat(80));
  console.log('\n📝 Example 2: Multiple Workers');
  console.log('Question: What is the weather in Paris and translate "Hello" to French?\n');

  const result2 = await system.invoke({
    input: 'What is the weather in Paris and translate "Hello" to French?',
  });

  console.log('\n✅ Final Response:');
  console.log(`  ${result2.response}\n`);

  console.log('='.repeat(80));
}

// Run the example
main().catch(console.error);

