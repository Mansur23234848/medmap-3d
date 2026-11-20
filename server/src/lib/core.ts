import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import type { Request } from 'express';

export const prisma = new PrismaClient();

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const notFound = (what = 'Ресурс') => new HttpError(404, `${what} табылмады`);
export const forbidden = (msg = 'Бұл әрекетке рұқсат жоқ') => new HttpError(403, msg);

/** Unambiguous alphabet (no 0/O/1/I) for human-readable codes. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
export const prescriptionCode = () => `RX-${randomCode(4)}-${randomCode(4)}`;
export const patientCode = () => `MM-${randomCode(6)}`;

export async function audit(
  req: Request | null,
  action: string,
  entityType?: string,
  entityId?: string | number,
  metadata?: Record<string, unknown>,
  userIdOverride?: number,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userIdOverride ?? req?.user?.id ?? null,
        action,
        entityType,
        entityId: entityId != null ? String(entityId) : undefined,
        ipAddress: req?.ip?.slice(0, 64),
        userAgent: req?.get('user-agent')?.slice(0, 255),
        metadata: metadata as object | undefined,
      },
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}

export async function notify(userId: number, title: string, message: string, type = 'info', link?: string) {
  await prisma.notification.create({ data: { userId, title, message, type, link } });
}

/** Mask a full name for limited-disclosure contexts, e.g. "Айгерім Серікова" -> "Айгерім С." */
export function maskName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function computeAge(dob?: Date | null): number | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
