import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { authService } from './auth.service';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  },


  getProfile: async (req: Request, res: Response): Promise<void> => {
    const userId = (req as { user?: { id: string } }).user?.id ?? '';
    const profile = await authService.getProfile(userId);
    sendSuccess(res, profile);
  },
};
