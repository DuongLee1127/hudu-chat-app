import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConversationDetail } from '@/hooks/useConversations';
import { useGetMe } from '@/hooks/useAuth';
import { useListMessages, useMarkAsRead, useSendMessage } from '@/hooks/useMessages';
import { useSocketContext } from '@/providers/SocketProvider';
import { resolvePresence, useChatStore } from '@/stores/chat';
import type { Message } from '@/types/message';

const TYPING_STOP_DELAY_MS = 2500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMessageTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const isSameDayStr = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const formatDateSeparator = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDayStr(isoDate, now.toISOString())) return 'Hôm nay';
  if (isSameDayStr(isoDate, yesterday.toISOString())) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <View className="items-center my-3">
      <View className="rounded-full bg-[#EBEBEB] px-3 py-1">
        <Text className="text-[11px] text-[#888]">{label}</Text>
      </View>
    </View>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <View className="items-center my-2">
      <View className="rounded-full bg-[#EBEBEB] px-3 py-1">
        <Text className="text-[11px] text-[#888] text-center">{content}</Text>
      </View>
    </View>
  );
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showSenderInfo: boolean;
}

function MessageBubble({ message, isMe, showSenderInfo }: MessageBubbleProps) {
  const avatarUrl = message.senderId.avatar;
  const timeLabel = formatMessageTime(message.createdAt);

  return (
    <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
      {/* Group member avatar */}
      {showSenderInfo && (
        <View className="justify-end pb-4 mr-2">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-7 h-7 rounded-full" />
          ) : (
            <View className="h-7 w-7 rounded-full bg-[#0879D1] items-center justify-center">
              <Text className="text-[11px] font-semibold text-white">
                {message.senderId.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name in group */}
        {showSenderInfo && (
          <Text className="mb-0.5 text-[11px] text-[#888]">{message.senderId.username}</Text>
        )}

        {/* Reply preview */}
        {message.replyToMessageId && !message.isDeleted && (
          <View
            className={`mb-1 rounded-lg px-3 py-1.5 border-l-2 ${
              isMe ? 'bg-[#0667B3] border-white/60' : 'bg-[#f0f0f0] border-[#0879D1]'
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${isMe ? 'text-white/85' : 'text-[#0879D1]'}`}
            >
              {message.replyToMessageId.senderId.username}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-[11px] ${isMe ? 'text-white/70' : 'text-[#666]'} ${
                message.replyToMessageId.isDeleted ? 'italic' : ''
              }`}
            >
              {message.replyToMessageId.isDeleted
                ? 'Tin nhắn đã được thu hồi'
                : message.replyToMessageId.content || 'Tệp đính kèm'}
            </Text>
          </View>
        )}

        {/* Main bubble */}
        <View
          className={`rounded-2xl px-4 py-2.5 ${
            isMe ? 'rounded-br-md bg-[#0879D1]' : 'rounded-bl-md bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Text
            className={`text-[13px] leading-5 ${
              message.isDeleted
                ? isMe
                  ? 'italic text-white/70'
                  : 'italic text-[#999]'
                : isMe
                  ? 'text-white'
                  : 'text-[#222]'
            }`}
          >
            {message.isDeleted ? 'Tin nhắn đã được thu hồi' : message.content}
          </Text>
        </View>

        {/* Timestamp / status */}
        <Text
          className={`mt-0.5 text-[10px] ${
            message.status === 'failed' ? 'text-red-400' : 'text-[#aaa]'
          } ${isMe ? 'text-right' : 'text-left'}`}
        >
          {message.status === 'sending' && 'Đang gửi...'}
          {message.status === 'failed' && 'Gửi thất bại'}
          {(!message.status || message.status === 'sent') &&
            `${timeLabel}${message.isEdited && !message.isDeleted ? ' · Đã chỉnh sửa' : ''}`}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type ListItem =
  { kind: 'date'; key: string; label: string } | { kind: 'message'; key: string; message: Message };

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: meData } = useGetMe();
  const currentUserId = meData?.data._id;

  const { startTyping, stopTyping } = useSocketContext();
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);
  const onlineStatusOverrides = useChatStore((s) => s.onlineStatusOverrides);
  const typingMap = useChatStore((s) => (id ? s.typingByConversation[id] : undefined));

  const isOtherTyping = useMemo(
    () => Object.keys(typingMap || {}).some((userId) => userId !== currentUserId),
    [typingMap, currentUserId],
  );

  // Set selected conversation for socket join / leave
  useEffect(() => {
    if (id) {
      setSelectedConversationId(id);
    }
    return () => {
      setSelectedConversationId(null);
    };
  }, [id, setSelectedConversationId]);

  // Data
  const { data: convData, isLoading: convLoading } = useConversationDetail(id);
  const { data: messagesData, isLoading: messagesLoading } = useListMessages(id);
  const sendMutation = useSendMessage(id);
  const markReadMutation = useMarkAsRead(id);

  const conversation = convData?.data.conversation;
  const members = convData?.data.members ?? [];
  const messages = messagesData?.data.items ?? [];

  const isGroup = conversation?.type === 'group';
  const otherMember = !isGroup ? members.find((m) => m.userId._id !== currentUserId)?.userId : null;

  const displayName = isGroup
    ? conversation?.name || 'Nhóm chat'
    : otherMember?.username || 'Người dùng';

  const avatarUrl = isGroup ? conversation?.avatar : otherMember?.avatar;

  const presence = resolvePresence(onlineStatusOverrides, otherMember?._id, otherMember?.status);
  const isOtherOnline = presence === 'online';

  // Input & Typing
  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (id) stopTyping(id);
    };
  }, [id, stopTyping]);

  const handleDraftChange = (text: string) => {
    setDraft(text);
    if (!id) return;

    startTyping(id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping(id);
    }, TYPING_STOP_DELAY_MS);
  };

  // Mark as read when messages load
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.status === 'sending' || last.status === 'failed') return;
    markReadMutation.mutate(last._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Build list items with date separators
  const listItems: ListItem[] = [];
  messages.forEach((msg, idx) => {
    const prev = messages[idx - 1];
    if (!prev || !isSameDayStr(prev.createdAt, msg.createdAt)) {
      listItems.push({
        kind: 'date',
        key: `date-${msg.createdAt}`,
        label: formatDateSeparator(msg.createdAt),
      });
    }
    listItems.push({ kind: 'message', key: msg._id, message: msg });
  });

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (id) stopTyping(id);
    sendMutation.mutate({ content: text, type: 'text' });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [draft, id, sendMutation, stopTyping]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'date') return <DateSeparator label={item.label} />;

      const { message } = item;
      if (message.type === 'system') return <SystemMessage content={message.content} />;

      const isMe = message.senderId._id === currentUserId;
      const showSenderInfo = isGroup && !isMe;

      return <MessageBubble message={message} isMe={isMe} showSenderInfo={showSenderInfo} />;
    },
    [currentUserId, isGroup],
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F4F5FB]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HEADER ── */}
      <View className="border-b border-[#EEEEEE] bg-white px-4 pb-3">
        <View className="h-[55px] flex-row items-center">
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            className="justify-center items-center mr-3 w-8 h-10"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={27} color="#222" />
          </Pressable>

          {/* Avatar */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-11 h-11 rounded-full" />
          ) : (
            <View className="h-11 w-11 rounded-full bg-[#0879D1] items-center justify-center">
              <Text className="text-lg font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-semibold text-[#171717]" numberOfLines={1}>
              {convLoading ? '...' : displayName}
            </Text>

            {convLoading ? null : isOtherTyping ? (
              <Text className="text-[11px] text-[#0879D1] italic">Đang nhập...</Text>
            ) : isGroup ? (
              <Text className="text-[11px] text-[#888]">{members.length} thành viên</Text>
            ) : (
              <View className="mt-0.5 flex-row items-center">
                <View
                  className={`mr-1 h-1.5 w-1.5 rounded-full ${
                    isOtherOnline ? 'bg-[#57C95B]' : 'bg-[#CCC]'
                  }`}
                />
                <Text className={`text-[11px] ${isOtherOnline ? 'text-[#57B957]' : 'text-[#999]'}`}>
                  {isOtherOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <Pressable className="justify-center items-center mr-2 w-8 h-10" hitSlop={8}>
            <Ionicons name="videocam-outline" size={22} color="#555" />
          </Pressable>
          <Pressable className="justify-center items-center w-8 h-10" hitSlop={8}>
            <Ionicons name="call-outline" size={22} color="#555" />
          </Pressable>
        </View>
      </View>

      {/* ── MESSAGES ── */}
      {messagesLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0879D1" />
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-[13px] text-[#aaa]">Chưa có tin nhắn nào. Hãy gửi lời chào!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* ── INPUT ── */}
      <View className="px-4 pt-2 bg-white" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <View className="min-h-[60px] flex-row items-center rounded-full bg-[#F2F4F7] px-2">
          {/* Emoji */}
          <Pressable className="justify-center items-center w-10 h-10">
            <Ionicons name="happy-outline" size={23} color="#777" />
          </Pressable>

          {/* Divider */}
          <View className="mx-1 h-6 w-[1px] bg-[#DADDE2]" />

          {/* Input */}
          <TextInput
            className="flex-1 px-2 text-[13px] text-[#222]"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#A7ADB7"
            value={draft}
            onChangeText={handleDraftChange}
            multiline
            textAlignVertical="center"
          />

          {/* Mic */}
          <Pressable className="justify-center items-center w-10 h-10">
            <Ionicons name="mic-outline" size={22} color="#777" />
          </Pressable>

          {/* Send */}
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className={`h-[40px] w-[40px] items-center justify-center rounded-full ${
              draft.trim() ? 'bg-[#0879D1]' : 'bg-[#C8C8D8]'
            }`}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
