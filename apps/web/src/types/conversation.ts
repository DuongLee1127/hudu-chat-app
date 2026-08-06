import type { User } from './user';
import type { MessageType } from './message';

export type ConversationType = 'private' | 'group';

export interface ConversationLastMessage {
  _id: string;
  content: string;
  type: MessageType;
  senderId: { _id: string; username: string };
  isDeleted: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  name?: string;
  type: ConversationType;
  avatar?: string;
  creatorId?: string;
  lastMessageId?: string;
  lastMessageAt: string;
  lastMessage?: ConversationLastMessage | null;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitePreview {
  _id: string;
  name?: string;
  avatar?: string;
  memberCount: number;
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
  unreadCount: number;
}

export interface ConversationMember {
  _id: string;
  conversationId: string;
  userId: User;
  role: 'admin' | 'member';
  joinedAt: string;
  lastReadAt: string;
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
  blockedByOther: boolean;
}
