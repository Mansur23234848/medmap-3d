import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Prisma, Role } from '@prisma/client';
import { prisma, HttpError, audit, patientCode, notFound } from '../lib/core.js';
import { ah, parse, idParam } from '../middleware/common.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

// ---------- Statistics (computed live from the database) ----------
adminRouter.get('/stats', ah(async (_req, res) => {
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);
  const [byRole, reportsByStatus, rxByStatus, areaGroups, areas, recentReports, logins, totals] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.symptomReport.groupBy({ by: ['status'], _count: true }),
    prisma.prescription.groupBy({ by: ['status'], _count: true }),
    prisma.symptomReport.groupBy({ by: ['bodyAreaId'], _count: true }),
    prisma.bodyArea.findMany({ select: { id: true, slug: true, nameKk: true } }),
    prisma.symptomReport.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.activityLog.count({ where: { action: 'auth.login', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    Promise.all([prisma.medicalRecord.count(), prisma.medication.count({ where: { isActive: true } }), prisma.patientConsent.count({ where: { status: 'ACTIVE' } }), prisma.activityLog.count()]),
  ]);
  // Group by the server's LOCAL calendar day (not UTC) so "today" is always the last bar.
  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const days: { date: string; reports: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const key = dayKey(new Date(since.getFullYear(), since.getMonth(), since.getDate() + i));
    days.push({ date: key, reports: recentReports.filter((r) => dayKey(r.createdAt) === key).length });
  }
  const areaName = new Map(areas.map((a) => [a.id, a]));
  res.json({
    usersByRole: Object.fromEntries(byRole.map((r) => [r.role, r._count])),
    reportsByStatus: Object.fromEntries(reportsByStatus.map((r) => [r.status, r._count])),
    prescriptionsByStatus: Object.fromEntries(rxByStatus.map((r) => [r.status, r._count])),
    reportsByArea: areaGroups.map((g) => ({ slug: areaName.get(g.bodyAreaId)?.slug, name: areaName.get(g.bodyAreaId)?.nameKk, count: g._count })).sort((a, b) => b.count - a.count),
    reportsPerDay: days,
    loginsLast7d: logins,
    medicalRecords: totals[0],
    medications: totals[1],
    activeConsents: totals[2],
    activityLogs: totals[3],
  });
}));

// ---------- Users ----------
const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACIST', 'ADMIN'] as const;

adminRouter.get('/users', ah(async (req, res) => {
  const role = ROLES.includes(req.query.role as Role) ? (req.query.role as Role) : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  const users = await prisma.user.findMany({
    where: { ...(role ? { role } : {}), ...(q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } : {}) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, fullName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
      patientProfile: { select: { id: true, patientCode: true, _count: { select: { symptomReports: true } } } },
      doctorProfile: { select: { id: true, specialization: true, licenseNumber: true, clinic: true } },
      pharmacyProfile: { select: { id: true, pharmacyName: true, licenseNumber: true, address: true } },
    },
  });
  res.json({ users });
}));

const profileFields = {
  specialization: z.string().trim().max(120).optional(),
  licenseNumber: z.string().trim().max(40).optional(),
  clinic: z.string().trim().max(160).optional(),
  pharmacyName: z.string().trim().max(160).optional(),
  address: z.string().trim().max(255).optional(),
};

async function ensureRoleProfile(tx: Prisma.TransactionClient, userId: number, role: Role, f: { specialization?: string; licenseNumber?: string; clinic?: string; pharmacyName?: string; address?: string }) {
  if (role === 'PATIENT' && !(await tx.patientProfile.findUnique({ where: { userId } }))) {
    await tx.patientProfile.create({ data: { userId, patientCode: patientCode() } });
  }
  if (role === 'DOCTOR' && !(await tx.doctorProfile.findUnique({ where: { userId } }))) {
    if (!f.specialization || !f.licenseNumber) throw new HttpError(400, 'Дәрігер үшін мамандық пен лицензия нөмірі қажет');
    await tx.doctorProfile.create({ data: { userId, specialization: f.specialization, licenseNumber: f.licenseNumber, clinic: f.clinic || null } });
  }
  if (role === 'PHARMACIST' && !(await tx.pharmacyProfile.findUnique({ where: { userId } }))) {
    if (!f.pharmacyName || !f.licenseNumber) throw new HttpError(400, 'Дәріхана атауы мен лицензия нөмірі қажет');
    await tx.pharmacyProfile.create({ data: { userId, pharmacyName: f.pharmacyName, licenseNumber: f.licenseNumber, address: f.address || null } });
  }
}

adminRouter.post('/users', ah(async (req, res) => {
  const data = parse(z.object({
    fullName: z.string().trim().min(3).max(120),
    email: z.string().trim().toLowerCase().email().max(191),
    password: z.string().min(8).max(72),
    role: z.enum(ROLES),
    ...profileFields,
  }), req.body);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { fullName: data.fullName, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 12) } });
    await ensureRoleProfile(tx, u.id, data.role, data);
    return u;
  });
  await audit(req, 'admin.user_created', 'user', user.id, { role: data.role });
  res.status(201).json({ user: { id: user.id } });
}));

adminRouter.patch('/users/:id', ah(async (req, res) => {
  const id = idParam(req);
  const data = parse(z.object({
    fullName: z.string().trim().min(3).max(120).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
    ...profileFields,
  }), req.body);
  if (id === req.user!.id && (data.role && data.role !== 'ADMIN' || data.isActive === false)) throw new HttpError(400, 'Өз әкімші рөліңізді өзгерте не бұғаттай алмайсыз');
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw notFound('Қолданушы');
  await prisma.$transaction(async (tx) => {
    if (data.role && data.role !== target.role) await ensureRoleProfile(tx, id, data.role, data);
    await tx.user.update({ where: { id }, data: { fullName: data.fullName, role: data.role, isActive: data.isActive } });
  });
  await audit(req, 'admin.user_updated', 'user', id, { from: target.role, to: data.role, isActive: data.isActive });
  res.json({ ok: true });
}));

adminRouter.post('/users/:id/reset-password', ah(async (req, res) => {
  const id = idParam(req);
  const { password } = parse(z.object({ password: z.string().min(8).max(72) }), req.body);
  await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await audit(req, 'admin.password_reset', 'user', id);
  res.json({ ok: true });
}));

// ---------- Medical records overview ----------
adminRouter.get('/records', ah(async (_req, res) => {
  const [reports, records] = await Promise.all([
    prisma.symptomReport.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { bodyArea: { select: { nameKk: true } }, patient: { select: { patientCode: true, user: { select: { fullName: true } } } }, _count: { select: { attachments: true, medicalRecords: true } } } }),
    prisma.medicalRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { patient: { select: { patientCode: true, user: { select: { fullName: true } } } }, doctor: { select: { user: { select: { fullName: true } } } } } }),
  ]);
  res.json({ reports, records });
}));

adminRouter.delete('/reports/:id', ah(async (req, res) => {
  const id = idParam(req);
  await prisma.symptomReport.delete({ where: { id } });
  await audit(req, 'admin.report_deleted', 'symptom_report', id);
  res.json({ ok: true });
}));

// ---------- Medication database management ----------
const medSchema = z.object({
  name: z.string().trim().min(2).max(120),
  activeIngredient: z.string().trim().min(2).max(160),
  drugClass: z.string().trim().max(120).optional().transform((v) => v || null),
  dosageForms: z.string().trim().max(1000).optional().transform((v) => v || null),
  indications: z.string().trim().min(10).max(5000),
  contraindications: z.string().trim().min(5).max(5000),
  prescriptionRequired: z.boolean(),
  availabilityNote: z.string().trim().max(255).optional().transform((v) => v || null),
  sourceName: z.string().trim().min(3, 'Ресми дереккөз атауы міндетті').max(160),
  sourceUrl: z.string().trim().url('Ресми дереккөз сілтемесі міндетті').max(500).refine((u) => u.startsWith('https://'), 'Тек https сілтеме'),
  sourceCheckedAt: z.coerce.date(),
  isActive: z.boolean().default(true),
});

adminRouter.get('/medications', ah(async (_req, res) => {
  res.json({ medications: await prisma.medication.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { prescriptions: true } } } }) });
}));
adminRouter.post('/medications', ah(async (req, res) => {
  const m = await prisma.medication.create({ data: parse(medSchema, req.body) });
  await audit(req, 'admin.medication_created', 'medication', m.id);
  res.status(201).json({ medication: m });
}));
adminRouter.put('/medications/:id', ah(async (req, res) => {
  const m = await prisma.medication.update({ where: { id: idParam(req) }, data: parse(medSchema, req.body) });
  await audit(req, 'admin.medication_updated', 'medication', m.id);
  res.json({ medication: m });
}));
adminRouter.delete('/medications/:id', ah(async (req, res) => {
  const id = idParam(req);
  const used = await prisma.prescription.count({ where: { medicationId: id } });
  if (used) await prisma.medication.update({ where: { id }, data: { isActive: false } });
  else await prisma.medication.delete({ where: { id } });
  await audit(req, used ? 'admin.medication_archived' : 'admin.medication_deleted', 'medication', id);
  res.json({ ok: true, archived: used > 0 });
}));

// ---------- Activity logs ----------
adminRouter.get('/logs', ah(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const action = typeof req.query.action === 'string' && req.query.action ? req.query.action.slice(0, 80) : undefined;
  const where = action ? { action: { startsWith: action } } : {};
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 50, take: 50, include: { user: { select: { fullName: true, role: true } } } }),
    prisma.activityLog.count({ where }),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / 50)) });
}));
