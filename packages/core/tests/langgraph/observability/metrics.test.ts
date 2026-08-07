import { describe } from 'vitest';
import { runCollectorTests } from './metrics/collector.behavior.js';
import { runNodeInstrumentationTests } from './metrics/node-instrumentation.behavior.js';

describe('Metrics Collection', () => {
  runCollectorTests();
  runNodeInstrumentationTests();
});
