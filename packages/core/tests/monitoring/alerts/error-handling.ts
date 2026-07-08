import { describe, expect, it, vi } from 'vitest';
import { createAlertManager } from '../../../src/monitoring/alerts.js';
import { captureStdout, useAlertManagerTimerHarness } from './shared.js';

describe('AlertManager error handling', () => {
  useAlertManagerTimerHarness();

  it('logs callback failures without rejecting direct alerts', async () => {
    const writeSpy = captureStdout();
    const manager = createAlertManager({
      channels: {},
      onAlert: async () => {
        throw new Error('callback failed');
      },
    });

    await expect(
      manager.alert({
        name: 'callback-failure',
        severity: 'warning',
        message: 'Callback failure should not reject alert()',
      })
    ).resolves.toBeUndefined();

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(output).toContain('Alert callback failed');
    expect(output).toContain('alert-callback');
    expect(output).toContain('callback failed');
    expect(output).toContain('Alert triggered');
  });

  it('keeps monitoring after metrics collection throws', async () => {
    const writeSpy = captureStdout();
    const onAlert = vi.fn();
    let attempt = 0;

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
      onAlert,
    });

    manager.start(() => {
      attempt += 1;
      if (attempt === 1) {
        throw new Error('metrics unavailable');
      }

      return { queueDepth: 6 };
    }, 1000);

    await vi.advanceTimersByTimeAsync(2000);
    manager.stop();

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join('');
    expect(output).toContain('Metrics collection failed');
    expect(output).toContain('metrics-provider');
    expect(output).toContain('metrics unavailable');
    expect(onAlert).toHaveBeenCalledTimes(1);
  });
});
