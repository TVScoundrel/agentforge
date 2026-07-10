export interface MockExecutionRuntimeOptions<TInput> {
  latency?: number | { min: number; max: number } | (() => number);
  shouldError?: boolean | ((input: TInput) => boolean);
  errorFactory?: (input: TInput) => Error;
}

function resolveLatency<TInput>(latency: MockExecutionRuntimeOptions<TInput>['latency']): number {
  if (typeof latency === 'function') {
    return latency();
  }

  if (typeof latency === 'number') {
    return latency;
  }

  if (latency) {
    return Math.random() * (latency.max - latency.min) + latency.min;
  }

  return 0;
}

function shouldThrowMockError<TInput>(
  shouldError: MockExecutionRuntimeOptions<TInput>['shouldError'],
  input: TInput
): boolean {
  if (typeof shouldError === 'function') {
    return shouldError(input);
  }

  return shouldError ?? false;
}

export async function runMockExecution<TInput, TOutput>(
  input: TInput,
  execute: () => Promise<TOutput> | TOutput,
  options: MockExecutionRuntimeOptions<TInput> = {}
): Promise<TOutput> {
  const delay = resolveLatency(options.latency);
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (shouldThrowMockError(options.shouldError, input)) {
    throw options.errorFactory?.(input) ?? new Error('Mock tool error');
  }

  return Promise.resolve(execute());
}
