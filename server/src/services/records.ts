import { prisma, HttpError, computeAge } from '../lib/core.js';

const doctorSelect = {
  select: { id: true, specialization: true, clinic: true, user: { select: { fullName: true } } },
} as const;

/** Single source of truth for everything shown about a patient (dashboard, doctor view, PDF). */
export async function loadPatientRecord(patientId: number, opts: { includePrivateNotes: boolean }) {
  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true, fullName: true, email: true, createdAt: true } } },
  });
  if (!profile) throw new HttpError(404, 'Пациент табылмады');

  // Auto-expire prescriptions whose validity window has passed, so every view reports the real status.
  await prisma.prescription.updateMany({
    where: { patientId, status: 'ACTIVE', validUntil: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  const [reports, records, notes, prescriptions] = await Promise.all([
    prisma.symptomReport.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        bodyArea: true,
        attachments: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true } },
        _count: { select: { medicalRecords: true } },
      },
    }),
    prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { doctor: doctorSelect, symptomReport: { select: { id: true, bodyArea: { select: { slug: true, nameKk: true } } } } },
    }),
    prisma.doctorNote.findMany({
      where: { patientId, ...(opts.includePrivateNotes ? {} : { visibility: 'SHARED' }) },
      orderBy: { createdAt: 'desc' },
      include: { doctor: doctorSelect },
    }),
    prisma.prescription.findMany({
      where: { patientId },
      orderBy: { issuedAt: 'desc' },
      include: { medication: true, doctor: doctorSelect },
    }),
  ]);

  return {
    profile: { ...profile, age: computeAge(profile.dateOfBirth) },
    reports,
    records,
    notes,
    prescriptions,
  };
}

export type PatientRecord = Awaited<ReturnType<typeof loadPatientRecord>>;
