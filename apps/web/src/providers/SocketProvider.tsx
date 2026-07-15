'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useGetMe } from '@/hook/useAuth';
import { useChatStore } from '@/store/useChatStore';
import type { Message, ListMessagesResult, SendMessagePayload } from '@/types/message';
import type { ApiResponse } from '@/types/api';
import { notify } from '@/lib/notify';

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
    const onConnectError = (err: Error) => {
      // warn (not error) so Next.js doesn't show a full-screen overlay on retries
      console.warn('[socket] connect_error:', err.message);
      setConnected(false);
    };

    const patchMessagesCache = (
      conversationId: string,
      updater: (result: ListMessagesResult) => ListMessagesResult,
    ) => {
      const id = String(conversationId);
      queryClient.setQueriesData<ApiResponse<ListMessagesResult>>(
        { queryKey: ['messages', id], exact: false },
        (old) => (old ? { ...old, data: updater(old.data) } : old),
      );
    };

    const onMessageCreated = ({ message, tempId }: { message: Message; tempId?: string }) => {
      const conversationId = String(message.conversationId);
      const normalized: Message = { ...message, conversationId };
      patchMessagesCache(conversationId, (result) => {
        const withoutTemp = tempId ? result.items.filter((m) => m.tempId !== tempId) : result.items;
        if (withoutTemp.some((m) => m._id === normalized._id)) return result;
        return { ...result, items: [...withoutTemp, normalized] };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const senderId =
        typeof message.senderId === 'object' && message.senderId
          ? String(message.senderId._id)
          : String(message.senderId);
      if (senderId && senderId !== currentUserId) {
        socket.emit('message:delivered', { messageId: message._id });
      }
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
    const onMessageReaction = ({ message }: { message: Message }) => {
      patchMessagesCache(message.conversationId, (result) => ({
        ...result,
        items: result.items.map((item) => (item._id === message._id ? message : item)),
      }));
    };
    const onConversationPins = ({ conversation }: { conversation: { _id: string } }) => {
      if (conversation?._id) {
        queryClient.invalidateQueries({ queryKey: ['conversations', conversation._id] });
      }
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

    const onMessageRead = ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    };

    const onMessageDelivered = ({
      conversationId,
      messageId,
      userId,
    }: {
      conversationId: string;
      messageId: string;
      userId: string;
    }) => {
      patchMessagesCache(conversationId, (result) => ({
        ...result,
        items: result.items.map((message) =>
          message._id === messageId
            ? {
                ...message,
                deliveredTo: Array.from(new Set([...(message.deliveredTo ?? []), userId])),
                status: message.senderId._id === currentUserId ? 'delivered' : message.status,
              }
            : message,
        ),
      }));
    };

    const onNotificationNew = ({
      notification,
    }: {
      notification: { content?: string };
    }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (notification?.content) {
        notify.info(notification.content);
      }
    };

    const onFriendRequestChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    if (socket.connected) setConnected(true);
    socket.on('message:created', onMessageCreated);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:reaction', onMessageReaction);
    socket.on('conversation:pins', onConversationPins);
    socket.on('presence:online', onPresenceOnline);
    socket.on('presence:offline', onPresenceOffline);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:read', onMessageRead);
    socket.on('message:delivered', onMessageDelivered);
    socket.on('notification:new', onNotificationNew);
    socket.on('friend_request:new', onFriendRequestChanged);
    socket.on('friend_request:accepted', onFriendRequestChanged);
    socket.on('friend_request:removed', onFriendRequestChanged);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('message:created', onMessageCreated);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
    socket.off('message:reaction', onMessageReaction);
    socket.off('conversation:pins', onConversationPins);
      socket.off('presence:online', onPresenceOnline);
      socket.off('presence:offline', onPresenceOffline);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:read', onMessageRead);
      socket.off('message:delivered', onMessageDelivered);
      socket.off('notification:new', onNotificationNew);
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

    const join = () => {
      socket.emit('conversation:join', { conversationId: selectedConversationId });
    };

    join();
    // Re-join after reconnect so room membership survives brief disconnects.
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
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
