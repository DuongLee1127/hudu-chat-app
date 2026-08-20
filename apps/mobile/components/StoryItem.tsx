import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StoryItemProps {
  isAddStory?: boolean;
  name: string;
  avatar?: string;
  hasUnread?: boolean;
  onPress: () => void;
}

export default function StoryItem({
  isAddStory = false,
  name,
  avatar,
  hasUnread = false,
  onPress,
}: StoryItemProps) {
  if (isAddStory) {
    return (
      <Pressable onPress={onPress} className="items-center mr-3.5 active:opacity-80">
        <View className="relative h-[66px] w-[66px] items-center justify-center">
          {avatar ? (
            <Image source={{ uri: avatar }} className="h-[60px] w-[60px] rounded-full opacity-90" />
          ) : (
            <View className="h-[60px] w-[60px] rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="person" size={28} color="#9CA3AF" />
            </View>
          )}
          {/* Blue "+" Badge at Bottom Right */}
          <View className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#0084FF]">
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
        </View>
        <Text
          numberOfLines={1}
          className="mt-1.5 max-w-[68px] text-center text-[12px] font-medium text-gray-800"
        >
          Tạo tin
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="items-center mr-3.5 active:opacity-80">
      <View
        className={`h-[66px] w-[66px] items-center justify-center rounded-full p-[2px] ${
          hasUnread ? 'border-2 border-[#0084FF]' : 'border-2 border-gray-300'
        }`}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />
        ) : (
          <View className="h-full w-full rounded-full bg-[#7B5CFA] items-center justify-center">
            <Text className="text-lg font-bold text-white">{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        className="mt-1.5 max-w-[68px] text-center text-[12px] font-medium text-gray-800"
      >
        {name}
      </Text>
    </Pressable>
  );
}
