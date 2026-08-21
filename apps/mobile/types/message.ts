export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';

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
  senderId: { _id: string; username: string };
  type: MessageType;
  isDeleted: boolean;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageSender;
  content: string;
  type: MessageType;
  attachmentIds: MessageAttachment[];
  replyToMessageId?: MessageReplyPreview | null;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedById?: MessageSender;
  createdAt: string;
  updatedAt: string;
  /** Client-only fields, never persisted on the backend. */
  tempId?: string;
  status?: 'sending' | 'sent' | 'failed';
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

export type AttachmentMediaType = 'image' | 'video' | 'file';

export interface ListAttachmentsParams {
  type?: AttachmentMediaType;
  cursor?: string;
  limit?: number;
}

export interface ListAttachmentsResult {
  items: MessageAttachment[];
  nextCursor: string | null;
}
