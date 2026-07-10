/**
 * Shared normalization helpers for relational schema type mapping.
 */

/**
 * Normalise a raw database type string for map lookup.
 *
 * Strips size/precision suffixes (`(255)`, `(10,2)`) and converts to
 * lower-case. Also handles `unsigned` and `[]` (PostgreSQL array) suffixes.
 */
export function normaliseDbType(raw: string): string {
  let type = raw.toLowerCase().trim();

  type = type.replace(/\[\]$/, '');
  type = type.replace(/\([\d,\s]+\)/, '');
  type = type.replace(/\s+unsigned$/, '');

  return type.trim();
}
