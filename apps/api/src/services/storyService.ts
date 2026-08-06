import Story from '@/models/story';
import Friend from '@/models/friend';
import attachmentService from '@/services/attachmentService';
import { IMAGE_MIME_TYPES } from '@/config/upload';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export const getFriendIds = async (userId: string) => {
  const friendships = await Friend.find({
    status: 'accepted',
    $or: [{ requesterId: userId }, { recipientId: userId }],
  });

  return friendships.map((f) =>
    String(f.requesterId) === userId ? String(f.recipientId) : String(f.requesterId),
  );
};

const assertCanViewUserStories = async (viewerId: string, targetUserId: string) => {
  if (viewerId === targetUserId) return;
  const friendIds = await getFriendIds(viewerId);
  if (!friendIds.includes(targetUserId)) {
    throw new Error('Bạn không thể xem story của người này!');
  }
};

const storyService = {
  createStory: async (userId: string, file: Express.Multer.File, caption?: string) => {
    try {
      if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Story chỉ hỗ trợ tệp ảnh!');
      }

      const attachment = await attachmentService.uploadFile(userId, file);

      const story = await Story.create({
        userId,
        attachmentId: attachment._id,
        caption: caption?.trim() || '',
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      });

      return Story.findById(story._id).populate({ path: 'attachmentId' });
    } catch (error) {
      throw error;
    }
  },

  listFeed: async (userId: string) => {
    try {
      const friendIds = await getFriendIds(userId);
      const userIds = [...friendIds, userId];

      const stories = await Story.find({
        userId: { $in: userIds },
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .populate({ path: 'attachmentId' })
        .populate({ path: 'userId', select: '_id username avatar' });

      const groupedByUser = new Map<string, typeof stories>();
      for (const story of stories) {
        // story.userId is populated (a User sub-document), so String(story.userId)
        // would stringify the whole object — use its _id instead.
        const key = String((story.userId as any)._id);
        const bucket = groupedByUser.get(key) || [];
        bucket.push(story);
        groupedByUser.set(key, bucket);
      }

      return Array.from(groupedByUser.entries()).map(([targetUserId, items]) => ({
        userId: targetUserId,
        user: items[0].userId,
        stories: items,
        hasUnviewed: items.some((s) => !s.viewerIds.some((v) => String(v) === userId)),
      }));
    } catch (error) {
      throw error;
    }
  },

  getStoriesByUser: async (viewerId: string, targetUserId: string) => {
    try {
      await assertCanViewUserStories(viewerId, targetUserId);

      const stories = await Story.find({
        userId: targetUserId,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: 1 })
        .populate({ path: 'attachmentId' });

      if (viewerId !== targetUserId) {
        await Story.updateMany(
          { _id: { $in: stories.map((s) => s._id) } },
          { $addToSet: { viewerIds: viewerId } },
        );
      }

      return stories;
    } catch (error) {
      throw error;
    }
  },

  deleteStory: async (userId: string, storyId: string) => {
    try {
      const story = await Story.findById(storyId);
      if (!story) {
        throw new Error('Không tìm thấy story!');
      }
      if (String(story.userId) !== userId) {
        throw new Error('Bạn không có quyền xoá story này!');
      }

      await Story.deleteOne({ _id: storyId });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  listViewers: async (userId: string, storyId: string) => {
    try {
      const story = await Story.findById(storyId).populate({
        path: 'viewerIds',
        select: '_id username avatar',
      });
      if (!story) {
        throw new Error('Không tìm thấy story!');
      }
      if (String(story.userId) !== userId) {
        throw new Error('Bạn không có quyền xem danh sách này!');
      }

      return story.viewerIds;
    } catch (error) {
      throw error;
    }
  },
};

export default storyService;
