import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type NotificationItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: string;
  unread?: boolean;
  type: 'message' | 'like' | 'mention' | 'friend';
};

const notifications: NotificationItem[] = [
  {
    id: '1',
    name: 'Zahri K.',
    message: 'đã gửi cho bạn một tin nhắn mới.',
    time: '2 phút',
    avatar: 'https://i.pravatar.cc/150?img=11',
    unread: true,
    type: 'message',
  },
  {
    id: '2',
    name: 'Hodden',
    message: 'đã thích tin của bạn.',
    time: '15 phút',
    avatar: 'https://i.pravatar.cc/150?img=13',
    unread: true,
    type: 'like',
  },
  {
    id: '3',
    name: 'Peter R.',
    message: 'đã nhắc đến bạn trong một tin nhắn.',
    time: '1 giờ',
    avatar: 'https://i.pravatar.cc/150?img=14',
    type: 'mention',
  },
  {
    id: '4',
    name: 'Salma',
    message: 'đã gửi lời mời kết bạn cho bạn.',
    time: '3 giờ',
    avatar: 'https://i.pravatar.cc/150?img=16',
    type: 'friend',
  },
  {
    id: '5',
    name: 'Nguyễn Minh',
    message: 'đã gửi cho bạn một tin nhắn.',
    time: 'Hôm qua',
    avatar: 'https://i.pravatar.cc/150?img=20',
    type: 'message',
  },
];

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
  switch (type) {
    case 'message':
      return (
        <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-[#0879D1]">
          <Ionicons name="chatbubble" size={13} color="white" />
        </View>
      );

    case 'like':
      return (
        <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-[#F04444]">
          <Ionicons name="heart" size={13} color="white" />
        </View>
      );

    case 'mention':
      return (
        <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-[#0879D1]">
          <Text className="text-[13px] font-bold text-white">@</Text>
        </View>
      );

    case 'friend':
      return (
        <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-[#42B72A]">
          <Ionicons name="person-add" size={13} color="white" />
        </View>
      );
  }
}

function NotificationItemRow({ item }: { item: NotificationItem }) {
  return (
    <Pressable
      className={`flex-row items-center px-3 py-3 ${item.unread ? 'bg-[#F0F7FF]' : 'bg-white'}`}
    >
      {/* Avatar */}
      <View className="relative">
        <Image source={{ uri: item.avatar }} className="h-[58px] w-[58px] rounded-full" />

        <NotificationIcon type={item.type} />
      </View>

      {/* Content */}
      <View className="flex-1 pr-2 ml-3">
        <Text numberOfLines={2} className="text-[14px] leading-[20px] text-[#222]">
          <Text className="font-bold">{item.name}</Text> {item.message}
        </Text>

        <Text className="mt-1 text-[12px] text-[#777]">{item.time}</Text>
      </View>

      {/* Unread indicator */}
      {item.unread && <View className="h-2.5 w-2.5 rounded-full bg-[#0879D1]" />}
    </Pressable>
  );
}

export default function Notification() {
  return (
    <View className="flex-1">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
          <Text className="text-3xl font-bold text-[#111]">Thông báo</Text>

          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F2F2]">
            <Ionicons name="settings-outline" size={22} color="#222" />
          </Pressable>
        </View>

        {/* Notification list */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          {/* Section */}
          <View className="px-4 pt-1 pb-2">
            <Text className="text-[17px] font-bold text-[#111]">Mới</Text>
          </View>

          {notifications.map((item) => (
            <NotificationItemRow key={item.id} item={item} />
          ))}

          {/* Older section */}
          <View className="px-4 pt-6 pb-2">
            <Text className="text-[17px] font-bold text-[#111]">Trước đó</Text>
          </View>

          <NotificationItemRow
            item={{
              ...notifications[4],
              id: 'old-1',
              unread: false,
              time: '2 ngày',
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
}
