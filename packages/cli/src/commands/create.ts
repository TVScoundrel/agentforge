import path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { promptProjectSetup } from '../utils/prompts.js';
import { copyTemplate, ensureDir, isEmptyDir, writeJson, getTemplatePath } from '../utils/fs.js';
import { installDependencies, getRunCommand, type PackageManager } from '../utils/package-manager.js';
import { initGitRepository, createInitialCommit, isGitInstalled } from '../utils/git.js';

interface CreateOptions {
  template?: 'minimal' | 'full' | 'api' | 'cli';
  packageManager?: PackageManager;
  install?: boolean;
  git?: boolean;
}

export async function createCommand(
  projectName: string,
  options: CreateOptions
): Promise<void> {
  try {
    logger.header('🚀 Create AgentForge Project');

    // Validate project name
    if (!projectName) {
      logger.error('Project name is required');
      process.exit(1);
    }

    const targetPath = path.join(process.cwd(), projectName);

    // Check if directory exists and is not empty
    if (!(await isEmptyDir(targetPath))) {
      logger.error(`Directory ${projectName} already exists and is not empty`);
      process.exit(1);
    }

    // Prompt for project setup if not all options provided
    const answers = await promptProjectSetup({
      projectName,
      template: options.template,
      packageManager: options.packageManager,
      installDependencies: options.install,
      initGit: options.git,
    });

    logger.newLine();
    logger.info(`Creating project: ${chalk.cyan(answers.projectName)}`);
    logger.info(`Template: ${chalk.cyan(answers.template)}`);
    logger.info(`Package manager: ${chalk.cyan(answers.packageManager)}`);
    logger.newLine();

    // Create project directory
    logger.startSpinner('Creating project directory...');
    await ensureDir(targetPath);
    logger.succeedSpinner('Project directory created');

    // Copy template
    logger.startSpinner('Copying template files...');
    const templatePath = getTemplatePath(answers.template);
    await copyTemplate(templatePath, targetPath, {
      PROJECT_NAME: answers.projectName,
      AUTHOR: answers.author || '',
      DESCRIPTION: answers.description || `AgentForge project created with ${answers.template} template`,
      PACKAGE_MANAGER: answers.packageManager,
    });
    logger.succeedSpinner('Template files copied');

    // Update package.json
    logger.startSpinner('Updating package.json...');
    const packageJsonPath = path.join(targetPath, 'package.json');
    const packageJson = await import(packageJsonPath, { assert: { type: 'json' } });
    packageJson.default.name = answers.projectName;
    if (answers.author) {
      packageJson.default.author = answers.author;
    }
    if (answers.description) {
      packageJson.default.description = answers.description;
    }
    await writeJson(packageJsonPath, packageJson.default);
    logger.succeedSpinner('package.json updated');

    // Install dependencies
    if (answers.installDependencies) {
      logger.startSpinner('Installing dependencies...');
      try {
        await installDependencies(targetPath, answers.packageManager);
        logger.succeedSpinner('Dependencies installed');
      } catch (error) {
        logger.failSpinner('Failed to install dependencies');
        logger.warn('You can install them manually later');
      }
    }

    // Initialize git
    if (answers.initGit && (await isGitInstalled())) {
      logger.startSpinner('Initializing git repository...');
      try {
        await initGitRepository(targetPath);
        await createInitialCommit(targetPath);
        logger.succeedSpinner('Git repository initialized');
      } catch (error) {
        logger.failSpinner('Failed to initialize git');
        logger.warn('You can initialize it manually later');
      }
    }

    // Success message
    logger.newLine();
    logger.success(chalk.bold.green('✨ Project created successfully!'));
    logger.newLine();
    logger.header('📝 Next Steps');
    logger.list([
      `cd ${answers.projectName}`,
      answers.installDependencies
        ? getRunCommand(answers.packageManager, 'dev')
        : `${answers.packageManager} install`,
    ]);
    logger.newLine();
    logger.info('Happy coding! 🎉');
  } catch (error: any) {
    logger.error(`Failed to create project: ${error.message}`);
    process.exit(1);
  }
}

