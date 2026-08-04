import type { JsonObject } from '../observability/payload.js';
import { createConversationConfig, createThreadConfig } from './thread.js';

const metadata = {
  profile: {
    roles: ['maintainer'],
    active: true,
  },
  requestId: 'req-1',
} satisfies JsonObject;

const threadConfig = createThreadConfig({
  threadId: 'thread-1',
  metadata,
});
void threadConfig;

const conversationConfig = createConversationConfig({
  userId: 'user-1',
  metadata,
});
void conversationConfig;

const nullPrototypeMetadata = Object.create(null) as JsonObject;
nullPrototypeMetadata.source = 'test';
void createThreadConfig({ metadata: nullPrototypeMetadata });

const invalidThreadMetadata = createThreadConfig({
  // @ts-expect-error thread metadata must contain JSON-safe values
  metadata: { callback: () => 'not-json' },
});
void invalidThreadMetadata;

const invalidConversationMetadata = createConversationConfig({
  userId: 'user-1',
  // @ts-expect-error conversation metadata must contain JSON-safe values
  metadata: { createdAt: new Date() },
});
void invalidConversationMetadata;
