import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { z } from 'zod';
import { prisma, HttpError, audit, notify, forbidden, notFound } from '../lib/core.js';
import { ah, parse, idParam, upload, verifyUploadedFiles } from '../middleware/common.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { patientProfileOf } from '../services/access.js';
import { loadPatientRecord } from '../services/records.js';
import { renderPatientPdf } from '../services/pdf.js';
import { announceNewApplication, applicationNo } from '../services/applications.js';
import crypto from 'node:crypto';

export const patientRouter = Router();
patientRouter.use(requireAuth, requireRole('PATIENT'));

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

// ---------- Profile ----------
const profileSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  dateOfBirth: z.coerce.date().max(new Date()).nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, 'Телефон нөмірі дұрыс емес').optional().transform((v) => v || null),
  bloodType: z.enum(['O(I)+', 'O(I)-', 'A(II)+', 'A(II)-', 'B(III)+', 'B(III)-', 'AB(IV)+', 'AB(IV)-']).nullable().optional(),
  heightCm: z.coerce.number().int().min(40).max(250).nullable().optional(),
  weightKg: z.coerce.number().min(2).max(400).nullable().optional(),
  allergies: optText(1000),
  chronicConditions: optText(1000),
  emergencyContact: optText(160),
});

patientRouter.put('/profile', ah(async (req, res) => {
  const { fullName, ...p } = parse(profileSchema, req.body);
  const profile = await patientProfileOf(req.user!.id);
  await prisma.$transaction([
    prisma.user.update({ where: { id: req.user!.id }, data: { fullName } }),
    prisma.patientProfile.update({ where: { id: profile.id }, data: p }),
  ]);
  await audit(req, 'patient.profile_updated', 'patient_profile', profile.id);
  res.json({ ok: true });
}));

// ---------- Dashboard / full record ----------
patientRouter.get('/dashboard', ah(async (req, res) => {
  const profile = await patientProfileOf(req.user!.id);
  const rec = await loadPatientRecord(profile.id, { includePrivateNotes: false });
  const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 8 });
  const consents = await prisma.patientConsent.count({ where: { patientId: profile.id, status: 'ACTIVE' } });
  res.json({ ...rec, notifications, activeConsents: consents });
}));

// ---------- Symptom reports ----------
const reportSchema = z.object({
  bodyAreaSlug: z.string().min(2).max(40),
  description: z.string().trim().min(5, 'Шағымды кемінде 5 таңбамен сипаттаңыз').max(3000),
  startedAt: z.coerce.date().max(new Date(Date.now() + 86400000), 'Басталған күн болашақта болмауы керек'),
  duration: z.string().trim().min(1, 'Ұзақтығын көрсетіңіз').max(60),
  intensity: z.coerce.number().int().min(1).max(10),
  additionalSymptoms: optText(1500),
  visitedDoctor: z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => v === true || v === 'true'),
  visitDetails: optText(1500),
  contactName: z.string().trim().min(3, 'Аты-жөніңізді енгізіңіз').max(120),
  contactEmail: z.string().trim().toLowerCase().email('Email мекенжайы дұрыс емес').max(191),
  contactPhone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, 'Телефон нөмірі дұрыс емес').optional().transform((v) => v || null),
  submissionKey: z.string().trim().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
});

async function ownReport(userId: number, id: number) {
  const profile = await patientProfileOf(userId);
  const r = await prisma.symptomReport.findUnique({ where: { id }, include: { _count: { select: { medicalRecords: true } } } });
  if (!r) throw notFound('Шағым');
  if (r.patientId !== profile.id) throw forbidden();
  return { r, profile };
}

patientRouter.get('/reports', ah(async (req, res) => {
  const profile = await patientProfileOf(req.user!.id);
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const reports = await prisma.symptomReport.findMany({
    where: { patientId: profile.id, ...(area ? { bodyArea: { slug: area } } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { bodyArea: true, attachments: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } }, medicalRecords: { include: { doctor: { include: { user: { select: { fullName: true } } } } } } },
  });
  res.json({ reports });
}));

patientRouter.post('/reports', upload.array('files', 3), ah(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  try {
    verifyUploadedFiles(files);
    const data = parse(reportSchema, req.body);
    const profile = await patientProfileOf(req.user!.id);
    const area = await prisma.bodyArea.findUnique({ where: { slug: data.bodyAreaSlug } });
    if (!area) throw new HttpError(400, 'Дене аймағы табылмады');
    const { bodyAreaSlug: _, submissionKey, ...rest } = data;
    // Idempotency: a double click / retry with the same form key returns the already-saved application.
    if (submissionKey) {
      const dup = await prisma.symptomReport.findUnique({ where: { submissionKey }, include: { bodyArea: true, attachments: true } });
      if (dup) {
        files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        if (dup.patientId !== profile.id) throw forbidden();
        return res.status(200).json({ report: dup, duplicate: true });
      }
    }
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.symptomReport.create({
        data: {
          ...rest,
          applicationNo: `TMP-${crypto.randomUUID().slice(0, 12)}`,
          submissionKey: submissionKey ?? null,
          visitDetails: rest.visitedDoctor ? rest.visitDetails : null,
          patientId: profile.id,
          bodyAreaId: area.id,
          attachments: { create: files.map((f) => ({ originalName: f.originalname.slice(0, 255), storedName: f.filename, mimeType: f.mimetype, sizeBytes: f.size })) },
        },
      });
      return tx.symptomReport.update({ where: { id: created.id }, data: { applicationNo: applicationNo(created.id) }, include: { bodyArea: true, attachments: true } });
    });
    // Keep the patient's contact phone on the profile if they did not have one yet.
    if (rest.contactPhone && !profile.phone) await prisma.patientProfile.update({ where: { id: profile.id }, data: { phone: rest.contactPhone } });
    // Notify doctors who currently have access to this patient, the admins and the patient.
    const doctors = await prisma.patientConsent.findMany({ where: { patientId: profile.id, status: 'ACTIVE', grantee: { role: 'DOCTOR' } } });
    await Promise.all(doctors.map((c) => notify(c.granteeUserId, 'Жаңа өтінім', `${report.applicationNo} · ${report.contactName}: ${area.nameKk}`, 'info', `/doctor/patients/${profile.id}`)));
    await announceNewApplication(report, req.user!.id);
    await audit(req, 'report.created', 'symptom_report', report.id, { applicationNo: report.applicationNo, area: area.slug, files: files.length });
    res.status(201).json({ report });
  } catch (e) {
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    throw e;
  }
}));

patientRouter.put('/reports/:id', upload.array('files', 3), ah(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  try {
    verifyUploadedFiles(files);
    const { r } = await ownReport(req.user!.id, idParam(req));
    if (r.status !== 'NEW') throw new HttpError(409, 'Қаралуға алынған өтінімді өзгертуге болмайды');
    const data = parse(reportSchema, req.body);
    const area = await prisma.bodyArea.findUnique({ where: { slug: data.bodyAreaSlug } });
    if (!area) throw new HttpError(400, 'Дене аймағы табылмады');
    const { bodyAreaSlug: _, submissionKey: _k, ...rest } = data;
    const report = await prisma.symptomReport.update({
      where: { id: r.id },
      data: {
        ...rest,
        visitDetails: rest.visitedDoctor ? rest.visitDetails : null,
        bodyAreaId: area.id,
        attachments: { create: files.map((f) => ({ originalName: f.originalname.slice(0, 255), storedName: f.filename, mimeType: f.mimetype, sizeBytes: f.size })) },
      },
      include: { bodyArea: true, attachments: true },
    });
    await audit(req, 'report.updated', 'symptom_report', r.id);
    res.json({ report });
  } catch (e) {
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    throw e;
  }
}));

patientRouter.delete('/reports/:id', ah(async (req, res) => {
  const { r } = await ownReport(req.user!.id, idParam(req));
  if (r.status !== 'NEW' || r._count.medicalRecords > 0) throw new HttpError(409, 'Қаралуға алынған немесе дәрігер жауабы бар өтінімді өшіруге болмайды');
  const atts = await prisma.reportAttachment.findMany({ where: { symptomReportId: r.id } });
  await prisma.symptomReport.delete({ where: { id: r.id } });
  atts.forEach((a) => {
    const p = path.join(env.uploadDir, a.storedName);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
  await audit(req, 'report.deleted', 'symptom_report', r.id);
  res.json({ ok: true });
}));

patientRouter.delete('/reports/:id/attachments/:attId', ah(async (req, res) => {
  const { r } = await ownReport(req.user!.id, idParam(req));
  if (r.status !== 'NEW') throw new HttpError(409, 'Қаралуға алынған өтінімді өзгертуге болмайды');
  const att = await prisma.reportAttachment.findFirst({ where: { id: idParam(req, 'attId'), symptomReportId: r.id } });
  if (!att) throw notFound('Файл');
  await prisma.reportAttachment.delete({ where: { id: att.id } });
  const p = path.join(env.uploadDir, att.storedName);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok: true });
}));

// ---------- Consents (who can see my data) ----------
patientRouter.get('/doctors', ah(async (_req, res) => {
  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { isActive: true } },
    select: { id: true, specialization: true, clinic: true, yearsExperience: true, user: { select: { id: true, fullName: true } } },
    orderBy: { user: { fullName: 'asc' } },
  });
  res.json({ doctors });
}));

patientRouter.get('/consents', ah(async (req, res) => {
  const profile = await patientProfileOf(req.user!.id);
  const consents = await prisma.patientConsent.findMany({
    where: { patientId: profile.id },
    orderBy: { grantedAt: 'desc' },
    include: { grantee: { select: { id: true, fullName: true, role: true, doctorProfile: { select: { specialization: true, clinic: true } } } } },
  });
  res.json({ consents });
}));

patientRouter.post('/consents', ah(async (req, res) => {
  const { doctorUserId, expiresInDays } = parse(z.object({ doctorUserId: z.coerce.number().int().positive(), expiresInDays: z.coerce.number().int().min(1).max(365).nullable().optional() }), req.body);
  const profile = await patientProfileOf(req.user!.id);
  const doctor = await prisma.user.findFirst({ where: { id: doctorUserId, role: 'DOCTOR', isActive: true } });
  if (!doctor) throw new HttpError(400, 'Дәрігер табылмады');
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;
  const consent = await prisma.patientConsent.upsert({
    where: { patientId_granteeUserId: { patientId: profile.id, granteeUserId: doctor.id } },
    create: { patientId: profile.id, granteeUserId: doctor.id, expiresAt },
    update: { status: 'ACTIVE', revokedAt: null, grantedAt: new Date(), expiresAt },
  });
  await notify(doctor.id, 'Жаңа рұқсат', `${req.user!.fullName} сізге медициналық картасын көруге рұқсат берді`, 'success', `/doctor/patients/${profile.id}`);
  await audit(req, 'consent.granted', 'patient_consent', consent.id, { doctorUserId });
  res.status(201).json({ consent });
}));

patientRouter.delete('/consents/:id', ah(async (req, res) => {
  const profile = await patientProfileOf(req.user!.id);
  const c = await prisma.patientConsent.findUnique({ where: { id: idParam(req) } });
  if (!c || c.patientId !== profile.id) throw notFound('Рұқсат');
  await prisma.patientConsent.update({ where: { id: c.id }, data: { status: 'REVOKED', revokedAt: new Date() } });
  await audit(req, 'consent.revoked', 'patient_consent', c.id);
  res.json({ ok: true });
}));

// ---------- Prescriptions ----------
patientRouter.patch('/prescriptions/:id/pharmacy-access', ah(async (req, res) => {
  const { enabled } = parse(z.object({ enabled: z.boolean() }), req.body);
  const profile = await patientProfileOf(req.user!.id);
  const rx = await prisma.prescription.findUnique({ where: { id: idParam(req) } });
  if (!rx || rx.patientId !== profile.id) throw notFound('Тағайындау');
  await prisma.prescription.update({ where: { id: rx.id }, data: { pharmacyAccess: enabled } });
  await audit(req, enabled ? 'prescription.pharmacy_access_granted' : 'prescription.pharmacy_access_revoked', 'prescription', rx.id);
  res.json({ ok: true });
}));

// ---------- Notifications ----------
patientRouter.get('/pdf', ah(async (req, res) => {
  const profile = await patientProfileOf(req.user!.id);
  const rec = await loadPatientRecord(profile.id, { includePrivateNotes: false });
  await audit(req, 'pdf.generated', 'patient_profile', profile.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="medmap3d-report-${profile.patientCode}.pdf"`);
  const doc = renderPatientPdf(rec, { generatedBy: `${req.user!.fullName} (пациент)` });
  doc.pipe(res);
  doc.end();
}));
