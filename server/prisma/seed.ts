/**
 * MEDMAP 3D demo seed. ALL people and medical data below are fictional / synthetic.
 * Re-running the seed wipes and recreates demo data.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BODY_AREAS } from '../src/data/bodyAreas.js';
import { MEDICATIONS } from '../src/data/medications.js';

const prisma = new PrismaClient();
const daysAgo = (d: number, h = 10) => {
  const t = new Date(Date.now() - d * 86400000);
  t.setHours(h, 15, 0, 0);
  return t;
};

async function main() {
  console.log('Clearing demo data…');
  await prisma.$transaction([
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

  console.log('Body areas…');
  await prisma.bodyArea.createMany({ data: BODY_AREAS.map((a, i) => ({ ...a, sortOrder: i })) });
  const area = Object.fromEntries((await prisma.bodyArea.findMany()).map((a) => [a.slug, a.id]));

  console.log('Medications (NHS-sourced)…');
  await prisma.medication.createMany({ data: MEDICATIONS });
  const med = Object.fromEntries((await prisma.medication.findMany()).map((m) => [m.name, m.id]));

  console.log('Users…');
  const hash = (p: string) => bcrypt.hash(p, 12);

  await prisma.user.create({ data: { email: 'admin@medmap.demo', fullName: 'Жүйе Әкімшісі', role: 'ADMIN', passwordHash: await hash('Admin2026!') } });

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@medmap.demo', fullName: 'Нұрлан Әбенов', role: 'DOCTOR', passwordHash: await hash('Doctor2026!'),
      doctorProfile: { create: { specialization: 'Жалпы тәжірибелік дәрігер', licenseNumber: 'DEMO-DOC-0001', clinic: 'MEDMAP Демо Клиникасы', phone: '+7 700 000 00 01', yearsExperience: 12, bio: 'Демонстрациялық дәрігер профилі.' } },
    },
    include: { doctorProfile: true },
  });
  const doctor2 = await prisma.user.create({
    data: {
      email: 'neuro@medmap.demo', fullName: 'Дина Мұратова', role: 'DOCTOR', passwordHash: await hash('Doctor2026!'),
      doctorProfile: { create: { specialization: 'Невролог', licenseNumber: 'DEMO-DOC-0002', clinic: 'MEDMAP Демо Клиникасы', yearsExperience: 8 } },
    },
    include: { doctorProfile: true },
  });

  await prisma.user.create({
    data: {
      email: 'pharmacy@medmap.demo', fullName: 'Мадина Қасымова', role: 'PHARMACIST', passwordHash: await hash('Pharma2026!'),
      pharmacyProfile: { create: { pharmacyName: 'Демо Дәріхана №1', licenseNumber: 'DEMO-PH-0001', address: 'Демо көшесі, 1', phone: '+7 700 000 00 03' } },
    },
  });

  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@medmap.demo', fullName: 'Айгерім Серікова', role: 'PATIENT', passwordHash: await hash('Patient2026!'),
      patientProfile: { create: { patientCode: 'MM-DEMO01', dateOfBirth: new Date('1996-04-12'), gender: 'FEMALE', phone: '+7 700 000 00 02', bloodType: 'A(II)+', heightCm: 166, weightKg: 58.5, allergies: 'Пенициллин тобы (демо дерек)', chronicConditions: null, emergencyContact: 'Демо байланыс: +7 700 000 00 09' } },
    },
    include: { patientProfile: true },
  });
  const p = patientUser.patientProfile!;

  const patient2 = await prisma.user.create({
    data: {
      email: 'patient2@medmap.demo', fullName: 'Ерлан Төлеуов', role: 'PATIENT', passwordHash: await hash('Patient2026!'),
      patientProfile: { create: { patientCode: 'MM-DEMO02', dateOfBirth: new Date('1988-09-30'), gender: 'MALE', bloodType: 'O(I)+', heightCm: 181, weightKg: 84 } },
    },
    include: { patientProfile: true },
  });
  const p2 = patient2.patientProfile!;

  console.log('Consents…');
  await prisma.patientConsent.create({ data: { patientId: p.id, granteeUserId: doctor.id, grantedAt: daysAgo(14), note: 'Жалпы тексеру үшін' } });
  await prisma.patientConsent.create({ data: { patientId: p2.id, granteeUserId: doctor2.id, grantedAt: daysAgo(6) } });

  console.log('Symptom reports…');
  const back = await prisma.symptomReport.create({ data: {
    patientId: p.id, bodyAreaId: area.lower_back, createdAt: daysAgo(12),
    description: 'Ұзақ отырғаннан кейін белдің төменгі жағында сыздап ауырсыну пайда болады. Таңертең қозғалғанда күшейеді.',
    startedAt: daysAgo(20), duration: '3 апта', intensity: 6, additionalSymptoms: 'Аяққа таралмайды, ұю сезімі жоқ',
    visitedDoctor: false, status: 'REVIEWED',
  } });
  const shoulder = await prisma.symptomReport.create({ data: {
    patientId: p.id, bodyAreaId: area.right_shoulder, createdAt: daysAgo(7),
    description: 'Қолды жоғары көтергенде оң иықта шаншу сезіледі. Спорт залдағы жаттығудан кейін басталды.',
    startedAt: daysAgo(9), duration: '9 күн', intensity: 4, additionalSymptoms: 'Түнде оң жағымен жатқанда мазалайды',
    visitedDoctor: true, visitDetails: 'Жаттықтырушы жүктемені азайтуға кеңес берді (демо)', status: 'UNDER_REVIEW',
  } });
  await prisma.symptomReport.create({ data: {
    patientId: p.id, bodyAreaId: area.head, createdAt: daysAgo(3),
    description: 'Жұмыс күнінің соңында маңдай тұсында қысып ауыратын бас ауруы.',
    startedAt: daysAgo(5), duration: '5 күн, кешке қарай', intensity: 5, additionalSymptoms: 'Экранға ұзақ қарағанда көз шаршайды',
    visitedDoctor: false, status: 'OPEN',
  } });
  await prisma.symptomReport.create({ data: {
    patientId: p.id, bodyAreaId: area.left_knee, createdAt: daysAgo(1),
    description: 'Баспалдақпен түскенде сол тізеде жеңіл ыңғайсыздық.',
    startedAt: daysAgo(2), duration: '2 күн', intensity: 3, visitedDoctor: false, status: 'OPEN',
  } });
  // patient 2 (visible only to the neurologist — demonstrates access isolation)
  await prisma.symptomReport.create({ data: {
    patientId: p2.id, bodyAreaId: area.neck, createdAt: daysAgo(4),
    description: 'Мойынның артқы жағында қатаю, басты бұрғанда шектелу.', startedAt: daysAgo(6), duration: '6 күн', intensity: 5, visitedDoctor: false, status: 'OPEN',
  } });

  console.log('Doctor records, notes, prescriptions…');
  const rec = await prisma.medicalRecord.create({ data: {
    patientId: p.id, doctorId: doctor.doctorProfile!.id, symptomReportId: back.id, recordType: 'EXAMINATION', createdAt: daysAgo(10),
    title: 'Бел аймағын тексеру (демо)',
    conclusion: 'Демонстрациялық қорытынды: физикалық тексеру кезінде бел бұлшықеттерінің керілуі анықталды. Неврологиялық белгілер байқалмады.',
    recommendations: 'Ұзақ отырғанда әр 45 минут сайын үзіліс жасау, жеңіл созылу жаттығулары, 2 аптадан кейін қайта қаралу.',
  } });
  await prisma.doctorNote.create({ data: {
    patientId: p.id, doctorId: doctor.doctorProfile!.id, symptomReportId: shoulder.id, visibility: 'SHARED', createdAt: daysAgo(6),
    content: 'Иық бойынша шағым қаралуда. Келесі қабылдауда қозғалыс амплитудасын тексереміз.',
  } });
  await prisma.doctorNote.create({ data: {
    patientId: p.id, doctorId: doctor.doctorProfile!.id, visibility: 'PRIVATE', createdAt: daysAgo(6),
    content: 'Жеке жазба (тек дәрігерге көрінеді): келесі визитте отыру эргономикасын талқылау.',
  } });
  await prisma.prescription.create({ data: {
    code: 'RX-DEMO-2026', patientId: p.id, doctorId: doctor.doctorProfile!.id, medicationId: med.Ibuprofen, medicalRecordId: rec.id,
    dosage: '200 мг', frequency: 'Күніне 3 рет, тамақтан кейін', durationDays: 5, instructions: 'Демонстрациялық тағайындау. Асқазанда ауырсыну болса, қабылдауды тоқтатып, дәрігерге хабарласу.',
    status: 'ACTIVE', pharmacyAccess: true, issuedAt: daysAgo(10), validUntil: new Date(Date.now() + 20 * 86400000),
  } });
  await prisma.prescription.create({ data: {
    code: 'RX-7KQ2-M9PX', patientId: p.id, doctorId: doctor.doctorProfile!.id, medicationId: med.Cetirizine,
    dosage: '10 мг', frequency: 'Күніне 1 рет, кешке', durationDays: 14, instructions: 'Демонстрациялық тағайындау (пациент дәріханаға әлі рұқсат бермеген).',
    status: 'ACTIVE', pharmacyAccess: false, issuedAt: daysAgo(2), validUntil: new Date(Date.now() + 28 * 86400000),
  } });

  console.log('Notifications…');
  await prisma.notification.createMany({ data: [
    { userId: patientUser.id, title: 'Дәрігер қорытындысы', message: 'Нұрлан Әбенов: «Бел аймағын тексеру (демо)»', type: 'success', link: '/app/history', createdAt: daysAgo(10) },
    { userId: patientUser.id, title: 'Жаңа тағайындау', message: 'Cetirizine — код RX-7KQ2-M9PX. Дәріханаға көрсету үшін рұқсатты қосыңыз.', type: 'info', link: '/app/prescriptions', createdAt: daysAgo(2) },
    { userId: doctor.id, title: 'Жаңа шағым', message: 'Айгерім Серікова: Сол тізе аймағы бойынша жаңа жазба', type: 'info', link: `/doctor/patients/${p.id}`, createdAt: daysAgo(1) },
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
