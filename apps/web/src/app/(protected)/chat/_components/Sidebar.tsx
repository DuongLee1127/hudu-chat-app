'use client';

import { Avatar, Badge, Button, Dropdown, Empty, Flex, Input, Skeleton, Typography } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  StopOutlined,
  LogoutOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { User } from '@/types/user';
import { colorForId, initialOf } from '@/lib/avatar';

const { Text, Title } = Typography;

interface SidebarProps {
  currentUser?: User;
  contacts: User[];
  loading: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedUserId: string | null;
  onSelect: (user: User) => void;
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
  selectedUserId,
  onSelect,
  onOpenProfile,
  onOpenBlocked,
  onLogout,
  logoutLoading,
}: SidebarProps) => {
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

      <div style={{ padding: '14px 16px' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9a9ab0' }} />}
          placeholder="Tìm kiếm người dùng..."
          variant="filled"
          allowClear
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
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
              onClick={() => onSelect(user)}
              className="chat-list-item"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                cursor: 'pointer',
                background: selectedUserId === user._id ? '#eef0ff' : 'transparent',
                transition: 'background 0.2s',
                marginBottom: 2,
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
              </Flex>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Sidebar;
