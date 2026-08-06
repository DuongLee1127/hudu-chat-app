import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type PresenceStatus = 'online' | 'offline';

interface ChatState {
  selectedConversationId: string | null;
  searchQuery: string;
  /** Live presence signals received over the socket since connecting, keyed by userId.
   *  Overrides the (possibly stale) `status` field cached from REST queries — see
   *  `resolvePresence` below. Absent entries mean "no live signal yet, use REST value". */
  onlineStatusOverrides: Record<string, PresenceStatus>;
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

/** Live socket presence wins over the REST-cached `status` field, which is only as
 *  fresh as the last query fetch. Falls back to that cached value until a live
 *  online/offline signal for this user has been received this session. */
export const resolvePresence = (
  overrides: Record<string, PresenceStatus>,
  userId: string | undefined,
  fallback: 'online' | 'offline' | 'away' | undefined,
): 'online' | 'offline' | 'away' | undefined => (userId ? overrides[userId] ?? fallback : fallback);
