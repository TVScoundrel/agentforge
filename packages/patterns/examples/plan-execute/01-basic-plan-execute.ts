/**
 * Basic Plan-Execute Pattern Example
 *
 * This example demonstrates the basic usage of the Plan-Execute pattern
 * where the agent first creates a plan, then executes each step.
 *
 * The Plan-Execute pattern is useful when you need:
 * - Upfront planning for complex tasks
 * - Structured, step-by-step execution
 * - Clear separation between planning and execution
 * - Ability to track progress through a plan
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/plan-execute/01-basic-plan-execute.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createPlanExecuteAgent } from '../../src/plan-execute/index.js';
import { z } from 'zod';

// Define some simple tools
const calculatorTool = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations',
  schema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
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

const unitConverterTool = {
  name: 'convert_units',
  description: 'Convert between different units',
  schema: z.object({
    value: z.number(),
    from: z.string(),
    to: z.string(),
  }),
  execute: async ({ value, from, to }: { value: number; from: string; to: string }) => {
    // Simple conversion examples
    const conversions: Record<string, Record<string, number>> = {
      'celsius-fahrenheit': { multiplier: 9 / 5, offset: 32 },
      'fahrenheit-celsius': { multiplier: 5 / 9, offset: -32 },
      'km-miles': { multiplier: 0.621371, offset: 0 },
      'miles-km': { multiplier: 1.60934, offset: 0 },
    };

    const key = `${from}-${to}`;
    const conversion = conversions[key];

    if (!conversion) {
      return { error: `Conversion from ${from} to ${to} not supported` };
    }

    const result = (value + conversion.offset) * conversion.multiplier;
    return { result, unit: to };
  },
};

async function main() {
  console.log('📋 Basic Plan-Execute Pattern Example\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a Plan-Execute agent
  const agent = createPlanExecuteAgent({
    planner: {
      llm,
      maxSteps: 5,
    },
    executor: {
      tools: [calculatorTool, unitConverterTool],
      parallel: false, // Execute steps sequentially
    },
    maxIterations: 3,
    verbose: true,
  });

  // Example: Multi-step calculation
  const query = 'Calculate 15 * 8, then convert the result from celsius to fahrenheit';

  console.log('📝 Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80) + '\n');

  const result = await agent.invoke({
    input: query,
  });

  // Display the plan
  console.log('\n' + '='.repeat(80));
  console.log('📋 GENERATED PLAN');
  console.log('='.repeat(80) + '\n');

  if (result.plan) {
    result.plan.steps.forEach((step, idx) => {
      console.log(`Step ${idx + 1}: ${step.description}`);
      if (step.tool) {
        console.log(`  Tool: ${step.tool}`);
      }
      if (step.dependencies && step.dependencies.length > 0) {
        console.log(`  Dependencies: ${step.dependencies.join(', ')}`);
      }
      console.log();
    });
  }

  // Display execution results
  console.log('='.repeat(80));
  console.log('✅ EXECUTION RESULTS');
  console.log('='.repeat(80) + '\n');

  result.pastSteps?.forEach((step, idx) => {
    console.log(`Step ${idx + 1}: ${step.description}`);
    console.log(`  Status: ${step.status}`);
    console.log(`  Result: ${JSON.stringify(step.result)}`);
    console.log();
  });

  // Display final response
  console.log('='.repeat(80));
  console.log('🎯 FINAL RESPONSE');
  console.log('='.repeat(80) + '\n');
  console.log(`  ${result.response}\n`);

  console.log('='.repeat(80));
  console.log('\n💡 Key Takeaway:');
  console.log('  The Plan-Execute pattern separates planning from execution,');
  console.log('  making complex multi-step tasks more structured and traceable.\n');
}

// Run the example
main().catch(console.error);

