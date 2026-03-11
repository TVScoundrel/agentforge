/**
 * Neo4j Result Formatter
 * 
 * Utilities for formatting Neo4j query results into JSON-serializable objects.
 */

import { Node, Relationship, Path, Integer } from 'neo4j-driver';
import type { Neo4jNode, Neo4jRelationship, Neo4jPath } from '../types.js';

type Neo4jRecord = {
  keys: string[];
  get: (key: string) => unknown;
};

type RawNeo4jRecord = {
  keys: PropertyKey[];
  get: (key: PropertyKey) => unknown;
};

function normalizeRecord(record: RawNeo4jRecord): Neo4jRecord {
  const originalKeyByString = new Map<string, PropertyKey>();
  const normalizedKeys: string[] = [];

  for (const key of record.keys) {
    const keyString = String(key);
    if (!originalKeyByString.has(keyString)) {
      originalKeyByString.set(keyString, key);
      normalizedKeys.push(keyString);
    }
  }

  return {
    keys: normalizedKeys,
    get: (key: string) => record.get(originalKeyByString.get(key) ?? key),
  };
}

/**
 * Convert Neo4j Integer to JavaScript number or string
 */
export function formatInteger(value: Integer): number | string {
  if (value.inSafeRange()) {
    return value.toNumber();
  }
  return value.toString();
}

/**
 * Format any Neo4j value to JSON-serializable format
 */
export function formatValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Neo4j Integer
  if (value instanceof Integer) {
    return formatInteger(value);
  }

  // Handle Neo4j Node
  if (value instanceof Node) {
    return formatNode(value);
  }

  // Handle Neo4j Relationship
  if (value instanceof Relationship) {
    return formatRelationship(value);
  }

  // Handle Neo4j Path
  if (value instanceof Path) {
    return formatPath(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(formatValue);
  }

  // Handle objects
  if (typeof value === 'object') {
    const formatted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      formatted[key] = formatValue(val);
    }
    return formatted;
  }

  return value;
}

/**
 * Format a Neo4j Node to a plain object
 */
export function formatNode(node: Node): Neo4jNode {
  return {
    identity: formatInteger(node.identity),
    labels: node.labels,
    properties: formatValue(node.properties) as Neo4jNode['properties'],
  };
}

/**
 * Format a Neo4j Relationship to a plain object
 */
export function formatRelationship(rel: Relationship): Neo4jRelationship {
  return {
    identity: formatInteger(rel.identity),
    type: rel.type,
    start: formatInteger(rel.start),
    end: formatInteger(rel.end),
    properties: formatValue(rel.properties) as Neo4jRelationship['properties'],
  };
}

/**
 * Format a Neo4j Path to a plain object
 */
export function formatPath(path: Path): Neo4jPath {
  return {
    start: formatNode(path.start),
    end: formatNode(path.end),
    segments: path.segments.map((segment) => ({
      start: formatNode(segment.start),
      relationship: formatRelationship(segment.relationship),
      end: formatNode(segment.end),
    })),
    length: path.length,
  };
}

/**
 * Format query results to JSON-serializable format
 */
export function formatResults(records: RawNeo4jRecord[]): Array<Record<string, unknown>> {
  return records.map((rawRecord) => {
    const record = normalizeRecord(rawRecord);
    const formatted: Record<string, unknown> = {};
    for (const key of record.keys) {
      formatted[key] = formatValue(record.get(key));
    }
    return formatted;
  });
}
