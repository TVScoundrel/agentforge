/**
 * Multi-Step Reasoning with ReAct Pattern
 *
 * This example demonstrates how the ReAct pattern handles complex queries
 * that require multiple reasoning steps and tool calls.
 *
 * This is particularly useful for:
 * - Complex problem-solving
 * - Multi-step calculations
 * - Queries requiring multiple data sources
 * - Tasks with dependencies between steps
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/react/02-multi-step-reasoning.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { createReActAgent } from '../../src/react/index.js';
import { ToolRegistry } from '@agentforge/core';
import { z } from 'zod';

// Define tools for a travel planning scenario
const flightSearchTool = {
  name: 'search_flights',
  description: 'Search for flights between two cities',
  schema: z.object({
    origin: z.string().describe('Origin city'),
    destination: z.string().describe('Destination city'),
    date: z.string().describe('Travel date (YYYY-MM-DD)'),
  }),
  metadata: {
    category: 'travel',
  },
  invoke: async ({ origin, destination, date }: { origin: string; destination: string; date: string }) => {
    // Simulated flight data
    return {
      flights: [
        { airline: 'SkyAir', price: 450, duration: '5h 30m', departure: '08:00' },
        { airline: 'CloudJet', price: 380, duration: '6h 15m', departure: '14:30' },
      ],
      cheapest: { airline: 'CloudJet', price: 380 },
    };
  },
};

const hotelSearchTool = {
  name: 'search_hotels',
  description: 'Search for hotels in a city',
  schema: z.object({
    city: z.string().describe('City name'),
    checkIn: z.string().describe('Check-in date (YYYY-MM-DD)'),
    checkOut: z.string().describe('Check-out date (YYYY-MM-DD)'),
  }),
  metadata: {
    category: 'travel',
  },
  invoke: async ({ city, checkIn, checkOut }: { city: string; checkIn: string; checkOut: string }) => {
    // Simulated hotel data
    return {
      hotels: [
        { name: 'Grand Hotel', price: 150, rating: 4.5, location: 'Downtown' },
        { name: 'Budget Inn', price: 80, rating: 3.8, location: 'Airport' },
        { name: 'Luxury Resort', price: 300, rating: 5.0, location: 'Beach' },
      ],
      recommended: { name: 'Grand Hotel', price: 150, rating: 4.5 },
    };
  },
};

const budgetCalculatorTool = {
  name: 'calculate_budget',
  description: 'Calculate total budget for a trip',
  schema: z.object({
    items: z.array(z.object({
      name: z.string(),
      cost: z.number(),
    })),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ items }: { items: Array<{ name: string; cost: number }> }) => {
    const total = items.reduce((sum, item) => sum + item.cost, 0);
    return {
      items,
      total,
      breakdown: items.map(item => `${item.name}: $${item.cost}`).join(', '),
    };
  },
};

const currencyConverterTool = {
  name: 'convert_currency',
  description: 'Convert currency from one to another',
  schema: z.object({
    amount: z.number().describe('Amount to convert'),
    from: z.string().describe('Source currency (e.g., USD)'),
    to: z.string().describe('Target currency (e.g., EUR)'),
  }),
  metadata: {
    category: 'utility',
  },
  invoke: async ({ amount, from, to }: { amount: number; from: string; to: string }) => {
    // Simulated exchange rates
    const rates: Record<string, number> = {
      'USD-EUR': 0.92,
      'USD-GBP': 0.79,
      'EUR-USD': 1.09,
      'GBP-USD': 1.27,
    };

    const key = `${from}-${to}`;
    const rate = rates[key] || 1;
    const converted = amount * rate;

    return {
      original: { amount, currency: from },
      converted: { amount: converted, currency: to },
      rate,
    };
  },
};

async function main() {
  console.log('🧠 Multi-Step Reasoning with ReAct Pattern\n');

  // Create a tool registry
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(flightSearchTool);
  toolRegistry.register(hotelSearchTool);
  toolRegistry.register(budgetCalculatorTool);
  toolRegistry.register(currencyConverterTool);

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a ReAct agent
  const agent = createReActAgent({
    model: llm,
    tools: toolRegistry,
    systemPrompt: `You are a helpful travel planning assistant.
    Use the available tools to help users plan their trips.
    Think step by step and use multiple tools as needed.`,
    maxIterations: 10,
    returnIntermediateSteps: true,
  });

  // Complex multi-step query
  const query = `I want to plan a trip from New York to Paris for 3 nights starting on 2024-06-15. 
  What would be the total cost in EUR including the cheapest flight and a recommended hotel?`;

  console.log('📝 Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80));

  const result = await agent.invoke({
    messages: [new HumanMessage(query)],
  });

  // Display the reasoning process
  console.log('\n💭 REASONING PROCESS:\n');
  result.thoughts?.forEach((thought: any, idx: number) => {
    console.log(`Step ${idx + 1}:`);
    console.log(`  ${thought.content}\n`);
  });

  console.log('='.repeat(80));

  // Display actions taken
  console.log('\n🔧 ACTIONS TAKEN:\n');
  result.actions?.forEach((action: any, idx: number) => {
    console.log(`Action ${idx + 1}: ${action.name}`);
    console.log(`  Arguments: ${JSON.stringify(action.arguments, null, 2)}\n`);
  });

  console.log('='.repeat(80));

  // Display observations
  console.log('\n👁️  OBSERVATIONS:\n');
  result.observations?.forEach((obs: any, idx: number) => {
    console.log(`Observation ${idx + 1}:`);
    console.log(`  ${JSON.stringify(obs.result, null, 2)}\n`);
  });

  console.log('='.repeat(80));

  // Display final answer
  console.log('\n✅ FINAL ANSWER:\n');
  const finalMessage = result.messages[result.messages.length - 1];
  console.log(`  ${finalMessage.content}\n`);

  console.log('='.repeat(80));
  console.log('\n💡 Key Takeaway:');
  console.log('  The ReAct pattern automatically chains multiple tool calls');
  console.log('  and reasoning steps to solve complex, multi-step problems.\n');
}

// Run the example
main().catch(console.error);

