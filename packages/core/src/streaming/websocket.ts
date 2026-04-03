/**
 * WebSocket support for bidirectional streaming
 * @module streaming/websocket
 */

import type {
  WebSocketCloseReasonFor,
  WebSocketConnection,
  WebSocketHandlerOptions,
  WebSocketMessage,
  WebSocketMessageFor,
  WebSocketSendTarget,
} from './types.js';

const WEBSOCKET_OPEN = 1;

function parseWebSocketMessage(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/**
 * Create a WebSocket handler for bidirectional streaming
 *
 * @example
 * ```typescript
 * import WebSocket from 'ws';
 *
 * const handler = createWebSocketHandler({
 *   onConnect: (ws) => {
 *     console.log('Client connected');
 *   },
 *   onMessage: async (ws, message) => {
 *     const stream = await agent.stream(message);
 *     for await (const event of stream) {
 *       ws.send(JSON.stringify(event));
 *     }
 *   },
 *   onError: (ws, error) => {
 *     ws.send(JSON.stringify({ type: 'error', error: error.message }));
 *   },
 *   heartbeat: 30000,
 * });
 *
 * wss.on('connection', handler);
 * ```
 */
export function createWebSocketHandler<
  TSocket extends WebSocketConnection = WebSocketConnection,
  TRequest = unknown,
>(options: WebSocketHandlerOptions<TSocket, TRequest>) {
  const { onConnect, onMessage, onError, onClose, heartbeat = 0 } = options;

  return function handler(ws: TSocket, req?: TRequest) {
    const socket = ws as WebSocketConnection<
      WebSocketMessageFor<TSocket>,
      WebSocketCloseReasonFor<TSocket>
    >;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let isAlive = true;

    // Set up heartbeat
    if (heartbeat > 0) {
      // Ping client periodically
      heartbeatInterval = setInterval(() => {
        if (!isAlive) {
          // Client didn't respond to last ping
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          ws.terminate();
          return;
        }

        isAlive = false;
        ws.ping();
      }, heartbeat);

      // Handle pong responses
      socket.on('pong', () => {
        isAlive = true;
      });
    }

    // Connection established
    if (onConnect) {
      try {
        onConnect(ws, req);
      } catch (error) {
        if (onError) {
          onError(ws, error as Error);
        }
      }
    }

    // Handle incoming messages
    socket.on('message', async (data) => {
      try {
        const message = parseWebSocketMessage(data);

        // Handle message
        if (onMessage) {
          await onMessage(ws, message);
        }
      } catch (error) {
        if (onError) {
          onError(ws, error as Error);
        }
      }
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      if (onError) {
        onError(ws, error);
      }
    });

    // Handle close
    socket.on('close', (code, reason) => {
      // Clean up heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      if (onClose) {
        onClose(ws, code, reason);
      }
    });
  };
}

/**
 * Send a message through WebSocket
 *
 * Automatically serializes objects to JSON
 */
export function sendMessage<TData = unknown>(
  ws: WebSocketSendTarget,
  message: WebSocketMessage<TData>
): void {
  if (ws.readyState === WEBSOCKET_OPEN) {
    // WebSocket.OPEN
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a message to multiple WebSocket clients
 */
export function broadcast<TData = unknown, TSocket extends WebSocketSendTarget = WebSocketSendTarget>(
  clients: Set<TSocket>,
  message: WebSocketMessage<TData>
): void {
  const data = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === WEBSOCKET_OPEN) {
      // WebSocket.OPEN
      client.send(data);
    }
  }
}

/**
 * Create a WebSocket message
 */
export function createMessage<TData = unknown>(
  type: string,
  data?: TData,
  error?: string
): WebSocketMessage<TData> {
  return { type, data, error };
}
