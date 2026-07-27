import { describe, expect, it } from 'vitest';
import { createConversationStore, normalizeOwnerId } from './conversation-store.js';

describe('conversation ownership boundaries', () => {
  it('requires a non-empty owner identifier', () => {
    expect(normalizeOwnerId(undefined)).toBeUndefined();
    expect(normalizeOwnerId('   ')).toBeUndefined();
    expect(normalizeOwnerId(' user-1 ')).toBe('user-1');
  });

  it('isolates conversations between owners', () => {
    const store = createConversationStore();
    const conversation = { conversationId: 'conv-1', messages: [] };

    store.set('user-1', conversation);

    expect(store.get('user-1', 'conv-1')).toEqual(conversation);
    expect(store.get('user-2', 'conv-1')).toBeUndefined();
    expect(store.list('user-2')).toEqual([]);
    expect(store.delete('user-2', 'conv-1')).toBe(false);
    expect(store.get('user-1', 'conv-1')).toEqual(conversation);
  });

  it('lists and deletes only the requesting owner’s conversations', () => {
    const store = createConversationStore();
    store.set('user-1', { conversationId: 'conv-1', messages: [] });
    store.set('user-1', { conversationId: 'conv-2', messages: [] });
    store.set('user-2', { conversationId: 'conv-3', messages: [] });

    expect(store.list('user-1').map(({ conversationId }) => conversationId)).toEqual(['conv-1', 'conv-2']);
    expect(store.delete('user-1', 'conv-1')).toBe(true);
    expect(store.list('user-1').map(({ conversationId }) => conversationId)).toEqual(['conv-2']);
    expect(store.get('user-2', 'conv-3')).toEqual({ conversationId: 'conv-3', messages: [] });
  });
});
