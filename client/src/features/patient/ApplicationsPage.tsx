import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Inbox, MessageSquareText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, PageHeader, Skeleton, stagger } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import type { ReportStatus, SymptomReport } from '@/lib/types';
import { cn, fmtDate, REPORT_STATUS } from '@/lib/utils';
import { ConfirmModal, ReportCard, SymptomFormModal, usePatientRecord } from '../common/shared';

const ORDER: ReportStatus[] = ['NEW', 'UNDER_REVIEW', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

/** "Менің өтінімдерім": every application the patient sent, with its live status and the doctor's replies. */
export default function ApplicationsPage() {
  const { data, isLoading } = usePatientRecord();
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [editing, setEditing] = useState<SymptomReport | null>(null);
  const [deleting, setDeleting] = useState<SymptomReport | null>(null);
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id: number) => api.del(`/patient/reports/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient'] }); toast.success('Өтінім өшірілді'); setDeleting(null); },
    onError: (e) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const m: Partial<Record<ReportStatus, number>> = {};
    data?.reports.forEach((r) => (m[r.status] = (m[r.status] ?? 0) + 1));
    return m;
  }, [data]);
  const list = (data?.reports ?? []).filter((r) => !status || r.status === status);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Өтінімдер"
        title="Менің өтінімдерім"
        subtitle="Жіберген өтінімдеріңіз, олардың мәртебесі және дәрігер жауаптары"
        actions={<Link to="/app/body-map"><Button icon={<Plus className="h-4 w-4" />}>Жаңа өтінім</Button></Link>}
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ORDER.map((s) => (
          <motion.button
            key={s}
            variants={stagger.item}
            onClick={() => setStatus(status === s ? '' : s)}
            className={cn('card p-4 text-left transition hover:border-line-strong', status === s && 'border-primary ring-4 ring-primary-soft')}
          >
            <p className="text-[12px] text-muted">{REPORT_STATUS[s].label}</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums">{counts[s] ?? 0}</p>
          </motion.button>
        ))}
      </motion.div>

      {isLoading && <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>}
      {!isLoading && list.length === 0 && (
        <Card>
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title={status ? 'Бұл мәртебеде өтінім жоқ' : 'Әзірге өтінім жібермегенсіз'}
            text="3D дене картасынан аймақты таңдап, шағымыңызды жіберіңіз."
            action={<Link to="/app/body-map"><Button variant="outline">3D картаны ашу</Button></Link>}
          />
        </Card>
      )}

      <div className="space-y-4">
        {list.map((r) => {
          const notes = data?.notes.filter((n) => n.symptomReportId === r.id) ?? [];
          return (
            <div key={r.id}>
              <ReportCard
                report={r}
                records={data?.records.filter((m) => m.symptomReport?.id === r.id)}
                onEdit={() => setEditing(r)}
                onDelete={() => setDeleting(r)}
                actions={
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
                    <span>Байланыс: {r.contactName} · {r.contactEmail}{r.contactPhone ? ` · ${r.contactPhone}` : ''}</span>
                    {r.statusChangedAt && <span>Мәртебе жаңартылды: {fmtDate(r.statusChangedAt, true)}</span>}
                  </div>
                }
              />
              {notes.map((n) => (
                <div key={n.id} className="mt-2 ml-4 rounded-xl border border-line bg-surface p-3.5">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-accent"><MessageSquareText className="h-3.5 w-3.5" /> Дәрігер жазбасы</p>
                  <p className="mt-1 text-[13px] leading-relaxed">{n.content}</p>
                  <p className="mt-1 text-[11px] text-muted">{n.doctor.user.fullName} · {fmtDate(n.createdAt, true)}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <SymptomFormModal open={!!editing} onClose={() => setEditing(null)} areaSlug={editing?.bodyArea.slug ?? null} report={editing} />
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && del.mutate(deleting.id)} loading={del.isPending} title="Өтінімді өшіру" text={`${deleting?.applicationNo ?? ''} өтінімі біржола өшіріледі. Тек «Жаңа өтінім» мәртебесіндегі өтінімді өшіруге болады.`} />
    </div>
  );
}
