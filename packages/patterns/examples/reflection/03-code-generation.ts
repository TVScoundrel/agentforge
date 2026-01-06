/**
 * Code Generation with Reflection Pattern
 *
 * This example demonstrates using the Reflection pattern for code generation,
 * where the agent iteratively improves code based on self-review.
 *
 * This is particularly useful for:
 * - Generating production-quality code
 * - Code refactoring
 * - Algorithm implementation
 * - Code optimization
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/reflection/03-code-generation.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReflectionAgent } from '../../src/reflection/index.js';

async function main() {
  console.log('💻 Code Generation with Reflection Pattern\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.3, // Lower temperature for more consistent code
  });

  // Create a reflection agent with code-specific prompts
  const agent = createReflectionAgent({
    generator: {
      llm,
      systemPrompt: `You are an expert software engineer. Write clean, efficient, 
      well-documented code following best practices. Include:
      - Clear function/class names
      - Proper error handling
      - Type annotations (TypeScript)
      - Comprehensive comments
      - Example usage`,
    },
    reflector: {
      llm,
      systemPrompt: `You are a senior code reviewer. Evaluate code based on:
      - Code quality and readability
      - Best practices and patterns
      - Error handling
      - Performance considerations
      - Type safety
      - Documentation quality
      - Edge cases
      - Security considerations
      
      Provide specific, actionable feedback for improvement.`,
    },
    reviser: {
      llm,
      systemPrompt: `You are an expert code refactorer. Improve code based on 
      review feedback while maintaining functionality. Focus on:
      - Fixing identified issues
      - Improving code quality
      - Enhancing documentation
      - Optimizing performance
      - Ensuring type safety`,
    },
    maxIterations: 3,
    verbose: true,
  });

  // Code generation task
  const task = `Create a TypeScript function that implements a rate limiter using the 
  token bucket algorithm. The function should:
  - Accept a maximum number of tokens and refill rate
  - Allow checking if an action is allowed
  - Automatically refill tokens over time
  - Be thread-safe (consider concurrent access)
  - Include comprehensive error handling
  - Have full TypeScript types
  - Include usage examples`;

  // Run the agent with code quality criteria
  const result = await agent.invoke({
    input: task,
    qualityCriteria: {
      minScore: 8,
      criteria: [
        'Correct implementation of token bucket algorithm',
        'Proper TypeScript types and interfaces',
        'Comprehensive error handling',
        'Clear documentation and comments',
        'Handles edge cases',
        'Includes usage examples',
        'Follows best practices',
      ],
      requireAll: true,
    },
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 CODE GENERATION RESULTS');
  console.log('='.repeat(80));

  console.log(`\n✅ Status: ${result.status}`);
  console.log(`🔢 Iterations: ${result.iteration}`);
  console.log(`📝 Code Reviews: ${result.reflections.length}`);
  console.log(`✏️  Refactorings: ${result.revisions.length}`);

  // Show quality progression
  if (result.reflections.length > 0) {
    console.log('\n📈 Code Quality Progression:');
    result.reflections.forEach((reflection, idx) => {
      const status = reflection.meetsStandards ? '✅' : '❌';
      console.log(`  Review ${idx + 1}: ${reflection.score}/10 ${status}`);
    });
  }

  console.log('\n' + '-'.repeat(80));
  console.log('💻 FINAL CODE');
  console.log('-'.repeat(80));
  console.log(result.response);

  // Show code review feedback
  if (result.reflections.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('🔍 CODE REVIEW HISTORY');
    console.log('-'.repeat(80));

    result.reflections.forEach((reflection, idx) => {
      console.log(`\n[Review ${idx + 1}] Score: ${reflection.score}/10`);
      console.log(`Critique: ${reflection.critique}`);

      if (reflection.issues.length > 0) {
        console.log(`\n❌ Issues Found:`);
        reflection.issues.forEach(issue => console.log(`  - ${issue}`));
      }

      if (reflection.suggestions.length > 0) {
        console.log(`\n💡 Suggestions:`);
        reflection.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

