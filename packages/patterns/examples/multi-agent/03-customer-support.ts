/**
 * Customer Support Multi-Agent Example
 *
 * This example demonstrates a customer support system with:
 * - Technical Support Agent
 * - Billing Support Agent
 * - General Support Agent
 * - LLM-based intelligent routing
 *
 * This pattern is useful for:
 * - Customer service automation
 * - Intelligent ticket routing
 * - Specialized support teams
 * - Escalation handling
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/multi-agent/03-customer-support.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createMultiAgentSystem, registerWorkers } from '../../src/multi-agent/index.js';
import { z } from 'zod';

// Technical Support Tools
const diagnosticTool = {
  name: 'run_diagnostic',
  description: 'Run system diagnostics to identify technical issues',
  schema: z.object({
    system: z.string().describe('System to diagnose'),
    issueType: z.string().describe('Type of issue reported'),
  }),
  execute: async ({ system, issueType }: { system: string; issueType: string }) => {
    console.log(`  [Tech Support] Running diagnostics on ${system} for ${issueType}`);
    
    return {
      system,
      issueType,
      status: 'completed',
      findings: ['Connection stable', 'No errors in logs', 'System resources normal'],
      recommendation: 'Try clearing cache and restarting the application',
    };
  },
};

const troubleshootTool = {
  name: 'troubleshoot',
  description: 'Provide troubleshooting steps for common issues',
  schema: z.object({
    problem: z.string().describe('Problem description'),
  }),
  execute: async ({ problem }: { problem: string }) => {
    console.log(`  [Tech Support] Troubleshooting: ${problem}`);
    
    return {
      problem,
      steps: [
        'Step 1: Verify internet connection',
        'Step 2: Clear browser cache',
        'Step 3: Restart the application',
        'Step 4: Check for updates',
      ],
      estimatedTime: '5-10 minutes',
    };
  },
};

// Billing Support Tools
const checkAccountTool = {
  name: 'check_account',
  description: 'Check account status and billing information',
  schema: z.object({
    accountId: z.string().describe('Account ID'),
  }),
  execute: async ({ accountId }: { accountId: string }) => {
    console.log(`  [Billing Support] Checking account: ${accountId}`);
    
    return {
      accountId,
      status: 'active',
      balance: 99.99,
      nextBillingDate: '2026-02-01',
      plan: 'Premium',
    };
  },
};

const processRefundTool = {
  name: 'process_refund',
  description: 'Process a refund request',
  schema: z.object({
    accountId: z.string().describe('Account ID'),
    amount: z.number().describe('Refund amount'),
    reason: z.string().describe('Refund reason'),
  }),
  execute: async ({ accountId, amount, reason }: { accountId: string; amount: number; reason: string }) => {
    console.log(`  [Billing Support] Processing refund of $${amount} for ${accountId}`);
    
    return {
      accountId,
      amount,
      reason,
      status: 'approved',
      refundId: `REF-${Date.now()}`,
      estimatedDays: 5-7,
    };
  },
};

// General Support Tools
const createTicketTool = {
  name: 'create_ticket',
  description: 'Create a support ticket for follow-up',
  schema: z.object({
    subject: z.string().describe('Ticket subject'),
    description: z.string().describe('Issue description'),
    priority: z.enum(['low', 'medium', 'high']).describe('Ticket priority'),
  }),
  execute: async ({ subject, description, priority }: { subject: string; description: string; priority: string }) => {
    console.log(`  [General Support] Creating ${priority} priority ticket: ${subject}`);
    
    return {
      ticketId: `TKT-${Date.now()}`,
      subject,
      description,
      priority,
      status: 'open',
      assignedTo: 'Support Team',
    };
  },
};

const faqSearchTool = {
  name: 'search_faq',
  description: 'Search FAQ database for answers',
  schema: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`  [General Support] Searching FAQ for: ${query}`);
    
    return {
      query,
      results: [
        { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login page...' },
        { question: 'How do I update my profile?', answer: 'Go to Settings > Profile...' },
      ],
      count: 2,
    };
  },
};

async function main() {
  console.log('🎧 Customer Support Multi-Agent Example\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.2,
  });

  // Create multi-agent system with LLM-based routing
  const system = createMultiAgentSystem({
    supervisor: {
      llm,
      routingStrategy: 'llm-based',
      systemPrompt: `You are a customer support supervisor. Route customer inquiries to the appropriate specialist:
        - Technical Support: for technical issues, bugs, system problems
        - Billing Support: for billing, payments, refunds, account issues
        - General Support: for general questions, FAQs, account management

        Analyze the customer's request and route to the most appropriate agent.`,
    },
    workers: [],
    aggregator: {
      llm,
      systemPrompt: 'Provide a helpful, empathetic customer support response.',
    },
    maxIterations: 5,
    verbose: true,
  });

  // Register support team workers
  registerWorkers(system, [
    {
      name: 'technical_support',
      description: 'Handles technical issues, bugs, and system problems',
      capabilities: ['technical', 'troubleshooting', 'diagnostics', 'bugs', 'errors'],
      tools: [diagnosticTool, troubleshootTool],
      systemPrompt: 'You are a technical support specialist. Help customers resolve technical issues with clear, step-by-step guidance.',
    },
    {
      name: 'billing_support',
      description: 'Handles billing, payments, refunds, and account issues',
      capabilities: ['billing', 'payments', 'refunds', 'invoices', 'subscriptions'],
      tools: [checkAccountTool, processRefundTool],
      systemPrompt: 'You are a billing support specialist. Help customers with billing inquiries and process transactions accurately.',
    },
    {
      name: 'general_support',
      description: 'Handles general questions, FAQs, and account management',
      capabilities: ['general', 'faq', 'account', 'information', 'help'],
      tools: [createTicketTool, faqSearchTool],
      systemPrompt: 'You are a general support specialist. Provide helpful information and create tickets when needed.',
    },
  ]);

  // Example 1: Technical issue
  console.log('📝 Example 1: Technical Issue');
  console.log('Customer: My app keeps crashing when I try to upload files\n');

  const result1 = await system.invoke({
    input: 'My app keeps crashing when I try to upload files',
  });

  console.log('\n✅ Support Response:');
  console.log(`  ${result1.response}\n`);

  // Example 2: Billing issue
  console.log('='.repeat(80));
  console.log('\n📝 Example 2: Billing Issue');
  console.log('Customer: I was charged twice this month, can I get a refund?\n');

  const result2 = await system.invoke({
    input: 'I was charged twice this month for account ACC-12345, can I get a refund?',
  });

  console.log('\n✅ Support Response:');
  console.log(`  ${result2.response}\n`);

  // Example 3: General question
  console.log('='.repeat(80));
  console.log('\n📝 Example 3: General Question');
  console.log('Customer: How do I change my email address?\n');

  const result3 = await system.invoke({
    input: 'How do I change my email address on my account?',
  });

  console.log('\n✅ Support Response:');
  console.log(`  ${result3.response}\n`);

  console.log('='.repeat(80));
}

// Run the example
main().catch(console.error);

