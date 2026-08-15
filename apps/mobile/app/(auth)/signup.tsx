import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    console.log({
      name,
      email,
      password,
    });

    // Sau này gọi API đăng ký ở đây
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="justify-center flex-1 px-6">
          {/* Header */}
          <View className="mb-8">
            <View className="items-center justify-center mb-6 bg-black w-14 h-14 rounded-2xl">
              <Text className="text-2xl font-bold text-white">H</Text>
            </View>

            <Text className="text-3xl font-bold text-gray-950">Tạo tài khoản</Text>

            <Text className="mt-2 text-base text-gray-500">
              Tạo tài khoản để bắt đầu với Halo Chat
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
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
              <Text className="mb-2 text-sm font-semibold text-gray-800">Mật khẩu</Text>

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

            {/* Confirm password */}
            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-800">Xác nhận mật khẩu</Text>

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="*************"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                className="px-4 text-base leading-5 text-gray-900 border border-gray-200 h-14 rounded-xl"
              />
            </View>

            {/* Sign up */}
            <Pressable
              onPress={handleSignUp}
              className="items-center justify-center mt-2 bg-black h-14 rounded-xl active:opacity-80"
            >
              <Text className="text-base font-semibold text-white">Tạo tài khoản</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />

            <Text className="mx-4 text-sm text-gray-400">HOẶC</Text>

            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google */}
          <Pressable className="items-center justify-center border border-gray-200 h-14 rounded-xl active:bg-gray-50">
            <Text className="font-semibold text-gray-900">Tiếp tục với Google</Text>
          </Pressable>

          {/* Sign in */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Bạn đã có tài khoản chưa? </Text>

            <Pressable onPress={() => router.replace('/signin')}>
              <Text className="font-semibold text-black">Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
