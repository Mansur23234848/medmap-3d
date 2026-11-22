import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RecordType, ReportStatus, Role, RxStatus } from './types';

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));

const MONTHS = ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'];
export function fmtDate(d: string | Date, withTime = false) {
  const x = new Date(d);
  const s = `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  return withTime ? `${s}, ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}` : s;
}
export function fmtRelative(d: string | Date) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'жаңа ғана';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин бұрын`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} сағ бұрын`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} күн бұрын`;
  return fmtDate(d);
}
export const toInputDate = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export const ROLE_LABEL: Record<Role, string> = { PATIENT: 'Пациент', DOCTOR: 'Дәрігер', PHARMACIST: 'Фармацевт', ADMIN: 'Әкімші' };
export const ROLE_HOME: Record<Role, string> = { PATIENT: '/app/body-map', DOCTOR: '/doctor', PHARMACIST: '/pharmacy', ADMIN: '/admin' };

export const REPORT_STATUS: Record<ReportStatus, { label: string; tone: Tone }> = {
  NEW: { label: 'Жаңа өтінім', tone: 'primary' },
  UNDER_REVIEW: { label: 'Қаралуда', tone: 'warning' },
  ACCEPTED: { label: 'Қабылданды', tone: 'accent' },
  COMPLETED: { label: 'Аяқталды', tone: 'success' },
  REJECTED: { label: 'Қабылданбады', tone: 'danger' },
};
export const RX_STATUS: Record<RxStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Белсенді', tone: 'success' },
  DISPENSED: { label: 'Берілді', tone: 'neutral' },
  EXPIRED: { label: 'Мерзімі өтті', tone: 'warning' },
  CANCELLED: { label: 'Тоқтатылды', tone: 'danger' },
};
export const RECORD_TYPE: Record<RecordType, string> = { EXAMINATION: 'Тексеру', CONSULTATION: 'Кеңес', LAB_RESULT: 'Зертхана нәтижесі', FOLLOW_UP: 'Бақылау' };
export const GENDER: Record<string, string> = { MALE: 'Ер', FEMALE: 'Әйел', OTHER: 'Басқа' };

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

export function intensityTone(n: number): Tone {
  if (n >= 7) return 'danger';
  if (n >= 4) return 'warning';
  return 'success';
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const fileSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} МБ` : `${Math.round(b / 1024)} КБ`);
