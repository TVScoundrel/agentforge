# ST-01004: Connection Lifecycle Management

**Status:** In Progress  
**Epic:** Epic 01 - Core Connection Management  
**Priority:** P1 (High)  
**Estimate:** 2 hours  
**PR:** #29

## Overview

Implements comprehensive connection lifecycle management for the relational database tool, including connection state tracking, automatic reconnection with exponential backoff, and event-driven state change notifications.

## Features Implemented

### 1. Connection State Tracking

The `ConnectionManager` now tracks connection state through the `ConnectionState` enum:

```typescript
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
```

**Methods:**
- `getState(): ConnectionState` - Returns the current connection state
- `isConnected(): boolean` - Returns `true` if state is `CONNECTED`

### 2. Public Lifecycle Methods

**`connect(): Promise<void>`**
- Initializes the database connection
- Idempotent - safe to call multiple times
- Sets state to `CONNECTING` → `CONNECTED` on success
- Sets state to `ERROR` and schedules reconnection on failure

**`disconnect(): Promise<void>`**
- Closes the database connection gracefully
- Cancels any pending reconnection attempts
- Resets reconnection attempt counter
- Idempotent - safe to call multiple times

**`isConnected(): boolean`**
- Quick check for connection status
- Returns `true` only when state is `CONNECTED`

**`getState(): ConnectionState`**
- Returns the current connection state
- Useful for detailed state inspection

### 3. Automatic Reconnection

Configurable automatic reconnection with exponential backoff:

```typescript
interface ReconnectionConfig {
  enabled: boolean;        // Enable automatic reconnection (default: false)
  maxAttempts: number;     // Maximum reconnection attempts, 0 = infinite (default: 5)
  baseDelayMs: number;     // Base delay for exponential backoff (default: 1000)
  maxDelayMs: number;      // Maximum delay between attempts (default: 30000)
}
```

**Exponential Backoff Formula:**
```
delay = min(baseDelayMs * 2^attempts, maxDelayMs)
```

**Example delays with defaults:**
- Attempt 1: 1s
- Attempt 2: 2s
- Attempt 3: 4s
- Attempt 4: 8s
- Attempt 5: 16s
- Attempt 6+: 30s (capped at maxDelayMs)

### 4. Event Emissions

The `ConnectionManager` extends `EventEmitter` and emits the following events:

**Event Types:**
```typescript
type ConnectionEvent = 'connected' | 'disconnected' | 'error' | 'reconnecting';
```

**Event Details:**

- **`connected`**: Emitted when connection is successfully established
  - No payload

- **`disconnected`**: Emitted when connection is closed gracefully
  - No payload

- **`error`**: Emitted when a connection error occurs
  - Payload: `Error` object

- **`reconnecting`**: Emitted when a reconnection attempt is scheduled
  - Payload: `{ attempt: number, maxAttempts: number, delayMs: number }`

## Usage Examples

### Basic Connection Lifecycle

```typescript
import { ConnectionManager } from '@agentforge/tools/data/relational';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:pass@localhost:5432/mydb'
});

// Connect
await manager.connect();
console.log(manager.isConnected()); // true

// Disconnect
await manager.disconnect();
console.log(manager.isConnected()); // false
```

### With Automatic Reconnection

```typescript
const manager = new ConnectionManager(
  {
    vendor: 'postgresql',
    connection: 'postgresql://user:pass@localhost:5432/mydb'
  },
  {
    enabled: true,
    maxAttempts: 10,
    baseDelayMs: 500,
    maxDelayMs: 60000
  }
);

// Listen for reconnection events
manager.on('reconnecting', ({ attempt, maxAttempts, delayMs }) => {
  console.log(`Reconnection attempt ${attempt}/${maxAttempts} in ${delayMs}ms`);
});

manager.on('error', (error) => {
  console.error('Connection error:', error.message);
});

manager.on('connected', () => {
  console.log('Successfully connected!');
});

await manager.connect();
```

### Event-Driven State Management

```typescript
const manager = new ConnectionManager(config);

// Track all state changes
manager.on('connected', () => {
  console.log('State: CONNECTED');
  // Start processing queries
});

manager.on('disconnected', () => {
  console.log('State: DISCONNECTED');
  // Pause processing
});

manager.on('error', (error) => {
  console.log('State: ERROR');
  console.error('Error:', error.message);
  // Handle error, maybe alert monitoring
});

manager.on('reconnecting', ({ attempt, delayMs }) => {
  console.log(`Reconnecting in ${delayMs}ms (attempt ${attempt})`);
  // Update UI or logs
});

await manager.connect();
```

## Implementation Details

- **State Transitions**: All state changes are logged and emit events
- **Error Handling**: Errors during connection/disconnection are caught and handled gracefully
- **Cleanup**: Reconnection timers are properly cleaned up on disconnect
- **Concurrency Handling**:
  - Concurrent `connect()` calls are serialized - subsequent callers await the in-flight connection attempt
  - `disconnect()` uses a generation token to cancel in-flight `initialize()` operations
  - Reconnection attempts are scheduled sequentially with exponential backoff

## Testing

- **Unit Tests**: 28 tests (22 from connection-manager, 6 from connection-lifecycle)
- **Coverage**: State tracking, event emissions, reconnection logic, error scenarios
- **Integration**: Reconnection behavior tested with exponential backoff timing

## Related Stories

- **ST-01001**: Setup Drizzle ORM Dependencies ✅
- **ST-01002**: Implement Connection Manager ✅
- **ST-01003**: Implement Connection Pooling ✅

