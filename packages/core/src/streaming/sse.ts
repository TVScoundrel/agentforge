/**
 * Server-Sent Events (SSE) support for streaming
 * @module streaming/sse
 */

import type { SSEEvent, SSEFormatter, SSEFormatterOptions } from './types.js';

/**
 * Format an SSE event as a string
 */
function formatSSEEvent(event: SSEEvent): string {
  const lines: string[] = [];

  if (event.id) {
    lines.push(`id: ${event.id}`);
  }

  if (event.event) {
    lines.push(`event: ${event.event}`);
  }

  if (event.retry !== undefined) {
    lines.push(`retry: ${event.retry}`);
  }

  // Data can be multi-line
  const dataLines = event.data.split('\n');
  for (const line of dataLines) {
    lines.push(`data: ${line}`);
  }

  // SSE events end with double newline
  return lines.join('\n') + '\n\n';
}

/**
 * Create an SSE formatter for streaming data
 *
 * @example
 * ```typescript
 * const formatter = createSSEFormatter({
 *   eventTypes: {
 *     token: (data) => ({ event: 'token', data: data.content }),
 *     error: (data) => ({ event: 'error', data: data.message }),
 *   },
 *   heartbeat: 30000,
 *   retry: 3000,
 * });
 *
 * // In Express/Fastify handler
 * res.setHeader('Content-Type', 'text/event-stream');
 * res.setHeader('Cache-Control', 'no-cache');
 * res.setHeader('Connection', 'keep-alive');
 *
 * for await (const event of formatter.format(stream)) {
 *   res.write(event);
 * }
 * res.end();
 * ```
 */
export function createSSEFormatter<T = any>(
  options: SSEFormatterOptions<T> = {}
): SSEFormatter<T> {
  const { eventTypes = {}, heartbeat = 0, retry } = options;

  return {
    async *format(stream: AsyncIterable<T>): AsyncIterable<string> {
      let heartbeatInterval: NodeJS.Timeout | null = null;
      let lastEventId = 0;

      try {
        // Start heartbeat if configured
        if (heartbeat > 0) {
          heartbeatInterval = setInterval(() => {
            // Heartbeat is sent as a comment
          }, heartbeat);
        }

        // Send retry configuration if specified
        if (retry !== undefined) {
          yield formatSSEEvent({ data: '', retry });
        }

        for await (const item of stream) {
          // Determine event type
          let event: SSEEvent;

          // Try to match event type
          let matched = false;
          for (const [type, mapper] of Object.entries(eventTypes)) {
            try {
              const mapped = mapper(item);
              if (mapped) {
                event = {
                  ...mapped,
                  id: String(++lastEventId),
                };
                matched = true;
                break;
              }
            } catch {
              // Continue to next mapper
            }
          }

          // Default: serialize as JSON
          if (!matched) {
            event = {
              data: JSON.stringify(item),
              id: String(++lastEventId),
            };
          }

          yield formatSSEEvent(event!);

          // Reset heartbeat timer
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
              // Heartbeat
            }, heartbeat);
          }
        }
      } finally {
        // Clean up heartbeat
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      }
    },
  };
}

/**
 * Create a heartbeat comment for SSE
 */
export function createHeartbeat(): string {
  return ': heartbeat\n\n';
}

/**
 * Parse SSE event from string
 *
 * Useful for testing or client-side parsing
 */
export function parseSSEEvent(eventString: string): SSEEvent | null {
  const lines = eventString.trim().split('\n');
  const event: Partial<SSEEvent> = { data: '' };

  for (const line of lines) {
    if (line.startsWith('id:')) {
      event.id = line.slice(3).trim();
    } else if (line.startsWith('event:')) {
      event.event = line.slice(6).trim();
    } else if (line.startsWith('retry:')) {
      event.retry = parseInt(line.slice(6).trim(), 10);
    } else if (line.startsWith('data:')) {
      const data = line.slice(5).trim();
      event.data = event.data ? `${event.data}\n${data}` : data;
    }
  }

  return event.data !== undefined ? (event as SSEEvent) : null;
}

