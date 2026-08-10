import { Redirect } from 'expo-router';

export default function Index() {
  const isAuthenticated = false;

  if (isAuthenticated) return <Redirect href="/chat" />;

  return <Redirect href="/signin" />;
}
