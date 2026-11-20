import { prisma, HttpError, forbidden } from '../lib/core.js';

export async function patientProfileOf(userId: number) {
  const p = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!p) throw new HttpError(404, 'Пациент профилі табылмады');
  return p;
}

export async function doctorProfileOf(userId: number) {
  const d = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!d) throw new HttpError(404, 'Дәрігер профилі табылмады');
  return d;
}

/** True when the patient has an active, unexpired consent for this grantee user. */
export async function hasConsent(patientId: number, granteeUserId: number) {
  const c = await prisma.patientConsent.findUnique({
    where: { patientId_granteeUserId: { patientId, granteeUserId } },
  });
  return !!c && c.status === 'ACTIVE' && (!c.expiresAt || c.expiresAt > new Date());
}

export async function assertDoctorAccess(doctorUserId: number, patientId: number) {
  if (!(await hasConsent(patientId, doctorUserId))) throw forbidden('Пациент сізге өз деректерін көруге рұқсат бермеген');
}
