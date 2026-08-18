'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Empty,
  Flex,
  Input,
  Skeleton,
  Spin,
  Tabs,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  StopOutlined,
  LogoutOutlined,
  MoreOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  TeamOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { User } from '@/types/user';
import { colorForId, initialOf } from '@/lib/avatar';
import { useIncomingFriendRequests } from '@/hook/useFriend';
import { useChatStore, resolvePresence } from '@/store/useChatStore';
import ConversationsList from './ConversationsList';
import CreateGroupModal from './CreateGroupModal';
import AddFriendModal from './AddFriendModal';
import FriendRequestsModal from './FriendRequestsModal';
import NotificationBell from './NotificationBell';
import StoryBar from './StoryBar';

const { Text, Title } = Typography;

interface SidebarProps {
  currentUser?: User;
  contacts: User[];
  loading: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onSelectContact: (user: User) => void;
  contactActionLoadingId?: string | null;
  onOpenProfile: () => void;
  onOpenBlocked: () => void;
  onLogout: () => void;
  logoutLoading: boolean;
}

const Sidebar = ({
  currentUser,
  contacts,
  loading,
  searchValue,
  onSearchChange,
  selectedConversationId,
  onSelectConversation,
  onSelectContact,
  contactActionLoadingId,
  onOpenProfile,
  onOpenBlocked,
  onLogout,
  logoutLoading,
}: SidebarProps) => {
  const router = useRouter();
  const onlineStatusOverrides = useChatStore((s) => s.onlineStatusOverrides);
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);

  const { data: incomingData } = useIncomingFriendRequests();
  const incomingCount = incomingData?.data.length ?? 0;
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { key: 'profile', icon: <SettingOutlined />, label: 'Hồ sơ cá nhân' },
    {
      key: 'friendRequests',
      icon: <TeamOutlined />,
      label: (
        <Badge count={incomingCount} size="small" offset={[8, 0]}>
          Lời mời kết bạn
        </Badge>
      ),
    },
    { key: 'blocked', icon: <StopOutlined />, label: 'Người dùng đã chặn' },
    ...(isAdmin ? [{ key: 'admin', icon: <DashboardOutlined />, label: 'Quản trị hệ thống' }] : []),
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ];

  const handleMenuClick = (key: string) => {
    if (key === 'profile') onOpenProfile();
    if (key === 'friendRequests') setFriendRequestsOpen(true);
    if (key === 'blocked') onOpenBlocked();
    if (key === 'admin') router.push('/admin');
    if (key === 'logout') onLogout();
  };

  const handleGroupCreated = (conversationId: string) => {
    onSelectConversation(conversationId);
    setActiveTab('conversations');
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-[#eef0f7] bg-white md:w-85 md:min-w-85">
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid #f2f2f7',
        }}
      >
        <Avatar
          size={44}
          icon={<UserOutlined />}
          src={currentUser?.avatar || undefined}
          style={{ backgroundColor: currentUser ? colorForId(currentUser._id) : '#5b5bf6' }}
        >
          {currentUser ? initialOf(currentUser.username) : undefined}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={5} style={{ margin: 0 }} ellipsis>
            {currentUser?.username || 'Đang tải...'}
          </Title>
          <Text type="success" style={{ fontSize: 12 }}>
            ● Đang hoạt động
          </Text>
        </div>
        <NotificationBell />
        <Dropdown
          menu={{ items: menuItems, onClick: ({ key }) => handleMenuClick(key) }}
          trigger={['click']}
          disabled={logoutLoading}
        >
          <Button type="text" icon={<MoreOutlined />} loading={logoutLoading} />
        </Dropdown>
      </div>

      <StoryBar currentUser={currentUser} />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'conversations' | 'contacts')}
        style={{ padding: '0 16px' }}
        tabBarExtraContent={
          activeTab === 'conversations' ? (
            <Button
              type="text"
              size="small"
              icon={<UsergroupAddOutlined />}
              onClick={() => setCreateGroupOpen(true)}
              title="Tạo nhóm chat"
            />
          ) : (
            <Button
              type="text"
              size="small"
              icon={<UserAddOutlined />}
              onClick={() => setAddFriendOpen(true)}
              title="Thêm bạn"
            />
          )
        }
        items={[
          { key: 'conversations', label: 'Trò chuyện' },
          { key: 'contacts', label: 'Danh bạ' },
        ]}
      />

      {activeTab === 'contacts' && (
        <div style={{ padding: '0 16px 14px' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9a9ab0' }} />}
            placeholder="Tìm kiếm người dùng..."
            variant="filled"
            allowClear
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
        {activeTab === 'conversations' && (
          <ConversationsList
            selectedConversationId={selectedConversationId}
            onSelect={onSelectConversation}
            currentUserId={currentUser?._id}
          />
        )}

        {activeTab === 'contacts' && (
          <>
            {loading && (
              <div style={{ padding: '8px 12px' }}>
                <Skeleton avatar paragraph={{ rows: 1 }} active />
                <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 16 }} />
                <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 16 }} />
              </div>
            )}

            {!loading && contacts.length === 0 && (
              <Empty
                description={
                  searchValue
                    ? 'Không tìm thấy bạn bè nào phù hợp'
                    : 'Bạn chưa có bạn bè nào. Nhấn nút thêm bạn để bắt đầu!'
                }
                style={{ marginTop: 60 }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}

            {!loading &&
              contacts.map((user) => (
                <div
                  key={user._id}
                  onClick={() => onSelectContact(user)}
                  className="chat-list-item"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'background 0.2s',
                    marginBottom: 2,
                    opacity: contactActionLoadingId === user._id ? 0.6 : 1,
                  }}
                >
                  <Flex gap={12} align="center">
                    <Badge
                      dot={
                        resolvePresence(onlineStatusOverrides, user._id, user.status) === 'online'
                      }
                      color="green"
                      offset={[-4, 36]}
                    >
                      <Avatar
                        size={44}
                        src={user.avatar || undefined}
                        style={{ backgroundColor: colorForId(user._id) }}
                      >
                        {initialOf(user.username)}
                      </Avatar>
                    </Badge>
                    <Flex vertical flex={1} style={{ minWidth: 0 }}>
                      <Text strong ellipsis>
                        {user.username}
                      </Text>
                      <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                        {user.bio || user.email}
                      </Text>
                    </Flex>
                    {contactActionLoadingId === user._id && <Spin size="small" />}
                  </Flex>
                </div>
              ))}
          </>
        )}
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />

      <AddFriendModal open={addFriendOpen} onClose={() => setAddFriendOpen(false)} />

      <FriendRequestsModal open={friendRequestsOpen} onClose={() => setFriendRequestsOpen(false)} />
    </div>
  );
};

export default Sidebar;
