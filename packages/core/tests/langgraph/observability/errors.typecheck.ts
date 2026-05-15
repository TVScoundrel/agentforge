import type { JsonObject } from '../../../src/langgraph/observability/payload.js';
import {
  AgentError,
  createErrorReporter,
} from '../../../src/langgraph/observability/errors.js';

const error = new AgentError('Typed error', {
  state: { count: 1 },
  metadata: { requestId: 'req-1', attempts: 2 },
});

const metadata: JsonObject | undefined = error.metadata;
void metadata;

const reporter = createErrorReporter({
  onError: (_reportedError) => {},
});

void reporter;

const serialized = error.toJSON();
void serialized;

// @ts-expect-error state should be unknown-first and require narrowing
error.state.count;

new AgentError('Invalid metadata', {
  // @ts-expect-error metadata should be JSON-safe
  metadata: { callback: () => 'nope' },
});
