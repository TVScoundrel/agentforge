import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      logger.success('Test success');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Test warning');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Test error');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug message when DEBUG is set', () => {
      process.env.DEBUG = 'true';
      logger.debug('Test debug');
      expect(consoleLogSpy).toHaveBeenCalled();
      delete process.env.DEBUG;
    });

    it('should not log debug message when DEBUG is not set', () => {
      delete process.env.DEBUG;
      logger.debug('Test debug');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('spinner', () => {
    it('should start spinner', () => {
      logger.startSpinner('Loading...');
      expect(logger['spinner']).toBeTruthy();
      logger.stopSpinner();
    });

    it('should update spinner text', () => {
      logger.startSpinner('Loading...');
      logger.updateSpinner('Still loading...');
      expect(logger['spinner']?.text).toBe('Still loading...');
      logger.stopSpinner();
    });

    it('should succeed spinner', () => {
      logger.startSpinner('Loading...');
      logger.succeedSpinner('Done!');
      expect(logger['spinner']).toBeNull();
    });

    it('should fail spinner', () => {
      logger.startSpinner('Loading...');
      logger.failSpinner('Failed!');
      expect(logger['spinner']).toBeNull();
    });

    it('should stop spinner', () => {
      logger.startSpinner('Loading...');
      logger.stopSpinner();
      expect(logger['spinner']).toBeNull();
    });
  });

  describe('formatting', () => {
    it('should log new line', () => {
      logger.newLine();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log divider', () => {
      logger.divider();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log header', () => {
      logger.header('Test Header');
      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // newLine + header + divider
    });

    it('should log code', () => {
      logger.code('const x = 1;');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log list', () => {
      logger.list(['Item 1', 'Item 2', 'Item 3']);
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });
});

