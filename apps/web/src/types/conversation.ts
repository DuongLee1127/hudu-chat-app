import type { User } from './user';
import type { MessageType, Message } from './message';

export type ConversationType = 'private' | 'group' | 'self';

export interface ConversationLastMessage {
  _id: string;
  content: string;
  type: MessageType;
  isDeleted: boolean;
  senderId?: { _id: string; username: string } | string;
}

export interface Conversation {
  _id: string;
  name?: string;
  type: ConversationType;
  avatar?: string;
  creatorId?: string;
  lastMessageId?: string;
  pinnedMessageIds?: string[];
  inviteToken?: string;
  inviteEnabled: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberSetting {
  isArchived: boolean;
  mutedUntil?: string | null;
}

export interface ConversationOtherMember {
  _id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

export interface ConversationListItem extends Conversation {
  memberSetting: MemberSetting | null;
  otherMember?: ConversationOtherMember | null;
  lastMessage?: ConversationLastMessage | null;
  unreadCount?: number;
}

export interface ConversationMember {
  _id: string;
  conversationId: string;
  userId: User;
  role: 'admin' | 'member';
  joinedAt: string;
  lastReadAt: string;
  lastReadMessageId?: string | null;
  mutedUntil?: string | null;
  isArchived: boolean;
}

export interface CreateGroupPayload {
  name: string;
  memberIds: string[];
  avatarUrl?: string;
}

export interface UpdateConversationPayload {
  name?: string;
  avatarUrl?: string;
}

export interface ListConversationsParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface ConversationDetailResult {
  conversation: Conversation;
  members: ConversationMember[];
  pinnedMessages: Message[];
}
