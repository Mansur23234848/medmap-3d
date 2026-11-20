import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { HttpError, prisma } from '../lib/core.js';

export const AUTH_COOKIE = 'medmap_session';

export interface AuthUser {
  id: number;
  role: Role;
  email: string;
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signSession(res: Response, user: { id: number; role: Role }) {
  const token = jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSession(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
}

/** Verifies the httpOnly session cookie and re-loads the user so deactivated accounts lose access immediately. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) throw new HttpError(401, 'Жүйеге кіру қажет');
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    } catch {
      throw new HttpError(401, 'Сессия мерзімі аяқталды');
    }
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, role: true, email: true, fullName: true, isActive: true },
    });
    if (!user || !user.isActive) throw new HttpError(401, 'Аккаунт белсенді емес');
    req.user = { id: user.id, role: user.role, email: user.email, fullName: user.fullName };
    next();
  } catch (e) {
    next(e);
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Жүйеге кіру қажет'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Бұл бөлімге рұқсат жоқ'));
    next();
  };
