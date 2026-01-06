/**
 * Tool Chaining with ReAct Pattern
 *
 * This example demonstrates how the ReAct pattern chains tools together,
 * where the output of one tool becomes the input for another.
 *
 * This is particularly useful for:
 * - Data transformation pipelines
 * - Sequential processing tasks
 * - Building complex workflows from simple tools
 * - API composition
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/react/03-tool-chaining.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { createReActAgent } from '../../src/react/index.js';
import { ToolRegistry } from '@agentforge/core';
import { z } from 'zod';

// Define tools that work together in a chain
const fetchUserDataTool = {
  name: 'fetch_user_data',
  description: 'Fetch user data by user ID',
  schema: z.object({
    userId: z.string().describe('User ID'),
  }),
  execute: async ({ userId }: { userId: string }) => {
    // Simulated user database
    const users: Record<string, any> = {
      'user123': {
        id: 'user123',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        accountId: 'acc456',
        preferences: { theme: 'dark', notifications: true },
      },
      'user456': {
        id: 'user456',
        name: 'Bob Smith',
        email: 'bob@example.com',
        accountId: 'acc789',
        preferences: { theme: 'light', notifications: false },
      },
    };

    return users[userId] || { error: 'User not found' };
  },
};

const fetchAccountDataTool = {
  name: 'fetch_account_data',
  description: 'Fetch account data by account ID',
  schema: z.object({
    accountId: z.string().describe('Account ID'),
  }),
  execute: async ({ accountId }: { accountId: string }) => {
    // Simulated account database
    const accounts: Record<string, any> = {
      'acc456': {
        id: 'acc456',
        type: 'premium',
        balance: 1250.50,
        currency: 'USD',
        status: 'active',
        createdAt: '2023-01-15',
      },
      'acc789': {
        id: 'acc789',
        type: 'basic',
        balance: 350.00,
        currency: 'USD',
        status: 'active',
        createdAt: '2023-06-20',
      },
    };

    return accounts[accountId] || { error: 'Account not found' };
  },
};

const calculateAccountAgeTool = {
  name: 'calculate_account_age',
  description: 'Calculate how long an account has been active',
  schema: z.object({
    createdAt: z.string().describe('Account creation date (YYYY-MM-DD)'),
  }),
  execute: async ({ createdAt }: { createdAt: string }) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    return {
      days: diffDays,
      months: diffMonths,
      years: diffYears,
      formatted: diffYears > 0
        ? `${diffYears} year${diffYears > 1 ? 's' : ''}`
        : `${diffMonths} month${diffMonths > 1 ? 's' : ''}`,
    };
  },
};

const formatUserReportTool = {
  name: 'format_user_report',
  description: 'Format a comprehensive user report',
  schema: z.object({
    userData: z.object({
      name: z.string(),
      email: z.string(),
    }),
    accountData: z.object({
      type: z.string(),
      balance: z.number(),
      status: z.string(),
    }),
    accountAge: z.object({
      formatted: z.string(),
    }),
  }),
  execute: async ({ userData, accountData, accountAge }: any) => {
    return {
      report: `
╔════════════════════════════════════════╗
║         USER ACCOUNT REPORT            ║
╠════════════════════════════════════════╣
║ Name:     ${userData.name.padEnd(28)} ║
║ Email:    ${userData.email.padEnd(28)} ║
║ Type:     ${accountData.type.toUpperCase().padEnd(28)} ║
║ Balance:  $${accountData.balance.toFixed(2).padEnd(26)} ║
║ Status:   ${accountData.status.toUpperCase().padEnd(28)} ║
║ Age:      ${accountAge.formatted.padEnd(28)} ║
╚════════════════════════════════════════╝
      `.trim(),
    };
  },
};

async function main() {
  console.log('🔗 Tool Chaining with ReAct Pattern\n');

  // Create a tool registry
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(fetchUserDataTool);
  toolRegistry.register(fetchAccountDataTool);
  toolRegistry.register(calculateAccountAgeTool);
  toolRegistry.register(formatUserReportTool);

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create a ReAct agent
  const agent = createReActAgent({
    llm,
    tools: toolRegistry,
    systemPrompt: `You are a helpful assistant that generates user reports.
    Use the available tools in sequence to gather all necessary information.
    Chain tools together: fetch user data, then account data, calculate age, and format the report.`,
    maxIterations: 10,
    returnIntermediateSteps: true,
  });

  // Query that requires tool chaining
  const query = 'Generate a comprehensive report for user123';

  console.log('📝 Query:');
  console.log(`  ${query}\n`);
  console.log('='.repeat(80));

  const result = await agent.invoke({
    messages: [new HumanMessage(query)],
  });

  // Display the tool chain
  console.log('\n🔗 TOOL CHAIN:\n');
  result.actions?.forEach((action: any, idx: number) => {
    console.log(`${idx + 1}. ${action.tool}`);
    console.log(`   Input: ${JSON.stringify(action.arguments)}`);

    if (result.observations && result.observations[idx]) {
      const output = result.observations[idx].result;
      console.log(`   Output: ${JSON.stringify(output).substring(0, 100)}...`);
    }
    console.log();
  });

  console.log('='.repeat(80));

  // Display final report
  console.log('\n📊 FINAL REPORT:\n');
  const finalMessage = result.messages[result.messages.length - 1];
  console.log(finalMessage.content);

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Key Takeaways:');
  console.log('  1. Tools can be chained: output of one becomes input of another');
  console.log('  2. ReAct automatically manages the data flow between tools');
  console.log('  3. Complex workflows emerge from simple, composable tools');
  console.log('  4. Each tool has a single, well-defined responsibility\n');
}

// Run the example
main().catch(console.error);

