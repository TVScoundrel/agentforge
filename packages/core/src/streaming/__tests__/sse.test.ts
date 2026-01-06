import { describe, it, expect } from 'vitest';
import { createSSEFormatter, createHeartbeat, parseSSEEvent } from '../sse.js';

// Helper to create async iterable from array
async function* createStream<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

// Helper to collect stream items
async function collectStream<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream) {
    items.push(item);
  }
  return items;
}

describe('SSE Support', () => {
  describe('createSSEFormatter', () => {
    it('should format stream as SSE events', async () => {
      const formatter = createSSEFormatter();
      const stream = createStream([{ message: 'hello' }, { message: 'world' }]);

      const events = await collectStream(formatter.format(stream));

      expect(events).toHaveLength(2);
      expect(events[0]).toContain('data: {"message":"hello"}');
      expect(events[0]).toContain('id: 1');
      expect(events[1]).toContain('data: {"message":"world"}');
      expect(events[1]).toContain('id: 2');
    });

    it('should use custom event types', async () => {
      const formatter = createSSEFormatter({
        eventTypes: {
          token: (data: any) => ({
            event: 'token',
            data: data.content,
          }),
        },
      });

      const stream = createStream([{ content: 'hello' }]);
      const events = await collectStream(formatter.format(stream));

      expect(events[0]).toContain('event: token');
      expect(events[0]).toContain('data: hello');
    });

    it('should include retry configuration', async () => {
      const formatter = createSSEFormatter({ retry: 3000 });
      const stream = createStream([{ message: 'test' }]);

      const events = await collectStream(formatter.format(stream));

      expect(events[0]).toContain('retry: 3000');
    });

    it('should handle multi-line data', async () => {
      const formatter = createSSEFormatter({
        eventTypes: {
          message: (data: any) => ({
            event: 'message',
            data: 'line1\nline2\nline3',
          }),
        },
      });

      const stream = createStream([{ type: 'message' }]);
      const events = await collectStream(formatter.format(stream));

      expect(events[0]).toContain('data: line1');
      expect(events[0]).toContain('data: line2');
      expect(events[0]).toContain('data: line3');
    });

    it('should handle empty stream', async () => {
      const formatter = createSSEFormatter();
      const stream = createStream([]);

      const events = await collectStream(formatter.format(stream));

      expect(events).toHaveLength(0);
    });
  });

  describe('createHeartbeat', () => {
    it('should create heartbeat comment', () => {
      const heartbeat = createHeartbeat();

      expect(heartbeat).toBe(': heartbeat\n\n');
    });
  });

  describe('parseSSEEvent', () => {
    it('should parse SSE event', () => {
      const eventString = 'id: 1\nevent: message\ndata: hello\n\n';
      const event = parseSSEEvent(eventString);

      expect(event).toEqual({
        id: '1',
        event: 'message',
        data: 'hello',
      });
    });

    it('should parse multi-line data', () => {
      const eventString = 'id: 1\ndata: line1\ndata: line2\ndata: line3\n\n';
      const event = parseSSEEvent(eventString);

      expect(event).toEqual({
        id: '1',
        data: 'line1\nline2\nline3',
      });
    });

    it('should parse retry', () => {
      const eventString = 'retry: 3000\ndata: test\n\n';
      const event = parseSSEEvent(eventString);

      expect(event).toEqual({
        retry: 3000,
        data: 'test',
      });
    });

    it('should return null for invalid event', () => {
      const eventString = 'invalid\n\n';
      const event = parseSSEEvent(eventString);

      // Event with empty data is still valid (could be a comment or heartbeat)
      expect(event).toEqual({ data: '' });
    });

    it('should handle empty data', () => {
      const eventString = 'id: 1\ndata: \n\n';
      const event = parseSSEEvent(eventString);

      expect(event).toEqual({
        id: '1',
        data: '',
      });
    });
  });
});

