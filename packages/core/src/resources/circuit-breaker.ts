/**
 * Circuit breaker pattern for fault tolerance
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod?: number;
  halfOpenRequests?: number;
  onStateChange?: (state: CircuitState, previousState: CircuitState) => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
  shouldTrip?: (error: Error) => boolean;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  failureRate: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateChanges: number;
}

interface CallRecord {
  timestamp: number;
  success: boolean;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private totalCalls = 0;
  private stateChanges = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private resetTimer?: NodeJS.Timeout;
  private callHistory: CallRecord[] = [];
  private halfOpenAttempts = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    if (this.state === 'half-open') {
      const maxAttempts = this.options.halfOpenRequests || 1;
      if (this.halfOpenAttempts >= maxAttempts) {
        throw new Error('Circuit breaker is half-open and at capacity');
      }
      this.halfOpenAttempts++;
    }

    this.totalCalls++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  wrap<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs) => {
      return this.execute(() => fn(...args));
    };
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.recordCall(true);
    this.options.onSuccess?.();

    if (this.state === 'half-open') {
      // Transition to closed after successful half-open request
      this.transitionTo('closed');
      this.failures = 0;
      this.halfOpenAttempts = 0;
    }
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.recordCall(false);
    this.options.onFailure?.(error);

    // Check if error should trip the circuit
    const shouldTrip = this.options.shouldTrip?.(error) ?? true;
    if (!shouldTrip) {
      return;
    }

    if (this.state === 'half-open') {
      // Transition back to open on failure in half-open state
      this.transitionTo('open');
      this.halfOpenAttempts = 0;
      this.scheduleReset();
    } else if (this.state === 'closed') {
      // Check if we should open the circuit
      const recentFailures = this.getRecentFailures();
      if (recentFailures >= this.options.failureThreshold) {
        this.transitionTo('open');
        this.scheduleReset();
      }
    }
  }

  private recordCall(success: boolean): void {
    this.callHistory.push({
      timestamp: Date.now(),
      success,
    });

    // Clean up old records
    const monitoringPeriod = this.options.monitoringPeriod || 60000;
    const cutoff = Date.now() - monitoringPeriod;
    this.callHistory = this.callHistory.filter((record) => record.timestamp >= cutoff);
  }

  private getRecentFailures(): number {
    return this.callHistory.filter((record) => !record.success).length;
  }

  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.transitionTo('half-open');
      this.halfOpenAttempts = 0;
    }, this.options.resetTimeout);
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    if (previousState === newState) {
      return;
    }

    this.state = newState;
    this.stateChanges++;
    this.options.onStateChange?.(newState, previousState);
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalCalls: this.totalCalls,
      failureRate: this.totalCalls > 0 ? this.failures / this.totalCalls : 0,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChanges: this.stateChanges,
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.callHistory = [];

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}

export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}

