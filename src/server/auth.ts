import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, verifyPassword } from './db.js';
import { User } from '../types/form.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + sevenDaysMs;

  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(token, userId, expiresAt);

  return token;
}

export function deleteSession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getUserByToken(token: string): User | null {
  if (!token) return null;
  const now = Date.now();

  const row = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at, s.expires_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as (User & { expires_at: number }) | undefined;

  if (!row) {
    // If expired, clean it up
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie or Authorization header
  let token = req.cookies?.formflow_session;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Por favor inicia sesión.' });
  }

  const user = getUserByToken(token);
  if (!user) {
    res.clearCookie('formflow_session');
    return res.status(401).json({ error: 'Sesión expirada o no válida.' });
  }

  req.user = user;
  next();
}
