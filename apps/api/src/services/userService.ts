import bcrypt from 'bcrypt';
import User from '@/models/user';

const userService = {
  updateProfile: async (
    userId: string,
    data: { username?: string; avatar?: string; bio?: string },
  ) => {
    try {
      if (data.username) {
        const existing = await User.findOne({ username: data.username, _id: { $ne: userId } });
        if (existing) {
          throw new Error('Tên tài khoản này đã tồn tại!');
        }
      }

      const updatedUser = await User.findByIdAndUpdate(userId, data, { new: true });
      if (!updatedUser) throw new Error('Không tìm thấy người dùng!');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (userId: string, oldPass: string, newPass: string) => {
    try {
      if (!oldPass || !newPass) {
        throw new Error('Vui lòng cung cấp mật khẩu cũ và mật khẩu mới!');
      }
      if (newPass.length < 8) {
        throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự!');
      }

      const user = await User.findById(userId).select('+password');
      if (!user) throw new Error('Không tìm thấy người dùng!');

      const isMatch = await bcrypt.compare(oldPass, user.password);
      if (!isMatch) throw new Error('Mật khẩu cũ không chính xác!');

      const hashedNewPassword = await bcrypt.hash(newPass, 12);
      user.password = hashedNewPassword;
      await user.save();

      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
