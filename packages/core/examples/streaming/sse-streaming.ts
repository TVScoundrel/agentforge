/**
 * Server-Sent Events (SSE) Streaming Example
 * 
 * Demonstrates SSE for real-time agent responses:
 * - Streaming LLM responses to clients
 * - Event formatting and parsing
 * - Heartbeat/keepalive
 * - Error handling
 */

import { createSSEFormatter, parseSSEEvent, createHeartbeat } from '../../src/streaming';

// Simulate an LLM streaming response
async function* simulateLLMStream(): AsyncIterable<string> {
  const tokens = [
    'Hello', ' there', '!', ' I', ' am', ' an', ' AI', ' assistant', '.',
    ' How', ' can', ' I', ' help', ' you', ' today', '?'
  ];
  
  for (const token of tokens) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield token;
  }
}

// Example 1: Basic SSE formatting
async function basicSSEExample() {
  console.log('\n=== Basic SSE Example ===');
  console.log('Formatting LLM tokens as SSE events...\n');

  const formatter = createSSEFormatter();
  const stream = simulateLLMStream();

  for await (const token of stream) {
    const event = formatter.formatEvent({
      event: 'token',
      data: { token }
    });
    
    // In a real server, you'd write this to the response
    process.stdout.write(event);
  }

  // Send completion event
  const doneEvent = formatter.formatEvent({
    event: 'done',
    data: { message: 'Stream complete' }
  });
  process.stdout.write(doneEvent);
  console.log('\n');
}

// Example 2: SSE with different event types
async function multiEventSSEExample() {
  console.log('\n=== Multi-Event SSE Example ===');
  console.log('Streaming different event types...\n');

  const formatter = createSSEFormatter();

  // Thought event
  const thoughtEvent = formatter.formatEvent({
    event: 'thought',
    data: { content: 'I need to search for information about TypeScript' }
  });
  console.log('Thought:', thoughtEvent);

  // Action event
  const actionEvent = formatter.formatEvent({
    event: 'action',
    data: { tool: 'search', input: 'TypeScript features' }
  });
  console.log('Action:', actionEvent);

  // Observation event
  const observationEvent = formatter.formatEvent({
    event: 'observation',
    data: { result: 'TypeScript is a typed superset of JavaScript' }
  });
  console.log('Observation:', observationEvent);

  // Error event
  const errorEvent = formatter.formatEvent({
    event: 'error',
    data: { message: 'Rate limit exceeded', code: 'RATE_LIMIT' }
  });
  console.log('Error:', errorEvent);
}

// Example 3: SSE with heartbeat
async function heartbeatSSEExample() {
  console.log('\n=== Heartbeat SSE Example ===');
  console.log('Sending heartbeat events every 2 seconds...\n');

  const heartbeat = createHeartbeat(2000);
  let count = 0;

  for await (const event of heartbeat) {
    console.log(`[${new Date().toISOString()}] Heartbeat:`, event);
    
    count++;
    if (count >= 3) {
      break; // Stop after 3 heartbeats
    }
  }
}

// Example 4: Parsing SSE events
async function parsingSSEExample() {
  console.log('\n=== Parsing SSE Example ===');
  console.log('Parsing SSE event strings...\n');

  const eventStrings = [
    'event: token\ndata: {"token":"Hello"}\n\n',
    'event: thought\ndata: {"content":"Thinking..."}\n\n',
    'event: done\ndata: {"message":"Complete"}\n\n',
    'data: {"default":"event"}\n\n', // Default event type
  ];

  for (const eventStr of eventStrings) {
    const parsed = parseSSEEvent(eventStr);
    console.log('Parsed:', parsed);
  }
}

// Example 5: Complete SSE server simulation
async function completeSSEExample() {
  console.log('\n=== Complete SSE Server Example ===');
  console.log('Simulating a complete SSE response stream...\n');

  const formatter = createSSEFormatter();

  // Start event
  console.log(formatter.formatEvent({
    event: 'start',
    data: { sessionId: 'session-123' }
  }));

  // Stream tokens
  const stream = simulateLLMStream();
  let fullResponse = '';

  for await (const token of stream) {
    fullResponse += token;
    console.log(formatter.formatEvent({
      event: 'token',
      data: { token, accumulated: fullResponse }
    }));
  }

  // Metadata event
  console.log(formatter.formatEvent({
    event: 'metadata',
    data: { 
      tokensGenerated: fullResponse.split(' ').length,
      duration: 1600 // ms
    }
  }));

  // Done event
  console.log(formatter.formatEvent({
    event: 'done',
    data: { 
      message: 'Stream complete',
      fullResponse 
    }
  }));
}

// Run all examples
async function main() {
  console.log('📡 AgentForge SSE Streaming Examples\n');
  
  await basicSSEExample();
  await multiEventSSEExample();
  await heartbeatSSEExample();
  await parsingSSEExample();
  await completeSSEExample();
  
  console.log('\n✅ All SSE examples completed!\n');
}

main().catch(console.error);

