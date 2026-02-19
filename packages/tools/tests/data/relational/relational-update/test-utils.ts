/**
 * Test utilities for relational UPDATE tests
 * @module tests/relational-update/test-utils
 */

/**
 * Check if better-sqlite3 native bindings are available.
 */
export const hasSQLiteBindings = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();
