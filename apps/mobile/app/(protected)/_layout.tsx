import { Stack } from 'expo-router';
import ScreenWrapper from '@/providers/ScreenWrapper';

export default function ProtectedLayout() {
  return (
    <ScreenWrapper className="flex-1" edges={['top', 'right', 'left']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/[id]"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen
          name="story/[id]"
          options={{
            animation: 'fade',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </ScreenWrapper>
  );
}
