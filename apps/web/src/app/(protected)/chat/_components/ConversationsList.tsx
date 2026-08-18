'use client';

import { App, Avatar, Badge, Dropdown, Empty, Flex, Skeleton, Typography } from 'antd';
import { TeamOutlined, MutedOutlined, InboxOutlined, MoreOutlined } from '@ant-design/icons';
import { ExclamationCircleFilled } from '@ant-design/icons';
import type { AxiosError } from 'axios';
import { colorForId, initialOf } from '@/lib/avatar';
import {
  useListConversations,
  useMuteConversation,
  useArchiveConversation,
  useLeaveConversation,
} from '@/hook/useConversations';
import { notify } from '@/lib/notify';
import type { ConversationListItem } from '@/types/conversation';
import type { ApiResponse } from '@/types/api';

const { Text } = Typography;

const MUTE_FOREVER = '2099-12-31T00:00:00.000Z';
const LIST_PARAMS = { page: 1, pageSize: 50 };

const formatConversationTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  return isSameDay
    ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const getDisplayName = (item: ConversationListItem) =>
  item.type === 'group' ? item.name || 'Nhóm chat' : item.otherMember?.username || 'Người dùng';

const getAvatarUrl = (item: ConversationListItem) =>
  item.type === 'group' ? item.avatar : item.otherMember?.avatar;

const ATTACHMENT_PREVIEW_BY_TYPE: Partial<Record<string, string>> = {
  image: '[Hình ảnh]',
  file: '[Tệp đính kèm]',
  video: '[Video]',
  audio: '[Âm thanh]',
};

const getLastMessagePreview = (item: ConversationListItem, currentUserId?: string) => {
  const lastMessage = item.lastMessage;
  if (!lastMessage) {
    return item.type === 'group' ? 'Nhóm chat' : 'Trò chuyện riêng tư';
  }
  if (lastMessage.isDeleted) return 'Tin nhắn đã được thu hồi';

  const isMine = lastMessage.senderId._id === currentUserId;
  const prefix = isMine
    ? 'Bạn: '
    : item.type === 'group'
      ? `${lastMessage.senderId.username}: `
      : '';
  const content = ATTACHMENT_PREVIEW_BY_TYPE[lastMessage.type] || lastMessage.content;
  return `${prefix}${content}`;
};

interface ConversationsListProps {
  selectedConversationId?: string | null;
  onSelect?: (conversationId: string) => void;
  currentUserId?: string;
}

const ConversationsList = ({
  selectedConversationId,
  onSelect,
  currentUserId,
}: ConversationsListProps) => {
  const { modal } = App.useApp();
  const { data, isLoading } = useListConversations(LIST_PARAMS);
  const muteMutation = useMuteConversation();
  const archiveMutation = useArchiveConversation();
  const leaveMutation = useLeaveConversation();

  const conversations = data?.data.items ?? [];

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<ApiResponse<null>>;
    notify.error(axiosErr.response?.data?.message || fallback);
  };

  const handleToggleMute = (item: ConversationListItem) => {
    const isMuted = !!item.memberSetting?.mutedUntil;
    muteMutation.mutate(
      { id: item._id, mutedUntil: isMuted ? null : MUTE_FOREVER },
      {
        onSuccess: () => notify.success(isMuted ? 'Đã bỏ tắt thông báo!' : 'Đã tắt thông báo!'),
        onError: (err) => handleApiError(err, 'Cập nhật thông báo thất bại!'),
      },
    );
  };

  const handleToggleArchive = (item: ConversationListItem) => {
    const isArchived = !!item.memberSetting?.isArchived;
    archiveMutation.mutate(
      { id: item._id, isArchived: !isArchived },
      {
        onSuccess: () => notify.success(isArchived ? 'Đã bỏ lưu trữ!' : 'Đã lưu trữ hội thoại!'),
        onError: (err) => handleApiError(err, 'Cập nhật lưu trữ thất bại!'),
      },
    );
  };

  const handleLeave = (item: ConversationListItem) => {
    modal.confirm({
      title: 'Rời khỏi hội thoại',
      icon: <ExclamationCircleFilled />,
      content: `Bạn có chắc chắn muốn rời khỏi "${getDisplayName(item)}"?`,
      okText: 'Rời khỏi',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        leaveMutation.mutate(item._id, {
          onSuccess: () => {
            notify.success('Đã rời khỏi hội thoại!');
            if (selectedConversationId === item._id) onSelect?.('');
          },
          onError: (err) => handleApiError(err, 'Rời khỏi hội thoại thất bại!'),
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <Skeleton avatar paragraph={{ rows: 1 }} active />
        <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 16 }} />
        <Skeleton avatar paragraph={{ rows: 1 }} active style={{ marginTop: 16 }} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Empty
        description="Chưa có cuộc trò chuyện nào"
        style={{ marginTop: 60 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      {conversations.map((conv) => {
        const isMuted = !!conv.memberSetting?.mutedUntil;
        const isArchived = !!conv.memberSetting?.isArchived;
        const displayName = getDisplayName(conv);
        const avatarUrl = getAvatarUrl(conv);
        const hasUnread = (conv.unreadCount || 0) > 0;

        return (
          <div
            key={conv._id}
            onClick={() => onSelect?.(conv._id)}
            className="chat-list-item"
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              cursor: 'pointer',
              background: selectedConversationId === conv._id ? '#eef0ff' : 'transparent',
              transition: 'background 0.2s',
              marginBottom: 2,
            }}
          >
            <Flex gap={12} align="center">
              <Avatar
                size={44}
                src={avatarUrl || undefined}
                icon={conv.type === 'group' ? <TeamOutlined /> : undefined}
                style={{ backgroundColor: colorForId(conv._id) }}
              >
                {conv.type === 'private' ? initialOf(displayName) : undefined}
              </Avatar>
              <Flex vertical flex={1} style={{ minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Text strong ellipsis style={{ maxWidth: 150 }}>
                    {displayName}
                  </Text>
                  {isMuted && <MutedOutlined style={{ color: '#9a9ab0', fontSize: 12 }} />}
                  {isArchived && <InboxOutlined style={{ color: '#9a9ab0', fontSize: 12 }} />}
                </Flex>
                <Text
                  type={hasUnread ? undefined : 'secondary'}
                  strong={hasUnread}
                  ellipsis
                  style={{ fontSize: 12 }}
                >
                  {getLastMessagePreview(conv, currentUserId)}
                </Text>
              </Flex>
              <Flex vertical align="flex-end" gap={4}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {formatConversationTime(conv.lastMessage?.createdAt || conv.lastMessageAt)}
                </Text>
                {hasUnread && (
                  <Badge count={conv.unreadCount} size="small" overflowCount={99} color="#5b5bf6" />
                )}
                <Dropdown
                  menu={{
                    items: [
                      { key: 'mute', label: isMuted ? 'Bỏ tắt thông báo' : 'Tắt thông báo' },
                      { key: 'archive', label: isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ' },
                      { key: 'leave', label: 'Rời khỏi hội thoại', danger: true },
                    ],
                    onClick: ({ key, domEvent }) => {
                      domEvent.stopPropagation();
                      if (key === 'mute') handleToggleMute(conv);
                      if (key === 'archive') handleToggleArchive(conv);
                      if (key === 'leave') handleLeave(conv);
                    },
                  }}
                  trigger={['click']}
                >
                  <MoreOutlined onClick={(e) => e.stopPropagation()} style={{ color: '#9a9ab0' }} />
                </Dropdown>
              </Flex>
            </Flex>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationsList;
