# Streaming Examples

This directory contains practical examples demonstrating the streaming and real-time features in AgentForge.

## Examples

### 1. Basic Streaming (`basic-streaming.ts`)
Demonstrates basic stream transformers and aggregators:
- Chunking streams into fixed sizes
- Batching items by size or time
- Throttling stream processing
- Collecting and reducing streams

**Run**: `tsx examples/streaming/basic-streaming.ts`

### 2. SSE Streaming (`sse-streaming.ts`)
Server-Sent Events example for real-time agent responses:
- Streaming LLM responses to clients
- Event formatting and parsing
- Heartbeat/keepalive
- Error handling

**Run**: `tsx examples/streaming/sse-streaming.ts`

### 3. WebSocket Streaming (`websocket-streaming.ts`)
Bidirectional streaming with WebSocket:
- Real-time agent communication
- Message broadcasting
- Connection management
- Heartbeat and reconnection

**Run**: `tsx examples/streaming/websocket-streaming.ts`

### 4. Progress Tracking (`progress-tracking.ts`)
Track long-running agent operations:
- Progress percentage calculation
- ETA estimation
- Cancellation support
- Progress callbacks

**Run**: `tsx examples/streaming/progress-tracking.ts`

### 5. Advanced Streaming (`advanced-streaming.ts`)
Complex streaming patterns:
- Combining multiple transformers
- Stream merging and filtering
- Error recovery
- Backpressure handling

**Run**: `tsx examples/streaming/advanced-streaming.ts`

## Prerequisites

```bash
pnpm install
pnpm build
```

## Running Examples

All examples can be run with `tsx`:

```bash
# Install tsx globally if needed
pnpm add -g tsx

# Run any example
tsx examples/streaming/basic-streaming.ts
```

## Common Use Cases

- **Real-time Chat**: Use SSE or WebSocket for streaming agent responses
- **Long Operations**: Use progress tracking for multi-step agent workflows
- **Data Processing**: Use transformers and aggregators for stream processing
- **API Responses**: Use chunking and batching for efficient data transfer

