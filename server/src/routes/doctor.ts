import { Router } from 'express';
import { z } from 'zod';
import { prisma, HttpError, audit, notify, prescriptionCode, notFound, computeAge } from '../lib/core.js';
import { ah, parse, idParam } from '../middleware/common.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { assertDoctorAccess, doctorProfileOf } from '../services/access.js';
import { loadPatientRecord } from '../services/records.js';
import { renderPatientPdf } from '../services/pdf.js';
import { changeApplicationStatus } from '../services/applications.js';
import { sendEmailLater, templates } from '../services/email.js';

export const doctorRouter = Router();
doctorRouter.use(requireAuth, requireRole('DOCTOR'));

doctorRouter.get('/patients', ah(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  const now = new Date();
  const consents = await prisma.patientConsent.findMany({
    where: {
      granteeUserId: req.user!.id,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(q ? { patient: { OR: [{ user: { fullName: { contains: q } } }, { patientCode: { contains: q } }, { user: { email: { contains: q } } }] } } : {}),
    },
    include: {
      patient: {
        include: {
          user: { select: { fullName: true, email: true } },
          symptomReports: { orderBy: { createdAt: 'desc' }, take: 1, include: { bodyArea: { select: { nameKk: true } } } },
          _count: { select: { symptomReports: true, medicalRecords: true, prescriptions: true } },
        },
      },
    },
    orderBy: { grantedAt: 'desc' },
  });
  const ids = consents.map((c) => c.patientId);
  const openCounts = await prisma.symptomReport.groupBy({ by: ['patientId'], where: { patientId: { in: ids }, status: { in: ['NEW', 'UNDER_REVIEW', 'ACCEPTED'] } }, _count: true });
  const openMap = new Map(openCounts.map((o) => [o.patientId, o._count]));
  res.json({
    patients: consents.map((c) => ({
      id: c.patient.id,
      patientCode: c.patient.patientCode,
      fullName: c.patient.user.fullName,
      email: c.patient.user.email,
      gender: c.patient.gender,
      age: computeAge(c.patient.dateOfBirth),
      consentSince: c.grantedAt,
      consentExpires: c.expiresAt,
      lastReport: c.patient.symptomReports[0] ?? null,
      openReports: openMap.get(c.patient.id) ?? 0,
      counts: c.patient._count,
    })),
  });
}));

doctorRouter.get('/patients/:id', ah(async (req, res) => {
  const patientId = idParam(req);
  await assertDoctorAccess(req.user!.id, patientId);
  const me = await doctorProfileOf(req.user!.id);
  const rec = await loadPatientRecord(patientId, { includePrivateNotes: true });
  rec.notes = rec.notes.filter((n) => n.visibility === 'SHARED' || n.doctorId === me.id);
  await audit(req, 'doctor.viewed_patient', 'patient_profile', patientId);
  res.json({ ...rec, myDoctorId: me.id });
}));

doctorRouter.patch('/reports/:id/status', ah(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['NEW', 'UNDER_REVIEW', 'ACCEPTED', 'COMPLETED', 'REJECTED']) }), req.body);
  const r = await prisma.symptomReport.findUnique({ where: { id: idParam(req) } });
  if (!r) throw notFound('Өтінім');
  await assertDoctorAccess(req.user!.id, r.patientId);
  await changeApplicationStatus(req, r.id, status);
  res.json({ ok: true });
}));

const recordSchema = z.object({
  symptomReportId: z.coerce.number().int().positive().nullable().optional(),
  recordType: z.enum(['EXAMINATION', 'CONSULTATION', 'LAB_RESULT', 'FOLLOW_UP']),
  title: z.string().trim().min(3).max(200),
  conclusion: z.string().trim().min(5).max(5000),
  recommendations: z.string().trim().max(3000).optional().transform((v) => v || null),
});

doctorRouter.post('/patients/:id/records', ah(async (req, res) => {
  const patientId = idParam(req);
  await assertDoctorAccess(req.user!.id, patientId);
  const me = await doctorProfileOf(req.user!.id);
  const data = parse(recordSchema, req.body);
  if (data.symptomReportId) {
    const r = await prisma.symptomReport.findUnique({ where: { id: data.symptomReportId } });
    if (!r || r.patientId !== patientId) throw new HttpError(400, 'Шағым бұл пациентке тиесілі емес');
  }
  const record = await prisma.medicalRecord.create({ data: { ...data, patientId, doctorId: me.id } });
  const patient = await prisma.patientProfile.findUniqueOrThrow({ where: { id: patientId }, include: { user: true } });
  let appNo: string | null = null;
  if (data.symptomReportId) {
    const rep = await prisma.symptomReport.findUniqueOrThrow({ where: { id: data.symptomReportId } });
    appNo = rep.applicationNo;
    if (rep.status !== 'REJECTED' && rep.status !== 'COMPLETED') await changeApplicationStatus(req, rep.id, 'COMPLETED');
  }
  await notify(patient.userId, 'Дәрігер қорытындысы', `${req.user!.fullName}: «${data.title}»`, 'success', '/app/history');
  const t = templates.doctorResponse(patient.user.fullName, appNo, req.user!.fullName, data.title);
  sendEmailLater({ to: patient.user.email, template: 'doctor_response', userId: patient.userId, ...t });
  await audit(req, 'record.created', 'medical_record', record.id, { patientId });
  res.status(201).json({ record });
}));

doctorRouter.post('/patients/:id/notes', ah(async (req, res) => {
  const patientId = idParam(req);
  await assertDoctorAccess(req.user!.id, patientId);
  const me = await doctorProfileOf(req.user!.id);
  const data = parse(z.object({
    content: z.string().trim().min(2).max(3000),
    visibility: z.enum(['SHARED', 'PRIVATE']).default('SHARED'),
    symptomReportId: z.coerce.number().int().positive().nullable().optional(),
  }), req.body);
  if (data.symptomReportId) {
    const r = await prisma.symptomReport.findUnique({ where: { id: data.symptomReportId } });
    if (!r || r.patientId !== patientId) throw new HttpError(400, 'Шағым бұл пациентке тиесілі емес');
  }
  const note = await prisma.doctorNote.create({ data: { ...data, patientId, doctorId: me.id } });
  if (data.visibility === 'SHARED') {
    const patient = await prisma.patientProfile.findUniqueOrThrow({ where: { id: patientId }, include: { user: true } });
    await notify(patient.userId, 'Дәрігер жазбасы', `${req.user!.fullName} жаңа жазба қалдырды`, 'info', '/app/history');
    let appNo: string | null = null;
    if (data.symptomReportId) appNo = (await prisma.symptomReport.findUnique({ where: { id: data.symptomReportId } }))?.applicationNo ?? null;
    const t = templates.doctorResponse(patient.user.fullName, appNo, req.user!.fullName, 'Дәрігер жазбасы');
    sendEmailLater({ to: patient.user.email, template: 'doctor_response', userId: patient.userId, ...t });
  }
  await audit(req, 'note.created', 'doctor_note', note.id, { patientId, visibility: data.visibility });
  res.status(201).json({ note });
}));

const rxSchema = z.object({
  medicationId: z.coerce.number().int().positive(),
  medicalRecordId: z.coerce.number().int().positive().nullable().optional(),
  dosage: z.string().trim().min(1).max(120),
  frequency: z.string().trim().min(1).max(120),
  durationDays: z.coerce.number().int().min(1).max(365),
  instructions: z.string().trim().max(2000).optional().transform((v) => v || null),
  validDays: z.coerce.number().int().min(1).max(90).default(30),
});

doctorRouter.post('/patients/:id/prescriptions', ah(async (req, res) => {
  const patientId = idParam(req);
  await assertDoctorAccess(req.user!.id, patientId);
  const me = await doctorProfileOf(req.user!.id);
  const { validDays, ...data } = parse(rxSchema, req.body);
  const med = await prisma.medication.findFirst({ where: { id: data.medicationId, isActive: true } });
  if (!med) throw new HttpError(400, 'Дәрі анықтамалықта табылмады');
  if (data.medicalRecordId) {
    const m = await prisma.medicalRecord.findUnique({ where: { id: data.medicalRecordId } });
    if (!m || m.patientId !== patientId) throw new HttpError(400, 'Қорытынды бұл пациентке тиесілі емес');
  }
  let code = prescriptionCode();
  while (await prisma.prescription.findUnique({ where: { code } })) code = prescriptionCode();
  const rx = await prisma.prescription.create({
    data: { ...data, code, patientId, doctorId: me.id, validUntil: new Date(Date.now() + validDays * 86400000) },
    include: { medication: true },
  });
  const patient = await prisma.patientProfile.findUniqueOrThrow({ where: { id: patientId } });
  await notify(patient.userId, 'Жаңа тағайындау', `${med.name} — код ${code}. Дәріханаға көрсету үшін рұқсатты қосыңыз.`, 'info', '/app/prescriptions');
  await audit(req, 'prescription.created', 'prescription', rx.id, { patientId, medication: med.name });
  res.status(201).json({ prescription: rx });
}));

doctorRouter.patch('/prescriptions/:id/cancel', ah(async (req, res) => {
  const me = await doctorProfileOf(req.user!.id);
  const rx = await prisma.prescription.findUnique({ where: { id: idParam(req) } });
  if (!rx || rx.doctorId !== me.id) throw notFound('Тағайындау');
  if (rx.status !== 'ACTIVE') throw new HttpError(409, 'Тек белсенді тағайындауды тоқтатуға болады');
  await prisma.prescription.update({ where: { id: rx.id }, data: { status: 'CANCELLED' } });
  await audit(req, 'prescription.cancelled', 'prescription', rx.id);
  res.json({ ok: true });
}));

doctorRouter.get('/patients/:id/pdf', ah(async (req, res) => {
  const patientId = idParam(req);
  await assertDoctorAccess(req.user!.id, patientId);
  const rec = await loadPatientRecord(patientId, { includePrivateNotes: false });
  await audit(req, 'pdf.generated', 'patient_profile', patientId, { by: 'doctor' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="medmap3d-${rec.profile.patientCode}.pdf"`);
  const doc = renderPatientPdf(rec, { generatedBy: `${req.user!.fullName} (дәрігер)` });
  doc.pipe(res);
  doc.end();
}));
