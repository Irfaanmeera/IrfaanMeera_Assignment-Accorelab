import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { authService } from './auth.service';
import type { AuthRequest } from '../../middleware/authenticate.middleware';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  },


  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id || '';
    const profile = await authService.getProfile(userId);
    sendSuccess(res, profile);
  },
};
