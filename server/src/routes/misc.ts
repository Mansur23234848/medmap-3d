import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { prisma, audit, notFound, forbidden, maskName, HttpError } from '../lib/core.js';
import { ah, parse, idParam } from '../middleware/common.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { hasConsent } from '../services/access.js';

// ---------- Body areas (reference data) ----------
export const bodyAreasRouter = Router();
bodyAreasRouter.get('/', ah(async (_req, res) => {
  res.json({ areas: await prisma.bodyArea.findMany({ orderBy: { sortOrder: 'asc' } }) });
}));

// ---------- Medication database (read for all signed-in users) ----------
export const medicationsRouter = Router();
medicationsRouter.use(requireAuth);
medicationsRouter.get('/', ah(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  const meds = await prisma.medication.findMany({
    where: { isActive: true, ...(q ? { OR: [{ name: { contains: q } }, { activeIngredient: { contains: q } }, { drugClass: { contains: q } }] } : {}) },
    orderBy: { name: 'asc' },
  });
  // Doctors also see the prescriptions they personally issued for each medication.
  let mine: Record<number, number> = {};
  if (req.user!.role === 'DOCTOR') {
    const doc = await prisma.doctorProfile.findUnique({ where: { userId: req.user!.id } });
    if (doc) {
      const g = await prisma.prescription.groupBy({ by: ['medicationId'], where: { doctorId: doc.id }, _count: true });
      mine = Object.fromEntries(g.map((x) => [x.medicationId, x._count]));
    }
  }
  res.json({ medications: meds.map((m) => ({ ...m, myPrescriptions: mine[m.id] ?? 0 })) });
}));

// ---------- Notifications ----------
export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
notificationsRouter.get('/', ah(async (req, res) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId: req.user!.id, readAt: null } }),
  ]);
  res.json({ items, unread });
}));
notificationsRouter.post('/read-all', ah(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, readAt: null }, data: { readAt: new Date() } });
  res.json({ ok: true });
}));
notificationsRouter.post('/:id/read', ah(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: idParam(req), userId: req.user!.id }, data: { readAt: new Date() } });
  res.json({ ok: true });
}));

// ---------- Attachments (authorised download, never public) ----------
export const filesRouter = Router();
filesRouter.use(requireAuth);
filesRouter.get('/:id', ah(async (req, res) => {
  const att = await prisma.reportAttachment.findUnique({ where: { id: idParam(req) }, include: { symptomReport: { include: { patient: true } } } });
  if (!att) throw notFound('Файл');
  const patient = att.symptomReport.patient;
  const u = req.user!;
  const allowed = (u.role === 'PATIENT' && patient.userId === u.id) || (u.role === 'DOCTOR' && (await hasConsent(patient.id, u.id))) || u.role === 'ADMIN';
  if (!allowed) throw forbidden();
  const file = path.join(env.uploadDir, path.basename(att.storedName));
  if (!fs.existsSync(file)) throw notFound('Файл');
  await audit(req, 'file.downloaded', 'report_attachment', att.id);
  res.setHeader('Content-Type', att.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(att.originalName)}`);
  fs.createReadStream(file).pipe(res);
}));

// ---------- Pharmacy (demo verification only) ----------
export const pharmacyRouter = Router();
pharmacyRouter.use(requireAuth, requireRole('PHARMACIST'));

pharmacyRouter.get('/lookup', ah(async (req, res) => {
  const { code } = parse(z.object({ code: z.string().trim().toUpperCase().regex(/^RX-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Код форматы: RX-XXXX-XXXX') }), req.query);
  await prisma.prescription.updateMany({ where: { code, status: 'ACTIVE', validUntil: { lt: new Date() } }, data: { status: 'EXPIRED' } });
  const rx = await prisma.prescription.findUnique({
    where: { code },
    include: { medication: true, patient: { include: { user: { select: { fullName: true } } } }, doctor: { include: { user: { select: { fullName: true } } } } },
  });
  await audit(req, 'pharmacy.lookup', 'prescription', rx?.id, { code, found: !!rx });
  if (!rx) throw new HttpError(404, 'Бұл кодпен тағайындау табылмады');
  const base = { code: rx.code, status: rx.status, issuedAt: rx.issuedAt, validUntil: rx.validUntil, accessGranted: rx.pharmacyAccess };
  if (!rx.pharmacyAccess) return res.json({ prescription: base });
  res.json({
    prescription: {
      ...base,
      patientName: maskName(rx.patient.user.fullName),
      patientBirthYear: rx.patient.dateOfBirth?.getFullYear() ?? null,
      doctorName: rx.doctor.user.fullName,
      doctorSpecialization: rx.doctor.specialization,
      medication: { name: rx.medication.name, activeIngredient: rx.medication.activeIngredient, prescriptionRequired: rx.medication.prescriptionRequired, sourceUrl: rx.medication.sourceUrl },
      dosage: rx.dosage,
      frequency: rx.frequency,
      durationDays: rx.durationDays,
      instructions: rx.instructions,
    },
  });
}));

pharmacyRouter.get('/recent', ah(async (req, res) => {
  const logs = await prisma.activityLog.findMany({ where: { userId: req.user!.id, action: 'pharmacy.lookup' }, orderBy: { createdAt: 'desc' }, take: 10 });
  res.json({ items: logs.map((l) => ({ id: l.id, at: l.createdAt, code: (l.metadata as { code?: string } | null)?.code, found: (l.metadata as { found?: boolean } | null)?.found })) });
}));
