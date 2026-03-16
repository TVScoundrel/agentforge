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
