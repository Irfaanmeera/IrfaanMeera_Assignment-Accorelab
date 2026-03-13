import { authRepository } from './auth.repository';
import jwt from 'jsonwebtoken';

export const authService = {
  login: async (email: string, password: string) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      const err = new Error('Invalid credentials') as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }

    if (password !== user.password) {
      const err = new Error('Invalid credentials') as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const err = new Error('Server misconfigured: missing JWT secret') as Error & { statusCode?: number };
      err.statusCode = 500;
      throw err;
    }

    const token = jwt.sign({ email: user.email, role: user.role }, secret, {
      subject: user.id,
      expiresIn: '7d',
    });

    return { user: { id: user.id, email: user.email, role: user.role }, token };
  },


  getProfile: async (userId: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role };
  },
};
