import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase, User } from './db.js';

// JWT_SECRET must come from the environment in production — there is no
// production fallback. In development we allow a clearly-labelled insecure
// default so `npm run dev` works out of the box without requiring a .env file.
const DEV_ONLY_JWT_SECRET = 'ironcore-DEV-ONLY-insecure-secret-do-not-use-in-production';

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production. Set it before starting the server.'
    );
  }

  console.warn(
    '[auth] JWT_SECRET is not set — using an insecure development-only default. ' +
      'This is NOT safe for production; set JWT_SECRET in your .env file.'
  );
  return DEV_ONLY_JWT_SECRET;
}

const JWT_SECRET = resolveJwtSecret();

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'TRAINER' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User, rememberMe = false): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === payload.userId);

  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: ('USER' | 'TRAINER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
