import path from 'path';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { findFiles, readFile } from '../../utils/fs.js';

interface ToolListOptions {
  category?: string;
  verbose?: boolean;
}

export async function toolListCommand(options: ToolListOptions): Promise<void> {
  try {
    logger.header('📋 List Tools');

    const cwd = process.cwd();
    const toolDir = path.join(cwd, 'src', 'tools');

    // Find all tool files
    const toolFiles = await findFiles('*.ts', toolDir);

    if (toolFiles.length === 0) {
      logger.warn('No tools found');
      logger.info(`Create a tool with: ${chalk.cyan('agentforge tool:create <name>')}`);
      return;
    }

    let filteredTools = toolFiles;

    // Filter by category if specified
    if (options.category) {
      filteredTools = [];
      for (const file of toolFiles) {
        const toolPath = path.join(toolDir, file);
        const content = await readFile(toolPath);
        const category = extractCategory(content);
        if (category === options.category) {
          filteredTools.push(file);
        }
      }
    }

    if (filteredTools.length === 0) {
      logger.warn(`No tools found in category: ${options.category}`);
      return;
    }

    logger.info(`Found ${chalk.cyan(filteredTools.length)} tool(s):\n`);

    for (const file of filteredTools) {
      const toolName = path.basename(file, '.ts');
      const toolPath = path.join(toolDir, file);

      if (options.verbose) {
        // Read file to extract category and description
        const content = await readFile(toolPath);
        const category = extractCategory(content);
        const description = extractDescription(content);

        logger.info(chalk.bold.cyan(`  ${toolName}`));
        if (category) {
          logger.info(`    Category: ${category}`);
        }
        if (description) {
          logger.info(`    Description: ${description}`);
        }
        logger.info(`    Path: ${chalk.gray(toolPath)}`);
        logger.newLine();
      } else {
        logger.info(`  • ${chalk.cyan(toolName)}`);
      }
    }

    if (!options.verbose) {
      logger.newLine();
      logger.info(`Use ${chalk.cyan('--verbose')} for more details`);
    }
  } catch (error: any) {
    logger.error(`Failed to list tools: ${error.message}`);
    process.exit(1);
  }
}

function extractCategory(content: string): string | null {
  const match = content.match(/Category:\s*(\w+)/);
  return match ? match[1] : null;
}

function extractDescription(content: string): string | null {
  const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  return match ? match[1] : null;
}

