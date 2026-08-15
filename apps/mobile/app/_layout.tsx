import { Slot } from 'expo-router';

import QueryClientProvider from '@/providers/QueryProvider';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <Slot />
    </QueryClientProvider>
  );
}
