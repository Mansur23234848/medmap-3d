import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { ZodError, type ZodTypeAny, type infer as zInfer } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../lib/core.js';

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): zInfer<S> {
  return schema.parse(data);
}

export function idParam(req: Request, name = 'id'): number {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Қате идентификатор');
  return n;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Деректер дұрыс толтырылмаған',
      fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details });
  if ((err as { type?: string })?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Сұраныс форматы дұрыс емес' });
  if ((err as { type?: string })?.type === 'entity.too.large') return res.status(413).json({ error: 'Сұраныс тым үлкен' });
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `Файл көлемі ${env.maxUploadBytes / 1024 / 1024} МБ-тан аспауы керек` : 'Файл жүктеу қатесі';
    return res.status(400).json({ error: msg });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Мұндай жазба бұрыннан бар' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Жазба табылмады' });
    if (err.code === 'P2003') return res.status(409).json({ error: 'Байланысқан деректер болғандықтан әрекет орындалмады' });
  }
  console.error(err);
  res.status(500).json({ error: 'Сервердің ішкі қатесі' });
}

// ---------- File uploads ----------
const ALLOWED: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

fs.mkdirSync(env.uploadDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: env.maxUploadBytes, files: 3 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ALLOWED[file.mimetype];
    if (!okExt || !okExt.includes(ext)) return cb(new HttpError(400, 'Тек JPG, PNG, WEBP немесе PDF файлдарына рұқсат'));
    cb(null, true);
  },
});

/** Magic-byte verification after upload; deletes files whose content doesn't match their declared type. */
export function verifyUploadedFiles(files: Express.Multer.File[]) {
  for (const f of files) {
    const fd = fs.openSync(f.path, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    const hex = buf.toString('hex');
    const ok =
      (f.mimetype === 'image/jpeg' && hex.startsWith('ffd8ff')) ||
      (f.mimetype === 'image/png' && hex.startsWith('89504e47')) ||
      (f.mimetype === 'image/webp' && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') ||
      (f.mimetype === 'application/pdf' && buf.subarray(0, 4).toString() === '%PDF');
    if (!ok) {
      files.forEach((x) => fs.existsSync(x.path) && fs.unlinkSync(x.path));
      throw new HttpError(400, 'Файл мазмұны оның түріне сәйкес емес');
    }
  }
}
