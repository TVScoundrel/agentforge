import type { JsonObject } from './payload.js';
import { AgentError, createErrorReporter } from './errors.js';

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
const serializedName: string = serialized.name;
const serializedMessage: string = serialized.message;
const serializedTimestamp: number = serialized.timestamp;
void serializedName;
void serializedMessage;
void serializedTimestamp;

// @ts-expect-error state should be unknown-first and require narrowing
void error.state.count;

// @ts-expect-error serialized result should not expose arbitrary indexed properties
void serialized.randomField;

const invalidMetadataError = new AgentError('Invalid metadata', {
  // @ts-expect-error metadata should be JSON-safe
  metadata: { callback: () => 'nope' },
});
void invalidMetadataError;
