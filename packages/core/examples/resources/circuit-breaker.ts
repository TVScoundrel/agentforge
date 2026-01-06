/**
 * Example: Circuit Breaker
 *
 * Demonstrates fault tolerance with:
 * - Three-state circuit breaker (closed/open/half-open)
 * - Failure detection
 * - Automatic recovery
 * - Fallback strategies
 * - State monitoring
 */

import { createCircuitBreaker } from '../../src/resources/index.js';

// Simulated unstable API
let failureCount = 0;
const unstableAPI = {
  async call(input: string): Promise<string> {
    failureCount++;
    // Fail the first 5 calls, then succeed
    if (failureCount <= 5) {
      throw new Error('Service unavailable');
    }
    return `Success: ${input}`;
  },

  reset() {
    failureCount = 0;
  },
};

async function main() {
  console.log('=== Circuit Breaker Example ===\n');

  // Example 1: Basic circuit breaker
  console.log('1. Basic Circuit Breaker:');
  const breaker = createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 2000,
    onStateChange: (state, previousState) => {
      console.log(`  🔄 Circuit breaker: ${previousState} → ${state}`);
    },
    onFailure: (error) => {
      console.log(`  ❌ Call failed: ${error.message}`);
    },
    onSuccess: () => {
      console.log(`  ✓ Call succeeded`);
    },
  });

  console.log('  Making calls to unstable API...');
  unstableAPI.reset();

  for (let i = 0; i < 8; i++) {
    try {
      const result = await breaker.execute(() => unstableAPI.call(`request-${i + 1}`));
      console.log(`  Result ${i + 1}: ${result}`);
    } catch (error) {
      console.log(`  Request ${i + 1} failed: ${(error as Error).message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const stats1 = breaker.getStats();
  console.log('\n  Circuit Breaker Stats:');
  console.log(`    State: ${stats1.state}`);
  console.log(`    Total calls: ${stats1.totalCalls}`);
  console.log(`    Successes: ${stats1.successes}`);
  console.log(`    Failures: ${stats1.failures}`);
  console.log(`    Failure rate: ${(stats1.failureRate * 100).toFixed(2)}%`);
  console.log();

  // Example 2: Automatic recovery
  console.log('2. Automatic Recovery:');
  const recoveryBreaker = createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 1000,
    halfOpenRequests: 1,
    onStateChange: (state) => {
      console.log(`  Circuit state: ${state}`);
    },
  });

  unstableAPI.reset();

  console.log('  Triggering failures...');
  for (let i = 0; i < 4; i++) {
    try {
      await recoveryBreaker.execute(() => unstableAPI.call(`request-${i + 1}`));
    } catch (error) {
      // Ignore failures
    }
  }

  console.log('  Circuit is now open, waiting for reset timeout...');
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('  Circuit should be half-open, testing recovery...');
  unstableAPI.reset();
  failureCount = 10; // Make next calls succeed

  try {
    const result = await recoveryBreaker.execute(() => unstableAPI.call('recovery-test'));
    console.log(`  Recovery successful: ${result}`);
  } catch (error) {
    console.log(`  Recovery failed: ${(error as Error).message}`);
  }

  console.log(`  Circuit state: ${recoveryBreaker.getState()}`);
  console.log();

  // Example 3: Fallback strategy
  console.log('3. Fallback Strategy:');
  const fallbackBreaker = createCircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 5000,
    onStateChange: (state) => {
      console.log(`  Circuit: ${state}`);
    },
  });

  const callWithFallback = async (input: string): Promise<string> => {
    try {
      return await fallbackBreaker.execute(() => unstableAPI.call(input));
    } catch (error) {
      if ((error as Error).message === 'Circuit breaker is open') {
        console.log('  Using fallback response');
        return 'Fallback: Service temporarily unavailable';
      }
      throw error;
    }
  };

  unstableAPI.reset();

  console.log('  Making calls with fallback...');
  for (let i = 0; i < 5; i++) {
    const result = await callWithFallback(`request-${i + 1}`);
    console.log(`  Result ${i + 1}: ${result}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log();

  // Example 4: Selective error handling
  console.log('4. Selective Error Handling:');
  const selectiveBreaker = createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 2000,
    shouldTrip: (error) => {
      // Only trip on 5xx errors, not 4xx
      return error.message.includes('5');
    },
    onStateChange: (state) => {
      console.log(`  Circuit: ${state}`);
    },
  });

  const apiWithErrors = {
    async call(code: number): Promise<string> {
      if (code >= 400) {
        throw new Error(`HTTP ${code}`);
      }
      return `Success: ${code}`;
    },
  };

  console.log('  Testing with different error codes...');
  const testCodes = [404, 404, 500, 500, 500, 200];

  for (const code of testCodes) {
    try {
      const result = await selectiveBreaker.execute(() => apiWithErrors.call(code));
      console.log(`  ${code}: ${result}`);
    } catch (error) {
      console.log(`  ${code}: ${(error as Error).message}`);
    }
  }

  console.log(`  Final state: ${selectiveBreaker.getState()}`);
  console.log();

  // Example 5: Wrapping functions
  console.log('5. Wrapping Functions:');
  const wrapperBreaker = createCircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 1000,
  });

  // Wrap a function
  const protectedCall = wrapperBreaker.wrap(async (input: string) => {
    if (Math.random() < 0.5) {
      throw new Error('Random failure');
    }
    return `Success: ${input}`;
  });

  console.log('  Making calls through wrapped function...');
  let successCount = 0;
  let failureCount2 = 0;

  for (let i = 0; i < 10; i++) {
    try {
      const result = await protectedCall(`request-${i + 1}`);
      console.log(`  ✓ ${result}`);
      successCount++;
    } catch (error) {
      console.log(`  ❌ ${(error as Error).message}`);
      failureCount2++;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const stats5 = wrapperBreaker.getStats();
  console.log('\n  Final Statistics:');
  console.log(`    State: ${stats5.state}`);
  console.log(`    Total calls: ${stats5.totalCalls}`);
  console.log(`    Successes: ${successCount}`);
  console.log(`    Failures: ${failureCount2}`);
  console.log(`    State changes: ${stats5.stateChanges}`);

  console.log('\n✨ All examples completed!');
}

main().catch(console.error);

