import { afterEach, beforeEach, vi } from 'vitest';

export function useAlertManagerTimerHarness(): void {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
}

export function captureStdout(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
}
