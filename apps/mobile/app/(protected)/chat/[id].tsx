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
import * as Haptics from 'expo-haptics';

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
      <View className="rounded-full bg-[#EBEBEB] px-3.5 py-1">
        <Text className="text-xs font-medium text-gray-500">{label}</Text>
      </View>
    </View>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <View className="items-center my-2">
      <View className="rounded-full bg-[#EBEBEB] px-3.5 py-1">
        <Text className="text-xs font-medium text-center text-gray-500">{content}</Text>
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
        <View className="justify-end pb-5 mr-2">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-8 h-8 rounded-full" />
          ) : (
            <View className="h-8 w-8 rounded-full bg-[#0879D1] items-center justify-center">
              <Text className="text-xs font-semibold text-white">
                {message.senderId.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name in group */}
        {showSenderInfo && (
          <Text className="mb-1 text-xs font-medium text-gray-500">
            {message.senderId.username}
          </Text>
        )}

        {/* Reply preview */}
        {message.replyToMessageId && !message.isDeleted && (
          <View
            className={`mb-1.5 rounded-xl px-3.5 py-2 border-l-3 ${
              isMe ? 'bg-[#0667B3] border-white/80' : 'bg-[#EAEAEA] border-[#0879D1]'
            }`}
          >
            <Text className={`text-xs font-semibold ${isMe ? 'text-white' : 'text-[#0879D1]'}`}>
              {message.replyToMessageId.senderId.username}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-600'} ${
                message.replyToMessageId.isDeleted ? 'italic' : ''
              }`}
            >
              {message.replyToMessageId.isDeleted
                ? 'Tin nhắn đã được thu hồi'
                : message.replyToMessageId.content || 'Tệp đính kèm'}
            </Text>
          </View>
        )}

        {/* Main bubble với cỡ chữ to dễ đọc */}
        <View
          className={`rounded-2xl px-4 py-2.5 ${
            isMe ? 'rounded-br-xs bg-[#0879D1]' : 'rounded-bl-xs bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 1.5,
          }}
        >
          <Text
            className={`text-base leading-6 font-normal ${
              message.isDeleted
                ? isMe
                  ? 'italic text-white/75'
                  : 'italic text-gray-400'
                : isMe
                  ? 'text-white'
                  : 'text-gray-900'
            }`}
          >
            {message.isDeleted ? 'Tin nhắn đã được thu hồi' : message.content}
          </Text>
        </View>

        {/* Timestamp / status */}
        <Text
          className={`mt-1 text-[11px] ${
            message.status === 'failed' ? 'text-red-500 font-medium' : 'text-gray-400'
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F4F5FB]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* ── HEADER ── */}
      <View className="border-b border-[#EEEEEE] bg-white px-4 pb-3">
        <View className="h-[58px] flex-row items-center">
          {/* Back Button với phản hồi rung haptic */}
          <Pressable
            onPress={handleBackPress}
            className="justify-center items-center mr-2.5 w-9 h-10 rounded-full active:bg-gray-100"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </Pressable>

          {/* Avatar */}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-11 h-11 rounded-full" />
          ) : (
            <View className="h-11 w-11 rounded-full bg-[#0879D1] items-center justify-center">
              <Text className="text-xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* User / Group Info với chữ to rõ */}
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {convLoading ? '...' : displayName}
            </Text>

            {convLoading ? null : isOtherTyping ? (
              <Text className="text-xs text-[#0879D1] italic font-medium">Đang nhập...</Text>
            ) : isGroup ? (
              <Text className="text-xs text-gray-500">{members.length} thành viên</Text>
            ) : (
              <View className="mt-0.5 flex-row items-center">
                <View
                  className={`mr-1.5 h-2 w-2 rounded-full ${
                    isOtherOnline ? 'bg-[#57C95B]' : 'bg-gray-300'
                  }`}
                />
                <Text
                  className={`text-xs font-normal ${isOtherOnline ? 'text-[#34A853]' : 'text-gray-400'}`}
                >
                  {isOtherOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </Text>
              </View>
            )}
          </View>

          {/* Call Actions */}
          <Pressable
            className="justify-center items-center mr-1 w-9 h-10 rounded-full active:bg-gray-100"
            hitSlop={8}
          >
            <Ionicons name="videocam-outline" size={24} color="#4B5563" />
          </Pressable>
          <Pressable
            className="justify-center items-center w-9 h-10 rounded-full active:bg-gray-100"
            hitSlop={8}
          >
            <Ionicons name="call-outline" size={23} color="#4B5563" />
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
          <Text className="text-base font-normal text-gray-400">
            Chưa có tin nhắn nào. Hãy gửi lời chào! 👋
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* ── INPUT ── */}
      <View
        className="px-4 pt-2.5 pb-2.5 bg-white"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="min-h-[58px] flex-row items-center rounded-full bg-[#F2F4F7] px-3 py-1">
          {/* Emoji */}
          <Pressable className="justify-center items-center w-10 h-10 rounded-full active:bg-gray-200">
            <Ionicons name="happy-outline" size={25} color="#6B7280" />
          </Pressable>

          {/* Divider */}
          <View className="mx-1 h-6 w-[1px] bg-[#DADDE2]" />

          {/* Input với cỡ chữ to rõ text-lg */}
          <TextInput
            className="flex-1 px-2.5 text-base font-normal leading-6 text-gray-900"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#9CA3AF"
            value={draft}
            onChangeText={handleDraftChange}
            multiline
            textAlignVertical="center"
          />

          {/* Mic */}
          <Pressable className="justify-center items-center w-10 h-10 rounded-full active:bg-gray-200">
            <Ionicons name="mic-outline" size={24} color="#6B7280" />
          </Pressable>

          {/* Send */}
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className={`h-[44px] w-[44px] items-center justify-center rounded-full active:opacity-80 ${
              draft.trim() ? 'bg-[#0879D1]' : 'bg-[#C8C8D8]'
            }`}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
