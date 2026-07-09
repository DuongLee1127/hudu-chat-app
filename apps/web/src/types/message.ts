export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';

export interface MessageSender {
  _id: string;
  username: string;
  avatar?: string;
}

export interface MessageAttachment {
  _id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface MessageReplyPreview {
  _id: string;
  content: string;
  senderId: string;
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
  createdAt: string;
  updatedAt: string;
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
}
