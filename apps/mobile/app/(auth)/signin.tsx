import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { AxiosError } from 'axios';

import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types/api';

export default function SignInScreen() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Values cho animation trượt và mờ dần
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const loginMutation = useLogin();
  const { setUser } = useAuthStore();

  // Hàm kích hoạt hiệu ứng chuyển cảnh
  const animateTransition = (nextStep: 'email' | 'password', direction: 'forward' | 'backward') => {
    // Kích hoạt haptic nhẹ trên điện thoại
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const startOffset = direction === 'forward' ? 50 : -50;
    const exitOffset = direction === 'forward' ? -50 : 50;

    // Phase 1: Fade out & Slide out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitOffset,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Đổi state step
      setStep(nextStep);
      // Đặt vị trí xuất phát cho step tiếp theo
      slideAnim.setValue(startOffset);

      // Phase 2: Fade in & Slide in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Chuyển sang bước nhập mật khẩu
  const handleNextStep = () => {
    if (!email || !email.trim()) {
      setErrorMsg('Vui lòng nhập email!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Email không hợp lệ!');
      return;
    }
    setErrorMsg('');
    animateTransition('password', 'forward');
  };

  // Quay lại bước nhập email
  const handleBackToEmail = () => {
    setErrorMsg('');
    animateTransition('email', 'backward');
  };

  // Nút back ở góc trên
  const handleTopBackPress = () => {
    if (step === 'password') {
      handleBackToEmail();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  };

  // Hàm đăng nhập
  const handleSignIn = () => {
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu!');
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (response) => {
          setUser(response?.data);
          router.replace('/');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          setErrorMsg(axiosErr.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="px-6 py-2"
          >
            {/* Top Bar / Back Button */}
            <View className="flex-row items-center mb-6">
              <Pressable
                onPress={handleTopBackPress}
                className="justify-center items-center -ml-2 w-10 h-10 rounded-full active:bg-gray-100"
              >
                <Ionicons name="chevron-back" size={26} color="#1F2937" />
              </Pressable>
            </View>

            {/* Header Title */}
            <View className="items-center mb-8">
              <Text className="mb-2 text-3xl font-bold text-center text-gray-900">
                {step === 'email' ? 'Chào mừng trở lại! 👋' : 'Nhập mật khẩu 🔐'}
              </Text>

              {step === 'email' ? (
                <Text className="text-base font-normal text-center text-gray-500">
                  Nhập email của bạn để tiếp tục
                </Text>
              ) : (
                <View className="flex-row items-center px-3.5 py-1.5 mt-1 bg-gray-100 rounded-full border border-gray-200">
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color="#6B7280"
                    style={{ marginRight: 6 }}
                  />
                  <Text className="mr-2 text-base font-normal text-gray-700">{email}</Text>
                  <Pressable onPress={handleBackToEmail}>
                    <Text className="text-sm font-normal text-[#6f6bff]">Thay đổi</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Form Section với hiệu ứng trượt */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
              className="mb-4"
            >
              {/* Step 1: Email Input */}
              {step === 'email' ? (
                <View className="mb-5">
                  <Text className="mb-2 text-base font-normal text-gray-700">Email</Text>
                  <View className="flex-row items-center px-4 h-[58px] bg-white rounded-2xl border border-gray-200">
                    <Ionicons
                      name="mail-outline"
                      size={22}
                      color="#9CA3AF"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="ban@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                      onSubmitEditing={handleNextStep}
                      className="flex-1 text-lg font-normal leading-6 text-gray-900"
                      textAlignVertical="center"
                    />
                  </View>
                </View>
              ) : (
                /* Step 2: Password Input */
                <View className="mb-3">
                  <Text className="mb-2 text-base font-normal text-gray-700">Mật khẩu</Text>
                  <View className="flex-row items-center px-4 h-[58px] bg-white rounded-2xl border border-gray-200">
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color="#9CA3AF"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoFocus
                      onSubmitEditing={handleSignIn}
                      className="flex-1 text-lg font-normal leading-6 text-gray-900"
                      textAlignVertical="center"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>

                  {/* Forgot Password Link */}
                  <View className="flex-row justify-end mt-2.5 mb-2">
                    <Pressable>
                      <Text className="text-base font-normal text-[#6f6bff]">Quên mật khẩu?</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {errorMsg ? (
                <Text className="mb-4 text-base font-normal text-center text-red-500">
                  {errorMsg}
                </Text>
              ) : null}

              {/* Action Button */}
              {step === 'email' ? (
                <Pressable onPress={handleNextStep} className="mb-8 active:opacity-90">
                  <LinearGradient
                    colors={['#6f6bff', '#8c5bf6', '#b357e0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#8c5bf6',
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 5,
                    }}
                  >
                    <Text className="text-lg font-medium text-white">Tiếp tục</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSignIn}
                  disabled={loginMutation.isPending}
                  className="mb-8 active:opacity-90"
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
                      opacity: loginMutation.isPending ? 0.7 : 1,
                      shadowColor: '#8c5bf6',
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 5,
                    }}
                  >
                    <Text className="text-lg font-medium text-white">
                      {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              {/* Step 1 Social Login Options */}
              {step === 'email' && (
                <>
                  {/* Divider */}
                  <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="mx-4 text-sm font-normal text-gray-400">
                      hoặc tiếp tục với
                    </Text>
                    <View className="flex-1 h-px bg-gray-200" />
                  </View>

                  {/* Social Login Buttons */}
                  <View className="flex-row gap-3 mb-8">
                    {/* Google */}
                    <Pressable className="flex-row flex-1 justify-center items-center h-[52px] bg-white rounded-2xl border border-gray-200 active:bg-gray-50">
                      <Ionicons name="logo-google" size={20} color="#EA4335" />
                      <Text className="ml-2 text-base font-normal text-gray-900">Google</Text>
                    </Pressable>

                    {/* Facebook */}
                    <Pressable className="flex-row flex-1 justify-center items-center h-[52px] bg-white rounded-2xl border border-gray-200 active:bg-gray-50">
                      <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                      <Text className="ml-2 text-base font-normal text-gray-900">Facebook</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Footer Link */}
            <View className="flex-row justify-center items-center pb-4 mt-auto">
              <Text className="text-base font-normal text-gray-500">Chưa có tài khoản? </Text>
              <Pressable onPress={() => router.push('/signup')}>
                <Text className="text-base font-bold text-[#6f6bff] underline">Đăng ký ngay</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
