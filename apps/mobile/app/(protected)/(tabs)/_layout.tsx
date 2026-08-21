import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth';

const BUBBLE_SIZE = 60;

const TABS = [
  { name: 'index', label: 'Chat', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
  { name: 'story', label: 'Story', icon: 'play-circle', iconOutline: 'play-circle-outline' },
  {
    name: 'notification',
    label: 'Noti',
    icon: 'notifications',
    iconOutline: 'notifications-outline',
  },
  {
    name: 'menu',
    label: 'Menu',
    icon: 'menu',
    iconOutline: 'menu-outline',
  },
] as const;

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

  const bubbleX = useSharedValue(0);
  const bubbleScale = useSharedValue(1);
  const bubbleOpacity = useSharedValue(0);

  const activeRouteName = state.routes[state.index]?.name;

  useEffect(() => {
    const layout = tabLayouts[activeRouteName];
    if (!layout) return;

    const centerX = layout.x + layout.width / 2 - BUBBLE_SIZE / 2;

    bubbleX.value = withSpring(centerX, { damping: 18, stiffness: 180, mass: 0.7 });
    bubbleOpacity.value = withSpring(1);
    bubbleScale.value = 0.7;
    bubbleScale.value = withSpring(1, { damping: 10, stiffness: 220 });
  }, [activeRouteName, tabLayouts]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ translateX: bubbleX.value }, { scale: bubbleScale.value }],
  }));

  // Đo layout của tab NGAY TRONG hàng flex chứa cả bubble
  // -> cùng hệ quy chiếu tọa độ, tránh lệch vị trí bubble.
  const handleLayout = (name: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const existing = prev[name];
      if (existing && existing.x === x && existing.width === width) return prev;
      return { ...prev, [name]: { x, width } };
    });
  };

  const renderTab = (tab: (typeof TABS)[number]) => {
    const index = state.routes.findIndex((route: any) => route.name === tab.name);
    if (index === -1) return null;
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[index].key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        Haptics.selectionAsync().catch(() => {});
        navigation.navigate(tab.name);
      }
    };

    return (
      <Pressable
        key={tab.name}
        onPress={onPress}
        onLayout={handleLayout(tab.name)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={tab.label}
        hitSlop={8}
        className="flex-1 justify-center items-center py-2"
      >
        <Ionicons
          name={(isFocused ? tab.icon : tab.iconOutline) as any}
          size={24}
          color={isFocused ? '#8c5bf6' : '#9CA3AF'}
        />
        <Text
          numberOfLines={1}
          className={`mt-1 text-[11px] ${isFocused ? 'font-semibold text-[#8c5bf6]' : 'text-[#9CA3AF]'}`}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="absolute right-0 bottom-0 left-0"
      style={{ paddingBottom: insets.bottom || 12 }}
      pointerEvents="box-none"
    >
      <View className="mx-4 h-[84px] flex-row items-center rounded-[28px] bg-white px-2 shadow-lg shadow-black/10">
        {/* Bubble nằm cùng hàng flex với các tab -> tọa độ khớp nhau */}
        <Animated.View
          pointerEvents="none"
          className="absolute top-[8px] rounded-full bg-[#8c5bf6]/10"
          style={[{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }, bubbleStyle]}
        />

        {renderTab(TABS[0])}
        {renderTab(TABS[1])}

        {/* Chừa chỗ cố định cho nút + nổi, không dùng margin âm */}
        <View className="w-[56px]" />

        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          console.log('Create new');
          // TODO: điều hướng / mở modal tạo bài viết ở đây
        }}
        accessibilityRole="button"
        accessibilityLabel="Tạo mới"
        className="absolute -top-[18px] h-[60px] w-[60px] items-center justify-center rounded-full bg-[#8c5bf6] shadow-lg shadow-[#8c5bf6]/40"
        style={{ left: '50%', marginLeft: -30 }}
      >
        <Ionicons name="add" size={30} color="white" />
      </Pressable>
    </View>
  );
}

export default function TabBarLayout() {
  const { user } = useAuthStore();

  if (!user) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="story" options={{ title: 'Story' }} />
      <Tabs.Screen name="notification" options={{ title: 'Noti' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
    </Tabs>
  );
}
