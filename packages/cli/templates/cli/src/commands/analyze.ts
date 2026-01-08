import fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';

interface AnalyzeOptions {
  output?: string;
}

export async function analyzeCommand(file: string, options: AnalyzeOptions) {
  console.log(chalk.bold.cyan('\n📊 File Analysis\n'));

  const spinner = ora('Reading file...').start();

  try {
    // Read the file
    const content = await fs.readFile(file, 'utf-8');
    spinner.text = 'Analyzing with AI...';

    // Create agent
    const model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
    });

    const agent = createReActAgent({
      model,
      tools: [],
      systemPrompt: 'You are a code analysis expert. Analyze the provided file and give insights.',
    });

    // Analyze
    const result = await agent.invoke({
      messages: [
        {
          role: 'user',
          content: `Analyze this file:\n\n${content}`,
        },
      ],
    });

    const analysis = result.messages[result.messages.length - 1].content;

    spinner.succeed('Analysis complete');

    console.log(chalk.bold('\nAnalysis Results:\n'));
    console.log(analysis);

    // Save to file if output specified
    if (options.output) {
      await fs.writeFile(options.output, analysis);
      console.log(chalk.green(`\n✅ Results saved to ${options.output}`));
    }

    console.log();
  } catch (error: any) {
    spinner.fail('Analysis failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

