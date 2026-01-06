/**
 * Basic ReAct Pattern Example
 *
 * This example demonstrates the basic usage of the ReAct (Reasoning and Action) pattern
 * where the agent thinks, acts, and observes in a loop to solve problems.
 *
 * The ReAct pattern is useful when you need:
 * - Step-by-step reasoning with tool usage
 * - Transparent decision-making process
 * - Ability to use multiple tools in sequence
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/react/01-basic-react.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { createReActAgent } from '../../src/react/index.js';
import { ToolRegistry } from '@agentforge/core';
import { z } from 'zod';

// Define some simple tools
const calculatorTool = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations (add, subtract, multiply, divide)',
  schema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ operation, a, b }: { operation: string; a: number; b: number }) => {
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
};

const weatherTool = {
  name: 'get_weather',
  description: 'Gets the current weather for a location',
  schema: z.object({
    location: z.string().describe('City name or location'),
  }),
  execute: async ({ location }: { location: string }) => {
    // Simulated weather data
    const weatherData: Record<string, any> = {
      'new york': { temp: 72, condition: 'Sunny', humidity: 65 },
      'london': { temp: 58, condition: 'Cloudy', humidity: 80 },
      'tokyo': { temp: 68, condition: 'Rainy', humidity: 75 },
    };

    const normalizedLocation = location.toLowerCase();
    const weather = weatherData[normalizedLocation] || {
      temp: 70,
      condition: 'Unknown',
      humidity: 50,
    };

    return {
      location,
      temperature: weather.temp,
      condition: weather.condition,
      humidity: weather.humidity,
    };
  },
};

async function main() {
  console.log('🤖 Basic ReAct Pattern Example\n');

  // Create a tool registry
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(calculatorTool);
  toolRegistry.register(weatherTool);

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a ReAct agent
  const agent = createReActAgent({
    llm,
    tools: toolRegistry,
    systemPrompt: 'You are a helpful assistant that uses tools to answer questions.',
    maxIterations: 5,
    returnIntermediateSteps: true,
  });

  // Example 1: Simple calculation
  console.log('📝 Example 1: Simple Calculation');
  console.log('Question: What is 15 multiplied by 8?\n');

  const result1 = await agent.invoke({
    messages: [new HumanMessage('What is 15 multiplied by 8?')],
  });

  console.log('💭 Thoughts:');
  result1.thoughts?.forEach((thought: any, idx: number) => {
    console.log(`  ${idx + 1}. ${thought.content}`);
  });

  console.log('\n🔧 Actions:');
  result1.actions?.forEach((action: any, idx: number) => {
    console.log(`  ${idx + 1}. ${action.tool}: ${JSON.stringify(action.arguments)}`);
  });

  console.log('\n👁️  Observations:');
  result1.observations?.forEach((obs: any, idx: number) => {
    console.log(`  ${idx + 1}. ${JSON.stringify(obs.result)}`);
  });

  console.log('\n✅ Final Answer:');
  const finalMessage = result1.messages[result1.messages.length - 1];
  console.log(`  ${finalMessage.content}\n`);

  console.log('='.repeat(80));

  // Example 2: Weather query
  console.log('\n📝 Example 2: Weather Query');
  console.log('Question: What is the weather like in Tokyo?\n');

  const result2 = await agent.invoke({
    messages: [new HumanMessage('What is the weather like in Tokyo?')],
  });

  console.log('💭 Reasoning Process:');
  result2.thoughts?.forEach((thought: any, idx: number) => {
    console.log(`  Step ${idx + 1}: ${thought.content}`);
  });

  console.log('\n✅ Final Answer:');
  const finalMessage2 = result2.messages[result2.messages.length - 1];
  console.log(`  ${finalMessage2.content}\n`);

  console.log('='.repeat(80));
}

// Run the example
main().catch(console.error);

