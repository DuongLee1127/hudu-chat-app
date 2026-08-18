import { create } from 'zustand';

type PresenceStatus = 'online' | 'offline';

interface ChatState {
  selectedConversationId: string | null;
  searchQuery: string;
  onlineStatusOverrides: Record<string, PresenceStatus>;
  typingByConversation: Record<string, Record<string, true>>;
  setSelectedConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserTyping: (conversationId: string, userId: string) => void;
  setUserStoppedTyping: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  selectedConversationId: null,
  searchQuery: '',
  onlineStatusOverrides: {},
  typingByConversation: {},

  setSelectedConversationId: (id) => set({ selectedConversationId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setUserOnline: (userId) =>
    set((state) => ({
      onlineStatusOverrides: { ...state.onlineStatusOverrides, [userId]: 'online' },
    })),

  setUserOffline: (userId) =>
    set((state) => ({
      onlineStatusOverrides: { ...state.onlineStatusOverrides, [userId]: 'offline' },
    })),

  setUserTyping: (conversationId, userId) =>
    set((state) => ({
      typingByConversation: {
        ...state.typingByConversation,
        [conversationId]: { ...state.typingByConversation[conversationId], [userId]: true },
      },
    })),

  setUserStoppedTyping: (conversationId, userId) =>
    set((state) => {
      const next = { ...(state.typingByConversation[conversationId] || {}) };
      delete next[userId];
      return {
        typingByConversation: { ...state.typingByConversation, [conversationId]: next },
      };
    }),
}));

export const resolvePresence = (
  overrides: Record<string, PresenceStatus>,
  userId: string | undefined,
  fallback: 'online' | 'offline' | 'away' | undefined,
): 'online' | 'offline' | 'away' | undefined =>
  userId ? (overrides[userId] ?? fallback) : fallback;
