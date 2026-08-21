import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListConversations, useCreateDirectConversation } from '@/hooks/useConversations';
import { useGlobalSearch } from '@/hooks/useSearch';
import type { GlobalSearchUser } from '@/services/search.service';
import type { SearchInputBounds } from '@/components/SearchInput';

interface SearchOverlayModalProps {
  visible: boolean;
  onClose: () => void;
  initialBounds?: SearchInputBounds | null;
  currentUserId?: string;
}

type SearchCategory = 'all' | 'friends' | 'groups' | 'messages';

const RECENT_SEARCHES_STORAGE_KEY = '@hudu_recent_searches';

export default function SearchOverlayModal({
  visible,
  onClose,
  initialBounds,
}: SearchOverlayModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const createDirectConvMutation = useCreateDirectConversation();

  // Animation shared progress (0 = collapsed at Chat input position, 1 = expanded in overlay)
  const progress = useSharedValue(0);

  // Target overlay header coordinates
  const overlayY = Math.max(insets.top + 8, 48);
  const overlayX = 46;
  const overlayW = Math.max(screenWidth - overlayX - 16, 100);
  const overlayH = 48;

  // Initial bounds from Chat screen (with fail-safe defaults)
  const startX = initialBounds?.x ?? 12;
  const startY = initialBounds?.y ?? overlayY + 50;
  const startW = initialBounds?.width ?? screenWidth - 24;
  const startH = initialBounds?.height ?? 48;

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      loadRecentSearches();

      progress.value = 0;
      // Ultra-smooth spring physics for fluid GPU transition
      progress.value = withSpring(1, {
        damping: 26,
        stiffness: 280,
        mass: 0.8,
      });

      // Focus text input after morph transition completes to prevent keyboard stutter
      const focusTimer = setTimeout(() => {
        runOnJS(focusInput)();
      }, 200);

      return () => clearTimeout(focusTimer);
    } else if (isMounted) {
      handleCloseAnimation();
    }
  }, [visible]);

  const completeClose = () => {
    setIsMounted(false);
    setSearchQuery('');
    onClose();
  };

  const handleCloseAnimation = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();

    progress.value = withTiming(
      0,
      {
        duration: 220,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(completeClose)();
        }
      },
    );
  };

  const loadRecentSearches = async () => {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (data) {
        setRecentSearches(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    try {
      const filtered = recentSearches.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, 8);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleRemoveRecentItem = async (term: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const updated = recentSearches.filter((item) => item !== term);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing recent search item:', error);
    }
  };

  const handleClearAllRecent = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestionsData } = useListConversations({
    page: 1,
    pageSize: 10,
  });

  const { data: searchData, isLoading: isSearching } = useGlobalSearch(debouncedQuery);

  const friends = searchData?.data?.users ?? [];
  const groups = searchData?.data?.conversations ?? [];
  const messages = searchData?.data?.messages ?? [];

  const visibleResultsCount = useMemo(() => {
    switch (activeCategory) {
      case 'friends':
        return friends.length;
      case 'groups':
        return groups.length;
      case 'messages':
        return messages.length;
      default:
        return friends.length + groups.length + messages.length;
    }
  }, [activeCategory, friends.length, groups.length, messages.length]);

  const handleSelectUser = async (user: GlobalSearchUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (user.username) {
      saveRecentSearch(user.username);
    }
    handleCloseAnimation();

    if (user.conversationId) {
      router.push({
        pathname: '/chat/[id]',
        params: { id: user.conversationId },
      });
    } else {
      try {
        const res = await createDirectConvMutation.mutateAsync(user._id);
        const convId = res.data.conversation._id;
        router.push({
          pathname: '/chat/[id]',
          params: { id: convId },
        });
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  };

  const handleSelectItem = (conversationId: string, title?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (title) {
      saveRecentSearch(title);
    }
    handleCloseAnimation();
    router.push({
      pathname: '/chat/[id]',
      params: { id: conversationId },
    });
  };

  const handleRecentItemClick = (term: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSearchQuery(term);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  // Reanimated GPU-accelerated hardware styles (0% layout re-pass)
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  const backButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: overlayY,
      left: 6,
      width: 36,
      height: overlayH,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: interpolate(progress.value, [0.3, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [-20, 0], Extrapolation.CLAMP) },
        { scale: interpolate(progress.value, [0.3, 1], [0.6, 1], Extrapolation.CLAMP) },
      ],
      zIndex: 101,
    };
  });

  // Pure UI-Thread Layout Bounds Morphing Container (0% Scale Matrix Distortion)
  const morphingContainerStyle = useAnimatedStyle(() => {
    const top = interpolate(progress.value, [0, 1], [startY, overlayY], Extrapolation.CLAMP);
    const left = interpolate(progress.value, [0, 1], [startX, overlayX], Extrapolation.CLAMP);
    const width = interpolate(progress.value, [0, 1], [startW, overlayW], Extrapolation.CLAMP);
    const height = interpolate(progress.value, [0, 1], [startH, overlayH], Extrapolation.CLAMP);

    return {
      position: 'absolute',
      top,
      left,
      width,
      height,
      borderRadius: 24,
      backgroundColor: '#F3F4F6',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.15, 0.05], Extrapolation.CLAMP),
      shadowRadius: 10,
      elevation: interpolate(progress.value, [0, 0.5, 1], [0, 8, 2], Extrapolation.CLAMP),
      zIndex: 100,
    };
  });

  const innerContentStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    };
  });
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      marginTop: overlayY + overlayH + 8,
      opacity: interpolate(progress.value, [0.25, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [30, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  if (!isMounted && !visible) {
    return null;
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCloseAnimation}
    >
      <StatusBar style="dark" />

      {/* Smooth backdrop layer */}
      <Animated.View
        style={[
          { position: 'absolute', inset: 0, backgroundColor: '#FFFFFF' },
          backdropAnimatedStyle,
        ]}
      />

      {/* Back Button */}
      <Animated.View style={backButtonAnimatedStyle}>
        <Pressable onPress={handleCloseAnimation} hitSlop={12} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
      </Animated.View>

      {/* Hero Morphing Search Input Bar Container (UI-Thread Bounds Interpolation) */}
      <Animated.View style={morphingContainerStyle}>
        <Animated.View style={innerContentStyle}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            className="ml-2 flex-1 text-[16px] text-[#111827] p-0"
            style={{ includeFontPadding: false, textAlignVertical: 'center' }}
            placeholder="Tìm kiếm bạn bè, nhóm..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {Boolean(searchQuery) && (
            <Pressable onPress={handleClear} hitSlop={8} className="p-1">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>

      {/* Body Content */}
      <Animated.View style={contentAnimatedStyle}>
        {/* Category Tabs */}
        {Boolean(searchQuery.trim()) && (
          <View className="flex-row gap-2 px-3.5 py-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'friends', label: 'Bạn bè' },
              { id: 'groups', label: 'Nhóm' },
              { id: 'messages', label: 'Tin nhắn' },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id as SearchCategory)}
                  className={`px-3.5 py-1.5 rounded-full ${active ? 'bg-[#7B5CFA]' : 'bg-[#F3F4F6]'}`}
                >
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#4B5563]'}`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Body Content List */}
        {!searchQuery.trim() ? (
          /* Recent Searches & Suggestions */
          <ScrollView className="flex-1 px-3.5 pt-2" keyboardShouldPersistTaps="handled">
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[15px] font-bold text-gray-900">Tìm kiếm gần đây</Text>
                  <Pressable onPress={handleClearAllRecent} hitSlop={8}>
                    <Text className="text-xs font-semibold text-[#7B5CFA]">Xóa tất cả</Text>
                  </Pressable>
                </View>

                {recentSearches.map((term, index) => (
                  <View
                    key={`${term}-${index}`}
                    className="flex-row items-center px-2 py-2.5 rounded-xl active:bg-gray-100"
                  >
                    <Pressable
                      onPress={() => handleRecentItemClick(term)}
                      className="flex-row flex-1 items-center mr-2"
                    >
                      <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                      </View>
                      <Text
                        className="flex-1 text-[15px] font-semibold text-gray-900"
                        numberOfLines={1}
                      >
                        {term}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveRecentItem(term)}
                      hitSlop={8}
                      className="p-1.5"
                    >
                      <Ionicons name="close" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Chat Suggestions Section */}
            <Text className="mb-2.5 text-[15px] font-bold text-gray-900">Gợi ý trò chuyện</Text>
            <View className="mb-6">
              {(suggestionsData?.data?.items ?? []).slice(0, 8).map((item) => {
                const name =
                  item.type === 'group'
                    ? item.name || 'Nhóm chat'
                    : item.otherMember?.username || 'Người dùng';
                const avatar = item.type === 'group' ? item.avatar : item.otherMember?.avatar;

                return (
                  <Pressable
                    key={item._id}
                    onPress={() => handleSelectItem(item._id, name)}
                    className="flex-row items-center px-2 py-3 rounded-xl active:bg-gray-100"
                  >
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        className="mr-3 w-11 h-11 bg-gray-200 rounded-full"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-[#7B5CFA] items-center justify-center mr-3">
                        <Text className="text-lg font-bold text-white">
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1 justify-center">
                      <Text className="text-[16px] font-semibold text-gray-900" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-[13px] text-gray-500 font-normal" numberOfLines={1}>
                        {item.type === 'group' ? 'Nhóm trò chuyện' : 'Trò chuyện riêng'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : visibleResultsCount === 0 && !isSearching ? (
          /* Empty Search Results State */
          <View className="flex-1 justify-center items-center px-8">
            <Ionicons name="search-outline" size={56} color="#D1D5DB" />
            <Text className="mt-4 text-base font-bold text-center text-gray-900">
              Không tìm thấy kết quả phù hợp
            </Text>
            <Text className="mt-1.5 text-[14px] text-center text-gray-500 leading-relaxed">
              Thử tìm kiếm với từ khóa khác như tên người dùng, nhóm hoặc nội dung tin nhắn.
            </Text>
          </View>
        ) : (
          /* Categorized Search Results from /api/search/global */
          <ScrollView className="flex-1 px-3.5 pt-3" keyboardShouldPersistTaps="handled">
            {/* Friends / Users Section */}
            {(activeCategory === 'all' || activeCategory === 'friends') && friends.length > 0 && (
              <View className="mb-5">
                <Text className="mb-2 text-[15px] font-bold text-gray-900">
                  Bạn bè & Người dùng ({friends.length})
                </Text>
                {friends.map((item) => (
                  <Pressable
                    key={item._id}
                    onPress={() => handleSelectUser(item)}
                    className="flex-row items-center px-2 py-3 rounded-xl active:bg-gray-100"
                  >
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        className="mr-3 w-11 h-11 rounded-full"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-[#7B5CFA] items-center justify-center mr-3">
                        <Text className="text-lg font-bold text-white">
                          {(item.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1 justify-center">
                      <Text className="text-[16px] font-semibold text-gray-900">
                        {item.username}
                      </Text>
                      <Text className="text-[13px] text-gray-500 font-normal" numberOfLines={1}>
                        {item.bio || 'Người dùng Messenger'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Groups Section */}
            {(activeCategory === 'all' || activeCategory === 'groups') && groups.length > 0 && (
              <View className="mb-5">
                <Text className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Nhóm chat ({groups.length})
                </Text>
                {groups.map((item) => (
                  <Pressable
                    key={item._id}
                    onPress={() => handleSelectItem(item._id, item.name)}
                    className="flex-row items-center px-2 py-3 rounded-xl active:bg-gray-100"
                  >
                    {item.avatar ? (
                      <Image
                        source={{ uri: item.avatar }}
                        className="mr-3 w-11 h-11 rounded-full"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-[#6344F5] items-center justify-center mr-3">
                        <Ionicons name="people" size={20} color="#FFF" />
                      </View>
                    )}
                    <View className="flex-1 justify-center">
                      <Text className="text-[16px] font-semibold text-gray-900">
                        {item.name || 'Nhóm chat'}
                      </Text>
                      <Text className="text-[13px] text-gray-500 font-normal" numberOfLines={1}>
                        Nhóm trò chuyện
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Messages Section */}
            {(activeCategory === 'all' || activeCategory === 'messages') && messages.length > 0 && (
              <View className="mb-5">
                <Text className="mb-2 text-[15px] font-bold text-gray-900">
                  Tin nhắn liên quan ({messages.length})
                </Text>
                {messages.map((item) => {
                  const convId =
                    typeof item.conversationId === 'object'
                      ? item.conversationId._id
                      : item.conversationId;
                  const title =
                    typeof item.conversationId === 'object'
                      ? item.conversationId.name || item.senderId?.username || 'Trò chuyện'
                      : 'Trò chuyện';

                  return (
                    <Pressable
                      key={item._id}
                      onPress={() => handleSelectItem(convId, title)}
                      className="flex-row items-center px-2 py-3 rounded-xl active:bg-gray-100"
                    >
                      <View className="justify-center items-center mr-3 w-10 h-10 bg-purple-50 rounded-full">
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#7B5CFA" />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-[16px] font-semibold text-gray-900">{title}</Text>
                        <Text className="text-[13px] text-gray-500 font-normal" numberOfLines={1}>
                          {`"${item.content}"`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}
