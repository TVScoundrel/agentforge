import { describe, expect, it, vi } from 'vitest';
import { createAlertManager } from '../../../src/monitoring/alerts.js';
import { useAlertManagerTimerHarness } from './shared.js';

describe('AlertManager rule evaluation', () => {
  useAlertManagerTimerHarness();

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

    // @ts-expect-error rules can only reference declared channel keys
    createAlertManager({
      channels: {
        opsEmail: {
          type: 'email',
          config: {
            to: 'ops@example.com',
          },
        },
      },
      rules: [
        {
          name: 'missing-channel',
          severity: 'warning',
          channels: ['unknownChannel'],
          condition: () => true,
        },
      ],
    });

    expect(manager).toBeDefined();
  });
});
