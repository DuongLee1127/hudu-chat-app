import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, ActivityIndicator, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenWrapper from '@/providers/ScreenWrapper';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/useNotifications';
import type { NotificationItem as APINotificationItem } from '@/types/notification';

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(date.getTime())) return 'Gần đây';
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
  if (diffInSeconds < 172800) return 'Hôm qua';
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function NotificationItemRow({
  item,
  onPress,
}: {
  item: APINotificationItem;
  onPress: (item: APINotificationItem) => void;
}) {
  let title = 'Thông báo hệ thống';
  let subtitle = 'Bạn có một thông báo mới';

  const colonIndex = item.content.indexOf(':');
  if (colonIndex !== -1) {
    title = item.content.substring(0, colonIndex).trim();
  }

  switch (item.type) {
    case 'message':
      if (!title || title === 'Thông báo hệ thống') title = 'Tin nhắn mới';
      subtitle = 'Đã gửi cho bạn một tin nhắn';
      break;
    case 'friend_request':
      if (!title || title === 'Thông báo hệ thống') title = 'Lời mời kết bạn';
      subtitle = 'Đã gửi cho bạn lời mời kết bạn';
      break;
    case 'mention':
      if (!title || title === 'Thông báo hệ thống') title = 'Lượt nhắc đến';
      subtitle = 'Đã nhắc đến bạn trong một tin nhắn';
      break;
    case 'system':
    default:
      subtitle = 'Bạn có một thông báo mới';
      break;
  }

  const initial = (title || 'N').charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`flex-row items-center px-3.5 py-3 ${!item.isRead ? 'bg-[#F0F7FF]' : 'bg-white'}`}
    >
      {/* Clean Avatar without badge */}
      <View className="h-[52px] w-[52px] rounded-full bg-[#7B5CFA]/15 items-center justify-center">
        <Text className="text-xl font-bold text-[#7B5CFA]">{initial}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center pr-2 ml-3">
        <Text numberOfLines={1} className="font-bold text-[15px] text-[#111827]">
          {title}
        </Text>

        <Text numberOfLines={1} className="mt-0.5 text-[13px] text-gray-500">
          {subtitle} • {formatNotificationTime(item.createdAt)}
        </Text>
      </View>

      {/* Unread indicator */}
      {!item.isRead && <View className="h-2.5 w-2.5 rounded-full bg-[#0879D1]" />}
    </Pressable>
  );
}

export default function Notification() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useNotifications({ page: 1, pageSize: 30 });
  const markAsReadMutation = useMarkNotificationAsRead();

  const rawItems = data?.data?.items;
  const notifications = useMemo(() => rawItems ?? [], [rawItems]);

  const { unreadList, readList } = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead);
    const read = notifications.filter((n) => n.isRead);
    return { unreadList: unread, readList: read };
  }, [notifications]);

  const handlePressItem = (item: APINotificationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (!item.isRead) {
      markAsReadMutation.mutate(item._id);
    }

    if (item.link) {
      if (item.link.startsWith('/chat/')) {
        const conversationId = item.link.replace('/chat/', '');
        if (conversationId) {
          router.push({
            pathname: '/chat/[id]',
            params: { id: conversationId },
          });
        }
      }
    }
  };

  return (
    <ScreenWrapper className="bg-white">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
          <Text className="text-3xl font-bold text-[#111]">Thông báo</Text>
        </View>

        {/* Notification list */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0879D1" />
          </View>
        ) : notifications.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0879D1" />
            }
            className="px-6"
          >
            <View className="justify-center items-center mb-4 w-16 h-16 bg-blue-50 rounded-full">
              <Ionicons name="notifications-outline" size={32} color="#0879D1" />
            </View>
            <Text className="text-base font-bold text-center text-gray-900">
              Chưa có thông báo nào
            </Text>
            <Text className="mt-1 text-sm text-center text-gray-500">
              Khi có tin nhắn mới hoặc thông báo hệ thống, chúng sẽ xuất hiện tại đây.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 120,
            }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0879D1" />
            }
          >
            {/* Section: Mới */}
            {unreadList.length > 0 && (
              <View>
                <View className="px-4 pt-1 pb-2">
                  <Text className="text-[17px] font-bold text-[#111]">Mới</Text>
                </View>

                {unreadList.map((item) => (
                  <NotificationItemRow key={item._id} item={item} onPress={handlePressItem} />
                ))}
              </View>
            )}

            {/* Section: Trước đó */}
            {readList.length > 0 && (
              <View>
                <View className={`px-4 pb-2 ${unreadList.length > 0 ? 'pt-6' : 'pt-1'}`}>
                  <Text className="text-[17px] font-bold text-[#111]">Trước đó</Text>
                </View>

                {readList.map((item) => (
                  <NotificationItemRow key={item._id} item={item} onPress={handlePressItem} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}
