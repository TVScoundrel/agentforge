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
- On failure, sets state to `ERROR`; if automatic reconnection is enabled and a retry is scheduled, immediately transitions to `RECONNECTING`, otherwise remains in `ERROR`

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

**`dispose(): Promise<void>`**
- Performs full cleanup of the ConnectionManager instance
- Disconnects the connection if connected
- Removes all event listeners to prevent memory leaks
- Should be called when the ConnectionManager instance will no longer be used
- Idempotent - safe to call multiple times

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
delay = min(baseDelayMs * 2^(attempt - 1), maxDelayMs)
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
import { ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:pass@localhost:5432/mydb'
});

// Connect
await manager.connect();

// Disconnect
await manager.disconnect();
```

### With Automatic Reconnection

```typescript
import { createLogger } from '@agentforge/core';

const logger = createLogger('my-app:database');

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
  logger.warn('Reconnection scheduled', { attempt, maxAttempts, delayMs });
});

manager.on('error', (error) => {
  logger.error('Connection error', { error: error.message });
});

manager.on('connected', () => {
  logger.info('Successfully connected');
});

await manager.connect();
```

### Event-Driven State Management

```typescript
import { createLogger } from '@agentforge/core';

const logger = createLogger('my-app:database');
const manager = new ConnectionManager(config);

// Track all state changes
manager.on('connected', () => {
  logger.info('Database connected');
  // Start processing queries
});

manager.on('disconnected', () => {
  logger.info('Database disconnected');
  // Pause processing
});

manager.on('error', (error) => {
  logger.error('Database connection error', { error: error.message });
  // Handle error, maybe alert monitoring
});

manager.on('reconnecting', ({ attempt, delayMs }) => {
  logger.info('Database reconnecting', { attempt, delayMs });
  // Update UI or logs
});

await manager.connect();
```

## Implementation Details

- **State Transitions**: All state changes are logged and emit events
- **Error Handling**: Errors during connection/disconnection are caught and handled gracefully
- **Cleanup**: Reconnection timers are properly cleaned up on disconnect
- **Concurrency Handling**:
  - Concurrent `connect()` calls are serialized - subsequent callers await any in-flight connection attempt (manual or automatic reconnection)
  - `disconnect()` uses a generation token to cancel in-flight `initialize()` operations and waits for any in-flight connection attempt to complete
  - Reconnection attempts are scheduled sequentially with exponential backoff
  - Event listeners are not removed by `disconnect()`; call `dispose()` (or manually remove listeners) for full cleanup and to prevent memory leaks

## Testing

- **Unit Tests**: Covered by connection-manager and connection-lifecycle test suites
- **Coverage**: State tracking, event emissions, reconnection logic, error scenarios
- **Integration**: Reconnection behavior tested with exponential backoff timing

## Related Stories

- **ST-01001**: Setup Drizzle ORM Dependencies ✅
- **ST-01002**: Implement Connection Manager ✅
- **ST-01003**: Implement Connection Pooling ✅

