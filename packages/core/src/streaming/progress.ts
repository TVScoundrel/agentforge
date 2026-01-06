/**
 * Progress tracking for long-running operations
 * @module streaming/progress
 */

import type { Progress, ProgressTracker, ProgressTrackerOptions } from './types.js';

/**
 * Create a progress tracker for long-running operations
 *
 * @example
 * ```typescript
 * const tracker = createProgressTracker({
 *   total: 100,
 *   onProgress: (progress) => {
 *     console.log(`${progress.percentage}% complete (ETA: ${progress.eta}s)`);
 *   },
 * });
 *
 * tracker.start();
 * for (let i = 0; i < 100; i++) {
 *   await processItem(i);
 *   tracker.update(i + 1);
 * }
 * tracker.complete();
 * ```
 */
export function createProgressTracker(options: ProgressTrackerOptions): ProgressTracker {
  const { total, onProgress, onComplete, onCancel } = options;

  if (total <= 0) {
    throw new Error('Total must be greater than 0');
  }

  let current = 0;
  let startTime = 0;
  let cancelled = false;

  const calculateProgress = (): Progress => {
    const elapsed = Date.now() - startTime;
    const percentage = Math.min(100, (current / total) * 100);

    // Calculate ETA based on current progress
    let eta = 0;
    if (current > 0 && current < total) {
      const timePerItem = elapsed / current;
      const remaining = total - current;
      eta = Math.round((timePerItem * remaining) / 1000); // Convert to seconds
    }

    return {
      current,
      total,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      eta,
      startTime,
      elapsed,
    };
  };

  return {
    start(): void {
      if (startTime > 0) {
        throw new Error('Progress tracker already started');
      }
      startTime = Date.now();
      current = 0;
      cancelled = false;
    },

    update(newCurrent: number): void {
      if (startTime === 0) {
        throw new Error('Progress tracker not started');
      }

      if (cancelled) {
        throw new Error('Progress tracker cancelled');
      }

      if (newCurrent < 0) {
        throw new Error('Current progress cannot be negative');
      }

      if (newCurrent > total) {
        newCurrent = total;
      }

      current = newCurrent;

      if (onProgress) {
        onProgress(calculateProgress());
      }
    },

    complete(): void {
      if (startTime === 0) {
        throw new Error('Progress tracker not started');
      }

      if (cancelled) {
        throw new Error('Progress tracker cancelled');
      }

      current = total;

      const progress = calculateProgress();

      if (onProgress) {
        onProgress(progress);
      }

      if (onComplete) {
        onComplete(progress);
      }
    },

    cancel(): void {
      if (startTime === 0) {
        throw new Error('Progress tracker not started');
      }

      if (cancelled) {
        return; // Already cancelled
      }

      cancelled = true;

      if (onCancel) {
        onCancel();
      }
    },

    getProgress(): Progress {
      if (startTime === 0) {
        throw new Error('Progress tracker not started');
      }

      return calculateProgress();
    },

    isCancelled(): boolean {
      return cancelled;
    },
  };
}

