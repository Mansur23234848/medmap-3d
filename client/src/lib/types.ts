export type Role = 'PATIENT' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN';
export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'REVIEWED' | 'CLOSED';
export type RxStatus = 'ACTIVE' | 'DISPENSED' | 'EXPIRED' | 'CANCELLED';
export type RecordType = 'EXAMINATION' | 'CONSULTATION' | 'LAB_RESULT' | 'FOLLOW_UP';

export interface PatientProfile {
  id: number;
  userId: number;
  patientCode: string;
  dateOfBirth: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  phone: string | null;
  bloodType: string | null;
  heightCm: number | null;
  weightKg: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  emergencyContact: string | null;
  age?: number | null;
  user?: { id: number; fullName: string; email: string; createdAt: string };
}

export interface Me {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string | null;
  patientProfile: PatientProfile | null;
  doctorProfile: { id: number; specialization: string; licenseNumber: string; clinic: string | null } | null;
  pharmacyProfile: { id: number; pharmacyName: string; licenseNumber: string; address: string | null } | null;
}

export interface BodyArea {
  id: number;
  slug: string;
  nameEn: string;
  nameKk: string;
  side: 'LEFT' | 'RIGHT' | 'CENTER';
  view: 'FRONT' | 'BACK' | 'BOTH';
  description: string;
}

export interface Attachment {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SymptomReport {
  id: number;
  patientId: number;
  bodyAreaId: number;
  bodyArea: BodyArea;
  description: string;
  startedAt: string;
  duration: string;
  intensity: number;
  additionalSymptoms: string | null;
  visitedDoctor: boolean;
  visitDetails: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  _count?: { medicalRecords: number };
}

export interface DoctorRef {
  id: number;
  specialization: string;
  clinic: string | null;
  user: { fullName: string };
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  symptomReportId: number | null;
  recordType: RecordType;
  title: string;
  conclusion: string;
  recommendations: string | null;
  createdAt: string;
  doctor: DoctorRef;
  symptomReport: { id: number; bodyArea: { slug: string; nameKk: string } } | null;
}

export interface DoctorNote {
  id: number;
  doctorId: number;
  content: string;
  visibility: 'SHARED' | 'PRIVATE';
  symptomReportId: number | null;
  createdAt: string;
  doctor: DoctorRef;
}

export interface Medication {
  id: number;
  name: string;
  activeIngredient: string;
  drugClass: string | null;
  dosageForms: string | null;
  indications: string;
  contraindications: string;
  prescriptionRequired: boolean;
  availabilityNote: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  isActive: boolean;
  myPrescriptions?: number;
  _count?: { prescriptions: number };
}

export interface Prescription {
  id: number;
  code: string;
  medicationId: number;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string | null;
  status: RxStatus;
  pharmacyAccess: boolean;
  issuedAt: string;
  validUntil: string;
  medication: Medication;
  doctor: DoctorRef;
  doctorId: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PatientRecord {
  profile: PatientProfile & { user: { id: number; fullName: string; email: string; createdAt: string } };
  reports: SymptomReport[];
  records: MedicalRecord[];
  notes: DoctorNote[];
  prescriptions: Prescription[];
}
