/**
 * Test data fixtures for integration tests.
 *
 * Provides DDL statements and seed data for consistent testing across vendors.
 * Each vendor may require slightly different SQL syntax.
 *
 * @module integration/setup/fixtures
 */

import type { DatabaseVendor } from '../../../../../src/data/relational/types.js';

/**
 * DDL statements to create the test schema.
 * Returns vendor-specific SQL because auto-increment syntax varies.
 */
export function getCreateTableStatements(vendor: DatabaseVendor): string[] {
  const autoIncrement = vendor === 'mysql' ? 'AUTO_INCREMENT' : '';
  const serialType = vendor === 'postgresql' ? 'SERIAL' : 'INTEGER';
  const primaryKeyExtra =
    vendor === 'sqlite'
      ? 'PRIMARY KEY AUTOINCREMENT'
      : vendor === 'mysql'
        ? `PRIMARY KEY ${autoIncrement}`
        : 'PRIMARY KEY';

  return [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id ${serialType} ${primaryKeyExtra},
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      age INTEGER,
      active ${vendor === 'postgresql' ? 'BOOLEAN' : 'TINYINT(1)'} DEFAULT ${vendor === 'postgresql' ? 'true' : '1'},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id ${serialType} ${primaryKeyExtra},
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100),
      stock INTEGER DEFAULT 0
    )`,

    // Orders table (foreign key relationships)
    `CREATE TABLE IF NOT EXISTS orders (
      id ${serialType} ${primaryKeyExtra},
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total DECIMAL(10, 2),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
  ];
}

/**
 * Seed data inserted into the test tables.
 * Returns arrays of parameterized insert SQL + params per vendor.
 */
export function getSeedStatements(vendor: DatabaseVendor): Array<{ sql: string; params: unknown[] }> {
  const placeholder = vendor === 'postgresql' ? '$' : '?';

  function ph(n: number): string {
    if (vendor === 'postgresql') {
      return Array.from({ length: n }, (_, i) => `$${i + 1}`).join(', ');
    }
    return Array.from({ length: n }, () => '?').join(', ');
  }

  return [
    // Seed users
    {
      sql: `INSERT INTO users (name, email, age, active) VALUES (${ph(4)})`,
      params: ['Alice', 'alice@example.com', 30, vendor === 'postgresql' ? true : 1],
    },
    {
      sql: `INSERT INTO users (name, email, age, active) VALUES (${ph(4)})`,
      params: ['Bob', 'bob@example.com', 25, vendor === 'postgresql' ? true : 1],
    },
    {
      sql: `INSERT INTO users (name, email, age, active) VALUES (${ph(4)})`,
      params: ['Carol', 'carol@example.com', 35, vendor === 'postgresql' ? false : 0],
    },

    // Seed products
    {
      sql: `INSERT INTO products (name, price, category, stock) VALUES (${ph(4)})`,
      params: ['Widget A', 9.99, 'widgets', 100],
    },
    {
      sql: `INSERT INTO products (name, price, category, stock) VALUES (${ph(4)})`,
      params: ['Widget B', 19.99, 'widgets', 50],
    },
    {
      sql: `INSERT INTO products (name, price, category, stock) VALUES (${ph(4)})`,
      params: ['Gadget C', 49.99, 'gadgets', 25],
    },

    // Seed orders
    {
      sql: `INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (${ph(5)})`,
      params: [1, 1, 2, 19.98, 'completed'],
    },
    {
      sql: `INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (${ph(5)})`,
      params: [1, 3, 1, 49.99, 'pending'],
    },
    {
      sql: `INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (${ph(5)})`,
      params: [2, 2, 3, 59.97, 'shipped'],
    },
  ];
}

/**
 * DDL statements to drop the test schema (reverse order for FK constraints).
 */
export function getDropTableStatements(): string[] {
  return [
    'DROP TABLE IF EXISTS orders',
    'DROP TABLE IF EXISTS products',
    'DROP TABLE IF EXISTS users',
  ];
}
