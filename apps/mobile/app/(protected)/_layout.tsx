import { Stack } from 'expo-router';

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen
        name="story/[id]"
        options={{
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
