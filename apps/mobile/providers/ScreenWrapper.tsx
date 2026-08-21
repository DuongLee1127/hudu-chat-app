import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  edges?: Edges;
  statusBarStyle?: 'dark' | 'light' | 'auto';
}

export default function ScreenWrapper({
  children,
  className = '',
  edges = ['top', 'left', 'right'],
  statusBarStyle = 'dark',
}: ScreenWrapperProps) {
  return (
    <SafeAreaView className={`flex-1 ${className}`} edges={edges}>
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );
}
