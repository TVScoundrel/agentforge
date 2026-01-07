import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { findFiles, readFile } from '../../utils/fs.js';

interface AgentListOptions {
  verbose?: boolean;
}

export async function agentListCommand(options: AgentListOptions): Promise<void> {
  try {
    logger.header('📋 List Agents');

    const cwd = process.cwd();
    const agentDir = path.join(cwd, 'src', 'agents');

    // Find all agent files
    const agentFiles = await findFiles('*.ts', agentDir);

    if (agentFiles.length === 0) {
      logger.warn('No agents found');
      logger.info(`Create an agent with: ${chalk.cyan('agentforge agent:create <name>')}`);
      return;
    }

    logger.info(`Found ${chalk.cyan(agentFiles.length)} agent(s):\n`);

    for (const file of agentFiles) {
      const agentName = path.basename(file, '.ts');
      const agentPath = path.join(agentDir, file);

      if (options.verbose) {
        // Read file to extract pattern and description
        const content = await readFile(agentPath);
        const pattern = extractPattern(content);
        const description = extractDescription(content);

        logger.info(chalk.bold.cyan(`  ${agentName}`));
        if (pattern) {
          logger.info(`    Pattern: ${pattern}`);
        }
        if (description) {
          logger.info(`    Description: ${description}`);
        }
        logger.info(`    Path: ${chalk.gray(agentPath)}`);
        logger.newLine();
      } else {
        logger.info(`  • ${chalk.cyan(agentName)}`);
      }
    }

    if (!options.verbose) {
      logger.newLine();
      logger.info(`Use ${chalk.cyan('--verbose')} for more details`);
    }
  } catch (error: any) {
    logger.error(`Failed to list agents: ${error.message}`);
    process.exit(1);
  }
}

function extractPattern(content: string): string | null {
  const patterns = ['ReAct', 'Plan-Execute', 'Reflection', 'Multi-Agent'];
  for (const pattern of patterns) {
    if (content.includes(`create${pattern.replace('-', '')}Agent`)) {
      return pattern;
    }
  }
  return null;
}

function extractDescription(content: string): string | null {
  const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  return match ? match[1] : null;
}

