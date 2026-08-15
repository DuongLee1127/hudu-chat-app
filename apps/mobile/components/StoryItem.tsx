import { Image, Pressable, Text, View } from 'react-native';

type Story = {
  id: string;
  name: string;
  avatar: string;
  hasStory?: boolean;
};

export default function StoryItem({ item }: { item: Story }) {
  return (
    <Pressable className="items-center mr-4">
      <View
        className={`h-[58px] w-[58px] items-center justify-center rounded-full ${
          item.hasStory ? 'border-2 border-[#0879D1]' : 'border-2 border-[#E8E8E8]'
        }`}
      >
        <Image source={{ uri: item.avatar }} className="h-[50px] w-[50px] rounded-full" />
      </View>

      <Text numberOfLines={1} className="mt-1.5 max-w-[65px] text-center text-[12px] text-[#222]">
        {item.name}
      </Text>
    </Pressable>
  );
}
