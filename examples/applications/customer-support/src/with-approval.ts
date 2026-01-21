import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { createAskHumanTool, currentDateTime } from '@agentforge/tools';
import { z } from 'zod';
import { createTool } from '@agentforge/core';
import { MemorySaver } from '@langchain/langgraph';
import chalk from 'chalk';

/**
 * Customer Support Bot with Human-in-the-Loop Approval
 * 
 * This example demonstrates a customer support agent that:
 * - Handles refund requests
 * - Asks for human approval for refunds over $100
 * - Uses LangGraph checkpointing for state management
 * - Implements timeout handling with safe defaults
 */

// Simulated customer database
const CUSTOMERS = {
  'CUST-001': {
    id: 'CUST-001',
    name: 'John Doe',
    email: 'john@example.com',
    totalOrders: 15,
    totalSpent: 2500,
    refundHistory: 1,
  },
  'CUST-002': {
    id: 'CUST-002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    totalOrders: 3,
    totalSpent: 450,
    refundHistory: 0,
  },
};

// Simulated order database
const ORDERS = {
  'ORD-12345': {
    id: 'ORD-12345',
    customerId: 'CUST-001',
    amount: 150,
    status: 'delivered',
    items: ['Laptop Stand', 'USB-C Cable'],
    orderDate: '2024-01-10',
  },
  'ORD-67890': {
    id: 'ORD-67890',
    customerId: 'CUST-002',
    amount: 45,
    status: 'delivered',
    items: ['Phone Case'],
    orderDate: '2024-01-15',
  },
};

// Tool to get customer information
const getCustomerInfoTool = createTool()
  .name('get_customer_info')
  .description('Get customer information including order history and refund history')
  .category('support')
  .schema(
    z.object({
      customerId: z.string().describe('Customer ID (e.g., CUST-001)'),
    })
  )
  .implement(async ({ customerId }) => {
    const customer = CUSTOMERS[customerId as keyof typeof CUSTOMERS];
    if (!customer) {
      return `Customer ${customerId} not found`;
    }
    return JSON.stringify(customer, null, 2);
  })
  .build();

// Tool to get order information
const getOrderInfoTool = createTool()
  .name('get_order_info')
  .description('Get order details including items, amount, and status')
  .category('support')
  .schema(
    z.object({
      orderId: z.string().describe('Order ID (e.g., ORD-12345)'),
    })
  )
  .implement(async ({ orderId }) => {
    const order = ORDERS[orderId as keyof typeof ORDERS];
    if (!order) {
      return `Order ${orderId} not found`;
    }
    return JSON.stringify(order, null, 2);
  })
  .build();

// Tool to process refund (simulated)
const processRefundTool = createTool()
  .name('process_refund')
  .description('Process a refund for an order. Use this ONLY after getting approval.')
  .category('support')
  .schema(
    z.object({
      orderId: z.string().describe('Order ID to refund'),
      amount: z.number().describe('Refund amount'),
      reason: z.string().describe('Reason for refund'),
      approved: z.boolean().describe('Whether the refund was approved'),
    })
  )
  .implement(async ({ orderId, amount, reason, approved }) => {
    if (!approved) {
      return `Refund for order ${orderId} was not approved. No action taken.`;
    }

    // Simulate refund processing
    const refundId = `REF-${Date.now()}`;
    const result = {
      refundId,
      orderId,
      amount,
      reason,
      status: 'processed',
      processedAt: new Date().toISOString(),
      estimatedArrival: '3-5 business days',
    };

    console.log(chalk.green('\n✅ Refund Processed:'));
    console.log(chalk.gray(JSON.stringify(result, null, 2)));

    return `Refund ${refundId} processed successfully. $${amount} will be refunded to the customer's original payment method within 3-5 business days.`;
  })
  .build();

async function main() {
  console.log(chalk.blue.bold('\n🤖 Customer Support Bot with Approval Workflow\n'));
  console.log(chalk.gray('This example demonstrates human-in-the-loop approval for refunds.\n'));

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
  });

  // Create the askHuman tool for approval
  const askHuman = createAskHumanTool();

  // Create a ReAct agent with refund tools
  const agent = createReActAgent({
    model,
    tools: [
      getCustomerInfoTool,
      getOrderInfoTool,
      askHuman,
      processRefundTool,
      currentDateTime,
    ],
    systemPrompt: `You are a customer support agent handling refund requests.

Your workflow:
1. Get customer information using get_customer_info
2. Get order information using get_order_info
3. Evaluate the refund request:
   - If amount <= $100: Process immediately
   - If amount > $100: Use ask-human tool to get approval
4. When asking for approval, provide context:
   - Customer name and history
   - Order details
   - Refund amount and reason
   - Your recommendation
5. Process refund using process_refund tool with approval status

Always be empathetic and professional.`,
  });

  // Compile with checkpointer (required for human-in-the-loop)
  const checkpointer = new MemorySaver();
  const app = agent.compile({ checkpointer });

  // Example refund scenarios
  const scenarios = [
    {
      name: 'Small Refund (Auto-approved)',
      query: 'I need a refund for order ORD-67890. The phone case arrived damaged.',
      customerId: 'CUST-002',
      expectedFlow: 'Should process automatically (amount $45 <= $100)',
    },
    {
      name: 'Large Refund (Requires Approval)',
      query: 'I want a refund for order ORD-12345. The laptop stand is defective.',
      customerId: 'CUST-001',
      expectedFlow: 'Should ask for human approval (amount $150 > $100)',
    },
  ];

  console.log(chalk.yellow('Available Scenarios:\n'));
  scenarios.forEach((scenario, index) => {
    console.log(chalk.cyan(`${index + 1}. ${scenario.name}`));
    console.log(chalk.gray(`   Query: "${scenario.query}"`));
    console.log(chalk.gray(`   Expected: ${scenario.expectedFlow}\n`));
  });

  // Run scenario 1: Small refund (auto-approved)
  console.log(chalk.blue.bold('\n📋 Scenario 1: Small Refund (Auto-approved)\n'));
  console.log(chalk.green(`Customer: ${scenarios[0].query}\n`));

  try {
    const config = { configurable: { thread_id: 'scenario-1' } };

    const result = await app.invoke(
      {
        messages: [{ role: 'user', content: scenarios[0].query }],
      },
      config
    );

    const response = result.messages[result.messages.length - 1].content;
    console.log(chalk.cyan(`\nAgent: ${response}\n`));
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }

  // Run scenario 2: Large refund (requires approval)
  console.log(chalk.blue.bold('\n📋 Scenario 2: Large Refund (Requires Approval)\n'));
  console.log(chalk.green(`Customer: ${scenarios[1].query}\n`));

  try {
    const config = { configurable: { thread_id: 'scenario-2' } };

    console.log(chalk.yellow('⏸️  Agent will pause and ask for approval...\n'));

    // This will throw NodeInterrupt when askHuman is called
    const result = await app.invoke(
      {
        messages: [{ role: 'user', content: scenarios[1].query }],
      },
      config
    );

    const response = result.messages[result.messages.length - 1].content;
    console.log(chalk.cyan(`\nAgent: ${response}\n`));
  } catch (error: any) {
    // Check if it's a NodeInterrupt (expected for human-in-the-loop)
    if (error.name === 'NodeInterrupt' || error.__type === 'NodeInterrupt') {
      console.log(chalk.yellow('\n⏸️  Execution paused for human approval\n'));
      console.log(chalk.gray('Human Request:'));
      console.log(chalk.gray(JSON.stringify(error.value, null, 2)));

      console.log(chalk.green('\n✅ In a real application:'));
      console.log(chalk.gray('1. This request would be sent to a human via SSE'));
      console.log(chalk.gray('2. Human would review and respond'));
      console.log(chalk.gray('3. Execution would resume with the response'));
      console.log(chalk.gray('4. Agent would process the refund based on approval\n'));
    } else {
      console.error(chalk.red('❌ Error:'), error);
    }
  }

  console.log(chalk.blue.bold('\n📚 Key Takeaways:\n'));
  console.log(chalk.gray('• Small refunds ($100 or less) are processed automatically'));
  console.log(chalk.gray('• Large refunds require human approval via askHuman tool'));
  console.log(chalk.gray('• LangGraph checkpointing enables pause/resume workflow'));
  console.log(chalk.gray('• Context is provided to help humans make informed decisions'));
  console.log(chalk.gray('• Timeouts and defaults ensure the system doesn\'t hang\n'));

  console.log(chalk.blue.bold('🔗 Next Steps:\n'));
  console.log(chalk.gray('• Integrate with SSE for real-time communication'));
  console.log(chalk.gray('• Add a web UI for human approvals'));
  console.log(chalk.gray('• Connect to real customer/order databases'));
  console.log(chalk.gray('• Implement audit logging for all approvals\n'));
}

main();

