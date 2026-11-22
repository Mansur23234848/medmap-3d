import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, MessageSquareText, Stethoscope, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader, Skeleton } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import type { SymptomReport } from '@/lib/types';
import { cn, fmtDate } from '@/lib/utils';
import { ConfirmModal, RecordBlock, ReportCard, SymptomFormModal, usePatientRecord } from '../common/shared';

type Filter = 'all' | 'reports' | 'records' | 'notes';

export default function HistoryPage() {
  const { data, isLoading } = usePatientRecord();
  const [filter, setFilter] = useState<Filter>('all');
  const [area, setArea] = useState('');
  const [editing, setEditing] = useState<SymptomReport | null>(null);
  const [deleting, setDeleting] = useState<SymptomReport | null>(null);
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id: number) => api.del(`/patient/reports/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient'] }); toast.success('Жазба өшірілді'); setDeleting(null); },
    onError: (e) => toast.error(e.message),
  });

  const areas = useMemo(() => [...new Map((data?.reports ?? []).map((r) => [r.bodyArea.slug, r.bodyArea.nameKk])).entries()], [data]);

  const items = useMemo(() => {
    if (!data) return [];
    const list: { type: Filter; date: string; key: string; node: React.ReactNode; area?: string }[] = [];
    data.reports.forEach((r) => list.push({
      type: 'reports', date: r.createdAt, key: `r${r.id}`, area: r.bodyArea.slug,
      node: <ReportCard report={r} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />,
    }));
    data.records.forEach((m) => list.push({ type: 'records', date: m.createdAt, key: `m${m.id}`, area: m.symptomReport?.bodyArea.slug, node: <RecordBlock record={m} /> }));
    data.notes.forEach((n) => list.push({
      type: 'notes', date: n.createdAt, key: `n${n.id}`,
      node: (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[14px] leading-relaxed">{n.content}</p>
          <p className="mt-2 text-[12px] text-muted">{n.doctor.user.fullName} · {n.doctor.specialization}</p>
        </div>
      ),
    }));
    return list
      .filter((i) => filter === 'all' || i.type === filter)
      .filter((i) => !area || i.area === area)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [data, filter, area]);

  const ICON = { reports: <ClipboardList className="h-4 w-4" />, records: <Stethoscope className="h-4 w-4" />, notes: <MessageSquareText className="h-4 w-4" />, all: null };
  const TABS: [Filter, string][] = [['all', 'Барлығы'], ['reports', 'Шағымдар'], ['records', 'Қорытындылар'], ['notes', 'Дәрігер жазбалары']];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Медициналық тарих" title="Медициналық тарих" subtitle="Шағымдарыңыз, дәрігер қорытындылары мен жазбалары бір хронологияда" actions={<Link to="/app/body-map"><Button icon={<Plus className="h-4 w-4" />}>Жаңа шағым</Button></Link>} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={cn('h-9 shrink-0 rounded-lg px-3.5 text-[13px] font-medium transition', filter === k ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}>{l}</button>
          ))}
        </div>
        <select className="field h-10 sm:w-56" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Барлық аймақтар</option>
          {areas.map(([s, n]) => <option key={s} value={s}>{n}</option>)}
        </select>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>}
      {!isLoading && items.length === 0 && <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Жазбалар табылмады" text="Сүзгіні өзгертіңіз немесе жаңа шағым қосыңыз." />}

      <div className="relative">
        {items.length > 0 && <div className="absolute top-2 bottom-2 left-[15px] w-px bg-line" />}
        <div className="space-y-5">
          {items.map((i) => (
            <div key={i.key} className="relative flex gap-4">
              <div className={cn('z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-4 border-bg', i.type === 'reports' ? 'bg-danger-soft text-danger' : i.type === 'records' ? 'bg-primary-soft text-primary' : 'bg-accent-soft text-accent')}>{ICON[i.type]}</div>
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[12px] font-medium text-muted">{fmtDate(i.date, true)}</p>
                {i.node}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SymptomFormModal open={!!editing} onClose={() => setEditing(null)} areaSlug={editing?.bodyArea.slug ?? null} report={editing} />
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && del.mutate(deleting.id)} loading={del.isPending} title="Жазбаны өшіру" text="Бұл шағым медициналық картаңыздан біржола өшіріледі." />
    </div>
  );
}
