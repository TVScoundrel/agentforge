import { logger } from './logger.js';

export interface CommandFailureOptions {
  spinnerFailureText?: string;
  message?: string;
  prefix?: string;
  logError?: boolean;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}

export function exitWithCommandError(
  error: unknown,
  options: CommandFailureOptions = {}
): never {
  if (options.spinnerFailureText) {
    logger.failSpinner(options.spinnerFailureText);
  }

  if (options.logError !== false) {
    const message = options.message ?? getErrorMessage(error);
    logger.error(options.prefix ? `${options.prefix}: ${message}` : message);
  }

  process.exit(1);
}
