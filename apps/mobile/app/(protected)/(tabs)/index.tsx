import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

type Story = {
  id: string;
  name: string;
  avatar: string;
  hasStory?: boolean;
};

type Chat = {
  id: string;
  name: string;
  avatar: string;
  message: string;
  time: string;
  unread?: number;
  typing?: boolean;
  read?: boolean;
};

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

const chats: Chat[] = [
  {
    id: '1',
    name: 'Marzuki Ali',
    avatar: 'https://i.pravatar.cc/150?img=12',
    message: 'What was the best year of your life?',
    time: '04.01',
    read: true,
  },
  {
    id: '2',
    name: 'Lesti Kejora',
    avatar: 'https://i.pravatar.cc/150?img=47',
    message: 'Wow look amazing 😍',
    time: '04.02',
    read: false,
  },
  {
    id: '3',
    name: 'Zahri K.',
    avatar: 'https://i.pravatar.cc/150?img=11',
    message: 'Typing message...',
    time: '04.04',
    typing: true,
    unread: 7,
  },
  {
    id: '4',
    name: 'Pemuda Pancaindra',
    avatar: 'https://i.pravatar.cc/150?img=33',
    message: "Don't forget karaoke at 10 pm",
    time: '09.13',
    unread: 121,
  },
  {
    id: '5',
    name: 'Ariel Noah',
    avatar: 'https://i.pravatar.cc/150?img=68',
    message: 'Thank you so much 🙌',
    time: '13.17',
    read: false,
  },
  {
    id: '6',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
  {
    id: '7',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
  {
    id: '8',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
  {
    id: '9',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
  {
    id: '10',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
  {
    id: '11',
    name: 'Luna Maya',
    avatar: 'https://i.pravatar.cc/150?img=45',
    message: 'Have a nice day 🌸',
    time: 'Saturday',
  },
];

export default function ChatScreen() {
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View className="flex-1 bg-[#EEF3FB]">
        {/* Main white container */}
        <View className="flex-1 rounded-b-[32px] bg-white px-7">
          <View className="flex-row justify-between pt-2 pb-4">
            <Text className="text-2xl font-bold">Chat</Text>
            <View className="flex-row items-center gap-4">
              <Ionicons name="camera-outline" size={24} color="#1A1A1A" />
              <Ionicons name="create-outline" size={24} color="#1A1A1A" />
            </View>
          </View>

          <SearchInput />

          {/* Story List */}
          <Animated.FlatList
            data={chats}
            keyExtractor={(item) => item.id}
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
                    renderItem={({ item }) => <StoryItem item={item} />}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>

                <View className="my-4 h-px bg-[#EEEEEE]" />
              </Animated.View>
            }
            contentContainerStyle={{
              paddingBottom: 20,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
