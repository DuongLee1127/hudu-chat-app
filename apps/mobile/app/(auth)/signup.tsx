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

import { useRegister } from '@/hooks/useAuth';
import type { ApiResponse } from '@/types/api';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const registerMutation = useRegister();

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      setConfirmError('Mật khẩu xác nhận không khớp!');
      return;
    }
    setConfirmError('');

    const values = { name, email, password };

    registerMutation.mutate(
      { username: values.name, email: values.email, password: values.password },
      {
        onSuccess: () => {
          console.log('Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu.');
          router.push('/signin');
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          console.log(axiosErr);
        },
      },
    );
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

              <Text className="text-3xl font-bold text-center text-gray-950">Tạo tài khoản</Text>

              <Text className="mt-2 text-base text-center text-gray-500">
                Tạo tài khoản để bắt đầu với Halo Chat
              </Text>
            </View>

            {/* Card */}
            <View
              className="gap-4 p-6 bg-white"
              style={{
                borderRadius: 20,
                shadowColor: '#251861',
                shadowOpacity: 0.12,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
                elevation: 4,
              }}
            >
              {/* Name */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-800">Họ Tên</Text>

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nhập họ tên"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
                />
              </View>

              {/* Email */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-800">Email</Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
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
                <Text className="mb-2 text-sm font-semibold text-gray-800">Mật khẩu</Text>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
                />
              </View>

              {/* Confirm password */}
              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-800">Xác nhận mật khẩu</Text>

                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmError) setConfirmError('');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  className={`px-4 text-base leading-5 text-gray-900 border h-14 rounded-xl ${
                    confirmError ? 'border-red-400' : 'border-gray-200'
                  }`}
                />

                {confirmError ? (
                  <Text className="mt-1 text-xs text-red-500">{confirmError}</Text>
                ) : null}
              </View>

              {/* Sign up */}
              <Pressable
                onPress={handleSignUp}
                disabled={registerMutation.isPending}
                className="mt-2 active:opacity-80"
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
                    opacity: registerMutation.isPending ? 0.7 : 1,
                  }}
                >
                  <Text className="text-base font-semibold text-white">
                    {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
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
              <Text className="font-semibold text-gray-900">Tiếp tục với Google</Text>
            </Pressable>

            {/* Sign in */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500">Bạn đã có tài khoản chưa? </Text>

              <Pressable onPress={() => router.replace('/signin')}>
                <Text className="font-semibold text-[#6f6bff]">Đăng nhập</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
