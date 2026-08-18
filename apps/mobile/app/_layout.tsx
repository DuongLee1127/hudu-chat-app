import { View } from 'react-native';
import { Slot } from 'expo-router';

import QueryClientProvider from '@/providers/QueryProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import ScreenWrapper from '@/providers/ScreenWrapper';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <SocketProvider>
        {/* <ScreenWrapper> */}
        <View className="flex-1 bg-white">
          <Slot />
        </View>
        {/* </ScreenWrapper> */}
      </SocketProvider>
    </QueryClientProvider>
  );
}
