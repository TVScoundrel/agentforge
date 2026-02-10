/**
 * Essay Writing with Reflection Pattern
 *
 * This example demonstrates using the Reflection pattern for essay writing,
 * where the agent iteratively improves the essay based on self-critique.
 *
 * This is particularly useful for:
 * - Academic writing
 * - Content creation
 * - Technical documentation
 * - Any writing that requires high quality and multiple revisions
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/reflection/02-essay-writing.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReflectionAgent } from '../../src/reflection/index.js';

async function main() {
  console.log('📝 Essay Writing with Reflection Pattern\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  // Create a reflection agent with essay-specific prompts
  const agent = createReflectionAgent({
    generator: {
      model: llm,
      systemPrompt: `You are an expert essay writer. Write well-structured,
      compelling essays with clear thesis statements, supporting arguments,
      and strong conclusions. Use proper academic style and formatting.`,
    },
    reflector: {
      model: llm,
      systemPrompt: `You are a strict academic reviewer. Evaluate essays based on:
      - Thesis clarity and strength
      - Argument structure and logic
      - Evidence and examples
      - Writing style and clarity
      - Grammar and mechanics
      - Overall coherence and flow

      Provide specific, actionable feedback for improvement.`,
    },
    reviser: {
      model: llm,
      systemPrompt: `You are an expert essay editor. Revise essays to address
      all feedback while maintaining the author's voice and core arguments.
      Improve clarity, strengthen arguments, and enhance overall quality.`,
    },
    maxIterations: 4,
    verbose: true,
  });

  // Essay topic
  const topic = `Write a 500-word essay on the impact of artificial intelligence 
  on the future of work. Include a clear thesis, supporting arguments, and a conclusion.`;

  // Run the agent with strict quality criteria
  const result = await agent.invoke({
    input: topic,
    qualityCriteria: {
      minScore: 9,
      criteria: [
        'Clear and compelling thesis statement',
        'Well-structured arguments with evidence',
        'Proper essay format (intro, body, conclusion)',
        'Academic writing style',
        'Approximately 500 words',
        'No grammatical errors',
      ],
      requireAll: true,
    },
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 ESSAY WRITING RESULTS');
  console.log('='.repeat(80));

  console.log(`\n✅ Status: ${result.status}`);
  console.log(`🔢 Iterations: ${result.iteration}`);
  console.log(`📝 Total Reflections: ${result.reflections.length}`);
  console.log(`✏️  Total Revisions: ${result.revisions.length}`);

  // Show quality progression
  if (result.reflections.length > 0) {
    console.log('\n📈 Quality Progression:');
    result.reflections.forEach((reflection, idx) => {
      const status = reflection.meetsStandards ? '✅' : '❌';
      console.log(`  Iteration ${idx + 1}: ${reflection.score}/10 ${status}`);
    });
  }

  console.log('\n' + '-'.repeat(80));
  console.log('📄 FINAL ESSAY');
  console.log('-'.repeat(80));
  console.log(result.response);

  // Show the improvement journey
  if (result.revisions.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('🔄 REVISION HISTORY');
    console.log('-'.repeat(80));

    result.revisions.forEach((revision, idx) => {
      console.log(`\n[Revision ${idx + 1}]`);
      console.log(`Based on: ${revision.basedOn?.critique.substring(0, 100)}...`);
      console.log(`\nContent preview: ${revision.content.substring(0, 200)}...`);
    });
  }

  // Final quality assessment
  const finalReflection = result.reflections[result.reflections.length - 1];
  if (finalReflection) {
    console.log('\n' + '-'.repeat(80));
    console.log('🎯 FINAL QUALITY ASSESSMENT');
    console.log('-'.repeat(80));
    console.log(`Score: ${finalReflection.score}/10`);
    console.log(`Meets Standards: ${finalReflection.meetsStandards ? '✅ Yes' : '❌ No'}`);
    console.log(`\nFinal Critique: ${finalReflection.critique}`);
  }

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

