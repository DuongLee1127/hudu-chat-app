import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    console.log({
      email,
      password,
    });

    // Sau này gọi API ở đây
    // router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="justify-center flex-1 px-8">
          {/* Header */}
          <View className="mb-10">
            <View className="items-center justify-center mb-6 bg-black w-14 h-14 rounded-2xl">
              <Text className="text-2xl font-bold text-white">H</Text>
            </View>

            <Text className="text-3xl font-bold text-gray-950">Welcome back</Text>

            <Text className="mt-2 text-base text-gray-500">
              Sign in to continue to your account
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Email */}
            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-800">Email</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
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
                  <Text className="text-sm font-semibold text-black">Quên mật khẩu?</Text>
                </Pressable>
              </View>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="*************"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
              />
            </View>

            {/* Sign in */}
            <Pressable
              onPress={handleSignIn}
              className="items-center justify-center mt-2 bg-black h-14 rounded-xl active:opacity-80"
            >
              <Text className="text-base font-semibold text-white">Đăng nhập</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />

            <Text className="mx-4 text-sm text-gray-400">HOẶC</Text>

            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google */}
          <Pressable className="items-center justify-center border border-gray-200 h-14 rounded-xl active:bg-gray-50">
            <Text className="font-semibold text-gray-900">Tiếp tục bằng Google</Text>
          </Pressable>

          {/* Sign up */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Chưa có tài khoản? </Text>

            <Pressable onPress={() => router.push('/signup')}>
              <Text className="font-semibold text-black">Đăng ký</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
