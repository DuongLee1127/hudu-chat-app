import { Request, Response } from 'express';
import ms from 'ms';

import authService from '@/services/authService';
import { sendSuccess, sendError } from '@/helpers';

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
};

export default authController;
