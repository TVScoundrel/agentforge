import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { 
  csvParser, 
  jsonParser, 
  statistics, 
  arrayFilter, 
  arraySort, 
  arrayGroupBy 
} from '@agentforge/tools';
import { z } from 'zod';
import { createTool } from '@agentforge/core';
import * as fs from 'fs/promises';

/**
 * Data Analyst Example
 * 
 * This example demonstrates an AI data analyst that can:
 * - Load and parse CSV/JSON data
 * - Perform statistical analysis
 * - Generate insights and trends
 * - Create data summaries
 * - Answer questions about datasets
 */

// Custom tool for data profiling
const profileDataTool = createTool()
  .name('profile_data')
  .description('Generate a comprehensive profile of a dataset including types, missing values, and distributions')
  .category('analysis')
  .schema(
    z.object({
      data: z.string().describe('JSON string of the dataset'),
    })
  )
  .implement(async ({ data }) => {
    const dataset = JSON.parse(data);
    
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return 'Invalid dataset: must be a non-empty array';
    }
    
    const profile: any = {
      rowCount: dataset.length,
      columns: {},
    };
    
    // Analyze each column
    const firstRow = dataset[0];
    for (const key of Object.keys(firstRow)) {
      const values = dataset.map(row => row[key]).filter(v => v != null);
      const nullCount = dataset.length - values.length;
      
      const types = new Set(values.map(v => typeof v));
      const uniqueValues = new Set(values);
      
      profile.columns[key] = {
        type: Array.from(types).join('/'),
        nullCount,
        nullPercentage: ((nullCount / dataset.length) * 100).toFixed(2) + '%',
        uniqueCount: uniqueValues.size,
        uniquePercentage: ((uniqueValues.size / values.length) * 100).toFixed(2) + '%',
      };
      
      // Add numeric statistics if applicable
      if (types.has('number')) {
        const numericValues = values.filter(v => typeof v === 'number');
        const sorted = numericValues.sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        
        profile.columns[key].min = sorted[0];
        profile.columns[key].max = sorted[sorted.length - 1];
        profile.columns[key].mean = mean.toFixed(2);
        profile.columns[key].median = sorted[Math.floor(sorted.length / 2)];
      }
    }
    
    return JSON.stringify(profile, null, 2);
  })
  .build();

// Custom tool for generating insights
const generateInsightsTool = createTool()
  .name('generate_insights')
  .description('Generate key insights and patterns from analyzed data')
  .category('analysis')
  .schema(
    z.object({
      data: z.string().describe('JSON string of the dataset'),
      focus: z.string().optional().describe('Specific aspect to focus on'),
    })
  )
  .implement(async ({ data, focus }) => {
    const dataset = JSON.parse(data);
    const insights: string[] = [];
    
    insights.push(`Dataset contains ${dataset.length} records`);
    
    // Find columns with high null rates
    const firstRow = dataset[0];
    for (const key of Object.keys(firstRow)) {
      const nullCount = dataset.filter(row => row[key] == null).length;
      const nullRate = (nullCount / dataset.length) * 100;
      
      if (nullRate > 20) {
        insights.push(`Column "${key}" has ${nullRate.toFixed(1)}% missing values`);
      }
    }
    
    // Find numeric trends
    for (const key of Object.keys(firstRow)) {
      const values = dataset.map(row => row[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const range = sorted[sorted.length - 1] - sorted[0];
        insights.push(`Column "${key}" ranges from ${sorted[0]} to ${sorted[sorted.length - 1]} (range: ${range})`);
      }
    }
    
    return insights.join('\n');
  })
  .build();

async function main() {
  console.log('📊 Data Analyst Starting...\n');

  const filePath = process.argv[2];
  const question = process.argv.slice(3).join(' ') || 'Analyze this dataset and provide key insights';
  
  if (!filePath) {
    console.error('❌ Please provide a data file path');
    console.log('\nUsage: pnpm tsx src/index.ts <file-path> [question]');
    console.log('Example: pnpm tsx src/index.ts data/sales.csv "What are the top selling products?"');
    process.exit(1);
  }

  // Read and parse the file
  let data: string;
  try {
    data = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading file: ${error}`);
    process.exit(1);
  }

  console.log(`📁 File: ${filePath}`);
  console.log(`❓ Question: ${question}\n`);
  console.log('⏳ Analyzing data...\n');

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.2,
  });

  // Create a Plan-Execute agent for structured data analysis
  const agent = createPlanExecuteAgent({
    model,
    tools: [
      csvParser,
      jsonParser,
      statistics,
      arrayFilter,
      arraySort,
      arrayGroupBy,
      profileDataTool,
      generateInsightsTool,
    ],
    systemPrompt: `You are an expert data analyst with strong statistical and analytical skills.
Your role is to:
1. Load and parse data from various formats
2. Profile datasets to understand structure and quality
3. Perform statistical analysis and calculations
4. Identify patterns, trends, and anomalies
5. Generate actionable insights and recommendations
6. Present findings in a clear, structured format

Always be thorough, accurate, and data-driven in your analysis.`,
    maxIterations: 15,
  });

  // Compile the agent
  const compiledAgent = agent.compile();

  try {
    const result = await compiledAgent.invoke({
      messages: [
        {
          role: 'user',
          content: `Here is the data file content:

\`\`\`
${data}
\`\`\`

${question}

Please:
1. Parse and profile the dataset
2. Perform relevant statistical analysis
3. Answer the question with data-driven insights
4. Provide specific numbers and evidence
5. Suggest any additional analysis that might be valuable`,
        },
      ],
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 DATA ANALYSIS REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(result.messages[result.messages.length - 1].content);
    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

main();

