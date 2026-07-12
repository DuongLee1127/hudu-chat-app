'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useGetMe } from '@/hook/useAuth';
import { useChatStore } from '@/store/useChatStore';
import type { Message, ListMessagesResult, SendMessagePayload } from '@/types/message';
import type { ApiResponse } from '@/types/api';

interface SocketContextValue {
  socket: Socket;
  connected: boolean;
  sendMessage: (
    conversationId: string,
    payload: SendMessagePayload,
  ) => Promise<{ success: boolean; data?: Message; tempId?: string; error?: string }>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markRead: (conversationId: string, lastReadMessageId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocketContext phải được dùng bên trong SocketProvider');
  }
  return ctx;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: meData } = useGetMe();
  const currentUserId = meData?.data?._id;

  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const setUserOffline = useChatStore((s) => s.setUserOffline);
  const setUserTyping = useChatStore((s) => s.setUserTyping);
  const setUserStoppedTyping = useChatStore((s) => s.setUserStoppedTyping);

  const socket = getSocket();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const patchMessagesCache = (
      conversationId: string,
      updater: (result: ListMessagesResult) => ListMessagesResult,
    ) => {
      queryClient.setQueriesData<ApiResponse<ListMessagesResult>>(
        { queryKey: ['messages', conversationId], exact: false },
        (old) => (old ? { ...old, data: updater(old.data) } : old),
      );
    };

    const onMessageCreated = ({ message, tempId }: { message: Message; tempId?: string }) => {
      patchMessagesCache(message.conversationId, (result) => {
        const withoutTemp = tempId ? result.items.filter((m) => m.tempId !== tempId) : result.items;
        if (withoutTemp.some((m) => m._id === message._id)) return result;
        return { ...result, items: [...withoutTemp, message] };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const onMessageUpdated = ({ message }: { message: Message }) => {
      patchMessagesCache(message.conversationId, (result) => ({
        ...result,
        items: result.items.map((m) => (m._id === message._id ? message : m)),
      }));
    };

    const onMessageDeleted = ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      patchMessagesCache(conversationId, (result) => ({
        ...result,
        items: result.items.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: '' } : m,
        ),
      }));
    };

    const onPresenceOnline = ({ userId }: { userId: string }) => setUserOnline(userId);
    const onPresenceOffline = ({ userId }: { userId: string }) => setUserOffline(userId);

    const onTypingStart = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => setUserTyping(conversationId, userId);
    const onTypingStop = ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      setUserStoppedTyping(conversationId, userId);

    const onMessageRead = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const onFriendRequestChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:created', onMessageCreated);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('presence:online', onPresenceOnline);
    socket.on('presence:offline', onPresenceOffline);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onMessageRead);
    socket.on('friend_request:new', onFriendRequestChanged);
    socket.on('friend_request:accepted', onFriendRequestChanged);
    socket.on('friend_request:removed', onFriendRequestChanged);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:created', onMessageCreated);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('presence:online', onPresenceOnline);
      socket.off('presence:offline', onPresenceOffline);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onMessageRead);
      socket.off('friend_request:new', onFriendRequestChanged);
      socket.off('friend_request:accepted', onFriendRequestChanged);
      socket.off('friend_request:removed', onFriendRequestChanged);
      socket.disconnect();
    };
  }, [
    currentUserId,
    queryClient,
    socket,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    setUserStoppedTyping,
  ]);

  const selectedConversationId = useChatStore((s) => s.selectedConversationId);

  useEffect(() => {
    if (!connected || !selectedConversationId) return;

    socket.emit('conversation:join', { conversationId: selectedConversationId });

    return () => {
      socket.emit('conversation:leave', { conversationId: selectedConversationId });
    };
  }, [connected, selectedConversationId, socket]);

  const value: SocketContextValue = {
    socket,
    connected,
    sendMessage: (conversationId, payload) =>
      new Promise((resolve) => {
        socket.emit(
          'message:send',
          { conversationId, ...payload },
          (res: { success: boolean; data?: Message; tempId?: string; error?: string }) => {
            resolve(res);
          },
        );
      }),
    startTyping: (conversationId) => socket.emit('typing:start', { conversationId }),
    stopTyping: (conversationId) => socket.emit('typing:stop', { conversationId }),
    markRead: (conversationId, lastReadMessageId) =>
      socket.emit('message:read', { conversationId, lastReadMessageId }),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
