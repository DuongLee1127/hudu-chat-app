import bcrypt from 'bcrypt';

import User from '@/models/user';
import RefreshToken from '@/models/refresh_token';
import { generateToken, verifyToken } from '@/providers/JwtProvider';
import { sanitizeText } from '@/helpers/sanitize';

const authService = {
  login: async (email: string, password: string) => {
    try {
      if (!email || !password) throw Error('Mật khẩu và email không được để trống!');
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw Error('Không tìm thấy người dùng này!');
      if (password.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự!');

      const validatePassword = await bcrypt.compare(password, user.password);
      if (!validatePassword) throw Error('Mật khẩu không chính xác!');

      if (user.accountStatus === 'locked') {
        throw new Error(
          user.lockReason
            ? `Tài khoản của bạn đã bị khóa: ${user.lockReason}`
            : 'Tài khoản của bạn đã bị khóa!',
        );
      }

      const jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
      const jwtRefreshToken = process.env.JWT_REFRESH_TOKEN;

      if (!jwtAccessToken || !jwtRefreshToken) {
        throw new Error('JWT environment variables are not defined!');
      }

      const payload = {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      };

      const accessToken = generateToken(payload, jwtAccessToken, '1h');
      const refreshToken = generateToken(payload, jwtRefreshToken, '7d');

      // Lưu refresh token vào database hỗ trợ đa thiết bị
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt,
      });

      return { accessToken, refreshToken, ...payload };
    } catch (error) {
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      if (!username || !email || !password) {
        throw new Error('Vui lòng nhập đầy đủ thông tin!');
      }
      if (password.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự!');

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        throw new Error('Email hoặc username đã tồn tại!');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create({
        username: sanitizeText(username),
        email,
        password: hashedPassword,
      });

      return {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      };
    } catch (error) {
      throw error;
    }
  },

  refreshToken: async (token: string) => {
    try {
      if (!token) throw new Error('Refresh token is required!');

      const jwtRefreshToken = process.env.JWT_REFRESH_TOKEN;
      const jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
      if (!jwtAccessToken || !jwtRefreshToken) {
        throw new Error('JWT environment variables are not defined!');
      }

      // Verify token
      const decoded = (await verifyToken(token, jwtRefreshToken)) as any;
      if (!decoded || !decoded.id) {
        throw new Error('Invalid refresh token!');
      }

      // Check refresh token in database (must exist, not expired, not revoked)
      const dbToken = await RefreshToken.findOne({
        token,
        userId: decoded.id,
        expiresAt: { $gt: new Date() },
        revokedAt: { $exists: false },
      });
      if (!dbToken) {
        throw new Error('Refresh token is invalid, expired or revoked!');
      }

      // Find user
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found!');
      }

      const payload = {
        id: user._id,
        email: user.email,
        username: user.username,
      };

      const newAccessToken = generateToken(payload, jwtAccessToken, '1h');

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw error;
    }
  },

  logout: async (token: string) => {
    try {
      if (!token) throw new Error('Refresh token is required!');
      await RefreshToken.deleteOne({ token });
    } catch (error) {
      throw error;
    }
  },

  logoutAll: async (token: string) => {
    try {
      if (!token) throw new Error('Refresh token is required!');

      const jwtRefreshToken = process.env.JWT_REFRESH_TOKEN;
      if (!jwtRefreshToken) {
        throw new Error('JWT environment variables are not defined!');
      }

      const decoded = (await verifyToken(token, jwtRefreshToken)) as any;
      if (!decoded || !decoded.id) {
        throw new Error('Invalid refresh token!');
      }

      await RefreshToken.deleteMany({ userId: decoded.id });
    } catch (error) {
      throw error;
    }
  },

  getMe: async (userId: string) => {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Không tìm thấy người dùng!');
      return user;
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

export default authService;
