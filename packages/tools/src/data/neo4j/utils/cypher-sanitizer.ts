/**
 * Cypher Sanitization Utilities
 * 
 * Provides safe escaping and validation for Cypher identifiers to prevent injection attacks.
 */

/**
 * Validate and escape a Cypher identifier (label, property key, relationship type)
 * 
 * Cypher identifiers must:
 * - Start with a letter or underscore
 * - Contain only letters, numbers, and underscores
 * - Be backtick-escaped if they contain special characters
 * 
 * @param identifier - The identifier to validate and escape
 * @param type - Type of identifier for error messages
 * @returns Safely escaped identifier
 * @throws Error if identifier is invalid
 */
export function escapeCypherIdentifier(identifier: string, type: string = 'identifier'): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error(`Invalid ${type}: must be a non-empty string`);
  }

  // Remove leading/trailing whitespace
  const trimmed = identifier.trim();
  
  if (trimmed.length === 0) {
    throw new Error(`Invalid ${type}: cannot be empty or whitespace`);
  }

  // Check for null bytes (security risk)
  if (trimmed.includes('\0')) {
    throw new Error(`Invalid ${type}: cannot contain null bytes`);
  }

  // Simple alphanumeric + underscore pattern (safe without escaping)
  const simplePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  if (simplePattern.test(trimmed)) {
    // Safe to use without backticks
    return trimmed;
  }

  // For complex identifiers, use backtick escaping
  // Escape any backticks in the identifier by doubling them
  const escaped = trimmed.replace(/`/g, '``');
  
  return `\`${escaped}\``;
}

/**
 * Validate a label name
 */
export function validateLabel(label: string): string {
  return escapeCypherIdentifier(label, 'label');
}

/**
 * Validate a property key
 */
export function validatePropertyKey(key: string): string {
  return escapeCypherIdentifier(key, 'property key');
}

/**
 * Validate a relationship type
 */
export function validateRelationshipType(type: string): string {
  return escapeCypherIdentifier(type, 'relationship type');
}

/**
 * Validate an array of relationship types
 */
export function validateRelationshipTypes(types: string[]): string[] {
  if (!Array.isArray(types)) {
    throw new Error('Relationship types must be an array');
  }
  
  return types.map(type => validateRelationshipType(type));
}

/**
 * Validate direction parameter
 */
export function validateDirection(direction: string): 'OUTGOING' | 'INCOMING' | 'BOTH' {
  const normalized = direction.toUpperCase();
  
  if (normalized !== 'OUTGOING' && normalized !== 'INCOMING' && normalized !== 'BOTH') {
    throw new Error(`Invalid direction: must be 'OUTGOING', 'INCOMING', or 'BOTH'`);
  }
  
  return normalized as 'OUTGOING' | 'INCOMING' | 'BOTH';
}

/**
 * Build a safe property filter clause
 * 
 * @param properties - Object with property key-value pairs
 * @param nodeVar - Variable name for the node (e.g., 'n')
 * @returns Object with WHERE clause and parameters
 */
export function buildPropertyFilter(
  properties: Record<string, any>,
  nodeVar: string = 'n'
): { whereClause: string; parameters: Record<string, any> } {
  const keys = Object.keys(properties);
  
  if (keys.length === 0) {
    return { whereClause: '', parameters: {} };
  }

  // Validate node variable name
  const safeNodeVar = escapeCypherIdentifier(nodeVar, 'node variable');
  
  // Build WHERE conditions using parameters (safe from injection)
  const conditions = keys.map((key, index) => {
    const safeKey = validatePropertyKey(key);
    const paramName = `prop_${index}`;
    return `${safeNodeVar}.${safeKey} = $${paramName}`;
  });

  const parameters: Record<string, any> = {};
  keys.forEach((key, index) => {
    parameters[`prop_${index}`] = properties[key];
  });

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    parameters,
  };
}

