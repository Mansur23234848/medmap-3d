import PDFDocument from 'pdfkit';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { PatientRecord } from './records.js';

const require = createRequire(import.meta.url);
const fontDir = path.dirname(require.resolve('@expo-google-fonts/inter/package.json'));
const FONT = {
  regular: path.join(fontDir, 'Inter_400Regular.ttf'),
  medium: path.join(fontDir, 'Inter_500Medium.ttf'),
  semibold: path.join(fontDir, 'Inter_600SemiBold.ttf'),
  bold: path.join(fontDir, 'Inter_700Bold.ttf'),
};

const C = {
  navy: '#0B1530',
  blue: '#2563EB',
  cyan: '#06B6D4',
  red: '#E11D48',
  slate: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  soft: '#F1F5F9',
};

const STATUS_KK: Record<string, string> = {
  OPEN: 'Ашық', UNDER_REVIEW: 'Қаралуда', REVIEWED: 'Қаралды', CLOSED: 'Жабылды',
  ACTIVE: 'Белсенді', DISPENSED: 'Берілді', EXPIRED: 'Мерзімі өтті', CANCELLED: 'Жойылды',
};
const RECORD_KK: Record<string, string> = { EXAMINATION: 'Тексеру', CONSULTATION: 'Кеңес', LAB_RESULT: 'Зертхана', FOLLOW_UP: 'Бақылау' };

const fmt = (d: Date | string) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function renderPatientPdf(rec: PatientRecord, opts: { generatedBy: string }): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 70, left: 50, right: 50 }, bufferPages: true, info: { Title: 'MEDMAP 3D — Медициналық есеп (DEMO)', Author: 'MEDMAP 3D' } });
  doc.registerFont('R', FONT.regular).registerFont('M', FONT.medium).registerFont('S', FONT.semibold).registerFont('B', FONT.bold);
  const W = doc.page.width;
  const L = 50;
  const CW = W - 100;

  // ---------- Header ----------
  doc.rect(0, 0, W, 118).fill(C.navy);
  // logo mark
  doc.roundedRect(L, 36, 40, 40, 10).fill(C.blue);
  doc.rect(L + 17, 44, 6, 24).fill('#FFFFFF');
  doc.rect(L + 8, 53, 24, 6).fill('#FFFFFF');
  doc.circle(L + 34, 42, 4).fill(C.cyan);
  doc.fill('#FFFFFF').font('B').fontSize(18).text('MEDMAP', L + 52, 38, { continued: true }).fill(C.cyan).text(' 3D');
  doc.fill('#94A3B8').font('R').fontSize(9).text('Digital Health Platform', L + 52, 60);
  doc.fill('#FFFFFF').font('S').fontSize(13).text('Медициналық есеп', L, 40, { width: CW, align: 'right' });
  doc.fill('#94A3B8').font('R').fontSize(9).text(`Жасалған күні: ${new Date().toLocaleString('ru-RU')}`, L, 60, { width: CW, align: 'right' });
  doc.text(`Құжат: DOC-${rec.profile.patientCode}-${Date.now().toString(36).toUpperCase()}`, L, 73, { width: CW, align: 'right' });

  // demo banner
  doc.rect(0, 118, W, 26).fill('#FEF2F2');
  doc.fill(C.red).font('S').fontSize(8.5).text('ДЕМОНСТРАЦИЯЛЫҚ ҚҰЖАТ · Рецепт немесе ресми медициналық қорытынды емес · Синтетикалық деректер', 0, 127, { width: W, align: 'center' });

  doc.y = 166;

  const section = (title: string) => {
    ensure(60);
    doc.moveDown(0.6);
    const y = doc.y;
    doc.rect(L, y + 2, 3, 13).fill(C.blue);
    doc.fill(C.navy).font('S').fontSize(12).text(title, L + 11, y, { width: CW - 11 });
    doc.moveDown(0.5);
  };
  const ensure = (h: number) => {
    if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
  };
  const kv = (pairs: [string, string][], cols = 3) => {
    const colW = CW / cols;
    const startY = doc.y;
    let maxY = startY;
    pairs.forEach(([k, v], i) => {
      const x = L + (i % cols) * colW;
      const y = startY + Math.floor(i / cols) * 36;
      doc.fill(C.muted).font('R').fontSize(8).text(k.toUpperCase(), x, y, { width: colW - 10, characterSpacing: 0.4 });
      doc.fill(C.slate).font('M').fontSize(10).text(v || '—', x, y + 11, { width: colW - 10 });
      maxY = Math.max(maxY, y + 34);
    });
    doc.y = maxY;
    doc.x = L;
  };
  const card = (draw: () => void, estimate = 80) => {
    ensure(estimate);
    const top = doc.y;
    doc.x = L + 14;
    doc.y = top + 12;
    draw();
    const bottom = doc.y + 10;
    doc.save().roundedRect(L, top, CW, bottom - top, 8).lineWidth(0.8).stroke(C.line).restore();
    doc.y = bottom + 8;
    doc.x = L;
  };
  const para = (t: string, opts: { color?: string; size?: number; font?: string } = {}) =>
    doc.fill(opts.color ?? C.slate).font(opts.font ?? 'R').fontSize(opts.size ?? 9.5).text(t, L + 14, doc.y, { width: CW - 28, lineGap: 2 });

  // ---------- Patient ----------
  const p = rec.profile;
  section('Пациент');
  kv([
    ['Аты-жөні', p.user.fullName],
    ['Пациент коды', p.patientCode],
    ['Туған күні', p.dateOfBirth ? `${fmt(p.dateOfBirth)} (${p.age} жас)` : '—'],
    ['Жынысы', p.gender === 'FEMALE' ? 'Әйел' : p.gender === 'MALE' ? 'Ер' : p.gender ? 'Басқа' : '—'],
    ['Қан тобы', p.bloodType ?? '—'],
    ['Бойы / салмағы', `${p.heightCm ?? '—'} см / ${p.weightKg ?? '—'} кг`],
    ['Аллергиялар', p.allergies ?? 'Көрсетілмеген'],
    ['Созылмалы аурулар', p.chronicConditions ?? 'Көрсетілмеген'],
  ]);

  // ---------- Body areas ----------
  section('Таңдалған дене аймақтары');
  const areas = new Map<string, { name: string; en: string; count: number; max: number }>();
  rec.reports.forEach((r) => {
    const a = areas.get(r.bodyArea.slug) ?? { name: r.bodyArea.nameKk, en: r.bodyArea.nameEn, count: 0, max: 0 };
    a.count++;
    a.max = Math.max(a.max, r.intensity);
    areas.set(r.bodyArea.slug, a);
  });
  if (areas.size === 0) para('Белгіленген аймақтар жоқ.', { color: C.muted });
  else {
    let x = L;
    let y = doc.y;
    for (const a of areas.values()) {
      const label = `${a.name} · ${a.count} жазба · макс. ${a.max}/10`;
      doc.font('M').fontSize(9);
      const w = doc.widthOfString(label) + 22;
      if (x + w > L + CW) { x = L; y += 26; }
      doc.roundedRect(x, y, w, 20, 10).fill('#FFF1F2');
      doc.circle(x + 9, y + 10, 3).fill(C.red);
      doc.fill('#9F1239').text(label, x + 16, y + 5.5, { lineBreak: false });
      x += w + 6;
    }
    doc.y = y + 30;
    doc.x = L;
  }

  // ---------- Reports ----------
  section(`Пациент енгізген шағымдар (${rec.reports.length})`);
  if (rec.reports.length === 0) para('Шағымдар енгізілмеген.', { color: C.muted });
  rec.reports.forEach((r) => {
    card(() => {
      const y0 = doc.y;
      doc.fill(C.navy).font('S').fontSize(10.5).text(`${r.bodyArea.nameKk} — ${r.bodyArea.nameEn}`, L + 14, y0, { width: CW - 150 });
      doc.fill(C.muted).font('R').fontSize(8.5).text(`${fmt(r.createdAt)} · ${STATUS_KK[r.status]}`, L + 14, y0 + 1, { width: CW - 28, align: 'right' });
      doc.y = Math.max(doc.y, y0 + 16);
      para(r.description);
      doc.moveDown(0.3);
      para(`Басталуы: ${fmt(r.startedAt)}   ·   Ұзақтығы: ${r.duration}   ·   Қарқындылығы (пациент бағасы): ${r.intensity}/10`, { color: C.muted, size: 8.5 });
      if (r.additionalSymptoms) para(`Қосымша белгілер: ${r.additionalSymptoms}`, { color: C.muted, size: 8.5 });
      para(`Дәрігерге бұрын қаралған: ${r.visitedDoctor ? 'Иә' + (r.visitDetails ? ` — ${r.visitDetails}` : '') : 'Жоқ'}`, { color: C.muted, size: 8.5 });
    }, 110);
  });

  // ---------- Doctor conclusions ----------
  if (rec.records.length) {
    section(`Дәрігер қорытындысы (${rec.records.length})`);
    rec.records.forEach((m) => {
      card(() => {
        const y0 = doc.y;
        doc.fill(C.navy).font('S').fontSize(10.5).text(m.title, L + 14, y0, { width: CW - 150 });
        doc.fill(C.muted).font('R').fontSize(8.5).text(`${fmt(m.createdAt)} · ${RECORD_KK[m.recordType]}`, L + 14, y0 + 1, { width: CW - 28, align: 'right' });
        doc.y = Math.max(doc.y, y0 + 16);
        para(`${m.doctor.user.fullName} · ${m.doctor.specialization}`, { color: C.blue, size: 8.5, font: 'M' });
        doc.moveDown(0.2);
        para(m.conclusion);
        if (m.recommendations) { doc.moveDown(0.3); para(`Ұсыныстар: ${m.recommendations}`, { size: 9 }); }
      }, 110);
    });
  }

  if (rec.notes.length) {
    section('Дәрігер жазбалары');
    rec.notes.forEach((n) => card(() => {
      para(`${fmt(n.createdAt)} · ${n.doctor.user.fullName}`, { color: C.muted, size: 8.5 });
      para(n.content);
    }, 60));
  }

  // ---------- Prescriptions ----------
  if (rec.prescriptions.length) {
    section('Дәрігер тағайындаулары');
    rec.prescriptions.forEach((rx) => card(() => {
      const y0 = doc.y;
      doc.fill(C.navy).font('S').fontSize(10.5).text(`${rx.medication.name} (${rx.medication.activeIngredient})`, L + 14, y0, { width: CW - 170 });
      doc.fill(C.muted).font('M').fontSize(8.5).text(`${rx.code} · ${STATUS_KK[rx.status]}`, L + 14, y0 + 1, { width: CW - 28, align: 'right' });
      doc.y = Math.max(doc.y, y0 + 16);
      para(`${rx.dosage} · ${rx.frequency} · ${rx.durationDays} күн`);
      if (rx.instructions) para(rx.instructions, { color: C.muted, size: 9 });
      para(`Тағайындаған: ${rx.doctor.user.fullName} · ${fmt(rx.issuedAt)} — ${fmt(rx.validUntil)} дейін`, { color: C.muted, size: 8.5 });
    }, 80));
  }

  // ---------- Footer + watermark on every page ----------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // allow drawing in the footer zone without triggering auto page breaks
    doc.save();
    doc.rotate(-35, { origin: [W / 2, doc.page.height / 2] });
    doc.fill(C.red).fillOpacity(0.05).font('B').fontSize(96).text('DEMO', 0, doc.page.height / 2 - 50, { width: W, align: 'center', lineBreak: false });
    doc.restore();
    const fy = doc.page.height - 48;
    doc.save().moveTo(L, fy - 8).lineTo(W - L, fy - 8).lineWidth(0.5).stroke(C.line).restore();
    doc.fill(C.muted).fillOpacity(1).font('R').fontSize(7.5)
      .text('MEDMAP 3D · Бұл құжат тек демонстрациялық мақсатта жасалған және диагноз, рецепт немесе ресми медициналық қорытынды болып табылмайды.', L, fy, { width: CW - 60, lineBreak: true, height: 22 });
    doc.text(`${i + 1} / ${range.count}`, L, fy, { width: CW, align: 'right', lineBreak: false });
    doc.text(`Шығарған: ${opts.generatedBy}`, L, fy + 18, { width: CW, lineBreak: false });
  }
  return doc;
}
