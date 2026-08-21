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

import { useRegister } from '@/hooks/useAuth';
import type { ApiResponse } from '@/types/api';

export default function SignUpScreen() {
  const [step, setStep] = useState<'name' | 'email' | 'password' | 'success'>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Values cho animation trượt và mờ dần
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const registerMutation = useRegister();

  // Hàm kích hoạt hiệu ứng chuyển cảnh
  const animateTransition = (
    nextStep: 'name' | 'email' | 'password' | 'success',
    direction: 'forward' | 'backward',
  ) => {
    if (nextStep === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const startOffset = direction === 'forward' ? 50 : -50;
    const exitOffset = direction === 'forward' ? -50 : 50;

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
      setStep(nextStep);
      slideAnim.setValue(startOffset);

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

  // Bước 1 -> Bước 2 (Nhập tên xong -> Nhập Email)
  const handleNextToEmail = () => {
    if (!name || !name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên!');
      return;
    }
    setErrorMsg('');
    animateTransition('email', 'forward');
  };

  // Bước 2 -> Bước 3 (Nhập email xong -> Nhập Mật khẩu)
  const handleNextToPassword = () => {
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

  // Quay lại các bước trước
  const handleBackToName = () => {
    setErrorMsg('');
    animateTransition('name', 'backward');
  };

  const handleBackToEmail = () => {
    setErrorMsg('');
    animateTransition('email', 'backward');
  };

  // Nút back ở góc trên
  const handleTopBackPress = () => {
    if (step === 'password') {
      handleBackToEmail();
    } else if (step === 'email') {
      handleBackToName();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  };

  // Hàm hoàn thành đăng ký (Bước 3)
  const handleSignUp = () => {
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }

    setErrorMsg('');

    registerMutation.mutate(
      { username: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          // Chuyển sang màn hình xác nhận thành công
          animateTransition('success', 'forward');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          setErrorMsg(axiosErr.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
        },
      },
    );
  };

  // Chuyển sang trang Đăng nhập từ màn hình thành công
  const handleGoToSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.replace('/signin');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: step === 'success' ? 'center' : 'space-between',
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="px-6 py-2"
          >
            {/* Top Bar / Back Button (Ẩn khi ở màn hình thành công) */}
            {step !== 'success' && (
              <View className="flex-row items-center mb-6">
                <Pressable
                  onPress={handleTopBackPress}
                  className="justify-center items-center -ml-2 w-10 h-10 rounded-full active:bg-gray-100"
                >
                  <Ionicons name="chevron-back" size={26} color="#1F2937" />
                </Pressable>
              </View>
            )}

            {/* Header Title (Dành cho bước 1, 2, 3) */}
            {step !== 'success' && (
              <View className="items-center mb-8">
                <Text className="mb-2 text-3xl font-bold text-center text-gray-900">
                  {step === 'name'
                    ? 'Tạo tài khoản ✨'
                    : step === 'email'
                      ? 'Địa chỉ Email 📧'
                      : 'Tạo mật khẩu 🔐'}
                </Text>

                {step === 'name' && (
                  <Text className="text-base font-normal text-center text-gray-500">
                    Nhập họ và tên của bạn để bắt đầu
                  </Text>
                )}

                {step === 'email' && (
                  <View className="flex-row items-center px-3.5 py-1.5 mt-1 bg-gray-100 rounded-full border border-gray-200">
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color="#6B7280"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="mr-2 text-base font-normal text-gray-700">{name}</Text>
                    <Pressable onPress={handleBackToName}>
                      <Text className="text-sm font-normal text-[#6f6bff]">Thay đổi</Text>
                    </Pressable>
                  </View>
                )}

                {step === 'password' && (
                  <View className="flex-row flex-wrap gap-2 justify-center items-center mt-1">
                    <View className="flex-row items-center px-3.5 py-1.5 bg-gray-100 rounded-full border border-gray-200">
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
                  </View>
                )}
              </View>
            )}

            {/* Main Animated View */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              }}
              className="mb-4"
            >
              {/* Bước 1: Họ tên */}
              {step === 'name' && (
                <View className="mb-5">
                  <Text className="mb-2 text-base font-normal text-gray-700">Họ Tên</Text>
                  <View className="flex-row items-center px-4 h-[58px] bg-white rounded-2xl border border-gray-200">
                    <Ionicons
                      name="person-outline"
                      size={22}
                      color="#9CA3AF"
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Nhập họ tên đầy đủ"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      autoFocus
                      onSubmitEditing={handleNextToEmail}
                      className="flex-1 text-lg font-normal leading-6 text-gray-900"
                      textAlignVertical="center"
                    />
                  </View>
                </View>
              )}

              {/* Bước 2: Email */}
              {step === 'email' && (
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
                      onSubmitEditing={handleNextToPassword}
                      className="flex-1 text-lg font-normal leading-6 text-gray-900"
                      textAlignVertical="center"
                    />
                  </View>
                </View>
              )}

              {/* Bước 3: Mật khẩu & Xác nhận mật khẩu */}
              {step === 'password' && (
                <View className="mb-3">
                  {/* Mật khẩu */}
                  <View className="mb-4">
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
                  </View>

                  {/* Xác nhận Mật khẩu */}
                  <View className="mb-2">
                    <Text className="mb-2 text-base font-normal text-gray-700">
                      Xác nhận mật khẩu
                    </Text>
                    <View className="flex-row items-center px-4 h-[58px] bg-white rounded-2xl border border-gray-200">
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={22}
                        color="#9CA3AF"
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Nhập lại mật khẩu"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        onSubmitEditing={handleSignUp}
                        className="flex-1 text-lg font-normal leading-6 text-gray-900"
                        textAlignVertical="center"
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1"
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color="#9CA3AF"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Màn hình Xác nhận Thành Công màu Xanh lá Tươi nổi bật & Khoảng cách rộng rãi */}
              {step === 'success' && (
                <View className="justify-center items-center py-4">
                  {/* Bright Vibrant Green Success Icon Badge */}
                  <LinearGradient
                    colors={['#34D399', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#10B981',
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                      marginBottom: 20,
                    }}
                  >
                    <Ionicons name="checkmark-sharp" size={54} color="#FFFFFF" />
                  </LinearGradient>

                  {/* Header Title */}
                  <Text className="mb-3 text-2xl font-bold text-center text-gray-900">
                    Tạo tài khoản thành công! 🎉
                  </Text>

                  {/* Description với khoảng cách rộng rãi */}
                  <Text className="px-4 mb-10 text-base font-normal leading-6 text-center text-gray-500">
                    Tài khoản của bạn đã được khởi tạo thành công. Hãy đăng nhập ngay để bắt đầu
                    trải nghiệm!
                  </Text>
                </View>
              )}

              {errorMsg ? (
                <Text className="mb-4 text-base font-normal text-center text-red-500">
                  {errorMsg}
                </Text>
              ) : null}

              {/* Action Buttons */}
              {step === 'name' && (
                <Pressable onPress={handleNextToEmail} className="mb-8 active:opacity-90">
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
              )}

              {step === 'email' && (
                <Pressable onPress={handleNextToPassword} className="mb-8 active:opacity-90">
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
              )}

              {step === 'password' && (
                <Pressable
                  onPress={handleSignUp}
                  disabled={registerMutation.isPending}
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
                      opacity: registerMutation.isPending ? 0.7 : 1,
                      shadowColor: '#8c5bf6',
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 5,
                    }}
                  >
                    <Text className="text-lg font-medium text-white">
                      {registerMutation.isPending ? 'Đang đăng ký...' : 'Tạo tài khoản'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              {step === 'success' && (
                <Pressable onPress={handleGoToSignIn} className="w-full active:opacity-90">
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
                    <Text className="text-lg font-medium text-white">Đăng nhập ngay</Text>
                  </LinearGradient>
                </Pressable>
              )}

              {/* Step 1 Social Login Options */}
              {step === 'name' && (
                <>
                  {/* Divider */}
                  <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-px bg-gray-200" />
                    <Text className="mx-4 text-sm font-normal text-gray-400">hoặc đăng ký với</Text>
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

            {/* Footer Link (Ẩn khi ở màn hình thành công) */}
            {step !== 'success' && (
              <View className="flex-row justify-center items-center pb-4 mt-auto">
                <Text className="text-base font-normal text-gray-500">
                  Bạn đã có tài khoản chưa?{' '}
                </Text>
                <Pressable onPress={() => router.replace('/signin')}>
                  <Text className="text-base font-bold text-[#6f6bff] underline">Đăng nhập</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
