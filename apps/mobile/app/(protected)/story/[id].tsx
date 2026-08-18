import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_STORIES_DATA: Record<
  string,
  {
    id: string;
    name: string;
    avatar: string;
    storyImage: string;
    time?: string;
    hasUnread?: boolean;
  }
> = {
  self_story: {
    id: 'self_story',
    name: 'Tin của bạn',
    avatar: 'https://picsum.photos/id/64/200/200',
    storyImage: 'https://picsum.photos/id/1062/400/700',
    time: '2 giờ',
  },
  story_1: {
    id: 'story_1',
    name: 'Minh Thảo',
    avatar: 'https://picsum.photos/id/1027/200/200',
    storyImage: 'https://picsum.photos/id/1015/400/700',
    time: '4 giờ',
  },
  story_2: {
    id: 'story_2',
    name: 'Tuấn Anh',
    avatar: 'https://picsum.photos/id/1005/200/200',
    storyImage: 'https://picsum.photos/id/1025/400/700',
    time: '5 giờ',
  },
  story_3: {
    id: 'story_3',
    name: 'Phương Linh',
    avatar: 'https://picsum.photos/id/338/200/200',
    storyImage: 'https://picsum.photos/id/1039/400/700',
    hasUnread: false,
  },
  story_4: {
    id: 'story_4',
    name: 'Đức Huy',
    avatar: 'https://picsum.photos/id/1074/200/200',
    storyImage: 'https://picsum.photos/id/1043/400/700',
    time: '12 giờ',
  },
};

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const storyId = id || 'story_1';
  const story = MOCK_STORIES_DATA[storyId] || MOCK_STORIES_DATA.story_1;

  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(timer);
          router.back();
          return 1;
        }
        return prev + 0.02;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: story.storyImage }}
        className="flex-1 justify-between"
        resizeMode="cover"
      >
        {/* Dark Overlays for Top & Bottom Gradient Effect */}
        <View className="absolute top-0 right-0 left-0 h-32 bg-black/40" />
        <View className="absolute right-0 bottom-0 left-0 h-40 bg-black/50" />

        {/* Top Section */}
        <SafeAreaView className="pt-2">
          {/* Progress Bar */}
          <View className="flex-row gap-1 px-3">
            <View className="overflow-hidden flex-1 h-1 rounded-full bg-white/40">
              <View
                style={{ width: `${progress * 100}%` }}
                className="h-full bg-white rounded-full"
              />
            </View>
          </View>

          {/* Header Info */}
          <View className="flex-row justify-between items-center px-3 pt-3">
            <View className="flex-row items-center gap-2.5">
              <Image
                source={{ uri: story.avatar }}
                className="w-9 h-9 rounded-full border border-white/50"
              />
              <View>
                <Text className="text-sm font-semibold text-white drop-shadow">{story.name}</Text>
                <Text className="text-xs text-white/80">{story.time}</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.back()}
              className="justify-center items-center w-9 h-9 rounded-full bg-black/30 active:opacity-70"
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Bottom Reaction & Reply Bar */}
        <SafeAreaView className="px-3 pb-4">
          <View className="flex-row gap-2 items-center">
            <View className="flex-1 flex-row items-center bg-white/20 border border-white/30 rounded-full px-4 py-2.5">
              <TextInput
                placeholder="Gửi tin nhắn..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={commentText}
                onChangeText={setCommentText}
                className="flex-1 p-0 text-sm text-white"
              />
            </View>

            {/* Quick Reactions */}
            <Pressable className="justify-center items-center w-10 h-10 rounded-full bg-white/20 active:opacity-70">
              <Text className="text-xl">❤️</Text>
            </Pressable>
            <Pressable className="justify-center items-center w-10 h-10 rounded-full bg-white/20 active:opacity-70">
              <Text className="text-xl">😆</Text>
            </Pressable>
            <Pressable className="justify-center items-center w-10 h-10 rounded-full bg-white/20 active:opacity-70">
              <Text className="text-xl">😮</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
