import { describe, expect, it } from 'vitest';
import { createAlertManager } from '../../../src/monitoring/alerts.js';
import { captureStdout, useAlertManagerTimerHarness } from './shared.js';

describe('AlertManager channel dispatch', () => {
  useAlertManagerTimerHarness();

  it('logs channel delivery details using JSON-safe payloads', async () => {
    const writeSpy = captureStdout();
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
