'use client';

import { useMemo, useState } from 'react';
import { Layout, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';

import { useGetMe, useLogout } from '@/hook/useAuth';
import { useGetListBlockUser, useBlockUser, useUnBlockUser } from '@/hook/useUser';
import { useFriends } from '@/hook/useFriend';
import { useConversationDetail, useCreateDirectConversation } from '@/hook/useConversations';
import { useListMessages, useSendMessage } from '@/hook/useMessages';
import { notify } from '@/lib/notify';
import { useChatStore } from '@/store/useChatStore';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import { useIsMobile } from '@/hook/useMediaQuery';
import type { User } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import type { MessageType } from '@/types/message';

import Sidebar from './_components/Sidebar';
import ChatWindow from './_components/ChatWindow';
import ProfileDrawer from './_components/ProfileDrawer';
import BlockedUsersModal from './_components/BlockedUsersModal';

const BLOCKED_LIST_PARAMS = { page: 1, pageSize: 50 };

const ChatPage = () => {
  const router = useRouter();
  const { modal } = App.useApp();
  const isMobile = useIsMobile();

  const [profileOpen, setProfileOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);

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

  const logoutMutation = useLogout();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnBlockUser();
  const createDirectMutation = useCreateDirectConversation();

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
    <Layout style={{ height: '100vh', overflow: 'hidden', flexDirection: 'row' }}>
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
