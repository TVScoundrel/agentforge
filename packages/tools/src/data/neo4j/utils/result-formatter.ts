/**
 * Neo4j Result Formatter
 * 
 * Utilities for formatting Neo4j query results into JSON-serializable objects.
 */

import { Node, Relationship, Path, Integer } from 'neo4j-driver';
import type { Neo4jNode, Neo4jRelationship, Neo4jPath } from '../types.js';

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
export function formatValue(value: any): any {
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
    const formatted: Record<string, any> = {};
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
    properties: formatValue(node.properties),
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
    properties: formatValue(rel.properties),
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
export function formatResults(records: any[]): any[] {
  return records.map((record) => {
    const formatted: Record<string, any> = {};
    for (const key of record.keys) {
      formatted[key] = formatValue(record.get(key));
    }
    return formatted;
  });
}

