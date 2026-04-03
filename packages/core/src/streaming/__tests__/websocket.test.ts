import { describe, it, expect, vi } from 'vitest';
import { createWebSocketHandler, sendMessage, broadcast, createMessage } from '../websocket.js';
import type { WebSocketConnection } from '../types.js';

type MockHandlers = {
  pong: Array<() => void>;
  message: Array<(data: unknown) => void | Promise<void>>;
  error: Array<(error: Error) => void>;
  close: Array<(code?: number, reason?: string) => void>;
};

class MockWebSocket implements WebSocketConnection<unknown, string> {
  readyState = 1; // OPEN
  handlers: MockHandlers = {
    pong: [],
    message: [],
    error: [],
    close: [],
  };

  on(event: 'pong', handler: () => void): void;
  on(event: 'message', handler: (data: unknown) => void | Promise<void>): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'close', handler: (code?: number, reason?: string) => void): void;
  on(event: keyof MockHandlers, handler: MockHandlers[keyof MockHandlers][number]): void {
    this.handlers[event].push(handler as never);
  }

  send(_data: string) {
    // Mock send
  }

  close = () => {
    // Mock close
  };

  ping = () => {
    // Mock ping
  };

  terminate = () => {
    // Mock terminate
  };

  emitPong() {
    for (const handler of this.handlers.pong) {
      handler();
    }
  }

  async emitMessage(data: unknown) {
    for (const handler of this.handlers.message) {
      await handler(data);
    }
  }

  emitError(error: Error) {
    for (const handler of this.handlers.error) {
      handler(error);
    }
  }

  emitClose(code?: number, reason?: string) {
    for (const handler of this.handlers.close) {
      handler(code, reason);
    }
  }
}

describe('WebSocket Support', () => {
  describe('createWebSocketHandler', () => {
    it('should call onConnect when connection established', () => {
      const onConnect = vi.fn();
      const handler = createWebSocketHandler({ onConnect });

      const ws = new MockWebSocket();
      handler(ws);

      expect(onConnect).toHaveBeenCalledWith(ws, undefined);
    });

    it('should call onMessage when message received', async () => {
      const onMessage = vi.fn();
      const handler = createWebSocketHandler({ onMessage });

      const ws = new MockWebSocket();
      handler(ws);

      await ws.emitMessage('{"type":"test","data":"hello"}');

      expect(onMessage).toHaveBeenCalledWith(ws, { type: 'test', data: 'hello' });
    });

    it('should handle non-JSON messages', async () => {
      const onMessage = vi.fn();
      const handler = createWebSocketHandler({ onMessage });

      const ws = new MockWebSocket();
      handler(ws);

      await ws.emitMessage('plain text');

      expect(onMessage).toHaveBeenCalledWith(ws, 'plain text');
    });

    it('should pass through non-string message payloads unchanged', async () => {
      const onMessage = vi.fn();
      const handler = createWebSocketHandler({ onMessage });

      const ws = new MockWebSocket();
      const binaryPayload = new Uint8Array([1, 2, 3]);
      handler(ws);

      await ws.emitMessage(binaryPayload);

      expect(onMessage).toHaveBeenCalledWith(ws, binaryPayload);
    });

    it('should call onError when error occurs', () => {
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onError });

      const ws = new MockWebSocket();
      handler(ws);

      const error = new Error('Test error');
      ws.emitError(error);

      expect(onError).toHaveBeenCalledWith(ws, error);
    });

    it('should call onClose when connection closes', () => {
      const onClose = vi.fn();
      const handler = createWebSocketHandler({ onClose });

      const ws = new MockWebSocket();
      handler(ws);

      ws.emitClose(1000, 'Normal closure');

      expect(onClose).toHaveBeenCalledWith(ws, 1000, 'Normal closure');
    });

    it('should handle errors in onConnect', () => {
      const onConnect = vi.fn(() => {
        throw new Error('Connect error');
      });
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onConnect, onError });

      const ws = new MockWebSocket();
      handler(ws);

      expect(onError).toHaveBeenCalledWith(ws, expect.any(Error));
    });

    it('should normalize non-Error values thrown in onConnect', () => {
      const onConnect = vi.fn(() => {
        throw 'Connect error';
      });
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onConnect, onError });

      const ws = new MockWebSocket();
      handler(ws);

      expect(onError).toHaveBeenCalledWith(ws, expect.objectContaining({ message: 'Connect error' }));
    });

    it('should handle errors in onMessage', async () => {
      const onMessage = vi.fn(async () => {
        throw new Error('Message error');
      });
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onMessage, onError });

      const ws = new MockWebSocket();
      handler(ws);

      // Emit message and wait for async handler to complete
      await ws.emitMessage('{"type":"test"}');
      // Give time for the async error handler to be called
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(ws, expect.any(Error));
    });

    it('should normalize non-Error values thrown in onMessage', async () => {
      const onMessage = vi.fn(async () => {
        throw 'Message error';
      });
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onMessage, onError });

      const ws = new MockWebSocket();
      handler(ws);

      await ws.emitMessage('{"type":"test"}');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(ws, expect.objectContaining({ message: 'Message error' }));
    });

    it('should report heartbeat capability errors through onError and return early', () => {
      const onConnect = vi.fn();
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onConnect, onError, heartbeat: 1000 });

      const ws = new MockWebSocket();
      const closeSpy = vi.spyOn(ws, 'close');
      Object.defineProperty(ws, 'ping', { value: undefined });
      Object.defineProperty(ws, 'terminate', { value: undefined });
      handler(ws);

      expect(onError).toHaveBeenCalledWith(
        ws,
        expect.objectContaining({
          message:
            'WebSocket heartbeat requires ping() and terminate() support on the provided socket',
        })
      );
      expect(onConnect).not.toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
      expect(ws.handlers.message).toHaveLength(0);
      expect(ws.handlers.close).toHaveLength(0);
    });
  });

  describe('sendMessage', () => {
    it('should send JSON message', () => {
      const ws = new MockWebSocket();
      const sendSpy = vi.spyOn(ws, 'send');

      sendMessage(ws, { type: 'test', data: 'hello' });

      expect(sendSpy).toHaveBeenCalledWith('{"type":"test","data":"hello"}');
    });

    it('should not send if connection is not open', () => {
      const ws = new MockWebSocket();
      ws.readyState = 0; // CONNECTING
      const sendSpy = vi.spyOn(ws, 'send');

      sendMessage(ws, { type: 'test' });

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should broadcast to all clients', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const ws3 = new MockWebSocket();

      const sendSpy1 = vi.spyOn(ws1, 'send');
      const sendSpy2 = vi.spyOn(ws2, 'send');
      const sendSpy3 = vi.spyOn(ws3, 'send');

      const clients = new Set([ws1, ws2, ws3]);
      broadcast(clients, { type: 'broadcast', data: 'hello' });

      expect(sendSpy1).toHaveBeenCalled();
      expect(sendSpy2).toHaveBeenCalled();
      expect(sendSpy3).toHaveBeenCalled();
    });

    it('should skip clients that are not open', () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      ws2.readyState = 0; // CONNECTING

      const sendSpy1 = vi.spyOn(ws1, 'send');
      const sendSpy2 = vi.spyOn(ws2, 'send');

      const clients = new Set([ws1, ws2]);
      broadcast(clients, { type: 'broadcast' });

      expect(sendSpy1).toHaveBeenCalled();
      expect(sendSpy2).not.toHaveBeenCalled();
    });
  });

  describe('createMessage', () => {
    it('should create message with type and data', () => {
      const message = createMessage('test', { value: 123 });

      expect(message).toEqual({
        type: 'test',
        data: { value: 123 },
        error: undefined,
      });
    });

    it('should create error message', () => {
      const message = createMessage('error', undefined, 'Something went wrong');

      expect(message).toEqual({
        type: 'error',
        data: undefined,
        error: 'Something went wrong',
      });
    });
  });
});
