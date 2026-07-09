'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Button, Dropdown, Empty, Input, Skeleton, Typography } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  MoreOutlined,
  StopOutlined,
  MessageOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useConversationDetail } from '@/hook/useConversations';
import type { Message } from '@/types/message';
import { colorForId, initialOf } from '@/lib/avatar';
import GroupSettingsModal from './GroupSettingsModal';

const { Text, Title } = Typography;

const formatMessageTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

interface ChatWindowProps {
  conversationId: string | null;
  currentUserId?: string;
  messages: Message[];
  messagesLoading: boolean;
  onSend: (text: string) => void;
  sendLoading: boolean;
  isBlocked: boolean;
  onToggleBlock: () => void;
  blockActionLoading: boolean;
}

const ChatWindow = ({
  conversationId,
  currentUserId,
  messages,
  messagesLoading,
  onSend,
  sendLoading,
  isBlocked,
  onToggleBlock,
  blockActionLoading,
}: ChatWindowProps) => {
  const [draft, setDraft] = useState('');
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useConversationDetail(conversationId ?? '');
  const conversation = data?.data.conversation;
  const members = data?.data.members ?? [];
  const otherMember =
    conversation?.type === 'private'
      ? members.find((m) => m.userId._id !== currentUserId)?.userId
      : null;

  const isGroup = conversation?.type === 'group';
  const displayName = isGroup ? conversation?.name || 'Nhóm chat' : otherMember?.username;
  const avatarUrl = isGroup ? conversation?.avatar : otherMember?.avatar;
  const canBlock = !isGroup && !!otherMember;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversationId]);

  if (!conversationId) {
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
              Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu nhắn tin
            </Text>
          }
        />
      </div>
    );
  }

  if (isLoading || !conversation) {
    return (
      <div style={{ flex: 1, background: '#f4f5fb', padding: 24 }}>
        <Skeleton avatar paragraph={{ rows: 1 }} active />
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
            src={avatarUrl || undefined}
            icon={isGroup ? <TeamOutlined /> : undefined}
            style={{ backgroundColor: colorForId(conversation._id) }}
          >
            {!isGroup && displayName ? initialOf(displayName) : undefined}
          </Avatar>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {displayName || 'Người dùng'}
            </Title>
            {isGroup ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {members.length} thành viên
              </Text>
            ) : (
              <Text
                type={otherMember?.status === 'online' ? 'success' : 'secondary'}
                style={{ fontSize: 12 }}
              >
                {otherMember?.status === 'online' ? '● Đang hoạt động' : 'Ngoại tuyến'}
              </Text>
            )}
          </div>
        </div>
        {canBlock && (
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
        )}
        {isGroup && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'group-settings',
                  icon: <SettingOutlined />,
                  label: 'Quản lý nhóm',
                },
              ],
              onClick: () => setGroupSettingsOpen(true),
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )}
      </div>

      {isBlocked && (
        <Alert
          type="warning"
          showIcon
          banner
          message="Bạn đã chặn người dùng này. Bỏ chặn để có thể tiếp tục nhắn tin."
        />
      )}

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {messagesLoading && <Skeleton paragraph={{ rows: 4 }} active />}
        {!messagesLoading && messages.length === 0 && (
          <Empty
            description="Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        )}
        {!messagesLoading &&
          messages.map((msg) => {
            const mine = msg.senderId._id === currentUserId;
            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: mine ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 16px',
                    borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: mine ? '#5b5bf6' : '#fff',
                    color: mine ? '#fff' : 'rgba(0,0,0,0.88)',
                    boxShadow: '0 2px 6px rgba(20,20,60,0.06)',
                    wordBreak: 'break-word',
                    fontStyle: msg.isDeleted ? 'italic' : 'normal',
                  }}
                >
                  {msg.isDeleted ? 'Tin nhắn đã được thu hồi' : msg.content}
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                  {formatMessageTime(msg.createdAt)}
                  {msg.isEdited && !msg.isDeleted ? ' · Đã chỉnh sửa' : ''}
                </Text>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #eef0f7' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder={isBlocked ? 'Bạn đã chặn người dùng này' : 'Nhập tin nhắn...'}
            size="large"
            variant="filled"
            value={draft}
            disabled={isBlocked || sendLoading}
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
            loading={sendLoading}
            disabled={!draft.trim() || isBlocked}
            onClick={handleSend}
          />
        </div>
      </div>

      {isGroup && (
        <GroupSettingsModal
          open={groupSettingsOpen}
          onClose={() => setGroupSettingsOpen(false)}
          conversationId={conversation._id}
          conversationName={conversation.name}
          members={members}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default ChatWindow;
