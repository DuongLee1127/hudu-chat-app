import { View, Text } from 'react-native';
import React from 'react';

export default function UnreadBadge({ count }: { count: number }) {
  return (
    <View className="mt-2 min-w-[19px] items-center rounded-full bg-[#0879D1] px-1.5 py-0.5">
      <Text className="text-[10px] font-semibold text-white">{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
