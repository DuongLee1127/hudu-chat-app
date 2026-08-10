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

const SignInScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#f4f5fb]" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="items-center mb-9">
            <View
              className="w-16 h-16 rounded-[20px] bg-[#7c5cf0] items-center justify-center mb-4"
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
                className="w-9 h-9"
                resizeMode="contain"
              />
            </View>
            <Text className="text-[24px] font-semibold text-[#181824] tracking-tight">
              Chào mừng trở lại
            </Text>
            <Text className="text-[14px] text-[#8a8a99] mt-1.5 text-center leading-5">
              Đăng nhập để tiếp tục cuộc trò chuyện của bạn
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
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
                  textContentType="password"
                />
                <TouchableOpacity hitSlop={10}>
                  <Feather name="eye" size={18} color="#a3a3b0" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity className="self-end -mt-1" hitSlop={8}>
              <Text className="text-[13px] font-medium text-[#7c5cf0]">Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-[54px] rounded-2xl bg-[#7c5cf0] items-center justify-center mt-7"
            style={{
              shadowColor: '#7c5cf0',
              shadowOpacity: 0.28,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 18,
              elevation: 5,
            }}
          >
            <Text className="text-white font-semibold text-[16px]">Đăng nhập</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mt-8 mb-8">
            <View className="flex-1 h-[1px] bg-[#e5e5ee]" />
            <Text className="mx-3 text-[12px] text-[#b3b3c0]">hoặc</Text>
            <View className="flex-1 h-[1px] bg-[#e5e5ee]" />
          </View>

          {/* Social */}
          {/* <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 h-[50px] rounded-2xl bg-white border border-[#eaeaf1] flex-row items-center justify-center gap-2"
            >
              <Feather name="mail" size={17} color="#3a3a45" />
              <Text className="text-[14px] font-medium text-[#3a3a45]">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 h-[50px] rounded-2xl bg-white border border-[#eaeaf1] flex-row items-center justify-center gap-2"
            >
              <Feather name="smartphone" size={17} color="#3a3a45" />
              <Text className="text-[14px] font-medium text-[#3a3a45]">Apple</Text>
            </TouchableOpacity>
          </View> */}

          {/* Footer */}
          <View className="flex-row justify-center">
            <Text className="text-[#8a8a99] text-[14px]">Chưa có tài khoản? </Text>
            <TouchableOpacity hitSlop={8} onPress={() => router.push('/signup')}>
              <Text className="text-[#7c5cf0] font-semibold text-[14px]">Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInScreen;
