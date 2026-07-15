export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'system' | 'poll';

export interface MessageSender {
  _id: string;
  username: string;
  avatar?: string;
}

export interface MessageAttachment {
  _id: string;
  uploaderId: string;
  messageId: string | null;
  fileName: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface MessageReplyPreview {
  _id: string;
  content: string;
  senderId: string;
  type: MessageType;
  isDeleted: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: MessageSender | string;
}

export interface MessageLinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageSender;
  content: string;
  type: MessageType;
  attachmentIds: MessageAttachment[];
  replyToMessageId?: MessageReplyPreview | null;
  mentionedUserIds?: string[];
  linkPreview?: MessageLinkPreview | null;
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  deliveredTo?: string[];
  createdAt: string;
  updatedAt: string;
  /** Client-only fields, never persisted on the backend. */
  tempId?: string;
  pendingAttachmentIds?: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ListMessagesParams {
  before?: string;
  after?: string;
  limit?: number;
}

export interface ListMessagesResult {
  items: Message[];
  nextCursor: string | null;
}

export interface SendMessagePayload {
  type?: MessageType;
  content?: string;
  attachmentIds?: string[];
  replyToMessageId?: string;
  tempId?: string;
}
