/**
 * MEDMAP 3D demo seed. ALL people and medical data below are fictional / synthetic.
 * Re-running the seed wipes and recreates demo data.
 *
 * Accounts: 1 admin, 2 doctors, 5 patients, 1 pharmacist (see DEMO_ACCOUNTS.md).
 * Applications: 3 NEW, 2 UNDER_REVIEW, 1 ACCEPTED, 2 COMPLETED, 1 REJECTED.
 */
import { PrismaClient, type ReportStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BODY_AREAS } from '../src/data/bodyAreas.js';
import { MEDICATIONS } from '../src/data/medications.js';

const prisma = new PrismaClient();
const daysAgo = (d: number, h = 10, m = 15) => {
  const t = new Date(Date.now() - d * 86400000);
  t.setHours(h, m, 0, 0);
  return t;
};
const appNo = (id: number) => `APP-${String(id).padStart(6, '0')}`;

async function main() {
  console.log('Clearing demo data…');
  await prisma.$transaction([
    prisma.emailLog.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.emailVerification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.doctorNote.deleteMany(),
    prisma.medicalRecord.deleteMany(),
    prisma.reportAttachment.deleteMany(),
    prisma.symptomReport.deleteMany(),
    prisma.patientConsent.deleteMany(),
    prisma.patientProfile.deleteMany(),
    prisma.doctorProfile.deleteMany(),
    prisma.pharmacyProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.medication.deleteMany(),
    prisma.bodyArea.deleteMany(),
  ]);

  console.log('Body areas & medications…');
  await prisma.bodyArea.createMany({ data: BODY_AREAS.map((a, i) => ({ ...a, sortOrder: i })) });
  const area = Object.fromEntries((await prisma.bodyArea.findMany()).map((a) => [a.slug, a.id]));
  await prisma.medication.createMany({ data: MEDICATIONS });
  const med = Object.fromEntries((await prisma.medication.findMany()).map((m) => [m.name, m.id]));

  console.log('Users…');
  const hash = (p: string) => bcrypt.hash(p, 12);
  const verified = daysAgo(30);
  const PATIENT_PW = await hash('Patient2026!');
  const DOCTOR_PW = await hash('Doctor2026!');

  await prisma.user.create({ data: { email: 'admin@medmap.demo', fullName: 'Жүйе Әкімшісі', role: 'ADMIN', emailVerifiedAt: verified, passwordHash: await hash('Admin2026!') } });

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@medmap.demo', fullName: 'Нұрлан Әбенов', role: 'DOCTOR', emailVerifiedAt: verified, passwordHash: DOCTOR_PW,
      doctorProfile: { create: { specialization: 'Жалпы тәжірибелік дәрігер', licenseNumber: 'DEMO-DOC-0001', clinic: 'MEDMAP Демо Клиникасы', phone: '+7 700 000 00 01', yearsExperience: 12, bio: 'Демонстрациялық дәрігер профилі.' } },
    },
    include: { doctorProfile: true },
  });
  const neuro = await prisma.user.create({
    data: {
      email: 'neuro@medmap.demo', fullName: 'Дина Мұратова', role: 'DOCTOR', emailVerifiedAt: verified, passwordHash: DOCTOR_PW,
      doctorProfile: { create: { specialization: 'Невролог', licenseNumber: 'DEMO-DOC-0002', clinic: 'MEDMAP Демо Клиникасы', yearsExperience: 8 } },
    },
    include: { doctorProfile: true },
  });
  const D1 = doctor.doctorProfile!.id;
  const D2 = neuro.doctorProfile!.id;

  await prisma.user.create({
    data: {
      email: 'pharmacy@medmap.demo', fullName: 'Мадина Қасымова', role: 'PHARMACIST', emailVerifiedAt: verified, passwordHash: await hash('Pharma2026!'),
      pharmacyProfile: { create: { pharmacyName: 'Демо Дәріхана №1', licenseNumber: 'DEMO-PH-0001', address: 'Демо көшесі, 1', phone: '+7 700 000 00 03' } },
    },
  });

  const patientsData = [
    { email: 'patient@medmap.demo', fullName: 'Айгерім Серікова', code: 'MM-DEMO01', dob: '1996-04-12', gender: 'FEMALE', phone: '+7 700 000 00 02', blood: 'A(II)+', h: 166, w: 58.5, allergies: 'Пенициллин тобы (демо дерек)' },
    { email: 'patient2@medmap.demo', fullName: 'Ерлан Төлеуов', code: 'MM-DEMO02', dob: '1988-09-30', gender: 'MALE', phone: '+7 700 000 00 04', blood: 'O(I)+', h: 181, w: 84 },
    { email: 'patient3@medmap.demo', fullName: 'Әсем Жұмабекова', code: 'MM-DEMO03', dob: '2001-02-18', gender: 'FEMALE', phone: '+7 700 000 00 05', blood: 'B(III)+', h: 160, w: 52 },
    { email: 'patient4@medmap.demo', fullName: 'Дәурен Сапаров', code: 'MM-DEMO04', dob: '1979-11-05', gender: 'MALE', phone: '+7 700 000 00 06', blood: 'AB(IV)-', h: 176, w: 90, chronic: 'Артериялық гипертензия (демо дерек)' },
    { email: 'patient5@medmap.demo', fullName: 'Жанар Омарова', code: 'MM-DEMO05', dob: '1992-07-21', gender: 'FEMALE', phone: '+7 700 000 00 07', blood: 'A(II)-', h: 170, w: 63 },
  ] as const;
  const P: { id: number; userId: number; name: string; email: string; phone: string }[] = [];
  for (const p of patientsData) {
    const u = await prisma.user.create({
      data: {
        email: p.email, fullName: p.fullName, role: 'PATIENT', emailVerifiedAt: verified, passwordHash: PATIENT_PW,
        patientProfile: { create: { patientCode: p.code, dateOfBirth: new Date(p.dob), gender: p.gender, phone: p.phone, bloodType: p.blood, heightCm: p.h, weightKg: p.w, allergies: 'allergies' in p ? p.allergies : null, chronicConditions: 'chronic' in p ? p.chronic : null } },
      },
      include: { patientProfile: true },
    });
    P.push({ id: u.patientProfile!.id, userId: u.id, name: u.fullName, email: u.email, phone: p.phone });
  }

  console.log('Consents…');
  // Doctor Әбенов ← patients 1, 3, 4 · Neurologist Мұратова ← patients 2, 4, 5
  for (const [pi, doc, d] of [[0, doctor.id, 14], [2, doctor.id, 9], [3, doctor.id, 6], [1, neuro.id, 6], [3, neuro.id, 5], [4, neuro.id, 3]] as const) {
    await prisma.patientConsent.create({ data: { patientId: P[pi].id, granteeUserId: doc, grantedAt: daysAgo(d) } });
  }

  console.log('Applications…');
  type App = { p: number; area: string; d: number; h?: number; status: ReportStatus; text: string; started: number; duration: string; intensity: number; extra?: string; visited?: string; seen?: boolean };
  const apps: App[] = [
    // 2 completed
    { p: 0, area: 'lower_back', d: 12, status: 'COMPLETED', text: 'Ұзақ отырғаннан кейін белдің төменгі жағында сыздап ауырсыну пайда болады. Таңертең қозғалғанда күшейеді.', started: 20, duration: '2–4 апта', intensity: 6, extra: 'Аяққа таралмайды, ұю сезімі жоқ', seen: true },
    { p: 3, area: 'neck', d: 9, status: 'COMPLETED', text: 'Мойынның артқы жағында қатаю, басты бұрғанда шектелу. Компьютерде ұзақ жұмыс істегенде күшейеді.', started: 12, duration: '1–2 апта', intensity: 5, seen: true },
    // 1 accepted
    { p: 2, area: 'left_knee', d: 6, status: 'ACCEPTED', text: 'Жүгіргеннен кейін сол тізеде ауырсыну, баспалдақпен түскенде күшейеді.', started: 8, duration: '4–7 күн', intensity: 4, extra: 'Жеңіл ісіну байқалады', seen: true },
    // 2 under review
    { p: 0, area: 'right_shoulder', d: 7, status: 'UNDER_REVIEW', text: 'Қолды жоғары көтергенде оң иықта шаншу сезіледі. Спорт залдағы жаттығудан кейін басталды.', started: 9, duration: '1–2 апта', intensity: 4, extra: 'Түнде оң жағымен жатқанда мазалайды', visited: 'Жаттықтырушы жүктемені азайтуға кеңес берді (демо)', seen: true },
    { p: 1, area: 'head', d: 4, status: 'UNDER_REVIEW', text: 'Түстен кейін самай тұсында қайталанатын бас ауруы, жарықта күшейеді.', started: 6, duration: '4–7 күн', intensity: 6, seen: true },
    // 1 rejected (duplicate)
    { p: 4, area: 'right_hand', d: 5, status: 'REJECTED', text: 'Оң қол басының саусақтарында ұю сезімі (қайталанған өтінім, демо).', started: 6, duration: '1–3 күн', intensity: 2, seen: true },
    // 3 new (not yet opened by the admin → "new" badge)
    { p: 0, area: 'head', d: 2, h: 17, status: 'NEW', text: 'Жұмыс күнінің соңында маңдай тұсында қысып ауыратын бас ауруы.', started: 5, duration: '4–7 күн', intensity: 5, extra: 'Экранға ұзақ қарағанда көз шаршайды' },
    { p: 4, area: 'abdomen', d: 1, h: 9, status: 'NEW', text: 'Тамақтан кейін іштің жоғарғы бөлігінде ауырлық және ыңғайсыздық сезімі.', started: 3, duration: '1–3 күн', intensity: 4 },
    { p: 2, area: 'left_foot', d: 0, h: 8, status: 'NEW', text: 'Таңертең алғашқы қадамдарда сол табанның өкшесінде ауырсыну.', started: 4, duration: '4–7 күн', intensity: 3 },
  ];
  const R: number[] = [];
  for (const a of apps) {
    const p = P[a.p];
    const created = daysAgo(a.d, a.h ?? 10);
    const r = await prisma.symptomReport.create({
      data: {
        applicationNo: `TMP-${R.length}`, patientId: p.id, bodyAreaId: area[a.area], contactName: p.name, contactEmail: p.email, contactPhone: p.phone,
        description: a.text, startedAt: daysAgo(a.started), duration: a.duration, intensity: a.intensity, additionalSymptoms: a.extra ?? null,
        visitedDoctor: !!a.visited, visitDetails: a.visited ?? null, status: a.status, statusChangedAt: a.status === 'NEW' ? null : daysAgo(Math.max(0, a.d - 1)),
        adminSeenAt: a.seen ? created : null, createdAt: created,
      },
    });
    await prisma.symptomReport.update({ where: { id: r.id }, data: { applicationNo: appNo(r.id) } });
    R.push(r.id);
  }

  console.log('Doctor records, notes, prescriptions…');
  const rec = await prisma.medicalRecord.create({ data: {
    patientId: P[0].id, doctorId: D1, symptomReportId: R[0], recordType: 'EXAMINATION', createdAt: daysAgo(10),
    title: 'Бел аймағын тексеру (демо)',
    conclusion: 'Демонстрациялық қорытынды: физикалық тексеру кезінде бел бұлшықеттерінің керілуі анықталды. Неврологиялық белгілер байқалмады.',
    recommendations: 'Ұзақ отырғанда әр 45 минут сайын үзіліс жасау, жеңіл созылу жаттығулары, 2 аптадан кейін қайта қаралу.',
  } });
  await prisma.medicalRecord.create({ data: {
    patientId: P[3].id, doctorId: D2, symptomReportId: R[1], recordType: 'CONSULTATION', createdAt: daysAgo(8),
    title: 'Мойын аймағы бойынша кеңес (демо)',
    conclusion: 'Демонстрациялық қорытынды: мойын бұлшықеттерінің статикалық жүктемеден шаршауы. Қызыл жалау белгілері анықталмады.',
    recommendations: 'Жұмыс орнының эргономикасын түзету, күнделікті жеңіл жаттығулар.',
  } });
  await prisma.doctorNote.create({ data: { patientId: P[0].id, doctorId: D1, symptomReportId: R[3], visibility: 'SHARED', createdAt: daysAgo(6), content: 'Иық бойынша өтінім қаралуда. Келесі қабылдауда қозғалыс амплитудасын тексереміз.' } });
  await prisma.doctorNote.create({ data: { patientId: P[0].id, doctorId: D1, visibility: 'PRIVATE', createdAt: daysAgo(6), content: 'Жеке жазба (тек дәрігерге көрінеді): келесі визитте отыру эргономикасын талқылау.' } });
  await prisma.doctorNote.create({ data: { patientId: P[2].id, doctorId: D1, symptomReportId: R[2], visibility: 'SHARED', createdAt: daysAgo(5), content: 'Өтінім қабылданды. Жүгіру жүктемесін уақытша азайтып, 3 күннен кейін жағдайыңызды жазыңыз.' } });
  await prisma.prescription.create({ data: {
    code: 'RX-DEMO-2026', patientId: P[0].id, doctorId: D1, medicationId: med.Ibuprofen, medicalRecordId: rec.id,
    dosage: '200 мг', frequency: 'Күніне 3 рет, тамақтан кейін', durationDays: 5, instructions: 'Демонстрациялық тағайындау. Асқазанда ауырсыну болса, қабылдауды тоқтатып, дәрігерге хабарласу.',
    status: 'ACTIVE', pharmacyAccess: true, issuedAt: daysAgo(10), validUntil: new Date(Date.now() + 20 * 86400000),
  } });
  await prisma.prescription.create({ data: {
    code: 'RX-7KQ2-M9PX', patientId: P[0].id, doctorId: D1, medicationId: med.Cetirizine,
    dosage: '10 мг', frequency: 'Күніне 1 рет, кешке', durationDays: 14, instructions: 'Демонстрациялық тағайындау (пациент дәріханаға әлі рұқсат бермеген).',
    status: 'ACTIVE', pharmacyAccess: false, issuedAt: daysAgo(2), validUntil: new Date(Date.now() + 28 * 86400000),
  } });

  console.log('Notifications…');
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@medmap.demo' } });
  await prisma.notification.createMany({ data: [
    { userId: P[0].userId, title: 'Дәрігер қорытындысы', message: 'Нұрлан Әбенов: «Бел аймағын тексеру (демо)»', type: 'success', link: '/app/history', createdAt: daysAgo(10) },
    { userId: P[0].userId, title: 'Өтінім мәртебесі өзгерді', message: `${appNo(R[3])}: Қаралуда`, type: 'info', link: '/app/applications', createdAt: daysAgo(6) },
    { userId: P[0].userId, title: 'Жаңа тағайындау', message: 'Cetirizine — код RX-7KQ2-M9PX. Дәріханаға көрсету үшін рұқсатты қосыңыз.', type: 'info', link: '/app/prescriptions', createdAt: daysAgo(2) },
    { userId: doctor.id, title: 'Жаңа өтінім', message: `${appNo(R[6])} · Айгерім Серікова: Бас`, type: 'info', link: `/doctor/patients/${P[0].id}`, createdAt: daysAgo(2) },
    ...[6, 7, 8].map((i) => ({ userId: admin.id, title: 'Жаңа өтінім', message: `${appNo(R[i])} · ${P[apps[i].p].name}`, type: 'info', link: `/admin/applications?open=${R[i]}`, createdAt: daysAgo(apps[i].d, apps[i].h ?? 10) })),
  ] });

  await prisma.activityLog.create({ data: { action: 'system.seeded', entityType: 'system', metadata: { synthetic: true } } });
  console.log('✔ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
