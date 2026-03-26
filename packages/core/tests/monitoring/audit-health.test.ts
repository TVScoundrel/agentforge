import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuditLogger } from '../../src/monitoring/audit.js';
import { createHealthChecker } from '../../src/monitoring/health.js';

describe('monitoring payload contracts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves JSON-safe audit payloads and metadata', async () => {
    const logger = createAuditLogger();

    await logger.log({
      userId: 'user-1',
      action: 'update',
      resource: 'invoice',
      input: {
        id: 'inv-1',
        amount: 42,
        tags: ['urgent'],
      },
      output: {
        ok: true,
        nested: {
          retryable: false,
        },
      },
      metadata: {
        requestId: 'req-1',
        attempt: 1,
      },
    });

    const [entry] = await logger.query();

    expect(entry.input).toEqual({
      id: 'inv-1',
      amount: 42,
      tags: ['urgent'],
    });
    expect(entry.output).toEqual({
      ok: true,
      nested: {
        retryable: false,
      },
    });
    expect(entry.metadata).toEqual({
      requestId: 'req-1',
      attempt: 1,
    });
  });

  it('preserves explicit falsy audit payloads', async () => {
    const logger = createAuditLogger();

    await logger.log({
      userId: 'user-2',
      action: 'sync',
      resource: 'feature-flag',
      input: 0,
      output: false,
      metadata: {
        seen: null,
      },
    });

    const [entry] = await logger.query();

    expect(entry.input).toBe(0);
    expect(entry.output).toBe(false);
    expect(entry.metadata).toEqual({
      seen: null,
    });
  });

  it('preserves explicit zero timestamps in audit entries', async () => {
    const logger = createAuditLogger();

    await logger.log({
      userId: 'user-3',
      action: 'seed',
      resource: 'timeline',
      timestamp: 0,
    });

    const [entry] = await logger.query();

    expect(entry.timestamp).toBe(0);
  });

  it('preserves JSON-safe metadata in health check results', async () => {
    const checker = createHealthChecker({
      checks: {
        database: async () => ({
          healthy: true,
          status: 'healthy',
          metadata: {
            shard: 'primary',
            latencyBucket: 'fast',
          },
        }),
      },
    });

    const report = await checker.getHealth();

    expect(report.status).toBe('healthy');
    expect(report.checks.database.metadata).toEqual({
      shard: 'primary',
      latencyBucket: 'fast',
    });
  });

  it('reports health check errors through onCheckFail', async () => {
    const onCheckFail = vi.fn();
    const checker = createHealthChecker({
      checks: {
        database: async () => {
          throw new Error('database unavailable');
        },
      },
      onCheckFail,
    });

    const report = await checker.getHealth();

    expect(report.status).toBe('unhealthy');
    expect(report.checks.database.error).toBe('database unavailable');
    expect(onCheckFail).toHaveBeenCalledWith('database', expect.any(Error));
  });

  it('routes health check start failures through the shared logger', async () => {
    vi.resetModules();
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const { createHealthChecker: createDynamicHealthChecker } = await import('../../src/monitoring/health.js');
    const checks = {};
    Object.defineProperty(checks, 'database', {
      enumerable: true,
      get() {
        throw new Error('startup failure');
      },
    });
    const checker = createDynamicHealthChecker({
      checks: checks as Record<string, () => Promise<never>>,
      interval: 1_000,
    });

    checker.start();
    await vi.waitFor(() => {
      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('Initial health check failed');
      expect(output).toContain('startup failure');
    });
    checker.stop();
  });
});
