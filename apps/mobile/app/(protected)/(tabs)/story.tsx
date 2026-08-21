import React, { useState, useMemo } from 'react';
import { Dimensions, FlatList, Image, ImageBackground, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import ScreenWrapper from '@/providers/ScreenWrapper';
import CreateStoryModal from '@/components/CreateStoryModal';
import { useStoryFeed } from '@/hooks/useStory';
import { useAuthStore } from '@/stores/auth';
import { buildAttachmentUrl } from '@/utils/url';

const { width } = Dimensions.get('window');
const COLUMN_SPACING = 12;
const CARD_WIDTH = (width - 24 - COLUMN_SPACING) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

interface StoryCardItem {
  id: string;
  isCreateCard?: boolean;
  userId?: string;
  name: string;
  avatar?: string;
  storyImage?: string;
  hasUnread?: boolean;
}

export default function StoryScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const { data: feedData } = useStoryFeed();
  const storyFeed = feedData?.data?.feed ?? [];

  const cards = useMemo(() => {
    const list: StoryCardItem[] = [
      {
        id: 'create_story_card',
        isCreateCard: true,
        name: 'Tạo tin',
        avatar: currentUser?.avatar,
      },
    ];

    const currentUsername = currentUser?.username;

    // Find user's own story group
    const myGroup = storyFeed.find(
      (group) => currentUsername && group.user?.username === currentUsername,
    );
    if (myGroup) {
      const firstStoryAttachment = myGroup.stories[0]?.attachmentId;
      const rawUrl =
        typeof firstStoryAttachment === 'object' ? firstStoryAttachment?.url : undefined;
      const imageUrl = buildAttachmentUrl(rawUrl);

      list.push({
        id: `user_${myGroup.userId}`,
        userId: myGroup.userId,
        name: 'Tin của bạn',
        avatar: myGroup.user?.avatar || currentUser?.avatar,
        storyImage: imageUrl,
        hasUnread: myGroup.hasUnviewed,
      });
    }

    // Add friends' story groups
    storyFeed.forEach((group) => {
      if (currentUsername && group.user?.username === currentUsername) return;

      const firstStoryAttachment = group.stories[0]?.attachmentId;
      const rawUrl =
        typeof firstStoryAttachment === 'object' ? firstStoryAttachment?.url : undefined;
      const imageUrl = buildAttachmentUrl(rawUrl);

      list.push({
        id: `user_${group.userId}`,
        userId: group.userId,
        name: group.user?.username || 'Bạn bè',
        avatar: group.user?.avatar || '',
        storyImage: imageUrl,
        hasUnread: group.hasUnviewed,
      });
    });

    return list;
  }, [storyFeed, currentUser?.username, currentUser?.avatar]);

  const handlePressCard = (item: StoryCardItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (item.isCreateCard) {
      setIsCreateStoryOpen(true);
      return;
    }

    if (item.userId) {
      router.push(`/story/${item.userId}` as any);
    }
  };

  const renderItem = ({ item, index }: { item: StoryCardItem; index: number }) => {
    const isEven = index % 2 === 0;

    if (item.isCreateCard) {
      return (
        <View
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          className={`mb-3 overflow-hidden rounded-2xl bg-[#F0F2F5] ${
            isEven ? 'mr-1.5' : 'ml-1.5'
          }`}
        >
          <Pressable onPress={() => handlePressCard(item)} className="flex-1 active:opacity-90">
            <View className="h-[68%] w-full bg-[#E4E6EB]">
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} className="w-full h-full opacity-90" />
              ) : (
                <View className="justify-center items-center w-full h-full bg-gray-200">
                  <Ionicons name="person" size={36} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1 justify-end items-center px-2 pt-4 pb-3 bg-white">
              <Text numberOfLines={2} className="text-center text-[16px]  text-black">
                Tạo tin
              </Text>
            </View>
            {/* Plus Icon Badge */}
            <View className="absolute top-[68%] left-1/2 -ml-7 -mt-7 h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#0084FF]">
              <Ionicons name="add" size={24} color="#FFFFFF" />
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
        <Pressable className="flex-1 active:opacity-90" onPress={() => handlePressCard(item)}>
          {item.storyImage ? (
            <ImageBackground
              source={{ uri: item.storyImage }}
              className="flex-1 justify-between p-3"
              imageStyle={{ borderRadius: 16 }}
            >
              <View className="absolute inset-0 rounded-2xl bg-black/25" />

              <View className="z-10">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full p-[2px] ${
                    item.hasUnread
                      ? 'border-2 border-[#0084FF] bg-white'
                      : 'border-2 border-gray-400/60 bg-transparent'
                  }`}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} className="w-full h-full rounded-full" />
                  ) : (
                    <View className="w-full h-full rounded-full bg-[#7B5CFA] items-center justify-center">
                      <Text className="text-sm font-bold text-white">
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="z-10">
                <Text numberOfLines={2} className="text-[16px] text-white shadow-sm">
                  {item.name}
                </Text>
              </View>
            </ImageBackground>
          ) : (
            <View className="flex-1 justify-between p-3 bg-gradient-to-b from-[#7B5CFA] to-[#6344F5] rounded-2xl">
              <View className="z-10">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full p-[2px] ${
                    item.hasUnread ? 'border-2 border-white' : 'border border-white/50'
                  }`}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} className="w-full h-full rounded-full" />
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              <View className="z-10">
                <Text numberOfLines={2} className="text-[16px] text-white">
                  {item.name}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenWrapper className="bg-white">
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between px-4 pt-2 pb-4">
          <Text className="text-3xl font-bold text-black">Tin</Text>
        </View>

        {/* Story Grid List */}
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Shared Create Story Modal */}
      <CreateStoryModal visible={isCreateStoryOpen} onClose={() => setIsCreateStoryOpen(false)} />
    </ScreenWrapper>
  );
}
