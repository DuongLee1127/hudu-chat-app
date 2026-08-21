import React from 'react';
import { View, Text, Pressable, Image, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/useAuth';
import ScreenWrapper from '@/providers/ScreenWrapper';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  isDestructive?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}

function MenuItemRow({
  icon,
  title,
  subtitle,
  isDestructive,
  onPress,
  isLast = false,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      className={`flex-row items-center px-4 py-3.5 active:bg-gray-50/80 ${
        !isLast ? 'border-b border-gray-100/70' : ''
      }`}
    >
      {/* Icon container - Purple tinted circle */}
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3.5 ${
          isDestructive ? 'bg-red-50' : 'bg-[#7B5CFA]/10'
        }`}
      >
        <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : '#7B5CFA'} />
      </View>

      {/* Title & Subtitle */}
      <View className="flex-1 justify-center">
        <Text
          className={`text-[15px] font-semibold ${
            isDestructive ? 'text-red-500' : 'text-[#1F2937]'
          }`}
        >
          {title}
        </Text>
        {Boolean(subtitle) && (
          <Text className="text-[13px] text-gray-400 font-normal mt-0.5">{subtitle}</Text>
        )}
      </View>

      {/* Right chevron arrow */}
      {!isDestructive && <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />}
    </Pressable>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logoutMutation.mutate(undefined, {
            onSuccess: () => {
              logout();
              router.replace('/(auth)/welcome');
            },
            onError: () => {
              logout();
              router.replace('/(auth)/welcome');
            },
          });
        },
      },
    ]);
  };

  const username = user?.username || 'Người dùng HuduChat';
  const email = user?.email || 'user@example.com';
  const initial = username.charAt(0).toUpperCase();

  return (
    <ScreenWrapper className="bg-[#F4F5FB]">
      <View className="flex-1 bg-[#F4F5FB]" style={{ paddingBottom: insets.bottom }}>
        <StatusBar style="dark" />

        {/* Top Header */}
        <View className="flex-row justify-between items-center px-4 pt-3 pb-3">
          <Text className="text-3xl font-bold text-[#111827]">Menu</Text>

          {/* <View className="flex-row gap-2">
            <Pressable className="justify-center items-center w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm active:bg-gray-100">
              <Ionicons name="qr-code-outline" size={20} color="#111827" />
            </Pressable>
            <Pressable className="justify-center items-center w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm active:bg-gray-100">
              <Ionicons name="search-outline" size={20} color="#111827" />
            </Pressable>
          </View> */}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }}
        >
          {/* User Card Header */}
          <View className="flex-row items-center p-4 mb-6 bg-white rounded-2xl">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-14 h-14 bg-gray-200 rounded-full" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-[#7B5CFA] items-center justify-center shadow-sm">
                <Text className="text-2xl font-bold text-white">{initial}</Text>
              </View>
            )}

            <View className="flex-1 ml-3.5 justify-center">
              <Text className="text-lg font-bold text-[#111827]">{username}</Text>
              <Text className="text-sm text-gray-400 mt-0.5">{email}</Text>
            </View>
          </View>

          {/* Group 1: Tài khoản & Cài đặt chính */}
          <View className="overflow-hidden mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MenuItemRow icon="person-outline" title="Tài khoản" />
            <MenuItemRow icon="lock-closed-outline" title="Quyền riêng tư" />
            <MenuItemRow icon="notifications-outline" title="Thông báo" />
            <MenuItemRow icon="color-palette-outline" title="Giao diện" isLast />
          </View>

          {/* Group 2: Ngôn ngữ & Hỗ trợ */}
          <View className="overflow-hidden mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MenuItemRow icon="language-outline" title="Ngôn ngữ" subtitle="Tiếng Việt" />
            <MenuItemRow icon="help-circle-outline" title="Trợ giúp & hỗ trợ" />
            <MenuItemRow
              icon="information-circle-outline"
              title="Giới thiệu HuduChat"
              subtitle="Phiên bản 1.0.0"
              isLast
            />
          </View>

          {/* Group 3: Đăng xuất */}
          <View className="overflow-hidden mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MenuItemRow
              icon="log-out-outline"
              title="Đăng xuất"
              isDestructive
              onPress={handleLogout}
              isLast
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
