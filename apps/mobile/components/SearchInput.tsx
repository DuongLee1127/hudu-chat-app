import { useRef } from 'react';
import { View, TextInput, Pressable, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchInputBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SearchInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  onPress?: (bounds?: SearchInputBounds) => void;
  editable?: boolean;
}

export default function SearchInput({
  value = '',
  onChangeText,
  onClear,
  placeholder = 'Tìm kiếm trên Hudu Chat',
  onSubmitEditing,
  onPress,
  editable = true,
}: SearchInputProps) {
  const isTrigger = Boolean(onPress);
  const containerRef = useRef<View>(null);

  const handlePress = () => {
    if (onPress) {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          onPress({ x, y, width, height });
        } else {
          onPress();
        }
      });
    } else {
      Keyboard.dismiss();
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        ref={containerRef}
        className="h-12 flex-row items-center rounded-full bg-[#F3F4F6] px-4"
      >
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />

        <TextInput
          className="ml-2.5 flex-1 text-[16px] text-[#111827] p-0"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          returnKeyType="search"
          value={value}
          style={{ includeFontPadding: false, textAlignVertical: 'center' }}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          editable={!isTrigger && editable}
          pointerEvents={isTrigger ? 'none' : 'auto'}
        />

        {Boolean(value) && !isTrigger && (
          <Pressable
            onPress={() => {
              if (onClear) {
                onClear();
              } else if (onChangeText) {
                onChangeText('');
              }
            }}
            hitSlop={8}
            className="p-1"
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
