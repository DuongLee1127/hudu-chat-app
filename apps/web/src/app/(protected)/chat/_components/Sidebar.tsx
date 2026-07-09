'use client';

import { useState } from 'react';
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
} from '@ant-design/icons';
import type { User } from '@/types/user';
import { colorForId, initialOf } from '@/lib/avatar';
import ConversationsList from './ConversationsList';
import CreateGroupModal from './CreateGroupModal';

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
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const menuItems = [
    { key: 'profile', icon: <SettingOutlined />, label: 'Hồ sơ cá nhân' },
    { key: 'blocked', icon: <StopOutlined />, label: 'Người dùng đã chặn' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ];

  const handleMenuClick = (key: string) => {
    if (key === 'profile') onOpenProfile();
    if (key === 'blocked') onOpenBlocked();
    if (key === 'logout') onLogout();
  };

  const handleGroupCreated = (conversationId: string) => {
    onSelectConversation(conversationId);
    setActiveTab('conversations');
  };

  return (
    <div
      style={{
        width: 340,
        minWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #eef0f7',
        background: '#fff',
      }}
    >
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
        <Dropdown
          menu={{ items: menuItems, onClick: ({ key }) => handleMenuClick(key) }}
          trigger={['click']}
          disabled={logoutLoading}
        >
          <Button type="text" icon={<MoreOutlined />} loading={logoutLoading} />
        </Dropdown>
      </div>

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
          ) : null
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
                description="Không tìm thấy người dùng nào"
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
                    <Badge dot={user.status === 'online'} color="green" offset={[-4, 36]}>
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
    </div>
  );
};

export default Sidebar;
