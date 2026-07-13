import type { NodeFunction } from './types.js';
import { createControlledNode } from './controller-runtime.js';

/**
 * Rate limiting strategy
 */
export type RateLimitStrategy = 'token-bucket' | 'sliding-window' | 'fixed-window';

/**
 * Rate limiting options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Rate limiting strategy
   * @default 'token-bucket'
   */
  strategy?: RateLimitStrategy;

  /**
   * Callback when rate limit is exceeded
   */
  onRateLimitExceeded?: (key: string) => void;

  /**
   * Callback when rate limit is reset
   */
  onRateLimitReset?: (key: string) => void;

  /**
   * Key generator function to identify unique clients/requests
   * @default Returns a constant key (global rate limit)
   */
  keyGenerator?: <State>(state: State) => string;
}

/**
 * Token bucket rate limiter
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per millisecond
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Sliding window rate limiter
 */
class SlidingWindow {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  tryConsume(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Fixed window rate limiter
 */
class FixedWindow {
  private count: number = 0;
  private windowStart: number;

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    this.windowStart = Date.now();
  }

  tryConsume(): boolean {
    const now = Date.now();

    // Check if we're in a new window
    if (now - this.windowStart >= this.windowMs) {
      this.count = 0;
      this.windowStart = now;
    }

    if (this.count < this.maxRequests) {
      this.count++;
      return true;
    }

    return false;
  }

  reset(): void {
    this.count = 0;
    this.windowStart = Date.now();
  }
}

type RateLimiter = TokenBucket | SlidingWindow | FixedWindow;

function createRateLimiter(
  strategy: RateLimitStrategy,
  maxRequests: number,
  windowMs: number
): RateLimiter {
  switch (strategy) {
    case 'token-bucket':
      return new TokenBucket(maxRequests, maxRequests / windowMs);
    case 'sliding-window':
      return new SlidingWindow(maxRequests, windowMs);
    case 'fixed-window':
      return new FixedWindow(maxRequests, windowMs);
    default:
      throw new Error(`Unknown rate limit strategy: ${strategy}`);
  }
}

class RateLimiterRegistry {
  private readonly limiters = new Map<string, RateLimiter>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly strategy: RateLimitStrategy,
    private readonly onRateLimitExceeded?: (key: string) => void,
    private readonly onRateLimitReset?: (key: string) => void
  ) {}

  async execute<State>(
    state: State,
    key: string,
    executor: (state: State) => Promise<State | Partial<State>>
  ): Promise<State | Partial<State>> {
    const limiter = this.getOrCreate(key);

    if (!limiter.tryConsume()) {
      this.onRateLimitExceeded?.(key);
      throw new Error(`Rate limit exceeded for key: ${key}`);
    }

    return executor(state);
  }

  reset(key?: string): void {
    if (key) {
      this.resetLimiter(key, this.limiters.get(key));
      return;
    }

    this.limiters.forEach((limiter, limiterKey) => {
      this.resetLimiter(limiterKey, limiter);
    });
  }

  private getOrCreate(key: string): RateLimiter {
    const existing = this.limiters.get(key);
    if (existing) {
      return existing;
    }

    const limiter = createRateLimiter(this.strategy, this.maxRequests, this.windowMs);
    this.limiters.set(key, limiter);
    return limiter;
  }

  private resetLimiter(key: string, limiter?: RateLimiter): void {
    if (!limiter) {
      return;
    }

    limiter.reset();
    this.onRateLimitReset?.(key);
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit<State>(
  node: NodeFunction<State>,
  options: RateLimitOptions
): NodeFunction<State> {
  const {
    maxRequests,
    windowMs,
    strategy = 'token-bucket',
    onRateLimitExceeded,
    onRateLimitReset,
    keyGenerator = () => 'global',
  } = options;

  const registry = new RateLimiterRegistry(
    maxRequests,
    windowMs,
    strategy,
    onRateLimitExceeded,
    onRateLimitReset
  );

  return createControlledNode(
    node,
    keyGenerator,
    (state: State, key, executor) => registry.execute(state, key, executor)
  );
}

/**
 * Create a shared rate limiter that can be used across multiple nodes
 */
export function createSharedRateLimiter(
  options: Omit<RateLimitOptions, 'keyGenerator'>
): {
  withRateLimit: <State>(node: NodeFunction<State>, keyGenerator?: (state: State) => string) => NodeFunction<State>;
  reset: (key?: string) => void;
} {
  const {
    maxRequests,
    windowMs,
    strategy = 'token-bucket',
    onRateLimitExceeded,
    onRateLimitReset,
  } = options;

  const registry = new RateLimiterRegistry(
    maxRequests,
    windowMs,
    strategy,
    onRateLimitExceeded,
    onRateLimitReset
  );

  return {
    withRateLimit: <State>(node: NodeFunction<State>, keyGenerator = () => 'global') => {
      return createControlledNode(
        node,
        keyGenerator,
        (state: State, key, executor) => registry.execute(state, key, executor)
      );
    },
    reset: (key?: string) => {
      registry.reset(key);
    },
  };
}
