import { Redirect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth';

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <SafeAreaView className="flex-1" edges={['right', 'left']}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: '#F8F7FF',
          },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
      </Stack>
    </SafeAreaView>
  );
}
