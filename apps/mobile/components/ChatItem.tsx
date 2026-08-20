import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import UnreadBadge from '@/components/UnreadBadge';
import { ATTACHMENT_PREVIEW_BY_TYPE } from '@/constants';
import type { ConversationListItem } from '@/types/conversation';

// ─── Helpers (mirrors ConversationsList.tsx logic) ────────────────────────────

const formatConversationTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  return isSameDay
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const getDisplayName = (item: ConversationListItem) =>
  item.type === 'group' ? item.name || 'Nhóm chat' : item.otherMember?.username || 'Người dùng';

const getAvatarUrl = (item: ConversationListItem) =>
  item.type === 'group' ? item.avatar : item.otherMember?.avatar;

const getLastMessagePreview = (item: ConversationListItem, currentUserId?: string) => {
  const lastMessage = item.lastMessage;
  if (!lastMessage) {
    return item.type === 'group' ? 'Nhóm chat' : 'Trò chuyện riêng tư';
  }
  if (lastMessage.isDeleted) return 'Tin nhắn đã được thu hồi';

  const isMine = lastMessage.senderId._id === currentUserId;
  const prefix = isMine
    ? 'Bạn: '
    : item.type === 'group'
      ? `${lastMessage.senderId.username}: `
      : '';
  const content = ATTACHMENT_PREVIEW_BY_TYPE[lastMessage.type] || lastMessage.content;
  return `${prefix}${content}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ChatItemProps {
  item: ConversationListItem;
  currentUserId?: string;
}

export default function ChatItem({ item, currentUserId }: ChatItemProps) {
  const router = useRouter();

  const displayName = getDisplayName(item);
  const avatarUrl = getAvatarUrl(item);
  const isMuted = !!item.memberSetting?.mutedUntil;
  const hasUnread = (item.unreadCount || 0) > 0;
  const preview = getLastMessagePreview(item, currentUserId);
  const timeStr = formatConversationTime(item.lastMessage?.createdAt || item.lastMessageAt);

  const handlePress = () => {
    router.push({
      pathname: '/chat/[id]',
      params: { id: item._id },
    });
  };

  return (
    <Pressable
      className="w-full flex-row py-3 active:bg-[#F5F6F8] px-3"
      android_ripple={{ color: '#F5F6F8' }}
      onPress={handlePress}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="h-[58px] w-[58px] rounded-full" />
      ) : (
        <View className="h-[58px] w-[58px] rounded-full items-center justify-center bg-[#5b5bf6]">
          <Text className="text-lg font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Message */}
      <View className="flex-1 gap-1 justify-center ml-3">
        <View className="flex-row gap-1 items-center">
          <Text
            numberOfLines={1}
            className={`text-[16px] font-semibold text-[#171717] flex-shrink ${hasUnread ? 'font-bold' : ''}`}
          >
            {displayName}
          </Text>
          {isMuted && <Ionicons name="volume-mute-outline" size={13} color="#9a9ab0" />}
        </View>

        <Text
          numberOfLines={1}
          className={`mt-0.5 text-[13px] ${hasUnread ? 'text-[#171717] font-semibold' : 'text-[#888]'}`}
        >
          {preview}
        </Text>
      </View>

      {/* Right */}
      <View className="ml-2 min-w-[38px] items-end">
        <Text className="text-[10px] text-[#999]">{timeStr}</Text>
        {hasUnread && <UnreadBadge count={item.unreadCount} />}
      </View>
    </Pressable>
  );
}
