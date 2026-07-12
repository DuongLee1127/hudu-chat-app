import { Request, Response } from 'express';
import ms from 'ms';

import authService from '@/services/authService';
import { sendSuccess, sendError } from '@/helpers';
import { logger } from '@/helpers/logger';

const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      const { accessToken, refreshToken } = result;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: ms('15m'),
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: ms('14d'),
      });

      return sendSuccess(res, result, 'Login success', 200);
    } catch (error) {
      logger.error(`Login failed for email=${req.body?.email}`, error);
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      const result = await authService.register(username, email, password);

      return sendSuccess(res, result, 'Register success', 201);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      return sendSuccess(res, null, 'Logout success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  logoutAll: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required!', 400);
      }

      await authService.logoutAll(refreshToken);

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      return sendSuccess(res, null, 'Logged out of all devices successfully', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required!', 400);
      }

      const result = await authService.refreshToken(refreshToken);
      const { accessToken: newAccessToken } = result;

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: ms('15m'),
      });

      return sendSuccess(res, result, 'Refresh token success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const result = await authService.getMe(String(userId));
      return sendSuccess(res, result, 'Get profile success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(String(userId), oldPassword, newPassword);
      return sendSuccess(res, result, 'Change password success', 200);
    } catch (error) {
      return sendError(res, error instanceof Error ? error.message : 'Internal server error', 500);
    }
  },
};

export default authController;
