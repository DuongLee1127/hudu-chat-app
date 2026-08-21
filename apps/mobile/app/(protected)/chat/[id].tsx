import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Animated,
  ActivityIndicator,
  Clipboard,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import ScreenWrapper from '@/providers/ScreenWrapper';
import ChatInfoModal from '@/components/ChatInfoModal';
import { useConversationDetail } from '@/hooks/useConversations';
import { useGetMe } from '@/hooks/useAuth';
import {
  useListMessages,
  useMarkAsRead,
  useSendMessage,
  useDeleteMessage,
  useTogglePinMessage,
  usePinnedMessages,
} from '@/hooks/useMessages';
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
        <Text className="text-sm font-medium text-gray-500">{label}</Text>
      </View>
    </View>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <View className="items-center my-2">
      <View className="rounded-full bg-[#EBEBEB] px-3.5 py-1">
        <Text className="text-[16px] font-medium text-center text-gray-500">{content}</Text>
      </View>
    </View>
  );
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isGroup: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onLongPress?: (message: Message) => void;
}

function MessageBubble({
  message,
  isMe,
  isGroup,
  isFirstInGroup,
  isLastInGroup,
  onLongPress,
}: MessageBubbleProps) {
  const avatarUrl = message.senderId.avatar;
  const timeLabel = formatMessageTime(message.createdAt);
  const showSenderName = isGroup && !isMe && isFirstInGroup;
  const showAvatar = isGroup && !isMe;
  const showTimestamp =
    isLastInGroup || message.status === 'sending' || message.status === 'failed';

  return (
    <View
      className={`${isLastInGroup ? 'mb-3.5' : 'mb-1'} ${message.isPinned && !message.isDeleted ? 'mt-2' : ''} flex-row ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {/* Group member avatar (Messenger style: avatar ONLY at the bottom of consecutive block) */}
      {showAvatar && (
        <View className="justify-end mr-2 w-8">
          {isLastInGroup ? (
            avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="h-8 w-8 rounded-full bg-[#6f6bff] items-center justify-center">
                <Text className="text-xs font-semibold text-white">
                  {message.senderId.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )
          ) : (
            <View className="w-8 h-8" />
          )}
        </View>
      )}

      <View className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name in group (only on top message of consecutive group) */}
        {showSenderName && (
          <Text className="mb-1 text-sm font-medium text-gray-500">
            {message.senderId.username}
          </Text>
        )}

        {/* Pin indicator ABOVE the bubble (Messenger style) */}
        {message.isPinned && !message.isDeleted && (
          <View className={`flex-row items-center mb-1 ml-2.5 ${isMe ? 'self-end' : 'self-start'}`}>
            <Text className="ml-1 text-[11px] text-gray-500">Đã ghim</Text>
          </View>
        )}

        {/* Reply preview */}
        {message.replyToMessageId && !message.isDeleted && (
          <View
            className={`mb-1.5 rounded-xl px-3.5 py-2 border-l-3 ${
              isMe ? 'bg-[#5B52E0] border-white/80' : 'bg-[#EAEAEA] border-[#6f6bff]'
            }`}
          >
            <Text className={`text-xs font-semibold ${isMe ? 'text-white' : 'text-[#6f6bff]'}`}>
              {message.replyToMessageId.senderId.username}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${isMe ? 'text-white/80' : 'text-gray-600'} ${
                message.replyToMessageId.isDeleted ? 'italic' : ''
              }`}
            >
              {message.replyToMessageId.isDeleted
                ? 'Tin nhắn đã được thu hồi'
                : message.replyToMessageId.content || 'Tệp đính kèm'}
            </Text>
          </View>
        )}

        {/* Main bubble with long press handler - wrapped in relative View for pin overlay */}
        <View style={{ position: 'relative' }}>
          <Pressable
            onLongPress={() => {
              if (!message.isDeleted && onLongPress) {
                onLongPress(message);
              }
            }}
            delayLongPress={250}
            className={`rounded-2xl px-4 py-2.5 ${
              isMe ? 'rounded-br-xs bg-[#6f6bff]' : 'rounded-bl-xs bg-white'
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
              className={`text-[16px] leading-6 font-normal ${
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
          </Pressable>

          {/* Pin icon overlaid on top-left corner of bubble */}
          {message.isPinned && !message.isDeleted && (
            <View
              style={{
                position: 'absolute',
                top: -8,
                left: isMe ? undefined : -6,
                right: isMe ? -6 : undefined,
              }}
            >
              <View
                className="justify-center items-center w-5 h-5 bg-amber-400 rounded-full"
                style={{
                  shadowColor: '#D97706',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.4,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <FontAwesome5 name="thumbtack" size={10} color="white" />
              </View>
            </View>
          )}
        </View>

        {/* Timestamp / status (only shown on last message of consecutive block or status) */}
        {showTimestamp && (
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
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'date'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      message: Message;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

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
  const { data: pinnedMessagesRes } = usePinnedMessages(id);
  const sendMutation = useSendMessage(id);
  const markReadMutation = useMarkAsRead(id);
  const deleteMutation = useDeleteMessage(id);
  const togglePinMutation = useTogglePinMessage(id);

  // States
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [selectedActionMessage, setSelectedActionMessage] = useState<Message | null>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);
  const menuScaleAnim = useRef(new Animated.Value(0)).current;

  const conversation = convData?.data.conversation;
  const members = convData?.data.members ?? [];
  const messages = useMemo(() => messagesData?.data.items ?? [], [messagesData?.data.items]);

  const pinnedList = useMemo(
    () => pinnedMessagesRes?.data.items ?? [],
    [pinnedMessagesRes?.data.items],
  );
  const latestPinned = pinnedList.length > 0 ? pinnedList[pinnedList.length - 1] : null;

  const isGroup = conversation?.type === 'group';
  const otherMember = !isGroup ? members.find((m) => m.userId._id !== currentUserId)?.userId : null;

  const displayName = isGroup
    ? conversation?.name || 'Nhóm chat'
    : otherMember?.username || 'Người dùng';

  const avatarUrl = isGroup ? conversation?.avatar : otherMember?.avatar;

  const presence = resolvePresence(onlineStatusOverrides, otherMember?._id, otherMember?.status);
  const isOtherOnline = presence === 'online';

  // Full-Screen Chat Info Modal
  const [isChatInfoVisible, setChatInfoVisible] = useState(false);

  const handleOpenChatInfo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setChatInfoVisible(true);
  };

  const handleLongPressMessage = useCallback(
    (msg: Message) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      menuScaleAnim.setValue(0);
      setSelectedActionMessage(msg);
      Animated.spring(menuScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      }).start();
    },
    [menuScaleAnim],
  );

  const handleCloseContextMenu = useCallback(() => {
    Animated.timing(menuScaleAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setSelectedActionMessage(null));
  }, [menuScaleAnim]);

  // Input & Typing
  const [draft, setDraft] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // Build list items with date separators & message grouping
  const visibleMessages = useMemo(
    () => messages.filter((m) => !deletedForMeIds.includes(m._id)),
    [messages, deletedForMeIds],
  );

  const listItems: ListItem[] = [];
  visibleMessages.forEach((msg, idx) => {
    const prev = visibleMessages[idx - 1];
    const next = visibleMessages[idx + 1];

    const hasDateBefore = !prev || !isSameDayStr(prev.createdAt, msg.createdAt);

    if (hasDateBefore) {
      listItems.push({
        kind: 'date',
        key: `date-${msg.createdAt}`,
        label: formatDateSeparator(msg.createdAt),
      });
    }

    const isSameSenderAsPrev =
      !hasDateBefore &&
      prev &&
      prev.type !== 'system' &&
      msg.type !== 'system' &&
      prev.senderId._id === msg.senderId._id;

    const isSameSenderAsNext =
      next &&
      isSameDayStr(msg.createdAt, next.createdAt) &&
      next.type !== 'system' &&
      msg.type !== 'system' &&
      next.senderId._id === msg.senderId._id;

    const isFirstInGroup = !isSameSenderAsPrev;
    const isLastInGroup = !isSameSenderAsNext;

    listItems.push({
      kind: 'message',
      key: msg._id,
      message: msg,
      isFirstInGroup,
      isLastInGroup,
    });
  });

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDraft('');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (id) stopTyping(id);
    sendMutation.mutate({
      content: text,
      type: 'text',
      replyToMessageId: replyToMessage ? replyToMessage._id : undefined,
    });
    setReplyToMessage(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [draft, id, sendMutation, stopTyping, replyToMessage]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'date') return <DateSeparator label={item.label} />;

      const { message, isFirstInGroup, isLastInGroup } = item;
      if (message.type === 'system') return <SystemMessage content={message.content} />;

      const isMe = message.senderId._id === currentUserId;

      return (
        <MessageBubble
          message={message}
          isMe={isMe}
          isGroup={isGroup}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          onLongPress={handleLongPressMessage}
        />
      );
    },
    [currentUserId, isGroup, handleLongPressMessage],
  );

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  return (
    <ScreenWrapper className="bg-white">
      <KeyboardAvoidingView
        className="flex-1 bg-[#F4F5FB]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── HEADER ── */}
        <View className="border-b border-[#EEEEEE] bg-white px-4">
          <View className="h-[58px] flex-row items-center">
            {/* Back Button */}
            <Pressable
              onPress={handleBackPress}
              className="justify-center items-center mr-2.5 w-9 h-10 rounded-full active:bg-gray-100"
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={28} color="#1F2937" />
            </Pressable>

            {/* Avatar & User Info */}
            <Pressable
              onPress={handleOpenChatInfo}
              className="flex-row flex-1 items-center active:opacity-75"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-11 h-11 rounded-full" />
              ) : (
                <View className="h-11 w-11 rounded-full bg-[#6f6bff] items-center justify-center">
                  <Text className="text-xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                  {convLoading ? '...' : displayName}
                </Text>

                {convLoading ? null : isOtherTyping ? (
                  <Text className="text-xs text-[#6f6bff] italic font-medium">Đang nhập...</Text>
                ) : isGroup ? (
                  <Text className="text-sm text-gray-500">{members.length} thành viên</Text>
                ) : (
                  <View className="mt-0.5 flex-row items-center">
                    <View
                      className={`mr-1.5 h-2 w-2 rounded-full ${
                        isOtherOnline ? 'bg-[#57C95B]' : 'bg-gray-300'
                      }`}
                    />
                    <Text
                      className={`text-sm font-normal ${isOtherOnline ? 'text-[#34A853]' : 'text-gray-400'}`}
                    >
                      {isOtherOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

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

        {/* ── PINNED MESSAGES TOP TAB ── */}
        {latestPinned && (
          <Pressable
            onPress={() => setChatInfoVisible(true)}
            className="flex-row items-center px-4 py-3 bg-[#6f6bff] active:bg-[#5B52E0]"
          >
            <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center mr-2.5">
              <FontAwesome5 name="thumbtack" size={14} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white" numberOfLines={1}>
                {pinnedList.length} tin nhắn đã ghim
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        {/* ── MESSAGES ── */}
        <View className="flex-1 bg-[#F4F5FB]">
          {messagesLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#6f6bff" />
            </View>
          ) : visibleMessages.length === 0 ? (
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
        </View>

        {/* ── REPLY BANNER ── */}
        {replyToMessage && (
          <View className="flex-row justify-between items-center px-4 py-2.5 bg-white border-t-2 border-[#6f6bff]">
            <View className="flex-row flex-1 items-center mr-2">
              <View className="mr-3 w-[3px] h-9 bg-[#6f6bff] rounded-full" />
              <View className="flex-1">
                <Text className="text-[12px] font-bold text-[#6f6bff] mb-0.5">
                  ↩ Trả lời {replyToMessage.senderId.username}
                </Text>
                <Text className="text-[12px] text-gray-500" numberOfLines={1}>
                  {replyToMessage.content || 'Tệp đính kèm'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setReplyToMessage(null)}
              className="justify-center items-center w-7 h-7 bg-gray-100 rounded-full active:bg-gray-200"
            >
              <Ionicons name="close" size={16} color="#6B7280" />
            </Pressable>
          </View>
        )}

        {/* ── INPUT ── */}
        <View
          className="px-4 pt-2.5 bg-white"
          style={{ paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) }}
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
              className="flex-1 px-2.5 text-[16px] font-normal leading-5 text-gray-900"
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
                draft.trim() ? 'bg-[#6f6bff]' : 'bg-[#C8C8D8]'
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

      {/* ── MESSENGER FLOATING ACTION MENU MODAL ── */}
      <Modal
        visible={Boolean(selectedActionMessage)}
        transparent
        animationType="none"
        onRequestClose={handleCloseContextMenu}
      >
        <Pressable
          className="flex-1 justify-center items-center px-5 bg-black/50"
          onPress={handleCloseContextMenu}
        >
          <Animated.View
            style={{
              opacity: menuScaleAnim,
              transform: [
                {
                  scale: menuScaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.82, 1],
                  }),
                },
              ],
              width: '100%',
              maxWidth: 360,
            }}
          >
            <Pressable
              className="p-4 bg-white rounded-3xl shadow-2xl"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Quick Emoji Reaction Pill */}
              <View className="flex-row justify-around items-center px-3 py-2 mb-3 bg-gray-100 rounded-full">
                {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      handleCloseContextMenu();
                    }}
                    className="p-1 active:opacity-70"
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Message Preview */}
              {selectedActionMessage && (
                <View className="flex-row items-center p-3 mb-3 rounded-2xl border border-blue-100 bg-blue-50/60">
                  <View className="w-8 h-8 rounded-full bg-[#6f6bff] items-center justify-center mr-2.5">
                    <Text className="text-xs font-bold text-white">
                      {selectedActionMessage.senderId?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#6f6bff]">
                      {selectedActionMessage.senderId?.username || 'Người dùng'}
                    </Text>
                    <Text className="text-xs text-gray-800" numberOfLines={2}>
                      {selectedActionMessage.content || '[Tệp đính kèm]'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View>
                {/* Trả lời */}
                <Pressable
                  onPress={() => {
                    if (selectedActionMessage) {
                      setReplyToMessage(selectedActionMessage);
                      handleCloseContextMenu();
                    }
                  }}
                  className="flex-row items-center px-3 py-3 rounded-2xl active:bg-gray-100"
                >
                  <View className="justify-center items-center mr-3 w-8 h-8 bg-blue-50 rounded-full">
                    <Ionicons name="arrow-undo-outline" size={18} color="#6f6bff" />
                  </View>
                  <Text className="text-[15px] font-semibold text-gray-800">Trả lời</Text>
                </Pressable>

                {/* Sao chép */}
                <Pressable
                  onPress={() => {
                    if (selectedActionMessage) {
                      Clipboard.setString(selectedActionMessage.content || '');
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
                        () => {},
                      );
                      handleCloseContextMenu();
                    }
                  }}
                  className="flex-row items-center px-3 py-3 rounded-2xl active:bg-gray-100"
                >
                  <View className="justify-center items-center mr-3 w-8 h-8 bg-gray-100 rounded-full">
                    <Ionicons name="copy-outline" size={18} color="#4B5563" />
                  </View>
                  <Text className="text-[15px] font-semibold text-gray-800">Sao chép</Text>
                </Pressable>

                {/* Ghim / Bỏ ghim */}
                <Pressable
                  onPress={() => {
                    if (selectedActionMessage) {
                      togglePinMutation.mutate(selectedActionMessage._id);
                      handleCloseContextMenu();
                    }
                  }}
                  className="flex-row items-center px-3 py-3 rounded-2xl active:bg-gray-100"
                >
                  <View className="justify-center items-center mr-3 w-8 h-8 bg-amber-50 rounded-full">
                    <Ionicons name="pin-outline" size={18} color="#D97706" />
                  </View>
                  <Text className="text-[15px] font-semibold text-gray-800">
                    {selectedActionMessage?.isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                  </Text>
                </Pressable>

                {/* Own message only */}
                {selectedActionMessage?.senderId._id === currentUserId && (
                  <>
                    <Pressable
                      onPress={() => {
                        if (selectedActionMessage) {
                          setDeletedForMeIds((prev) => [...prev, selectedActionMessage._id]);
                          handleCloseContextMenu();
                        }
                      }}
                      className="flex-row items-center px-3 py-3 rounded-2xl active:bg-gray-100"
                    >
                      <View className="justify-center items-center mr-3 w-8 h-8 bg-red-50 rounded-full">
                        <Ionicons name="eye-off-outline" size={18} color="#EF4444" />
                      </View>
                      <Text className="text-[15px] font-semibold text-red-500">Xóa ở phía tôi</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (selectedActionMessage) {
                          deleteMutation.mutate(selectedActionMessage._id);
                          handleCloseContextMenu();
                        }
                      }}
                      className="flex-row items-center px-3 py-3 rounded-2xl active:bg-gray-100"
                    >
                      <View className="justify-center items-center mr-3 w-8 h-8 bg-red-50 rounded-full">
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </View>
                      <Text className="text-[15px] font-semibold text-red-500">
                        Thu hồi với mọi người
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Full-Screen Chat Info Modal (Slide from right) */}
      <ChatInfoModal
        visible={isChatInfoVisible}
        onClose={() => setChatInfoVisible(false)}
        conversationId={id}
        displayName={displayName}
        avatarUrl={avatarUrl}
        isGroup={Boolean(isGroup)}
        isOtherOnline={isOtherOnline}
        members={members}
        currentUserId={currentUserId}
      />
    </ScreenWrapper>
  );
}
