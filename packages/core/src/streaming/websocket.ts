/**
 * WebSocket support for bidirectional streaming
 * @module streaming/websocket
 */

import type { WebSocketHandlerOptions, WebSocketMessage } from './types.js';

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
export function createWebSocketHandler(options: WebSocketHandlerOptions) {
  const { onConnect, onMessage, onError, onClose, heartbeat = 0 } = options;

  return function handler(ws: any, req?: any) {
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
      ws.on('pong', () => {
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
    ws.on('message', async (data: any) => {
      try {
        // Parse message
        let message: any;
        if (typeof data === 'string') {
          try {
            message = JSON.parse(data);
          } catch {
            message = data;
          }
        } else {
          message = data;
        }

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
    ws.on('error', (error: Error) => {
      if (onError) {
        onError(ws, error);
      }
    });

    // Handle close
    ws.on('close', (code?: number, reason?: string) => {
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
export function sendMessage(ws: any, message: WebSocketMessage): void {
  if (ws.readyState === 1) {
    // WebSocket.OPEN
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a message to multiple WebSocket clients
 */
export function broadcast(clients: Set<any>, message: WebSocketMessage): void {
  const data = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(data);
    }
  }
}

/**
 * Create a WebSocket message
 */
export function createMessage(type: string, data?: any, error?: string): WebSocketMessage {
  return { type, data, error };
}

