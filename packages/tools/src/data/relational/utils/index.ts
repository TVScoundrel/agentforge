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
  enforceParameterizedQueryUsage,
} from './sql-sanitizer.js';

export {
  validateIdentifier,
  validateQualifiedIdentifier,
  quoteIdentifier,
  quoteQualifiedIdentifier,
  VALID_QUALIFIED_IDENTIFIER_PATTERN,
} from './identifier-utils.js';
