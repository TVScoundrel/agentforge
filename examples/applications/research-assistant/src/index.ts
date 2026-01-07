import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { webScraper, httpGet, jsonParser } from '@agentforge/tools';
import { z } from 'zod';
import { createTool } from '@agentforge/core';

/**
 * Research Assistant Example
 * 
 * This example demonstrates a complete research assistant that can:
 * - Search for information on the web
 * - Scrape and analyze web pages
 * - Summarize findings
 * - Generate comprehensive research reports
 */

// Custom tool for web search (simulated - in production use real search API)
const webSearchTool = createTool()
  .name('web_search')
  .description('Search the web for information on a given topic')
  .category('research')
  .schema(
    z.object({
      query: z.string().describe('The search query'),
      numResults: z.number().default(5).describe('Number of results to return'),
    })
  )
  .implement(async ({ query, numResults }) => {
    // In production, integrate with Google Custom Search API, Bing API, etc.
    // For this example, we'll return simulated results
    const results = [
      {
        title: `${query} - Overview`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `Comprehensive information about ${query}...`,
      },
      {
        title: `${query} - Latest Research`,
        url: `https://research.example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `Recent findings and studies on ${query}...`,
      },
      {
        title: `${query} - Expert Analysis`,
        url: `https://experts.example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `Expert opinions and analysis of ${query}...`,
      },
    ].slice(0, numResults);

    return JSON.stringify(results, null, 2);
  })
  .build();

// Custom tool for summarizing text
const summarizeTool = createTool()
  .name('summarize_text')
  .description('Summarize a long piece of text into key points')
  .category('analysis')
  .schema(
    z.object({
      text: z.string().describe('The text to summarize'),
      maxPoints: z.number().default(5).describe('Maximum number of key points'),
    })
  )
  .implement(async ({ text, maxPoints }) => {
    // In production, use an LLM or summarization algorithm
    // For this example, we'll create a simple summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyPoints = sentences.slice(0, maxPoints).map((s, i) => `${i + 1}. ${s.trim()}`);
    
    return `Key Points:\n${keyPoints.join('\n')}`;
  })
  .build();

async function main() {
  console.log('🔬 Research Assistant Starting...\n');

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
  });

  // Create a ReAct agent with research tools
  const agent = createReActAgent({
    model,
    tools: [
      webSearchTool,
      webScraper,
      httpGet,
      jsonParser,
      summarizeTool,
    ],
    systemPrompt: `You are an expert research assistant. Your role is to:
1. Search for relevant information on given topics
2. Analyze and synthesize information from multiple sources
3. Provide comprehensive, well-structured research summaries
4. Cite sources and provide evidence for claims
5. Identify knowledge gaps and suggest further research

Always be thorough, accurate, and objective in your research.`,
    maxIterations: 15,
  });

  // Compile the agent
  const compiledAgent = agent.compile();

  // Example research query
  const researchTopic = process.argv[2] || 'artificial intelligence in healthcare';
  
  console.log(`📚 Researching: "${researchTopic}"\n`);
  console.log('⏳ This may take a moment...\n');

  try {
    const result = await compiledAgent.invoke({
      messages: [
        {
          role: 'user',
          content: `Please research "${researchTopic}" and provide a comprehensive summary including:
1. Overview of the topic
2. Key findings and recent developments
3. Main applications or use cases
4. Challenges and limitations
5. Future outlook

Use the available tools to search for information and analyze sources.`,
        },
      ],
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESEARCH REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(result.messages[result.messages.length - 1].content);
    console.log('\n' + '='.repeat(80));
    console.log('✅ Research complete!');
  } catch (error) {
    console.error('❌ Error during research:', error);
    process.exit(1);
  }
}

main();

