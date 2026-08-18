import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    console.log('Đăng xuất');
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        router.replace('/(auth)/welcome');
      },
      onError: (error) => {
        console.log(error);
        console.error('Đăng xuất thất bại. Vui lòng thử lại!');
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View className="flex-1">
        <Text>profile</Text>
        <Pressable
          onPress={handleLogout}
          className="justify-center items-center h-14 bg-white rounded-xl border border-gray-200 active:bg-gray-50"
        >
          <Text>Đăng xuất</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
