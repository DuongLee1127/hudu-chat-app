import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatState {
  selectedConversationId: string | null;
  searchQuery: string;
  onlineUserIds: Record<string, true>;
  typingByConversation: Record<string, Record<string, true>>;
  setSelectedConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserTyping: (conversationId: string, userId: string) => void;
  setUserStoppedTyping: (conversationId: string, userId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedConversationId: null,
      searchQuery: '',
      onlineUserIds: {},
      typingByConversation: {},

      setSelectedConversationId: (id) => set({ selectedConversationId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setUserOnline: (userId) =>
        set((state) => ({ onlineUserIds: { ...state.onlineUserIds, [userId]: true } })),

      setUserOffline: (userId) =>
        set((state) => {
          const next = { ...state.onlineUserIds };
          delete next[userId];
          return { onlineUserIds: next };
        }),

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
    }),
    {
      name: 'hudu-chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedConversationId: state.selectedConversationId,
      }),
    },
  ),
);
