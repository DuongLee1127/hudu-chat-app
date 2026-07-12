'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Avatar, Button, Dropdown, Empty, Input, Skeleton, Typography } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  MoreOutlined,
  StopOutlined,
  MessageOutlined,
  TeamOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useConversationDetail } from '@/hook/useConversations';
import type { Message } from '@/types/message';
import { colorForId, initialOf } from '@/lib/avatar';
import { useSocketContext } from '@/providers/SocketProvider';
import { useChatStore } from '@/store/useChatStore';
import GroupSettingsModal from './GroupSettingsModal';

const TYPING_STOP_DELAY_MS = 2500;

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
  isMobile?: boolean;
  onBack?: () => void;
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
  isMobile,
  onBack,
}: ChatWindowProps) => {
  const [draft, setDraft] = useState('');
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { startTyping, stopTyping } = useSocketContext();
  const typingMap = useChatStore((s) =>
    conversationId ? s.typingByConversation[conversationId] : undefined,
  );
  const isOtherTyping = useMemo(
    () => Object.keys(typingMap || {}).some((id) => id !== currentUserId),
    [typingMap, currentUserId],
  );

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

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (conversationId) stopTyping(conversationId);
    };
  }, [conversationId, stopTyping]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!conversationId) return;

    startTyping(conversationId);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, TYPING_STOP_DELAY_MS);
  };

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
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    if (conversationId) stopTyping(conversationId);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f4f5fb' }}>
      <div className="flex h-16 items-center justify-between border-b border-[#eef0f7] bg-white px-3 md:h-18 md:px-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ flexShrink: 0 }}
            />
          )}
          <Avatar
            size={40}
            src={avatarUrl || undefined}
            icon={isGroup ? <TeamOutlined /> : undefined}
            style={{ backgroundColor: colorForId(conversation._id), flexShrink: 0 }}
          >
            {!isGroup && displayName ? initialOf(displayName) : undefined}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Title level={5} style={{ margin: 0 }} ellipsis>
              {displayName || 'Người dùng'}
            </Title>
            {isOtherTyping ? (
              <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                Đang nhập...
              </Text>
            ) : isGroup ? (
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
          title="Bạn đã chặn người dùng này. Bỏ chặn để có thể tiếp tục nhắn tin."
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                  className="max-w-[85%] sm:max-w-[70%]"
                  style={{
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
                <Text
                  type={msg.status === 'failed' ? 'danger' : 'secondary'}
                  style={{ fontSize: 11, marginTop: 4 }}
                >
                  {msg.status === 'sending' && 'Đang gửi...'}
                  {msg.status === 'failed' && 'Gửi thất bại'}
                  {(!msg.status || msg.status === 'sent') && (
                    <>
                      {formatMessageTime(msg.createdAt)}
                      {msg.isEdited && !msg.isDeleted ? ' · Đã chỉnh sửa' : ''}
                    </>
                  )}
                </Text>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#eef0f7] bg-white p-3 md:p-4 md:px-6">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder={isBlocked ? 'Bạn đã chặn người dùng này' : 'Nhập tin nhắn...'}
            size="large"
            variant="filled"
            value={draft}
            disabled={isBlocked || sendLoading}
            onChange={(e) => handleDraftChange(e.target.value)}
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
