'use client';

import { useMemo, useState } from 'react';
import { Layout, App } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';

import { useGetMe, useLogout } from '@/hook/useAuth';
import {
  useSearchUsers,
  useGetListBlockUser,
  useBlockUser,
  useUnBlockUser,
  useViewProfilePublic,
} from '@/hook/useUser';
import { notify } from '@/lib/notify';
import { useChatStore } from '@/store/useChatStore';
import { useDebouncedValue } from '@/hook/useDebouncedValue';
import type { User } from '@/types/user';
import type { ApiResponse } from '@/types/api';

import Sidebar from './_components/Sidebar';
import ChatWindow from './_components/ChatWindow';
import ProfileDrawer from './_components/ProfileDrawer';
import BlockedUsersModal from './_components/BlockedUsersModal';

const BLOCKED_LIST_PARAMS = { page: 1, pageSize: 50 };

const ChatPage = () => {
  const router = useRouter();
  const { message, modal } = App.useApp();

  const [profileOpen, setProfileOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const setSelectedUserId = useChatStore((s) => s.setSelectedUserId);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const messagesByUser = useChatStore((s) => s.messagesByUser);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const debouncedQuery = useDebouncedValue(searchQuery, 350);

  const { data: meData } = useGetMe();
  const currentUser = meData?.data;

  const { data: searchData, isLoading: searchLoading } = useSearchUsers({
    q: debouncedQuery,
    page: 1,
    pageSize: 30,
  });
  const contacts: User[] = searchData?.data.items ?? [];

  const { data: selectedUserData } = useViewProfilePublic(selectedUserId ?? '');
  const selectedUser = selectedUserData?.data.publicUser ?? null;

  const { data: blockedData } = useGetListBlockUser(BLOCKED_LIST_PARAMS);
  const blockedIds = useMemo(
    () => new Set((blockedData?.data.items ?? []).map((u) => u._id)),
    [blockedData],
  );
  const isSelectedBlocked = selectedUserId ? blockedIds.has(selectedUserId) : false;

  const logoutMutation = useLogout();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnBlockUser();

  const handleLogout = () => {
    modal.confirm({
      title: 'Đăng xuất',
      icon: <ExclamationCircleFilled />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi Hudu Chat?',
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
    if (!selectedUserId) return;
    if (isSelectedBlocked) {
      unblockMutation.mutate(selectedUserId, {
        onSuccess: () => notify.success('Đã bỏ chặn người dùng!'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Bỏ chặn thất bại!');
        },
      });
    } else {
      blockMutation.mutate(selectedUserId, {
        onSuccess: () => notify.success('Đã chặn người dùng!'),
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiResponse<null>>;
          notify.error(axiosErr.response?.data?.message || 'Chặn người dùng thất bại!');
        },
      });
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', flexDirection: 'row' }}>
      <Sidebar
        currentUser={currentUser}
        contacts={contacts}
        loading={searchLoading}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        selectedUserId={selectedUserId}
        onSelect={(user) => setSelectedUserId(user._id)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenBlocked={() => setBlockedOpen(true)}
        onLogout={handleLogout}
        logoutLoading={logoutMutation.isPending}
      />

      <ChatWindow
        selectedUser={selectedUser}
        messages={selectedUserId ? (messagesByUser[selectedUserId] ?? []) : []}
        onSend={(text) => selectedUserId && sendMessage(selectedUserId, text)}
        isBlocked={isSelectedBlocked}
        onToggleBlock={handleToggleBlock}
        blockActionLoading={blockMutation.isPending || unblockMutation.isPending}
      />

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
