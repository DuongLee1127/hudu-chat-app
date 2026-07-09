import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  time: string;
}

interface ChatState {
  selectedConversationId: string | null;
  searchQuery: string;
  messagesByConversation: Record<string, ChatMessage[]>;
  setSelectedConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
}

const formatTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedConversationId: null,
      searchQuery: '',
      messagesByConversation: {},

      setSelectedConversationId: (id) => set({ selectedConversationId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      sendMessage: (conversationId, text) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed) return state;

          const thread = state.messagesByConversation[conversationId] ?? [];
          const newMessage: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: trimmed,
            mine: true,
            time: formatTime(),
          };

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: [...thread, newMessage],
            },
          };
        }),
    }),
    {
      name: 'hudu-chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        messagesByConversation: state.messagesByConversation,
        selectedConversationId: state.selectedConversationId,
      }),
    },
  ),
);
