import { logger } from '../utils/logger.js';
import { runScript, detectPackageManager } from '../utils/package-manager.js';

interface DevOptions {
  port?: string;
  open?: boolean;
}

export async function devCommand(options: DevOptions): Promise<void> {
  try {
    logger.header('🚀 Starting Development Server');

    const cwd = process.cwd();
    const packageManager = await detectPackageManager(cwd);

    logger.info(`Port: ${options.port || '3000'}`);
    logger.info(`Package manager: ${packageManager}`);
    logger.newLine();

    logger.startSpinner('Starting development server...');

    // Set environment variables
    if (options.port) {
      process.env.PORT = options.port;
    }

    await runScript(cwd, 'dev', packageManager);

    logger.succeedSpinner('Development server started');
  } catch (error: any) {
    logger.failSpinner('Failed to start development server');
    logger.error(error.message);
    process.exit(1);
  }
}

