import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { AxiosError } from 'axios';

import { useLogin } from '@/hooks/useAuth';
import type { ApiResponse } from '@/types/api';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useLogin();

  // Hàm đăng nhập
  const handleSignIn = () => {
    const values = {
      email,
      password,
    };

    loginMutation.mutate(values, {
      onSuccess: () => {
        console.log('Đăng nhập thành công!');
        router.navigate('/');
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        setErrorMsg(axiosErr.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5fb]">
      {/* Decorative glow blob to echo the web app's brand panel */}
      <View
        pointerEvents="none"
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#8c5bf6]/10"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <View className="justify-center flex-1 px-6">
            {/* Header */}
            <View className="items-center mb-8">
              <LinearGradient
                colors={['#6f6bff', '#8c5bf6', '#b357e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: '#6c52f0',
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }}
              >
                <Text className="text-2xl font-bold text-white">H</Text>
              </LinearGradient>

              <Text className="text-3xl font-bold text-center text-gray-950">
                Chào mừng trở lại
              </Text>

              <Text className="mt-2 text-base text-center text-gray-500">
                Đăng nhập để tiếp tục cuộc trò chuyện của bạn
              </Text>
            </View>

            {/* Card */}
            <View
              className="gap-5 p-6 bg-white"
              style={{
                borderRadius: 20,
                shadowColor: '#251861',
                shadowOpacity: 0.12,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
                elevation: 4,
              }}
            >
              {/* Email */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-800">Email</Text>

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
                  className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
                />
              </View>

              {/* Password */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-800">Mật khẩu</Text>

                  <Pressable>
                    <Text className="text-sm font-semibold text-[#6f6bff]">Quên mật khẩu?</Text>
                  </Pressable>
                </View>

                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
                />
              </View>

              {errorMsg ? (
                <Text className="text-sm text-center text-red-500">{errorMsg}</Text>
              ) : null}

              {/* Sign in */}
              <Pressable
                onPress={handleSignIn}
                disabled={loginMutation.isPending}
                className="mt-1 active:opacity-80"
              >
                <LinearGradient
                  colors={['#6f6bff', '#8c5bf6', '#b357e0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: loginMutation.isPending ? 0.7 : 1,
                  }}
                >
                  <Text className="text-base font-semibold text-white">
                    {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />

              <Text className="mx-4 text-sm text-gray-400">HOẶC</Text>

              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Google */}
            <Pressable className="items-center justify-center bg-white border border-gray-200 h-14 rounded-xl active:bg-gray-50">
              <Text className="font-semibold text-gray-900">Tiếp tục bằng Google</Text>
            </Pressable>

            {/* Sign up */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Chưa có tài khoản? </Text>

              <Pressable onPress={() => router.push('/signup')}>
                <Text className="font-semibold text-[#6f6bff]">Đăng ký</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
