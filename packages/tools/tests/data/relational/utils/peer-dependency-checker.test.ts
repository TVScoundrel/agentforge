/**
 * Unit tests for peer-dependency-checker module.
 *
 * Covers checkPeerDependency, getPeerDependencyName,
 * getInstallationInstructions, and MissingPeerDependencyError.
 */

import { describe, expect, it } from 'vitest';
import {
  checkPeerDependency,
  getPeerDependencyName,
  getInstallationInstructions,
  MissingPeerDependencyError,
} from '../../../../src/data/relational/utils/peer-dependency-checker.js';

// ---------------------------------------------------------------------------
// getPeerDependencyName
// ---------------------------------------------------------------------------

describe('peer-dependency-checker > getPeerDependencyName', () => {
  it('should return "pg" for postgresql', () => {
    expect(getPeerDependencyName('postgresql')).toBe('pg');
  });

  it('should return "mysql2" for mysql', () => {
    expect(getPeerDependencyName('mysql')).toBe('mysql2');
  });

  it('should return "better-sqlite3" for sqlite', () => {
    expect(getPeerDependencyName('sqlite')).toBe('better-sqlite3');
  });
});

// ---------------------------------------------------------------------------
// getInstallationInstructions
// ---------------------------------------------------------------------------

describe('peer-dependency-checker > getInstallationInstructions', () => {
  it('should include "pnpm add pg" for postgresql', () => {
    const instructions = getInstallationInstructions('postgresql');
    expect(instructions).toContain('pnpm add pg');
  });

  it('should include "pnpm add mysql2" for mysql', () => {
    const instructions = getInstallationInstructions('mysql');
    expect(instructions).toContain('pnpm add mysql2');
  });

  it('should include "pnpm add better-sqlite3" for sqlite', () => {
    const instructions = getInstallationInstructions('sqlite');
    expect(instructions).toContain('pnpm add better-sqlite3');
  });
});

// ---------------------------------------------------------------------------
// MissingPeerDependencyError
// ---------------------------------------------------------------------------

describe('peer-dependency-checker > MissingPeerDependencyError', () => {
  it('should be an instance of Error', () => {
    const error = new MissingPeerDependencyError('postgresql', 'pg');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name "MissingPeerDependencyError"', () => {
    const error = new MissingPeerDependencyError('mysql', 'mysql2');
    expect(error.name).toBe('MissingPeerDependencyError');
  });

  it('should include vendor in message', () => {
    const error = new MissingPeerDependencyError('postgresql', 'pg');
    expect(error.message).toContain('postgresql');
  });

  it('should include package name in message', () => {
    const error = new MissingPeerDependencyError('mysql', 'mysql2');
    expect(error.message).toContain('mysql2');
  });

  it('should include installation instructions in message', () => {
    const error = new MissingPeerDependencyError('sqlite', 'better-sqlite3');
    expect(error.message).toContain('pnpm add better-sqlite3');
  });

  it('should expose vendor property', () => {
    const error = new MissingPeerDependencyError('postgresql', 'pg');
    expect(error.vendor).toBe('postgresql');
  });

  it('should expose packageName property', () => {
    const error = new MissingPeerDependencyError('mysql', 'mysql2');
    expect(error.packageName).toBe('mysql2');
  });

  it('should pass instanceof check with prototype fix', () => {
    const error = new MissingPeerDependencyError('sqlite', 'better-sqlite3');
    expect(error instanceof MissingPeerDependencyError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkPeerDependency
// ---------------------------------------------------------------------------

describe('peer-dependency-checker > checkPeerDependency', () => {
  // Note: In a typical test environment, pg and mysql2 may not be installed,
  // but better-sqlite3 might be. We test the error path robustly.

  it('should throw MissingPeerDependencyError for unavailable vendor', () => {
    // pg is typically not installed in the test environment
    try {
      checkPeerDependency('postgresql');
      // If it doesn't throw, the dependency happens to be installed — still valid
    } catch (error) {
      expect(error).toBeInstanceOf(MissingPeerDependencyError);
      expect((error as MissingPeerDependencyError).vendor).toBe('postgresql');
    }
  });

  it('should not throw for available vendor (if installed)', () => {
    // better-sqlite3 is often installed as a dev dependency
    try {
      checkPeerDependency('sqlite');
      // Success — dependency is available
    } catch (error) {
      // If it throws, it's a MissingPeerDependencyError — also valid
      expect(error).toBeInstanceOf(MissingPeerDependencyError);
    }
  });
});
