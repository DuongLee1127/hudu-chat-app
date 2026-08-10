import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const SignUpScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#f4f5fb]" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Back button */}
      <View className="px-5 pt-2">
        <TouchableOpacity
          hitSlop={10}
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center border border-[#eaeaf1]"
        >
          <Feather name="arrow-left" size={18} color="#3a3a45" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="items-center mb-8">
            <View
              className="w-14 h-14 rounded-[18px] bg-[#7c5cf0] items-center justify-center mb-3.5"
              style={{
                shadowColor: '#7c5cf0',
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <Image
                source={require('@/assets/images/hudo.png')}
                className="w-8 h-8"
                resizeMode="contain"
              />
            </View>
            <Text className="text-[24px] font-semibold text-[#181824] tracking-tight">
              Tạo tài khoản
            </Text>
            <Text className="text-[14px] text-[#8a8a99] mt-1.5">Chỉ mất chưa đầy một phút</Text>
          </View>

          {/* Form */}
          <View className="gap-3.5">
            {/* Username */}
            <View>
              <Text className="text-[13px] font-medium text-[#3a3a45] mb-2 ml-0.5">
                Tên hiển thị
              </Text>
              <View className="flex-row items-center h-[52px] rounded-2xl bg-white px-4 border border-[#eaeaf1]">
                <Feather name="user" size={18} color="#a3a3b0" />
                <TextInput
                  placeholder="nguyenvana"
                  placeholderTextColor="#b3b3c0"
                  className="flex-1 ml-3 text-[15px] text-[#181824]"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-[13px] font-medium text-[#3a3a45] mb-2 ml-0.5">Email</Text>
              <View className="flex-row items-center h-[52px] rounded-2xl bg-white px-4 border border-[#eaeaf1]">
                <Feather name="mail" size={18} color="#a3a3b0" />
                <TextInput
                  placeholder="ban@example.com"
                  placeholderTextColor="#b3b3c0"
                  className="flex-1 ml-3 text-[15px] text-[#181824]"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-[13px] font-medium text-[#3a3a45] mb-2 ml-0.5">Mật khẩu</Text>
              <View className="flex-row items-center h-[52px] rounded-2xl bg-white px-4 border border-[#eaeaf1]">
                <Feather name="lock" size={18} color="#a3a3b0" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#b3b3c0"
                  className="flex-1 ml-3 text-[15px] text-[#181824]"
                  secureTextEntry
                  textContentType="newPassword"
                />
                <TouchableOpacity hitSlop={10}>
                  <Feather name="eye" size={18} color="#a3a3b0" />
                </TouchableOpacity>
              </View>
              {/* Strength hint */}
              <View className="flex-row gap-1 mt-2 ml-0.5">
                <View className="flex-1 h-1 rounded-full bg-[#7c5cf0]" />
                <View className="flex-1 h-1 rounded-full bg-[#7c5cf0]" />
                <View className="flex-1 h-1 rounded-full bg-[#e5e5ee]" />
              </View>
            </View>

            {/* Confirm password */}
            <View>
              <Text className="text-[13px] font-medium text-[#3a3a45] mb-2 ml-0.5">
                Xác nhận mật khẩu
              </Text>
              <View className="flex-row items-center h-[52px] rounded-2xl bg-white px-4 border border-[#eaeaf1]">
                <Feather name="lock" size={18} color="#a3a3b0" />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#b3b3c0"
                  className="flex-1 ml-3 text-[15px] text-[#181824]"
                  secureTextEntry
                  textContentType="newPassword"
                />
                <TouchableOpacity hitSlop={10}>
                  <Feather name="eye" size={18} color="#a3a3b0" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Agreement */}
          <TouchableOpacity activeOpacity={0.8} className="flex-row items-start mt-4">
            <View className="w-5 h-5 rounded-md border-[1.5px] border-[#c7c7d1] mr-2.5 mt-0.5 items-center justify-center">
              <Feather name="check" size={12} color="#7c5cf0" />
            </View>
            <Text className="flex-1 text-[13px] text-[#6b6b78] leading-5">
              Tôi đồng ý với <Text className="text-[#7c5cf0] font-medium">điều khoản sử dụng</Text>{' '}
              của Halo Chat
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-[54px] rounded-2xl bg-[#7c5cf0] items-center justify-center mt-6"
            style={{
              shadowColor: '#7c5cf0',
              shadowOpacity: 0.28,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 18,
              elevation: 5,
            }}
          >
            <Text className="text-white font-semibold text-[16px]">Đăng ký</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="flex-row justify-center mt-7">
            <Text className="text-[#8a8a99] text-[14px]">Đã có tài khoản? </Text>
            <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
              <Text className="text-[#7c5cf0] font-semibold text-[14px]">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
