import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createMultiAgentSystem } from '@agentforge/patterns';
import { currentDateTime } from '@agentforge/tools';
import { z } from 'zod';
import { createTool } from '@agentforge/core';
import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Customer Support Bot Example
 * 
 * This example demonstrates a multi-agent customer support system with:
 * - FAQ agent for common questions
 * - Technical support agent for complex issues
 * - Ticket management system
 * - Escalation logic
 * - Sentiment analysis
 */

// Simulated FAQ database
const FAQ_DATABASE = {
  'reset password': 'To reset your password: 1) Go to login page 2) Click "Forgot Password" 3) Enter your email 4) Check your email for reset link',
  'shipping': 'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Express shipping is available for $9.99.',
  'returns': 'You can return items within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.',
  'payment methods': 'We accept Visa, Mastercard, American Express, PayPal, and Apple Pay.',
  'track order': 'To track your order, log into your account and go to "Order History". Click on your order number to see tracking details.',
  'cancel order': 'Orders can be canceled within 1 hour of placement. After that, please contact support for assistance.',
  'account': 'To create an account, click "Sign Up" and provide your email and password. You\'ll receive a confirmation email.',
};

// Custom tool for searching FAQ
const searchFAQTool = createTool()
  .name('search_faq')
  .description('Search the FAQ database for answers to common questions')
  .category('support')
  .schema(
    z.object({
      query: z.string().describe('The customer question or keywords to search for'),
    })
  )
  .implement(async ({ query }) => {
    const lowerQuery = query.toLowerCase();
    
    // Find matching FAQs
    const matches: string[] = [];
    for (const [key, answer] of Object.entries(FAQ_DATABASE)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        matches.push(`Q: ${key}\nA: ${answer}`);
      }
    }
    
    if (matches.length === 0) {
      return 'No FAQ matches found. This may require technical support.';
    }
    
    return matches.join('\n\n');
  })
  .build();

// Custom tool for creating support tickets
const createTicketTool = createTool()
  .name('create_ticket')
  .description('Create a support ticket for issues that require human assistance')
  .category('support')
  .schema(
    z.object({
      subject: z.string().describe('Brief description of the issue'),
      description: z.string().describe('Detailed description of the problem'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Ticket priority'),
      category: z.string().describe('Issue category (technical, billing, account, etc.)'),
    })
  )
  .implement(async ({ subject, description, priority, category }) => {
    const ticketId = `TICKET-${Date.now()}`;
    const ticket = {
      id: ticketId,
      subject,
      description,
      priority,
      category,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    
    // In production, save to database
    console.log(chalk.yellow('\n📋 Support Ticket Created:'));
    console.log(chalk.gray(JSON.stringify(ticket, null, 2)));
    
    return `Ticket ${ticketId} created successfully. Priority: ${priority}. A support agent will respond within ${priority === 'urgent' ? '1 hour' : priority === 'high' ? '4 hours' : '24 hours'}.`;
  })
  .build();

// Custom tool for checking order status
const checkOrderStatusTool = createTool()
  .name('check_order_status')
  .description('Check the status of a customer order')
  .category('support')
  .schema(
    z.object({
      orderId: z.string().describe('The order ID to check'),
    })
  )
  .implement(async ({ orderId }) => {
    // Simulated order lookup
    const statuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return JSON.stringify({
      orderId,
      status: randomStatus,
      estimatedDelivery: randomStatus === 'shipped' ? '2024-01-20' : null,
      trackingNumber: randomStatus === 'shipped' ? 'TRK123456789' : null,
    }, null, 2);
  })
  .build();

// Custom tool for sentiment analysis
const analyzeSentimentTool = createTool()
  .name('analyze_sentiment')
  .description('Analyze customer sentiment to determine if escalation is needed')
  .category('analysis')
  .schema(
    z.object({
      message: z.string().describe('Customer message to analyze'),
    })
  )
  .implement(async ({ message }) => {
    const lowerMessage = message.toLowerCase();
    
    // Simple sentiment analysis
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'worst', 'hate', 'disappointed'];
    const urgentWords = ['urgent', 'immediately', 'asap', 'emergency', 'critical'];
    
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
    const hasUrgent = urgentWords.some(word => lowerMessage.includes(word));
    
    let sentiment = 'neutral';
    let escalate = false;
    
    if (hasNegative && hasUrgent) {
      sentiment = 'very negative';
      escalate = true;
    } else if (hasNegative) {
      sentiment = 'negative';
    } else if (hasUrgent) {
      sentiment = 'urgent';
      escalate = true;
    }
    
    return JSON.stringify({
      sentiment,
      escalate,
      reason: escalate ? 'Customer appears frustrated or has urgent issue' : 'Standard support flow',
    });
  })
  .build();

async function main() {
  console.log(chalk.blue.bold('\n🤖 Customer Support Bot\n'));
  console.log(chalk.gray('Type your question or issue. Type "exit" to quit.\n'));

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
  });

  // Create a multi-agent support system
  const supportSystem = createMultiAgentSystem({
    model,
    agents: [
      {
        name: 'faq_agent',
        role: 'FAQ Specialist',
        goal: 'Answer common questions using the FAQ database',
        tools: [searchFAQTool, currentDateTime],
      },
      {
        name: 'technical_agent',
        role: 'Technical Support',
        goal: 'Handle technical issues and create tickets when needed',
        tools: [createTicketTool, checkOrderStatusTool, currentDateTime],
      },
      {
        name: 'triage_agent',
        role: 'Support Triage',
        goal: 'Analyze customer sentiment and route to appropriate agent',
        tools: [analyzeSentimentTool],
      },
    ],
    systemPrompt: `You are a customer support system. Your role is to:
1. Greet customers warmly and professionally
2. Understand their issue or question
3. Route to the appropriate specialist (FAQ or Technical)
4. Provide helpful, accurate information
5. Create tickets for complex issues
6. Escalate urgent or negative sentiment cases

Always be empathetic, patient, and solution-focused.`,
  });

  const compiledSystem = supportSystem.compile();

  // Interactive chat loop
  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalk.green('You:'),
      },
    ]);

    if (message.toLowerCase() === 'exit') {
      console.log(chalk.blue('\n👋 Thank you for contacting support. Goodbye!\n'));
      break;
    }

    try {
      console.log(chalk.gray('\n⏳ Processing...\n'));
      
      const result = await compiledSystem.invoke({
        messages: [{ role: 'user', content: message }],
      });

      const response = result.messages[result.messages.length - 1].content;
      console.log(chalk.cyan(`\nBot: ${response}\n`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  }
}

main();

