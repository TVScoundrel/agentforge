import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAlertManager } from '../../src/monitoring/alerts.js';

describe('AlertManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs typed alert rules and forwards metrics payloads to onAlert', async () => {
    type MetricsSnapshot = {
      queueDepth: number;
      service: string;
    };

    const onAlert = vi.fn();
    const manager = createAlertManager<MetricsSnapshot>({
      channels: {},
      rules: [
        {
          name: 'queue-depth',
          severity: 'warning',
          channels: [],
          condition: (metrics) => metrics.queueDepth > 5,
          message: 'Queue depth exceeded threshold',
        },
      ],
      onAlert,
    });

    manager.start(() => ({ queueDepth: 6, service: 'worker-a' }), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    manager.stop();

    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'queue-depth',
        severity: 'warning',
        message: 'Queue depth exceeded threshold',
        data: {
          metrics: {
            queueDepth: 6,
            service: 'worker-a',
          },
        },
      })
    );
  });

  it('preserves explicit zero timestamps on direct alerts', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const onAlert = vi.fn();
    const manager = createAlertManager({
      channels: {},
      onAlert,
    });

    await manager.alert({
      name: 'epoch-alert',
      severity: 'info',
      message: 'Preserve timestamp',
      timestamp: 0,
    });

    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'epoch-alert',
        timestamp: 0,
      })
    );
  });

  it('respects per-rule throttling across repeated checks', async () => {
    const onAlert = vi.fn();
    const manager = createAlertManager<{ errorRate: number }>({
      channels: {},
      rules: [
        {
          name: 'error-rate',
          severity: 'critical',
          channels: [],
          throttle: 5000,
          condition: (metrics) => metrics.errorRate > 0.1,
        },
      ],
      onAlert,
    });

    manager.start(() => ({ errorRate: 0.5 }), 1000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onAlert).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    manager.stop();

    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it('logs rule failures when async alert callbacks reject through dispatch', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const manager = createAlertManager<{ queueDepth: number }>({
      channels: {},
      rules: [
        {
          name: 'queue-depth',
          severity: 'warning',
          channels: [],
          condition: (metrics) => metrics.queueDepth > 5,
        },
      ],
      onAlert: async () => {
        throw new Error('callback failed');
      },
    });

    manager.start(() => ({ queueDepth: 6 }), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    manager.stop();

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(output).toContain('Alert dispatch failed');
    expect(output).toContain('alert-dispatch');
    expect(output).toContain('callback failed');
  });

  it('enforces built-in channel config requirements at compile time', () => {
    const channels = {
      opsEmail: {
        type: 'email' as const,
        config: {
          to: ['ops@example.com', 'backup@example.com'],
        },
      },
      opsSlack: {
        type: 'slack' as const,
        config: {
          webhookUrl: 'https://hooks.slack.test/services/ops',
        },
      },
      auditStream: {
        type: 'custom-webhook' as const,
        config: {
          endpoint: 'audit://events',
        },
      },
    };

    const manager = createAlertManager({
      channels,
    });

    createAlertManager({
      channels: {
        validCustom: {
          type: 'pagerduty',
          config: {
            integrationKey: 'abc123',
          },
        },
      },
    });

    // @ts-expect-error built-in email channels require string or string[] recipients
    createAlertManager({
      channels: {
        invalidEmail: {
          type: 'email',
          config: {
            to: [1],
          },
        },
      },
    });

    // @ts-expect-error built-in slack channels require webhookUrl
    createAlertManager({
      channels: {
        invalidSlack: {
          type: 'slack',
          config: {},
        },
      },
    });

    // @ts-expect-error built-in channel literals cannot bypass validation as custom channels
    createAlertManager({
      channels: {
        invalidBuiltIn: {
          type: 'email',
          config: {
            endpoint: 'audit://events',
          },
        },
      },
    });

    expect(manager).toBeDefined();
  });

  it('logs channel delivery details using JSON-safe payloads', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const manager = createAlertManager({
      channels: {
        opsEmail: {
          type: 'email',
          config: {
            to: 'ops@example.com',
          },
        },
      },
    });

    await manager.sendToChannel('opsEmail', {
      name: 'latency',
      severity: 'warning',
      message: 'Latency exceeded threshold',
    });

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(output).toContain('Alert sent to email');
    expect(output).toContain('ops@example.com');
    expect(output).toContain('latency');
  });
});
