import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';

export type Role = 'admin' | 'sales' | 'accounts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      sendError(res, 'Server misconfigured: missing JWT secret', 500);
      return;
    }

    const payload = jwt.verify(token, secret) as {
      sub?: string;
      email?: string;
      role?: Role;
    };

    if (!payload.sub || !payload.email || !payload.role) {
      sendError(res, 'Invalid token', 401);
      return;
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    sendError(res, 'Invalid token', 401);
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Forbidden - insufficient permissions', 403);
      return;
    }

    next();
  };
}
