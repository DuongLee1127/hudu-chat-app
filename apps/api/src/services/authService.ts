import User from '@/models/user';
import bcrypt from 'bcrypt';
import { generateToken } from '@/providers/JwtProvider';

const authService = {
  login: async (email: string, password: string) => {
    try {
      if (!email || !password) throw Error('Mật khẩu và email không được để trống!');
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw Error('Không tìm thấy người dùng này!');
      if (password.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự!');

      const validatePassword = await bcrypt.compare(password, user.password);
      if (!validatePassword) throw Error('Mật khẩu không chính xác!');

      const jwtAccessToken = process.env.JWT_ACCESS_TOKEN;
      const jwtRefreshToken = process.env.JWT_REFRESH_TOKEN;

      if (!jwtAccessToken || !jwtRefreshToken) {
        throw new Error('JWT environment variables are not defined!');
      }

      const payload = {
        id: user._id,
        email: user.email,
        username: user.username,
      };

      const accessToken = generateToken(payload, jwtAccessToken, '1h');
      const refreshToken = generateToken(payload, jwtRefreshToken, '7 days');

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
        username,
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
};

export default authService;
