import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
