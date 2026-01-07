import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private spinner: Ora | null = null;

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✖'), message);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message);
    }
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  newLine(): void {
    console.log();
  }

  divider(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }

  header(message: string): void {
    this.newLine();
    console.log(chalk.bold.cyan(message));
    this.divider();
  }

  code(code: string): void {
    console.log(chalk.gray('  ' + code));
  }

  list(items: string[]): void {
    items.forEach((item) => {
      console.log(chalk.gray('  •'), item);
    });
  }
}

export const logger = new Logger();

