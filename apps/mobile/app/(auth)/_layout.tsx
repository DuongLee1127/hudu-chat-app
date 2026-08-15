import { Stack, Redirect } from 'expo-router';

export default function AuthLayout() {
  const isAuthenticated = true;

  if (isAuthenticated) return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
    </Stack>
  );
}
