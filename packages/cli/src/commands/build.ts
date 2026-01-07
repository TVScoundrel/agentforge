import { logger } from '../utils/logger.js';
import { runScript, detectPackageManager } from '../utils/package-manager.js';

interface BuildOptions {
  minify?: boolean;
  sourcemap?: boolean;
}

export async function buildCommand(options: BuildOptions): Promise<void> {
  try {
    logger.header('📦 Building for Production');

    const cwd = process.cwd();
    const packageManager = await detectPackageManager(cwd);

    logger.info(`Minify: ${options.minify !== false ? 'Yes' : 'No'}`);
    logger.info(`Sourcemap: ${options.sourcemap !== false ? 'Yes' : 'No'}`);
    logger.newLine();

    logger.startSpinner('Building project...');

    // Set environment variables
    process.env.NODE_ENV = 'production';
    if (options.minify === false) {
      process.env.NO_MINIFY = 'true';
    }
    if (options.sourcemap === false) {
      process.env.NO_SOURCEMAP = 'true';
    }

    await runScript(cwd, 'build', packageManager);

    logger.succeedSpinner('Build completed successfully');
    logger.newLine();
    logger.success('✨ Production build ready!');
  } catch (error: any) {
    logger.failSpinner('Build failed');
    logger.error(error.message);
    process.exit(1);
  }
}

