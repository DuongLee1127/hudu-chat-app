import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return <Redirect href="/signin" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
