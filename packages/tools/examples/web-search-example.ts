/**
 * Web Search Tool Example
 * 
 * Demonstrates how to use the web search tool with DuckDuckGo and Serper.
 * 
 * Usage:
 * ```bash
 * # Without API key (DuckDuckGo only)
 * npx tsx examples/web-search-example.ts
 * 
 * # With Serper API key
 * SERPER_API_KEY=your-key-here npx tsx examples/web-search-example.ts
 * ```
 */

import { webSearch } from '../src/web/web-search/index.js';

async function main() {
  console.log('=== Web Search Tool Example ===\n');

  // Example 1: Basic search (uses DuckDuckGo by default)
  console.log('1. Basic search with DuckDuckGo:');
  try {
    const result1 = await webSearch.invoke({
      query: 'TypeScript programming language',
      maxResults: 5,
    });

    console.log(`✓ Success: ${result1.success}`);
    console.log(`✓ Source: ${result1.source}`);
    console.log(`✓ Results: ${result1.results.length}`);
    console.log(`✓ Response time: ${result1.metadata?.responseTime}ms`);
    console.log('\nTop results:');
    result1.results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     ${r.link}`);
      console.log(`     ${r.snippet.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Example 2: Search with Serper (if API key is available)
  if (process.env.SERPER_API_KEY) {
    console.log('2. Search with Serper API:');
    try {
      const result2 = await webSearch.invoke({
        query: 'Latest AI developments 2026',
        maxResults: 5,
        preferSerper: true,
      });

      console.log(`✓ Success: ${result2.success}`);
      console.log(`✓ Source: ${result2.source}`);
      console.log(`✓ Results: ${result2.results.length}`);
      console.log(`✓ Fallback used: ${result2.metadata?.fallbackUsed}`);
      console.log('\nTop results:');
      result2.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title}`);
        console.log(`     ${r.link}`);
      });
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    console.log('2. Serper API key not found (skipping Serper example)');
    console.log('   Set SERPER_API_KEY environment variable to test Serper integration');
  }

  console.log('\n---\n');

  // Example 3: Demonstrate fallback behavior
  console.log('3. Fallback behavior (DuckDuckGo → Serper):');
  try {
    const result3 = await webSearch.invoke({
      query: 'obscure technical query that might return no results',
      maxResults: 10,
      preferSerper: false, // Prefer DuckDuckGo, but will fallback to Serper if empty
    });

    console.log(`✓ Success: ${result3.success}`);
    console.log(`✓ Source: ${result3.source}`);
    console.log(`✓ Results: ${result3.results.length}`);
    console.log(`✓ Fallback used: ${result3.metadata?.fallbackUsed}`);
    
    if (result3.metadata?.fallbackUsed) {
      console.log('   → DuckDuckGo returned no results, fell back to Serper');
    } else {
      console.log('   → Primary provider returned results, no fallback needed');
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n=== Example Complete ===');
}

main().catch(console.error);

