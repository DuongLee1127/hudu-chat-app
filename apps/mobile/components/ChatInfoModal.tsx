import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  Switch,
  Clipboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  useUpdateConversation,
  useRemoveMember,
  useAddMembers,
  useLeaveConversation,
  useMuteConversation,
  useArchiveConversation,
  useGenerateInviteCode,
} from '@/hooks/useConversations';
import {
  useListMessages,
  usePinnedMessages,
  useTogglePinMessage,
  useSearchMessages,
} from '@/hooks/useMessages';
import { useConversationAttachments } from '@/hooks/useAttachments';
import type { ConversationMember } from '@/types/conversation';
import type { Message, MessageAttachment } from '@/types/message';

export function getFullFileUrl(url?: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('file:')
  ) {
    return url;
  }
  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:5000/api';
  const rootHost = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${rootHost}${cleanPath}`;
}

export interface ChatInfoModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  displayName: string;
  avatarUrl?: string | null;
  isGroup: boolean;
  isOtherOnline?: boolean;
  members?: ConversationMember[];
  currentUserId?: string;
}

export default function ChatInfoModal({
  visible,
  onClose,
  conversationId,
  displayName,
  avatarUrl,
  isGroup,
  isOtherOnline = false,
  members = [],
  currentUserId,
}: ChatInfoModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Animation shared value (0 = offscreen right, 1 = onscreen)
  const progress = useSharedValue(0);
  const [isMounted, setIsMounted] = useState(false);

  // Modals & Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(displayName);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [addMemberInput, setAddMemberInput] = useState('');
  const [showAddMemberInput, setShowAddMemberInput] = useState(false);

  // Backend Mutations
  const updateConvMutation = useUpdateConversation(conversationId);
  const removeMemberMutation = useRemoveMember(conversationId);
  const addMembersMutation = useAddMembers(conversationId);
  const leaveConvMutation = useLeaveConversation();
  const muteConvMutation = useMuteConversation();
  const archiveConvMutation = useArchiveConversation();
  const generateInviteMutation = useGenerateInviteCode(conversationId);

  // Pinned & Search Hooks
  const pinnedQuery = usePinnedMessages(conversationId);
  const togglePinMutation = useTogglePinMessage(conversationId);
  const searchQueryRes = useSearchMessages(conversationId, inChatSearchQuery);

  const pinnedMessages = useMemo(() => pinnedQuery.data?.data?.items ?? [], [pinnedQuery.data]);

  const searchResults = useMemo(
    () => searchQueryRes.data?.data?.items ?? [],
    [searchQueryRes.data],
  );

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members;
    const q = memberSearchQuery.trim().toLowerCase();
    return members.filter((m) => m.userId.username?.toLowerCase().includes(q));
  }, [members, memberSearchQuery]);

  // Attachment Queries via useConversationAttachments Hook
  const { data: imageAttachmentsData } = useConversationAttachments(conversationId, 'image');
  const { data: videoAttachmentsData } = useConversationAttachments(conversationId, 'video');
  const { data: fileAttachmentsData } = useConversationAttachments(conversationId, 'file');

  const imageAttachments = useMemo(() => {
    return imageAttachmentsData?.pages.flatMap((page) => page.data.items) ?? [];
  }, [imageAttachmentsData]);

  const videoAttachments = useMemo(() => {
    return videoAttachmentsData?.pages.flatMap((page) => page.data.items) ?? [];
  }, [videoAttachmentsData]);

  const fileAttachments = useMemo(() => {
    return fileAttachmentsData?.pages.flatMap((page) => page.data.items) ?? [];
  }, [fileAttachmentsData]);

  // Combine Images & Videos for Shared Media
  const mediaAttachments = useMemo(() => {
    return [...imageAttachments, ...videoAttachments];
  }, [imageAttachments, videoAttachments]);

  // Fallback: Query Messages for Media if attachment service returns empty
  const { data: messagesData } = useListMessages(conversationId, { limit: 100 });
  const allMessages = useMemo(() => messagesData?.data?.items ?? [], [messagesData]);

  const fallbackMediaList = useMemo(() => {
    const list: { _id: string; url: string }[] = [];
    allMessages.forEach((m: Message) => {
      if (m.isDeleted) return;
      if (m.attachmentIds && Array.isArray(m.attachmentIds) && m.attachmentIds.length > 0) {
        m.attachmentIds.forEach((att) => {
          const rawUrl = att.thumbnailUrl || att.url;
          if (rawUrl) {
            list.push({ _id: att._id || Math.random().toString(), url: rawUrl });
          }
        });
      } else if (m.type === 'image' || m.type === 'video') {
        if (m.content) {
          list.push({ _id: m._id, url: m.content });
        }
      } else if (
        m.content &&
        (m.content.startsWith('http') || m.content.match(/\.(jpg|jpeg|png|webp|gif|mp4)$/i))
      ) {
        list.push({ _id: m._id, url: m.content });
      }
    });
    return list;
  }, [allMessages]);

  const displayMediaList = useMemo(() => {
    if (mediaAttachments.length > 0) {
      return mediaAttachments.map((att) => ({
        _id: att._id,
        url: getFullFileUrl(att.thumbnailUrl || att.url),
      }));
    }
    return fallbackMediaList.map((item) => ({
      _id: item._id,
      url: getFullFileUrl(item.url),
    }));
  }, [mediaAttachments, fallbackMediaList]);

  // Check if Current User is Admin
  const currentUserMember = members.find((m) => m.userId._id === currentUserId);
  const isAdmin = isGroup && currentUserMember?.role === 'admin';

  // Mute / Archive states
  const isMuted = Boolean(
    currentUserMember?.mutedUntil && new Date(currentUserMember.mutedUntil) > new Date(),
  );
  const isArchived = Boolean(currentUserMember?.isArchived);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setNewGroupName(displayName);
      progress.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
    } else if (isMounted) {
      handleCloseAnimation();
    }
  }, [visible]);

  const completeClose = () => {
    setIsMounted(false);
    onClose();
  };

  const handleCloseAnimation = () => {
    progress.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(completeClose)();
        }
      },
    );
  };

  // ── ADMIN HANDLERS ─────────────────────────────────────────────────────────

  const handlePickAvatar = async () => {
    if (!isAdmin) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await updateConvMutation.mutateAsync({ avatarUrl: asset.uri });
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện nhóm!');
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện.');
    }
  };

  const handleSaveGroupName = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === displayName) {
      setIsEditingName(false);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await updateConvMutation.mutateAsync({ name: trimmed });
      setIsEditingName(false);
      Alert.alert('Thành công', 'Đã thay đổi tên nhóm!');
    } catch (error) {
      console.error('Update group name error:', error);
      Alert.alert('Lỗi', 'Không thể đổi tên nhóm.');
    }
  };

  const handleToggleMute = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      // Mute for 1 year or unmute
      const mutedUntil = val
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      await muteConvMutation.mutateAsync({ id: conversationId, mutedUntil });
    } catch (error) {
      console.error('Mute error:', error);
    }
  };

  const handleToggleArchive = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await archiveConvMutation.mutateAsync({ id: conversationId, isArchived: val });
    } catch (error) {
      console.error('Archive error:', error);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const res = await generateInviteMutation.mutateAsync();
      const code = res.data?.inviteCode;
      if (code) {
        const link = `https://huduchat.app/join/${code}`;
        Clipboard.setString(link);
        Alert.alert('Đã sao chép link mời!', `Link tham gia nhóm:\n${link}`);
      }
    } catch (error) {
      console.error('Invite code error:', error);
      Alert.alert('Lỗi', 'Không thể tạo mã mời lúc này.');
    }
  };

  const handleRemoveMemberAction = (memberUserId: string, username: string) => {
    if (!isAdmin) return;

    Alert.alert('Xác nhận', `Bạn có chắc muốn xóa "${username}" khỏi nhóm?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberMutation.mutateAsync(memberUserId);
            Alert.alert('Thành công', `Đã xóa ${username} khỏi nhóm.`);
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa thành viên này.');
          }
        },
      },
    ]);
  };

  const handleAddMemberSubmit = async () => {
    const trimmed = addMemberInput.trim();
    if (!trimmed) return;

    try {
      await addMembersMutation.mutateAsync([trimmed]);
      setAddMemberInput('');
      setShowAddMemberInput(false);
      Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không tìm thấy người dùng hoặc thêm thất bại.');
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Rời khỏi nhóm', 'Bạn có chắc chắn muốn rời khỏi nhóm này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Rời nhóm',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveConvMutation.mutateAsync(conversationId);
            handleCloseAnimation();
            router.replace('/(protected)/(tabs)');
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể rời nhóm lúc này.');
          }
        },
      },
    ]);
  };

  // Reanimated slide-from-right transform
  const screenAnimatedStyle = useAnimatedStyle(() => {
    const translateX = (1 - progress.value) * screenWidth;
    return {
      transform: [{ translateX }],
    };
  });

  if (!isMounted && !visible) return null;

  return (
    <Modal
      visible={isMounted}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCloseAnimation}
    >
      <Animated.View style={[{ flex: 1, backgroundColor: '#F4F5FB' }, screenAnimatedStyle]}>
        {/* ── TOP HEADER BAR (Clean Messenger Style: No top title text) ── */}
        <View
          style={{ paddingTop: Math.max(insets.top, 12) }}
          className="bg-[#F4F5FB] px-4 pb-2 flex-row items-center justify-between"
        >
          <Pressable
            onPress={handleCloseAnimation}
            className="justify-center items-center w-10 h-10 bg-white rounded-full border border-gray-200 active:bg-gray-100 shadow-xs"
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </Pressable>

          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
          {/* ── PROFILE & AVATAR SECTION ── */}
          <View className="items-center py-2 my-2">
            <View className="relative">
              {avatarUrl ? (
                <Image
                  source={{ uri: getFullFileUrl(avatarUrl) }}
                  className="w-24 h-24 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <View className="h-24 w-24 rounded-full bg-[#6f6bff] items-center justify-center shadow-md">
                  <Text className="text-3xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Admin Avatar Camera Edit Badge */}
              {isAdmin && (
                <Pressable
                  onPress={handlePickAvatar}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#6f6bff] items-center justify-center border-2 border-white shadow-md active:opacity-80"
                >
                  <Ionicons name="camera" size={16} color="#FFF" />
                </Pressable>
              )}

              {/* Online Indicator for 1-on-1 */}
              {!isGroup && (
                <View
                  className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white ${
                    isOtherOnline ? 'bg-[#57C95B]' : 'bg-gray-300'
                  }`}
                />
              )}
            </View>

            {/* Display Name with Admin Pencil Edit */}
            {isEditingName ? (
              <View className="flex-row items-center px-4 mt-3">
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  autoFocus
                  className="flex-1 bg-white border border-[#6f6bff] rounded-xl px-3 py-2 text-lg font-bold text-gray-900"
                />
                <Pressable
                  onPress={handleSaveGroupName}
                  className="ml-2 bg-[#6f6bff] px-3 py-2.5 rounded-xl active:opacity-80"
                >
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => isAdmin && setIsEditingName(true)}
                className="flex-row items-center px-4 mt-3 active:opacity-80"
              >
                <Text
                  className="text-2xl font-bold text-gray-900 text-center mr-1.5"
                  numberOfLines={2}
                >
                  {displayName}
                </Text>
                {isAdmin && <Ionicons name="pencil" size={18} color="#6f6bff" />}
              </Pressable>
            )}

            <Text className="mt-1 text-sm font-medium text-gray-500">
              {isGroup
                ? `${members.length} thành viên`
                : isOtherOnline
                  ? 'Đang hoạt động'
                  : 'Ngoại tuyến'}
            </Text>

            {/* Messenger Quick Action Round Buttons */}
            <View className="flex-row gap-6 justify-center items-center mt-5 mb-2">
              <Pressable className="items-center">
                <View className="justify-center items-center w-11 h-11 bg-white rounded-full border border-gray-200 shadow-xs active:bg-gray-100">
                  <Ionicons name="call" size={20} color="#1F2937" />
                </View>
                <Text className="mt-1.5 text-xs font-semibold text-gray-700">Gọi thoại</Text>
              </Pressable>

              <Pressable className="items-center">
                <View className="justify-center items-center w-11 h-11 bg-white rounded-full border border-gray-200 shadow-xs active:bg-gray-100">
                  <Ionicons name="videocam" size={20} color="#1F2937" />
                </View>
                <Text className="mt-1.5 text-xs font-semibold text-gray-700">Gọi video</Text>
              </Pressable>

              <Pressable onPress={() => handleToggleMute(!isMuted)} className="items-center">
                <View
                  className={`h-11 w-11 rounded-full border justify-center items-center shadow-xs active:opacity-80 ${
                    isMuted ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <Ionicons
                    name={isMuted ? 'notifications-off' : 'notifications'}
                    size={20}
                    color={isMuted ? '#F43F5E' : '#1F2937'}
                  />
                </View>
                <Text className="mt-1.5 text-xs font-semibold text-gray-700">
                  {isMuted ? 'Đã tắt thông báo' : 'Tắt thông báo'}
                </Text>
              </Pressable>

              <Pressable className="items-center">
                <View className="justify-center items-center w-11 h-11 bg-white rounded-full border border-gray-200 shadow-xs active:bg-gray-100">
                  <Ionicons name="search" size={20} color="#1F2937" />
                </View>
                <Text className="mt-1.5 text-xs font-semibold text-gray-700">Tìm kiếm</Text>
              </Pressable>
            </View>
          </View>

          {/* ── SECTION 1: THÔNG TIN VỀ ĐOẠN CHAT ── */}
          <Text className="px-3 mb-2 text-base font-bold text-gray-400">
            Thông tin về đoạn chat
          </Text>
          <View className="p-1 mb-5 bg-white rounded-2xl border border-gray-100 shadow-xs">
            {/* Xem thành viên (Group only) */}
            {isGroup && (
              <Pressable
                onPress={() => setShowMembersModal(true)}
                className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                    <Ionicons name="people-outline" size={20} color="#1F2937" />
                  </View>
                  <Text className="text-[16px] font-semibold text-gray-800">
                    Xem thành viên nhóm ({members.length})
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            )}

            {/* Tin nhắn đã ghim */}
            <Pressable
              onPress={() => setShowPinnedModal(true)}
              className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
            >
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons name="pin-outline" size={20} color="#1F2937" />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">
                  Tin nhắn đã ghim ({pinnedMessages.length})
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Tìm kiếm trong cuộc trò chuyện */}
            <Pressable
              onPress={() => setShowSearchModal(true)}
              className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
            >
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons name="search-outline" size={20} color="#1F2937" />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">
                  Tìm kiếm trong cuộc trò chuyện
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* ── SECTION 2: FILE PHƯƠNG TIỆN, FILE & LIÊN KẾT ── */}
          <Text className="px-3 mb-2 text-base font-bold text-gray-400">
            File phương tiện, file & liên kết
          </Text>
          <View className="p-1 mb-5 bg-white rounded-2xl border border-gray-100 shadow-xs">
            {/* Ảnh & Video đã gửi */}
            <Pressable
              onPress={() => setShowMediaModal(true)}
              className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
            >
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons name="images-outline" size={20} color="#1F2937" />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">
                  File phương tiện, ảnh & video ({displayMediaList.length})
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Shared Media Preview Grid */}
            {displayMediaList.length > 0 && (
              <View className="flex-row flex-wrap gap-2 px-3 pt-1 pb-3">
                {displayMediaList.slice(0, 4).map((item) => (
                  <Image
                    key={item._id}
                    source={{ uri: item.url }}
                    className="w-16 h-16 bg-gray-100 rounded-xl"
                  />
                ))}
              </View>
            )}

            {/* File đính kèm & Liên kết */}
            <Pressable
              onPress={() => setShowFilesModal(true)}
              className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
            >
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons name="document-attach-outline" size={20} color="#1F2937" />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">
                  Tệp đính kèm & Liên kết ({fileAttachments.length})
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* ── SECTION 3: QUYỀN RIÊNG TƯ & HÀNH ĐỘNG ── */}
          <Text className="px-3 mb-2 text-base font-bold text-gray-400">
            Quyền riêng tư & Hành động
          </Text>
          <View className="p-1 mb-8 bg-white rounded-2xl border border-gray-100 shadow-xs">
            {/* Thông báo cuộc trò chuyện */}
            <View className="flex-row justify-between items-center px-3 py-2 rounded-xl">
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons
                    name={isMuted ? 'notifications-off-outline' : 'notifications-outline'}
                    size={20}
                    color="#1F2937"
                  />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">Tắt thông báo</Text>
              </View>
              <Switch
                value={isMuted}
                onValueChange={handleToggleMute}
                trackColor={{ false: '#E5E7EB', true: '#6f6bff' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Lưu trữ cuộc trò chuyện */}
            <View className="flex-row justify-between items-center px-3 py-2 rounded-xl">
              <View className="flex-row items-center">
                <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                  <Ionicons name="archive-outline" size={20} color="#1F2937" />
                </View>
                <Text className="text-[16px] font-semibold text-gray-800">Lưu trữ trò chuyện</Text>
              </View>
              <Switch
                value={isArchived}
                onValueChange={handleToggleArchive}
                trackColor={{ false: '#E5E7EB', true: '#6f6bff' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Tạo mã / link mời tham gia nhóm (Group only) */}
            {isGroup && (
              <Pressable
                onPress={handleGenerateInvite}
                disabled={generateInviteMutation.isPending}
                className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-9 h-9 bg-gray-100 rounded-full">
                    <Ionicons name="link-outline" size={20} color="#1F2937" />
                  </View>
                  <Text className="text-[16px] font-semibold text-gray-800">
                    Mã mời tham gia nhóm
                  </Text>
                </View>
                {generateInviteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#6f6bff" />
                ) : (
                  <Ionicons name="copy-outline" size={18} color="#1F2937" />
                )}
              </Pressable>
            )}

            {/* Rời khỏi nhóm hoặc Chặn */}
            {isGroup ? (
              <Pressable
                onPress={handleLeaveGroup}
                className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-red-50"
              >
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-9 h-9 bg-red-50 rounded-full">
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="text-[16px] font-semibold text-red-600">Rời khỏi nhóm</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Chặn người dùng',
                    'Tính năng chặn người dùng đã sẵn sàng trên hệ thống.',
                  )
                }
                className="flex-row justify-between items-center px-3 py-3 rounded-xl active:bg-red-50"
              >
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-9 h-9 bg-red-50 rounded-full">
                    <Ionicons name="ban-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="text-[16px] font-semibold text-red-600">Chặn người dùng</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* ── MEMBERS LIST MODAL ── */}
        <Modal visible={showMembersModal} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              className="max-h-[85%] bg-white rounded-t-[32px] px-5 pt-3"
            >
              <View className="items-center py-2">
                <View className="h-1.5 w-12 rounded-full bg-gray-300" />
              </View>

              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-lg font-bold text-gray-900">
                  Thành viên nhóm ({members.length})
                </Text>
                <Pressable
                  onPress={() => setShowMembersModal(false)}
                  className="justify-center items-center w-9 h-9 bg-gray-100 rounded-full"
                >
                  <Ionicons name="close" size={22} color="#4B5563" />
                </Pressable>
              </View>

              {/* Member Search Bar */}
              <View className="flex-row items-center px-3 py-2 my-2 bg-gray-100 rounded-xl">
                <Ionicons name="search" size={16} color="#9CA3AF" className="mr-2" />
                <TextInput
                  placeholder="Tìm kiếm thành viên trong nhóm..."
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                  className="flex-1 py-0 text-sm text-gray-900"
                />
                {memberSearchQuery.length > 0 && (
                  <Pressable onPress={() => setMemberSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>

              {/* Add Member Bar for Admin */}
              {isAdmin && (
                <View className="mb-3">
                  {showAddMemberInput ? (
                    <View className="flex-row gap-2 items-center">
                      <TextInput
                        placeholder="Nhập ID người dùng..."
                        value={addMemberInput}
                        onChangeText={setAddMemberInput}
                        className="flex-1 px-3 py-2 text-sm text-gray-900 bg-gray-100 rounded-xl"
                      />
                      <Pressable
                        onPress={handleAddMemberSubmit}
                        className="bg-[#6f6bff] px-3 py-2 rounded-xl"
                      >
                        <Text className="text-xs font-bold text-white">Thêm</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setShowAddMemberInput(true)}
                      className="flex-row justify-center items-center p-3 bg-blue-50 rounded-xl border border-blue-100"
                    >
                      <Ionicons name="person-add" size={18} color="#6f6bff" className="mr-2" />
                      <Text className="text-sm font-semibold text-[#6f6bff]">
                        Thêm thành viên mới
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <ScrollView className="mt-2">
                {filteredMembers.map((m) => {
                  const u = m.userId;
                  const isMeMember = u._id === currentUserId;
                  const isMemberAdmin = m.role === 'admin';

                  return (
                    <View
                      key={u._id}
                      className="flex-row justify-between items-center px-1 py-3 border-b border-gray-50"
                    >
                      <View className="flex-row items-center">
                        {u.avatar ? (
                          <Image
                            source={{ uri: u.avatar }}
                            className="mr-3 w-11 h-11 rounded-full"
                          />
                        ) : (
                          <View className="h-11 w-11 rounded-full bg-[#6f6bff] items-center justify-center mr-3">
                            <Text className="text-base font-bold text-white">
                              {u.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text className="text-[16px] font-semibold text-gray-900">
                            {u.username} {isMeMember ? '(Bạn)' : ''}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {isMemberAdmin ? 'Trưởng nhóm' : 'Thành viên'}
                          </Text>
                        </View>
                      </View>

                      {/* Remove Button for Admin */}
                      {isAdmin && !isMeMember && (
                        <Pressable
                          onPress={() => handleRemoveMemberAction(u._id, u.username)}
                          className="p-2 rounded-full active:bg-red-50"
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── PINNED MESSAGES MODAL ── */}
        <Modal visible={showPinnedModal} animationType="slide" transparent={false}>
          <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-[#F4F5FB]">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
              <Pressable
                onPress={() => setShowPinnedModal(false)}
                className="justify-center items-center w-10 h-10 bg-gray-100 rounded-full active:bg-gray-200"
              >
                <Ionicons name="close" size={22} color="#1F2937" />
              </Pressable>
              <Text className="text-base font-bold text-gray-900">Tin nhắn đã ghim</Text>
              {/* Capacity pill */}
              <View className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                <Text className="text-xs font-bold text-[#6f6bff]">{pinnedMessages.length}/5</Text>
              </View>
            </View>

            {pinnedMessages.length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <View className="justify-center items-center mb-4 w-20 h-20 bg-amber-50 rounded-full">
                  <Ionicons name="pin-outline" size={40} color="#D97706" />
                </View>
                <Text className="text-base font-bold text-center text-gray-700">
                  Chưa có tin nhắn nào được ghim
                </Text>
                <Text className="mt-1.5 text-sm text-center text-gray-400">
                  {'Nhấn giữ một tin nhắn và chọn "Ghim" để đánh dấu nó ở đây.'}
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
                {pinnedMessages.map((msg, index) => {
                  const sender = msg.senderId;
                  const senderName = typeof sender === 'object' ? sender.username : 'Người dùng';
                  const senderAvatar = getFullFileUrl(
                    typeof sender === 'object' ? sender.avatar : undefined,
                  );
                  const pinTime = msg.pinnedAt
                    ? new Date(msg.pinnedAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <View
                      key={msg._id}
                      className="overflow-hidden mb-3 bg-white rounded-3xl border border-gray-100"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.06,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      {/* Pin index banner */}
                      <View className="flex-row justify-between items-center px-4 pt-3 pb-2">
                        <View className="flex-row items-center">
                          <View className="justify-center items-center mr-2 w-5 h-5 bg-amber-500 rounded-full">
                            <Text className="text-[10px] font-bold text-white">{index + 1}</Text>
                          </View>
                          <FontAwesome5 name="thumbtack" size={11} color="#D97706" />
                          <Text className="ml-1 text-xs font-bold text-amber-600">Đã ghim</Text>
                        </View>
                        {pinTime ? (
                          <Text className="text-[10px] text-gray-400">{pinTime}</Text>
                        ) : null}
                      </View>

                      {/* Message content row */}
                      <View className="flex-row items-start px-4 pb-3">
                        {/* Avatar */}
                        <View className="mr-3 mt-0.5">
                          {senderAvatar ? (
                            <Image
                              source={{ uri: senderAvatar }}
                              className="w-9 h-9 rounded-full"
                            />
                          ) : (
                            <View className="w-9 h-9 rounded-full bg-[#6f6bff] items-center justify-center">
                              <Text className="text-sm font-bold text-white">
                                {senderName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Text */}
                        <View className="flex-1 mr-3">
                          <Text className="text-sm font-bold text-gray-900 mb-0.5">
                            {senderName}
                          </Text>
                          <Text className="text-sm leading-5 text-gray-700" numberOfLines={3}>
                            {msg.content || (msg.attachmentIds?.length ? '[Tệp đính kèm]' : '')}
                          </Text>
                        </View>

                        {/* Unpin button */}
                        <Pressable
                          onPress={() => togglePinMutation.mutate(msg._id)}
                          className="p-2 bg-amber-50 rounded-full active:bg-amber-100"
                        >
                          <FontAwesome5 name="thumbtack" size={15} color="#D97706" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}

                {pinnedMessages.length >= 5 && (
                  <View className="flex-row items-center px-4 py-3 mb-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <Ionicons name="information-circle-outline" size={18} color="#D97706" />
                    <Text className="flex-1 ml-2 text-xs text-amber-700">
                      Đã đạt giới hạn 5 tin nhắn ghim. Bỏ ghim một tin nhắn trước khi ghim thêm.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* ── IN-CHAT SEARCH MODAL ── */}
        <Modal visible={showSearchModal} animationType="slide" transparent={false}>
          <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-white">
            {/* Search Header */}
            <View className="flex-row items-center px-4 pb-3 border-b border-gray-100">
              <Pressable
                onPress={() => {
                  setShowSearchModal(false);
                  setInChatSearchQuery('');
                }}
                className="justify-center items-center mr-3 w-10 h-10 bg-gray-100 rounded-full"
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </Pressable>

              <View className="flex-row flex-1 items-center px-3 py-2 bg-gray-100 rounded-full">
                <Ionicons name="search" size={18} color="#6B7280" className="mr-2" />
                <TextInput
                  placeholder="Tìm kiếm tin nhắn..."
                  value={inChatSearchQuery}
                  onChangeText={setInChatSearchQuery}
                  autoFocus
                  className="flex-1 py-0 text-base text-gray-900"
                />
                {inChatSearchQuery.length > 0 && (
                  <Pressable onPress={() => setInChatSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Search Results */}
            {inChatSearchQuery.trim().length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <Ionicons name="search-outline" size={56} color="#D1D5DB" />
                <Text className="mt-4 text-base font-semibold text-center text-gray-400">
                  Nhập từ khóa để tìm kiếm tin nhắn trong cuộc trò chuyện này
                </Text>
              </View>
            ) : searchQueryRes.isLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#6f6bff" />
              </View>
            ) : searchResults.length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <Ionicons name="document-text-outline" size={56} color="#9CA3AF" />
                <Text className="mt-4 text-base font-semibold text-center text-gray-500">
                  Không tìm thấy tin nhắn nào phù hợp với &quot;{inChatSearchQuery}&quot;
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 px-4 py-3">
                <Text className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Kết quả tìm kiếm ({searchResults.length})
                </Text>
                {searchResults.map((item) => {
                  const sender = item.senderId;
                  const senderName = typeof sender === 'object' ? sender.username : 'Người dùng';
                  const avatarUrl = getFullFileUrl(
                    typeof sender === 'object' ? sender.avatar : undefined,
                  );
                  const msgTime = new Date(item.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <Pressable
                      key={item._id}
                      onPress={() => {
                        setShowSearchModal(false);
                        onClose();
                      }}
                      className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100"
                    >
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          className="mr-3 w-10 h-10 rounded-full"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-[#6f6bff] items-center justify-center mr-3">
                          <Text className="text-sm font-bold text-white">
                            {senderName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm font-bold text-gray-900">{senderName}</Text>
                          <Text className="text-xs text-gray-400">{msgTime}</Text>
                        </View>
                        <Text className="mt-1 text-sm text-gray-700" numberOfLines={2}>
                          {item.content}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* ── SHARED MEDIA GALLERY MODAL ── */}
        <Modal visible={showMediaModal} animationType="slide" transparent={false}>
          <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-black">
            <View className="flex-row justify-between items-center px-4 pb-3 border-b border-white/10">
              <Pressable
                onPress={() => setShowMediaModal(false)}
                className="justify-center items-center w-10 h-10 rounded-full bg-white/10"
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
              <Text className="text-lg font-bold text-white">
                File phương tiện, ảnh & video ({displayMediaList.length})
              </Text>
              <View className="w-10" />
            </View>

            {displayMediaList.length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <Ionicons name="images-outline" size={56} color="#6B7280" />
                <Text className="mt-4 text-base font-bold text-center text-gray-400">
                  Chưa có hình ảnh hoặc video nào
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 p-3">
                <View className="flex-row flex-wrap gap-2">
                  {displayMediaList.map((item) => (
                    <Image
                      key={item._id}
                      source={{ uri: item.url }}
                      style={{ width: (screenWidth - 32) / 3, height: (screenWidth - 32) / 3 }}
                      className="rounded-xl bg-[#222]"
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* ── SHARED FILES & LINKS MODAL ── */}
        <Modal visible={showFilesModal} animationType="slide" transparent={false}>
          <View style={{ paddingTop: Math.max(insets.top, 12) }} className="flex-1 bg-white">
            <View className="flex-row justify-between items-center px-4 pb-3 border-b border-gray-100">
              <Pressable
                onPress={() => setShowFilesModal(false)}
                className="justify-center items-center w-10 h-10 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900">
                Tệp đính kèm & Liên kết ({fileAttachments.length})
              </Text>
              <View className="w-10" />
            </View>

            {fileAttachments.length === 0 ? (
              <View className="flex-1 justify-center items-center px-8">
                <Ionicons name="document-text-outline" size={56} color="#9CA3AF" />
                <Text className="mt-4 text-base font-bold text-center text-gray-400">
                  Chưa có tệp đính kèm nào
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1 p-4">
                {fileAttachments.map((file: MessageAttachment) => (
                  <View
                    key={file._id}
                    className="flex-row items-center justify-between p-3.5 mb-2 bg-[#F4F5FB] rounded-2xl border border-gray-100"
                  >
                    <View className="flex-row flex-1 items-center mr-3">
                      <View className="justify-center items-center mr-3 w-10 h-10 bg-blue-50 rounded-xl">
                        <Ionicons name="document-text" size={22} color="#6f6bff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {file.fileName || 'Tệp đính kèm'}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB •{' '}
                          {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => Alert.alert('Đang mở file', file.url)}
                      className="p-2 bg-white rounded-full border border-gray-200"
                    >
                      <Ionicons name="download-outline" size={18} color="#6f6bff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>
      </Animated.View>
    </Modal>
  );
}
