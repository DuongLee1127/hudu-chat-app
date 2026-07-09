import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChatState {
  selectedConversationId: string | null;
  searchQuery: string;
  setSelectedConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedConversationId: null,
      searchQuery: '',

      setSelectedConversationId: (id) => set({ selectedConversationId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),
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
