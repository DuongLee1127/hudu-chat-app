import { useState, useMemo } from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeOutUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import ChatItem from '@/components/ChatItem';
import StoryItem from '@/components/StoryItem';
import SearchInput, { SearchInputBounds } from '@/components/SearchInput';
import SearchOverlayModal from '@/components/SearchOverlayModal';
import CreateStoryModal from '@/components/CreateStoryModal';
import ScreenWrapper from '@/providers/ScreenWrapper';
import { useListConversations } from '@/hooks/useConversations';
import { useStoryFeed } from '@/hooks/useStory';
import { useAuthStore } from '@/stores/auth';
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

type FilterType = 'all' | 'unread' | 'group';

const LIST_PARAMS = { page: 1, pageSize: 50 };

export default function ChatScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchBounds, setSearchBounds] = useState<SearchInputBounds | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleOpenSearch = (bounds?: SearchInputBounds) => {
    if (bounds) {
      setSearchBounds(bounds);
    }
    setIsSearchOpen(true);
  };

  const { data } = useListConversations(LIST_PARAMS);
  const { data: feedData } = useStoryFeed();

  const storyFeed = feedData?.data?.feed ?? [];

  // Separate user's own story group vs friends' story groups
  const { myStoryGroup, friendStoryGroups } = useMemo(() => {
    const currentUsername = currentUser?.username;
    let myGroup = null;
    const friendsGroups = [];

    for (const group of storyFeed) {
      if (currentUsername && group.user?.username === currentUsername) {
        myGroup = group;
      } else {
        friendsGroups.push(group);
      }
    }

    return { myStoryGroup: myGroup, friendStoryGroups: friendsGroups };
  }, [storyFeed, currentUser?.username]);

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

  const handleOpenUserStories = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({
      pathname: '/story/[id]',
      params: { id: userId },
    });
  };

  return (
    <ScreenWrapper className="bg-white">
      {/* Main white container */}
      <View className="flex-1 rounded-b-[32px] bg-white">
        <View className="flex-row justify-between px-3 pt-2 pb-4">
          <Text className="text-3xl font-bold">Chat</Text>
          {/* <View className="flex-row gap-4 items-center">
              <Pressable onPress={() => setIsCreateStoryOpen(true)}>
                <Ionicons name="camera-outline" size={28} color="#1A1A1A" />
              </Pressable>
              <Ionicons name="create-outline" size={28} color="#1A1A1A" />
            </View> */}
        </View>

        <View className="px-3 pb-2">
          <SearchInput onPress={handleOpenSearch} placeholder="Tìm kiếm bạn bè, nhóm..." />
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
                <View className="pt-6 pl-3">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                  >
                    {/* Bubble 1: Add Story (Tạo tin) */}
                    <StoryItem
                      isAddStory
                      name="Tạo tin"
                      avatar={currentUser?.avatar}
                      onPress={() => setIsCreateStoryOpen(true)}
                    />

                    {/* Bubble 2: My Story (if active stories exist) */}
                    {myStoryGroup && (
                      <StoryItem
                        name="Tin của bạn"
                        avatar={myStoryGroup.user?.avatar || currentUser?.avatar}
                        hasUnread={myStoryGroup.hasUnviewed}
                        onPress={() => handleOpenUserStories(myStoryGroup.userId)}
                      />
                    )}

                    {/* Bubble 3+: Friends' Stories */}
                    {friendStoryGroups.map((group) => (
                      <StoryItem
                        key={group.userId}
                        name={group.user?.username || 'Bạn bè'}
                        avatar={group.user?.avatar || ''}
                        hasUnread={group.hasUnviewed}
                        onPress={() => handleOpenUserStories(group.userId)}
                      />
                    ))}
                  </ScrollView>
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

        {/* Messenger-style full-screen search overlay with hero morphing animation */}
        <SearchOverlayModal
          visible={isSearchOpen}
          initialBounds={searchBounds}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Reusable Create Story Modal */}
        <CreateStoryModal visible={isCreateStoryOpen} onClose={() => setIsCreateStoryOpen(false)} />
      </View>
    </ScreenWrapper>
  );
}
