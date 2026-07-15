'use client';

import { Button, Drawer, Empty, Flex, Skeleton, Typography } from 'antd';
import { useChatStore } from '@/store/useChatStore';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hook/useNotifications';

const { Text } = Typography;

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsDrawer = ({ open, onClose }: NotificationsDrawerProps) => {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);

  const items = data?.data.items ?? [];
  const unreadCount = data?.data.meta.unreadCount ?? 0;

  const handleClick = (id: string, link?: string, isRead?: boolean) => {
    if (!isRead) markRead.mutate(id);
    if (link?.startsWith('/chat/')) {
      const conversationId = link.replace('/chat/', '').split(/[/?#]/)[0];
      if (conversationId) setSelectedConversationId(conversationId);
      onClose();
    }
  };

  return (
    <Drawer
      title="Thông báo"
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="link"
          size="small"
          disabled={unreadCount === 0}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Đọc tất cả
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : items.length === 0 ? (
        <Empty description="Chưa có thông báo" />
      ) : (
        items.map((item) => (
          <div
            key={item._id}
            style={{
              cursor: 'pointer',
              background: item.isRead ? 'transparent' : '#f4f5fb',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 6,
            }}
            onClick={() => handleClick(item._id, item.link, item.isRead)}
          >
            <Flex vertical gap={4} style={{ width: '100%' }}>
              <Text style={{ fontWeight: item.isRead ? 400 : 600 }}>{item.content}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {new Date(item.createdAt).toLocaleString('vi-VN')}
              </Text>
            </Flex>
          </div>
        ))
      )}
    </Drawer>
  );
};

export default NotificationsDrawer;
