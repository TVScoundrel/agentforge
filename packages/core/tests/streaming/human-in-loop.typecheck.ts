import { formatResumeEvent } from '../../src/streaming/human-in-loop.js';
import type { ResumeEventData } from '../../src/streaming/human-in-loop.js';

const primitiveEvent = formatResumeEvent('interrupt-1', 'approved', 'thread-1');
void primitiveEvent;

const objectEvent = formatResumeEvent(
  'interrupt-2',
  {
    approved: true,
    actor: 'reviewer',
    reasons: ['safe'],
    metadata: { confidence: 0.9, source: 'human' },
  },
  'thread-2'
);
void objectEvent;

const data: ResumeEventData = {
  type: 'resume',
  interruptId: 'interrupt-3',
  value: {
    approved: false,
    details: { retry: 1 },
  },
  threadId: 'thread-3',
};
void data;

// @ts-expect-error resume values must remain JSON-safe
formatResumeEvent('interrupt-4', { resolver: () => true }, 'thread-4');

const invalidData: ResumeEventData = {
  type: 'resume',
  interruptId: 'interrupt-5',
  // @ts-expect-error ResumeEventData.value must reject non-serializable payloads
  value: { resolver: () => true },
  threadId: 'thread-5',
};
void invalidData;
