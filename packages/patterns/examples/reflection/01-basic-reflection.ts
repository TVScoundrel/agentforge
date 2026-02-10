/**
 * Basic Reflection Pattern Example
 *
 * This example demonstrates the basic usage of the Reflection pattern
 * to iteratively improve a response through generation, reflection, and revision.
 *
 * The Reflection pattern is useful when you need:
 * - High-quality outputs that meet specific criteria
 * - Iterative improvement based on self-critique
 * - Automatic quality assessment
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/reflection/01-basic-reflection.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReflectionAgent } from '../../src/reflection/index.js';

async function main() {
  console.log('🔄 Basic Reflection Pattern Example\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  // Create a reflection agent
  const agent = createReflectionAgent({
    generator: {
      model: llm,
      systemPrompt: 'You are an expert writer. Create clear, engaging, and informative content.',
    },
    reflector: {
      model: llm,
      systemPrompt: 'You are a critical editor. Provide constructive feedback to improve writing quality.',
    },
    reviser: {
      model: llm,
      systemPrompt: 'You are an expert editor. Improve content based on feedback while maintaining the core message.',
    },
    maxIterations: 3,
    verbose: true,
  });

  // Run the agent
  const result = await agent.invoke({
    input: 'Write a brief explanation of how neural networks learn, suitable for a general audience.',
    qualityCriteria: {
      minScore: 8,
      criteria: [
        'Clear and easy to understand',
        'Accurate technical information',
        'Engaging and well-structured',
        'Appropriate for general audience',
      ],
      requireAll: true,
    },
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));

  console.log(`\n✅ Status: ${result.status}`);
  console.log(`🔢 Iterations: ${result.iteration}`);
  console.log(`📝 Reflections: ${result.reflections.length}`);
  console.log(`✏️  Revisions: ${result.revisions.length}`);

  console.log('\n' + '-'.repeat(80));
  console.log('📄 FINAL RESPONSE');
  console.log('-'.repeat(80));
  console.log(result.response);

  if (result.reflections.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('💭 REFLECTION HISTORY');
    console.log('-'.repeat(80));

    result.reflections.forEach((reflection, idx) => {
      console.log(`\n[Iteration ${idx + 1}]`);
      console.log(`Score: ${reflection.score}/10`);
      console.log(`Meets Standards: ${reflection.meetsStandards ? '✅' : '❌'}`);
      console.log(`\nCritique: ${reflection.critique}`);

      if (reflection.issues.length > 0) {
        console.log(`\nIssues:`);
        reflection.issues.forEach(issue => console.log(`  - ${issue}`));
      }

      if (reflection.suggestions.length > 0) {
        console.log(`\nSuggestions:`);
        reflection.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }
    });
  }

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

