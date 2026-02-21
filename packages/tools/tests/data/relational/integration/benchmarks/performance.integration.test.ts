/**
 * Performance Benchmark Integration Tests
 *
 * Measures CRUD operation performance across all three database vendors.
 * Results are logged for comparison — assertions only ensure operations complete
 * within generous time bounds (not micro-benchmarking).
 *
 * Requires Docker (PostgreSQL, MySQL) and compiled better-sqlite3 (SQLite).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import type { DatabaseVendor } from '../../../../../src/data/relational/types.js';
import {
  startPostgreSQLContainer,
  stopPostgreSQLContainer,
  type PostgreSQLContainerInfo,
} from '../setup/containers.js';
import {
  startMySQLContainer,
  stopMySQLContainer,
  type MySQLContainerInfo,
} from '../setup/containers.js';
import { setupTestSchema, measureTime } from '../setup/test-helpers.js';

const hasSQLiteBindings = (() => {
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

let pgContainer: PostgreSQLContainerInfo;
let mysqlContainer: MySQLContainerInfo;

interface VendorSetup {
  vendor: DatabaseVendor;
  manager: ConnectionManager;
  placeholder: (n: number) => string;
}

const vendors: VendorSetup[] = [];
const benchmarkResults: Array<{
  vendor: string;
  operation: string;
  durationMs: number;
  rowCount: number;
}> = [];

describe('Performance Benchmarks', () => {
  beforeAll(async () => {
    // Start PostgreSQL container
    pgContainer = await startPostgreSQLContainer();
    const pgConfig: ConnectionConfig = {
      vendor: 'postgresql',
      connection: pgContainer.connectionString,
    };
    const pgManager = new ConnectionManager(pgConfig);
    await pgManager.connect();
    vendors.push({
      vendor: 'postgresql',
      manager: pgManager,
      placeholder: (n) => Array.from({ length: n }, (_, i) => `$${i + 1}`).join(', '),
    });

    // Start MySQL container
    mysqlContainer = await startMySQLContainer();
    const mysqlConfig: ConnectionConfig = {
      vendor: 'mysql',
      connection: {
        host: mysqlContainer.host,
        port: mysqlContainer.port,
        database: mysqlContainer.database,
        user: mysqlContainer.user,
        password: mysqlContainer.password,
      },
    };
    const mysqlManager = new ConnectionManager(mysqlConfig);
    await mysqlManager.connect();
    vendors.push({
      vendor: 'mysql',
      manager: mysqlManager,
      placeholder: (n) => Array.from({ length: n }, () => '?').join(', '),
    });

    // Set up SQLite if available
    if (hasSQLiteBindings) {
      const sqliteConfig: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };
      const sqliteManager = new ConnectionManager(sqliteConfig);
      await sqliteManager.connect();
      vendors.push({
        vendor: 'sqlite',
        manager: sqliteManager,
        placeholder: (n) => Array.from({ length: n }, () => '?').join(', '),
      });
    }

    // Set up test schema for all vendors
    for (const v of vendors) {
      await setupTestSchema(v.manager, v.vendor);
    }
  }, 180_000);

  afterAll(async () => {
    // Log benchmark summary
    console.log('\n=== Performance Benchmark Results ===');
    console.table(benchmarkResults);

    // Clean up
    for (const v of vendors) {
      if (v.manager.isConnected()) {
        await v.manager.disconnect();
      }
    }
    if (pgContainer) await stopPostgreSQLContainer(pgContainer);
    if (mysqlContainer) await stopMySQLContainer(mysqlContainer);
  }, 30_000);

  describe('INSERT Performance', () => {
    const ROW_COUNT = 100;

    for (const vendorName of ['postgresql', 'mysql', 'sqlite'] as const) {
      it(`should insert ${ROW_COUNT} rows individually — ${vendorName}`, async () => {
        const v = vendors.find((x) => x.vendor === vendorName);
        if (!v) return; // vendor not available

        // Create a temporary table
        const createSql =
          vendorName === 'postgresql'
            ? 'CREATE TABLE IF NOT EXISTS bench_insert (id SERIAL PRIMARY KEY, val VARCHAR(255), num INTEGER)'
            : vendorName === 'mysql'
              ? 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTO_INCREMENT, val VARCHAR(255), num INTEGER)'
              : 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTOINCREMENT, val VARCHAR(255), num INTEGER)';

        // DDL goes straight through manager.execute() to bypass the SQL sanitiser
        await v.manager.execute(sql.raw('DROP TABLE IF EXISTS bench_insert'));
        await v.manager.execute(sql.raw(createSql));

        const { durationMs } = await measureTime(async () => {
          for (let i = 0; i < ROW_COUNT; i++) {
            await executeQuery(v.manager, {
              sql: `INSERT INTO bench_insert (val, num) VALUES (${v.placeholder(2)})`,
              params: [`value_${i}`, i],
              vendor: vendorName,
            });
          }
        });

        benchmarkResults.push({
          vendor: vendorName,
          operation: `INSERT ${ROW_COUNT} rows (sequential)`,
          durationMs: Math.round(durationMs),
          rowCount: ROW_COUNT,
        });

        // Verify count
        const result = await executeQuery(v.manager, {
          sql: 'SELECT COUNT(*) as cnt FROM bench_insert',
          vendor: vendorName,
        });
        expect(Number((result.rows[0] as any).cnt)).toBe(ROW_COUNT);

        // Generous bound: 30s for 100 sequential inserts
        expect(durationMs).toBeLessThan(30_000);
      });
    }
  });

  describe('SELECT Performance', () => {
    // Seed bench_insert independently so this section is not coupled to INSERT
    beforeAll(async () => {
      for (const v of vendors) {
        const createSql =
          v.vendor === 'postgresql'
            ? 'CREATE TABLE IF NOT EXISTS bench_insert (id SERIAL PRIMARY KEY, val VARCHAR(255), num INTEGER)'
            : v.vendor === 'mysql'
              ? 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTO_INCREMENT, val VARCHAR(255), num INTEGER)'
              : 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTOINCREMENT, val VARCHAR(255), num INTEGER)';
        await v.manager.execute(sql.raw('DROP TABLE IF EXISTS bench_insert'));
        await v.manager.execute(sql.raw(createSql));
        for (let i = 0; i < 100; i++) {
          await executeQuery(v.manager, {
            sql: `INSERT INTO bench_insert (val, num) VALUES (${v.placeholder(2)})`,
            params: [`value_${i}`, i],
            vendor: v.vendor,
          });
        }
      }
    }, 120_000);

    for (const vendorName of ['postgresql', 'mysql', 'sqlite'] as const) {
      it(`should select all rows from bench_insert — ${vendorName}`, async () => {
        const v = vendors.find((x) => x.vendor === vendorName);
        if (!v) return;

        const { result, durationMs } = await measureTime(async () => {
          return executeQuery(v.manager, {
            sql: 'SELECT * FROM bench_insert ORDER BY id',
            vendor: vendorName,
          });
        });

        benchmarkResults.push({
          vendor: vendorName,
          operation: 'SELECT all rows',
          durationMs: Math.round(durationMs),
          rowCount: result.rows.length,
        });

        expect(result.rows.length).toBeGreaterThanOrEqual(100);
        expect(durationMs).toBeLessThan(5_000);
      });

      it(`should select with filtering — ${vendorName}`, async () => {
        const v = vendors.find((x) => x.vendor === vendorName);
        if (!v) return;

        const p = vendorName === 'postgresql' ? '$1' : '?';

        const { result, durationMs } = await measureTime(async () => {
          return executeQuery(v.manager, {
            sql: `SELECT * FROM bench_insert WHERE num < ${p}`,
            params: [50],
            vendor: vendorName,
          });
        });

        benchmarkResults.push({
          vendor: vendorName,
          operation: 'SELECT with WHERE',
          durationMs: Math.round(durationMs),
          rowCount: result.rows.length,
        });

        expect(result.rows.length).toBe(50);
        expect(durationMs).toBeLessThan(5_000);
      });
    }
  });

  describe('UPDATE Performance', () => {
    // Seed bench_insert independently so this section is not coupled to INSERT
    beforeAll(async () => {
      for (const v of vendors) {
        const createSql =
          v.vendor === 'postgresql'
            ? 'CREATE TABLE IF NOT EXISTS bench_insert (id SERIAL PRIMARY KEY, val VARCHAR(255), num INTEGER)'
            : v.vendor === 'mysql'
              ? 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTO_INCREMENT, val VARCHAR(255), num INTEGER)'
              : 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTOINCREMENT, val VARCHAR(255), num INTEGER)';
        await v.manager.execute(sql.raw('DROP TABLE IF EXISTS bench_insert'));
        await v.manager.execute(sql.raw(createSql));
        for (let i = 0; i < 100; i++) {
          await executeQuery(v.manager, {
            sql: `INSERT INTO bench_insert (val, num) VALUES (${v.placeholder(2)})`,
            params: [`value_${i}`, i],
            vendor: v.vendor,
          });
        }
      }
    }, 120_000);

    for (const vendorName of ['postgresql', 'mysql', 'sqlite'] as const) {
      it(`should update all rows — ${vendorName}`, async () => {
        const v = vendors.find((x) => x.vendor === vendorName);
        if (!v) return;

        const p = vendorName === 'postgresql' ? '$1' : '?';

        const { durationMs } = await measureTime(async () => {
          await executeQuery(v.manager, {
            sql: `UPDATE bench_insert SET val = ${p}`,
            params: ['updated'],
            vendor: vendorName,
          });
        });

        benchmarkResults.push({
          vendor: vendorName,
          operation: 'UPDATE all rows',
          durationMs: Math.round(durationMs),
          rowCount: 100,
        });

        expect(durationMs).toBeLessThan(5_000);
      });
    }
  });

  describe('DELETE Performance', () => {
    // Seed bench_insert independently so this section is not coupled to INSERT
    beforeAll(async () => {
      for (const v of vendors) {
        const createSql =
          v.vendor === 'postgresql'
            ? 'CREATE TABLE IF NOT EXISTS bench_insert (id SERIAL PRIMARY KEY, val VARCHAR(255), num INTEGER)'
            : v.vendor === 'mysql'
              ? 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTO_INCREMENT, val VARCHAR(255), num INTEGER)'
              : 'CREATE TABLE IF NOT EXISTS bench_insert (id INTEGER PRIMARY KEY AUTOINCREMENT, val VARCHAR(255), num INTEGER)';
        await v.manager.execute(sql.raw('DROP TABLE IF EXISTS bench_insert'));
        await v.manager.execute(sql.raw(createSql));
        for (let i = 0; i < 100; i++) {
          await executeQuery(v.manager, {
            sql: `INSERT INTO bench_insert (val, num) VALUES (${v.placeholder(2)})`,
            params: [`value_${i}`, i],
            vendor: v.vendor,
          });
        }
      }
    }, 120_000);

    for (const vendorName of ['postgresql', 'mysql', 'sqlite'] as const) {
      it(`should delete all rows — ${vendorName}`, async () => {
        const v = vendors.find((x) => x.vendor === vendorName);
        if (!v) return;

        const { durationMs } = await measureTime(async () => {
          // DELETE with no WHERE needs to bypass the SQL sanitiser which
          // requires parameters for DML statements.
          await v.manager.execute(sql.raw('DELETE FROM bench_insert'));
        });

        benchmarkResults.push({
          vendor: vendorName,
          operation: 'DELETE all rows',
          durationMs: Math.round(durationMs),
          rowCount: 100,
        });

        // Verify
        const result = await executeQuery(v.manager, {
          sql: 'SELECT COUNT(*) as cnt FROM bench_insert',
          vendor: vendorName,
        });
        expect(Number((result.rows[0] as any).cnt)).toBe(0);

        expect(durationMs).toBeLessThan(5_000);
      });
    }
  });
});
