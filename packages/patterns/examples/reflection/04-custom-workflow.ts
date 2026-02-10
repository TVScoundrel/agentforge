/**
 * Custom Reflection Workflow Example
 *
 * This example demonstrates how to build a custom reflection workflow
 * using the individual node creators instead of the pre-built agent.
 *
 * This is useful when you need:
 * - Custom routing logic
 * - Additional nodes in the workflow
 * - Integration with other patterns
 * - Fine-grained control over the reflection process
 *
 * @example
 * ```bash
 * # Run this example (requires OpenAI API key)
 * export OPENAI_API_KEY=your-key-here
 * npx tsx packages/patterns/examples/reflection/04-custom-workflow.ts
 * ```
 */

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';
import {
  ReflectionState,
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
  createFinisherNode,
  type ReflectionStateType,
} from '../../src/reflection/index.js';

async function main() {
  console.log('🔧 Custom Reflection Workflow Example\n');

  // Create an LLM instance
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  // Create individual nodes
  const generatorNode = createGeneratorNode({
    model: llm,
    systemPrompt: 'You are a creative writer. Generate engaging content.',
    verbose: true,
  });

  const reflectorNode = createReflectorNode({
    model: llm,
    systemPrompt: 'You are a critical reviewer. Provide detailed feedback.',
    verbose: true,
  });

  const reviserNode = createReviserNode({
    model: llm,
    systemPrompt: 'You are an expert editor. Improve content based on feedback.',
    verbose: true,
  });

  const finisherNode = createFinisherNode();

  // Custom node: Add a quality check node
  const qualityCheckNode = async (state: ReflectionStateType): Promise<Partial<ReflectionStateType>> => {
    console.log('[QualityCheck] Performing final quality check...');

    const lastReflection = state.reflections[state.reflections.length - 1];

    // Custom logic: If score is below 7 but we've hit max iterations, add a warning
    if (lastReflection && lastReflection.score && lastReflection.score < 7 && state.iteration >= state.maxIterations) {
      console.log('[QualityCheck] ⚠️  Warning: Quality threshold not met after max iterations');
      return {
        error: `Quality threshold not met. Final score: ${lastReflection.score}/10`,
      };
    }

    console.log('[QualityCheck] ✅ Quality check passed');
    return {};
  };

  // Custom routing logic
  const routeAfterReflector = (state: ReflectionStateType): string => {
    if (state.status === 'failed') {
      return 'error';
    }

    const lastReflection = state.reflections[state.reflections.length - 1];

    // Custom logic: If score is very high (9+), skip revision and go straight to quality check
    if (lastReflection && lastReflection.score && lastReflection.score >= 9) {
      console.log('[Router] 🎯 Excellent score! Skipping revision.');
      return 'quality_check';
    }

    if (state.status === 'completed' || state.iteration >= state.maxIterations) {
      return 'quality_check';
    }

    return 'revise';
  };

  const routeAfterReviser = (state: ReflectionStateType): string => {
    if (state.status === 'failed' || state.iteration >= state.maxIterations) {
      return 'reflect';
    }
    return 'reflect';
  };

  const routeAfterQualityCheck = (state: ReflectionStateType): string => {
    if (state.error) {
      return 'error';
    }
    return 'finish';
  };

  // Build the custom workflow
  // @ts-expect-error - LangGraph's complex generic types don't infer well
  const workflow = new StateGraph(ReflectionState)
    .addNode('generator', generatorNode)
    .addNode('reflector', reflectorNode)
    .addNode('reviser', reviserNode)
    .addNode('quality_check', qualityCheckNode)
    .addNode('finisher', finisherNode);

  // Add edges
  workflow
    .addEdge('__start__', 'generator')
    .addEdge('generator', 'reflector')
    .addConditionalEdges(
      'reflector',
      routeAfterReflector as any,
      {
        revise: 'reviser',
        quality_check: 'quality_check',
        error: END,
      }
    )
    .addConditionalEdges(
      'reviser',
      routeAfterReviser as any,
      {
        reflect: 'reflector',
      }
    )
    .addConditionalEdges(
      'quality_check',
      routeAfterQualityCheck as any,
      {
        finish: 'finisher',
        error: END,
      }
    )
    .addEdge('finisher', END);

  // Compile the workflow
  const agent = workflow.compile();

  // Run the custom workflow
  const result = await agent.invoke({
    input: 'Write a compelling product description for a smart home device that learns your preferences.',
    maxIterations: 3,
    qualityCriteria: {
      minScore: 8,
      criteria: ['Engaging', 'Clear benefits', 'Persuasive'],
    },
  });

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 CUSTOM WORKFLOW RESULTS');
  console.log('='.repeat(80));

  console.log(`\n✅ Status: ${result.status}`);
  console.log(`🔢 Iterations: ${result.iteration}`);
  console.log(`📝 Reflections: ${result.reflections.length}`);
  console.log(`✏️  Revisions: ${result.revisions.length}`);

  if (result.error) {
    console.log(`\n⚠️  Error: ${result.error}`);
  }

  console.log('\n' + '-'.repeat(80));
  console.log('📄 FINAL RESPONSE');
  console.log('-'.repeat(80));
  console.log(result.response);

  console.log('\n' + '='.repeat(80));
  console.log('💡 Key Takeaways:');
  console.log('='.repeat(80));
  console.log(`
  This custom workflow demonstrates:

  1. Using individual node creators for fine-grained control
  2. Adding custom nodes (quality_check) to the workflow
  3. Implementing custom routing logic
  4. Skipping nodes based on quality scores
  5. Adding custom validation and error handling

  You can extend this pattern to:
  - Add logging or monitoring nodes
  - Integrate with external systems
  - Implement custom quality checks
  - Combine with other agent patterns
  - Add human-in-the-loop approval steps
  `);

  console.log('\n' + '='.repeat(80));
}

// Run the example
main().catch(console.error);

