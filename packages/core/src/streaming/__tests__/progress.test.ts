import { describe, it, expect, vi } from 'vitest';
import { createProgressTracker } from '../progress.js';

describe('Progress Tracker', () => {
  it('should track progress correctly', () => {
    const onProgress = vi.fn();
    const tracker = createProgressTracker({
      total: 100,
      onProgress,
    });

    tracker.start();
    tracker.update(25);

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        current: 25,
        total: 100,
        percentage: 25,
      })
    );
  });

  it('should calculate ETA correctly', async () => {
    const tracker = createProgressTracker({ total: 100 });

    tracker.start();
    tracker.update(25);
    await new Promise((resolve) => setTimeout(resolve, 100));
    tracker.update(50);

    const progress = tracker.getProgress();

    expect(progress.current).toBe(50);
    expect(progress.percentage).toBe(50);
    // ETA should be calculated based on progress rate
    expect(progress.eta).toBeGreaterThanOrEqual(0);
    // Allow small timing tolerance (setTimeout may fire slightly early on CI)
    expect(progress.elapsed).toBeGreaterThanOrEqual(90);
  });

  it('should call onComplete when complete', () => {
    const onComplete = vi.fn();
    const tracker = createProgressTracker({
      total: 100,
      onComplete,
    });

    tracker.start();
    tracker.complete();

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        current: 100,
        total: 100,
        percentage: 100,
        eta: 0,
      })
    );
  });

  it('should handle cancellation', () => {
    const onCancel = vi.fn();
    const tracker = createProgressTracker({
      total: 100,
      onCancel,
    });

    tracker.start();
    tracker.update(50);
    tracker.cancel();

    expect(onCancel).toHaveBeenCalled();
    expect(tracker.isCancelled()).toBe(true);
  });

  it('should throw error when updating cancelled tracker', () => {
    const tracker = createProgressTracker({ total: 100 });

    tracker.start();
    tracker.cancel();

    expect(() => tracker.update(50)).toThrow('Progress tracker cancelled');
  });

  it('should throw error when completing cancelled tracker', () => {
    const tracker = createProgressTracker({ total: 100 });

    tracker.start();
    tracker.cancel();

    expect(() => tracker.complete()).toThrow('Progress tracker cancelled');
  });

  it('should throw error when starting already started tracker', () => {
    const tracker = createProgressTracker({ total: 100 });

    tracker.start();

    expect(() => tracker.start()).toThrow('Progress tracker already started');
  });

  it('should throw error when updating before start', () => {
    const tracker = createProgressTracker({ total: 100 });

    expect(() => tracker.update(50)).toThrow('Progress tracker not started');
  });

  it('should throw error when completing before start', () => {
    const tracker = createProgressTracker({ total: 100 });

    expect(() => tracker.complete()).toThrow('Progress tracker not started');
  });

  it('should throw error for invalid total', () => {
    expect(() => createProgressTracker({ total: 0 })).toThrow('Total must be greater than 0');
  });

  it('should throw error for negative progress', () => {
    const tracker = createProgressTracker({ total: 100 });

    tracker.start();

    expect(() => tracker.update(-10)).toThrow('Current progress cannot be negative');
  });

  it('should cap progress at total', () => {
    const onProgress = vi.fn();
    const tracker = createProgressTracker({
      total: 100,
      onProgress,
    });

    tracker.start();
    tracker.update(150);

    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        current: 100,
        total: 100,
        percentage: 100,
      })
    );
  });

  it('should not call onCancel multiple times', () => {
    const onCancel = vi.fn();
    const tracker = createProgressTracker({
      total: 100,
      onCancel,
    });

    tracker.start();
    tracker.cancel();
    tracker.cancel();

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should round percentage to 2 decimal places', () => {
    const tracker = createProgressTracker({ total: 3 });

    tracker.start();
    tracker.update(1);

    const progress = tracker.getProgress();

    expect(progress.percentage).toBe(33.33);
  });
});

