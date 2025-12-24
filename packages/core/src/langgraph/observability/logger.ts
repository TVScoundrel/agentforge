/**
 * Structured Logging Utilities
 *
 * Provides consistent, structured logging for LangGraph agents.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output
   * @default LogLevel.INFO
   */
  level?: LogLevel;

  /**
   * Output format
   * @default 'pretty'
   */
  format?: 'json' | 'pretty';

  /**
   * Output destination
   * @default process.stdout
   */
  destination?: NodeJS.WritableStream;

  /**
   * Whether to include timestamps
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Whether to include context in logs
   * @default true
   */
  includeContext?: boolean;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  name: string;
  message: string;
  timestamp?: string;
  context?: Record<string, any>;
  data?: Record<string, any>;
}

/**
 * Logger interface
 */
export interface Logger {
  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, any>): void;

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, any>): void;

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, any>): void;

  /**
   * Log an error message
   */
  error(message: string, data?: Record<string, any>): void;

  /**
   * Create a child logger with additional context
   */
  withContext(context: Record<string, any>): Logger;
}

/**
 * Logger implementation
 */
class LoggerImpl implements Logger {
  private name: string;
  private options: Required<LoggerOptions>;
  private context: Record<string, any>;

  constructor(name: string, options: LoggerOptions = {}, context: Record<string, any> = {}) {
    this.name = name;
    this.context = context;
    this.options = {
      level: options.level ?? LogLevel.INFO,
      format: options.format ?? 'pretty',
      destination: options.destination ?? process.stdout,
      includeTimestamp: options.includeTimestamp ?? true,
      includeContext: options.includeContext ?? true,
    };
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  withContext(context: Record<string, any>): Logger {
    return new LoggerImpl(this.name, this.options, { ...this.context, ...context });
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    // Check if this log level should be output
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.options.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      name: this.name,
      message,
    };

    if (this.options.includeTimestamp) {
      entry.timestamp = new Date().toISOString();
    }

    if (this.options.includeContext && Object.keys(this.context).length > 0) {
      entry.context = this.context;
    }

    if (data) {
      entry.data = data;
    }

    const output = this.format(entry);
    this.options.destination.write(output + '\n');
  }

  private format(entry: LogEntry): string {
    if (this.options.format === 'json') {
      return JSON.stringify(entry);
    }

    // Pretty format
    const parts: string[] = [];

    if (entry.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(`[${entry.name}]`);
    parts.push(entry.message);

    if (entry.context) {
      parts.push(`context=${JSON.stringify(entry.context)}`);
    }

    if (entry.data) {
      parts.push(`data=${JSON.stringify(entry.data)}`);
    }

    return parts.join(' ');
  }
}

/**
 * Create a structured logger.
 *
 * @example
 * ```typescript
 * import { createLogger, LogLevel } from '@agentforge/core';
 *
 * const logger = createLogger('my-agent', {
 *   level: LogLevel.INFO,
 *   format: 'json',
 * });
 *
 * logger.info('Processing request', { userId: 'user-123' });
 * logger.error('Request failed', { error: err.message });
 * ```
 *
 * @param name - Logger name (typically the agent or component name)
 * @param options - Logger configuration options
 * @returns A logger instance
 */
export function createLogger(name: string, options?: LoggerOptions): Logger {
  return new LoggerImpl(name, options);
}

