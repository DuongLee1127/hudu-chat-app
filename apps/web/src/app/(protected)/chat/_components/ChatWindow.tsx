'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Button, Dropdown, Empty, Input, Typography } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  MoreOutlined,
  StopOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { User } from '@/types/user';
import type { ChatMessage } from '@/store/useChatStore';
import { colorForId, initialOf } from '@/lib/avatar';

const { Text, Title } = Typography;

interface ChatWindowProps {
  selectedUser: User | null;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isBlocked: boolean;
  onToggleBlock: () => void;
  blockActionLoading: boolean;
}

const ChatWindow = ({
  selectedUser,
  messages,
  onSend,
  isBlocked,
  onToggleBlock,
  blockActionLoading,
}: ChatWindowProps) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedUser?._id]);

  if (!selectedUser) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f5fb',
        }}
      >
        <Empty
          image={<MessageOutlined style={{ fontSize: 64, color: '#c6c9e8' }} />}
          description={
            <Text type="secondary">
              Chọn một người dùng ở danh sách bên trái để bắt đầu trò chuyện
            </Text>
          }
        />
      </div>
    );
  }

  const handleSend = () => {
    if (!draft.trim() || isBlocked) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f5fb' }}>
      <div
        style={{
          height: 72,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #eef0f7',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            src={selectedUser.avatar || undefined}
            style={{ backgroundColor: colorForId(selectedUser._id) }}
          >
            {initialOf(selectedUser.username)}
          </Avatar>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {selectedUser.username}
            </Title>
            <Text
              type={selectedUser.status === 'online' ? 'success' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {selectedUser.status === 'online' ? '● Đang hoạt động' : 'Ngoại tuyến'}
            </Text>
          </div>
        </div>
        <Dropdown
          menu={{
            items: [
              {
                key: 'block',
                icon: <StopOutlined />,
                danger: !isBlocked,
                label: isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng',
              },
            ],
            onClick: onToggleBlock,
          }}
          trigger={['click']}
          disabled={blockActionLoading}
        >
          <Button type="text" icon={<MoreOutlined />} loading={blockActionLoading} />
        </Dropdown>
      </div>

      {isBlocked && (
        <Alert
          type="warning"
          showIcon
          banner
          title="Bạn đã chặn người dùng này. Bỏ chặn để có thể tiếp tục nhắn tin."
        />
      )}

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {messages.length === 0 && (
          <Empty
            description="Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.mine ? 'flex-end' : 'flex-start',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '10px 16px',
                borderRadius: msg.mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.mine ? '#5b5bf6' : '#fff',
                color: msg.mine ? '#fff' : 'rgba(0,0,0,0.88)',
                boxShadow: '0 2px 6px rgba(20,20,60,0.06)',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}
            </div>
            <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
              {msg.time}
            </Text>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #eef0f7' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder={isBlocked ? 'Bạn đã chặn người dùng này' : 'Nhập tin nhắn...'}
            size="large"
            variant="filled"
            value={draft}
            disabled={isBlocked}
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={handleSend}
            style={{ borderRadius: 20 }}
            suffix={<SmileOutlined style={{ color: 'rgba(0,0,0,0.35)' }} />}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            shape="circle"
            disabled={!draft.trim() || isBlocked}
            onClick={handleSend}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
