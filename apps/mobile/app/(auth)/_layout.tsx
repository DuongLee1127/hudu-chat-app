import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F8F7FF',
        },
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
