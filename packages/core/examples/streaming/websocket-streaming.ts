/**
 * WebSocket Streaming Example
 * 
 * Demonstrates bidirectional streaming with WebSocket:
 * - Real-time agent communication
 * - Message broadcasting
 * - Connection management
 * - Heartbeat and reconnection
 */

import { createWebSocketHandler } from '../../src/streaming';

// Mock WebSocket for demonstration
class MockWebSocket {
  private messageHandlers: ((data: string) => void)[] = [];
  private closeHandlers: (() => void)[] = [];
  public readyState = 1; // OPEN

  send(data: string) {
    console.log('→ Sent:', data);
  }

  addEventListener(event: string, handler: any) {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    } else if (event === 'close') {
      this.closeHandlers.push(handler);
    }
  }

  removeEventListener(event: string, handler: any) {
    if (event === 'message') {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    } else if (event === 'close') {
      this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    this.closeHandlers.forEach(h => h());
  }

  // Simulate receiving a message
  simulateMessage(data: string) {
    this.messageHandlers.forEach(h => h({ data }));
  }
}

// Example 1: Basic WebSocket handler
async function basicWebSocketExample() {
  console.log('\n=== Basic WebSocket Example ===');
  console.log('Creating WebSocket handler with message processing...\n');

  const ws = new MockWebSocket() as any;
  
  const handler = createWebSocketHandler(ws, {
    onMessage: async (message) => {
      console.log('← Received:', message);
      return { echo: message, timestamp: Date.now() };
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    onClose: () => {
      console.log('Connection closed');
    }
  });

  // Send a message
  await handler.send({ type: 'greeting', content: 'Hello!' });

  // Simulate receiving messages
  ws.simulateMessage(JSON.stringify({ type: 'request', content: 'How are you?' }));
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  handler.close();
}

// Example 2: Broadcasting to multiple connections
async function broadcastingExample() {
  console.log('\n=== Broadcasting Example ===');
  console.log('Broadcasting messages to multiple WebSocket connections...\n');

  const connections: any[] = [];
  
  // Create 3 mock connections
  for (let i = 1; i <= 3; i++) {
    const ws = new MockWebSocket() as any;
    const handler = createWebSocketHandler(ws, {
      onMessage: async (message) => {
        console.log(`Client ${i} received:`, message);
        return { clientId: i, received: true };
      }
    });
    connections.push(handler);
  }

  // Broadcast a message to all connections
  const broadcastMessage = { type: 'announcement', content: 'Server update!' };
  console.log('\nBroadcasting:', broadcastMessage);
  
  await Promise.all(
    connections.map(handler => handler.send(broadcastMessage))
  );

  // Clean up
  connections.forEach(handler => handler.close());
}

// Example 3: Heartbeat/keepalive
async function heartbeatExample() {
  console.log('\n=== Heartbeat Example ===');
  console.log('Sending periodic heartbeat messages...\n');

  const ws = new MockWebSocket() as any;
  
  const handler = createWebSocketHandler(ws, {
    heartbeatInterval: 1000, // 1 second
    onMessage: async (message) => {
      if (message.type === 'pong') {
        console.log('← Pong received');
      }
      return { received: true };
    }
  });

  // Simulate heartbeat for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3500));
  
  handler.close();
}

// Example 4: Agent streaming responses
async function agentStreamingExample() {
  console.log('\n=== Agent Streaming Example ===');
  console.log('Streaming agent responses over WebSocket...\n');

  const ws = new MockWebSocket() as any;
  
  const handler = createWebSocketHandler(ws, {
    onMessage: async (message) => {
      if (message.type === 'query') {
        console.log('← Query:', message.content);
        
        // Simulate streaming response
        const tokens = ['Thinking', '...', ' The', ' answer', ' is', ' 42', '.'];
        for (const token of tokens) {
          await handler.send({
            type: 'token',
            content: token
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await handler.send({
          type: 'done',
          content: 'Response complete'
        });
      }
      return { processed: true };
    }
  });

  // Simulate client query
  ws.simulateMessage(JSON.stringify({
    type: 'query',
    content: 'What is the meaning of life?'
  }));

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  handler.close();
}

// Example 5: Error handling and reconnection
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  console.log('Demonstrating error handling and connection management...\n');

  const ws = new MockWebSocket() as any;
  
  let reconnectAttempts = 0;
  
  const handler = createWebSocketHandler(ws, {
    onMessage: async (message) => {
      if (message.type === 'error-trigger') {
        throw new Error('Simulated processing error');
      }
      return { success: true };
    },
    onError: (error) => {
      console.error('Error occurred:', error.message);
      reconnectAttempts++;
      console.log(`Reconnect attempt ${reconnectAttempts}`);
    },
    onClose: () => {
      console.log('Connection closed, cleanup complete');
    }
  });

  // Send normal message
  await handler.send({ type: 'normal', content: 'Hello' });

  // Trigger error
  ws.simulateMessage(JSON.stringify({ type: 'error-trigger' }));

  await new Promise(resolve => setTimeout(resolve, 100));
  
  handler.close();
}

// Run all examples
async function main() {
  console.log('🔌 AgentForge WebSocket Streaming Examples\n');
  
  await basicWebSocketExample();
  await broadcastingExample();
  await heartbeatExample();
  await agentStreamingExample();
  await errorHandlingExample();
  
  console.log('\n✅ All WebSocket examples completed!\n');
}

main().catch(console.error);

