/**
 * Tool-Enabled Supervisor Example
 *
 * This example demonstrates how to enable the supervisor to use tools during
 * routing decisions. This is particularly useful when the supervisor needs to
 * gather additional information before making routing decisions.
 *
 * The supervisor can use the askHuman tool to:
 * - Ask the user for clarification on ambiguous requests
 * - Fetch additional context needed for routing decisions
 * - Validate information before routing to a worker
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/multi-agent/05-supervisor-with-askhuman.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createMultiAgentSystem, type MultiAgentStateType } from '../../src/multi-agent/index.js';
import { createAskHumanTool } from '../../../tools/src/agent/ask-human/tool.js';

async function main() {
  console.log('🤖 Tool-Enabled Supervisor Example\n');
  console.log('This example shows how a supervisor can use the askHuman tool');
  console.log('to gather clarification before routing tasks to workers.\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0,
  });

  // Create askHuman tool for supervisor to use
  const askHumanTool = createAskHumanTool();

  // Mock askHuman responses for this example
  // In a real application, this would pause and wait for actual human input
  let mockResponseIndex = 0;
  const mockResponses = [
    'Security compliance audit',
    'New employee onboarding',
    'Code review for pull request',
  ];

  // Override the tool's execute function for demo purposes
  askHumanTool.execute = async (input: any) => {
    console.log(`\n  [Supervisor → Human] ${input.question}`);
    const response = mockResponses[mockResponseIndex++] || 'I need general help';
    console.log(`  [Human → Supervisor] ${response}\n`);
    
    // Return mock response in the expected format
    return {
      response,
      metadata: {
        requestId: 'mock-id',
        requestedAt: Date.now(),
        respondedAt: Date.now(),
        duration: 0,
        timedOut: false,
        priority: input.priority || 'normal',
      },
    };
  };

  // Define worker execution functions
  const hrWorker = async (state: MultiAgentStateType) => {
    console.log('  [HR Agent] Processing HR task...');
    return {
      ...state,
      response: 'HR task completed: New employee onboarding process initiated. Welcome package sent.',
      status: 'completed' as const,
    };
  };

  const securityWorker = async (state: MultiAgentStateType) => {
    console.log('  [Security Agent] Processing security task...');
    return {
      ...state,
      response: 'Security task completed: Compliance audit finished. All systems are compliant.',
      status: 'completed' as const,
    };
  };

  const codeWorker = async (state: MultiAgentStateType) => {
    console.log('  [Code Agent] Processing code task...');
    return {
      ...state,
      response: 'Code task completed: Pull request reviewed. Approved with minor suggestions.',
      status: 'completed' as const,
    };
  };

  // Create multi-agent system with tool-enabled supervisor
  const system = createMultiAgentSystem({
    supervisor: {
      strategy: 'llm-based',
      model: llm,
      tools: [askHumanTool],           // Enable supervisor to use askHuman tool
      maxToolRetries: 3,                // Max tool calls before routing (default: 3)
      systemPrompt: `You are a supervisor coordinating specialized agents.

When the user's request is ambiguous or lacks necessary details, use the askHuman tool
to gather more information before routing to a worker.

Available workers:
- hr_agent: Handles HR tasks (onboarding, benefits, policies, employee management)
- security_agent: Handles security tasks (audits, compliance, access control, security reviews)
- code_agent: Handles code tasks (code reviews, refactoring, debugging, testing)

IMPORTANT: If the user's request is vague (like "I need help"), you MUST use the askHuman tool
to ask what type of help they need before making a routing decision.`,
    },
    workers: [
      {
        id: 'hr_agent',
        executeFn: hrWorker,
        capabilities: {
          skills: ['hr', 'onboarding', 'benefits', 'policies', 'employee-management'],
          tools: ['slack', 'workday', 'email'],
          available: true,
          currentWorkload: 0,
        },
      },
      {
        id: 'security_agent',
        executeFn: securityWorker,
        capabilities: {
          skills: ['security', 'compliance', 'audit', 'access-control', 'security-review'],
          tools: ['scanner', 'analyzer', 'firewall'],
          available: true,
          currentWorkload: 0,
        },
      },
      {
        id: 'code_agent',
        executeFn: codeWorker,
        capabilities: {
          skills: ['code', 'review', 'refactor', 'debug', 'test'],
          tools: ['linter', 'formatter', 'git'],
          available: true,
          currentWorkload: 0,
        },
      },
    ],
    maxIterations: 5,
    verbose: true,
  });

  // Example 1: Ambiguous request - supervisor asks for clarification
  console.log('='.repeat(80));
  console.log('\n📝 Example 1: Ambiguous Request (Supervisor Asks for Clarification)');
  console.log('User Input: "I need help"\n');

  const result1 = await system.invoke({
    input: 'I need help',
  });

  console.log('\n✅ Final Response:');
  console.log(`  ${result1.response}\n`);

  // Example 2: Another ambiguous request
  console.log('='.repeat(80));
  console.log('\n📝 Example 2: Vague Request (Supervisor Gathers Details)');
  console.log('User Input: "Can you help me with something?"\n');

  mockResponseIndex = 1; // Use second mock response
  const result2 = await system.invoke({
    input: 'Can you help me with something?',
  });

  console.log('\n✅ Final Response:');
  console.log(`  ${result2.response}\n`);

  // Example 3: Clear request - supervisor routes directly
  console.log('='.repeat(80));
  console.log('\n📝 Example 3: Clear Request (No Clarification Needed)');
  console.log('User Input: "Please review the code in pull request #123"\n');

  const result3 = await system.invoke({
    input: 'Please review the code in pull request #123',
  });

  console.log('\n✅ Final Response:');
  console.log(`  ${result3.response}\n`);

  console.log('='.repeat(80));
  console.log('\n🎉 Example Complete!\n');
  console.log('Key Takeaways:');
  console.log('  1. Supervisor can use tools (like askHuman) during routing');
  console.log('  2. Tools help gather information for better routing decisions');
  console.log('  3. Clear requests are routed directly without tool calls');
  console.log('  4. Ambiguous requests trigger tool calls for clarification');
  console.log('  5. maxToolRetries prevents infinite loops (default: 3)\n');
}

// Run the example
main().catch(console.error);

