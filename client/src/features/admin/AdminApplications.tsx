import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarDays, Clock3, Inbox, Mail, Phone, Search, Stethoscope, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { ReportStatus } from '@/lib/types';
import { cn, fmtDate, fmtRelative, RECORD_TYPE, REPORT_STATUS } from '@/lib/utils';
import { AttachmentList, ConfirmModal, IntensityMeter } from '../common/shared';

const STATUSES = Object.keys(REPORT_STATUS) as ReportStatus[];

interface AppRow {
  id: number; applicationNo: string; status: ReportStatus; contactName: string; contactEmail: string; contactPhone: string | null;
  description: string; createdAt: string; adminSeenAt: string | null; intensity: number;
  bodyArea: { slug: string; nameKk: string };
  patient: { id: number; patientCode: string; user: { fullName: string; email: string } };
  _count: { attachments: number; medicalRecords: number; doctorNotes: number };
}
interface AppDetail extends AppRow {
  startedAt: string; duration: string; additionalSymptoms: string | null; visitedDoctor: boolean; visitDetails: string | null; statusChangedAt: string | null;
  bodyArea: AppRow['bodyArea'] & { description: string };
  attachments: { id: number; originalName: string; mimeType: string; sizeBytes: number }[];
  medicalRecords: { id: number; title: string; conclusion: string; recommendations: string | null; recordType: keyof typeof RECORD_TYPE; createdAt: string; doctor: { specialization: string; user: { fullName: string } } }[];
  doctorNotes: { id: number; content: string; createdAt: string; doctor: { specialization: string; user: { fullName: string } } }[];
}

export function useUnseenApplications(enabled: boolean) {
  return useQuery({ queryKey: ['admin', 'applications', 'unseen'], queryFn: () => api.get<{ count: number }>('/admin/applications/unseen-count'), enabled, refetchInterval: 20_000 });
}

export default function AdminApplications() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const openId = Number(params.get('open')) || null;
  const [del, setDel] = useState<AppRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'applications', q, status, sort, page],
    queryFn: () => api.get<{ items: AppRow[]; total: number; pages: number; byStatus: Partial<Record<ReportStatus, number>>; unseen: number }>(`/admin/applications?q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&page=${page}`),
    refetchInterval: 20_000,
  });
  useEffect(() => setPage(1), [q, status, sort]);

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/admin/applications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Өтінім өшірілді'); setDel(null); setParams({}); },
    onError: (e) => toast.error(e.message),
  });

  const all = Object.values(data?.byStatus ?? {}).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Өтінімдерді басқару"
        title="Өтінімдер"
        subtitle={data ? `Барлығы ${all} өтінім${data.unseen ? ` · ${data.unseen} жаңа (ашылмаған)` : ''}` : 'Пациенттер жіберген барлық өтінімдер'}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
            <button onClick={() => setStatus('')} className={cn('h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium', status === '' ? 'bg-surface shadow-card' : 'text-muted hover:text-ink')}>Барлығы <span className="text-muted">{all}</span></button>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium', status === s ? 'bg-surface shadow-card' : 'text-muted hover:text-ink')}>
                {REPORT_STATUS[s].label} <span className="text-muted">{data?.byStatus[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 xl:w-72"><Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" /><input className="field h-10 pl-9" placeholder="Нөмір, аты-жөні, email, аймақ…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Button variant="outline" size="md" className="h-10" icon={sort === 'newest' ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpWideNarrow className="h-4 w-4" />} onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}>
              {sort === 'newest' ? 'Жаңалары алдымен' : 'Ескілері алдымен'}
            </Button>
          </div>
        </div>
        {isLoading && <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>}
        {!isLoading && !data?.items.length && <EmptyState icon={<Inbox className="h-5 w-5" />} title="Өтінімдер табылмады" text="Іздеу немесе сүзгі шартын өзгертіңіз." />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                <th className="px-4 py-3 font-medium">Нөмірі</th><th className="px-4 py-3 font-medium">Пациент</th><th className="px-4 py-3 font-medium">Аймақ</th>
                <th className="px-4 py-3 font-medium">Шағым</th><th className="px-4 py-3 font-medium">Жіберілген күні</th><th className="px-4 py-3 font-medium">Мәртебе</th><th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.items.map((a) => (
                <tr key={a.id} onClick={() => setParams({ open: String(a.id) })} className={cn('cursor-pointer transition hover:bg-surface-2/50', !a.adminSeenAt && 'bg-primary-soft/40')}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-2 font-mono font-medium">
                      {!a.adminSeenAt && <span className="h-2 w-2 rounded-full bg-primary" title="Жаңа, ашылмаған" />}
                      {a.applicationNo}
                    </span>
                  </td>
                  <td className="px-4 py-3"><p className="font-medium">{a.contactName}</p><p className="text-[12px] text-muted">{a.contactEmail}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.bodyArea.nameKk}</td>
                  <td className="max-w-xs px-4 py-3"><p className="truncate text-muted">{a.description}</p></td>
                  <td className="px-4 py-3 text-[12px] whitespace-nowrap text-muted">{fmtDate(a.createdAt, true)}</td>
                  <td className="px-4 py-3"><Badge tone={REPORT_STATUS[a.status].tone} dot>{REPORT_STATUS[a.status].label}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setDel(a); }} title="Өшіру" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[13px]">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Алдыңғы</Button>
            <span className="text-muted">{page} / {data.pages}</span>
            <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Келесі</Button>
          </div>
        )}
      </Card>

      <ApplicationModal id={openId} onClose={() => setParams({})} onDelete={(a) => setDel(a)} />
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del.id)} loading={remove.isPending} title="Өтінімді өшіру" text={`${del?.applicationNo ?? ''} өтінімі және оған тіркелген файлдар біржола өшіріледі.`} />
    </div>
  );
}

function ApplicationModal({ id, onClose, onDelete }: { id: number | null; onClose: () => void; onDelete: (a: AppRow) => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'application', id], queryFn: () => api.get<{ application: AppDetail }>(`/admin/applications/${id}`), enabled: !!id });
  const a = data?.application;
  useEffect(() => {
    if (a) qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
  }, [a?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const setStatus = useMutation({
    mutationFn: (s: ReportStatus) => api.patch(`/admin/applications/${id}/status`, { status: s }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Мәртебе өзгертілді, пациентке хабарланды'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal
      open={!!id}
      onClose={onClose}
      size="lg"
      title={a ? `Өтінім ${a.applicationNo}` : 'Өтінім'}
      subtitle={a ? `${fmtDate(a.createdAt, true)} жіберілді · ${fmtRelative(a.createdAt)}` : undefined}
      footer={a && (
        <>
          <Button variant="outline" icon={<Trash2 className="h-4 w-4" />} className="text-danger" onClick={() => onDelete(a)}>Өшіру</Button>
          <Button onClick={onClose}>Жабу</Button>
        </>
      )}
    >
      {isLoading || !a ? <Skeleton className="h-72" /> : (
        <div className="space-y-5">
          <div>
            <p className="label">Мәртебесі</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={setStatus.isPending}
                  onClick={() => s !== a.status && setStatus.mutate(s)}
                  className={cn('h-9 rounded-full border px-3.5 text-[13px] font-medium transition disabled:opacity-60', a.status === s ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong text-ink-2 hover:bg-surface-2')}
                >
                  {REPORT_STATUS[s].label}
                </button>
              ))}
            </div>
            {a.statusChangedAt && <p className="mt-1.5 text-[12px] text-muted">Соңғы өзгеріс: {fmtDate(a.statusChangedAt, true)}</p>}
          </div>

          <div className="grid gap-3 rounded-2xl border border-line p-4 text-[13px] sm:grid-cols-2">
            <p className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted" /> <span className="font-medium">{a.contactName}</span> <span className="font-mono text-[11px] text-muted">{a.patient.patientCode}</span></p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted" /> {a.contactEmail}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /> {a.contactPhone || '—'}</p>
            <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-danger" /> <span className="font-medium">{a.bodyArea.nameKk}</span></p>
          </div>

          <div>
            <p className="label">Шағым сипаттамасы</p>
            <p className="text-[14px] leading-relaxed">{a.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
              <IntensityMeter value={a.intensity} />
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Басталуы: {fmtDate(a.startedAt)}</span>
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {a.duration}</span>
            </div>
            {a.additionalSymptoms && <p className="mt-3 text-[13px] text-muted"><span className="font-medium text-ink-2">Қосымша ақпарат:</span> {a.additionalSymptoms}</p>}
            <p className="mt-1 text-[13px] text-muted"><span className="font-medium text-ink-2">Дәрігерге бұрын қаралған:</span> {a.visitedDoctor ? `Иә${a.visitDetails ? ` — ${a.visitDetails}` : ''}` : 'Жоқ'}</p>
            {a.attachments.length > 0 && <div className="mt-3"><AttachmentList items={a.attachments} /></div>}
          </div>

          <div>
            <p className="label">Дәрігер жауаптары</p>
            {a.medicalRecords.length === 0 && a.doctorNotes.length === 0 && <p className="rounded-xl bg-surface-2 px-4 py-4 text-center text-[13px] text-muted">Дәрігер жауабы әлі жоқ</p>}
            <div className="space-y-2">
              {a.medicalRecords.map((m) => (
                <div key={m.id} className="rounded-xl border border-primary/20 bg-primary-soft/50 p-3.5">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary"><Stethoscope className="h-4 w-4" /> {m.title} <Badge tone="primary">{RECORD_TYPE[m.recordType]}</Badge></p>
                  <p className="mt-1.5 text-[13px] text-ink-2">{m.conclusion}</p>
                  <p className="mt-1.5 text-[11px] text-muted">{m.doctor.user.fullName} · {fmtDate(m.createdAt)}</p>
                </div>
              ))}
              {a.doctorNotes.map((n) => (
                <div key={n.id} className="rounded-xl border border-line p-3.5 text-[13px]">
                  {n.content}
                  <p className="mt-1 text-[11px] text-muted">{n.doctor.user.fullName} · {fmtDate(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
