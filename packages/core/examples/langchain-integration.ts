/**
 * LangChain Integration Example
 * 
 * This example demonstrates how to convert AgentForge tools to LangChain format
 * and use them with LangChain agents.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/langchain-integration.ts
 * ```
 */

import { z } from 'zod';
import {
  toolBuilder,
  ToolCategory,
  toLangChainTool,
  toLangChainTools,
  getToolJsonSchema,
  getToolDescription,
} from '../src/index.js';

console.log('=== LangChain Integration Example ===\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Create AgentForge Tools
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic operations')
  .category(ToolCategory.UTILITY)
  .tag('math')
  .tag('calculator')
  .example({
    description: 'Add two numbers',
    input: { operation: 'add', a: 5, b: 3 },
    output: 8,
  })
  .schema(z.object({
    operation: z
      .enum(['add', 'subtract', 'multiply', 'divide'])
      .describe('The arithmetic operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return a / b;
    }
  })
  .build();

const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Get the current weather for a city')
  .category(ToolCategory.WEB)
  .tag('weather')
  .tag('api')
  .usageNotes('This is a mock implementation. In production, this would call a real weather API.')
  .schema(z.object({
    city: z.string().describe('The city name to get weather for'),
    units: z
      .enum(['celsius', 'fahrenheit'])
      .default('celsius')
      .describe('Temperature units (default: celsius)'),
  }))
  .implement(async ({ city, units }) => {
    // Mock implementation
    const temp = units === 'celsius' ? 22 : 72;
    return {
      city,
      temperature: temp,
      units,
      condition: 'Sunny',
      humidity: 65,
    };
  })
  .build();

const userLookupTool = toolBuilder()
  .name('lookup-user')
  .description('Look up user information by ID')
  .category(ToolCategory.DATABASE)
  .tag('user')
  .tag('database')
  .schema(z.object({
    userId: z.string().describe('The user ID to look up'),
  }))
  .implement(async ({ userId }) => {
    // Mock implementation
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    };
  })
  .build();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Convert to LangChain Tools
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('1. Converting AgentForge Tools to LangChain Format\n');

const langchainCalculator = toLangChainTool(calculatorTool);
const langchainWeather = toLangChainTool(weatherTool);
const langchainUserLookup = toLangChainTool(userLookupTool);

console.log('✅ Converted 3 tools to LangChain format');
console.log(`   - ${langchainCalculator.name}`);
console.log(`   - ${langchainWeather.name}`);
console.log(`   - ${langchainUserLookup.name}`);
console.log();

// Or convert multiple at once
const allLangChainTools = toLangChainTools([
  calculatorTool,
  weatherTool,
  userLookupTool,
]);

console.log(`✅ Batch converted ${allLangChainTools.length} tools\n`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Test LangChain Tool Execution
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('2. Testing LangChain Tool Execution\n');

async function testTools() {
  // Test calculator
  const calcResult = await langchainCalculator.invoke({
    operation: 'multiply',
    a: 6,
    b: 7,
  });
  console.log('Calculator (6 × 7):', calcResult);
  console.log('  Type:', typeof calcResult); // LangChain tools return strings
  console.log();

  // Test weather
  const weatherResult = await langchainWeather.invoke({
    city: 'San Francisco',
    units: 'fahrenheit',
  });
  console.log('Weather (San Francisco):');
  console.log(weatherResult);
  console.log();

  // Test user lookup
  const userResult = await langchainUserLookup.invoke({
    userId: 'user-123',
  });
  console.log('User Lookup (user-123):');
  console.log(userResult);
  console.log();
}

await testTools();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Get JSON Schema
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('3. JSON Schema Generation\n');

const calculatorSchema = getToolJsonSchema(calculatorTool);
console.log('Calculator JSON Schema:');
console.log(JSON.stringify(calculatorSchema, null, 2));
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Get Tool Description
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('4. Tool Description for LLM Prompts\n');

const description = getToolDescription(calculatorTool);
console.log(description);
console.log();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ LangChain Integration Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Next Steps:');
console.log('   1. Use these tools with LangChain agents');
console.log('   2. Integrate with ChatOpenAI, ChatAnthropic, etc.');
console.log('   3. Build multi-agent systems with LangGraph');
console.log('   4. Add more tools to your agent toolkit');

