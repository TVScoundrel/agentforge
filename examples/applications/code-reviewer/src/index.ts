import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createReflectionAgent } from '@agentforge/patterns';
import { fileReader, directoryList } from '@agentforge/tools';
import { z } from 'zod';
import { createTool } from '@agentforge/core';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Code Reviewer Example
 * 
 * This example demonstrates an AI code reviewer that can:
 * - Analyze code quality and style
 * - Identify potential bugs and security issues
 * - Suggest improvements and best practices
 * - Check for code smells and anti-patterns
 * - Generate comprehensive review reports
 */

// Custom tool for analyzing code complexity
const analyzeComplexityTool = createTool()
  .name('analyze_complexity')
  .description('Analyze code complexity metrics (cyclomatic complexity, nesting depth, etc.)')
  .category('analysis')
  .schema(
    z.object({
      code: z.string().describe('The code to analyze'),
      language: z.string().describe('Programming language (typescript, javascript, python, etc.)'),
    })
  )
  .implement(async ({ code, language }) => {
    // Simplified complexity analysis
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*'));
    
    // Count control flow statements
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1;
    for (const line of lines) {
      for (const keyword of controlFlowKeywords) {
        if (line.includes(keyword)) complexity++;
      }
    }
    
    // Calculate nesting depth
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      currentNesting += (line.match(/{/g) || []).length;
      currentNesting -= (line.match(/}/g) || []).length;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    
    return JSON.stringify({
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      cyclomaticComplexity: complexity,
      maxNestingDepth: maxNesting,
      commentRatio: (commentLines.length / nonEmptyLines.length * 100).toFixed(2) + '%',
    }, null, 2);
  })
  .build();

// Custom tool for checking best practices
const checkBestPracticesTool = createTool()
  .name('check_best_practices')
  .description('Check code against common best practices and patterns')
  .category('analysis')
  .schema(
    z.object({
      code: z.string().describe('The code to check'),
      language: z.string().describe('Programming language'),
    })
  )
  .implement(async ({ code, language }) => {
    const issues: string[] = [];
    
    // Check for common issues
    if (code.includes('console.log') && language === 'typescript') {
      issues.push('Found console.log statements - consider using a proper logging library');
    }
    
    if (code.includes('any') && language === 'typescript') {
      issues.push('Found "any" type usage - consider using more specific types');
    }
    
    if (code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]{200,}}/)) {
      issues.push('Found long functions - consider breaking them into smaller functions');
    }
    
    if (!code.includes('/**') && code.length > 100) {
      issues.push('Missing JSDoc comments - add documentation for public APIs');
    }
    
    if (code.includes('var ')) {
      issues.push('Found "var" keyword - use "const" or "let" instead');
    }
    
    if (code.match(/catch\s*\([^)]*\)\s*{\s*}/)) {
      issues.push('Found empty catch blocks - handle errors properly');
    }
    
    return issues.length > 0 
      ? `Found ${issues.length} best practice issues:\n${issues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`
      : 'No best practice issues found!';
  })
  .build();

async function main() {
  console.log('🔍 Code Reviewer Starting...\n');

  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Please provide a file path to review');
    console.log('\nUsage: pnpm tsx src/index.ts <file-path>');
    console.log('Example: pnpm tsx src/index.ts src/index.ts');
    process.exit(1);
  }

  // Read the file
  let code: string;
  try {
    code = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading file: ${error}`);
    process.exit(1);
  }

  const language = path.extname(filePath).slice(1) || 'typescript';

  console.log(`📄 Reviewing: ${filePath}`);
  console.log(`🔤 Language: ${language}`);
  console.log(`📏 Size: ${code.length} characters\n`);
  console.log('⏳ Analyzing code...\n');

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.3,
  });

  // Create a Reflection agent for thorough code review
  const agent = createReflectionAgent({
    model,
    tools: [
      analyzeComplexityTool,
      checkBestPracticesTool,
      fileReader,
    ],
    systemPrompt: `You are an expert code reviewer with deep knowledge of software engineering best practices.
Your role is to:
1. Analyze code quality, readability, and maintainability
2. Identify potential bugs, security issues, and performance problems
3. Suggest specific improvements with code examples
4. Check adherence to best practices and design patterns
5. Provide constructive, actionable feedback

Be thorough but constructive. Focus on high-impact improvements.`,
    maxIterations: 10,
    reflectionPrompt: `Review your code analysis and ensure you've covered:
- Code quality and style
- Potential bugs and edge cases
- Security considerations
- Performance implications
- Best practices and patterns
- Specific, actionable suggestions`,
  });

  // Compile the agent
  const compiledAgent = agent.compile();

  try {
    const result = await compiledAgent.invoke({
      messages: [
        {
          role: 'user',
          content: `Please review the following ${language} code and provide a comprehensive code review:

\`\`\`${language}
${code}
\`\`\`

Include:
1. Overall code quality assessment
2. Complexity analysis
3. Best practices check
4. Potential issues (bugs, security, performance)
5. Specific improvement suggestions with examples
6. Summary and priority recommendations`,
        },
      ],
    });

    console.log('\n' + '='.repeat(80));
    console.log('📋 CODE REVIEW REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(result.messages[result.messages.length - 1].content);
    console.log('\n' + '='.repeat(80));
    console.log('✅ Review complete!');
  } catch (error) {
    console.error('❌ Error during code review:', error);
    process.exit(1);
  }
}

main();

