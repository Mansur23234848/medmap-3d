import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, Paperclip, Pencil, Stethoscope, Trash2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { BodyArea, MedicalRecord, PatientRecord, SymptomReport } from '@/lib/types';
import { cn, fileSize, fmtDate, intensityTone, RECORD_TYPE, REPORT_STATUS, toInputDate } from '@/lib/utils';
import { Badge, Field } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// ---------- data hooks ----------
export function useBodyAreas() {
  return useQuery({ queryKey: ['body-areas'], queryFn: () => api.get<{ areas: BodyArea[] }>('/body-areas').then((r) => r.areas), staleTime: Infinity });
}

export type DashboardData = PatientRecord & { notifications: import('@/lib/types').Notification[]; activeConsents: number };
export function usePatientRecord() {
  return useQuery({ queryKey: ['patient', 'dashboard'], queryFn: () => api.get<DashboardData>('/patient/dashboard') });
}

// ---------- small display pieces ----------
export function IntensityMeter({ value, className }: { value: number; className?: string }) {
  const tone = intensityTone(value);
  const color = tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-success';
  return (
    <div className={cn('flex items-center gap-2', className)} title={`Қарқындылық: ${value}/10 (пациент бағасы)`}>
      <div className="flex gap-[3px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={cn('h-3 w-1.5 rounded-full', i < value ? color : 'bg-surface-3')} />
        ))}
      </div>
      <span className="text-[12px] font-medium tabular-nums text-muted">{value}/10</span>
    </div>
  );
}

export function AttachmentList({ items, onRemove }: { items: SymptomReport['attachments']; onRemove?: (id: number) => void }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((a) => (
        <span key={a.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface-2 py-1 pr-1 pl-2 text-[12px]">
          {a.mimeType.startsWith('image/') ? <ImageIcon className="h-3.5 w-3.5 text-muted" /> : <FileText className="h-3.5 w-3.5 text-muted" />}
          <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="max-w-[180px] truncate font-medium hover:text-primary">{a.originalName}</a>
          <span className="text-muted">{fileSize(a.sizeBytes)}</span>
          {onRemove && (
            <button onClick={() => onRemove(a.id)} className="grid h-5 w-5 place-items-center rounded text-muted hover:text-danger" aria-label="Файлды өшіру"><X className="h-3 w-3" /></button>
          )}
        </span>
      ))}
    </div>
  );
}

export function ReportCard({ report, records = [], onEdit, onDelete, actions, compact }: {
  report: SymptomReport;
  records?: MedicalRecord[];
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  const st = REPORT_STATUS[report.status];
  const editable = report.status === 'OPEN';
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold">{report.bodyArea.nameKk}</span>
            <Badge tone={st.tone} dot>{st.label}</Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">{fmtDate(report.createdAt, true)}</p>
        </div>
        {(onEdit || onDelete) && editable && (
          <div className="flex shrink-0 gap-1">
            {onEdit && <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Өзгерту"><Pencil className="h-4 w-4" /></button>}
            {onDelete && <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label="Өшіру"><Trash2 className="h-4 w-4" /></button>}
          </div>
        )}
      </div>
      <p className={cn('mt-3 text-[14px] leading-relaxed text-ink-2', compact && 'line-clamp-3')}>{report.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
        <IntensityMeter value={report.intensity} />
        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {fmtDate(report.startedAt)}</span>
        <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {report.duration}</span>
        {report.visitedDoctor && <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" /> Дәрігерге қаралған</span>}
      </div>
      {!compact && report.additionalSymptoms && <p className="mt-3 text-[13px] text-muted"><span className="font-medium text-ink-2">Қосымша белгілер:</span> {report.additionalSymptoms}</p>}
      {!compact && report.visitDetails && <p className="mt-1 text-[13px] text-muted"><span className="font-medium text-ink-2">Қаралу:</span> {report.visitDetails}</p>}
      {!!report.attachments?.length && <div className="mt-3"><AttachmentList items={report.attachments} /></div>}
      {records.length > 0 && (
        <div className="mt-4 space-y-2">
          {records.map((r) => <RecordBlock key={r.id} record={r} />)}
        </div>
      )}
      {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div>}
    </motion.div>
  );
}

export function RecordBlock({ record }: { record: MedicalRecord }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary"><Stethoscope className="h-4 w-4" /> {record.title}</p>
        <Badge tone="primary">{RECORD_TYPE[record.recordType]}</Badge>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{record.conclusion}</p>
      {record.recommendations && <p className="mt-2 text-[13px] text-ink-2"><span className="font-medium">Ұсыныстар:</span> {record.recommendations}</p>}
      <p className="mt-2 text-[11px] text-muted">{record.doctor.user.fullName} · {record.doctor.specialization} · {fmtDate(record.createdAt)} · пациент өзгерте алмайды</p>
    </div>
  );
}

// ---------- symptom form (create / edit) ----------
const DURATIONS = ['Бүгін басталды', '1–3 күн', '4–7 күн', '1–2 апта', '2–4 апта', '1 айдан артық'];

export function SymptomFormModal({ open, onClose, areaSlug, report }: { open: boolean; onClose: () => void; areaSlug: string | null; report?: SymptomReport | null }) {
  const qc = useQueryClient();
  const { data: areas } = useBodyAreas();
  const blank = useMemo(() => ({
    bodyAreaSlug: areaSlug ?? '',
    description: '',
    startedAt: toInputDate(new Date()),
    duration: '',
    intensity: 5,
    additionalSymptoms: '',
    visitedDoctor: false,
    visitDetails: '',
  }), [areaSlug]);
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFiles([]);
    setF(report ? {
      bodyAreaSlug: report.bodyArea.slug,
      description: report.description,
      startedAt: toInputDate(report.startedAt),
      duration: report.duration,
      intensity: report.intensity,
      additionalSymptoms: report.additionalSymptoms ?? '',
      visitedDoctor: report.visitedDoctor,
      visitDetails: report.visitDetails ?? '',
    } : blank);
  }, [open, report, blank]);

  const removeAtt = useMutation({
    mutationFn: (attId: number) => api.del(`/patient/reports/${report!.id}/attachments/${attId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient'] });
      toast.success('Файл өшірілді');
    },
  });

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach((x) => fd.append('files', x));
      return report ? api.put(`/patient/reports/${report.id}`, fd) : api.post('/patient/reports', fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient'] });
      toast.success(report ? 'Жазба жаңартылды' : 'Шағым медициналық картаңызға сақталды');
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields) setErrors(Object.fromEntries(e.fields.map((x) => [x.path, x.message])));
      toast.error(e.message);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.bodyAreaSlug) er.bodyAreaSlug = 'Аймақты таңдаңыз';
    if (f.description.trim().length < 5) er.description = 'Кемінде 5 таңба';
    if (!f.duration.trim()) er.duration = 'Ұзақтығын көрсетіңіз';
    if (!f.startedAt) er.startedAt = 'Күнді көрсетіңіз';
    setErrors(er);
    if (Object.keys(er).length) return;
    save.mutate();
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok = Array.from(list).filter((x) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(x.type)) {
        toast.error(`${x.name}: тек JPG, PNG, WEBP, PDF`);
        return false;
      }
      if (x.size > 5 * 1024 * 1024) {
        toast.error(`${x.name}: 5 МБ-тан аспауы керек`);
        return false;
      }
      return true;
    });
    setFiles((p) => [...p, ...ok].slice(0, 3));
  };

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const tone = intensityTone(f.intensity);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={report ? 'Жазбаны өзгерту' : 'Жаңа шағым'}
      subtitle="Бұл ақпарат диагноз емес — дәрігерге жағдайыңызды түсінуге көмектеседі."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Бас тарту</Button>
          <Button onClick={submit} loading={save.isPending}>{report ? 'Сақтау' : 'Картаға сақтау'}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Дене аймағы" error={errors.bodyAreaSlug}>
          <select className="field" value={f.bodyAreaSlug} onChange={(e) => set('bodyAreaSlug', e.target.value)}>
            <option value="">Таңдаңыз…</option>
            {areas?.map((a) => <option key={a.slug} value={a.slug}>{a.nameKk} · {a.nameEn}</option>)}
          </select>
        </Field>
        <Field label="Басталған күні" error={errors.startedAt}>
          <input className="field" type="date" max={toInputDate(new Date())} value={f.startedAt} onChange={(e) => set('startedAt', e.target.value)} />
        </Field>
        <Field label="Шағымның сипаттамасы" error={errors.description} className="sm:col-span-2">
          <textarea className="field" rows={4} maxLength={3000} placeholder="Не сезінесіз? Қашан күшейеді немесе басылады?" value={f.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Ұзақтығы" error={errors.duration} className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button type="button" key={d} onClick={() => set('duration', d)} className={cn('h-9 rounded-full border px-3.5 text-[13px] font-medium transition', f.duration === d ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink-2 hover:bg-surface-2')}>{d}</button>
            ))}
            <input className="field h-9 w-40 rounded-full" placeholder="Немесе жазыңыз" maxLength={60} value={DURATIONS.includes(f.duration) ? '' : f.duration} onChange={(e) => set('duration', e.target.value)} />
          </div>
        </Field>
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Қарқындылығы (өз бағаңыз)</span>
            <Badge tone={tone}>{f.intensity} / 10</Badge>
          </div>
          <input type="range" min={1} max={10} value={f.intensity} onChange={(e) => set('intensity', Number(e.target.value))} className="w-full accent-[var(--primary)]" />
          <div className="mt-1 flex justify-between text-[11px] text-muted"><span>Жеңіл</span><span>Орташа</span><span>Өте күшті</span></div>
        </div>
        <Field label="Қосымша белгілер" className="sm:col-span-2">
          <textarea className="field min-h-20" rows={2} maxLength={1500} placeholder="Мысалы: ісіну, қызару, ұю сезімі…" value={f.additionalSymptoms} onChange={(e) => set('additionalSymptoms', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <span className="label">Бұрын дәрігерге қаралдыңыз ба?</span>
          <div className="flex gap-2">
            {[false, true].map((v) => (
              <button type="button" key={String(v)} onClick={() => set('visitedDoctor', v)} className={cn('h-10 flex-1 rounded-xl border text-[13px] font-medium transition', f.visitedDoctor === v ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink-2 hover:bg-surface-2')}>
                {v ? 'Иә' : 'Жоқ'}
              </button>
            ))}
          </div>
          {f.visitedDoctor && <textarea className="field mt-2 min-h-20" rows={2} maxLength={1500} placeholder="Қашан, қай маман, не айтылды?" value={f.visitDetails} onChange={(e) => set('visitDetails', e.target.value)} />}
        </div>
        <div className="sm:col-span-2">
          <span className="label">Файл немесе сурет (міндетті емес)</span>
          {report && <div className="mb-2"><AttachmentList items={report.attachments} onRemove={(id) => removeAtt.mutate(id)} /></div>}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line-strong px-4 py-5 text-center transition hover:border-primary hover:bg-primary-soft/40">
            <Upload className="h-5 w-5 text-muted" />
            <span className="text-[13px] font-medium">Файлды таңдаңыз</span>
            <span className="text-[12px] text-muted">JPG, PNG, WEBP, PDF · 5 МБ-қа дейін · 3 файл</span>
            <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((x, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 py-1 pr-1 pl-2 text-[12px]">
                  <Paperclip className="h-3.5 w-3.5 text-muted" /> <span className="max-w-[160px] truncate">{x.name}</span> <span className="text-muted">{fileSize(x.size)}</span>
                  <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="grid h-5 w-5 place-items-center rounded text-muted hover:text-danger"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, text, loading, danger = true, confirmLabel = 'Өшіру' }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; text: string; loading?: boolean; danger?: boolean; confirmLabel?: string }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title} footer={<><Button variant="outline" onClick={onClose}>Бас тарту</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-[14px] text-muted">{text}</p>
    </Modal>
  );
}
