'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Empty,
  Image,
  Input,
  type InputRef,
  Popover,
  Skeleton,
  Typography,
} from 'antd';
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
  CloseOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useConversationDetail } from '@/hook/useConversations';
import type { Message, MessageAttachment, MessageType } from '@/types/message';
import { colorForId, initialOf } from '@/lib/avatar';
import { useSocketContext } from '@/providers/SocketProvider';
import { useChatStore, resolvePresence } from '@/store/useChatStore';
import { useCallStore } from '@/store/useCallStore';
import { useCallContext } from '@/providers/CallProvider';
import { useActiveCall } from '@/hook/useCalls';
import { attachmentService } from '@/services/attachment.service';
import { msg } from '@/lib/notify';
import GroupSettingsModal from './GroupSettingsModal';
import MediaCenterDrawer from './MediaCenterDrawer';

const TYPING_STOP_DELAY_MS = 2500;

const { Text, Title } = Typography;

const formatMessageTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const isSameDay = (a: string, b: string) => {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

const formatDateSeparator = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(isoDate, now.toISOString())) return 'Hôm nay';
  if (isSameDay(isoDate, yesterday.toISOString())) return 'Hôm qua';

  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

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
  onSend: (
    text: string,
    attachmentIds?: string[],
    type?: MessageType,
    replyToMessageId?: string,
  ) => void;
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
  const [mediaCenterOpen, setMediaCenterOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replyResetKey, setReplyResetKey] = useState(conversationId);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<InputRef>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);

  const { startTyping, stopTyping, markRead } = useSocketContext();
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
  const blockedByOther = data?.data.blockedByOther ?? false;
  const otherMember =
    conversation?.type === 'private'
      ? members.find((m) => m.userId._id !== currentUserId)?.userId
      : null;
  const onlineStatusOverrides = useChatStore((s) => s.onlineStatusOverrides);
  const otherMemberStatus = resolvePresence(
    onlineStatusOverrides,
    otherMember?._id,
    otherMember?.status,
  );

  const isGroup = conversation?.type === 'group';
  const displayName = isGroup ? conversation?.name || 'Nhóm chat' : otherMember?.username;
  const avatarUrl = isGroup ? conversation?.avatar : otherMember?.avatar;
  const canBlock = !isGroup && !!otherMember;
  const cannotSend = isBlocked || blockedByOther;

  const { startCall, joinOngoingCall } = useCallContext();
  const callPhase = useCallStore((s) => s.phase);
  const canStartCall = callPhase === 'idle';
  const { data: activeCallData } = useActiveCall(conversation?._id);
  const activeCall = activeCallData?.data?.call;
  const isInActiveCall = !!activeCall?.participants.some(
    (p) => p.userId._id === currentUserId && p.status === 'accepted',
  );
  const [joiningCall, setJoiningCall] = useState(false);

  const handleJoinActiveCall = async () => {
    if (!conversation?._id) return;
    setJoiningCall(true);
    await joinOngoingCall(conversation._id);
    setJoiningCall(false);
  };

  useEffect(() => {
    if (messagesLoading || isLoading) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNewConversation = prevConversationIdRef.current !== conversationId;
    prevConversationIdRef.current = conversationId;
    if (isNewConversation) {
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    } else if (stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, messagesLoading, isLoading, conversationId]);

  useEffect(() => {
    if (isLoading) return;
    const contentEl = messagesContentRef.current;
    const containerEl = messagesContainerRef.current;
    if (!contentEl || !containerEl) return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        containerEl.scrollTop = containerEl.scrollHeight;
      }
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [conversationId, isLoading]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (!conversationId || isLoading || cannotSend) return;
    messageInputRef.current?.focus();
  }, [conversationId, isLoading, cannotSend]);

  // Reset the reply target when switching conversations. Adjusting state during
  // render (instead of in an effect) avoids an extra render pass.
  if (replyResetKey !== conversationId) {
    setReplyResetKey(conversationId);
    setReplyingTo(null);
  }

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.status === 'sending' || lastMessage.status === 'failed') return;
    markRead(conversationId, lastMessage._id);
  }, [conversationId, messages, markRead]);

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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const inputEl = messageInputRef.current?.input;
    const start = inputEl?.selectionStart ?? draft.length;
    const end = inputEl?.selectionEnd ?? draft.length;
    const nextDraft = draft.slice(0, start) + emojiData.emoji + draft.slice(end);
    handleDraftChange(nextDraft);

    requestAnimationFrame(() => {
      const pos = start + emojiData.emoji.length;
      inputEl?.focus();
      inputEl?.setSelectionRange(pos, pos);
    });
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
    if ((!draft.trim() && pendingAttachments.length === 0) || cannotSend || uploading) return;
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
      replyingTo?._id,
    );
    setDraft('');
    setPendingAttachments([]);
    setReplyingTo(null);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    if (conversationId) stopTyping(conversationId);
    stickToBottomRef.current = true;
    messageInputRef.current?.focus();
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
                type={otherMemberStatus === 'online' ? 'success' : 'secondary'}
                style={{ fontSize: 12 }}
              >
                {otherMemberStatus === 'online' ? '● Đang hoạt động' : 'Ngoại tuyến'}
              </Text>
            )}
          </div>
        </div>
        <Button
          type="text"
          icon={<PhoneOutlined />}
          disabled={!canStartCall}
          onClick={() => conversation && startCall(conversation._id, 'audio')}
        />
        <Button
          type="text"
          icon={<VideoCameraOutlined />}
          disabled={!canStartCall}
          onClick={() => conversation && startCall(conversation._id, 'video')}
        />
        <Button type="text" icon={<PictureOutlined />} onClick={() => setMediaCenterOpen(true)} />
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

      {!isBlocked && blockedByOther && (
        <Alert
          type="warning"
          showIcon
          banner
          title="Người dùng này đã chặn bạn. Bạn không thể nhắn tin cho họ."
        />
      )}

      {activeCall && !isInActiveCall && callPhase === 'idle' && (
        <Alert
          type="info"
          showIcon
          banner
          icon={activeCall.type === 'video' ? <VideoCameraOutlined /> : <PhoneOutlined />}
          title={isGroup ? 'Cuộc gọi nhóm đang diễn ra' : 'Cuộc gọi đang diễn ra'}
          action={
            <Button
              size="small"
              type="primary"
              loading={joiningCall}
              onClick={handleJoinActiveCall}
            >
              Tham gia
            </Button>
          }
        />
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="overflow-y-auto flex-1 p-4 md:p-6"
      >
        {messagesLoading && <Skeleton paragraph={{ rows: 4 }} active />}
        {!messagesLoading && messages.length === 0 && (
          <Empty
            description="Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        )}
        <div ref={messagesContentRef}>
          {!messagesLoading &&
            messages.map((msg, index) => {
              const mine = msg.senderId._id === currentUserId;
              const showSenderInfo = isGroup && !mine;
              const prevMessage = messages[index - 1];
              const showDateSeparator =
                !prevMessage || !isSameDay(prevMessage.createdAt, msg.createdAt);
              return (
                <div key={msg._id}>
                  {showDateSeparator && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '16px 0',
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          background: '#e8e9f5',
                          padding: '4px 12px',
                          borderRadius: 12,
                        }}
                      >
                        {formatDateSeparator(msg.createdAt)}
                      </Text>
                    </div>
                  )}
                  {msg.type === 'system' ? (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          background: '#e8e9f5',
                          padding: '4px 12px',
                          borderRadius: 12,
                          textAlign: 'center',
                        }}
                      >
                        {msg.content}
                      </Text>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: mine ? 'flex-end' : 'flex-start',
                        marginBottom: 16,
                      }}
                    >
                      {showSenderInfo && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, marginBottom: 2, marginLeft: 36 }}
                        >
                          {msg.senderId.username}
                        </Text>
                      )}
                      <div
                        className="max-w-[85%] sm:max-w-[70%]"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 4,
                          minWidth: 0,
                          flexDirection: mine ? 'row-reverse' : 'row',
                        }}
                        onMouseEnter={() => setHoveredMessageId(msg._id)}
                        onMouseLeave={() =>
                          setHoveredMessageId((id) => (id === msg._id ? null : id))
                        }
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
                              {msg.replyToMessageId && (
                                <div
                                  style={{
                                    borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.6)' : '#5b5bf6'}`,
                                    background: mine
                                      ? 'rgba(255,255,255,0.12)'
                                      : 'rgba(91,91,246,0.06)',
                                    borderRadius: 6,
                                    padding: '4px 8px',
                                    marginBottom: 2,
                                  }}
                                >
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 11,
                                      display: 'block',
                                      color: mine ? 'rgba(255,255,255,0.85)' : '#5b5bf6',
                                    }}
                                  >
                                    {msg.replyToMessageId.senderId.username}
                                  </Text>
                                  <Text
                                    ellipsis
                                    style={{
                                      fontSize: 12,
                                      display: 'block',
                                      color: mine ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)',
                                      fontStyle: msg.replyToMessageId.isDeleted
                                        ? 'italic'
                                        : 'normal',
                                    }}
                                  >
                                    {msg.replyToMessageId.isDeleted
                                      ? 'Tin nhắn đã được thu hồi'
                                      : msg.replyToMessageId.content || 'Tệp đính kèm'}
                                  </Text>
                                </div>
                              )}
                              {msg.attachmentIds?.map((attachment) => (
                                <AttachmentPreview key={attachment._id} attachment={attachment} />
                              ))}
                              {msg.content}
                            </>
                          )}
                        </div>
                        {!msg.isDeleted && hoveredMessageId === msg._id && (
                          <Button
                            type="text"
                            size="small"
                            shape="circle"
                            icon={<RollbackOutlined style={{ fontSize: 14 }} />}
                            onClick={() => {
                              setReplyingTo(msg);
                              messageInputRef.current?.focus();
                            }}
                          />
                        )}
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
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="border-t border-[#eef0f7] bg-white p-3 md:p-4 md:px-6">
        {replyingTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 10,
              background: '#f4f5fb',
              borderLeft: '3px solid #5b5bf6',
              marginBottom: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 12, display: 'block', color: '#5b5bf6' }}>
                Đang trả lời{' '}
                {replyingTo.senderId._id === currentUserId
                  ? 'chính mình'
                  : replyingTo.senderId.username}
              </Text>
              <Text ellipsis style={{ fontSize: 12, display: 'block', color: 'rgba(0,0,0,0.55)' }}>
                {replyingTo.content || 'Tệp đính kèm'}
              </Text>
            </div>
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<CloseOutlined style={{ fontSize: 12 }} />}
              onClick={() => setReplyingTo(null)}
            />
          </div>
        )}
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
                  <Image
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
            disabled={cannotSend || pendingAttachments.length >= MAX_FILES_PER_MESSAGE}
            onClick={handlePickFile}
          />
          <Input
            ref={messageInputRef}
            placeholder={
              isBlocked
                ? 'Bạn đã chặn người dùng này'
                : blockedByOther
                  ? 'Bạn không thể nhắn tin cho người dùng này'
                  : 'Nhập tin nhắn...'
            }
            size="large"
            variant="filled"
            value={draft}
            disabled={cannotSend}
            onChange={(e) => handleDraftChange(e.target.value)}
            onPressEnter={handleSend}
            style={{ borderRadius: 20 }}
            suffix={
              <Popover
                trigger="click"
                open={emojiPickerOpen}
                onOpenChange={setEmojiPickerOpen}
                placement="topRight"
                styles={{ content: { padding: 0 } }}
                content={<EmojiPicker onEmojiClick={handleEmojiClick} />}
              >
                <SmileOutlined style={{ color: 'rgba(0,0,0,0.35)', cursor: 'pointer' }} />
              </Popover>
            }
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            shape="circle"
            loading={sendLoading}
            disabled={(!draft.trim() && pendingAttachments.length === 0) || cannotSend || uploading}
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
          inviteCode={conversation.inviteCode}
          members={members}
          currentUserId={currentUserId}
        />
      )}

      <MediaCenterDrawer
        open={mediaCenterOpen}
        onClose={() => setMediaCenterOpen(false)}
        conversationId={conversation._id}
      />
    </div>
  );
};

export default ChatWindow;
