import { describe, it, expect, vi } from 'vitest';
import { createWebSocketHandler, sendMessage, broadcast, createMessage } from '../websocket.js';

// Mock WebSocket
class MockWebSocket {
  readyState = 1; // OPEN
  handlers: Record<string, Function[]> = {};

  on(event: string, handler: Function) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  send(data: string) {
    // Mock send
  }

  ping() {
    // Mock ping
  }

  terminate() {
    // Mock terminate
  }

  emit(event: string, ...args: any[]) {
    if (this.handlers[event]) {
      for (const handler of this.handlers[event]) {
        handler(...args);
      }
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

      await ws.emit('message', '{"type":"test","data":"hello"}');

      expect(onMessage).toHaveBeenCalledWith(ws, { type: 'test', data: 'hello' });
    });

    it('should handle non-JSON messages', async () => {
      const onMessage = vi.fn();
      const handler = createWebSocketHandler({ onMessage });

      const ws = new MockWebSocket();
      handler(ws);

      await ws.emit('message', 'plain text');

      expect(onMessage).toHaveBeenCalledWith(ws, 'plain text');
    });

    it('should call onError when error occurs', () => {
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onError });

      const ws = new MockWebSocket();
      handler(ws);

      const error = new Error('Test error');
      ws.emit('error', error);

      expect(onError).toHaveBeenCalledWith(ws, error);
    });

    it('should call onClose when connection closes', () => {
      const onClose = vi.fn();
      const handler = createWebSocketHandler({ onClose });

      const ws = new MockWebSocket();
      handler(ws);

      ws.emit('close', 1000, 'Normal closure');

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

    it('should handle errors in onMessage', async () => {
      const onMessage = vi.fn(async () => {
        throw new Error('Message error');
      });
      const onError = vi.fn();
      const handler = createWebSocketHandler({ onMessage, onError });

      const ws = new MockWebSocket();
      handler(ws);

      // Emit message and wait for async handler to complete
      await ws.emit('message', '{"type":"test"}');
      // Give time for the async error handler to be called
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(ws, expect.any(Error));
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

