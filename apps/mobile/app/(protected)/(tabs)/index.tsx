import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeOutUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import ChatItem from '@/components/ChatItem';
import StoryItem from '@/components/StoryItem';
import SearchInput from '@/components/SearchInput';
import { useListConversations } from '@/hooks/useConversations';
import type { ConversationListItem } from '@/types/conversation';

// Animated badge with spring scale on press
const FilterBadge = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  return (
    <Pressable onPress={onPress}>
      {active ? (
        <LinearGradient
          colors={['#7B5CFA', '#6344F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7 }}
        >
          <Text className="text-sm font-bold text-white">{label}</Text>
        </LinearGradient>
      ) : (
        <View className="px-4 py-1.5 bg-[#F4F3FF] rounded-full">
          <Text className="text-sm font-semibold text-[#555273]">{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

// Animated entry for each chat row
const AnimatedChatItem = ({ item, index }: { item: ConversationListItem; index: number }) => (
  <Animated.View
    key={item._id}
    entering={FadeInDown.delay(index * 35)
      .springify()
      .damping(18)
      .stiffness(200)}
    exiting={FadeOutUp.duration(150)}
  >
    <ChatItem item={item} />
  </Animated.View>
);

type Story = {
  id: string;
  name: string;
  avatar: string;
  hasStory?: boolean;
};

type FilterType = 'all' | 'unread' | 'group';

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

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredConversations = useMemo(() => {
    const list = data?.data.items ?? [];
    if (activeFilter === 'unread') {
      return list.filter((item) => (item.unreadCount || 0) > 0);
    }
    if (activeFilter === 'group') {
      return list.filter((item) => item.type === 'group');
    }
    return list;
  }, [data?.data.items, activeFilter]);

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

  const handleFilterSelect = (filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveFilter(filter);
  };

  return (
    <View className="flex-1">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

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

        {/* Conversation List with Story Header & Filter Badges */}
        <Animated.FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => <AnimatedChatItem item={item} index={index} />}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          ListHeaderComponent={
            <View>
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
              </Animated.View>

              {/* Filter Badges Bar */}
              <View className="flex-row gap-2.5 px-3 mt-6 mb-2 items-center">
                <FilterBadge
                  label="Tất cả"
                  active={activeFilter === 'all'}
                  onPress={() => handleFilterSelect('all')}
                />
                <FilterBadge
                  label="Chưa đọc"
                  active={activeFilter === 'unread'}
                  onPress={() => handleFilterSelect('unread')}
                />
                <FilterBadge
                  label="Nhóm"
                  active={activeFilter === 'group'}
                  onPress={() => handleFilterSelect('group')}
                />
              </View>
            </View>
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
