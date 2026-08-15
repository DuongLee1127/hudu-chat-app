import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import UnreadBadge from '@/components/UnreadBadge';

type Chat = {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  unread?: number;
  typing?: boolean;
  read?: boolean;
};

export default function ChatItem({ item }: { item: Chat }) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: item.id,
      },
    });
  };

  return (
    <Pressable
      className="flex-row px-2 rounded-xl py-3.5 active:bg-[#F5F6F8]"
      android_ripple={{ color: '#F5F6F8' }}
      onPress={handlePress}
    >
      {/* Avatar */}
      <Image source={{ uri: item.avatar }} className="h-[50px] w-[50px] rounded-full" />

      {/* Message */}
      <View className="justify-center flex-1 ml-3">
        <Text numberOfLines={1} className="text-[14px] font-semibold text-[#171717]">
          {item.name}
        </Text>

        <View className="flex-row items-center mt-1">
          {item.read && (
            <Ionicons name="checkmark-done" size={15} color="#0879D1" style={{ marginRight: 3 }} />
          )}

          {!item.read && !item.typing && (
            <Ionicons name="checkmark" size={14} color="#C7C7C7" style={{ marginRight: 3 }} />
          )}

          <Text
            numberOfLines={1}
            className={`flex-1 text-[12px] ${item.typing ? 'text-[#0879D1]' : 'text-[#444]'}`}
          >
            {item.message}
          </Text>
        </View>
      </View>

      {/* Right */}
      <View className="ml-2 min-w-[38px] items-end">
        <Text className="text-[10px] text-[#999]">{item.time}</Text>

        {item.unread ? <UnreadBadge count={item.unread} /> : null}
      </View>
    </Pressable>
  );
}
