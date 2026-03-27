import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exitWithCommandError,
  getErrorMessage,
} from '../../src/utils/command-errors.js';
import * as logger from '../../src/utils/logger.js';

vi.mock('../../src/utils/logger.js');

describe('command-errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  describe('getErrorMessage', () => {
    it('returns Error messages', () => {
      expect(getErrorMessage(new Error('boom'))).toBe('boom');
    });

    it('returns string inputs unchanged', () => {
      expect(getErrorMessage('boom')).toBe('boom');
    });

    it('reads string message properties from unknown objects', () => {
      expect(getErrorMessage({ message: 'boom' })).toBe('boom');
    });
  });

  describe('exitWithCommandError', () => {
    it('fails the spinner and logs the normalized message', () => {
      exitWithCommandError(new Error('boom'), { spinnerFailureText: 'Failed' });

      expect(logger.logger.failSpinner).toHaveBeenCalledWith('Failed');
      expect(logger.logger.error).toHaveBeenCalledWith('boom');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('supports prefixed messages', () => {
      exitWithCommandError(new Error('boom'), { prefix: 'Failed to create tool' });

      expect(logger.logger.error).toHaveBeenCalledWith('Failed to create tool: boom');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('can skip error logging when the caller already handled it', () => {
      exitWithCommandError(new Error('boom'), { logError: false });

      expect(logger.logger.error).not.toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
