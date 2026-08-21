import React, { useEffect, useState } from 'react';
import { Image, Pressable, StatusBar, Text, View, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserStories } from '@/hooks/useStory';
import { buildAttachmentUrl } from '@/utils/url';

export default function StoryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const userId = id || '';

  const { data, isLoading } = useUserStories(userId);
  const stories = data?.data?.stories ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!stories.length) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
          } else {
            router.back();
          }
          return 1;
        }
        return prev + 0.02;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, stories.length, router]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1 justify-center items-center p-2 bg-black sm:p-4"
      >
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  if (!stories.length) {
    return (
      <View
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1 justify-center items-center px-6 bg-black"
      >
        <Text className="mb-4 text-base text-white">Không tìm thấy tin nào!</Text>
        <Pressable onPress={() => router.back()} className="bg-white/20 px-6 py-2.5 rounded-full">
          <Text className="font-bold text-white">Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const rawUrl =
    typeof currentStory?.attachmentId === 'object' ? currentStory.attachmentId?.url : undefined;
  const imageUrl = buildAttachmentUrl(rawUrl);

  const authorName =
    typeof currentStory?.userId === 'object'
      ? (currentStory.userId as any)?.username || 'Thành viên'
      : 'Tin mới';

  const formattedDate = currentStory?.createdAt
    ? new Date(currentStory.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Hôm nay';

  const viewerCount = currentStory?.viewerIds?.length ?? 0;

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 p-2 bg-black sm:p-4"
    >
      <StatusBar barStyle="light-content" />

      {/* Floating Story Card with Safe Display Area */}
      <View className="flex-1 rounded-[32px] overflow-hidden bg-black relative">
        {/* Story Background Image - Safe Contained Preview */}
        {imageUrl ? (
          <View className="flex-1 justify-center items-center pt-16 pb-32 w-full h-full bg-black">
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="absolute inset-0 bg-[#222] justify-center items-center">
            <Ionicons name="image-outline" size={48} color="#666" />
          </View>
        )}

        {/* Top Controls Bar with Gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.3)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}
          className="px-4 pt-3 pb-8"
        >
          {/* Progress Bars */}
          <View className="flex-row gap-1 mb-3">
            {stories.map((s, idx) => (
              <View key={s._id} className="overflow-hidden flex-1 h-1 rounded-full bg-white/30">
                <View
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                          ? `${progress * 100}%`
                          : '0%',
                  }}
                  className="h-full bg-white rounded-full"
                />
              </View>
            ))}
          </View>

          {/* Action Buttons: Close (Left), Download & More (Right) */}
          <View className="flex-row justify-between items-center">
            {/* Close Button */}
            <Pressable
              onPress={() => router.back()}
              className="justify-center items-center w-10 h-10 rounded-full border bg-black/40 active:opacity-80 border-white/10"
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </Pressable>

            {/* Right Action Icons */}
            <View className="flex-row items-center gap-2.5">
              <Pressable className="justify-center items-center w-10 h-10 rounded-full border bg-black/40 active:opacity-80 border-white/10">
                <Ionicons name="download-outline" size={22} color="#FFF" />
              </Pressable>
              <Pressable className="justify-center items-center w-10 h-10 rounded-full border bg-black/40 active:opacity-80 border-white/10">
                <Ionicons name="ellipsis-horizontal" size={22} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* Touch zones for Left / Right Navigation */}
        <View className="absolute inset-0 z-10 flex-row pointer-events-box-none">
          <Pressable className="w-1/3 h-full" onPress={handlePrev} />
          <Pressable className="w-2/3 h-full" onPress={handleNext} />
        </View>

        {/* Bottom Content Overlay with Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }}
          className="px-5 pt-8 pb-6 pointer-events-none"
        >
          <View className="gap-1 mb-3">
            <Text className="text-base font-bold text-white drop-shadow-md">{authorName}</Text>
            {currentStory?.caption ? (
              <Text className="text-base font-medium text-white drop-shadow-md">
                {currentStory.caption}
              </Text>
            ) : null}
            <Text className="text-white/70 text-sm mt-0.5">{formattedDate}</Text>
          </View>

          {/* Reaction / Viewer Counter Pill */}
          <View className="flex-row">
            <View className="flex-row gap-2 items-center px-4 py-2 rounded-full border bg-black/50 border-white/15">
              <Text className="text-lg">❤️</Text>
              <Text className="text-sm font-semibold text-white">
                {viewerCount > 0 ? viewerCount : 12}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
