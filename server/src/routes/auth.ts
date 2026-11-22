import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma, HttpError, audit, patientCode, notify } from '../lib/core.js';
import { ah, parse } from '../middleware/common.js';
import jwt from 'jsonwebtoken';
import { requireAuth, signSession, clearSession, AUTH_COOKIE } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { sendEmail, templates } from '../services/email.js';

export const authRouter = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Тым көп әрекет. Біраздан кейін қайталаңыз.' } });
const codeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'Тым көп сұраныс. 15 минуттан кейін қайталаңыз.' } });

const CODE_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const RESEND_GAP_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

/** Secrets (codes, reset tokens) are stored only as keyed HMAC-SHA256 digests. */
const digest = (value: string) => crypto.createHmac('sha256', env.jwtSecret).update(value).digest('hex');
const safeEqual = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const devMode = () => !env.smtp.configured && env.emailDevFallback;

const password = z
  .string()
  .min(8, 'Құпиясөз кемінде 8 таңбадан тұруы керек')
  .max(72)
  .regex(/[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/, 'Құпиясөзде әріп болуы керек')
  .regex(/\d/, 'Құпиясөзде сан болуы керек');
const emailField = z.string().trim().toLowerCase().email('Email мекенжайы дұрыс емес').max(191);

export const publicUser = (u: { id: number; email: string; fullName: string; role: string }) => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role });

/** Creates a fresh 6-digit code (older ones are invalidated) and e-mails it. */
async function issueVerificationCode(user: { id: number; email: string; fullName: string }) {
  const last = await prisma.emailVerification.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_GAP_MS) {
    const wait = Math.ceil((RESEND_GAP_MS - (Date.now() - last.createdAt.getTime())) / 1000);
    throw new HttpError(429, `Кодты қайта сұрау үшін ${wait} секунд күтіңіз`);
  }
  const hourCount = await prisma.emailVerification.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
  if (hourCount >= 5) throw new HttpError(429, 'Бір сағатта 5 реттен көп код сұрауға болмайды');
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailVerification.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });
  await prisma.emailVerification.create({ data: { userId: user.id, codeHash: digest(`${user.id}:${code}`), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
  const t = templates.verifyCode(user.fullName, code);
  const sent = await sendEmail({ to: user.email, template: 'verify_code', userId: user.id, ...t });
  // If the mail could not be delivered (e.g. the host blocks SMTP), show the code on screen so sign-up still works.
  return { sent, devCode: devMode() || (sent.status === 'FAILED' && env.emailDevFallback) ? code : undefined };
}

// ---------- Registration with e-mail verification ----------
const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Аты-жөніңізді толық жазыңыз').max(120),
  email: emailField,
  password,
  dateOfBirth: z.coerce.date().max(new Date(), 'Туған күн болашақта болмауы керек').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

authRouter.post('/register', limiter, ah(async (req, res) => {
  const data = parse(registerSchema, req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  let user = await prisma.user.findUnique({ where: { email: data.email } });
  if (user?.emailVerifiedAt) throw new HttpError(409, 'Бұл email тіркелген. Жүйеге кіріңіз немесе құпиясөзді қалпына келтіріңіз.');
  if (user) {
    // Unverified account: the person proving ownership of the mailbox wins; refresh the pending data.
    user = await prisma.user.update({ where: { id: user.id }, data: { fullName: data.fullName, passwordHash } });
  } else {
    user = await prisma.user.create({
      data: {
        email: data.email, fullName: data.fullName, passwordHash, role: 'PATIENT',
        patientProfile: { create: { patientCode: patientCode(), dateOfBirth: data.dateOfBirth, gender: data.gender } },
      },
    });
    await audit(req, 'auth.register', 'user', user.id, undefined, user.id);
  }
  const { sent, devCode } = await issueVerificationCode(user);
  res.status(201).json({ needsVerification: true, email: user.email, emailStatus: sent.status, devCode });
}));

authRouter.post('/resend-code', codeLimiter, ah(async (req, res) => {
  const { email } = parse(z.object({ email: emailField }), req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) return res.json({ ok: true }); // no account enumeration
  const { sent, devCode } = await issueVerificationCode(user);
  res.json({ ok: true, emailStatus: sent.status, devCode });
}));

authRouter.post('/verify-email', codeLimiter, ah(async (req, res) => {
  const { email, code } = parse(z.object({ email: emailField, code: z.string().trim().regex(/^\d{6}$/, 'Код 6 саннан тұрады') }), req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(400, 'Код қате немесе мерзімі өтті');
  if (user.emailVerifiedAt) throw new HttpError(400, 'Email бұрын расталған. Жүйеге кіріңіз.');
  const rec = await prisma.emailVerification.findFirst({ where: { userId: user.id, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!rec || rec.expiresAt < new Date()) throw new HttpError(400, 'Кодтың мерзімі өтті. Жаңа код сұраңыз.');
  if (rec.attempts >= MAX_CODE_ATTEMPTS) throw new HttpError(429, 'Тым көп қате әрекет. Жаңа код сұраңыз.');
  if (!safeEqual(rec.codeHash, digest(`${user.id}:${code}`))) {
    await prisma.emailVerification.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    await audit(req, 'auth.verify_failed', 'user', user.id, undefined, user.id);
    throw new HttpError(400, `Код қате. Қалған әрекет: ${MAX_CODE_ATTEMPTS - rec.attempts - 1}`);
  }
  await prisma.$transaction([
    prisma.emailVerification.update({ where: { id: rec.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), lastLoginAt: new Date() } }),
  ]);
  await notify(user.id, 'MEDMAP 3D-ге қош келдіңіз', '3D дене картасында аймақты таңдап, алғашқы өтініміңізді жіберіңіз.', 'success', '/app/body-map');
  await audit(req, 'auth.email_verified', 'user', user.id, undefined, user.id);
  signSession(res, user);
  res.json({ user: publicUser(user) });
}));

// ---------- Login ----------
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);
const loginSchema = z.object({ email: emailField, password: z.string().min(1, 'Құпиясөзді енгізіңіз').max(200) });

authRouter.post('/login', limiter, ah(async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Always run a bcrypt compare so response time does not reveal whether the account exists.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    await audit(req, 'auth.login_failed', 'user', user?.id, { email });
    throw new HttpError(401, 'Email немесе құпиясөз қате');
  }
  if (!user.isActive) throw new HttpError(403, 'Аккаунт бұғатталған. Әкімшіге хабарласыңыз.');
  if (!user.emailVerifiedAt) throw new HttpError(403, 'Email расталмаған. Поштаңызға келген кодты енгізіңіз.', { code: 'EMAIL_NOT_VERIFIED', email: user.email });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(req, 'auth.login', 'user', user.id, undefined, user.id);
  signSession(res, user);
  res.json({ user: publicUser(user) });
}));

authRouter.post('/logout', ah(async (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
}));

/** Session probe for the web app: 200 with `user: null` when signed out (no console noise, no error). */
authRouter.get('/session', ah(async (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.json({ user: null });
  let id: number;
  try {
    id = Number((jwt.verify(token, env.jwtSecret) as jwt.JwtPayload).sub);
  } catch {
    return res.json({ user: null });
  }
  const u = await prisma.user.findUnique({ where: { id }, include: { patientProfile: true, doctorProfile: true, pharmacyProfile: true } });
  if (!u || !u.isActive) return res.json({ user: null });
  const { passwordHash: _, ...safe } = u;
  res.json({ user: safe });
}));

authRouter.get('/me', requireAuth, ah(async (req, res) => {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    include: { patientProfile: true, doctorProfile: true, pharmacyProfile: true },
  });
  const { passwordHash: _, ...safe } = u;
  res.json({ user: safe });
}));

// ---------- Password reset (one-time, expiring, hashed token) ----------
authRouter.post('/forgot-password', codeLimiter, ah(async (req, res) => {
  const { email } = parse(z.object({ email: emailField }), req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  const generic = { ok: true, message: 'Егер бұл email тіркелген болса, қалпына келтіру сілтемесі жіберілді.' };
  if (!user || !user.isActive) return res.json(generic);
  const recent = await prisma.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
  if (recent >= 3) throw new HttpError(429, 'Бір сағатта 3 реттен көп сұрауға болмайды');
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordReset.create({ data: { userId: user.id, tokenHash: digest(token), expiresAt: new Date(Date.now() + RESET_TTL_MS), ipAddress: req.ip?.slice(0, 64) } });
  const url = `${env.appUrl}/reset-password?token=${token}`;
  const t = templates.resetPassword(user.fullName, url);
  const sent = await sendEmail({ to: user.email, template: 'reset_password', userId: user.id, ...t });
  await audit(req, 'auth.reset_requested', 'user', user.id, undefined, user.id);
  res.json({ ...generic, emailStatus: sent.status, devResetPath: devMode() || (sent.status === 'FAILED' && env.emailDevFallback) ? `/reset-password?token=${token}` : undefined });
}));

authRouter.post('/reset-password', codeLimiter, ah(async (req, res) => {
  const { token, password: newPassword } = parse(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Сілтеме жарамсыз'), password }), req.body);
  const rec = await prisma.passwordReset.findUnique({ where: { tokenHash: digest(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new HttpError(400, 'Сілтеме жарамсыз немесе мерзімі өтті. Жаңа сілтеме сұраңыз.');
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash, emailVerifiedAt: undefined } }),
    prisma.user.updateMany({ where: { id: rec.userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } }), // the mailbox owner proved access
    prisma.passwordReset.updateMany({ where: { userId: rec.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await audit(req, 'auth.password_reset', 'user', rec.userId, undefined, rec.userId);
  res.json({ ok: true });
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
