'use client';

import { Avatar, Badge, Dropdown, Empty, Flex, Typography } from 'antd';
import { TeamOutlined, MutedOutlined, InboxOutlined, MoreOutlined } from '@ant-design/icons';
import { colorForId, initialOf } from '@/lib/avatar';

const { Text } = Typography;

/**
 * MOCK UI ONLY — dữ liệu tĩnh, chưa nối API /api/conversations.
 * Dùng để dựng giao diện trước khi tích hợp thật ở giai đoạn sau.
 */
const MOCK_CONVERSATIONS = [
  {
    _id: 'mock-conv-1',
    type: 'private' as const,
    name: 'Nguyễn Văn A',
    avatar: '',
    lastMessage: 'Hẹn gặp bạn lúc 3h chiều nhé!',
    lastMessageAt: '10:24',
    unreadCount: 2,
    isArchived: false,
    isMuted: false,
  },
  {
    _id: 'mock-conv-2',
    type: 'group' as const,
    name: 'Team Frontend',
    avatar: '',
    lastMessage: 'Trần Thị B: Đã merge PR rồi nhé',
    lastMessageAt: '09:47',
    unreadCount: 0,
    isArchived: false,
    isMuted: true,
  },
  {
    _id: 'mock-conv-3',
    type: 'private' as const,
    name: 'Lê Văn C',
    avatar: '',
    lastMessage: 'Cảm ơn bạn nhiều!',
    lastMessageAt: 'Hôm qua',
    unreadCount: 0,
    isArchived: true,
    isMuted: false,
  },
  {
    _id: 'mock-conv-4',
    type: 'group' as const,
    name: 'Dự án Hudu Chat',
    avatar: '',
    lastMessage: 'Bạn: Đã cập nhật tài liệu API',
    lastMessageAt: 'Thứ 2',
    unreadCount: 5,
    isArchived: false,
    isMuted: false,
  },
];

interface ConversationsListProps {
  selectedConversationId?: string | null;
  onSelect?: (conversationId: string) => void;
}

const ConversationsList = ({ selectedConversationId, onSelect }: ConversationsListProps) => {
  if (MOCK_CONVERSATIONS.length === 0) {
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
      {MOCK_CONVERSATIONS.map((conv) => (
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
            <Badge count={conv.unreadCount} size="small" offset={[-4, 36]}>
              <Avatar
                size={44}
                src={conv.avatar || undefined}
                icon={conv.type === 'group' ? <TeamOutlined /> : undefined}
                style={{ backgroundColor: colorForId(conv._id) }}
              >
                {conv.type === 'private' ? initialOf(conv.name) : undefined}
              </Avatar>
            </Badge>
            <Flex vertical flex={1} style={{ minWidth: 0 }}>
              <Flex align="center" gap={6}>
                <Text strong ellipsis style={{ maxWidth: 150 }}>
                  {conv.name}
                </Text>
                {conv.isMuted && <MutedOutlined style={{ color: '#9a9ab0', fontSize: 12 }} />}
                {conv.isArchived && <InboxOutlined style={{ color: '#9a9ab0', fontSize: 12 }} />}
              </Flex>
              <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                {conv.lastMessage}
              </Text>
            </Flex>
            <Flex vertical align="flex-end" gap={4}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {conv.lastMessageAt}
              </Text>
              <Dropdown
                menu={{
                  items: [
                    { key: 'mute', label: conv.isMuted ? 'Bỏ tắt thông báo' : 'Tắt thông báo' },
                    { key: 'archive', label: conv.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ' },
                    { key: 'leave', label: 'Rời khỏi hội thoại', danger: true },
                  ],
                }}
                trigger={['click']}
              >
                <MoreOutlined
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#9a9ab0' }}
                />
              </Dropdown>
            </Flex>
          </Flex>
        </div>
      ))}
    </div>
  );
};

export default ConversationsList;
