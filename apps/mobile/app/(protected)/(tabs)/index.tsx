import { FlatList, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import ChatItem from '@/components/ChatItem';
import StoryItem from '@/components/StoryItem';
import SearchInput from '@/components/SearchInput';
import { useListConversations } from '@/hooks/useConversations';

type Story = {
  id: string;
  name: string;
  avatar: string;
  hasStory?: boolean;
};

const LIST_PARAMS = { page: 1, pageSize: 50 };

const stories: Story[] = [
  {
    id: '1',
    name: 'My Status',
    avatar: 'https://i.pravatar.cc/150?img=12',
    hasStory: true,
  },
  {
    id: '2',
    name: 'Zahri K.',
    avatar: 'https://i.pravatar.cc/150?img=11',
    hasStory: true,
  },
  {
    id: '3',
    name: 'Hodden',
    avatar: 'https://i.pravatar.cc/150?img=13',
    hasStory: true,
  },
  {
    id: '4',
    name: 'Peter R.',
    avatar: 'https://i.pravatar.cc/150?img=14',
  },
  {
    id: '5',
    name: 'Salma',
    avatar: 'https://i.pravatar.cc/150?img=16',
  },
];

export default function ChatScreen() {
  const { data } = useListConversations(LIST_PARAMS);
  const conversations = data?.data.items ?? [];

  const scrollY = useSharedValue(0);

  const storyAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(scrollY.value, [0, 80], [0, -40], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View className="flex-1">
      {/* Main white container */}
      <View className="flex-1 rounded-b-[32px] bg-white">
        <View className="flex-row justify-between px-3 pt-2 pb-4">
          <Text className="text-3xl font-bold">Chat</Text>
          <View className="flex-row gap-4 items-center">
            <Ionicons name="camera-outline" size={28} color="#1A1A1A" />
            <Ionicons name="create-outline" size={28} color="#1A1A1A" />
          </View>
        </View>

        <View className="px-3">
          <SearchInput />
        </View>

        {/* Story List */}
        <Animated.FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ChatItem item={item} />}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          ListHeaderComponent={
            <Animated.View style={[{ overflow: 'hidden' }, storyAnimatedStyle]}>
              <View className="pt-6">
                <FlatList
                  data={stories}
                  horizontal
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <View className={index === 0 ? 'ml-3' : 'ml-0'}>
                      <StoryItem item={item} />
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              <View className="mt-4 mb-1 h-px bg-[#EEEEEE]" />
            </Animated.View>
          }
          contentContainerStyle={{
            paddingBottom: 150,
            flexGrow: 1,
          }}
        />
      </View>
    </View>
  );
}
