'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Empty,
  Image,
  Input,
  Modal,
  Checkbox,
  Popover,
  Progress,
  Skeleton,
  Typography,
} from 'antd';
import type { InputRef } from 'antd';
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
  EditOutlined,
  DeleteOutlined,
  EnterOutlined,
  PushpinOutlined,
  SwapOutlined,
  AudioOutlined,
  PictureOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  useConversationDetail,
  useListConversations,
  usePinMessage,
  useUnpinMessage,
  useCreatePoll,
  useSummarizeConversation,
} from '@/hook/useConversations';
import type { Message, MessageAttachment, MessageType } from '@/types/message';
import { colorForId, initialOf } from '@/lib/avatar';
import { useSocketContext } from '@/providers/SocketProvider';
import { useChatStore } from '@/store/useChatStore';
import { attachmentService } from '@/services/attachment.service';
import { messageService } from '@/services/message.service';
import { pushService } from '@/lib/push';
import { msg, notify } from '@/lib/notify';
import GroupSettingsModal from './GroupSettingsModal';
import { useForwardMessage, useToggleReaction, useVotePoll } from '@/hook/useMessages';

const TYPING_STOP_DELAY_MS = 2500;
const EDIT_WINDOW_MS = 15 * 60 * 1000;

const { Text, Title } = Typography;

const PollMessageCard = ({
  messageId,
  question,
  mine,
  currentUserId,
  poll,
  onLoad,
  onVote,
}: {
  messageId: string;
  question: string;
  mine: boolean;
  currentUserId?: string;
  poll?: any;
  onLoad: () => void;
  onVote: (optionIndex: number) => void;
}) => {
  useEffect(() => {
    onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{question || 'Bình chọn'}</div>
      {(poll?.options || []).map((option: any, index: number) => {
        const votes = option.voterIds?.length || 0;
        const voted = (option.voterIds || []).some((id: any) => String(id) === currentUserId);
        return (
          <Button
            key={`${messageId}-${index}`}
            block
            size="small"
            type={voted ? 'primary' : 'default'}
            style={{
              marginBottom: 6,
              textAlign: 'left',
              background: mine && !voted ? 'rgba(255,255,255,0.15)' : undefined,
              color: mine && !voted ? '#fff' : undefined,
              borderColor: mine ? 'rgba(255,255,255,0.35)' : undefined,
            }}
            onClick={() => onVote(index)}
          >
            {option.text} ({votes})
          </Button>
        );
      })}
      {!poll && <Text style={{ fontSize: 12, opacity: 0.8 }}>Đang tải bình chọn...</Text>}
    </div>
  );
};

const formatMessageTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ACCEPTED_FILE_TYPES =
  'image/png,image/jpeg,image/webp,video/mp4,video/webm,application/pdf,.docx,.xlsx,application/zip';
const MAX_FILES_PER_MESSAGE = 10;
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const renderMessageContent = (content: string, mine: boolean) =>
  content.split(/(@[a-zA-Z0-9_]+)/g).map((part, index) =>
    /^@[a-zA-Z0-9_]+$/.test(part) ? (
      <span
        key={`${part}-${index}`}
        style={{
          color: mine ? '#fff' : '#4f46e5',
          fontWeight: 600,
          background: mine ? 'rgba(255,255,255,0.16)' : '#eef2ff',
          borderRadius: 4,
          padding: '0 2px',
        }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );

const AttachmentPreview = ({ attachment }: { attachment: MessageAttachment }) => {
  const isImage = attachment.mimeType.startsWith('image/');
  const isAudio = attachment.mimeType.startsWith('audio/');
  const isVideo = attachment.mimeType.startsWith('video/');

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

  if (isAudio) {
    return <audio controls preload="metadata" src={attachment.url} style={{ maxWidth: 240 }} />;
  }

  if (isVideo) {
    return (
      <video controls preload="metadata" src={attachment.url} style={{ maxWidth: 280, borderRadius: 12 }}>
        Trình duyệt của bạn không hỗ trợ phát video.
      </video>
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
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onRetry: (message: Message) => void;
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
  onEdit,
  onDelete,
  onRetry,
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryAttachments, setGalleryAttachments] = useState<MessageAttachment[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [forwardTargetIds, setForwardTargetIds] = useState<string[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<InputRef>(null);
  const prevSendLoadingRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const prevConversationIdRef = useRef<string | null>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { startTyping, stopTyping, markRead } = useSocketContext();
  const typingMap = useChatStore((s) =>
    conversationId ? s.typingByConversation[conversationId] : undefined,
  );
  const isOtherTyping = useMemo(
    () => Object.keys(typingMap || {}).some((id) => id !== currentUserId),
    [typingMap, currentUserId],
  );

  const { data, isLoading } = useConversationDetail(conversationId ?? '');
  const { data: conversationsData } = useListConversations({ pageSize: 100 });
  const toggleReactionMutation = useToggleReaction(conversationId ?? '');
  const forwardMutation = useForwardMessage();
  const createPollMutation = useCreatePoll(conversationId ?? '');
  const summarizeMutation = useSummarizeConversation(conversationId ?? '');
  const votePollMutation = useVotePoll(conversationId ?? '');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [pollCache, setPollCache] = useState<Record<string, any>>({});
  const pinMutation = usePinMessage(conversationId ?? '');
  const unpinMutation = useUnpinMessage(conversationId ?? '');
  const conversation = data?.data.conversation;
  const members = data?.data.members ?? [];
  const pinnedMessages = data?.data.pinnedMessages ?? [];
  const otherMember =
    conversation?.type === 'private'
      ? members.find((m) => m.userId._id !== currentUserId)?.userId
      : null;

  const isGroup = conversation?.type === 'group';
  const displayName = isGroup ? conversation?.name || 'Nhóm chat' : otherMember?.username;
  const avatarUrl = isGroup ? conversation?.avatar : otherMember?.avatar;
  const canBlock = !isGroup && !!otherMember;
  const isAdmin = !isGroup || members.some((member) => member.userId._id === currentUserId && member.role === 'admin');
  const canManagePins = !isGroup || isAdmin;
  const mentionMatch = isGroup ? /@([a-zA-Z0-9_]*)$/.exec(draft) : null;
  const mentionCandidates = mentionMatch
    ? members
        .filter(
          (member) =>
            member.userId._id !== currentUserId &&
            member.userId.username.toLowerCase().includes(mentionMatch[1].toLowerCase()),
        )
        .slice(0, 6)
    : [];
  const isPinned = (messageId: string) =>
    (conversation?.pinnedMessageIds ?? []).some((id) => String(id) === messageId);

  const peerLastReadMessageId = useMemo(() => {
    if (!currentUserId || isGroup) return null;
    const peer = members.find((m) => m.userId._id !== currentUserId);
    return peer?.lastReadMessageId ?? null;
  }, [members, currentUserId, isGroup]);

  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.senderId._id === currentUserId && !m.isDeleted && !m.tempId) return m._id;
    }
    return null;
  }, [messages, currentUserId]);

  const groupSeenCount = useMemo(() => {
    if (!isGroup || !lastOwnMessageId) return 0;
    return members.filter(
      (m) =>
        m.userId._id !== currentUserId &&
        m.lastReadMessageId &&
        String(m.lastReadMessageId) >= String(lastOwnMessageId),
    ).length;
  }, [isGroup, lastOwnMessageId, members, currentUserId]);

  const lastMessageId = messages[messages.length - 1]?._id;

  // column-reverse: latest messages are at scrollTop === 0
  const scrollMessagesToLatest = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;
  };

  useEffect(() => {
    if (prevConversationIdRef.current !== conversationId) {
      prevConversationIdRef.current = conversationId;
      shouldStickToBottomRef.current = true;
    }
  }, [conversationId]);

  useLayoutEffect(() => {
    if (messagesLoading || !conversationId || messages.length === 0) return;
    if (!shouldStickToBottomRef.current) return;
    scrollMessagesToLatest();
  }, [messages.length, lastMessageId, conversationId, messagesLoading]);

  // Input bị disable khi đang gửi nên mất focus; gửi xong thì focus lại để nhắn tiếp
  useEffect(() => {
    if (prevSendLoadingRef.current && !sendLoading) {
      messageInputRef.current?.focus();
    }
    prevSendLoadingRef.current = sendLoading;
  }, [sendLoading]);

  useEffect(() => {
    setReplyTo(null);
    setEditingMessage(null);
    setDraft(conversationId ? localStorage.getItem(`hudu-draft:${conversationId}`) || '' : '');
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const timer = setTimeout(() => {
      const key = `hudu-draft:${conversationId}`;
      if (draft) localStorage.setItem(key, draft);
      else localStorage.removeItem(key);
    }, 350);
    return () => clearTimeout(timer);
  }, [conversationId, draft]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const last = [...messages].reverse().find((m) => !m.tempId && !m._id.startsWith('temp-'));
    if (last) markRead(conversationId, last._id);
  }, [conversationId, messages, markRead]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      if (conversationId) stopTyping(conversationId);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
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

  const insertMention = (username: string) => {
    if (!mentionMatch) return;
    handleDraftChange(`${draft.slice(0, mentionMatch.index)}@${username} `);
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
    setUploadProgress(0);
    try {
      const res = await attachmentService.uploadFiles(files, setUploadProgress);
      setPendingAttachments((prev) => [...prev, ...res.data.attachments]);
    } catch (error) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      msg.error(axiosErr.response?.data?.message || 'Tải tệp lên thất bại!');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRecordAudio = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      msg.error('Trình duyệt không hỗ trợ ghi âm.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (!chunks.length) return;

        setUploading(true);
        setUploadProgress(0);
        try {
          const audio = new File([new Blob(chunks, { type: 'audio/webm' })], `voice-${Date.now()}.webm`, {
            type: 'audio/webm',
          });
          const response = await attachmentService.uploadFiles([audio], setUploadProgress);
          const attachment = response.data.attachments[0];
          if (attachment) onSend('', [attachment._id], 'audio');
        } catch (error) {
          const axiosErr = error as { response?: { data?: { message?: string } } };
          msg.error(axiosErr.response?.data?.message || 'Tải ghi âm lên thất bại!');
        } finally {
          setUploading(false);
          setUploadProgress(null);
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      msg.error('Không thể truy cập microphone. Hãy kiểm tra quyền truy cập.');
    }
  };

  const openGallery = async () => {
    if (!conversationId) return;
    setGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const response = await attachmentService.listConversationAttachments(conversationId, 'image');
      setGalleryAttachments(response.data.attachments);
    } catch {
      msg.error('Không thể tải thư viện ảnh.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    attachmentService.deleteAttachment(id).catch(() => {});
    setPendingAttachments((prev) => prev.filter((a) => a._id !== id));
  };

  const canEditMessage = (message: Message) => {
    if (message.senderId._id !== currentUserId || message.isDeleted) return false;
    return Date.now() - new Date(message.createdAt).getTime() <= EDIT_WINDOW_MS;
  };

  const openEdit = (message: Message) => {
    setEditingMessage(message);
    setEditDraft(message.content);
  };

  const confirmEdit = () => {
    if (!editingMessage || !editDraft.trim()) return;
    onEdit(editingMessage._id, editDraft.trim());
    setEditingMessage(null);
    setEditDraft('');
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
    shouldStickToBottomRef.current = true;

    const trimmed = draft.trim();
    if (trimmed.startsWith('/poll ')) {
      const body = trimmed.slice(6);
      const parts = body.split('|').map((p) => p.trim()).filter(Boolean);
      const [question, ...options] = parts;
      if (!question || options.length < 2) {
        msg.error('Cú pháp: /poll Câu hỏi | lựa chọn 1 | lựa chọn 2');
        return;
      }
      createPollMutation.mutate(
        { question, options },
        {
          onSuccess: () => {
            setDraft('');
            localStorage.removeItem(`hudu-draft:${conversationId}`);
            notify.success('Đã tạo bình chọn!');
          },
          onError: () => msg.error('Tạo bình chọn thất bại!'),
        },
      );
      return;
    }

    const remindMatch = trimmed.match(/^\/remind\s+me\s+in\s+(\d+)(m|h)\s+(.+)$/i);
    if (remindMatch) {
      const amount = Number(remindMatch[1]);
      const unit = remindMatch[2].toLowerCase();
      const content = remindMatch[3].trim();
      const ms = unit === 'h' ? amount * 60 * 60 * 1000 : amount * 60 * 1000;
      const dueAt = new Date(Date.now() + ms).toISOString();
      pushService
        .createRemind(content, dueAt)
        .then(() => {
          setDraft('');
          localStorage.removeItem(`hudu-draft:${conversationId}`);
          notify.success('Đã tạo nhắc nhở!');
        })
        .catch(() => msg.error('Tạo nhắc nhở thất bại!'));
      return;
    }

    const messageType: MessageType | undefined =
      pendingAttachments.length > 0
        ? pendingAttachments.every((a) => a.mimeType.startsWith('image/'))
          ? 'image'
          : pendingAttachments.every((a) => a.mimeType.startsWith('video/'))
            ? 'video'
            : pendingAttachments.every((a) => a.mimeType.startsWith('audio/'))
              ? 'audio'
              : 'file'
        : undefined;
    onSend(
      draft,
      pendingAttachments.length > 0 ? pendingAttachments.map((a) => a._id) : undefined,
      messageType,
      replyTo?._id,
    );
    setDraft('');
    localStorage.removeItem(`hudu-draft:${conversationId}`);
    setPendingAttachments([]);
    setReplyTo(null);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    if (conversationId) stopTyping(conversationId);
    messageInputRef.current?.focus();
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f4f5fb',
      }}
    >
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
        <Button type="text" icon={<PictureOutlined />} onClick={openGallery} aria-label="Mở thư viện ảnh" />
        {canBlock && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'summarize',
                  icon: <MessageOutlined />,
                  label: 'Tóm tắt hội thoại',
                },
                {
                  key: 'block',
                  icon: <StopOutlined />,
                  danger: !isBlocked,
                  label: isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'block') onToggleBlock();
                if (key === 'summarize') {
                  summarizeMutation.mutate(undefined, {
                    onSuccess: (res) => {
                      setSummaryText(res.data.summary);
                      setSummaryOpen(true);
                    },
                    onError: () => msg.error('Không thể tóm tắt hội thoại!'),
                  });
                }
              },
            }}
            trigger={['click']}
            disabled={blockActionLoading}
          >
            <Button type="text" icon={<MoreOutlined />} loading={blockActionLoading} />
          </Dropdown>
        )}
        {!canBlock && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'summarize',
                  icon: <MessageOutlined />,
                  label: 'Tóm tắt hội thoại',
                },
                ...(isGroup
                  ? [
                      {
                        key: 'group-settings',
                        icon: <SettingOutlined />,
                        label: 'Quản lý nhóm',
                      },
                    ]
                  : []),
              ],
              onClick: ({ key }) => {
                if (key === 'group-settings') setGroupSettingsOpen(true);
                if (key === 'summarize') {
                  summarizeMutation.mutate(undefined, {
                    onSuccess: (res) => {
                      setSummaryText(res.data.summary);
                      setSummaryOpen(true);
                    },
                    onError: () => msg.error('Không thể tóm tắt hội thoại!'),
                  });
                }
              },
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
      {pinnedMessages.length > 0 && (
        <div style={{ padding: '8px 16px', background: '#fffbe6', borderBottom: '1px solid #ffe58f' }}>
          <Text strong style={{ fontSize: 12 }}>
            <PushpinOutlined /> Tin nhắn đã ghim
          </Text>
          {pinnedMessages.map((message) => (
            <div key={message._id} style={{ fontSize: 12, marginTop: 3 }}>
              {message.senderId.username}: {message.content || `[${message.type}]`}
            </div>
          ))}
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto p-4 md:p-6"
        onScroll={(event) => {
          const el = event.currentTarget;
          // column-reverse: scrollTop ~ 0 means we're at the latest messages
          shouldStickToBottomRef.current = el.scrollTop < 80;
        }}
      >
        {/*
          Single child + column-reverse pins the thread to the bottom.
          On load/reload the newest messages are visible without scroll hacks.
        */}
        <div>
        {messagesLoading && <Skeleton paragraph={{ rows: 4 }} active />}
        {!messagesLoading && messages.length === 0 && (
          <Empty
            description="Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        )}
        {!messagesLoading &&
          messages.map((messageItem) => {
            const mine = messageItem.senderId._id === currentUserId;
            const showSenderInfo = isGroup && !mine;
            const isLastOwn = mine && messageItem._id === lastOwnMessageId;
            const seenByPeer =
              isLastOwn &&
              !isGroup &&
              peerLastReadMessageId &&
              String(peerLastReadMessageId) >= String(messageItem._id);
            const isDelivered = mine && (messageItem.deliveredTo?.length ?? 0) > 0;

            const menuItems = messageItem.isDeleted
              ? []
              : [
                  {
                    key: 'reply',
                    icon: <EnterOutlined />,
                    label: 'Trả lời',
                  },
                  ...(mine && canEditMessage(messageItem)
                    ? [{ key: 'edit', icon: <EditOutlined />, label: 'Chỉnh sửa' }]
                    : []),
                  ...(mine
                    ? [
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: 'Thu hồi',
                          danger: true,
                        },
                      ]
                    : []),
                  { key: 'forward', icon: <SwapOutlined />, label: 'Chuyển tiếp' },
                  ...(canManagePins
                    ? [
                        {
                          key: isPinned(messageItem._id) ? 'unpin' : 'pin',
                          icon: <PushpinOutlined />,
                          label: isPinned(messageItem._id) ? 'Bỏ ghim' : 'Ghim tin nhắn',
                        },
                      ]
                    : []),
                ];

            const actionsVisible = reactionPickerFor === messageItem._id;

            return (
              <div
                key={messageItem._id}
                className="group"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: mine ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                {showSenderInfo && (
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 2, marginLeft: 36 }}>
                    {messageItem.senderId.username}
                  </Text>
                )}
                <div
                  className="max-w-[85%] sm:max-w-[70%]"
                  style={{
                    display: 'flex',
                    flexDirection: mine ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {showSenderInfo && (
                    <Avatar
                      size={28}
                      src={messageItem.senderId.avatar || undefined}
                      style={{ backgroundColor: colorForId(messageItem.senderId._id), flexShrink: 0 }}
                    >
                      {initialOf(messageItem.senderId.username)}
                    </Avatar>
                  )}
                  <Dropdown
                    menu={{
                      items: menuItems,
                      onClick: ({ key }) => {
                        if (key === 'reply') setReplyTo(messageItem);
                        if (key === 'edit') openEdit(messageItem);
                        if (key === 'delete') {
                          Modal.confirm({
                            title: 'Thu hồi tin nhắn',
                            content: 'Tin nhắn sẽ bị thu hồi với mọi người trong hội thoại.',
                            okText: 'Thu hồi',
                            okButtonProps: { danger: true },
                            cancelText: 'Hủy',
                            onOk: () => onDelete(messageItem._id),
                          });
                        }
                        if (key === 'forward') {
                          setForwardingMessage(messageItem);
                          setForwardTargetIds([]);
                        }
                        if (key === 'pin') pinMutation.mutate(messageItem._id);
                        if (key === 'unpin') unpinMutation.mutate(messageItem._id);
                      },
                    }}
                    trigger={menuItems.length ? ['contextMenu'] : []}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding:
                          !messageItem.isDeleted &&
                          messageItem.attachmentIds?.length &&
                          !messageItem.content
                            ? 4
                            : '10px 16px',
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: mine ? '#5b5bf6' : '#fff',
                        color: mine ? '#fff' : 'rgba(0,0,0,0.88)',
                        boxShadow: '0 2px 6px rgba(20,20,60,0.06)',
                        wordBreak: 'break-word',
                        fontStyle: messageItem.isDeleted ? 'italic' : 'normal',
                        cursor: menuItems.length ? 'pointer' : 'default',
                      }}
                    >
                      {messageItem.isDeleted ? (
                        'Tin nhắn đã được thu hồi'
                      ) : (
                        <>
                          {messageItem.replyToMessageId && (
                            <div
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.7)' : '#5b5bf6'}`,
                                background: mine ? 'rgba(255,255,255,0.15)' : 'rgba(91,91,246,0.08)',
                                fontSize: 12,
                                opacity: 0.95,
                              }}
                            >
                              {messageItem.replyToMessageId.isDeleted
                                ? 'Tin nhắn đã thu hồi'
                                : messageItem.replyToMessageId.content ||
                                  `[${messageItem.replyToMessageId.type}]`}
                            </div>
                          )}
                          {messageItem.attachmentIds?.map((attachment) => (
                            <AttachmentPreview key={attachment._id} attachment={attachment} />
                          ))}
                          {messageItem.type === 'poll' ? (
                            <PollMessageCard
                              messageId={messageItem._id}
                              question={messageItem.content}
                              mine={mine}
                              currentUserId={currentUserId}
                              poll={pollCache[messageItem._id]}
                              onLoad={() => {
                                if (pollCache[messageItem._id]) return;
                                messageService
                                  .getPoll(messageItem._id)
                                  .then((res) =>
                                    setPollCache((prev) => ({
                                      ...prev,
                                      [messageItem._id]: res.data.poll,
                                    })),
                                  )
                                  .catch(() => {});
                              }}
                              onVote={(optionIndex) =>
                                votePollMutation.mutate(
                                  { id: messageItem._id, optionIndex },
                                  {
                                    onSuccess: (res) =>
                                      setPollCache((prev) => ({
                                        ...prev,
                                        [messageItem._id]: res.data.poll,
                                      })),
                                  },
                                )
                              }
                            />
                          ) : (
                            messageItem.content && renderMessageContent(messageItem.content, mine)
                          )}
                          {messageItem.linkPreview && (
                            <a
                              href={messageItem.linkPreview.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                gap: 8,
                                color: 'inherit',
                                background: mine ? 'rgba(255,255,255,0.13)' : '#f7f8ff',
                                borderRadius: 8,
                                padding: 8,
                                marginTop: messageItem.content ? 4 : 0,
                                maxWidth: 300,
                              }}
                            >
                              {messageItem.linkPreview.image && (
                                <Image
                                  src={messageItem.linkPreview.image}
                                  alt=""
                                  preview={false}
                                  style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover' }}
                                />
                              )}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>
                                  {messageItem.linkPreview.title || messageItem.linkPreview.url}
                                </div>
                                {messageItem.linkPreview.description && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      opacity: 0.8,
                                      marginTop: 2,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {messageItem.linkPreview.description}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: 11,
                                    opacity: 0.7,
                                    marginTop: 3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {messageItem.linkPreview.url}
                                </div>
                              </div>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </Dropdown>
                  {!messageItem.isDeleted && (
                    <div
                      className={
                        actionsVisible
                          ? 'flex items-center'
                          : 'flex items-center opacity-0 transition-opacity group-hover:opacity-100'
                      }
                      style={{ flexShrink: 0, gap: 2 }}
                    >
                      <Popover
                        trigger="click"
                        placement="top"
                        open={actionsVisible}
                        onOpenChange={(open) => setReactionPickerFor(open ? messageItem._id : null)}
                        content={
                          <div style={{ display: 'flex', gap: 4 }}>
                            {QUICK_REACTIONS.map((emoji) => (
                              <Button
                                key={emoji}
                                size="small"
                                type="text"
                                style={{ fontSize: 18, padding: '0 4px', height: 30 }}
                                onClick={() => {
                                  toggleReactionMutation.mutate({ id: messageItem._id, emoji });
                                  setReactionPickerFor(null);
                                }}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        }
                      >
                        <Button
                          type="text"
                          size="small"
                          shape="circle"
                          icon={<SmileOutlined />}
                          aria-label="Thả cảm xúc"
                        />
                      </Popover>
                      <Button
                        type="text"
                        size="small"
                        shape="circle"
                        icon={<EnterOutlined />}
                        aria-label="Trả lời"
                        onClick={() => setReplyTo(messageItem)}
                      />
                      <Dropdown
                        menu={{
                          items: menuItems,
                          onClick: ({ key }) => {
                            if (key === 'reply') setReplyTo(messageItem);
                            if (key === 'edit') openEdit(messageItem);
                            if (key === 'delete') {
                              Modal.confirm({
                                title: 'Thu hồi tin nhắn',
                                content: 'Tin nhắn sẽ bị thu hồi với mọi người trong hội thoại.',
                                okText: 'Thu hồi',
                                okButtonProps: { danger: true },
                                cancelText: 'Hủy',
                                onOk: () => onDelete(messageItem._id),
                              });
                            }
                            if (key === 'forward') {
                              setForwardingMessage(messageItem);
                              setForwardTargetIds([]);
                            }
                            if (key === 'pin') pinMutation.mutate(messageItem._id);
                            if (key === 'unpin') unpinMutation.mutate(messageItem._id);
                          },
                        }}
                        trigger={['click']}
                        placement={mine ? 'bottomRight' : 'bottomLeft'}
                      >
                        <Button
                          type="text"
                          size="small"
                          shape="circle"
                          icon={<MoreOutlined />}
                          aria-label="Thao tác khác"
                        />
                      </Dropdown>
                    </div>
                  )}
                </div>
                {!messageItem.isDeleted && messageItem.reactions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      maxWidth: '70%',
                      marginTop: 4,
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {Object.entries(
                      messageItem.reactions.reduce<Record<string, number>>((counts, reaction) => {
                        counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
                        return counts;
                      }, {}),
                    ).map(([emoji, count]) => (
                      <Button
                        key={`${emoji}-${count}`}
                        size="small"
                        onClick={() => toggleReactionMutation.mutate({ id: messageItem._id, emoji })}
                        style={{ height: 22, padding: '0 6px' }}
                      >
                        {emoji} {count}
                      </Button>
                    ))}
                  </div>
                )}
                <Text
                  type={messageItem.status === 'failed' ? 'danger' : 'secondary'}
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    marginLeft: showSenderInfo ? 36 : 0,
                  }}
                >
                  {messageItem.status === 'sending' && 'Đang gửi...'}
                  {messageItem.status === 'failed' && (
                    <>
                      Gửi thất bại{' '}
                      <Button
                        type="link"
                        size="small"
                        icon={<RedoOutlined />}
                        onClick={() => onRetry(messageItem)}
                        style={{ padding: 0, height: 'auto' }}
                      >
                        Thử lại
                      </Button>
                    </>
                  )}
                  {messageItem.status !== 'sending' && messageItem.status !== 'failed' && (
                    <>
                      {formatMessageTime(messageItem.createdAt)}
                      {messageItem.isEdited && !messageItem.isDeleted ? ' · Đã chỉnh sửa' : ''}
                      {mine && (
                        <span style={{ color: seenByPeer ? '#1677ff' : undefined }}>
                          {seenByPeer ? ' · ✓✓' : isDelivered ? ' · ✓✓' : ' · ✓'}
                        </span>
                      )}
                      {seenByPeer ? ' · Đã xem' : ''}
                      {isLastOwn && isGroup && groupSeenCount > 0
                        ? ` · Đã xem bởi ${groupSeenCount} người`
                        : ''}
                    </>
                  )}
                </Text>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#eef0f7] bg-white p-3 md:p-4 md:px-6">
        {replyTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 10,
              padding: '8px 12px',
              borderRadius: 10,
              background: '#f4f5fb',
              borderLeft: '3px solid #5b5bf6',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 12 }}>
                Trả lời {replyTo.senderId.username}
              </Text>
              <div>
                <Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block' }}>
                  {replyTo.isDeleted ? 'Tin nhắn đã thu hồi' : replyTo.content || `[${replyTo.type}]`}
                </Text>
              </div>
            </div>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setReplyTo(null)} />
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
        {uploading && uploadProgress !== null && (
          <Progress percent={uploadProgress} size="small" style={{ marginBottom: 10 }} />
        )}
        <div style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'center' }}>
          {mentionCandidates.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 100,
                width: 240,
                padding: 4,
                borderRadius: 8,
                background: '#fff',
                boxShadow: '0 4px 16px rgba(20,20,60,0.16)',
                zIndex: 2,
              }}
            >
              {mentionCandidates.map((member) => (
                <Button
                  key={member.userId._id}
                  type="text"
                  block
                  style={{ textAlign: 'left', height: 34 }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertMention(member.userId.username)}
                >
                  @{member.userId.username}
                </Button>
              ))}
            </div>
          )}
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
          <Button
            type={isRecording ? 'primary' : 'text'}
            danger={isRecording}
            icon={<AudioOutlined style={{ fontSize: 18 }} />}
            shape="circle"
            disabled={isBlocked || uploading}
            onClick={handleRecordAudio}
            aria-label={isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
          />
          <Input
            ref={messageInputRef}
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

      <Modal
        title="Thư viện ảnh"
        open={galleryOpen}
        onCancel={() => setGalleryOpen(false)}
        footer={null}
        width={760}
      >
        {galleryLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : galleryAttachments.length ? (
          <Image.PreviewGroup>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {galleryAttachments.map((attachment) => (
                <Image
                  key={attachment._id}
                  src={attachment.thumbnailUrl || attachment.url}
                  preview={{ src: attachment.url }}
                  alt={attachment.fileName}
                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        ) : (
          <Empty description="Chưa có ảnh trong hội thoại này" />
        )}
      </Modal>

      <Modal
        title="Chuyển tiếp tin nhắn"
        open={!!forwardingMessage}
        onCancel={() => setForwardingMessage(null)}
        onOk={() => {
          if (!forwardingMessage || forwardTargetIds.length === 0) return;
          forwardMutation.mutate(
            { id: forwardingMessage._id, targetConversationIds: forwardTargetIds },
            {
              onSuccess: () => {
                msg.success('Đã chuyển tiếp tin nhắn');
                setForwardingMessage(null);
              },
            },
          );
        }}
        okText="Chuyển tiếp"
        cancelText="Hủy"
        confirmLoading={forwardMutation.isPending}
        okButtonProps={{ disabled: forwardTargetIds.length === 0 }}
      >
        <Text type="secondary">Chọn các hội thoại nhận tin nhắn:</Text>
        <div style={{ marginTop: 12, maxHeight: 280, overflowY: 'auto' }}>
          {conversationsData?.data.items
            .filter((item) => item._id !== conversationId)
            .map((item) => (
              <div key={item._id} style={{ padding: '6px 0' }}>
                <Checkbox
                  checked={forwardTargetIds.includes(item._id)}
                  onChange={(event) =>
                    setForwardTargetIds((current) =>
                      event.target.checked
                        ? [...current, item._id]
                        : current.filter((id) => id !== item._id),
                    )
                  }
                >
                  {item.type === 'group' ? item.name : item.otherMember?.username || 'Hội thoại riêng'}
                </Checkbox>
              </div>
            ))}
        </div>
      </Modal>

      <Modal
        title="Chỉnh sửa tin nhắn"
        open={!!editingMessage}
        onCancel={() => setEditingMessage(null)}
        onOk={confirmEdit}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ disabled: !editDraft.trim() }}
      >
        <Input.TextArea
          rows={3}
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          maxLength={4000}
        />
      </Modal>

      <Modal
        title="Tóm tắt hội thoại"
        open={summaryOpen}
        onCancel={() => setSummaryOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSummaryOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        <Text style={{ whiteSpace: 'pre-wrap' }}>{summaryText}</Text>
      </Modal>

      {isGroup && (
        <GroupSettingsModal
          open={groupSettingsOpen}
          onClose={() => setGroupSettingsOpen(false)}
          conversationId={conversation._id}
          conversationName={conversation.name}
          inviteToken={conversation.inviteToken}
          inviteEnabled={conversation.inviteEnabled}
          members={members}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default ChatWindow;
