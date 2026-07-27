export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  conversationId: string;
  messages: ChatMessage[];
}

interface StoredConversation extends Conversation {
  ownerId: string;
}

export interface ConversationStore {
  get(ownerId: string, conversationId: string): Conversation | undefined;
  set(ownerId: string, conversation: Conversation): void;
  delete(ownerId: string, conversationId: string): boolean;
  list(ownerId: string): Conversation[];
}

function conversationKey(ownerId: string, conversationId: string): string {
  return `${ownerId}\u0000${conversationId}`;
}

export function createConversationStore(): ConversationStore {
  const conversations = new Map<string, StoredConversation>();

  return {
    get(ownerId, conversationId) {
      const conversation = conversations.get(conversationKey(ownerId, conversationId));
      return conversation
        ? { conversationId: conversation.conversationId, messages: [...conversation.messages] }
        : undefined;
    },
    set(ownerId, conversation) {
      conversations.set(conversationKey(ownerId, conversation.conversationId), {
        ownerId,
        conversationId: conversation.conversationId,
        messages: [...conversation.messages],
      });
    },
    delete(ownerId, conversationId) {
      return conversations.delete(conversationKey(ownerId, conversationId));
    },
    list(ownerId) {
      return Array.from(conversations.values())
        .filter((conversation) => conversation.ownerId === ownerId)
        .map(({ conversationId, messages }) => ({ conversationId, messages: [...messages] }));
    },
  };
}

export function normalizeOwnerId(value: string | undefined): string | undefined {
  const ownerId = value?.trim();
  return ownerId || undefined;
}
