import type { User } from './user';
import type { MessageAttachment } from './message';

export interface Story {
  _id: string;
  userId: string;
  attachmentId: MessageAttachment;
  caption?: string;
  viewerIds: string[];
  expiresAt: string;
  createdAt: string;
}

export interface StoryFeedGroup {
  userId: string;
  user: Pick<User, '_id' | 'username' | 'avatar'>;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface StoryViewer {
  _id: string;
  username: string;
  avatar?: string;
}
