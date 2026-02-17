/**
 * Runtime peer dependency checker for database drivers
 * @module utils/peer-dependency-checker
 */

import type { DatabaseVendor } from '../types.js';

/**
 * Mapping of database vendors to their required peer dependencies
 */
const VENDOR_DEPENDENCIES: Record<DatabaseVendor, string> = {
  postgresql: 'pg',
  mysql: 'mysql2',
  sqlite: 'better-sqlite3',
};

/**
 * Installation instructions for each database driver
 */
const INSTALLATION_INSTRUCTIONS: Record<DatabaseVendor, string> = {
  postgresql: 'pnpm add pg @types/pg',
  mysql: 'pnpm add mysql2',
  sqlite: 'pnpm add better-sqlite3 @types/better-sqlite3',
};

/**
 * Error thrown when a required peer dependency is missing
 */
export class MissingPeerDependencyError extends Error {
  constructor(
    public readonly vendor: DatabaseVendor,
    public readonly packageName: string,
  ) {
    super(
      `Missing peer dependency for ${vendor} database.\n\n` +
        `The '${packageName}' package is required but not installed.\n\n` +
        `To fix this, install the required peer dependency:\n` +
        `  ${INSTALLATION_INSTRUCTIONS[vendor]}\n\n` +
        `For more information, see the @agentforge/tools documentation.`,
    );
    this.name = 'MissingPeerDependencyError';
    Object.setPrototypeOf(this, MissingPeerDependencyError.prototype);
  }
}

/**
 * Check if a peer dependency is available
 * @param packageName - Name of the package to check
 * @returns true if the package is available, false otherwise
 */
function isPeerDependencyAvailable(packageName: string): boolean {
  try {
    // Try to resolve the package
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the required peer dependency for a database vendor is installed
 * @param vendor - Database vendor to check
 * @throws {MissingPeerDependencyError} If the required peer dependency is not installed
 */
export function checkPeerDependency(vendor: DatabaseVendor): void {
  const packageName = VENDOR_DEPENDENCIES[vendor];

  if (!isPeerDependencyAvailable(packageName)) {
    throw new MissingPeerDependencyError(vendor, packageName);
  }
}

/**
 * Get the required peer dependency package name for a database vendor
 * @param vendor - Database vendor
 * @returns Package name of the required peer dependency
 */
export function getPeerDependencyName(vendor: DatabaseVendor): string {
  return VENDOR_DEPENDENCIES[vendor];
}

/**
 * Get installation instructions for a database vendor
 * @param vendor - Database vendor
 * @returns Installation command for the required peer dependency
 */
export function getInstallationInstructions(vendor: DatabaseVendor): string {
  return INSTALLATION_INSTRUCTIONS[vendor];
}

