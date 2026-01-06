import type { NodeFunction } from '../types.js';

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

  const limiters = new Map<string, RateLimiter>();

  return async (state: State): Promise<State | Partial<State>> => {
    const key = keyGenerator(state);

    // Get or create rate limiter for this key
    if (!limiters.has(key)) {
      let limiter: RateLimiter;

      switch (strategy) {
        case 'token-bucket':
          limiter = new TokenBucket(maxRequests, maxRequests / windowMs);
          break;
        case 'sliding-window':
          limiter = new SlidingWindow(maxRequests, windowMs);
          break;
        case 'fixed-window':
          limiter = new FixedWindow(maxRequests, windowMs);
          break;
        default:
          throw new Error(`Unknown rate limit strategy: ${strategy}`);
      }

      limiters.set(key, limiter);
    }

    const limiter = limiters.get(key)!;

    // Try to consume a token/request
    if (!limiter.tryConsume()) {
      if (onRateLimitExceeded) {
        onRateLimitExceeded(key);
      }
      throw new Error(`Rate limit exceeded for key: ${key}`);
    }

    // Execute the node
    return await Promise.resolve(node(state));
  };
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

  const limiters = new Map<string, RateLimiter>();

  return {
    withRateLimit: <State>(node: NodeFunction<State>, keyGenerator = () => 'global') => {
      return async (state: State): Promise<State | Partial<State>> => {
        const key = keyGenerator(state);

        // Get or create rate limiter for this key
        if (!limiters.has(key)) {
          let limiter: RateLimiter;

          switch (strategy) {
            case 'token-bucket':
              limiter = new TokenBucket(maxRequests, maxRequests / windowMs);
              break;
            case 'sliding-window':
              limiter = new SlidingWindow(maxRequests, windowMs);
              break;
            case 'fixed-window':
              limiter = new FixedWindow(maxRequests, windowMs);
              break;
            default:
              throw new Error(`Unknown rate limit strategy: ${strategy}`);
          }

          limiters.set(key, limiter);
        }

        const limiter = limiters.get(key)!;

        // Try to consume a token/request
        if (!limiter.tryConsume()) {
          if (onRateLimitExceeded) {
            onRateLimitExceeded(key);
          }
          throw new Error(`Rate limit exceeded for key: ${key}`);
        }

        // Execute the node
        return await Promise.resolve(node(state));
      };
    },
    reset: (key?: string) => {
      if (key) {
        const limiter = limiters.get(key);
        if (limiter) {
          limiter.reset();
          if (onRateLimitReset) {
            onRateLimitReset(key);
          }
        }
      } else {
        // Reset all limiters
        limiters.forEach((limiter, k) => {
          limiter.reset();
          if (onRateLimitReset) {
            onRateLimitReset(k);
          }
        });
      }
    },
  };
}

