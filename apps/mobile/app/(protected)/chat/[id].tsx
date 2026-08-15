import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const chatUser = {
  name: 'Lesti Kejora',
  avatar: 'https://i.pravatar.cc/150?img=47',
  online: true,
};

const messages = [
  {
    id: '1',
    type: 'text',
    sender: 'other',
    text: "Let's go on vacation. I have exciting vacation plans!",
    time: '09:40',
  },
  {
    id: '2',
    type: 'text',
    sender: 'me',
    text: "Let's go on vacation, what's the plan?",
    time: '09:41',
  },
  {
    id: '3',
    type: 'gallery',
    sender: 'other',
    time: '09:42',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500',
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500',
    ],
    text: 'I have a vacation plan in Labuan Bajo for next week',
  },
  {
    id: '4',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '5',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '6',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '7',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '8',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '9',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
  {
    id: '10',
    type: 'text',
    sender: 'me',
    text: 'Wow look amazing 😍',
    time: '09:44',
  },
];

function MessageText({
  message,
}: {
  message: {
    sender: string;
    text?: string;
  };
}) {
  const isMe = message.sender === 'me';

  return (
    <View className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isMe ? 'rounded-br-md bg-[#0879D1]' : 'rounded-bl-md bg-[#EEF0F2]'
        }`}
      >
        <Text className={`text-[13px] leading-5 ${isMe ? 'text-white' : 'text-[#222]'}`}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function GalleryMessage({
  message,
}: {
  message: {
    sender: string;
    images?: string[];
    text?: string;
  };
}) {
  const isMe = message.sender === 'me';
  const images = message.images ?? [];

  return (
    <View className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
      <View className="overflow-hidden rounded-2xl rounded-bl-md bg-[#EEF0F2] p-3">
        {/* Image grid */}
        <View className="h-[180px] w-[220px] overflow-hidden rounded-xl">
          <View className="flex-row flex-1">
            <Image source={{ uri: images[0] }} className="flex-1 h-full" resizeMode="cover" />

            <Image
              source={{ uri: images[1] }}
              className="ml-[1px] h-full flex-1"
              resizeMode="cover"
            />
          </View>

          <View className="mt-[1px] flex-1 flex-row">
            <Image source={{ uri: images[2] }} className="flex-1 h-full" resizeMode="cover" />

            <View className="ml-[1px] flex-1">
              <Image source={{ uri: images[3] }} className="w-full h-full" resizeMode="cover" />

              {/* +10 overlay */}
              <View className="absolute inset-0 items-center justify-center bg-black/20">
                <Text className="text-xl font-medium text-white">10+</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Caption */}
        <Text className="mt-3 max-w-[210px] text-[13px] leading-5 text-[#333]">{message.text}</Text>
      </View>
    </View>
  );
}

function ChatMessage({ message }: { message: (typeof messages)[number] }) {
  const isMe = message.sender === 'me';

  return (
    <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
      {/* Other person's avatar */}
      {!isMe && (
        <Image source={{ uri: chatUser.avatar }} className="w-6 h-6 mt-auto mr-2 rounded-full" />
      )}

      {message.type === 'gallery' ? (
        <GalleryMessage message={message} />
      ) : (
        <MessageText message={message} />
      )}
    </View>
  );
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  console.log('Chat ID:', id);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ================= HEADER ================= */}
      <View
        className="border-b border-[#EEEEEE] bg-white px-5 pb-3"
        style={{
          paddingTop: Math.max(insets.top, 12),
        }}
      >
        <View className="h-[55px] flex-row items-center">
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center w-8 h-10 mr-3"
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={27} color="#222" />
          </Pressable>

          {/* Avatar */}
          <Image source={{ uri: chatUser.avatar }} className="rounded-full h-11 w-11" />

          {/* User info */}
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-semibold text-[#171717]">{chatUser.name}</Text>

            <View className="mt-0.5 flex-row items-center">
              <View className="mr-1 h-1.5 w-1.5 rounded-full bg-[#57C95B]" />

              <Text className="text-[11px] text-[#57B957]">Online</Text>
            </View>
          </View>

          {/* Video */}
          <Pressable className="items-center justify-center w-8 h-10 mr-4" hitSlop={8}>
            <Ionicons name="videocam-outline" size={22} color="#222" />
          </Pressable>

          {/* Call */}
          <Pressable className="items-center justify-center w-8 h-10" hitSlop={8}>
            <Ionicons name="call-outline" size={22} color="#222" />
          </Pressable>
        </View>
      </View>

      {/* ================= MESSAGES ================= */}
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 15,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </ScrollView>

      {/* ================= MESSAGE INPUT ================= */}
      <View
        className="px-4 pt-2 bg-white"
        style={{
          paddingBottom: Math.max(insets.bottom, 10),
        }}
      >
        <View className="h-[60px] flex-row items-center rounded-full bg-[#F2F4F7] px-2">
          {/* Emoji */}
          <Pressable className="items-center justify-center w-10 h-10">
            <Ionicons name="happy-outline" size={23} color="#777" />
          </Pressable>

          {/* Divider */}
          <View className="mx-1 h-6 w-[1px] bg-[#DADDE2]" />

          {/* Input */}
          <TextInput
            className="flex-1 px-2 text-[13px] text-[#222]"
            placeholder="Type something..."
            placeholderTextColor="#A7ADB7"
            textAlignVertical="center"
            multiline
          />

          {/* Mic */}
          <Pressable className="items-center justify-center w-10 h-10">
            <Ionicons name="mic-outline" size={22} color="#777" />
          </Pressable>

          {/* Send */}
          <Pressable className="h-[44px] w-[44px] items-center justify-center rounded-full bg-[#0879D1]">
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
