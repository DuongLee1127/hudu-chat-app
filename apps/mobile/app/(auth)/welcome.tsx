import { useState, useEffect } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const SHEET_DISMISS_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 400;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [showAuthSheet, setShowAuthSheet] = useState(false);

  // Animated value for bottom sheet Y translation (380 is offscreen hidden position)
  const translateY = useSharedValue(380);

  // Shared values for floating chat bubbles
  const bubble1Y = useSharedValue(0);
  const bubble2Y = useSharedValue(0);
  const bubble3Y = useSharedValue(0);

  // Shared values for background glow circles
  const glow1Scale = useSharedValue(1);
  const glow1Opacity = useSharedValue(0.1);
  const glow2Scale = useSharedValue(1);
  const glow2Opacity = useSharedValue(0.15);

  useEffect(() => {
    // Bubble 1: Floating top-right (-8px to 0px)
    bubble1Y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Bubble 2: Floating middle-left (+6px to -4px)
    bubble2Y.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Bubble 3: Floating bottom-left (-10px to +2px)
    bubble3Y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Ambient Glow 1 pulse
    glow1Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    glow1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Ambient Glow 2 pulse
    glow2Scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    glow2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [bubble1Y, bubble2Y, bubble3Y, glow1Scale, glow1Opacity, glow2Scale, glow2Opacity]);

  const animatedBubble1 = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble1Y.value }],
  }));

  const animatedBubble2 = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble2Y.value }],
  }));

  const animatedBubble3 = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble3Y.value }],
  }));

  const animatedGlow1 = useAnimatedStyle(() => ({
    transform: [{ scale: glow1Scale.value }],
    opacity: glow1Opacity.value,
  }));

  const animatedGlow2 = useAnimatedStyle(() => ({
    transform: [{ scale: glow2Scale.value }],
    opacity: glow2Opacity.value,
  }));

  const openSheet = () => {
    setShowAuthSheet(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 220, mass: 0.8 });
  };

  const closeSheet = () => {
    translateY.value = withTiming(380, { duration: 220 }, () => {
      runOnJS(setShowAuthSheet)(false);
    });
  };

  // Pan gesture for dragging bottom sheet down
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > SHEET_DISMISS_THRESHOLD || event.velocityY > VELOCITY_THRESHOLD) {
        translateY.value = withTiming(380, { duration: 200 }, () => {
          runOnJS(setShowAuthSheet)(false);
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 220, mass: 0.8 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureHandlerRootView className="flex-1 bg-[#4F3CC9]">
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#3B2BB5', '#4F3CC9', '#7B5CFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Decorative background ambient glow circles */}
        <Animated.View
          pointerEvents="none"
          style={animatedGlow1}
          className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full"
        />
        <Animated.View
          pointerEvents="none"
          style={animatedGlow2}
          className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-[#B357E0]"
        />

        {/* Dismiss sheet when pressing background area */}
        <Pressable
          className="flex-1 justify-between px-6"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom + 20, 28),
          }}
          onPress={() => {
            if (showAuthSheet) closeSheet();
          }}
        >
          {/* Header */}
          <View>
            <View className="flex-row gap-3 items-center mb-8">
              <View className="justify-center items-center w-12 h-12 rounded-2xl border shadow-md bg-white/20 border-white/30">
                <Image
                  source={require('@/assets/images/hudo.png')}
                  className="w-8 h-8"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-3xl font-bold tracking-wide text-white">HaloChat</Text>
            </View>

            {/* Tiêu đề */}
            <Text className="mb-3 text-4xl font-extrabold leading-[48px] text-white">
              Trò chuyện liền mạch,{'\n'}kết nối không giới hạn.
            </Text>

            {/* Mô tả */}
            <Text className="text-lg leading-relaxed text-white/90">
              Nhắn tin, chia sẻ và giữ liên lạc với bạn bè, đồng nghiệp mọi lúc mọi nơi.
            </Text>
          </View>

          {/* Minh hoạ bong bóng chat */}
          <View className="justify-center items-center my-4">
            <View className="relative justify-center items-center w-full h-64">
              {/* Floating decorative particles */}
              <View className="absolute top-2 left-6 w-3 h-3 rounded-full bg-white/30" />
              <View className="absolute bottom-6 right-8 w-4 h-4 rounded-full bg-white/25" />

              {/* Bong bóng lớn phía trên bên phải */}
              <Animated.View
                style={[
                  animatedBubble1,
                  {
                    shadowColor: '#1A0933',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 8,
                  },
                ]}
                className="absolute top-2 right-2 px-4 py-3 bg-white/95 rounded-2xl rounded-tr-xs max-w-[82%]"
              >
                <View className="flex-row gap-2 items-center mb-1.5">
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                    className="w-7 h-7 rounded-full border border-purple-200"
                  />
                  <Text className="text-sm font-bold text-gray-900">Zahri K.</Text>
                  <View className="ml-auto w-2 h-2 bg-emerald-500 rounded-full" />
                </View>
                <Text className="text-sm font-medium leading-5 text-gray-700">
                  Chào bạn! Hôm nay thế nào rồi? 🎉
                </Text>
              </Animated.View>

              {/* Bong bóng nhỏ giữa bên trái */}
              <Animated.View
                style={[
                  animatedBubble2,
                  {
                    shadowColor: '#1A0933',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 6,
                  },
                ]}
                className="absolute left-0 top-24 px-4 py-3 bg-white/90 rounded-2xl rounded-tl-xs max-w-[85%]"
              >
                <View className="flex-row gap-2 items-center">
                  <Ionicons name="sparkles" size={18} color="#7B5CFA" />
                  <Text className="text-sm font-semibold text-purple-900">
                    Mình vừa gửi tài liệu cho bạn rồi nhé 🚀
                  </Text>
                </View>
              </Animated.View>

              {/* Bong bóng dưới cùng bên trái */}
              <Animated.View
                style={[
                  animatedBubble3,
                  {
                    shadowColor: '#1A0933',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                  },
                ]}
                className="absolute bottom-2 left-4 px-4 py-3 w-72 bg-white rounded-2xl rounded-bl-xs"
              >
                <View className="flex-row gap-3 items-center">
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
                    className="w-8 h-8 rounded-full border border-purple-300"
                  />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-0.5">
                      <Text className="text-sm font-bold text-gray-900">Minh Thảo</Text>
                      <Text className="text-xs text-gray-400">Vừa xong</Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-700">
                      Tuyệt vời quá! Cảm ơn bạn ❤️
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Nút hành động ban đầu */}
          <View className="gap-3">
            <Pressable
              onPress={openSheet}
              className="items-center justify-center h-[56px] bg-white rounded-full shadow-lg active:opacity-90"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text className="text-lg font-bold text-[#4F3CC9]">Bắt đầu ngay</Text>
            </Pressable>
          </View>
        </Pressable>
      </LinearGradient>

      {/* Draggable Bottom Sheet Card */}
      {showAuthSheet && (
        <Animated.View
          style={[
            animatedSheetStyle,
            {
              paddingBottom: Math.max(insets.bottom + 20, 28),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 12,
            },
          ]}
          className="absolute right-0 bottom-0 left-0 px-6 pt-3 bg-white rounded-t-[32px]"
        >
          {/* Pan Gesture Area covering the top handle */}
          <GestureDetector gesture={panGesture}>
            <View className="items-center py-2 -mx-6 mb-4 bg-transparent">
              {/* Drag Handle Bar */}
              <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </View>
          </GestureDetector>

          {/* Button 1: Đăng ký */}
          <Pressable
            onPress={() => {
              closeSheet();
              router.push('/signup');
            }}
            className="overflow-hidden mb-3.5 rounded-2xl active:opacity-90"
          >
            <LinearGradient
              colors={['#6f6bff', '#8c5bf6', '#b357e0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-lg font-medium text-white">Đăng ký</Text>
            </LinearGradient>
          </Pressable>

          {/* Button 2: Đăng nhập */}
          <Pressable
            onPress={() => {
              closeSheet();
              router.push('/signin');
            }}
            className="justify-center items-center h-[56px] bg-white rounded-2xl border border-gray-200 active:bg-gray-50 mb-1"
          >
            <Text className="text-lg font-medium text-gray-900">Đăng nhập</Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-3 text-sm font-normal text-gray-400">hoặc tiếp tục với</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social Logins */}
          <View className="flex-row gap-3 items-center">
            {/* Google */}
            <Pressable
              onPress={closeSheet}
              className="flex-1 flex-row justify-center items-center h-[54px] bg-white rounded-2xl border border-gray-200 active:bg-gray-50"
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text className="ml-2 text-base font-normal text-gray-900">Google</Text>
            </Pressable>

            {/* Facebook */}
            <Pressable
              onPress={closeSheet}
              className="flex-1 flex-row justify-center items-center h-[54px] bg-white rounded-2xl border border-gray-200 active:bg-gray-50"
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              <Text className="ml-2 text-base font-normal text-gray-900">Facebook</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}
