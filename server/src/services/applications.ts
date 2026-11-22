import type { Request } from 'express';
import type { ReportStatus } from '@prisma/client';
import { prisma, audit, notify } from '../lib/core.js';
import { env } from '../config/env.js';
import { sendEmailLater, templates } from './email.js';

export const STATUS_KK: Record<ReportStatus, string> = {
  NEW: 'Жаңа өтінім',
  UNDER_REVIEW: 'Қаралуда',
  ACCEPTED: 'Қабылданды',
  COMPLETED: 'Аяқталды',
  REJECTED: 'Қабылданбады',
};

export const applicationNo = (id: number) => `APP-${String(id).padStart(6, '0')}`;

/** Changes an application's status and tells the patient (in-app notification + e-mail). */
export async function changeApplicationStatus(req: Request, reportId: number, status: ReportStatus) {
  const r = await prisma.symptomReport.findUniqueOrThrow({ where: { id: reportId }, include: { patient: { include: { user: true } } } });
  if (r.status === status) return r;
  const updated = await prisma.symptomReport.update({ where: { id: reportId }, data: { status, statusChangedAt: new Date() } });
  const u = r.patient.user;
  await notify(u.id, 'Өтінім мәртебесі өзгерді', `${r.applicationNo}: ${STATUS_KK[status]}`, status === 'REJECTED' ? 'warning' : 'info', '/app/applications');
  const t = templates.statusChanged(u.fullName, r.applicationNo, STATUS_KK[status]);
  sendEmailLater({ to: r.contactEmail || u.email, template: 'status_changed', userId: u.id, ...t });
  await audit(req, 'application.status_changed', 'symptom_report', reportId, { from: r.status, to: status });
  return updated;
}

/** Notifies admins (in-app for every admin, e-mail to ADMIN_NOTIFY_EMAIL) and the patient about a new application. */
export async function announceNewApplication(report: { id: number; applicationNo: string; contactName: string; contactEmail: string; description: string; bodyArea: { nameKk: string } }, patientUserId: number) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, 'Жаңа өтінім', `${report.applicationNo} · ${report.contactName} · ${report.bodyArea.nameKk}`, 'info', `/admin/applications?open=${report.id}`)));
  const pt = templates.applicationReceived(report.contactName, report.applicationNo, report.bodyArea.nameKk);
  sendEmailLater({ to: report.contactEmail, template: 'application_received', userId: patientUserId, ...pt });
  if (env.adminNotifyEmail) {
    const at = templates.adminNewApplication(report.applicationNo, report.contactName, report.bodyArea.nameKk, report.description);
    sendEmailLater({ to: env.adminNotifyEmail, template: 'admin_new_application', ...at });
  }
}
