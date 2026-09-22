import { randomBytes } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase, User } from './db.js';

// JWT_SECRET must come from the environment in production — there is no
// production fallback. In development we generate an ephemeral random secret so `npm run dev` works out of the box without requiring a .env file.
const DEV_ONLY_JWT_SECRET = randomBytes(32).toString('hex');

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured in production.');
  console.warn(
    '[auth] JWT_SECRET is not set — using an ephemeral development secret. ' +
      'Set JWT_SECRET in your Vercel Environment Variables for production security.'
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

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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

  try {
    const db = await getDatabase();
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
  } catch (err) {
    // A database error here must not look like "not authenticated" — surface
    // it as a real server error so it isn't mistaken for a bad/expired token.
    next(err);
  }
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
