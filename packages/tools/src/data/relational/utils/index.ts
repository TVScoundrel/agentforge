/**
 * Utility functions for database operations
 * @module utils
 */

export {
  checkPeerDependency,
  getPeerDependencyName,
  getInstallationInstructions,
  MissingPeerDependencyError,
} from './peer-dependency-checker.js';

export {
  validateSqlString,
  escapeSqlStringValue,
  validateTableName,
  validateColumnName,
  enforceParameterizedQueryUsage,
} from './sql-sanitizer.js';
