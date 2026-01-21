import { describe, it, expect } from 'vitest';
import {
  formatHumanRequestEvent,
  formatHumanResponseEvent,
  formatInterruptEvent,
  formatResumeEvent,
  formatAgentWaitingEvent,
  formatAgentResumedEvent,
} from '../../src/streaming/human-in-loop.js';
import { createHumanRequestInterrupt } from '../../src/langgraph/interrupts/utils.js';
import type { HumanRequest } from '../../src/tools/builtin/ask-human/types.js';

describe('Human-in-Loop SSE Utilities', () => {
  describe('formatHumanRequestEvent', () => {
    it('should format a human request as an SSE event', () => {
      const humanRequest: HumanRequest = {
        id: 'req-123',
        question: 'Should I proceed?',
        priority: 'high',
        createdAt: Date.now(),
        timeout: 0,
        status: 'pending',
      };

      const event = formatHumanRequestEvent(humanRequest, 'thread-456');

      expect(event.event).toBe('human_request');
      expect(event.id).toBe('req-123');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('human_request');
      expect(data.request).toEqual(humanRequest);
      expect(data.threadId).toBe('thread-456');
    });
  });

  describe('formatHumanResponseEvent', () => {
    it('should format a human response as an SSE event', () => {
      const event = formatHumanResponseEvent('req-123', 'Yes, proceed', 'thread-456');

      expect(event.event).toBe('human_response');
      expect(event.id).toBe('response-req-123');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('human_response');
      expect(data.requestId).toBe('req-123');
      expect(data.response).toBe('Yes, proceed');
      expect(data.threadId).toBe('thread-456');
    });
  });

  describe('formatInterruptEvent', () => {
    it('should format an interrupt as an SSE event', () => {
      const humanRequest: HumanRequest = {
        id: 'req-123',
        question: 'Test?',
        priority: 'normal',
        createdAt: Date.now(),
        timeout: 0,
        status: 'pending',
      };

      const interrupt = createHumanRequestInterrupt(humanRequest);
      const event = formatInterruptEvent(interrupt, 'thread-789');

      expect(event.event).toBe('interrupt');
      expect(event.id).toBe('req-123');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('interrupt');
      expect(data.interrupt).toEqual(interrupt);
      expect(data.threadId).toBe('thread-789');
    });
  });

  describe('formatResumeEvent', () => {
    it('should format a resume event as an SSE event', () => {
      const event = formatResumeEvent('interrupt-123', 'resume value', 'thread-456');

      expect(event.event).toBe('resume');
      expect(event.id).toBe('resume-interrupt-123');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('resume');
      expect(data.interruptId).toBe('interrupt-123');
      expect(data.value).toBe('resume value');
      expect(data.threadId).toBe('thread-456');
    });
  });

  describe('formatAgentWaitingEvent', () => {
    it('should format an agent waiting event as an SSE event', () => {
      const event = formatAgentWaitingEvent('Waiting for human input', 'thread-123');

      expect(event.event).toBe('agent_waiting');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('agent_waiting');
      expect(data.reason).toBe('Waiting for human input');
      expect(data.threadId).toBe('thread-123');
    });
  });

  describe('formatAgentResumedEvent', () => {
    it('should format an agent resumed event as an SSE event', () => {
      const event = formatAgentResumedEvent('thread-123');

      expect(event.event).toBe('agent_resumed');
      expect(event.data).toBeDefined();

      const data = JSON.parse(event.data);
      expect(data.type).toBe('agent_resumed');
      expect(data.threadId).toBe('thread-123');
    });
  });

  describe('Event data structure', () => {
    it('should produce valid JSON for all event types', () => {
      const humanRequest: HumanRequest = {
        id: 'req-123',
        question: 'Test?',
        priority: 'normal',
        createdAt: Date.now(),
        timeout: 0,
        status: 'pending',
      };

      const events = [
        formatHumanRequestEvent(humanRequest, 'thread-1'),
        formatHumanResponseEvent('req-1', 'response', 'thread-1'),
        formatInterruptEvent(createHumanRequestInterrupt(humanRequest), 'thread-1'),
        formatResumeEvent('int-1', 'value', 'thread-1'),
        formatAgentWaitingEvent('reason', 'thread-1'),
        formatAgentResumedEvent('thread-1'),
      ];

      for (const event of events) {
        expect(() => JSON.parse(event.data)).not.toThrow();
      }
    });
  });
});

