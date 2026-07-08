import { describe, expect, it, vi } from 'vitest';
import { createAlertManager } from '../../../src/monitoring/alerts.js';
import { useAlertManagerTimerHarness } from './shared.js';

describe('AlertManager throttling', () => {
  useAlertManagerTimerHarness();

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
});
