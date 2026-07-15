'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AxiosError } from 'axios';

import { useGetMe, useLogout } from '@/hook/useAuth';
import { useGetListBlockUser, useBlockUser, useUnBlockUser } from '@/hook/useUser';
import { useFriends } from '@/hook/useFriend';
import {
  useConversationDetail,
  useCreateDirectConversation,
  useJoinByInvite,
  useOpenBotConversation,
  useOpenSavedMessages,
} from '@/hook/useConversations';
import {
  retryMessagePayload,
  useListMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
} from '@/hook/useMessages';
import { notify } from '@/lib/notify';
import { registerWebPush } from '@/lib/push';
import { initTheme } from '@/lib/theme-preference';
import { useChatStore } from '@/store/useChatStore';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { useIsMobile } from '@/hook/useMediaQuery';
import type { User } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import type { Message, MessageType } from '@/types/message';

import Sidebar from './_components/Sidebar';
import ChatWindow from './_components/ChatWindow';
import ProfileDrawer from './_components/ProfileDrawer';
import BlockedUsersModal from './_components/BlockedUsersModal';

const BLOCKED_LIST_PARAMS = { page: 1, pageSize: 50 };

const ChatPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { modal } = App.useApp();
  const isMobile = useIsMobile();

  const [profileOpen, setProfileOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);
  const handledInviteToken = useRef<string | null>(null);

  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);

  const debouncedQuery = useDebouncedValue(searchQuery, 350);

  const { data: meData } = useGetMe();
  const currentUser = meData?.data;

  const { data: friendsData, isLoading: friendsLoading } = useFriends({
    q: debouncedQuery,
    page: 1,
    pageSize: 30,
  });
  const contacts: User[] = friendsData?.data.items ?? [];

  const { data: conversationDetailData } = useConversationDetail(selectedConversationId ?? '');
  const otherUserId = useMemo(() => {
    const conversation = conversationDetailData?.data.conversation;
    if (conversation?.type !== 'private') return null;
    const otherMember = conversationDetailData?.data.members.find(
      (m) => m.userId._id !== currentUser?._id,
    );
    return otherMember?.userId._id ?? null;
  }, [conversationDetailData, currentUser?._id]);

  const { data: blockedData } = useGetListBlockUser(BLOCKED_LIST_PARAMS);
  const blockedIds = useMemo(
    () => new Set((blockedData?.data.items ?? []).map((u) => u._id)),
    [blockedData],
  );
  const isSelectedBlocked = otherUserId ? blockedIds.has(otherUserId) : false;

  const { data: messagesData, isLoading: messagesLoading } = useListMessages(
    selectedConversationId ?? '',
    { limit: 30 },
  );
  const messages = messagesData?.data.items ?? [];
  const sendMessageMutation = useSendMessage(selectedConversationId ?? '');
  const editMessageMutation = useEditMessage(selectedConversationId ?? '');
  const deleteMessageMutation = useDeleteMessage(selectedConversationId ?? '');

  const logoutMutation = useLogout();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnBlockUser();
  const createDirectMutation = useCreateDirectConversation();
  const joinByInviteMutation = useJoinByInvite();
  const openSavedMutation = useOpenSavedMessages();
  const openBotMutation = useOpenBotConversation();

  useEffect(() => {
    initTheme();
    registerWebPush().catch(() => {});
  }, []);

  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    if (!inviteToken || handledInviteToken.current === inviteToken) return;

    handledInviteToken.current = inviteToken;
    joinByInviteMutation.mutate(inviteToken, {
      onSuccess: (response) => {
        setSelectedConversationId(response.data.conversation._id);
        notify.success('Bạn đã tham gia nhóm!');
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Không thể tham gia nhóm từ liên kết này!');
      },
      onSettled: () => router.replace('/chat'),
    });
  }, [joinByInviteMutation, router, searchParams, setSelectedConversationId]);

  const openSpecialConversation = (
    mutation: typeof openSavedMutation,
    fallbackError: string,
  ) => {
    mutation.mutate(undefined, {
      onSuccess: (res) => setSelectedConversationId(res.data.conversation._id),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || fallbackError);
      },
    });
  };

  const handleLogout = () => {
    modal.confirm({
      title: 'Đăng xuất',
      icon: <ExclamationCircleFilled />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi Halo Chat?',
      okText: 'Đăng xuất',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        logoutMutation.mutate(undefined, {
          onSuccess: () => {
            router.push('/signin');
            router.refresh();
          },
          onError: () => {
            notify.error('Đăng xuất thất bại. Vui lòng thử lại!');
          },
        });
      },
    });
  };

  const handleToggleBlock = () => {
    if (!otherUserId) return;
    if (isSelectedBlocked) {
      unblockMutation.mutate(otherUserId, {
        onSuccess: () => notify.success('Đã bỏ chặn người dùng!'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Bỏ chặn thất bại!');
        },
      });
    } else {
      blockMutation.mutate(otherUserId, {
        onSuccess: () => notify.success('Đã chặn người dùng!'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Chặn người dùng thất bại!');
        },
      });
    }
  };

  const handleSendMessage = (
    text: string,
    attachmentIds?: string[],
    type?: MessageType,
    replyToMessageId?: string,
  ) => {
    if (!selectedConversationId) return;
    sendMessageMutation.mutate(
      { content: text, attachmentIds, type, replyToMessageId },
      {
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Gửi tin nhắn thất bại!');
        },
      },
    );
  };

  const handleEditMessage = (messageId: string, content: string) => {
    if (!selectedConversationId) return;
    editMessageMutation.mutate(
      { id: messageId, content },
      {
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Chỉnh sửa tin nhắn thất bại!');
        },
      },
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedConversationId) return;
    deleteMessageMutation.mutate(messageId, {
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Thu hồi tin nhắn thất bại!');
      },
    });
  };

  const handleRetryMessage = (message: Message) => {
    if (!selectedConversationId) return;
    sendMessageMutation.mutate(retryMessagePayload(message), {
      onError: () => notify.error('Gửi lại tin nhắn thất bại!'),
    });
  };

  const handleSelectContact = (user: User) => {
    setPendingContactId(user._id);
    createDirectMutation.mutate(user._id, {
      onSuccess: (res) => {
        setSelectedConversationId(res.data.conversation._id);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiResponse<null>>;
        notify.error(axiosErr.response?.data?.message || 'Không thể mở cuộc trò chuyện!');
      },
      onSettled: () => setPendingContactId(null),
    });
  };

  const showSidebar = !isMobile || !selectedConversationId;
  const showChatWindow = !isMobile || !!selectedConversationId;

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', flexDirection: 'row', display: 'flex' }}>
      {showSidebar && (
        <Sidebar
          currentUser={currentUser}
          contacts={contacts}
          loading={friendsLoading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => setSelectedConversationId(id || null)}
          onSelectContact={handleSelectContact}
          contactActionLoadingId={pendingContactId}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenBlocked={() => setBlockedOpen(true)}
          onOpenSaved={() => openSpecialConversation(openSavedMutation, 'Không mở được tin nhắn đã lưu!')}
          onOpenBot={() => openSpecialConversation(openBotMutation, 'Không mở được HuduBot!')}
          onLogout={handleLogout}
          logoutLoading={logoutMutation.isPending}
        />
      )}

      {showChatWindow && (
        <ChatWindow
          conversationId={selectedConversationId}
          currentUserId={currentUser?._id}
          messages={selectedConversationId ? messages : []}
          messagesLoading={!!selectedConversationId && messagesLoading}
          onSend={handleSendMessage}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onRetry={handleRetryMessage}
          sendLoading={sendMessageMutation.isPending}
          isBlocked={isSelectedBlocked}
          onToggleBlock={handleToggleBlock}
          blockActionLoading={blockMutation.isPending || unblockMutation.isPending}
          isMobile={isMobile}
          onBack={() => setSelectedConversationId(null)}
        />
      )}

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
      />

      <BlockedUsersModal open={blockedOpen} onClose={() => setBlockedOpen(false)} />
    </Layout>
  );
};

export default ChatPage;
