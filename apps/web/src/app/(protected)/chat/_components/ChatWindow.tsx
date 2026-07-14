'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Avatar, Button, Dropdown, Empty, Image, Input, Skeleton, Typography } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  MoreOutlined,
  StopOutlined,
  MessageOutlined,
  TeamOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  PaperClipOutlined,
  FileOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useConversationDetail } from '@/hook/useConversations';
import type { Message, MessageAttachment, MessageType } from '@/types/message';
import { colorForId, initialOf } from '@/lib/avatar';
import { useSocketContext } from '@/providers/SocketProvider';
import { useChatStore } from '@/store/useChatStore';
import { attachmentService } from '@/services/attachment.service';
import { msg } from '@/lib/notify';
import GroupSettingsModal from './GroupSettingsModal';

const TYPING_STOP_DELAY_MS = 2500;

const { Text, Title } = Typography;

const formatMessageTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ACCEPTED_FILE_TYPES =
  'image/png,image/jpeg,image/webp,application/pdf,.docx,.xlsx,application/zip';
const MAX_FILES_PER_MESSAGE = 10;

const AttachmentPreview = ({ attachment }: { attachment: MessageAttachment }) => {
  const isImage = attachment.mimeType.startsWith('image/');

  if (isImage) {
    return (
      <Image
        src={attachment.thumbnailUrl || attachment.url}
        preview={{ src: attachment.url }}
        alt={attachment.fileName}
        style={{ maxWidth: 240, maxHeight: 240, borderRadius: 12, display: 'block' }}
        styles={{ root: { borderRadius: 12, overflow: 'hidden' } }}
      />
    );
  }

  return (
    <a
      href={attachment.url}
      download={attachment.fileName}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.04)',
        color: 'inherit',
        minWidth: 0,
      }}
    >
      <FileOutlined style={{ fontSize: 18, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {attachment.fileName}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>{formatFileSize(attachment.size)}</div>
      </div>
    </a>
  );
};

interface ChatWindowProps {
  conversationId: string | null;
  currentUserId?: string;
  messages: Message[];
  messagesLoading: boolean;
  onSend: (text: string, attachmentIds?: string[], type?: MessageType) => void;
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
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    if (files.length > MAX_FILES_PER_MESSAGE) {
      msg.error(`Chỉ được chọn tối đa ${MAX_FILES_PER_MESSAGE} tệp mỗi lần!`);
      return;
    }

    setUploading(true);
    try {
      const res = await attachmentService.uploadFiles(files);
      setPendingAttachments((prev) => [...prev, ...res.data.attachments]);
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      msg.error(axiosErr.response?.data?.message || 'Tải tệp lên thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    attachmentService.deleteAttachment(id).catch(() => {});
    setPendingAttachments((prev) => prev.filter((a) => a._id !== id));
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
    if ((!draft.trim() && pendingAttachments.length === 0) || isBlocked || uploading) return;
    const messageType: MessageType | undefined =
      pendingAttachments.length > 0
        ? pendingAttachments.every((a) => a.mimeType.startsWith('image/'))
          ? 'image'
          : 'file'
        : undefined;
    onSend(
      draft,
      pendingAttachments.length > 0 ? pendingAttachments.map((a) => a._id) : undefined,
      messageType,
    );
    setDraft('');
    setPendingAttachments([]);
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
            const showSenderInfo = isGroup && !mine;
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
                {showSenderInfo && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 2, marginLeft: 36 }}>
                    {msg.senderId.username}
                  </Text>
                )}
                <div
                  className="max-w-[85%] sm:max-w-[70%]"
                  style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: 0 }}
                >
                  {showSenderInfo && (
                    <Avatar
                      size={28}
                      src={msg.senderId.avatar || undefined}
                      style={{ backgroundColor: colorForId(msg.senderId._id), flexShrink: 0 }}
                    >
                      {initialOf(msg.senderId.username)}
                    </Avatar>
                  )}
                  <div
                    style={{
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding:
                        !msg.isDeleted && msg.attachmentIds?.length && !msg.content
                          ? 4
                          : '10px 16px',
                      borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: mine ? '#5b5bf6' : '#fff',
                      color: mine ? '#fff' : 'rgba(0,0,0,0.88)',
                      boxShadow: '0 2px 6px rgba(20,20,60,0.06)',
                      wordBreak: 'break-word',
                      fontStyle: msg.isDeleted ? 'italic' : 'normal',
                    }}
                  >
                    {msg.isDeleted ? (
                      'Tin nhắn đã được thu hồi'
                    ) : (
                      <>
                        {msg.attachmentIds?.map((attachment) => (
                          <AttachmentPreview key={attachment._id} attachment={attachment} />
                        ))}
                        {msg.content}
                      </>
                    )}
                  </div>
                </div>
                <Text
                  type={msg.status === 'failed' ? 'danger' : 'secondary'}
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    marginLeft: showSenderInfo ? 36 : 0,
                  }}
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
        {pendingAttachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: '#f4f5fb',
                  width: 'fit-content',
                  maxWidth: '100%',
                }}
              >
                {attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={attachment.thumbnailUrl || attachment.url}
                    alt={attachment.fileName}
                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <FileOutlined style={{ fontSize: 18 }} />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {attachment.fileName}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseCircleFilled />}
                  onClick={() => handleRemovePendingAttachment(attachment._id)}
                />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            shape="circle"
            loading={uploading}
            disabled={isBlocked || pendingAttachments.length >= MAX_FILES_PER_MESSAGE}
            onClick={handlePickFile}
          />
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
            disabled={(!draft.trim() && pendingAttachments.length === 0) || isBlocked || uploading}
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
