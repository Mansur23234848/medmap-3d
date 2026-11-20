import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, ClipboardList, Download, FilePlus2, Lock, MessageSquarePlus, Pill, Search, Stethoscope, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge, Card, CardHeader, EmptyState, Field, PageHeader, Skeleton, Stat, stagger } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { AREA_NAMES, isRegionSlug } from '@/components/body3d/areaNames';
import type { RegionSlug } from '@/components/body3d/bodyModel';
import { api, openPdf } from '@/lib/api';
import type { Medication, PatientRecord, ReportStatus, SymptomReport } from '@/lib/types';
import { cn, fmtDate, fmtRelative, GENDER, RECORD_TYPE, REPORT_STATUS, RX_STATUS } from '@/lib/utils';
import { RecordBlock, ReportCard } from '../common/shared';

const BodyScene = lazy(() => import('@/components/body3d/BodyScene'));

interface PatientRow {
  id: number; patientCode: string; fullName: string; email: string; gender: string | null; age: number | null;
  consentSince: string; consentExpires: string | null; openReports: number;
  lastReport: { createdAt: string; bodyArea: { nameKk: string } } | null;
  counts: { symptomReports: number; medicalRecords: number; prescriptions: number };
}

// ======================= Patients list =======================
export function DoctorPatientsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['doctor', 'patients', q], queryFn: () => api.get<{ patients: PatientRow[] }>(`/doctor/patients?q=${encodeURIComponent(q)}`) });
  const all = data?.patients ?? [];
  const open = all.reduce((s, p) => s + p.openReports, 0);

  return (
    <div>
      <PageHeader eyebrow="Doctor panel" title="Пациенттер" subtitle="Тек сізге рұқсат берген пациенттер көрсетіледі." />
      <motion.div variants={stagger.container} initial="hidden" animate="show" className="mb-5 grid gap-4 sm:grid-cols-3">
        <motion.div variants={stagger.item}><Stat label="Рұқсат берген пациенттер" value={all.length} icon={<Users className="h-4 w-4" />} /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Қарауды күтетін шағымдар" value={open} icon={<ClipboardList className="h-4 w-4" />} tone="warning" /></motion.div>
        <motion.div variants={stagger.item}><Stat label="Жазылған қорытындылар" value={all.reduce((s, p) => s + p.counts.medicalRecords, 0)} icon={<Stethoscope className="h-4 w-4" />} tone="success" /></motion.div>
      </motion.div>
      <Card>
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="field pl-10" placeholder="Аты-жөні, пациент коды немесе email бойынша іздеу" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {isLoading && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
        {!isLoading && all.length === 0 && <EmptyState icon={<Lock className="h-5 w-5" />} title={q ? 'Пациент табылмады' : 'Әзірге рұқсат берген пациент жоқ'} text="Пациент өз кабинетінен сізге рұқсат бергенде осы жерде пайда болады." />}
        <div className="divide-y divide-line">
          {all.map((p) => (
            <Link key={p.id} to={`/doctor/patients/${p.id}`} className="flex items-center gap-4 p-4 transition hover:bg-surface-2/60">
              <Avatar name={p.fullName} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold">{p.fullName}</p>
                  <span className="font-mono text-[12px] text-muted">{p.patientCode}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  {[p.age != null ? `${p.age} жас` : null, p.gender ? GENDER[p.gender] : null, `${p.counts.symptomReports} шағым`].filter(Boolean).join(' · ')}
                  {p.lastReport && <> · соңғысы: {p.lastReport.bodyArea.nameKk}, {fmtRelative(p.lastReport.createdAt)}</>}
                </p>
              </div>
              {p.openReports > 0 && <Badge tone="warning" dot>{p.openReports} жаңа</Badge>}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ======================= Patient detail =======================
type DoctorRecord = PatientRecord & { myDoctorId: number };
type Tab = 'reports' | 'records' | 'notes' | 'rx';

export function DoctorPatientPage() {
  const id = Number(useParams().id);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['doctor', 'patient', id], queryFn: () => api.get<DoctorRecord>(`/doctor/patients/${id}`), retry: false });
  const [area, setArea] = useState<RegionSlug | null>(null);
  const [tab, setTab] = useState<Tab>('reports');
  const [recordFor, setRecordFor] = useState<SymptomReport | null | 'none'>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const marked = useMemo(() => [...new Set((data?.reports ?? []).map((r) => r.bodyArea.slug))], [data]);
  const reports = (data?.reports ?? []).filter((r) => !area || r.bodyArea.slug === area);

  const status = useMutation({
    mutationFn: ({ rid, s }: { rid: number; s: ReportStatus }) => api.patch(`/doctor/reports/${rid}/status`, { status: s }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor'] }); toast.success('Мәртебе жаңартылды'); },
    onError: (e) => toast.error(e.message),
  });
  const cancelRx = useMutation({
    mutationFn: (rid: number) => api.patch(`/doctor/prescriptions/${rid}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor'] }); toast.success('Тағайындау тоқтатылды'); },
    onError: (e) => toast.error(e.message),
  });

  if (error) return <Card><EmptyState icon={<Lock className="h-5 w-5" />} title="Қолжетімділік жоқ" text={(error as Error).message} action={<Link to="/doctor"><Button variant="outline">Пациенттер тізіміне</Button></Link>} /></Card>;
  if (isLoading || !data) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-[520px]" /></div>;

  const p = data.profile;
  const pdf = async () => {
    setPdfLoading(true);
    try { await openPdf(`/doctor/patients/${id}/pdf`); } catch (e) { toast.error((e as Error).message); } finally { setPdfLoading(false); }
  };
  const TABS: [Tab, string, number][] = [['reports', 'Шағымдар', data.reports.length], ['records', 'Қорытындылар', data.records.length], ['notes', 'Жазбалар', data.notes.length], ['rx', 'Тағайындаулар', data.prescriptions.length]];

  return (
    <div>
      <Link to="/doctor" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Пациенттер</Link>
      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={p.user.fullName} size={56} />
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">{p.user.fullName}</h1>
              <p className="text-[13px] text-muted">
                <span className="font-mono">{p.patientCode}</span> · {[p.age != null ? `${p.age} жас` : null, p.gender ? GENDER[p.gender] : null, p.bloodType].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.allergies && <Badge tone="danger">Аллергия: {p.allergies}</Badge>}
                {p.chronicConditions && <Badge tone="warning">{p.chronicConditions}</Badge>}
                {p.heightCm && <Badge>{p.heightCm} см · {p.weightKg} кг</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={() => setNoteOpen(true)}>Жазба</Button>
            <Button variant="outline" icon={<Pill className="h-4 w-4" />} onClick={() => setRxOpen(true)}>Тағайындау</Button>
            <Button variant="outline" icon={<FilePlus2 className="h-4 w-4" />} onClick={() => setRecordFor('none')}>Қорытынды</Button>
            <Button icon={<Download className="h-4 w-4" />} loading={pdfLoading} onClick={pdf}>PDF</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader title="3D картадағы аймақтар" subtitle="Аймақты басып, шағымдарды сүзіңіз" />
          <div className="relative h-[460px]">
            <Suspense fallback={<Skeleton className="absolute inset-6" />}>
              <BodyScene marked={marked} selected={area} onSelect={(s) => { setArea((a) => (a === s ? null : s)); setTab('reports'); }} />
            </Suspense>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-line p-4">
            {marked.length === 0 && <p className="text-[13px] text-muted">Белгіленген аймақ жоқ</p>}
            {marked.map((s) => isRegionSlug(s) && (
              <button key={s} onClick={() => setArea(area === s ? null : s)} className={cn('h-8 rounded-full px-3 text-[12px] font-medium transition', area === s ? 'bg-danger text-white' : 'bg-danger-soft text-danger hover:brightness-95')}>
                {AREA_NAMES[s].kk}
              </button>
            ))}
          </div>
        </Card>

        <div>
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
            {TABS.map(([k, l, n]) => (
              <button key={k} onClick={() => setTab(k)} className={cn('flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium transition', tab === k ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}>
                {l} <span className="rounded-full bg-surface-3 px-1.5 text-[11px]">{n}</span>
              </button>
            ))}
          </div>

          {tab === 'reports' && (
            <div className="space-y-3">
              {area && (
                <div className="flex items-center justify-between rounded-xl bg-danger-soft px-4 py-2.5 text-[13px] text-danger">
                  Сүзгі: {AREA_NAMES[area].kk}
                  <button onClick={() => setArea(null)} className="grid h-6 w-6 place-items-center rounded hover:bg-danger/10"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {reports.length === 0 && <Card><EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Шағымдар жоқ" /></Card>}
              {reports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  records={data.records.filter((m) => m.symptomReport?.id === r.id)}
                  actions={
                    <>
                      <select className="field h-9 w-auto text-[13px]" value={r.status} onChange={(e) => status.mutate({ rid: r.id, s: e.target.value as ReportStatus })}>
                        {Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <Button size="sm" icon={<FilePlus2 className="h-4 w-4" />} onClick={() => setRecordFor(r)}>Қорытынды жазу</Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
          {tab === 'records' && (
            <div className="space-y-3">
              {data.records.length === 0 && <Card><EmptyState icon={<Stethoscope className="h-5 w-5" />} title="Қорытындылар жоқ" /></Card>}
              {data.records.map((m) => <RecordBlock key={m.id} record={m} />)}
            </div>
          )}
          {tab === 'notes' && (
            <div className="space-y-3">
              {data.notes.length === 0 && <Card><EmptyState icon={<MessageSquarePlus className="h-5 w-5" />} title="Жазбалар жоқ" /></Card>}
              {data.notes.map((n) => (
                <Card key={n.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-muted">{n.doctor.user.fullName} · {fmtDate(n.createdAt, true)}</p>
                    <Badge tone={n.visibility === 'PRIVATE' ? 'neutral' : 'primary'}>{n.visibility === 'PRIVATE' ? 'Тек дәрігерге' : 'Пациентке көрінеді'}</Badge>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed">{n.content}</p>
                </Card>
              ))}
            </div>
          )}
          {tab === 'rx' && (
            <div className="space-y-3">
              {data.prescriptions.length === 0 && <Card><EmptyState icon={<Pill className="h-5 w-5" />} title="Тағайындаулар жоқ" /></Card>}
              {data.prescriptions.map((rx) => (
                <Card key={rx.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold">{rx.medication.name} <span className="font-normal text-muted">· {rx.medication.activeIngredient}</span></p>
                      <p className="mt-0.5 text-[13px] text-ink-2">{rx.dosage} · {rx.frequency} · {rx.durationDays} күн</p>
                      <p className="mt-1 font-mono text-[12px] text-muted">{rx.code} · {fmtDate(rx.validUntil)} дейін · {rx.pharmacyAccess ? 'дәріханаға ашық' : 'дәріханаға жабық'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={RX_STATUS[rx.status].tone}>{RX_STATUS[rx.status].label}</Badge>
                      {rx.status === 'ACTIVE' && rx.doctorId === data.myDoctorId && <Button size="sm" variant="outline" loading={cancelRx.isPending} onClick={() => cancelRx.mutate(rx.id)}>Тоқтату</Button>}
                    </div>
                  </div>
                  {rx.instructions && <p className="mt-2 text-[13px] text-muted">{rx.instructions}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <RecordModal patientId={id} report={recordFor} reports={data.reports} onClose={() => setRecordFor(null)} />
      <NoteModal patientId={id} open={noteOpen} onClose={() => setNoteOpen(false)} />
      <RxModal patientId={id} open={rxOpen} onClose={() => setRxOpen(false)} records={data.records} />
    </div>
  );
}

function RecordModal({ patientId, report, reports, onClose }: { patientId: number; report: SymptomReport | null | 'none'; reports: SymptomReport[]; onClose: () => void }) {
  const qc = useQueryClient();
  const open = report !== null;
  const [f, setF] = useState({ symptomReportId: '', recordType: 'EXAMINATION', title: '', conclusion: '', recommendations: '' });
  const [lastFor, setLastFor] = useState<unknown>(null);
  if (open && lastFor !== report) {
    setLastFor(report);
    setF({ symptomReportId: report && report !== 'none' ? String(report.id) : '', recordType: 'EXAMINATION', title: report && report !== 'none' ? `${report.bodyArea.nameKk}: тексеру` : '', conclusion: '', recommendations: '' });
  }
  const save = useMutation({
    mutationFn: () => api.post(`/doctor/patients/${patientId}/records`, { ...f, symptomReportId: f.symptomReportId ? Number(f.symptomReportId) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor'] }); toast.success('Қорытынды сақталды, пациентке хабарланды'); setLastFor(null); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={() => { setLastFor(null); onClose(); }} size="lg" title="Тексеру қорытындысы" subtitle="Сақталғаннан кейін пациент бұл қорытындыны өзгерте алмайды." footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button loading={save.isPending} disabled={f.title.length < 3 || f.conclusion.length < 5} onClick={() => save.mutate()}>Сақтау</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Байланысты шағым"><select className="field" value={f.symptomReportId} onChange={set('symptomReportId')}><option value="">— жалпы —</option>{reports.map((r) => <option key={r.id} value={r.id}>{r.bodyArea.nameKk} · {fmtDate(r.createdAt)}</option>)}</select></Field>
        <Field label="Түрі"><select className="field" value={f.recordType} onChange={set('recordType')}>{Object.entries(RECORD_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Тақырыбы" className="sm:col-span-2"><input className="field" value={f.title} onChange={set('title')} maxLength={200} /></Field>
        <Field label="Қорытынды" className="sm:col-span-2"><textarea className="field min-h-32" value={f.conclusion} onChange={set('conclusion')} maxLength={5000} /></Field>
        <Field label="Ұсыныстар" className="sm:col-span-2"><textarea className="field" value={f.recommendations} onChange={set('recommendations')} maxLength={3000} /></Field>
      </div>
    </Modal>
  );
}

function NoteModal({ patientId, open, onClose }: { patientId: number; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'SHARED' | 'PRIVATE'>('SHARED');
  const save = useMutation({
    mutationFn: () => api.post(`/doctor/patients/${patientId}/notes`, { content, visibility }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor'] }); toast.success('Жазба сақталды'); setContent(''); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Modal open={open} onClose={onClose} title="Дәрігер жазбасы" footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button loading={save.isPending} disabled={content.trim().length < 2} onClick={() => save.mutate()}>Сақтау</Button></>}>
      <textarea className="field min-h-32" value={content} onChange={(e) => setContent(e.target.value)} maxLength={3000} placeholder="Жазба мәтіні…" />
      <div className="mt-3 flex gap-2">
        {([['SHARED', 'Пациентке көрінеді'], ['PRIVATE', 'Тек маған']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setVisibility(k)} className={cn('h-10 flex-1 rounded-xl border text-[13px] font-medium transition', visibility === k ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink-2')}>{l}</button>
        ))}
      </div>
    </Modal>
  );
}

function RxModal({ patientId, open, onClose, records }: { patientId: number; open: boolean; onClose: () => void; records: PatientRecord['records'] }) {
  const qc = useQueryClient();
  const { data: meds } = useQuery({ queryKey: ['medications', ''], queryFn: () => api.get<{ medications: Medication[] }>('/medications?q='), enabled: open });
  const [f, setF] = useState({ medicationId: '', medicalRecordId: '', dosage: '', frequency: '', durationDays: '7', instructions: '', validDays: '30' });
  const med = meds?.medications.find((m) => String(m.id) === f.medicationId);
  const save = useMutation({
    mutationFn: () => api.post<{ prescription: { code: string } }>(`/doctor/patients/${patientId}/prescriptions`, { ...f, medicationId: Number(f.medicationId), medicalRecordId: f.medicalRecordId ? Number(f.medicalRecordId) : null }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['doctor'] }); toast.success(`Тағайындау жасалды · ${r.prescription.code}`); setF({ medicationId: '', medicalRecordId: '', dosage: '', frequency: '', durationDays: '7', instructions: '', validDays: '30' }); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Жаңа тағайындау" subtitle="Тек анықтамалықтағы тексерілген дәрілерден таңдалады. Пациент дәріханаға көрсетуді өзі қосады." footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button loading={save.isPending} disabled={!f.medicationId || !f.dosage || !f.frequency} onClick={() => save.mutate()}>Тағайындау</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Дәрі" className="sm:col-span-2"><select className="field" value={f.medicationId} onChange={set('medicationId')}><option value="">Таңдаңыз…</option>{meds?.medications.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.activeIngredient}) · {m.prescriptionRequired ? 'Rx' : 'OTC'}</option>)}</select></Field>
        {med && <p className="sm:col-span-2 whitespace-pre-line rounded-xl bg-danger-soft/60 p-3 text-[12px] text-ink-2"><span className="font-semibold text-danger">Сақтық (дереккөз: {med.sourceName}):</span>{'\n'}{med.contraindications}</p>}
        <Field label="Дозасы"><input className="field" value={f.dosage} onChange={set('dosage')} placeholder="мыс. 200 мг" maxLength={120} /></Field>
        <Field label="Жиілігі"><input className="field" value={f.frequency} onChange={set('frequency')} placeholder="мыс. күніне 2 рет" maxLength={120} /></Field>
        <Field label="Ұзақтығы (күн)"><input className="field" type="number" min={1} max={365} value={f.durationDays} onChange={set('durationDays')} /></Field>
        <Field label="Жарамдылық мерзімі"><select className="field" value={f.validDays} onChange={set('validDays')}><option value="7">7 күн</option><option value="14">14 күн</option><option value="30">30 күн</option><option value="60">60 күн</option></select></Field>
        <Field label="Байланысты қорытынды" className="sm:col-span-2"><select className="field" value={f.medicalRecordId} onChange={set('medicalRecordId')}><option value="">—</option>{records.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></Field>
        <Field label="Нұсқаулар" className="sm:col-span-2"><textarea className="field" value={f.instructions} onChange={set('instructions')} maxLength={2000} /></Field>
      </div>
    </Modal>
  );
}
