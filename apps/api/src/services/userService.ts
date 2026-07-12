import User from '@/models/user';
import Block from '@/models/block';
import { sanitizeText } from '@/helpers/sanitize';

const userService = {
  updateProfile: async (
    userId: string,
    data: { username?: string; avatar?: string; bio?: string },
  ) => {
    try {
      const update: { username?: string; avatar?: string; bio?: string } = {};
      if (data.avatar !== undefined) update.avatar = data.avatar;
      if (data.username !== undefined) update.username = sanitizeText(data.username);
      if (data.bio !== undefined) update.bio = sanitizeText(data.bio);

      if (update.username) {
        const existing = await User.findOne({ username: update.username, _id: { $ne: userId } });
        if (existing) {
          throw new Error('Tên tài khoản này đã tồn tại!');
        }
      }

      const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
      if (!updatedUser) throw new Error('Không tìm thấy người dùng!');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const users = await User.find().select('-password');
      return users;
    } catch (error) {
      throw error;
    }
  },

  searchUsers: async (
    currentUserId: string,
    q: string,
    page: number = 1,
    pageSize: number = 10,
  ) => {
    try {
      const skip = (page - 1) * pageSize;

      const filter: any = {
        _id: { $ne: currentUserId },
      };

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

  getUserProfile: async (userId: string) => {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) throw new Error('Không tìm thấy người dùng!');
      return user;
    } catch (error) {
      throw error;
    }
  },

  blockUser: async (userId: string, blockedUserId: string) => {
    try {
      if (userId === blockedUserId) {
        throw new Error('Bạn không thể chặn chính mình!');
      }

      const targetUser = await User.findById(blockedUserId);
      if (!targetUser) {
        throw new Error('Không tìm thấy người dùng định chặn!');
      }

      const existingBlock = await Block.findOne({ userId, blockedUserId });
      if (!existingBlock) {
        await Block.create({ userId, blockedUserId });
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  unblockUser: async (userId: string, blockedUserId: string) => {
    try {
      await Block.deleteOne({ userId, blockedUserId });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  getBlockedUsers: async (userId: string, page: number = 1, pageSize: number = 10) => {
    try {
      const skip = (page - 1) * pageSize;
      const filter = { userId };

      const [items, total] = await Promise.all([
        Block.find(filter)
          .populate({
            path: 'blockedUserId',
            select: '_id username email avatar status bio',
          })
          .skip(skip)
          .limit(pageSize)
          .exec(),
        Block.countDocuments(filter),
      ]);

      const userItems = items.map((block) => block.blockedUserId as any).filter(Boolean);

      const totalPages = Math.ceil(total / pageSize);

      return {
        items: userItems,
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
};

export default userService;
