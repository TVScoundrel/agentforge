import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';

interface ChatOptions {
  model?: string;
}

export async function chatCommand(options: ChatOptions) {
  console.log(chalk.bold.cyan('\n🤖 AI Chat Session\n'));
  console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

  const model = new ChatOpenAI({
    modelName: options.model || 'gpt-4',
    temperature: 0.7,
  });

  const agent = createReActAgent({
    model,
    tools: [],
    systemPrompt: 'You are a helpful AI assistant in a CLI chat session.',
  });

  const messages: any[] = [];

  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalk.green('You:'),
      },
    ]);

    if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
      console.log(chalk.yellow('\n👋 Goodbye!\n'));
      break;
    }

    if (!message.trim()) {
      continue;
    }

    const spinner = ora('Thinking...').start();

    try {
      messages.push({ role: 'user', content: message });

      const result = await agent.invoke({ messages });
      const resultMessages = result.messages as Array<{ content: string }>;
      const lastMessage = resultMessages[resultMessages.length - 1];
      const response = lastMessage?.content || 'No response';

      messages.push({ role: 'assistant', content: response });

      spinner.stop();
      console.log(chalk.blue('AI:'), response, '\n');
    } catch (error: any) {
      spinner.fail('Error');
      console.error(chalk.red('Error:'), error.message, '\n');
    }
  }
}

