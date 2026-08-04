import type { JsonObject } from './payload.js';
import {
  configureLangSmith,
  type LangSmithConfig,
  type TracingOptions,
  withTracing,
} from './langsmith.js';

const metadata = {
  request: {
    id: 'req-1',
    tags: ['test'],
  },
} satisfies JsonObject;

const config: LangSmithConfig = {
  projectName: 'agentforge',
  metadata,
};
configureLangSmith(config);

const tracingOptions: TracingOptions = {
  name: 'node',
  metadata,
};
void tracingOptions;

const tracedNode = withTracing((state: { count: number }) => state, tracingOptions);
void tracedNode;

const invalidConfig: LangSmithConfig = {
  // @ts-expect-error LangSmith metadata must contain JSON-safe values
  metadata: { callback: () => 'not-json' },
};
void invalidConfig;

const invalidTracingOptions: TracingOptions = {
  name: 'invalid-node',
  // @ts-expect-error tracing metadata must contain JSON-safe values
  metadata: { createdAt: new Date() },
};
void invalidTracingOptions;
