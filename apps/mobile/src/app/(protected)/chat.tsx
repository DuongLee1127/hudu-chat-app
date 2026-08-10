import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const conversations = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    message: 'Tối nay đi cafe không?',
    time: '10:30',
    unread: 2,
    online: true,
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: '2',
    name: 'Lại Thương',
    message: 'Ok, để mình xem lại nhé!',
    time: '09:45',
    unread: 0,
    online: true,
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: '3',
    name: 'Team Hudu',
    message: 'Huyên: Đã deploy xong BE',
    time: '08:30',
    unread: 5,
    online: false,
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: '4',
    name: 'Trần Minh',
    message: 'Bạn gửi mình tài liệu nhé',
    time: 'Hôm qua',
    unread: 0,
    online: false,
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: '5',
    name: 'Nguyễn Hà',
    message: 'Cảm ơn bạn nhiều ❤️',
    time: 'Hôm qua',
    unread: 0,
    online: true,
    avatar: 'https://i.pravatar.cc/150?img=25',
  },
];

type Conversation = (typeof conversations)[number];

function ConversationItem({ item }: { item: Conversation }) {
  return (
    <Pressable
      onPress={() => {
        // Sau này:
        // router.push(`/chat/${item.id}`);

        console.log('Open conversation:', item.id);
      }}
      className="flex-row items-center border-b border-slate-100 py-3 active:opacity-60"
    >
      {/* Avatar */}
      <View className="relative mr-3.5">
        <Image
          source={{ uri: item.avatar }}
          className="h-14 w-14 rounded-[18px]"
          contentFit="cover"
        />

        {item.online && (
          <View className="absolute bottom-[-1px] right-[-1px] h-[15px] w-[15px] rounded-full border-[3px] border-slate-50 bg-green-500" />
        )}
      </View>

      {/* Content */}
      <View className="min-w-0 flex-1">
        {/* Name + time */}
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className={`mr-2 flex-1 text-[15px] ${
              item.unread > 0 ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
            }`}
          >
            {item.name}
          </Text>

          <Text
            className={`text-[11px] ${
              item.unread > 0 ? 'font-bold text-indigo-500' : 'text-slate-400'
            }`}
          >
            {item.time}
          </Text>
        </View>

        {/* Message + unread */}
        <View className="mt-1.5 flex-row items-center">
          <Text
            numberOfLines={1}
            className={`mr-2 flex-1 text-[13px] ${
              item.unread > 0 ? 'font-semibold text-slate-600' : 'text-slate-400'
            }`}
          >
            {item.message}
          </Text>

          {item.unread > 0 && (
            <View className="min-w-5 h-5 items-center justify-center rounded-full bg-indigo-500 px-1">
              <Text className="text-[10px] font-extrabold text-white">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-5 pt-3">
        <View>
          <Text className="mb-1 text-sm text-slate-500">Xin chào 👋</Text>

          <Text className="text-[30px] font-extrabold tracking-[-0.7px] text-slate-900">
            Tin nhắn
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Add */}
          <Pressable className="h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-slate-200 bg-white active:bg-slate-100">
            <Ionicons name="add" size={24} color="#0F172A" />
          </Pressable>

          {/* Profile */}
          <Pressable className="relative">
            <Image
              source={{
                uri: 'https://i.pravatar.cc/150?img=68',
              }}
              className="h-11 w-11 rounded-[15px]"
              contentFit="cover"
            />

            <View className="absolute bottom-[-1px] right-[-1px] h-[13px] w-[13px] rounded-full border-2 border-slate-50 bg-green-500" />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View className="mx-5 h-[52px] flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
        <Ionicons name="search-outline" size={20} color="#94A3B8" />

        <TextInput
          placeholder="Tìm kiếm cuộc trò chuyện..."
          placeholderTextColor="#94A3B8"
          className="mx-2.5 flex-1 text-sm text-slate-900"
        />

        <Pressable>
          <Ionicons name="options-outline" size={20} color="#6366F1" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="mt-5 flex-row gap-2 px-5 pb-2">
        {/* Active */}
        <Pressable className="rounded-xl bg-indigo-50 px-4 py-2">
          <Text className="text-[13px] font-bold text-indigo-500">Tất cả</Text>
        </Pressable>

        {/* Tab */}
        <Pressable className="rounded-xl px-4 py-2">
          <Text className="text-[13px] font-semibold text-slate-400">Chưa đọc</Text>
        </Pressable>

        {/* Tab */}
        <Pressable className="rounded-xl px-4 py-2">
          <Text className="text-[13px] font-semibold text-slate-400">Nhóm</Text>
        </Pressable>
      </View>

      {/* Conversation list */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationItem item={item} />}
        showsVerticalScrollIndicator={false}
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 110,
        }}
      />

      {/* Bottom Navigation */}
      <View className="absolute bottom-2.5 left-3 right-3 h-[72px] flex-row items-center justify-around rounded-[24px] border border-slate-100 bg-white">
        {/* Chats */}
        <Pressable className="min-w-[60px] items-center justify-center gap-1">
          <Ionicons name="chatbubbles" size={24} color="#6366F1" />

          <Text className="text-[10px] font-bold text-indigo-500">Chats</Text>
        </Pressable>

        {/* Contacts */}
        <Pressable className="min-w-[60px] items-center justify-center gap-1">
          <Ionicons name="people-outline" size={24} color="#94A3B8" />

          <Text className="text-[10px] font-semibold text-slate-400">Contacts</Text>
        </Pressable>

        {/* Calls */}
        <Pressable className="min-w-[60px] items-center justify-center gap-1">
          <Ionicons name="call-outline" size={24} color="#94A3B8" />

          <Text className="text-[10px] font-semibold text-slate-400">Calls</Text>
        </Pressable>

        {/* Profile */}
        <Pressable className="min-w-[60px] items-center justify-center gap-1">
          <Ionicons name="person-outline" size={24} color="#94A3B8" />

          <Text className="text-[10px] font-semibold text-slate-400">Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
