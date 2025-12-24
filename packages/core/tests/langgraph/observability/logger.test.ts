import { describe, it, expect } from 'vitest';
import { Writable } from 'stream';
import { createLogger, LogLevel } from '../../../src/langgraph/observability/logger.js';

// Helper to capture log output
class CaptureStream extends Writable {
  public output: string[] = [];

  _write(chunk: any, encoding: string, callback: () => void): void {
    this.output.push(chunk.toString());
    callback();
  }

  clear(): void {
    this.output = [];
  }
}

describe('Structured Logging', () => {
  describe('createLogger', () => {
    it('should create a logger', () => {
      const logger = createLogger('test');
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should log info messages', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      logger.info('Test message');

      expect(stream.output.length).toBe(1);
      expect(stream.output[0]).toContain('[INFO]');
      expect(stream.output[0]).toContain('[test]');
      expect(stream.output[0]).toContain('Test message');
    });

    it('should log error messages', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      logger.error('Error message');

      expect(stream.output.length).toBe(1);
      expect(stream.output[0]).toContain('[ERROR]');
      expect(stream.output[0]).toContain('Error message');
    });

    it('should log warning messages', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      logger.warn('Warning message');

      expect(stream.output.length).toBe(1);
      expect(stream.output[0]).toContain('[WARN]');
      expect(stream.output[0]).toContain('Warning message');
    });

    it('should log debug messages', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', {
        destination: stream,
        level: LogLevel.DEBUG,
      });

      logger.debug('Debug message');

      expect(stream.output.length).toBe(1);
      expect(stream.output[0]).toContain('[DEBUG]');
      expect(stream.output[0]).toContain('Debug message');
    });

    it('should respect log level filtering', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', {
        destination: stream,
        level: LogLevel.WARN,
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(stream.output.length).toBe(2); // Only WARN and ERROR
      expect(stream.output[0]).toContain('[WARN]');
      expect(stream.output[1]).toContain('[ERROR]');
    });

    it('should include data in logs', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      logger.info('Test message', { userId: 'user-123', count: 5 });

      expect(stream.output[0]).toContain('userId');
      expect(stream.output[0]).toContain('user-123');
      expect(stream.output[0]).toContain('count');
    });

    it('should format as JSON when configured', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', {
        destination: stream,
        format: 'json',
      });

      logger.info('Test message', { key: 'value' });

      const parsed = JSON.parse(stream.output[0]);
      expect(parsed.level).toBe('info');
      expect(parsed.name).toBe('test');
      expect(parsed.message).toBe('Test message');
      expect(parsed.data).toEqual({ key: 'value' });
    });

    it('should include timestamps when configured', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', {
        destination: stream,
        includeTimestamp: true,
      });

      logger.info('Test message');

      expect(stream.output[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should exclude timestamps when configured', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', {
        destination: stream,
        includeTimestamp: false,
      });

      logger.info('Test message');

      expect(stream.output[0]).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('withContext', () => {
    it('should create a child logger with context', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      const childLogger = logger.withContext({ userId: 'user-123' });

      childLogger.info('Test message');

      expect(stream.output[0]).toContain('userId');
      expect(stream.output[0]).toContain('user-123');
    });

    it('should merge context from multiple levels', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      const child1 = logger.withContext({ userId: 'user-123' });
      const child2 = child1.withContext({ sessionId: 'session-456' });

      child2.info('Test message');

      expect(stream.output[0]).toContain('userId');
      expect(stream.output[0]).toContain('user-123');
      expect(stream.output[0]).toContain('sessionId');
      expect(stream.output[0]).toContain('session-456');
    });

    it('should not affect parent logger', () => {
      const stream = new CaptureStream();
      const logger = createLogger('test', { destination: stream });

      const childLogger = logger.withContext({ userId: 'user-123' });

      logger.info('Parent message');
      childLogger.info('Child message');

      expect(stream.output[0]).not.toContain('userId');
      expect(stream.output[1]).toContain('userId');
    });
  });
});

