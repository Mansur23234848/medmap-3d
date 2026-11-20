import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma, HttpError, audit, patientCode, notify } from '../lib/core.js';
import { ah, parse } from '../middleware/common.js';
import { requireAuth, signSession, clearSession } from '../middleware/auth.js';

export const authRouter = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Тым көп әрекет. Біраздан кейін қайталаңыз.' } });

const password = z
  .string()
  .min(8, 'Құпиясөз кемінде 8 таңбадан тұруы керек')
  .max(72)
  .regex(/[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/, 'Құпиясөзде әріп болуы керек')
  .regex(/\d/, 'Құпиясөзде сан болуы керек');

const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Аты-жөніңізді толық жазыңыз').max(120),
  email: z.string().trim().toLowerCase().email('Email дұрыс емес').max(191),
  password,
  dateOfBirth: z.coerce.date().max(new Date(), 'Туған күн болашақта болмауы керек').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export const publicUser = (u: { id: number; email: string; fullName: string; role: string; createdAt?: Date }) => ({
  id: u.id, email: u.email, fullName: u.fullName, role: u.role,
});

authRouter.post('/register', limiter, ah(async (req, res) => {
  const data = parse(registerSchema, req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(409, 'Бұл email тіркелген');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email, fullName: data.fullName, passwordHash, role: 'PATIENT',
      patientProfile: { create: { patientCode: patientCode(), dateOfBirth: data.dateOfBirth, gender: data.gender } },
    },
  });
  await notify(user.id, 'MEDMAP 3D-ге қош келдіңіз', '3D дене картасында аймақты таңдап, алғашқы жазбаңызды қосыңыз.', 'success', '/app/body-map');
  await audit(req, 'auth.register', 'user', user.id, undefined, user.id);
  signSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);
const loginSchema =z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

authRouter.post('/login', limiter, ah(async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish time: always run a bcrypt compare to avoid user enumeration via timing.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await audit(req, 'auth.login_failed', 'user', user?.id, { email });
    throw new HttpError(401, 'Email немесе құпиясөз қате');
  }
  if (!user.isActive) throw new HttpError(403, 'Аккаунт бұғатталған. Әкімшіге хабарласыңыз.');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(req, 'auth.login', 'user', user.id, undefined, user.id);
  signSession(res, user);
  res.json({ user: publicUser(user) });
}));

authRouter.post('/logout', ah(async (req, res) => {
  clearSession(res);
  res.json({ ok: true });
}));

authRouter.get('/me', requireAuth, ah(async (req, res) => {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { patientProfile: true, doctorProfile: true, pharmacyProfile: true },
  });
  const { passwordHash: _, ...safe } = u;
  res.json({ user: safe });
}));

const changePw = z.object({ currentPassword: z.string().min(1), newPassword: password });
authRouter.post('/change-password', requireAuth, ah(async (req, res) => {
  const { currentPassword, newPassword } = parse(changePw, req.body);
  const u = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await bcrypt.compare(currentPassword, u.passwordHash))) throw new HttpError(400, 'Ағымдағы құпиясөз қате');
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await audit(req, 'auth.password_changed', 'user', u.id);
  res.json({ ok: true });
}));
