import { View, TextInput, Pressable, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchInput() {
  return (
    <Pressable onPress={Keyboard.dismiss}>
      <View className="h-14 flex-row items-center rounded-lg bg-[#F5F6FA] px-3">
        <Ionicons name="search-outline" size={20} color="#A7ADB7" />

        <TextInput
          className="ml-2 flex-1 text-[13px] text-[#222]"
          placeholder="Search your chat"
          placeholderTextColor="#A7ADB7"
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
    </Pressable>
  );
}
