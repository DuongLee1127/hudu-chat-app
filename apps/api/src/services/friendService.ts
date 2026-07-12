import User from '@/models/user';
import Friend from '@/models/friend';
import { getIO } from '@/socket';

const friendService = {
  sendRequest: async (currentUserId: string, targetUserId: string) => {
    try {
      if (currentUserId === targetUserId) {
        throw new Error('Bạn không thể kết bạn với chính mình!');
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new Error('Không tìm thấy người dùng!');
      }

      const existing = await Friend.findOne({
        $or: [
          { requesterId: currentUserId, recipientId: targetUserId },
          { requesterId: targetUserId, recipientId: currentUserId },
        ],
      });

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Hai bạn đã là bạn bè!');
        }

        if (String(existing.requesterId) === currentUserId) {
          throw new Error('Bạn đã gửi lời mời kết bạn trước đó!');
        }

        // The other user already sent a pending request — accept it instead of duplicating.
        existing.status = 'accepted';
        await existing.save();

        getIO().to(`user:${String(existing.requesterId)}`).emit('friend_request:accepted', {
          userId: currentUserId,
        });

        return { success: true, status: 'accepted' };
      }

      await Friend.create({ requesterId: currentUserId, recipientId: targetUserId });

      getIO().to(`user:${targetUserId}`).emit('friend_request:new', {
        userId: currentUserId,
      });

      return { success: true, status: 'pending' };
    } catch (error) {
      throw error;
    }
  },

  respondToOrCancelRequest: async (currentUserId: string, otherUserId: string) => {
    try {
      const request = await Friend.findOneAndDelete({
        status: 'pending',
        $or: [
          { requesterId: currentUserId, recipientId: otherUserId },
          { requesterId: otherUserId, recipientId: currentUserId },
        ],
      });

      if (request) {
        getIO().to(`user:${otherUserId}`).emit('friend_request:removed', {
          userId: currentUserId,
        });
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  acceptRequest: async (currentUserId: string, requesterId: string) => {
    try {
      const request = await Friend.findOneAndUpdate(
        { requesterId, recipientId: currentUserId, status: 'pending' },
        { status: 'accepted' },
        { new: true },
      );

      if (!request) {
        throw new Error('Không tìm thấy lời mời kết bạn này!');
      }

      getIO().to(`user:${requesterId}`).emit('friend_request:accepted', {
        userId: currentUserId,
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  unfriend: async (currentUserId: string, otherUserId: string) => {
    try {
      const removed = await Friend.findOneAndDelete({
        status: 'accepted',
        $or: [
          { requesterId: currentUserId, recipientId: otherUserId },
          { requesterId: otherUserId, recipientId: currentUserId },
        ],
      });

      if (removed) {
        getIO().to(`user:${otherUserId}`).emit('friend_request:removed', {
          userId: currentUserId,
        });
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  getFriends: async (userId: string, q: string, page: number = 1, pageSize: number = 10) => {
    try {
      const relations = await Friend.find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { recipientId: userId }],
      }).select('requesterId recipientId');

      const friendIds = relations.map((r) =>
        String(r.requesterId) === userId ? r.recipientId : r.requesterId,
      );

      const skip = (page - 1) * pageSize;
      const filter: any = { _id: { $in: friendIds } };

      if (q) {
        filter.$or = [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ];
      }

      const [items, total] = await Promise.all([
        User.find(filter).skip(skip).limit(pageSize).exec(),
        User.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        meta: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  getIncomingRequests: async (userId: string) => {
    try {
      const requests = await Friend.find({ recipientId: userId, status: 'pending' })
        .populate({ path: 'requesterId', select: '_id username email avatar status bio' })
        .sort({ createdAt: -1 })
        .exec();

      return requests.map((r) => ({
        _id: r._id,
        user: r.requesterId,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      throw error;
    }
  },

  getOutgoingRequests: async (userId: string) => {
    try {
      const requests = await Friend.find({ requesterId: userId, status: 'pending' })
        .populate({ path: 'recipientId', select: '_id username email avatar status bio' })
        .sort({ createdAt: -1 })
        .exec();

      return requests.map((r) => ({
        _id: r._id,
        user: r.recipientId,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      throw error;
    }
  },
};

export default friendService;
