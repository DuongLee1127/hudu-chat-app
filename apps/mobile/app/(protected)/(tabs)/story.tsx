import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, FlatList, Image, ImageBackground, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_SPACING = 12;
const CARD_WIDTH = (width - 24 - COLUMN_SPACING) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

interface StoryData {
  id: string;
  isCreateCard?: boolean;
  isSelf?: boolean;
  name: string;
  avatar: string;
  storyImage?: string;
  hasUnread?: boolean;
}

const MOCK_STORIES: StoryData[] = [
  {
    id: 'create_story',
    isCreateCard: true,
    name: 'Tạo tin',
    avatar: 'https://picsum.photos/id/64/200/200',
  },
  {
    id: 'self_story',
    isSelf: true,
    name: 'Tin của bạn',
    avatar: 'https://picsum.photos/id/64/200/200',
    storyImage: 'https://picsum.photos/id/1062/400/700',
    hasUnread: false,
  },
  {
    id: 'story_1',
    name: 'Minh Thảo',
    avatar: 'https://picsum.photos/id/1027/200/200',
    storyImage: 'https://picsum.photos/id/1015/400/700',
    hasUnread: true,
  },
  {
    id: 'story_2',
    name: 'Tuấn Anh',
    avatar: 'https://picsum.photos/id/1005/200/200',
    storyImage: 'https://picsum.photos/id/1025/400/700',
    hasUnread: true,
  },
  {
    id: 'story_3',
    name: 'Phương Linh',
    avatar: 'https://picsum.photos/id/338/200/200',
    storyImage: 'https://picsum.photos/id/1039/400/700',
    hasUnread: false,
  },
  {
    id: 'story_4',
    name: 'Đức Huy',
    avatar: 'https://picsum.photos/id/1074/200/200',
    storyImage: 'https://picsum.photos/id/1043/400/700',
    hasUnread: false,
  },
];

export default function StoryScreen() {
  const router = useRouter();

  const handlePressStory = (item: StoryData) => {
    if (item.isCreateCard) return;
    router.push(`/story/${item.id}` as any);
  };

  const renderItem = ({ item, index }: { item: StoryData; index: number }) => {
    const isEven = index % 2 === 0;

    if (item.isCreateCard) {
      return (
        <View
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          className={`mb-3 overflow-hidden rounded-2xl bg-[#F0F2F5] ${
            isEven ? 'mr-1.5' : 'ml-1.5'
          }`}
        >
          <Pressable className="flex-1 active:opacity-90">
            <View className="h-[68%] w-full bg-[#E4E6EB]">
              <Image source={{ uri: item.avatar }} className="w-full h-full opacity-90" />
            </View>
            <View className="flex-1 justify-end items-center px-2 pt-4 pb-3 bg-white">
              <Text numberOfLines={2} className="text-center text-[13px] font-semibold text-black">
                Tạo tin
              </Text>
            </View>
            {/* Plus Icon Badge */}
            <View className="absolute top-[68%] left-1/2 -ml-4 -mt-4 h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#0084FF]">
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        className={`mb-3 overflow-hidden rounded-2xl bg-[#242526] ${isEven ? 'mr-1.5' : 'ml-1.5'}`}
      >
        <Pressable className="flex-1 active:opacity-90" onPress={() => handlePressStory(item)}>
          <ImageBackground
            source={{ uri: item.storyImage }}
            className="flex-1 justify-between p-3"
            imageStyle={{ borderRadius: 16 }}
          >
            {/* Dark Overlay for better contrast */}
            <View className="absolute inset-0 rounded-2xl bg-black/20" />

            {/* Avatar at Top-Left */}
            <View className="z-10">
              <View
                className={`h-10 w-10 items-center justify-center rounded-full p-[2px] ${
                  item.hasUnread
                    ? 'border-2 border-[#0084FF] bg-white'
                    : 'border-2 border-gray-400/60 bg-transparent'
                }`}
              >
                <Image source={{ uri: item.avatar }} className="w-full h-full rounded-full" />
              </View>
            </View>

            {/* Name at Bottom-Left */}
            <View className="z-10">
              <Text numberOfLines={2} className="text-[13px] font-semibold text-white shadow-sm">
                {item.name}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between px-4 pt-2 pb-4">
          <Text className="text-3xl font-bold text-black">Tin</Text>
        </View>

        {/* Story List */}
        <FlatList
          data={MOCK_STORIES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
